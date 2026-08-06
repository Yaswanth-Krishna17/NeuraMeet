import mongoose from 'mongoose';

let isConnected = false;

export async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'MONGODB_URI is missing. Add your MongoDB Atlas connection string to .env.local'
    );
  }

  if (/<db_password>|PASSWORD|your_password/i.test(uri)) {
    throw new Error(
      'MONGODB_URI still contains a placeholder password. Replace <db_password> in .env.local with your MongoDB Atlas database user password, then restart the dev server.'
    );
  }

  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(uri);
    isConnected = true;
    console.log('🚀 Connected to MongoDB Atlas (ai-video-conference).');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    throw err;
  }
}

const userSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  profileImage: { type: String, default: '' },
  settings: {
    theme: { type: String, default: 'dark' },
    language: { type: String, default: 'en' },
    notificationsEnabled: { type: Boolean, default: true },
    cameraEnabled: { type: Boolean, default: true },
    micEnabled: { type: Boolean, default: true },
    videoQuality: { type: String, default: 'high' },
    backgroundBlur: { type: Boolean, default: false },
    allowInvitations: { type: Boolean, default: true },
    showOnlineStatus: { type: Boolean, default: true },
    notificationSounds: { type: Boolean, default: true }
  },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);

const meetingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  host: { type: String, required: true, lowercase: true, trim: true },
  invitees: [{ type: String, lowercase: true, trim: true }],
  status: {
    type: String,
    enum: ['scheduled', 'active', 'ended', 'cancelled'],
    default: 'scheduled'
  },
  isLocked: { type: Boolean, default: false },
  waitingRoomEnabled: { type: Boolean, default: false },
  waitingRoomQueue: [{ type: String, lowercase: true, trim: true }],
  attendees: [{
    username: { type: String, lowercase: true, trim: true },
    joinedAt: { type: Date, default: Date.now },
    leftAt: { type: Date }
  }],
  createdAt: { type: Date, default: Date.now },
  scheduledAt: { type: Date, default: Date.now }
});

export const Meeting = mongoose.models.Meeting || mongoose.model('Meeting', meetingSchema);

