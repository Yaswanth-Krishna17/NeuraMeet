'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  syncUserAction, 
  getUserMeetingsAction, 
  createMeetingAction, 
  checkUsernameExistsAction,
  deleteMeetingAction,
  addMeetingInviteeAction
} from './actions';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  RefreshCw, 
  Calendar, 
  Shield, 
  X, 
  AlertTriangle, 
  CheckCircle, 
  Video, 
  Users, 
  User, 
  Clock, 
  Trash2, 
  UserPlus, 
  Zap, 
  Globe, 
  Search, 
  Plus,
  Lock,
  ArrowRight,
  Play,
  Check,
  Loader2,
  Sparkles,
  Inbox,
  MailCheck,
  ShieldCheck,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Meeting {
  id: string;
  title: string;
  host: string;
  invitees: string[];
  status: 'scheduled' | 'active' | 'ended';
  createdAt: string;
  scheduledAt?: string;
}

interface UserProfile {
  clerkId: string;
  username: string;
  fullName: string;
  email: string;
  profileImage: string;
}

// Count-up Animated Counter for stats cards
function AnimatedCounter({ value }: { value: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setCount(end);
      return;
    }
    const duration = 800; // ms
    const increment = Math.ceil(end / 30) || 1;
    const stepTime = Math.max(Math.floor(duration / (end / increment)), 20);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        start = end;
        clearInterval(timer);
      }
      setCount(start);
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return <>{count}</>;
}

// Premium SVG Illustration for Empty Invitations State
const EmptyInvitationsIllustration = () => (
  <svg className="w-40 h-40 mx-auto text-indigo-400/25 dark:text-indigo-400/10 mb-2" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="invCircleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6366F1" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.02" />
      </linearGradient>
      <linearGradient id="invEnvelopeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6366F1" />
        <stop offset="100%" stopColor="#22D3EE" />
      </linearGradient>
    </defs>
    <circle cx="100" cy="100" r="75" fill="url(#invCircleGrad)" />
    <rect x="60" y="70" width="80" height="60" rx="10" stroke="url(#invEnvelopeGrad)" strokeWidth="2.5" fill="none" />
    <path d="M60 80L100 110L140 80" stroke="url(#invEnvelopeGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="140" cy="70" r="10" fill="#EF4444" className="animate-pulse" opacity="0.1" />
  </svg>
);

