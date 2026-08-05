import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

let isConnected = false;

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error(
      'MONGODB_URI is missing. Add your MongoDB Atlas connection string to .env.local'
    );
  }

  if (/<db_password>|PASSWORD|your_password/i.test(MONGODB_URI)) {
    throw new Error(
      'MONGODB_URI still contains a placeholder password. Replace <db_password> in .env.local with your MongoDB Atlas database user password, then restart the dev server.'
    );
  }

  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
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
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);

const meetingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true, trim: true },
  host: { type: String, required: true, lowercase: true, trim: true },
  invitees: [{ type: String, lowercase: true, trim: true }],
  status: {
    type: String,
    enum: ['scheduled', 'active', 'ended'],
    default: 'scheduled'
  },
  createdAt: { type: Date, default: Date.now },
  scheduledAt: { type: Date, default: Date.now }
});

export const Meeting = mongoose.models.Meeting || mongoose.model('Meeting', meetingSchema);

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

export async function createMeeting(id, title, host, invitees, scheduledAt) {
  await connectToDatabase();
  const newMeeting = new Meeting({
    id,
    title: title.trim(),
    host: host.toLowerCase().trim(),
    invitees: invitees.map(i => i.toLowerCase().trim()),
    scheduledAt: scheduledAt ? new Date(scheduledAt) : Date.now()
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
