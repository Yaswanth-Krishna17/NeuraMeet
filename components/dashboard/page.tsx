'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  syncUserAction, 
  getUserMeetingsAction, 
  createMeetingAction, 
  checkUsernameExistsAction 
} from './actions';
import Link from 'next/link';
import { RefreshCw, Calendar, Inbox, Shield, X, AlertTriangle, CheckCircle, Video, Users, User, Clock, Copy } from 'lucide-react';

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
  const [syncError, setSyncError] = useState('');

  // Clipboard & Confirmation Toast States
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState(false);

  // Refs for UX
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  // Live Invitation Notification Toast State
  const [activeInvite, setActiveInvite] = useState<{
    meetingId: string;
    title: string;
    host: string;
    hostUsername: string;
  } | null>(null);

  const socketRef = useRef<Socket | null>(null);

  // Helper: Dynamic greeting generator
  const getGreeting = (name: string) => {
    const hr = new Date().getHours();
    let greet = "Good Evening";
    if (hr >= 5 && hr < 12) {
      greet = "Good Morning";
    } else if (hr >= 12 && hr < 17) {
      greet = "Good Afternoon";
    }
    return `👋 ${greet}, ${name}`;
  };

  // Helper: Relative time generator
  const getRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays}d ago`;
    } catch (e) {
      return 'Recently';
    }
  };

  // Helper: Clipboard Copy
  const handleCopyId = (meetingId: string) => {
    navigator.clipboard.writeText(meetingId);
    setCopiedId(meetingId);
    setCopyToast(true);
    setTimeout(() => {
      setCopiedId(null);
      setCopyToast(false);
    }, 2000);
  };

  // 1. Sync Clerk user with MongoDB user
  useEffect(() => {
    if (!isLoaded || !user) return;

    const syncUser = async () => {
      const res = await syncUserAction();
      if (res.success && res.user) {
        setProfile(res.user);
        setSyncError('');
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.error('Clerk Profile Sync failed:', res.error);
        }
        setSyncError(res.error || 'Failed to connect to database. Check your MongoDB Atlas password in .env.local');
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
      if (process.env.NODE_ENV === 'development') {
        console.log('Dashboard connected to WebSocket server.');
      }
      socket.emit('register-user', { username: profile.username });
    });

    // Handle incoming meeting invitation popups
    socket.on('meeting-invite', (data) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Received meeting invitation popup:', data);
      }
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

  // 4. Handle adding username to schedule invitees list
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

  // UX loading state: renders an animated layout skeleton instead of only a spinner
  if (!isLoaded || (!profile && !syncError)) {
    return (
      <div className="flex flex-col gap-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-5 w-full sm:w-auto">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-850 border border-slate-800/85" />
            <div className="flex flex-col gap-2 flex-grow sm:flex-grow-0">
              <div className="h-4 w-32 bg-slate-800 rounded" />
              <div className="h-6 w-48 bg-slate-800 rounded" />
              <div className="h-3.5 w-36 bg-slate-850 rounded" />
            </div>
          </div>
          <div className="h-10 w-28 bg-slate-850 rounded-xl" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-panel p-5 rounded-2xl flex items-center justify-between">
              <div className="flex flex-col gap-2">
                <div className="h-3 w-16 bg-slate-850 rounded" />
                <div className="h-6 w-10 bg-slate-800 rounded" />
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-850" />
            </div>
          ))}
        </div>

        {/* Main Grid Area Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="h-6 w-48 bg-slate-800 rounded" />
              <div className="h-5 w-16 bg-slate-850 rounded-full" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass-panel p-6 rounded-2xl flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <div className="h-4 w-20 bg-slate-850 rounded" />
                    <div className="h-6 w-3/4 bg-slate-800 rounded" />
                    <div className="h-3.5 w-1/2 bg-slate-850 rounded mt-2" />
                  </div>
                  <div className="h-10 w-full bg-slate-850 rounded-xl" />
                </div>
              ))}
            </div>
          </div>
          <div className="glass-panel p-6 rounded-2xl h-[350px] bg-slate-900/40" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 max-w-md mx-auto text-center px-6">
        <div className="w-14 h-14 rounded-full bg-rose-950/50 border border-rose-900 flex items-center justify-center text-rose-400">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Could not load your profile</h2>
        <p className="text-sm text-slate-400">
          {syncError || 'Database connection failed. Replace <db_password> in .env.local with your real MongoDB Atlas password, then restart the server.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-xl glowing-button text-white text-sm font-bold animate-pulse"
        >
          Retry
        </button>
      </div>
    );
  }

  // Statistics Computations
  const totalMeetings = meetings.length;
  const liveMeetings = meetings.filter(m => m.status === 'active').length;
  const totalParticipants = meetings.reduce((acc, m) => acc + m.invitees.length, 0);

  return (
    <div className="flex flex-col gap-8">
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
            <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
              {getGreeting(profile.fullName)}
            </h2>
            <span className="text-sm text-slate-400 mt-0.5">Ready for your next secure meeting?</span>
            <span className="text-xs text-slate-500 mt-1">Username: <span className="text-cyan-400 font-semibold">@{profile.username}</span></span>
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={fetchMeetings} 
            className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-medium text-sm hover:bg-slate-850 hover:text-white transition-all flex items-center gap-2 cursor-pointer"
            title="Reload meeting lists and sync status"
            aria-label="Refresh meeting sessions list"
          >
            <RefreshCw className="w-4 h-4 text-indigo-400" />
            <span>Sync Status</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Meetings */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between shadow-md border border-slate-900/50 hover:border-slate-800/80 transition-colors">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Total Meetings</span>
            <span className="text-xl sm:text-2xl font-extrabold text-white">{totalMeetings}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-900/40 flex items-center justify-center text-indigo-400 shadow-md">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Live Meetings */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between shadow-md border border-slate-900/50 hover:border-slate-800/80 transition-colors">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Live Meetings</span>
            <span className="text-xl sm:text-2xl font-extrabold text-white">{liveMeetings}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-900/40 flex items-center justify-center text-emerald-400 shadow-md">
            <Video className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        {/* Participants */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between shadow-md border border-slate-900/50 hover:border-slate-800/80 transition-colors">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Participants</span>
            <span className="text-xl sm:text-2xl font-extrabold text-white">{totalParticipants}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-900/40 flex items-center justify-center text-cyan-400 shadow-md">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Secure Platform */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between shadow-md border border-slate-900/50 hover:border-slate-800/80 transition-colors">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Platform Security</span>
            <span className="text-xs sm:text-sm font-extrabold text-emerald-400 mt-1.5 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Linkless Active</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-900/40 flex items-center justify-center text-rose-400 shadow-md">
            <Shield className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Meetings List */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <span>Secure Meeting Sessions</span>
            </h3>
            <span className="text-xs text-slate-400 px-2 py-1 bg-slate-900 border border-slate-800 rounded-full font-semibold">
              {meetings.length} Total
            </span>
          </div>

          {loadingMeetings ? (
            /* Skeleton Loading Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass-panel p-6 rounded-2xl flex flex-col justify-between gap-6 animate-pulse">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="h-5 w-20 bg-slate-850 rounded-full border border-slate-800" />
                      <div className="h-3 w-16 bg-slate-850 rounded" />
                    </div>
                    <div className="h-6 w-3/4 bg-slate-800 rounded mt-1" />
                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-900/60 mt-1">
                      <div className="h-3 w-1/2 bg-slate-850 rounded" />
                      <div className="h-3 w-1/3 bg-slate-850 rounded" />
                    </div>
                  </div>
                  <div className="h-9 w-full bg-slate-850 border border-slate-800 rounded-xl" />
                </div>
              ))}
            </div>
          ) : meetings.length === 0 ? (
            /* Polished Empty State Card */
            <div className="glass-panel rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-5 border border-dashed border-slate-800/80 shadow-md">
              <div className="w-16 h-16 rounded-2xl bg-indigo-950/40 border border-indigo-900/40 flex items-center justify-center text-indigo-400 shadow-lg">
                <Inbox className="w-8 h-8" />
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="text-xl font-bold text-white">Create Your First Meeting</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  NeuraMeet meetings are fully protected and linkless. Invite colleagues securely by their unique usernames using the scheduler form on the right.
                </p>
              </div>
              <button
                onClick={() => titleInputRef.current?.focus()}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/35 transition-all cursor-pointer animate-pulse"
                style={{ animationDuration: '3s' }}
              >
                Schedule Meeting Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {meetings.map((meeting) => {
                const isHost = meeting.host.toLowerCase() === profile.username.toLowerCase();
                return (
                  <div 
                    key={meeting.id} 
                    className="glass-panel p-6 rounded-2xl glass-card-hover flex flex-col justify-between gap-6 hover:border-indigo-500/35 transition-all duration-300 shadow-md group"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                          meeting.status === 'active' 
                            ? 'bg-emerald-950/80 border-emerald-800 text-emerald-400' 
                            : meeting.status === 'ended'
                            ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                            : 'bg-indigo-950/80 border-indigo-800 text-indigo-400'
                        }`}>
                          {meeting.status === 'active' ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Live Now</span>
                            </>
                          ) : meeting.status === 'ended' ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                              <span>Ended</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" style={{ animationDuration: '3s' }} />
                              <span>Scheduled</span>
                            </>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-650" />
                          <span>{getRelativeTime(meeting.createdAt)}</span>
                        </span>
                      </div>
                      
                      <div className="flex flex-col gap-1.5 mt-1">
                        <h4 className="text-lg font-extrabold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-1">{meeting.title}</h4>
                        
                        {/* Copyable Meeting ID layout */}
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Meeting ID</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-mono font-bold text-cyan-400 bg-slate-950/60 border border-slate-900/50 px-2 py-0.5 rounded">{meeting.id}</span>
                            <button
                              onClick={() => handleCopyId(meeting.id)}
                              className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850 active:scale-95 transition-all cursor-pointer flex items-center justify-center min-w-[24px]"
                              aria-label={`Copy meeting ID ${meeting.id}`}
                              title="Copy Meeting ID"
                            >
                              {copiedId === meeting.id ? (
                                <span className="text-[8px] font-bold text-emerald-400 px-0.5">Copied!</span>
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 pt-2.5 text-xs text-slate-400 border-t border-slate-900/60 mt-1">
                        <span className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-indigo-400/85" />
                          <span>Host: <strong className="text-slate-200 font-semibold">@{meeting.host}</strong> {isHost && <span className="text-[9px] text-indigo-300 px-1.5 py-0.25 bg-indigo-950 border border-indigo-900/40 rounded ml-1">You</span>}</span>
                        </span>
                        <span className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-cyan-400/85" />
                          <span>Invitees: <strong className="text-slate-200 font-semibold">{meeting.invitees.length} User(s)</strong></span>
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
            <Shield className="w-5 h-5 text-indigo-400" />
            <span>Create Linkless Meeting</span>
          </h3>

          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-5 border border-indigo-500/10 shadow-lg shadow-indigo-500/2">
            <form onSubmit={handleCreateMeeting} className="flex flex-col gap-4">
              {/* Title Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Meeting Title</label>
                <input 
                  ref={titleInputRef}
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
                          className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-indigo-900 hover:text-white transition-colors cursor-pointer text-slate-400"
                          aria-label={`Remove invitee ${user}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Scheduling Error/Success messages */}
              {schedulingError && <span className="text-xs font-semibold text-rose-400">{schedulingError}</span>}
              {schedulingSuccess && (
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  <span>Linkless meeting scheduled successfully.</span>
                </span>
              )}

              {/* Create Submit */}
              <button 
                type="submit" 
                disabled={creatingMeeting}
                className="w-full py-3 rounded-xl glowing-button text-white font-bold text-sm shadow-md cursor-pointer disabled:opacity-50"
              >
                {creatingMeeting ? 'Creating meeting...' : 'Create Secure Meeting'}
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
              className="text-slate-500 hover:text-slate-350 transition-colors p-1 cursor-pointer"
              aria-label="Close incoming call invitation"
            >
              <X className="w-4 h-4" />
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

      {/* Floating Copy Confirmation Toast */}
      {copyToast && (
        <div className="fixed bottom-6 left-6 z-50 glass-panel bg-slate-950/90 border border-slate-800 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-slide-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 animate-bounce" />
          <span className="text-xs font-semibold text-slate-200">Meeting ID copied to clipboard</span>
        </div>
      )}
    </div>
  );
}