// Premium SVG Illustration for Empty Hosted Rooms
const EmptyHostedIllustration = () => (
  <svg className="w-40 h-40 mx-auto text-indigo-400/25 dark:text-indigo-400/10 mb-2" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="75" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 6" className="text-zinc-800" />
    <path d="M100 65L130 80V115L100 130L70 115V80L100 65Z" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" className="animate-pulse" />
    <path d="M85 98L95 108L115 88" stroke="#22D3EE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Mock common platform users to suggest during autocomplete
const mockUsersList = [
  'lucky_dev',
  'alice_smith',
  'bob_jones',
  'charlie_brown',
  'david_lee',
  'eve_adams',
  'frank_underwood',
  'grace_hopper',
  'yaswanth_krishna',
  'neura_meet_admin',
  'gemini_coder'
];

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);

  // Active Tab Switcher for Recent Sidebar
  const [activeSidebarTab, setActiveSidebarTab] = useState<'invitations' | 'hosted'>('invitations');

  // Scheduling State
  const [meetingTitle, setMeetingTitle] = useState('');
  const [inviteeInput, setInviteeInput] = useState('');
  const [inviteesList, setInviteesList] = useState<string[]>([]);
  const [schedulingError, setSchedulingError] = useState('');
  const [inviteeError, setInviteeError] = useState('');
  const [schedulingSuccess, setSchedulingSuccess] = useState(false);
  const [creatingMeeting, setCreatingMeeting] = useState(false);
  const [syncError, setSyncError] = useState('');

  // Autocomplete suggestions
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);

  // Future scheduling states
  const [isFutureScheduled, setIsFutureScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [timezone, setTimezone] = useState('local');

  // Search Filter for Meetings
  const [meetingsSearchQuery, setMeetingsSearchQuery] = useState('');

  // Add Member Inline States
  const [activeAddMemberId, setActiveAddMemberId] = useState<string | null>(null);
  const [addMemberInput, setAddMemberInput] = useState('');
  const [addMemberError, setAddMemberError] = useState('');
  const [addMemberSuccess, setAddMemberSuccess] = useState('');
  const [addingMemberId, setAddingMemberId] = useState<string | null>(null);

  // Refs for UX
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const sidebarContainerRef = useRef<HTMLDivElement | null>(null);

  // Live Invitation Notification Toast State
  const [activeInvite, setActiveInvite] = useState<{
    meetingId: string;
    title: string;
    host: string;
    hostUsername: string;
  } | null>(null);

  const socketRef = useRef<Socket | null>(null);

  const timezones = [
    { name: 'Local Timezone', value: 'local' },
    { name: 'UTC (GMT+00:00)', value: 'UTC' },
    { name: 'New York (EST/EDT)', value: 'America/New_York' },
    { name: 'Los Angeles (PST/PDT)', value: 'America/Los_Angeles' },
    { name: 'London (GMT/BST)', value: 'Europe/London' },
    { name: 'New Delhi (IST+05:30)', value: 'Asia/Kolkata' },
    { name: 'Tokyo (JST+09:00)', value: 'Asia/Tokyo' }
  ];

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

  // Helper: Decline/Delete Meeting or remove invitation
  const handleDeleteMeeting = async (meetingId: string) => {
    const confirmMsg = "Are you sure you want to decline/remove this meeting session? You will lose authorized access.";
    if (!confirm(confirmMsg)) return;

    const res = await deleteMeetingAction(meetingId);
    if (res.success) {
      fetchMeetings();
    } else {
      alert(res.error || "Failed to remove meeting.");
    }
  };

  // Helper: Format scheduled time
  const formatScheduledTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '';
    }
  };

  // Helper: Add member to existing meeting
  const handleAddMemberToMeeting = async (e: React.FormEvent, meetingId: string) => {
    e.preventDefault();
    setAddMemberError('');
    setAddMemberSuccess('');

    const targetUser = addMemberInput.trim().toLowerCase();
    if (!targetUser) return;

    setAddingMemberId(meetingId);
    const res = await addMeetingInviteeAction(meetingId, targetUser);

    if (res.success && res.meeting) {
      setAddMemberSuccess(`@${res.addedUsername} successfully added!`);
      setAddMemberInput('');
      fetchMeetings();

      if (socketRef.current) {
        socketRef.current.emit('meeting-created', {
          meetingId: meetingId,
          title: res.meeting.title,
          host: res.hostFullName,
          hostUsername: profile?.username || '',
          invitees: [res.addedUsername]
        });
      }

      setTimeout(() => {
        setActiveAddMemberId(null);
        setAddMemberSuccess('');
      }, 2000);
    } else {
      setAddMemberError(res.error || 'Failed to add member.');
    }
    setAddingMemberId(null);
  };

  // Autocomplete selection helpers
  const handleInviteeInputChange = (val: string) => {
    setInviteeInput(val);
    setInviteeError('');
    if (!val.trim()) {
      setSuggestions([]);
      setShowSuggestionsDropdown(false);
      return;
    }
    const cleanVal = val.toLowerCase().trim();
    const matches = mockUsersList.filter(
      (username) => 
        username.toLowerCase().includes(cleanVal) && 
        !inviteesList.includes(username) &&
        username.toLowerCase() !== profile?.username.toLowerCase()
    );
    setSuggestions(matches);
    setShowSuggestionsDropdown(matches.length > 0);
  };

  const selectSuggestion = (username: string) => {
    if (inviteesList.includes(username)) {
      setInviteeError('User already in invite list.');
      return;
    }
    setInviteesList((prev) => [...prev, username]);
    setInviteeInput('');
    setSuggestions([]);
    setShowSuggestionsDropdown(false);
    setInviteeError('');
  };

  // Click outside listener for autocomplete box
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestionsDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick Action triggers
  const handleQuickInstant = () => {
    setIsFutureScheduled(false);
    titleInputRef.current?.focus();
  };

  const handleQuickSchedule = () => {
    setIsFutureScheduled(true);
    titleInputRef.current?.focus();
  };

  const handleQuickInvitationsTab = () => {
    setActiveSidebarTab('invitations');
    sidebarContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
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

    const socket = io();
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('register-user', { username: profile.username });
    });

    socket.on('meeting-invite', (data) => {
      setActiveInvite(data);
      fetchMeetings(); // Automatically reload client list
      setTimeout(() => {
        setActiveInvite((prev) => (prev?.meetingId === data.meetingId ? null : prev));
      }, 15000);
    });

    return () => {
      socket.disconnect();
    };
  }, [profile]);

  // 4. Add username validation to invite list
  const handleAddInvitee = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteeError('');
    const invitee = inviteeInput.trim().toLowerCase();

    if (!invitee) return;
    if (profile && invitee === profile.username.toLowerCase()) {
      setInviteeError('You cannot invite yourself.');
      return;
    }
    if (inviteesList.includes(invitee)) {
      setInviteeError('User already in invite list.');
      return;
    }

    const check = await checkUsernameExistsAction(invitee);
    if (check.exists && check.username) {
      setInviteesList((prev) => [...prev, check.username!]);
      setInviteeInput('');
      setSuggestions([]);
      setShowSuggestionsDropdown(false);
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

    let scheduledAtIso: string | undefined = undefined;
    if (isFutureScheduled) {
      if (!scheduledDate || !scheduledTime) {
        setSchedulingError('Please specify both scheduled date and time.');
        return;
      }
      
      let scheduledDateTime: Date;
      if (timezone === 'local') {
        scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      } else {
        const offsets: Record<string, string> = {
          'UTC': 'Z',
          'America/New_York': '-05:00',
          'America/Los_Angeles': '-08:00',
          'Europe/London': '+00:00',
          'Asia/Kolkata': '+05:30',
          'Asia/Tokyo': '+09:00'
        };
        const offset = offsets[timezone] || 'Z';
        scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}${offset}`);
      }

      if (isNaN(scheduledDateTime.getTime())) {
        setSchedulingError('Invalid date or time value.');
        return;
      }
      if (scheduledDateTime.getTime() < Date.now() - 60000) {
        setSchedulingError('Cannot schedule a meeting in the past.');
        return;
      }
      scheduledAtIso = scheduledDateTime.toISOString();
    }

    setCreatingMeeting(true);
    const res = await createMeetingAction(meetingTitle, inviteesList, scheduledAtIso);

    if (res.success && res.meeting) {
      setSchedulingSuccess(true);
      setMeetingTitle('');
      setInviteesList([]);
      setInviteeInput('');
      setScheduledDate('');
      setScheduledTime('');
      setIsFutureScheduled(false);
      fetchMeetings();

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

  // Helper check if invitation has expired
  const isInvitationExpired = (meeting: Meeting) => {
    if (meeting.status === 'ended') return true;
    if (meeting.scheduledAt && new Date(meeting.scheduledAt).getTime() < Date.now() - 3600000) {
      return true; // Past 1 hour of scheduled time
    }
    return false;
  };

  // Statistics Computations
  const totalMeetings = meetings.length;
  const liveMeetings = meetings.filter(m => m.status === 'active').length;
  const totalParticipants = meetings.reduce((acc, m) => acc + m.invitees.length, 0);

  // Loading Skeletons
  if (!isLoaded || (loadingMeetings && meetings.length === 0)) {
    return (
      <div className="flex flex-col gap-8 animate-pulse text-left max-w-7xl mx-auto w-full">
        {/* Banner Skeleton */}
        <div className="bg-zinc-950/60 dark:bg-zinc-950/60 light:bg-white border border-zinc-900 dark:border-zinc-900 light:border-zinc-200 p-8 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5 w-full sm:w-auto">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-900 dark:bg-zinc-900 light:bg-zinc-100 border border-zinc-800 dark:border-zinc-800 light:border-zinc-200" />
            <div className="flex flex-col gap-2 flex-grow sm:flex-grow-0">
              <div className="h-4 w-32 bg-zinc-900 dark:bg-zinc-900 light:bg-zinc-150 rounded" />
              <div className="h-6 w-48 bg-zinc-900 dark:bg-zinc-900 light:bg-zinc-150 rounded" />
              <div className="h-3.5 w-36 bg-zinc-900 dark:bg-zinc-900 light:bg-zinc-150 rounded mt-1" />
            </div>
          </div>
          <div className="h-10 w-28 bg-zinc-900 dark:bg-zinc-900 light:bg-zinc-150 rounded-lg" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-zinc-950/60 dark:bg-zinc-950/60 light:bg-white border border-zinc-900 dark:border-zinc-900 light:border-zinc-200 p-6 rounded-3xl flex items-center justify-between">
              <div className="flex flex-col gap-2">
                <div className="h-3 w-16 bg-zinc-900 dark:bg-zinc-900 light:bg-zinc-150 rounded" />
                <div className="h-6 w-10 bg-zinc-900 dark:bg-zinc-900 light:bg-zinc-150 rounded" />
              </div>
              <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-zinc-900 light:bg-zinc-150" />
            </div>
          ))}
        </div>

        {/* Layout Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-[450px] bg-zinc-950/40 border border-zinc-900 rounded-3xl" />
          <div className="lg:col-span-1 h-[450px] bg-zinc-950/40 border border-zinc-900 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 max-w-md mx-auto text-center px-6">
        <div className="w-14 h-14 rounded-full bg-zinc-950 border border-red-900/60 flex items-center justify-center text-red-450 shadow-md">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-white dark:text-white light:text-zinc-855">Profile configuration issue</h2>
        <p className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-550">
          {syncError || 'Database connection offline. Verify credentials in .env.local file.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-xl glowing-button text-white text-xs font-bold shadow-md cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Filter meetings by role
  const hostedMeetings = meetings.filter(
    (m) => m.host.toLowerCase() === profile.username.toLowerCase()
  );

  const incomingInvitations = meetings.filter(
    (m) => m.host.toLowerCase() !== profile.username.toLowerCase()
  );

  // Apply query filter to the active tab list
  const filteredHosted = hostedMeetings.filter((m) =>
    m.title.toLowerCase().includes(meetingsSearchQuery.toLowerCase()) ||
    m.id.toLowerCase().includes(meetingsSearchQuery.toLowerCase())
  );

  const filteredInvitations = incomingInvitations.filter((m) =>
    m.title.toLowerCase().includes(meetingsSearchQuery.toLowerCase()) ||
    m.id.toLowerCase().includes(meetingsSearchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full px-1">
      
      {/* Redesigned Premium Welcome Header */}
      <div className="bg-zinc-950/60 dark:bg-zinc-950/60 light:bg-white border border-zinc-900 dark:border-zinc-900 light:border-zinc-200 p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden group text-left">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        <div className="flex items-center gap-5 z-10 w-full md:w-auto">
          {/* Glowing spinning avatar frame */}
          <div className="relative p-1 shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 animate-spin [animation-duration:8s] opacity-75 blur-[1px] shadow-lg shadow-indigo-500/10" />
            <img 
              src={profile.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.fullName}`} 
              alt={profile.fullName} 
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border border-zinc-950 dark:border-zinc-950 light:border-zinc-300 object-cover shadow-md relative z-10 bg-zinc-900"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${profile.fullName}`;
              }}
            />
          </div>

          <div className="flex flex-col text-left">
            <span className="text-[9px] font-extrabold text-indigo-500 dark:text-indigo-400 light:text-indigo-650 uppercase tracking-widest flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>Linkless Secure Session Verified</span>
            </span>
            <h2 className="text-xl font-extrabold text-white dark:text-white light:text-zinc-900 flex items-center gap-2 mt-1">
              {getGreeting(profile.fullName)}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-550 font-medium">
              <span>Secure, linkless conference portal</span>
              <span className="hidden sm:inline text-zinc-800 dark:text-zinc-800 light:text-zinc-300">•</span>
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
                verified Username: <span className="text-cyan-500 dark:text-cyan-400 light:text-cyan-600">@{profile.username}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 z-10 w-full md:w-auto justify-end">
          <button 
            onClick={fetchMeetings} 
            className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-900 light:bg-zinc-100 border border-zinc-800 dark:border-zinc-850 light:border-zinc-200 text-zinc-300 dark:text-zinc-300 light:text-zinc-700 font-bold text-xs hover:bg-zinc-850 dark:hover:bg-zinc-850 light:hover:bg-zinc-200 hover:text-white dark:hover:text-white light:hover:text-zinc-900 transition-all flex items-center justify-center gap-2 cursor-pointer shadow active:scale-[0.98]"
            title="Refresh database and sync sockets"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-400 light:text-indigo-650" />
            <span>Sync Live Status</span>
          </button>
        </div>
      </div>

      {/* Philosophy Security Banner */}
      <div className="bg-indigo-950/15 dark:bg-indigo-950/10 light:bg-indigo-50 border border-indigo-500/20 light:border-indigo-200 p-4.5 rounded-2xl flex flex-col sm:flex-row items-center gap-4 text-left shadow-inner">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-455 light:text-indigo-600 shrink-0">
          <ShieldCheck className="w-5.5 h-5.5" />
        </div>
        <div className="flex flex-col gap-0.5">
          <h4 className="text-xs font-black text-white dark:text-white light:text-zinc-850 flex items-center gap-1.5">
            <span>Identity-Authorized Meetings</span>
            <span className="text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.25 rounded-md">ZERO LINKS</span>
          </h4>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-450 light:text-zinc-550 leading-relaxed font-medium">
            This platform generates <strong className="text-white dark:text-white light:text-zinc-800">no links, invite codes, or URLs</strong>. Access is restricted exclusively to authenticated users on the invite list. Meeting IDs are purely internal log tags.
          </p>
        </div>
      </div>

      {/* Redesigned Quick Actions Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Start Instant Meeting Card */}
        <button
          onClick={handleQuickInstant}
          className="bg-zinc-950/60 dark:bg-zinc-950/60 light:bg-white border border-zinc-900 dark:border-zinc-900 light:border-zinc-200 p-6 rounded-3xl flex items-center gap-5 shadow-lg hover:-translate-y-1.5 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 light:hover:border-indigo-300 transition-all duration-300 text-left cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400 light:text-indigo-600 shadow-inner group-hover:scale-110 transition-transform">
            <Zap className="w-5.5 h-5.5" />
          </div>
          <div className="flex flex-col">
            <h4 className="text-sm font-black text-white dark:text-white light:text-zinc-855 group-hover:text-indigo-400 transition-colors">Start Instant Meeting</h4>
            <p className="text-[11px] text-zinc-450 dark:text-zinc-400 light:text-zinc-550 mt-0.5 leading-relaxed">Start an immediate room binding.</p>
          </div>
        </button>

        {/* Schedule Secure Meeting Card */}
        <button
          onClick={handleQuickSchedule}
          className="bg-zinc-950/60 dark:bg-zinc-950/60 light:bg-white border border-zinc-900 dark:border-zinc-900 light:border-zinc-200 p-6 rounded-3xl flex items-center gap-5 shadow-lg hover:-translate-y-1.5 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 light:hover:border-indigo-300 transition-all duration-300 text-left cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 dark:text-cyan-400 light:text-cyan-600 shadow-inner group-hover:scale-110 transition-transform">
            <Calendar className="w-5.5 h-5.5" />
          </div>
          <div className="flex flex-col">
            <h4 className="text-sm font-black text-white dark:text-white light:text-zinc-855 group-hover:text-cyan-400 transition-colors">Schedule Secure Meeting</h4>
            <p className="text-[11px] text-zinc-450 dark:text-zinc-400 light:text-zinc-550 mt-0.5 leading-relaxed">Setup future timezone rooms.</p>
          </div>
        </button>

        {/* Join by Invitations Card */}
        <button
          onClick={handleQuickInvitationsTab}
          className="bg-zinc-950/60 dark:bg-zinc-950/60 light:bg-white border border-zinc-900 dark:border-zinc-900 light:border-zinc-200 p-6 rounded-3xl flex items-center gap-5 shadow-lg hover:-translate-y-1.5 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 light:hover:border-indigo-300 transition-all duration-300 text-left cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-450 light:text-emerald-650 shadow-inner group-hover:scale-110 transition-transform relative">
            <Inbox className="w-5.5 h-5.5" />
            {incomingInvitations.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 border border-zinc-950 dark:border-zinc-950 light:border-white rounded-full flex items-center justify-center text-[8px] text-white font-extrabold animate-pulse">
                {incomingInvitations.length}
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <h4 className="text-sm font-black text-white dark:text-white light:text-zinc-855 group-hover:text-emerald-400 transition-colors">Invitations</h4>
            <p className="text-[11px] text-zinc-450 dark:text-zinc-400 light:text-zinc-550 mt-0.5 leading-relaxed">View pending secure calls.</p>
          </div>
        </button>
      </div>

      {/* Redesigned Statistics Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Meetings */}
        <div className="bg-zinc-950/60 dark:bg-zinc-950/60 light:bg-white border border-zinc-900 dark:border-zinc-900 light:border-zinc-200 p-6 rounded-3xl flex items-center justify-between shadow-lg hover:-translate-y-1.5 hover:border-zinc-800 dark:hover:border-zinc-800 light:hover:border-zinc-300 hover:shadow-indigo-500/5 transition-all duration-300 group">
          <div className="flex flex-col gap-1 text-left">
            <span className="text-[9px] text-zinc-500 dark:text-zinc-500 light:text-zinc-400 uppercase font-bold tracking-widest">Total Meetings</span>
            <span className="text-2xl sm:text-3xl font-black text-white dark:text-white light:text-zinc-900">
              <AnimatedCounter value={totalMeetings} />
            </span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-400 light:text-zinc-550 mt-1 font-semibold">Sessions recorded</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-zinc-900/60 dark:bg-zinc-900/60 light:bg-zinc-100 border border-zinc-850 dark:border-zinc-850 light:border-zinc-200 flex items-center justify-center text-indigo-500 dark:text-indigo-400 light:text-indigo-650 shadow-inner group-hover:scale-110 group-hover:shadow-indigo-500/20 transition-all">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Live Meetings */}
        <div className="bg-zinc-950/60 dark:bg-zinc-950/60 light:bg-white border border-zinc-900 dark:border-zinc-900 light:border-zinc-200 p-6 rounded-3xl flex items-center justify-between shadow-lg hover:-translate-y-1.5 hover:border-zinc-800 dark:hover:border-zinc-800 light:hover:border-zinc-300 hover:shadow-emerald-500/5 transition-all duration-300 group">
          <div className="flex flex-col gap-1 text-left">
            <span className="text-[9px] text-zinc-500 dark:text-zinc-500 light:text-zinc-400 uppercase font-bold tracking-widest">Live Sessions</span>
            <span className="text-2xl sm:text-3xl font-black text-white dark:text-white light:text-zinc-900">
              <AnimatedCounter value={liveMeetings} />
            </span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-400 light:text-zinc-550 mt-1 font-semibold">Active voice channels</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-zinc-900/60 dark:bg-zinc-900/60 light:bg-zinc-100 border border-zinc-850 dark:border-zinc-850 light:border-zinc-200 flex items-center justify-center text-emerald-500 dark:text-emerald-450 light:text-emerald-600 shadow-inner group-hover:scale-110 group-hover:shadow-emerald-500/20 transition-all">
            <Video className="w-5 h-5" />
          </div>
        </div>

        {/* Participants */}
        <div className="bg-zinc-950/60 dark:bg-zinc-950/60 light:bg-white border border-zinc-900 dark:border-zinc-900 light:border-zinc-200 p-6 rounded-3xl flex items-center justify-between shadow-lg hover:-translate-y-1.5 hover:border-zinc-800 dark:hover:border-zinc-800 light:hover:border-zinc-300 hover:shadow-cyan-500/5 transition-all duration-300 group">
          <div className="flex flex-col gap-1 text-left">
            <span className="text-[9px] text-zinc-500 dark:text-zinc-500 light:text-zinc-400 uppercase font-bold tracking-widest">Participants</span>
            <span className="text-2xl sm:text-3xl font-black text-white dark:text-white light:text-zinc-900">
              <AnimatedCounter value={totalParticipants} />
            </span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-400 light:text-zinc-550 mt-1 font-semibold">Invited members</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-zinc-900/60 dark:bg-zinc-900/60 light:bg-zinc-100 border border-zinc-850 dark:border-zinc-850 light:border-zinc-200 flex items-center justify-center text-cyan-500 dark:text-cyan-400 light:text-cyan-600 shadow-inner group-hover:scale-110 group-hover:shadow-cyan-500/20 transition-all">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Platform Security */}
        <div className="bg-zinc-950/60 dark:bg-zinc-950/60 light:bg-white border border-zinc-900 dark:border-zinc-900 light:border-zinc-200 p-6 rounded-3xl flex items-center justify-between shadow-lg hover:-translate-y-1.5 hover:border-zinc-800 dark:hover:border-zinc-800 light:hover:border-zinc-300 hover:shadow-rose-500/5 transition-all duration-300 group">
          <div className="flex flex-col gap-1 text-left">
            <span className="text-[9px] text-zinc-500 dark:text-zinc-500 light:text-zinc-400 uppercase font-bold tracking-widest">Security Status</span>
            <span className="text-lg font-black text-emerald-500 dark:text-emerald-450 light:text-emerald-600 uppercase tracking-wide mt-1.5 flex items-center gap-1">
              <Shield className="w-4 h-4 shrink-0" />
              <span>Linkless Active</span>
            </span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-400 light:text-zinc-555 mt-1 font-semibold">Binding protection</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-zinc-900/60 dark:bg-zinc-900/60 light:bg-zinc-100 border border-zinc-850 dark:border-zinc-850 light:border-zinc-200 flex items-center justify-center text-rose-500 dark:text-rose-455 light:text-rose-600 shadow-inner group-hover:scale-110 group-hover:shadow-rose-500/20 transition-all">
            <Lock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid Content (Primary action Left, Sidebar list Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Create & Schedule Meeting Form (lg:col-span-2) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="text-left">
            <h3 className="text-lg font-bold text-white dark:text-white light:text-zinc-850 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400 light:text-indigo-650" />
              <span>Create or Schedule Secure Meeting</span>
            </h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-550 mt-1 leading-relaxed">
              Define meeting parameters. Since NeuraMeet utilizes linkless security, users join via their unique username bindings and real-time socket signals.
            </p>
          </div>

          <div className="bg-zinc-950/60 dark:bg-[#09090b] light:bg-white border border-zinc-900 dark:border-zinc-900 light:border-zinc-200 p-8 rounded-3xl shadow-xl flex flex-col gap-6 text-left">
            <form onSubmit={handleCreateMeeting} className="flex flex-col gap-6">
              
              {/* Section 1: Title Input with leading icon */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-400 light:text-zinc-650 uppercase tracking-widest">Step 1: Meeting Title</label>
                <div className="relative flex items-center">
                  <Video className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
                  <input 
                    ref={titleInputRef}
                    type="text" 
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    placeholder="Enter a descriptive title (e.g. Frontend Design Review)" 
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#18181B] border border-zinc-300 dark:border-zinc-800 text-xs rounded-xl text-zinc-950 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              {/* Section 2: Meeting Type Selector Cards */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-400 light:text-zinc-650 uppercase tracking-widest">Step 2: Meeting Type</label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Instant Meeting Card */}
                  <div 
                    onClick={() => {
                      setIsFutureScheduled(false);
                      setSchedulingError('');
                    }}
                    className={`p-5 rounded-2xl border text-left cursor-pointer transition-all duration-300 flex flex-col gap-3 group relative overflow-hidden select-none ${
                      !isFutureScheduled 
                        ? 'bg-indigo-950/15 dark:bg-indigo-950/15 light:bg-indigo-50/50 border-indigo-500/80 dark:border-indigo-500/80 light:border-indigo-400 shadow-lg shadow-indigo-500/5'
                        : 'bg-white dark:bg-[#18181B] border-zinc-200 dark:border-zinc-800 hover:border-zinc-350 dark:hover:border-zinc-700 hover:shadow-md'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                        !isFutureScheduled
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/25'
                          : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-550 dark:text-zinc-400 group-hover:scale-105'
                      }`}>
                        <Zap className="w-5 h-5" />
                      </div>
                      {!isFutureScheduled && (
                        <div className="w-5 h-5 rounded-full bg-indigo-600 border border-indigo-500 flex items-center justify-center text-white shadow shadow-indigo-500/10">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className={`text-sm font-extrabold transition-colors ${
                        !isFutureScheduled
                          ? 'text-indigo-600 dark:text-indigo-400 light:text-indigo-800'
                          : 'text-zinc-800 dark:text-zinc-100'
                      }`}>Instant Meeting</h4>
                      <p className="text-[11px] text-zinc-450 dark:text-zinc-455 light:text-zinc-550 mt-1 leading-relaxed">Start immediately. Ideal for ad-hoc troubleshooting calls.</p>
                    </div>
                  </div>

                  {/* Scheduled Meeting Card */}
                  <div 
                    onClick={() => {
                      setIsFutureScheduled(true);
                      setSchedulingError('');
                    }}
                    className={`p-5 rounded-2xl border text-left cursor-pointer transition-all duration-300 flex flex-col gap-3 group relative overflow-hidden select-none ${
                      isFutureScheduled 
                        ? 'bg-indigo-950/15 dark:bg-indigo-950/15 light:bg-indigo-50/50 border-indigo-500/80 dark:border-indigo-500/80 light:border-indigo-400 shadow-lg shadow-indigo-500/5'
                        : 'bg-white dark:bg-[#18181B] border-zinc-200 dark:border-zinc-800 hover:border-zinc-350 dark:hover:border-zinc-700 hover:shadow-md'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                        isFutureScheduled
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/25'
                          : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-550 dark:text-zinc-400 group-hover:scale-105'
                      }`}>
                        <Calendar className="w-5 h-5" />
                      </div>
                      {isFutureScheduled && (
                        <div className="w-5 h-5 rounded-full bg-indigo-600 border border-indigo-500 flex items-center justify-center text-white shadow shadow-indigo-500/10">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className={`text-sm font-extrabold transition-colors ${
                        isFutureScheduled
                          ? 'text-indigo-600 dark:text-indigo-400 light:text-indigo-800'
                          : 'text-zinc-800 dark:text-zinc-100'
                      }`}>Schedule Meeting</h4>
                      <p className="text-[11px] text-zinc-450 dark:text-zinc-455 light:text-zinc-550 mt-1 leading-relaxed">Choose date and timezone offset. Ideal for calendar planning.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2.5: Scheduling Date & Time Selectors */}
              <AnimatePresence>
                {isFutureScheduled && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col gap-4 overflow-hidden border-t border-zinc-200 dark:border-zinc-900 light:border-zinc-150 pt-5 mt-1"
                  >
                    <label className="text-[10px] font-extrabold text-zinc-450 dark:text-zinc-400 light:text-zinc-650 uppercase tracking-widest">Time & Date Parameters</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1.5 text-left col-span-1">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Date</label>
                        <input
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-[#18181B] border border-zinc-300 dark:border-zinc-850 text-xs rounded-lg text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors font-medium"
                          required={isFutureScheduled}
                        />
                      </div>
                      
                      <div className="flex flex-col gap-1.5 text-left col-span-1">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Time</label>
                        <input
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-[#18181B] border border-zinc-300 dark:border-zinc-850 text-xs rounded-lg text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors font-medium"
                          required={isFutureScheduled}
                        />
                      </div>

                      <div className="flex flex-col gap-1.5 text-left col-span-2 sm:col-span-1">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                          <Globe className="w-3 h-3 text-indigo-400" />
                          <span>Timezone</span>
                        </label>
                        <select
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-[#18181B] border border-zinc-300 dark:border-zinc-850 text-xs rounded-lg text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors cursor-pointer font-medium"
                        >
                          {timezones.map((tz) => (
                            <option key={tz.value} value={tz.value}>
                              {tz.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Section 3: Invite Members with Search Suggestions Autocomplete */}
              <div className="flex flex-col gap-3 border-t border-zinc-200 dark:border-zinc-900 light:border-zinc-150 pt-5">
                <label className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-400 light:text-zinc-650 uppercase tracking-widest">Step 3: Secure Invites</label>
                
                {/* Invite Chips List */}
                {inviteesList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-3.5 rounded-2xl bg-zinc-100/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 animate-slide-in">
                    {inviteesList.map((user) => (
                      <span 
                        key={user} 
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/30 text-[10px] text-indigo-700 dark:text-indigo-300 font-extrabold shadow-sm select-none"
                      >
                        @{user}
                        <button 
                          type="button" 
                          onClick={() => handleRemoveInvitee(user)}
                          className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-indigo-200 dark:hover:bg-indigo-900 hover:text-indigo-900 dark:hover:text-white transition-colors cursor-pointer text-indigo-400"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Invite Autocomplete Dropdown Search Input */}
                <div className="relative w-full flex flex-col gap-1" ref={dropdownRef}>
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
                    <input 
                      type="text" 
                      value={inviteeInput}
                      onChange={(e) => handleInviteeInputChange(e.target.value)}
                      onFocus={() => setShowSuggestionsDropdown(suggestions.length > 0)}
                      placeholder="Type username to invite..." 
                      className="w-full pl-10 pr-24 py-3 bg-white dark:bg-[#18181B] border border-zinc-300 dark:border-zinc-800 text-xs rounded-xl text-zinc-950 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                    />
                    
                    {/* Small Secondary Action Button inside input */}
                    <button 
                      type="button" 
                      onClick={handleAddInvitee}
                      disabled={!inviteeInput.trim()}
                      className="absolute right-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-850 border border-zinc-350 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-[10px] rounded-lg transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Invite User
                    </button>
                  </div>

                  {/* Dropdown Box for Autocomplete suggestions */}
                  <AnimatePresence>
                    {showSuggestionsDropdown && suggestions.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 z-30 bg-white dark:bg-[#18181B] border border-zinc-300 dark:border-zinc-850 rounded-xl mt-1.5 max-h-48 overflow-y-auto shadow-xl flex flex-col p-1.5"
                      >
                        {suggestions.map((name) => (
                          <div
                            key={name}
                            onClick={() => selectSuggestion(name)}
                            className="px-3.5 py-2.5 rounded-lg text-xs text-zinc-800 dark:text-zinc-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold text-left cursor-pointer transition-colors flex items-center justify-between"
                          >
                            <span>@{name}</span>
                            <span className="text-[10px] text-zinc-405 dark:text-zinc-550 uppercase tracking-widest font-extrabold">Registered Peer</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {inviteeError && <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1.5">⚠ {inviteeError}</span>}
              </div>

              {/* Status Indicators */}
              {schedulingError && (
                <div className="p-3.5 bg-rose-950/20 border border-rose-900/30 rounded-xl text-[11px] font-semibold text-rose-455 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{schedulingError}</span>
                </div>
              )}
              {schedulingSuccess && (
                <div className="p-3.5 bg-emerald-950/20 border border-emerald-900/30 rounded-xl text-[11px] font-semibold text-emerald-450 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>Success! Secure Linkless Meeting created. Invitees notified.</span>
                </div>
              )}

              {/* Redesigned 56px Height Primary Rocket CTA Button */}
              <button 
                type="submit" 
                disabled={creatingMeeting}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-650 to-indigo-700 text-white font-black text-sm tracking-wide shadow-lg shadow-indigo-600/10 hover:shadow-indigo-500/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
              >
                {creatingMeeting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Encrypting & Launching Room...</span>
                  </>
                ) : (
                  <>
                    <span className="text-base select-none">🚀</span>
                    <span>Create Secure Meeting Room</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Split Tab Sidebar (Invitations & Hosted Rooms) */}
        <div className="lg:col-span-1 flex flex-col gap-6 text-left" ref={sidebarContainerRef}>
          
          {/* Segmented Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-zinc-900/30 dark:bg-zinc-950/40 light:bg-zinc-150 p-1 rounded-2xl border border-zinc-850 dark:border-zinc-900 light:border-zinc-250 select-none shadow-sm">
            <button
              onClick={() => setActiveSidebarTab('invitations')}
              className={`py-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeSidebarTab === 'invitations'
                  ? 'bg-white dark:bg-zinc-900 light:bg-white text-indigo-500 dark:text-indigo-400 light:text-indigo-700 shadow-sm border border-zinc-200 dark:border-zinc-800'
                  : 'text-zinc-500 hover:text-zinc-350 light:text-zinc-600 light:hover:text-zinc-800'
              }`}
            >
              <span>📨 Invitations</span>
              {incomingInvitations.length > 0 && (
                <span className="px-1.5 py-0.25 bg-indigo-500 text-white text-[9px] rounded-md font-bold">
                  {incomingInvitations.length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setActiveSidebarTab('hosted')}
              className={`py-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeSidebarTab === 'hosted'
                  ? 'bg-white dark:bg-zinc-900 light:bg-white text-indigo-500 dark:text-indigo-400 light:text-indigo-700 shadow-sm border border-zinc-200 dark:border-zinc-800'
                  : 'text-zinc-500 hover:text-zinc-350 light:text-zinc-600 light:hover:text-zinc-800'
              }`}
            >
              <span>🛡 Hosted Rooms</span>
              {hostedMeetings.length > 0 && (
                <span className="px-1.5 py-0.25 bg-zinc-800 text-zinc-400 text-[9px] rounded-md font-bold">
                  {hostedMeetings.length}
                </span>
              )}
            </button>
          </div>

          {/* Quick Search filtering input */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={meetingsSearchQuery}
              onChange={(e) => setMeetingsSearchQuery(e.target.value)}
              placeholder={`Filter ${activeSidebarTab}...`}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#18181B] border border-zinc-300 dark:border-zinc-800 text-xs rounded-full text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-zinc-450 dark:placeholder:text-zinc-500 shadow-sm"
            />
          </div>

          {/* Tab Render Area */}
          <div className="flex flex-col gap-5 max-h-[850px] overflow-y-auto custom-scrollbar pr-0.5">
            
            {activeSidebarTab === 'invitations' ? (
              /* TAB 1: INVITATIONS FEED */
              filteredInvitations.length === 0 ? (
                <div className="bg-zinc-950/60 dark:bg-zinc-950/60 light:bg-white border border-zinc-900 dark:border-zinc-900 light:border-zinc-200 rounded-3xl p-10 text-center flex flex-col items-center justify-center gap-4 shadow-lg">
                  <EmptyInvitationsIllustration />
                  <div className="flex flex-col gap-1">
                    <h4 className="text-base font-bold text-white dark:text-white light:text-zinc-850">No Invitations</h4>
                    <p className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-500 max-w-[220px] mx-auto leading-relaxed">
                      When someone invites you to a secure meeting, it will appear here instantly.
                    </p>
                  </div>
                </div>
              ) : (
                filteredInvitations.map((meeting) => {
                  const expired = isInvitationExpired(meeting);
                  return (
                    <div 
                      key={meeting.id} 
                      className="bg-zinc-950/60 dark:bg-zinc-950/60 light:bg-white border border-zinc-900 dark:border-zinc-900 light:border-zinc-200 p-5 rounded-2xl shadow-lg hover:shadow-xl hover:border-zinc-800 dark:hover:border-zinc-850 light:hover:border-zinc-300 transition-all duration-300 flex flex-col gap-4 text-left relative overflow-hidden"
                    >
                      {expired && (
                        <div className="absolute top-2 right-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-455 text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded">
                          Expired
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${meeting.host}`}
                          alt={meeting.host}
                          className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800"
                        />
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-550 font-bold uppercase tracking-wider">Incoming Invitation</span>
                          <h4 className="text-sm font-black text-white dark:text-white light:text-zinc-900 mt-0.5 line-clamp-1">{meeting.title}</h4>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 pt-3 text-xs text-zinc-400 dark:text-zinc-450 light:text-zinc-550 border-t border-zinc-900 dark:border-zinc-900 light:border-zinc-150">
                        <span className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-indigo-500/50" />
                          <span>Host: <strong className="text-zinc-200 dark:text-zinc-200 light:text-zinc-800">@{meeting.host}</strong></span>
                        </span>
                        
                        {meeting.scheduledAt && (
                          <span className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-indigo-500/50" />
                            <span>Scheduled: <strong className="text-indigo-400">{formatScheduledTime(meeting.scheduledAt)}</strong></span>
                          </span>
                        )}

                        <span className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-cyan-500/50" />
                          <span>Invited: <strong>{getRelativeTime(meeting.createdAt)}</strong></span>
                        </span>

                        <span className="text-[10px] text-zinc-550 dark:text-zinc-650 font-mono mt-1">
                          Meeting ID: {meeting.id}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        {!expired ? (
                          <Link 
                            href={`/meetings/${meeting.id}`}
                            className="flex-grow text-center py-2.5 rounded-xl glowing-button text-white text-xs font-bold shadow active:scale-[0.98] transition-all"
                          >
                            Join Meeting
                          </Link>
                        ) : (
                          <button 
                            disabled 
                            className="flex-grow text-center py-2.5 rounded-xl bg-zinc-900 border border-zinc-850 text-zinc-550 text-xs font-bold cursor-not-allowed"
                          >
                            Invitation Expired
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteMeeting(meeting.id)}
                          className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all shrink-0 cursor-pointer active:scale-95"
                          title="Decline Invitation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              /* TAB 2: MY HOSTED ROOMS FEED */
              filteredHosted.length === 0 ? (
                <div className="bg-zinc-950/60 dark:bg-zinc-950/60 light:bg-white border border-zinc-900 dark:border-zinc-900 light:border-zinc-200 rounded-3xl p-10 text-center flex flex-col items-center justify-center gap-4 shadow-lg">
                  <EmptyHostedIllustration />
                  <div className="flex flex-col gap-1">
                    <h4 className="text-base font-bold text-white dark:text-white light:text-zinc-850">No Hosted Rooms</h4>
                    <p className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-500 max-w-[220px] mx-auto leading-relaxed">
                      Start an instant meeting or schedule a session to host security-controlled rooms.
                    </p>
                  </div>
                  <button
                    onClick={() => titleInputRef.current?.focus()}
                    className="px-4 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white font-extrabold text-[11px] transition-all"
                  >
                    Host Room
                  </button>
                </div>
              ) : (
                filteredHosted.map((meeting) => (
                  <div 
                    key={meeting.id} 
                    className="bg-zinc-950/60 dark:bg-zinc-950/60 light:bg-white border border-zinc-900 dark:border-zinc-900 light:border-zinc-200 p-5 rounded-2xl shadow-lg hover:shadow-xl hover:border-zinc-800 dark:hover:border-zinc-850 light:hover:border-zinc-300 transition-all duration-300 flex flex-col gap-4 text-left group"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md border flex items-center gap-1.5 ${
                          meeting.status === 'active' 
                            ? 'bg-emerald-950/60 border-emerald-900 text-emerald-400' 
                            : meeting.status === 'ended'
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-400'
                            : 'bg-indigo-950/60 border-indigo-900 text-indigo-400'
                        }`}>
                          {meeting.status === 'active' ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Live Now</span>
                            </>
                          ) : meeting.status === 'ended' ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                              <span>Ended</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                              <span>Scheduled</span>
                            </>
                          )}
                        </span>
                        <span className="text-[10px] text-zinc-505 dark:text-zinc-550 light:text-zinc-450 font-mono flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{getRelativeTime(meeting.createdAt)}</span>
                        </span>
                      </div>
                      
                      <h4 className="text-base font-extrabold text-white dark:text-white light:text-zinc-850 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 mt-1">
                        {meeting.title}
                      </h4>
                      
                      {/* Strictly Static Meeting ID metadata */}
                      <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-500 light:text-zinc-600 bg-zinc-900 dark:bg-zinc-900/60 light:bg-zinc-100 border border-zinc-850 dark:border-zinc-850 light:border-zinc-200 px-2 py-0.5 rounded w-max select-text">
                        Meeting ID: {meeting.id}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2.5 pt-3 text-xs text-zinc-400 dark:text-zinc-450 light:text-zinc-555 border-t border-zinc-900 dark:border-zinc-900 light:border-zinc-150">
                      {meeting.scheduledAt && new Date(meeting.scheduledAt).getTime() > Date.now() && meeting.status === 'scheduled' && (
                        <span className="flex items-center gap-2 text-indigo-400 dark:text-indigo-400 light:text-indigo-650">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Scheduled: <strong className="font-bold text-indigo-300 dark:text-indigo-300 light:text-indigo-750">{formatScheduledTime(meeting.scheduledAt)}</strong></span>
                        </span>
                      )}
                      
                      <span className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-cyan-500/50" />
                        <span className="flex-grow">Invitees: <strong className="text-zinc-200 dark:text-zinc-200 light:text-zinc-800">{meeting.invitees.length} User(s)</strong></span>
                        <button
                          onClick={() => {
                            if (activeAddMemberId === meeting.id) {
                              setActiveAddMemberId(null);
                            } else {
                              setActiveAddMemberId(meeting.id);
                              setAddMemberInput('');
                              setAddMemberError('');
                              setAddMemberSuccess('');
                            }
                          }}
                          className="p-1 rounded bg-[#09090B] dark:bg-[#09090B] light:bg-zinc-100 border border-zinc-855 dark:border-zinc-850 light:border-zinc-200 hover:bg-zinc-800 dark:hover:bg-zinc-800 light:hover:bg-zinc-200 text-cyan-450 dark:text-cyan-455 light:text-cyan-600 hover:text-cyan-300 transition-all cursor-pointer flex items-center justify-center min-w-[20px] h-[20px]"
                          title="Add members by username"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                        </button>
                      </span>

                      {/* Inline Add Member Form inside the Sidebar Card */}
                      {activeAddMemberId === meeting.id && (
                        <form 
                          onSubmit={(e) => handleAddMemberToMeeting(e, meeting.id)} 
                          className="flex flex-col gap-2 p-3 bg-zinc-950 dark:bg-[#18181B] light:bg-zinc-50 border border-zinc-900 dark:border-zinc-900 light:border-zinc-200 rounded-xl mt-1 animate-slide-in"
                        >
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={addMemberInput}
                              onChange={(e) => setAddMemberInput(e.target.value)}
                              placeholder="Username..."
                              className="flex-grow px-2.5 py-1 bg-white dark:bg-[#18181B] border border-zinc-350 dark:border-zinc-800 text-[11px] rounded-lg text-zinc-950 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                            <button
                              type="submit"
                              disabled={addingMemberId === meeting.id}
                              className="px-3 py-1 bg-indigo-650 hover:bg-indigo-550 text-white rounded-lg text-[11px] font-bold shadow transition-all cursor-pointer disabled:opacity-50"
                            >
                              {addingMemberId === meeting.id ? 'Adding...' : 'Add'}
                            </button>
                          </div>
                          {addMemberError && <span className="text-[10px] text-rose-450 font-semibold">⚠ {addMemberError}</span>}
                          {addMemberSuccess && <span className="text-[10px] text-emerald-450 font-semibold">✓ {addMemberSuccess}</span>}
                        </form>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      {meeting.status !== 'ended' ? (
                        <Link 
                          href={`/meetings/${meeting.id}`}
                          className="flex-grow text-center py-2.5 rounded-xl glowing-button text-white text-xs font-bold shadow active:scale-[0.98] transition-all"
                        >
                          Join Call
                        </Link>
                      ) : (
                        <button 
                          disabled 
                          className="flex-grow text-center py-2.5 rounded-xl bg-zinc-900 border border-zinc-850 text-zinc-550 text-xs font-bold cursor-not-allowed"
                        >
                          Meeting Closed
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteMeeting(meeting.id)}
                        className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-455 hover:bg-rose-500 hover:text-white rounded-xl transition-all shrink-0 cursor-pointer active:scale-95"
                        title="Delete Meeting completely"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>

      </div>

      {/* Floating WebRTC Live Invitation Alert Card */}
      {activeInvite && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm bg-zinc-950 dark:bg-zinc-950 light:bg-white border border-zinc-900 dark:border-zinc-900 light:border-zinc-200 p-5 rounded-2xl shadow-2xl flex flex-col gap-3 animate-slide-in text-left">
          <div className="flex justify-between items-start gap-2">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold tracking-widest text-indigo-500 dark:text-indigo-400 light:text-indigo-650 font-mono">Incoming Call Invitation</span>
              <h4 className="text-sm font-extrabold text-white dark:text-white light:text-zinc-900 mt-1 line-clamp-1">{activeInvite.title}</h4>
            </div>
            <button 
              onClick={() => setActiveInvite(null)}
              className="text-zinc-500 hover:text-zinc-350 transition-colors p-1 cursor-pointer"
              aria-label="Close incoming call invitation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-zinc-405 dark:text-zinc-400 light:text-zinc-550 leading-relaxed">
            Host <strong className="text-zinc-200 dark:text-zinc-200 light:text-zinc-800">@{activeInvite.hostUsername}</strong> is inviting you to join this meeting room live.
          </p>
          <div className="flex gap-3 mt-1">
            <Link 
              href={`/meetings/${activeInvite.meetingId}`}
              onClick={() => setActiveInvite(null)}
              className="flex-grow text-center py-2 rounded-xl glowing-button text-white text-xs font-bold shadow"
            >
              Join Call
            </Link>
            <button 
              onClick={() => setActiveInvite(null)}
              className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-900 light:bg-zinc-100 border border-zinc-800 dark:border-zinc-850 light:border-zinc-200 text-zinc-450 dark:text-zinc-400 light:text-zinc-650 text-xs font-bold hover:bg-zinc-855 hover:text-white transition-all cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
