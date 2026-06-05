'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  syncUserAction, 
  getUserMeetingsAction, 
  createMeetingAction, 
  checkUsernameExistsAction 
} from '../actions';
import Link from 'next/link';

interface Meeting {
  id: string;
  title: string;
  host: string;
  invitees: string[];
  status: 'scheduled' | 'active' | 'ended';
  createdAt: string;
}

interface UserProfile {
  clerkId: string;
  username: string;
  fullName: string;
  email: string;
  profileImage: string;
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);

  // Scheduling State
  const [meetingTitle, setMeetingTitle] = useState('');
  const [inviteeInput, setInviteeInput] = useState('');
  const [inviteesList, setInviteesList] = useState<string[]>([]);
  const [schedulingError, setSchedulingError] = useState('');
  const [inviteeError, setInviteeError] = useState('');
  const [schedulingSuccess, setSchedulingSuccess] = useState(false);
  const [creatingMeeting, setCreatingMeeting] = useState(false);

  // Live Invitation Notification Toast State
  const [activeInvite, setActiveInvite] = useState<{
    meetingId: string;
    title: string;
    host: string;
    hostUsername: string;
  } | null>(null);

  const socketRef = useRef<Socket | null>(null);

  // 1. Sync Clerk user with MongoDB user
  useEffect(() => {
    if (!isLoaded || !user) return;

    const syncUser = async () => {
      const res = await syncUserAction();
      if (res.success && res.user) {
        setProfile(res.user);
      } else {
        console.error('Clerk Profile Sync failed:', res.error);
      }
    };

    syncUser();
  }, [user, isLoaded]);

  // 2. Fetch User Meetings from DB
  const fetchMeetings = async () => {
    setLoadingMeetings(true);
    const res = await getUserMeetingsAction();
    if (res.success) {
      setMeetings(res.meetings);
    }
    setLoadingMeetings(false);
  };

  useEffect(() => {
    if (profile) {
      fetchMeetings();
    }
  }, [profile]);

  // 3. Setup Socket.io for Real-time Invitations
  useEffect(() => {
    if (!profile) return;

    // Connect to the custom server (hosted on same origin)
    const socket = io();
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Dashboard connected to WebSocket server.');
      socket.emit('register-user', { username: profile.username });
    });

    // Handle incoming meeting invitation popups
    socket.on('meeting-invite', (data) => {
      console.log('Received meeting invitation popup:', data);
      setActiveInvite(data);
      // Auto-hide alert after 15 seconds
      setTimeout(() => {
        setActiveInvite((prev) => (prev?.meetingId === data.meetingId ? null : prev));
      }, 15000);
    });

    return () => {
      socket.disconnect();
    };
  }, [profile]);

  // 4. Handle adding individual username to schedule invitees list
  const handleAddInvitee = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteeError('');
    const invitee = inviteeInput.trim().toLowerCase();

    if (!invitee) return;

    if (profile && invitee === profile.username.toLowerCase()) {
      setInviteeError("You cannot invite yourself to a meeting.");
      return;
    }

    if (inviteesList.includes(invitee)) {
      setInviteeError("User is already in your invitees list.");
      return;
    }

    // Call server action to check if user exists in database
    const check = await checkUsernameExistsAction(invitee);
    if (check.exists && check.username) {
      setInviteesList((prev) => [...prev, check.username!]);
      setInviteeInput('');
    } else {
      setInviteeError(`Username @${invitee} does not exist on this platform.`);
    }
  };

  // 5. Remove username from invitees list before scheduling
  const handleRemoveInvitee = (username: string) => {
    setInviteesList((prev) => prev.filter((u) => u !== username));
  };

  // 6. Schedule / Create Linkless Meeting Action
  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setSchedulingError('');
    setSchedulingSuccess(false);

    if (!meetingTitle.trim()) {
      setSchedulingError('Please input a meeting title.');
      return;
    }

    setCreatingMeeting(true);
    const res = await createMeetingAction(meetingTitle, inviteesList);

    if (res.success && res.meeting) {
      setSchedulingSuccess(true);
      setMeetingTitle('');
      setInviteesList([]);
      setInviteeInput('');
      fetchMeetings();

      // Emit meeting-created socket event to trigger real-time alerts
      if (socketRef.current && profile) {
        socketRef.current.emit('meeting-created', {
          meetingId: res.meeting.id,
          title: res.meeting.title,
          host: profile.fullName,
          hostUsername: profile.username,
          invitees: res.meeting.invitees
        });
      }
    } else {
      setSchedulingError(res.error || 'Failed to schedule meeting.');
    }
    setCreatingMeeting(false);
  };

  if (!isLoaded || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-slate-400">Loading your secure profile...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Dashboard Welcome Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-5">
          <img 
            src={profile.profileImage || '/default-avatar.png'} 
            alt={profile.fullName} 
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border border-indigo-500/20 object-cover shadow-indigo-500/10 shadow-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${profile.fullName}`;
            }}
          />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Authorized Session</span>
            <h2 className="text-xl sm:text-3xl font-extrabold text-white">Welcome back, {profile.fullName}</h2>
            <span className="text-sm text-slate-400">Username: <span className="text-cyan-400 font-semibold">@{profile.username}</span></span>
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={fetchMeetings} 
            className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-medium text-sm hover:bg-slate-850 hover:text-white transition-all flex items-center gap-2"
          >
            🔄 Sync Status
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Meetings List */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              📅 Secure Meeting Sessions
            </h3>
            <span className="text-xs text-slate-400 px-2 py-1 bg-slate-900 border border-slate-800 rounded-full font-semibold">
              {meetings.length} Total
            </span>
          </div>

          {loadingMeetings ? (
            <div className="glass-panel rounded-2xl p-12 flex flex-col items-center justify-center gap-4">
              <div className="w-8 h-8 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-400 font-medium">Fetching scheduled meetings...</span>
            </div>
          ) : meetings.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4">
              <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 text-2xl font-bold">
                📭
              </div>
              <h4 className="text-lg font-bold text-slate-200">No scheduled meetings</h4>
              <p className="text-xs text-slate-400 max-w-sm">
                Meetings are linkless and protected. Schedule a meeting using the form to invite colleagues by username.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {meetings.map((meeting) => {
                const isHost = meeting.host.toLowerCase() === profile.username.toLowerCase();
                return (
                  <div 
                    key={meeting.id} 
                    className="glass-panel p-6 rounded-2xl glass-card-hover flex flex-col justify-between gap-6"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full border ${
                          meeting.status === 'active' 
                            ? 'bg-emerald-950/80 border-emerald-800 text-emerald-400 animate-pulse' 
                            : meeting.status === 'ended'
                            ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                            : 'bg-indigo-950/80 border-indigo-800 text-indigo-400'
                        }`}>
                          {meeting.status === 'active' ? '🟢 Live Now' : meeting.status === 'ended' ? '⚪ Ended' : '🔵 Scheduled'}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">ID: {meeting.id}</span>
                      </div>
                      <h4 className="text-lg font-extrabold text-slate-150 line-clamp-1">{meeting.title}</h4>
                      <div className="flex flex-col gap-1.5 pt-2 text-xs text-slate-400 border-t border-slate-900">
                        <span className="flex items-center gap-1.5">
                          👤 Host: <strong className="text-slate-200 font-semibold">@{meeting.host}</strong> {isHost && <span className="text-[10px] text-indigo-400 px-1 py-0.25 bg-indigo-950/40 rounded">(You)</span>}
                        </span>
                        <span className="flex items-center gap-1.5">
                          👥 Invitees: <strong className="text-slate-200 font-semibold">{meeting.invitees.length} User(s)</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {meeting.status !== 'ended' ? (
                        <Link 
                          href={`/meetings/${meeting.id}`}
                          className="w-full text-center py-2.5 rounded-xl glowing-button text-white text-xs font-bold shadow-lg"
                        >
                          Join Call
                        </Link>
                      ) : (
                        <button 
                          disabled 
                          className="w-full text-center py-2.5 rounded-xl bg-slate-900 border border-slate-850 text-slate-500 text-xs font-bold cursor-not-allowed"
                        >
                          Meeting Closed
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Schedule Meeting Form */}
        <div className="flex flex-col gap-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            🛡️ Create Linkless Meeting
          </h3>

          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-5 border border-indigo-500/10 shadow-lg shadow-indigo-500/2">
            <form onSubmit={handleCreateMeeting} className="flex flex-col gap-4">
              {/* Title Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Meeting Title</label>
                <input 
                  type="text" 
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="e.g. Weekly Design Critique" 
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/60 transition-colors"
                />
              </div>

              {/* Invitees List Badges */}
              {inviteesList.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Invited Participants</label>
                  <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-950/60 border border-slate-850">
                    {inviteesList.map((user) => (
                      <span 
                        key={user} 
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950 border border-indigo-800/60 text-xs text-indigo-300 font-semibold"
                      >
                        @{user}
                        <button 
                          type="button" 
                          onClick={() => handleRemoveInvitee(user)}
                          className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-indigo-900 hover:text-white transition-colors cursor-pointer text-[10px]"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Scheduling Error/Success messages */}
              {schedulingError && <span className="text-xs font-semibold text-rose-400">{schedulingError}</span>}
              {schedulingSuccess && <span className="text-xs font-semibold text-emerald-400">✓ Linkless meeting scheduled successfully.</span>}

              {/* Create Submit */}
              <button 
                type="submit" 
                disabled={creatingMeeting}
                className="w-full py-3 rounded-xl glowing-button text-white font-bold text-sm shadow-md cursor-pointer disabled:opacity-50"
              >
                {creatingMeeting ? 'Scheduling call...' : 'Schedule & Notify'}
              </button>
            </form>

            <div className="w-full h-px bg-slate-900 my-1" />

            {/* Invite Username Search input */}
            <form onSubmit={handleAddInvitee} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Invite by Username</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={inviteeInput}
                    onChange={(e) => setInviteeInput(e.target.value)}
                    placeholder="e.g. lucky_dev" 
                    className="flex-grow px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/60 transition-colors"
                  />
                  <button 
                    type="submit" 
                    className="px-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-850 hover:text-white transition-all cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                {inviteeError && <span className="text-xs font-semibold text-rose-400 mt-1">{inviteeError}</span>}
              </div>
            </form>
          </div>
        </div>

      </div>

      {/* Floating WebRTC Live Invitation Alert Card */}
      {activeInvite && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm glass-panel p-5 rounded-2xl border-l-4 border-l-indigo-500 shadow-2xl shadow-indigo-500/10 flex flex-col gap-3 animate-slide-in">
          <div className="flex justify-between items-start gap-2">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Incoming Call Invitation</span>
              <h4 className="text-base font-extrabold text-white mt-1 line-clamp-1">{activeInvite.title}</h4>
            </div>
            <button 
              onClick={() => setActiveInvite(null)}
              className="text-slate-500 hover:text-slate-350 transition-colors text-sm font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Host <strong className="text-slate-200">@{activeInvite.hostUsername}</strong> ({activeInvite.host}) is inviting you to join this meeting room live.
          </p>
          <div className="flex gap-3 mt-1">
            <Link 
              href={`/meetings/${activeInvite.meetingId}`}
              onClick={() => setActiveInvite(null)}
              className="flex-grow text-center py-2 rounded-xl glowing-button text-white text-xs font-bold shadow-lg"
            >
              Join Instant
            </Link>
            <button 
              onClick={() => setActiveInvite(null)}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold hover:bg-slate-850 hover:text-white transition-all"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Animations Helper Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slide-in {
          from { transform: translateY(50px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}} />
    </div>
  );
}
