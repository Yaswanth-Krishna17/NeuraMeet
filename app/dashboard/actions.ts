'use server';

import { currentUser, clerkClient } from '@clerk/nextjs/server';
import { 
  createOrUpdateClerkUser, 
  getUserByClerkId, 
  getUserByUsername, 
  createMeeting as createMeetingDb, 
  getMeeting as getMeetingDb, 
  getUserMeetings as getUserMeetingsDb,
  deleteMeeting,
  updateMeetingInvitees,
  updateMeetingStatus,
  updateUserSettings, 
  getUserInvitations, 
  updateInvitationStatus, 
  getUserNotifications, 
  markNotificationRead, 
  clearAllNotifications, 
  deleteNotification, 
  createInvitation, 
  createNotification,
  User as UserDb,
  Meeting as MeetingDb,
  Invitation as InvitationDb,
  Notification as NotificationDb
} from '@/lib/db.js';

/**
 * Syncs the currently logged-in Clerk user with our MongoDB User collection
 */
export async function syncUserAction() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return { success: false, error: 'Not authenticated' };
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress || '';
  // Force a default username if one is not configured in Clerk settings
  const username = clerkUser.username || email.split('@')[0] || '';
  const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || username;
  const profileImage = clerkUser.imageUrl || '';

  try {
    const synced = await createOrUpdateClerkUser({
      clerkId: clerkUser.id,
      username,
      fullName,
      email,
      profileImage
    }) as any;
    // Serialize mongoose document to plain object
    return { success: true, user: JSON.parse(JSON.stringify(synced)) };
  } catch (err: any) {
    console.error('Failed to sync Clerk user:', err);
    return { success: false, error: err?.message || 'Database sync failure' };
  }
}

/**
 * Checks if a specific username exists in our local database
 */
export async function checkUsernameExistsAction(username: string) {
  try {
    const user = await getUserByUsername(username) as any;
    return { exists: !!user, username: user?.username || null };
  } catch (err) {
    console.error('Check username error:', err);
    return { exists: false, username: null };
  }
}

/**
 * Schedules a new Linkless Meeting in MongoDB
 */
export async function createMeetingAction(
  title: string,
  invitees: string[],
  scheduledAt?: string,
  description?: string,
  waitingRoomEnabled?: boolean
) {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return { success: false, error: 'Not authenticated' };
  }

  // Get host username
  const email = clerkUser.emailAddresses[0]?.emailAddress || '';
  const host = (clerkUser.username || email.split('@')[0] || '').toLowerCase().trim();

  // Filter invitees
  const cleanInvitees = (invitees || [])
    .map(i => i.trim().toLowerCase())
    .filter(i => i && i !== host);

  try {
    // Validate that all invitees exist
    const invalidUsers: string[] = [];
    for (const username of cleanInvitees) {
      const exists = await getUserByUsername(username);
      if (!exists) {
        invalidUsers.push(username);
      }
    }

    if (invalidUsers.length > 0) {
      return { 
        success: false, 
        error: `The following invitees do not exist: ${invalidUsers.join(', ')}. Please verify their usernames.` 
      };
    }

    // Generate random 9-digit UUID format: '123-456-789'
    const meetingId = Math.floor(100000000 + Math.random() * 900000000)
      .toString()
      .replace(/(\d{3})(\d{3})(\d{3})/, '$1-$2-$3');

    const newMeeting = await createMeetingDb(
      meetingId,
      title,
      description || '',
      host,
      cleanInvitees,
      scheduledAt,
      waitingRoomEnabled || false
    ) as any;

    // Create Invitations and Notifications for invitees
    for (const invitee of cleanInvitees) {
      await createInvitation(
        meetingId,
        title,
        invitee,
        host,
        description || '',
        scheduledAt ? new Date(scheduledAt) : new Date()
      );

      await createNotification(
        invitee,
        'invite',
        '🔔 New Meeting Invitation',
        `${clerkUser.firstName || host} has invited you to join "${title}".`,
        host,
        meetingId
      );
    }

    return { success: true, meeting: JSON.parse(JSON.stringify(newMeeting)) };
  } catch (err: any) {
    console.error('Create meeting error:', err);
    return { success: false, error: err?.message || 'Failed to create meeting.' };
  }
}

/**
 * Gets all meetings (host or invitee) for the logged-in user
 */
export async function getUserMeetingsAction() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return { success: false, error: 'Not authenticated', meetings: [] };
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress || '';
  const username = (clerkUser.username || email.split('@')[0] || '').toLowerCase().trim();

  try {
    const meetings = await getUserMeetingsDb(username) as any;
    return { success: true, meetings: JSON.parse(JSON.stringify(meetings)) };
  } catch (err: any) {
    console.error('Fetch meetings error:', err);
    return { success: false, error: err?.message || 'Failed to fetch meetings', meetings: [] };
  }
}

