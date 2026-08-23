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
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);

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

  // 4. Add username validation to invite list (supports multiple comma-separated usernames)
  const handleAddInvitee = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteeError('');
    
    const rawInput = inviteeInput;
    if (!rawInput.trim()) return;

    const parts = rawInput.split(',').map(p => p.trim().toLowerCase()).filter(Boolean);
    const addedUsernames: string[] = [];
    const failedUsernames: string[] = [];

    for (const invitee of parts) {
      if (profile && invitee === profile.username.toLowerCase()) {
        continue;
      }
      if (inviteesList.includes(invitee) || addedUsernames.includes(invitee)) {
        continue;
      }

      const check = await checkUsernameExistsAction(invitee);
      if (check.exists && check.username) {
        addedUsernames.push(check.username);
      } else {
        failedUsernames.push(invitee);
      }
    }

    if (addedUsernames.length > 0) {
      setInviteesList((prev) => [...prev, ...addedUsernames]);
      setInviteeInput('');
      setSuggestions([]);
      setShowSuggestionsDropdown(false);
    }

    if (failedUsernames.length > 0) {
      setInviteeError(`Colleagues do not exist: ${failedUsernames.map(u => `@${u}`).join(', ')}`);
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
  )  // Construct recent activity events dynamically from meetings
  const getRecentActivity = () => {
    const activity: { id: string; type: string; title: string; time: string; timestamp: number }[] = [];
    meetings.forEach(m => {
      const isHost = m.host.toLowerCase() === profile.username.toLowerCase();
      if (isHost) {
        activity.push({
          id: `${m.id}-create`,
          type: 'create',
          title: `You created "${m.title}"`,
          time: getRelativeTime(m.createdAt),
          timestamp: new Date(m.createdAt).getTime()
        });
      } else {
        activity.push({
          id: `${m.id}-invite`,
          type: 'invite',
          title: `@${m.host} invited you to "${m.title}"`,
          time: getRelativeTime(m.createdAt),
          timestamp: new Date(m.createdAt).getTime()
        });
      }
      if (m.status === 'ended') {
        activity.push({
          id: `${m.id}-end`,
          type: 'end',
          title: `"${m.title}" ended`,
          time: 'Previously',
          timestamp: new Date(m.createdAt).getTime() - 3600000
        });
      }
    });
    return activity.sort((a, b) => b.timestamp - a.timestamp).slice(0, 4);
  };
  
  const recentActivities = getRecentActivity();

  // Filter Today's Meetings
  const isDateToday = (dateStr?: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  const todayMeetings = meetings.filter(m => m.status === 'active' || isDateToday(m.scheduledAt || m.createdAt));
  const sortedTodayMeetings = [...todayMeetings].sort((a, b) => {
    if (a.status === 'active') return -1;
    if (b.status === 'active') return 1;
    return new Date(a.scheduledAt || a.createdAt).getTime() - new Date(b.scheduledAt || b.createdAt).getTime();
  });
  const nextMeetingToday = sortedTodayMeetings[0] || null;

  // Upcoming meetings are future scheduled sessions NOT today
  const upcomingMeetings = meetings.filter(m => 
    m.status === 'scheduled' && 
    !isDateToday(m.scheduledAt) && 
    new Date(m.scheduledAt || m.createdAt).getTime() > Date.now()
  );

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full px-1 text-left select-none relative">
      
      {/* Redesigned Simplified Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest flex items-center gap-1.5 font-sans">
            <Lock className="w-3 h-3 text-muted-text" />
            <span>LINKLESS SESSION</span>
          </span>
          <h2 className="text-2xl font-black text-primary-text mt-1.5 leading-tight">
            {getGreeting(profile.fullName)}
          </h2>
          <p className="text-xs text-secondary-text mt-1 font-semibold">
            {todayMeetings.length > 0 
              ? `You have ${todayMeetings.length} meeting${todayMeetings.length === 1 ? '' : 's'} scheduled for today.`
              : 'No meetings scheduled today.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchMeetings} 
            className="px-4 py-2.5 rounded-xl bg-surface border border-border text-secondary-text hover:text-primary-text hover:bg-zinc-150/20 dark:hover:bg-zinc-900/30 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98]"
            title="Refresh database and sync sockets"
          >
            <RefreshCw className="w-3.5 h-3.5 text-secondary-text" />
            <span>Sync</span>
          </button>
          
          <button
            onClick={() => setIsCreateDrawerOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-extrabold text-xs active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer border-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Meeting</span>
          </button>
        </div>
      </div>

      {/* Main Workspace split columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Today & Upcoming schedule */}
        <div className="lg:col-span-2 flex flex-col gap-8">
                   {/* TODAY Priority section */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-text">
              Today
            </h3>

            {nextMeetingToday ? (
              <div className="relative group overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all select-none">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary">
                        Next Session
                      </span>
                      
                      {nextMeetingToday.status === 'active' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-success-custom/10 border border-success-custom/20 text-success-custom text-[9.5px] font-black uppercase tracking-wider animate-pulse">
                          <span className="w-1.5 h-1.5 bg-success-custom rounded-full animate-ping" />
                          Live Now
                        </span>
                      )}
                      
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-text font-mono">
                        ID: {nextMeetingToday.id}
                      </span>
                    </div>
                    
                    <h4 className="text-lg font-black text-primary-text mt-2 truncate">
                      {nextMeetingToday.title}
                    </h4>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-secondary-text font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>
                          {nextMeetingToday.scheduledAt 
                            ? formatScheduledTime(nextMeetingToday.scheduledAt) 
                            : 'Instant Session'}
                        </span>
                      </span>
                      
                      <span>•</span>
                      
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-cyan-custom" />
                        <span>
                          {nextMeetingToday.invitees.length} Invited
                        </span>
                      </span>
                      
                      <span>•</span>
                      
                      <span className="text-primary font-extrabold uppercase tracking-wide flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Linkless Secure</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="shrink-0">
                    <Link
                      href={`/meetings/${nextMeetingToday.id}`}
                      className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-extrabold text-xs shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer border-0"
                    >
                      <span>Join Meeting</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border p-8 text-center bg-surface flex flex-col items-center justify-center gap-4 shadow-sm select-none">
                <Calendar className="w-6 h-6 text-primary" />
                <div>
                  <h4 className="text-sm font-extrabold text-primary-text">No meetings today</h4>
                  <p className="text-xs text-secondary-text mt-1 max-w-xs leading-relaxed font-semibold">
                    Your schedule is clear. Create a meeting whenever you're ready.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateDrawerOpen(true)}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer border-0"
                >
                  + Create Meeting
                </button>
              </div>
            )}
          </div>

          {/* UPCOMING schedule section */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-text">
              Upcoming
            </h3>
            
            {upcomingMeetings.length === 0 ? (
              <div className="py-6 text-left select-none">
                <h4 className="text-xs font-extrabold text-primary-text">No upcoming meetings</h4>
                <p className="text-xs text-secondary-text mt-0.5 font-semibold">Your next scheduled meeting will appear here.</p>
              </div>
            ) : (
              <div className="flex flex-col bg-surface border border-border rounded-2xl divide-y divide-border overflow-hidden shadow-sm">
                {upcomingMeetings.map((meeting) => (
                  <div 
                    key={meeting.id} 
                    className="group p-4 flex items-center justify-between gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors text-xs"
                  >
                    <div className="flex-grow min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold text-primary-text truncate">
                          {meeting.title}
                        </h4>
                        <span className="text-[9px] font-mono text-muted-text opacity-0 group-hover:opacity-100 transition-opacity">
                          ID: {meeting.id}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-secondary-text font-semibold">
                        <span>{meeting.scheduledAt ? formatScheduledTime(meeting.scheduledAt) : ''}</span>
                        <span>•</span>
                        <span className="text-cyan-custom font-extrabold">{meeting.invitees.length} participant{meeting.invitees.length === 1 ? '' : 's'}</span>
                        <span>•</span>
                        <span className="text-primary font-black uppercase tracking-wider text-[9px] flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" />
                          Linkless
                        </span>
                      </div>
                    </div>
                    
                    <div className="shrink-0 flex items-center gap-2">
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
                        className="p-2 rounded-lg border border-border text-secondary-text hover:text-primary-text hover:bg-zinc-150/20 dark:hover:bg-zinc-900/30 cursor-pointer transition-colors"
                        title="Add members by username"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                      </button>

                      <Link 
                        href={`/meetings/${meeting.id}`}
                        className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover border-0 text-white font-extrabold text-[10px] rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>Join</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>

                      <button
                        onClick={() => handleDeleteMeeting(meeting.id)}
                        className="p-2 border border-border hover:bg-rose-500/10 hover:text-danger rounded-lg transition-colors text-secondary-text cursor-pointer"
                        title="Remove Meeting"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Inline Add User form for active row */}
            {activeAddMemberId && (
              <form 
                onSubmit={(e) => handleAddMemberToMeeting(e, activeAddMemberId)} 
                className="flex flex-col gap-2 p-4 bg-white dark:bg-[#0c0f19]/60 border border-zinc-200 dark:border-zinc-900 rounded-2xl mt-2 animate-slide-in max-w-md shadow-lg"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={addMemberInput}
                    onChange={(e) => setAddMemberInput(e.target.value)}
                    placeholder="Username to add..."
                    className="flex-grow px-3 py-1.5 bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 text-xs rounded-xl text-zinc-950 dark:text-zinc-100 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={addingMemberId === activeAddMemberId}
                    className="px-4 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {addingMemberId === activeAddMemberId ? 'Adding...' : 'Add'}
                  </button>
                </div>
                {addMemberError && <span className="text-[10px] text-rose-500 font-semibold">⚠ {addMemberError}</span>}
                {addMemberSuccess && <span className="text-[10px] text-emerald-500 font-semibold">✓ {addMemberSuccess}</span>}
              </form>
            )}
          </div>

        </div>

        {/* Right Column: Timeline and Statistics */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          
          {/* RECENT ACTIVITY Timeline */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-text">
              Recent Activity
            </h3>
            
            {recentActivities.length === 0 ? (
              <div className="border border-border rounded-2xl p-6 text-center text-xs text-muted-text bg-surface">
                No recent activity recorded.
              </div>
            ) : (
              <div className="relative pl-5 flex flex-col gap-6 before:absolute before:left-[4px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-border select-none text-left">
                {recentActivities.map((act, index) => {
                  const isNewest = index === 0 && (act.time.includes('minute') || act.time.includes('second') || act.time.includes('now'));
                  return (
                    <div key={act.id} className="relative flex flex-col gap-1 text-xs">
                      <span className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border border-background ${
                        isNewest 
                          ? 'bg-primary ring-2 ring-primary/20' 
                          : 'bg-muted-text'
                      }`} />
                      
                      <span className={`leading-normal ${isNewest ? 'font-bold text-primary-text' : 'font-medium text-secondary-text'}`}>
                        {act.title}
                      </span>
                      <span className="text-[10px] text-muted-text">
                        {act.time}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SESSION OVERVIEW METADATA STATS */}
          <div className="flex flex-col gap-4 border-t border-border pt-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-text">
              Meeting Overview
            </h3>
            
            <div className="grid grid-cols-2 gap-4 select-none text-left">
              <div className="bg-surface border border-border p-4 rounded-xl flex flex-col gap-1 shadow-sm">
                <span className="text-[9px] font-black text-muted-text uppercase tracking-widest">Total Rooms</span>
                <span className="text-xl font-black text-primary-text">
                  <AnimatedCounter value={totalMeetings} />
                </span>
              </div>
              
              <div className="bg-surface border border-border p-4 rounded-xl flex flex-col gap-1 shadow-sm">
                <span className="text-[9px] font-black text-muted-text uppercase tracking-widest">Live Now</span>
                <span className={`text-xl font-black ${liveMeetings > 0 ? 'text-success-custom' : 'text-primary-text'}`}>
                  <AnimatedCounter value={liveMeetings} />
                </span>
              </div>
              
              <div className="bg-surface border border-border p-4 rounded-xl flex flex-col gap-1 col-span-2 shadow-sm">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-black text-muted-text uppercase tracking-widest">Invited Whitelist</span>
                    <span className="text-xs font-bold text-secondary-text mt-1">
                      {totalParticipants} authenticated peers
                    </span>
                  </div>
                  <Shield className="w-5 h-5 text-primary" />
                </div>
              </div>

              <div className="bg-surface border border-border p-3 rounded-xl col-span-2 flex items-center gap-2.5 text-[11px] text-secondary-text font-semibold shadow-sm">
                <Shield className="w-4 h-4 text-success-custom shrink-0" />
                <span>
                  <strong className="text-primary-text">LINKLESS ACCESS</strong>: Invite-only secure whitelist active.
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Slide-out Create Meeting Drawer Overlay Backdrop */}
      {isCreateDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xs z-45"
          onClick={() => setIsCreateDrawerOpen(false)}
        />
      )}

      {/* Slide-out Create Meeting Drawer */}
      <AnimatePresence>
        {isCreateDrawerOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[460px] bg-white dark:bg-[#09090b] border-l border-zinc-200 dark:border-zinc-900 shadow-2xl z-50 p-6 flex flex-col justify-between overflow-y-auto text-left"
          >
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-900">
                <div>
                  <span className="text-[9px] font-black text-indigo-505 dark:text-indigo-400 uppercase tracking-widest font-mono">NeuraMeet Workspace</span>
                  <h3 className="text-base font-black text-zinc-900 dark:text-white mt-0.5">NEW MEETING</h3>
                </div>
                <button
                  onClick={() => setIsCreateDrawerOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-zinc-105 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-650 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Form Body */}
              <form onSubmit={handleCreateMeeting} className="flex flex-col gap-5 mt-6">
                
                {/* Meeting Title */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-extrabold text-zinc-450 dark:text-zinc-400 uppercase tracking-widest">Meeting Title</label>
                  <div className="relative flex items-center">
                    <Video className="w-4 h-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
                    <input 
                      ref={titleInputRef}
                      type="text" 
                      value={meetingTitle}
                      onChange={(e) => setMeetingTitle(e.target.value)}
                      placeholder="Title (e.g. Design Sync)" 
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 text-xs rounded-xl text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                      required
                    />
                  </div>
                </div>

                {/* Invite Members */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-extrabold text-zinc-455 dark:text-zinc-400 uppercase tracking-widest">Invite Participants</label>
                  
                  {/* Selected user chips */}
                  {inviteesList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-zinc-50 dark:bg-[#0c0f19]/60 border border-zinc-200 dark:border-zinc-900">
                      {inviteesList.map((user) => (
                        <span 
                          key={user} 
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-55 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/30 text-[10px] text-indigo-700 dark:text-indigo-300 font-bold"
                        >
                          @{user}
                          <button 
                            type="button" 
                            onClick={() => handleRemoveInvitee(user)}
                            className="text-indigo-400 hover:text-indigo-600 ml-1 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Autocomplete Input */}
                  <div className="relative w-full flex flex-col gap-1" ref={dropdownRef}>
                    <div className="relative flex items-center">
                      <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
                      <input 
                        type="text" 
                        value={inviteeInput}
                        onChange={(e) => handleInviteeInputChange(e.target.value)}
                        onFocus={() => setShowSuggestionsDropdown(suggestions.length > 0)}
                        placeholder="Type username..." 
                        className="w-full pl-10 pr-24 py-2.5 bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 text-xs rounded-xl text-zinc-950 dark:text-zinc-100 focus:outline-none"
                      />
                      
                      <button 
                        type="button" 
                        onClick={handleAddInvitee}
                        disabled={!inviteeInput.trim()}
                        className="absolute right-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 border border-zinc-250 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-[10px] rounded-lg disabled:opacity-50 cursor-pointer"
                      >
                        Invite
                      </button>
                    </div>

                    {/* Autocomplete List */}
                    {showSuggestionsDropdown && suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-30 bg-white dark:bg-[#18181B] border border-zinc-350 dark:border-zinc-850 rounded-xl mt-1 max-h-40 overflow-y-auto shadow-xl p-1">
                        {suggestions.map((name) => (
                          <div
                            key={name}
                            onClick={() => selectSuggestion(name)}
                            className="px-3 py-2 rounded-lg text-xs hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-650 text-zinc-800 dark:text-zinc-200 font-bold cursor-pointer"
                          >
                            @{name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {inviteeError && <span className="text-[11px] font-semibold text-rose-500">⚠ {inviteeError}</span>}
                </div>

                {/* Meeting Options (Instant vs Scheduled) */}
                <div className="flex flex-col gap-2 border-t border-zinc-100 dark:border-zinc-900 pt-4">
                  <label className="text-[10px] font-extrabold text-zinc-450 dark:text-zinc-400 uppercase tracking-widest">Meeting Options</label>
                  
                  <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 dark:bg-[#18181b] rounded-xl">
                    <button
                      type="button"
                      onClick={() => setIsFutureScheduled(false)}
                      className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        !isFutureScheduled
                          ? 'bg-white dark:bg-zinc-900 shadow-sm text-zinc-800 dark:text-white'
                          : 'text-zinc-505 dark:text-zinc-500'
                      }`}
                    >
                      Instant
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFutureScheduled(true)}
                      className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        isFutureScheduled
                          ? 'bg-white dark:bg-zinc-900 shadow-sm text-zinc-800 dark:text-white'
                          : 'text-zinc-505 dark:text-zinc-500'
                      }`}
                    >
                      Schedule
                    </button>
                  </div>

                  {isFutureScheduled && (
                    <div className="flex flex-col gap-3 mt-2 animate-slide-in">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-bold text-zinc-400">Date</span>
                          <input
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            className="px-2.5 py-1.5 bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-850 text-xs rounded-lg text-zinc-950 dark:text-zinc-100"
                            required={isFutureScheduled}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-bold text-zinc-400">Time</span>
                          <input
                            type="time"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            className="px-2.5 py-1.5 bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-850 text-xs rounded-lg text-zinc-950 dark:text-zinc-100"
                            required={isFutureScheduled}
                          />
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-zinc-400">Timezone</span>
                        <select
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                          className="px-2.5 py-1.5 bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-850 text-xs rounded-lg text-zinc-950 dark:text-zinc-100 cursor-pointer"
                        >
                          {timezones.map((tz) => (
                            <option key={tz.value} value={tz.value}>
                              {tz.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Alerts */}
                {schedulingError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] font-semibold text-rose-500 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{schedulingError}</span>
                  </div>
                )}
                {schedulingSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>Meeting Whitelist Registered!</span>
                  </div>
                )}
              </form>
            </div>

            {/* Security Notice & Actions */}
            <div className="mt-8 border-t border-zinc-150 dark:border-zinc-900 pt-4 flex flex-col gap-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-[11px] text-zinc-550 dark:text-zinc-400 leading-normal">
                <Shield className="w-4 h-4 text-indigo-550 dark:text-indigo-400 shrink-0" />
                <span><strong>Only invited users</strong> can join this meeting room. No invite links are created.</span>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateDrawerOpen(false)}
                  className="flex-1 py-3 border border-zinc-250 dark:border-zinc-800 rounded-xl text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateMeeting}
                  disabled={creatingMeeting}
                  className="flex-1 py-3 bg-indigo-650 hover:bg-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {creatingMeeting ? 'Creating...' : 'Create Meeting'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating WebRTC Live Invitation Alert Card */}
      {activeInvite && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-5 rounded-2xl shadow-2xl flex flex-col gap-3 animate-slide-in text-left">
          <div className="flex justify-between items-start gap-2">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold tracking-widest text-indigo-500 dark:text-indigo-400 font-mono">Incoming Call Invitation</span>
              <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white mt-1 line-clamp-1">{activeInvite.title}</h4>
            </div>
            <button 
              onClick={() => setActiveInvite(null)}
              className="text-zinc-400 hover:text-zinc-650 transition-colors p-1 cursor-pointer"
              aria-label="Close incoming call invitation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">
            Host <strong className="text-zinc-805 dark:text-zinc-200">@{activeInvite.hostUsername}</strong> is inviting you to join this meeting room live.
          </p>
          <div className="flex gap-3 mt-1">
            <Link 
              href={`/meetings/${activeInvite.meetingId}`}
              onClick={() => setActiveInvite(null)}
              className="flex-grow text-center py-2 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold shadow cursor-pointer"
            >
              Join Call
            </Link>
            <button 
              onClick={() => setActiveInvite(null)}
              className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-450 text-xs font-bold hover:bg-zinc-200 hover:text-zinc-905 transition-all cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
