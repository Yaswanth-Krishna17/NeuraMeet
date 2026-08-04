'use server';

import { currentUser } from '@clerk/nextjs/server';
import { 
  createOrUpdateClerkUser, 
  getUserByClerkId, 
  getUserByUsername, 
  createMeeting as createMeetingDb, 
  getMeeting as getMeetingDb, 
  getUserMeetings as getUserMeetingsDb 
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
export async function createMeetingAction(title: string, invitees: string[]) {
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

    const newMeeting = await createMeetingDb(meetingId, title, host, cleanInvitees) as any;
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