/**
 * Validates access to a meeting room
 */
export async function getMeetingAction(meetingId: string) {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return { success: false, error: 'Not authenticated', authorized: false };
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress || '';
  const username = (clerkUser.username || email.split('@')[0] || '').toLowerCase().trim();

  try {
    const meeting = await getMeetingDb(meetingId) as any;
    if (!meeting) {
      return { success: false, error: 'Meeting not found', authorized: false };
    }

    const isHost = meeting.host === username;
    const isInvited = meeting.invitees.includes(username);

    if (!isHost && !isInvited) {
      return { success: false, error: 'You are not invited to this meeting.', authorized: false };
    }

    return { 
      success: true, 
      meeting: JSON.parse(JSON.stringify(meeting)), 
      authorized: true,
      username,
      fullName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || username
    };
  } catch (err: any) {
    console.error('Get meeting details error:', err);
    return { success: false, error: err?.message || 'Database error', authorized: false };
  }
}

/**
 * Deletes a meeting (completely if Host, removes invitee from array if guest)
 */
export async function deleteMeetingAction(meetingId: string) {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return { success: false, error: 'Not authenticated' };
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress || '';
  const username = (clerkUser.username || email.split('@')[0] || '').toLowerCase().trim();

  try {
    const meeting = await getMeetingDb(meetingId) as any;
    if (!meeting) {
      return { success: false, error: 'Meeting not found' };
    }

    if (meeting.host !== username) {
      // If invitee, remove them from invitees array
      const nextInvitees = meeting.invitees.filter((i: string) => i !== username);
      await updateMeetingInvitees(meetingId, nextInvitees);
      return { success: true, removedSelf: true };
    }

    // If host, delete completely
    await deleteMeeting(meetingId);
    return { success: true, deleted: true };
  } catch (err: any) {
    console.error('Delete meeting action error:', err);
    return { success: false, error: err?.message || 'Failed to delete meeting' };
  }
}

/**
 * Adds a new invitee to an existing meeting
 */
export async function addMeetingInviteeAction(meetingId: string, inviteeUsername: string) {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return { success: false, error: 'Not authenticated' };
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress || '';
  const username = (clerkUser.username || email.split('@')[0] || '').toLowerCase().trim();
  const cleanInvitee = inviteeUsername.trim().toLowerCase();

  if (!cleanInvitee) {
    return { success: false, error: 'Invitee username is required.' };
  }

  try {
    const meeting = await getMeetingDb(meetingId) as any;
    if (!meeting) {
      return { success: false, error: 'Meeting not found' };
    }

    if (meeting.host !== username) {
      return { success: false, error: 'Only the host can add members to this meeting.' };
    }

    if (cleanInvitee === username) {
      return { success: false, error: 'You cannot invite yourself.' };
    }

    if (meeting.invitees.includes(cleanInvitee)) {
      return { success: false, error: 'User is already invited.' };
    }

    // Validate invitee exists
    const userExists = await getUserByUsername(cleanInvitee);
    if (!userExists) {
      return { success: false, error: `Username @${cleanInvitee} does not exist on this platform.` };
    }

    const nextInvitees = [...meeting.invitees, cleanInvitee];
    const updated = await updateMeetingInvitees(meetingId, nextInvitees);

    // Create invitation and notification
    await createInvitation(
      meetingId,
      meeting.title,
      cleanInvitee,
      username,
      meeting.description || '',
      meeting.scheduledAt || new Date()
    );

    await createNotification(
      cleanInvitee,
      'invite',
      '🔔 New Meeting Invitation',
      `${clerkUser.firstName || username} has invited you to join "${meeting.title}".`,
      username,
      meetingId
    );

    return { 
      success: true, 
      meeting: JSON.parse(JSON.stringify(updated)),
      addedUsername: cleanInvitee,
      hostFullName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || username
    };
  } catch (err: any) {
    console.error('Add invitee action error:', err);
    return { success: false, error: err?.message || 'Failed to add member' };
  }
}

/**
 * Ends a meeting (Host only)
 */
export async function endMeetingAction(meetingId: string) {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return { success: false, error: 'Not authenticated' };
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress || '';
  const username = (clerkUser.username || email.split('@')[0] || '').toLowerCase().trim();

  try {
    const meeting = await getMeetingDb(meetingId) as any;
    if (!meeting) {
      return { success: false, error: 'Meeting not found' };
    }

    if (meeting.host !== username) {
      return { success: false, error: 'Only the host can end this meeting.' };
    }

    await updateMeetingStatus(meetingId, 'ended');
    return { success: true };
  } catch (err: any) {
    console.error('End meeting action error:', err);
    return { success: false, error: err?.message || 'Failed to end meeting' };
  }
}