const invitationSchema = new mongoose.Schema({
  meetingId: { type: String, required: true },
  meetingTitle: { type: String, required: true },
  invitee: { type: String, required: true, lowercase: true, trim: true },
  host: { type: String, required: true, lowercase: true, trim: true },
  description: { type: String, default: '' },
  scheduledAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'expired', 'missed'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const Invitation = mongoose.models.Invitation || mongoose.model('Invitation', invitationSchema);

const notificationSchema = new mongoose.Schema({
  recipient: { type: String, required: true, lowercase: true, trim: true },
  type: {
    type: String,
    enum: ['invite', 'meeting_started', 'meeting_cancelled', 'meeting_ended', 'invite_accepted', 'invite_declined', 'user_joined', 'user_left', 'system'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  sender: { type: String, lowercase: true, trim: true },
  meetingId: { type: String },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export async function getUserByUsername(username) {
  if (!username) return null;
  await connectToDatabase();
  return await User.findOne({
    username: username.toLowerCase().trim()
  }).lean();
}

export async function getUserByClerkId(clerkId) {
  if (!clerkId) return null;
  await connectToDatabase();
  return await User.findOne({ clerkId }).lean();
}

export async function createOrUpdateClerkUser({
  clerkId,
  username,
  fullName,
  email,
  profileImage
}) {
  await connectToDatabase();
  const lowerUsername = username.toLowerCase().trim();
  const lowerEmail = email.toLowerCase().trim();

  // Try updating by clerkId first
  const existingByClerk = await User.findOne({ clerkId });
  if (existingByClerk) {
    existingByClerk.username = lowerUsername;
    existingByClerk.fullName = fullName.trim();
    existingByClerk.email = lowerEmail;
    if (profileImage) existingByClerk.profileImage = profileImage;
    const saved = await existingByClerk.save();
    return saved.toObject();
  }

  // Fallback: If username or email exists under another clerkId
  const existingByEmail = await User.findOne({ email: lowerEmail });
  if (existingByEmail) {
    existingByEmail.clerkId = clerkId;
    existingByEmail.username = lowerUsername;
    existingByEmail.fullName = fullName.trim();
    if (profileImage) existingByEmail.profileImage = profileImage;
    const saved = await existingByEmail.save();
    return saved.toObject();
  }

  // Create new user record
  const newUser = new User({
    clerkId,
    username: lowerUsername,
    fullName: fullName.trim(),
    email: lowerEmail,
    profileImage: profileImage || ''
  });
  const saved = await newUser.save();
  return saved.toObject();
}

export async function createMeeting(id, title, description, host, invitees, scheduledAt, waitingRoomEnabled = false) {
  await connectToDatabase();
  const newMeeting = new Meeting({
    id,
    title: title.trim(),
    description: (description || '').trim(),
    host: host.toLowerCase().trim(),
    invitees: invitees.map(i => i.toLowerCase().trim()),
    scheduledAt: scheduledAt ? new Date(scheduledAt) : Date.now(),
    waitingRoomEnabled
  });

  const saved = await newMeeting.save();
  return saved.toObject();
}

export async function getMeeting(id) {
  if (!id) return null;
  await connectToDatabase();
  return await Meeting.findOne({ id }).lean();
}

export async function updateMeetingStatus(id, status) {
  await connectToDatabase();
  return await Meeting.findOneAndUpdate(
    { id },
    { $set: { status } },
    { new: true }
  ).lean();
}

export async function getUserMeetings(username) {
  await connectToDatabase();
  const lowerUser = username.toLowerCase().trim();

  return await Meeting.find({
    $or: [
      { host: lowerUser },
      { invitees: lowerUser }
    ]
  }).sort({ createdAt: -1 }).lean();
}

export async function updateMeetingInvitees(id, invitees) {
  await connectToDatabase();
  const cleanInvitees = invitees.map(i => i.toLowerCase().trim());

  return await Meeting.findOneAndUpdate(
    { id },
    { $set: { invitees: cleanInvitees } },
    { new: true }
  ).lean();
}

export async function deleteMeeting(id) {
  await connectToDatabase();
  return await Meeting.findOneAndDelete({ id }).lean();
}

// Settings Helpers
export async function updateUserSettings(username, settings) {
  await connectToDatabase();
  return await User.findOneAndUpdate(
    { username: username.toLowerCase().trim() },
    { $set: { settings } },
    { new: true }
  ).lean();
}

// Invitation Helpers
export async function createInvitation(meetingId, meetingTitle, invitee, host, description, scheduledAt) {
  await connectToDatabase();
  const newInvite = new Invitation({
    meetingId,
    meetingTitle,
    invitee: invitee.toLowerCase().trim(),
    host: host.toLowerCase().trim(),
    description: description || '',
    scheduledAt: scheduledAt ? new Date(scheduledAt) : Date.now()
  });
  return await newInvite.save();
}

export async function getUserInvitations(username) {
  await connectToDatabase();
  return await Invitation.find({ invitee: username.toLowerCase().trim() }).sort({ createdAt: -1 }).lean();
}

export async function updateInvitationStatus(meetingId, invitee, status) {
  await connectToDatabase();
  return await Invitation.findOneAndUpdate(
    { meetingId, invitee: invitee.toLowerCase().trim() },
    { $set: { status, updatedAt: new Date() } },
    { new: true }
  ).lean();
}

// Notification Helpers
export async function createNotification(recipient, type, title, message, sender = '', meetingId = '') {
  await connectToDatabase();
  const newNotif = new Notification({
    recipient: recipient.toLowerCase().trim(),
    type,
    title,
    message,
    sender: sender ? sender.toLowerCase().trim() : '',
    meetingId
  });
  return await newNotif.save();
}

export async function getUserNotifications(username) {
  await connectToDatabase();
  return await Notification.find({ recipient: username.toLowerCase().trim() }).sort({ createdAt: -1 }).lean();
}

export async function markNotificationRead(id) {
  await connectToDatabase();
  return await Notification.findByIdAndUpdate(id, { $set: { read: true } }, { new: true }).lean();
}

export async function clearAllNotifications(username) {
  await connectToDatabase();
  return await Notification.deleteMany({ recipient: username.toLowerCase().trim() });
}

export async function deleteNotification(id) {
  await connectToDatabase();
  return await Notification.findByIdAndDelete(id).lean();
}

// In-meeting Room Lock & Waiting Room State Updates
export async function updateMeetingLock(id, isLocked) {
  await connectToDatabase();
  return await Meeting.findOneAndUpdate({ id }, { $set: { isLocked } }, { new: true }).lean();
}

export async function updateMeetingWaitingRoom(id, waitingRoomEnabled) {
  await connectToDatabase();
  return await Meeting.findOneAndUpdate({ id }, { $set: { waitingRoomEnabled } }, { new: true }).lean();
}

export async function addMeetingAttendee(id, username) {
  await connectToDatabase();
  const cleanUsername = username.toLowerCase().trim();
  
  const meeting = await Meeting.findOne({ id });
  if (!meeting) return null;
  
  const attendee = meeting.attendees.find(a => a.username === cleanUsername && !a.leftAt);
  if (!attendee) {
    meeting.attendees.push({ username: cleanUsername, joinedAt: new Date() });
    await meeting.save();
  }
  return meeting.toObject();
}

export async function removeMeetingAttendee(id, username) {
  await connectToDatabase();
  const cleanUsername = username.toLowerCase().trim();
  
  const meeting = await Meeting.findOne({ id });
  if (!meeting) return null;
  
  meeting.attendees.forEach(a => {
    if (a.username === cleanUsername && !a.leftAt) {
      a.leftAt = new Date();
    }
  });
  
  await meeting.save();
  return meeting.toObject();
}

export async function updateMeetingHost(id, host) {
  await connectToDatabase();
  return await Meeting.findOneAndUpdate(
    { id },
    { $set: { host: host.toLowerCase().trim() } },
    { new: true }
  ).lean();
}