/**
 * Gets invitations for current user
 */
export async function getInvitationsAction() {
  const clerkUser = await currentUser();
  if (!clerkUser) return { success: false, error: 'Not authenticated' };
  const email = clerkUser.emailAddresses[0]?.emailAddress || '';
  const username = (clerkUser.username || email.split('@')[0] || '').toLowerCase().trim();

  try {
    const invites = await getUserInvitations(username);
    return { success: true, invitations: JSON.parse(JSON.stringify(invites)) };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Database error' };
  }
}

/**
 * Accepts or declines an invitation
 */
export async function respondToInvitationAction(meetingId: string, status: 'accepted' | 'declined') {
  const clerkUser = await currentUser();
  if (!clerkUser) return { success: false, error: 'Not authenticated' };
  const email = clerkUser.emailAddresses[0]?.emailAddress || '';
  const username = (clerkUser.username || email.split('@')[0] || '').toLowerCase().trim();

  try {
    const invite = (await updateInvitationStatus(meetingId, username, status)) as any;
    if (!invite) return { success: false, error: 'Invitation not found' };

    // Create notification for host
    const type = status === 'accepted' ? 'invite_accepted' : 'invite_declined';
    const statusText = status === 'accepted' ? 'accepted' : 'declined';
    await createNotification(
      invite.host,
      type,
      `Invitation ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
      `@${username} has ${statusText} your invitation to "${invite.meetingTitle}".`,
      username,
      meetingId
    );

    return { success: true, invitation: JSON.parse(JSON.stringify(invite)) };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Database error' };
  }
}

/**
 * Gets notifications for current user
 */
export async function getNotificationsAction() {
  const clerkUser = await currentUser();
  if (!clerkUser) return { success: false, error: 'Not authenticated' };
  const email = clerkUser.emailAddresses[0]?.emailAddress || '';
  const username = (clerkUser.username || email.split('@')[0] || '').toLowerCase().trim();

  try {
    const notifications = await getUserNotifications(username);
    return { success: true, notifications: JSON.parse(JSON.stringify(notifications)) };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Database error' };
  }
}

/**
 * Marks a notification as read
 */
export async function markNotificationReadAction(notificationId: string) {
  const clerkUser = await currentUser();
  if (!clerkUser) return { success: false, error: 'Not authenticated' };

  try {
    await markNotificationRead(notificationId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Database error' };
  }
}

/**
 * Clears all notifications
 */
export async function clearAllNotificationsAction() {
  const clerkUser = await currentUser();
  if (!clerkUser) return { success: false, error: 'Not authenticated' };
  const email = clerkUser.emailAddresses[0]?.emailAddress || '';
  const username = (clerkUser.username || email.split('@')[0] || '').toLowerCase().trim();

  try {
    await clearAllNotifications(username);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Database error' };
  }
}

/**
 * Deletes a single notification
 */
export async function deleteNotificationAction(notificationId: string) {
  const clerkUser = await currentUser();
  if (!clerkUser) return { success: false, error: 'Not authenticated' };

  try {
    await deleteNotification(notificationId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Database error' };
  }
}

/**
 * Gets user meetings history with search, filter, sort and pagination
 */
export async function getMeetingHistoryAction(
  search: string = '',
  statusFilter: string = 'all',
  hostFilter: string = 'all',
  sortBy: string = 'newest',
  page: number = 1,
  limit: number = 10
) {
  const clerkUser = await currentUser();
  if (!clerkUser) return { success: false, error: 'Not authenticated', meetings: [], totalPages: 0 };
  const email = clerkUser.emailAddresses[0]?.emailAddress || '';
  const username = (clerkUser.username || email.split('@')[0] || '').toLowerCase().trim();

  try {
    let query: any = {
      $or: [
        { host: username },
        { invitees: username }
      ]
    };

    // Search filter
    if (search.trim()) {
      query.title = { $regex: search.trim(), $options: 'i' };
    }

    // Status filter
    if (statusFilter !== 'all') {
      query.status = statusFilter;
    }

    // Host filter
    if (hostFilter === 'hosted') {
      query.host = username;
    } else if (hostFilter === 'invited') {
      query.host = { $ne: username };
    }

    // Sorting
    let sortQuery: any = { createdAt: -1 };
    if (sortBy === 'oldest') {
      sortQuery = { createdAt: 1 };
    } else if (sortBy === 'alphabetical') {
      sortQuery = { title: 1 };
    }

    const skip = (page - 1) * limit;
    const totalCount = await MeetingDb.countDocuments(query);
    const meetings = await MeetingDb.find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      success: true,
      meetings: JSON.parse(JSON.stringify(meetings)),
      totalPages: Math.ceil(totalCount / limit) || 1,
      totalCount
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Database error', meetings: [], totalPages: 0 };
  }
}

/**
 * Cancels a meeting (Host only)
 */
export async function cancelMeetingAction(meetingId: string) {
  const clerkUser = await currentUser();
  if (!clerkUser) return { success: false, error: 'Not authenticated' };
  const email = clerkUser.emailAddresses[0]?.emailAddress || '';
  const username = (clerkUser.username || email.split('@')[0] || '').toLowerCase().trim();

  try {
    const meeting = await getMeetingDb(meetingId) as any;
    if (!meeting) return { success: false, error: 'Meeting not found' };
    if (meeting.host !== username) return { success: false, error: 'Only host can cancel meeting' };

    await MeetingDb.findOneAndUpdate({ id: meetingId }, { $set: { status: 'cancelled' } });

    // Notify all invitees
    for (const invitee of meeting.invitees) {
      await createNotification(
        invitee,
        'meeting_cancelled',
        '❌ Meeting Cancelled',
        `The meeting "${meeting.title}" scheduled by @${username} has been cancelled.`,
        username,
        meetingId
      );
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Database error' };
  }
}

/**
 * Gets user statistics for profile tab
 */
export async function getUserProfileStatsAction() {
  const clerkUser = await currentUser();
  if (!clerkUser) return { success: false, error: 'Not authenticated' };
  const email = clerkUser.emailAddresses[0]?.emailAddress || '';
  const username = (clerkUser.username || email.split('@')[0] || '').toLowerCase().trim();

  try {
    // 1. Meetings Hosted count
    const hostedCount = await MeetingDb.countDocuments({ host: username });

    // 2. Meetings Joined (where user is participant and actually joined in attendees)
    const joinedQuery = {
      $or: [
        { host: username },
        { invitees: username }
      ],
      'attendees.username': username
    };
    const joinedCount = await MeetingDb.countDocuments(joinedQuery);

    // 3. Aggregate Hours in Meetings
    const attendedMeetings = await MeetingDb.find(joinedQuery).lean();
    let totalMinutes = 0;
    attendedMeetings.forEach((m: any) => {
      m.attendees.forEach((a: any) => {
        if (a.username === username && a.joinedAt && a.leftAt) {
          const diffMs = new Date(a.leftAt).getTime() - new Date(a.joinedAt).getTime();
          totalMinutes += diffMs / (1000 * 60);
        }
      });
    });
    const hoursInMeetings = Math.round((totalMinutes / 60) * 10) / 10 || 0;

    // 4. Invitations Sent
    const invitesSent = await InvitationDb.countDocuments({ host: username });

    // 5. Invitations Accepted
    const invitesAccepted = await InvitationDb.countDocuments({ host: username, status: 'accepted' });

    // 6. Completion rate (invitations success rate)
    const completionRate = invitesSent > 0 ? Math.round((invitesAccepted / invitesSent) * 100) : 100;

    // Get user details
    const dbUser = await UserDb.findOne({ username }).lean();

    return {
      success: true,
      stats: {
        hostedCount,
        joinedCount,
        hoursInMeetings,
        invitesSent,
        invitesAccepted,
        completionRate
      },
      user: dbUser ? JSON.parse(JSON.stringify(dbUser)) : null
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Database error' };
  }
}

/**
 * Updates user settings
 */
export async function updateUserSettingsAction(settings: any) {
  const clerkUser = await currentUser();
  if (!clerkUser) return { success: false, error: 'Not authenticated' };
  const email = clerkUser.emailAddresses[0]?.emailAddress || '';
  const username = (clerkUser.username || email.split('@')[0] || '').toLowerCase().trim();

  try {
    const updated = await updateUserSettings(username, settings);
    return { success: true, user: JSON.parse(JSON.stringify(updated)) };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Database error' };
  }
}

/**
 * Deletes user account from platform (Danger Zone)
 */
export async function deleteUserAccountAction() {
  const clerkUser = await currentUser();
  if (!clerkUser) return { success: false, error: 'Not authenticated' };
  const email = clerkUser.emailAddresses[0]?.emailAddress || '';
  const username = (clerkUser.username || email.split('@')[0] || '').toLowerCase().trim();

  try {
    // 1. Delete user from local database
    await UserDb.findOneAndDelete({ clerkId: clerkUser.id });

    // 2. Delete user meetings where they are host
    await MeetingDb.deleteMany({ host: username });

    // 3. Delete invitations and notifications related to user
    await InvitationDb.deleteMany({ $or: [{ host: username }, { invitee: username }] });
    await NotificationDb.deleteMany({ recipient: username });

    // 4. Delete user in Clerk
    const client = await clerkClient();
    await client.users.deleteUser(clerkUser.id);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Database error' };
  }
}
