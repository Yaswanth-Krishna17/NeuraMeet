'use client';

import { useUser, UserButton } from '@clerk/nextjs';
import { useEffect, useState, createContext, useContext } from 'react';
import { io, Socket } from 'socket.io-client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BrainCircuit, Bell, Settings, Calendar, History, LayoutDashboard, X, Check, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '@/components/meeting/ThemeToggle';
import { getNotificationsAction } from './actions';

// Define Socket Context Interface
interface SocketContextType {
  socket: Socket | null;
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  refreshNotifications: () => Promise<void>;
  invitationsVersion: number;
  triggerInvitationsRefresh: () => void;
}

const DashboardSocketContext = createContext<SocketContextType>({
  socket: null,
  unreadCount: 0,
  setUnreadCount: () => {},
  refreshNotifications: async () => {},
  invitationsVersion: 0,
  triggerInvitationsRefresh: () => {},
});

export const useDashboardSocket = () => useContext(DashboardSocketContext);

interface MeetingInvite {
  meetingId: string;
  title: string;
  host: string;
  hostUsername: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded: userLoaded } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [invitationsVersion, setInvitationsVersion] = useState(0);
  const [activeInvite, setActiveInvite] = useState<MeetingInvite | null>(null);

  const triggerInvitationsRefresh = () => {
    setInvitationsVersion(prev => prev + 1);
  };

  // Sound cue for real-time notification
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioContext.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioContext.currentTime + 0.12); // A5
      
      gain.gain.setValueAtTime(0.1, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      osc.start();
      osc.stop(audioContext.currentTime + 0.35);
    } catch (e) {
      console.warn('Audio feedback blocked by browser autoplay settings.', e);
    }
  };

  const refreshNotifications = async () => {
    if (!user) return;
    const res = await getNotificationsAction();
    if (res.success && res.notifications) {
      const unread = res.notifications.filter((n: any) => !n.read).length;
      setUnreadCount(unread);
    }
  };

  // Socket.io initialization
  useEffect(() => {
    if (!userLoaded || !user) return;

    const email = user.emailAddresses[0]?.emailAddress || '';
    const username = (user.username || email.split('@')[0] || '').toLowerCase().trim();

    const socketConn = io();
    setSocket(socketConn);

    socketConn.on('connect', () => {
      socketConn.emit('register-user', { username });
      console.log('[SOCKET] Connected to main dashboard socket router.');
    });

    socketConn.on('meeting-invite', (data: MeetingInvite) => {
      console.log('[SOCKET] Received real-time meeting invite:', data);
      playNotificationSound();
      setActiveInvite(data);
      triggerInvitationsRefresh();
      refreshNotifications();

      // Auto dismiss after 10 seconds
      setTimeout(() => {
        setActiveInvite(prev => prev?.meetingId === data.meetingId ? null : prev);
      }, 10000);
    });

    // Refresh notifications count initially
    refreshNotifications();

    return () => {
      socketConn.disconnect();
    };
  }, [userLoaded, user]);

  const handleToastJoin = async () => {
    if (!activeInvite) return;
    const meetingId = activeInvite.meetingId;
    setActiveInvite(null);
    router.push(`/meetings/${meetingId}`);
  };

  const handleToastDismiss = () => {
    setActiveInvite(null);
  };

  // Helpers to styles nav links dynamically
  const getLinkClass = (path: string) => {
    const isActive = pathname === path || (path !== '/dashboard' && pathname.startsWith(path));
    return `text-[11px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 ${
      isActive
        ? 'bg-indigo-600 dark:bg-indigo-650 text-white shadow-lg shadow-indigo-500/20'
        : 'text-zinc-550 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-150/40 dark:hover:bg-zinc-900/60'
    }`;
  };

  return (
    <DashboardSocketContext.Provider value={{
      socket,
      unreadCount,
      setUnreadCount,
      refreshNotifications,
      invitationsVersion,
      triggerInvitationsRefresh
    }}>
      <div className="min-h-screen bg-stone-150 dark:bg-[#06070B] bg-mesh text-zinc-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
        
        {/* Navigation header bar */}
        <nav className="w-full bg-white/70 dark:bg-[#0C0F19]/70 backdrop-blur-xl border-b border-zinc-200/80 dark:border-zinc-900/80 sticky top-0 z-50 select-none">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                  <BrainCircuit className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="font-black text-base tracking-tight bg-gradient-to-r from-indigo-600 to-cyan-500 dark:from-indigo-200 dark:to-slate-100 bg-clip-text text-transparent">
                  NeuraMeet
                </span>
              </Link>
              
              {/* SaaS Dashboard Section Tabs */}
              <div className="hidden md:flex items-center gap-1 bg-zinc-100/50 dark:bg-zinc-950/40 p-1 rounded-2xl border border-zinc-200/50 dark:border-zinc-900/60">
                <Link href="/dashboard" className={getLinkClass('/dashboard')}>
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>
                <Link href="/dashboard/invitations" className={getLinkClass('/dashboard/invitations')}>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Invitations</span>
                </Link>
                <Link href="/dashboard/history" className={getLinkClass('/dashboard/history')}>
                  <History className="w-3.5 h-3.5" />
                  <span>History</span>
                </Link>
                <Link href="/dashboard/settings" className={getLinkClass('/dashboard/settings')}>
                  <Settings className="w-3.5 h-3.5" />
                  <span>Settings</span>
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              
              {/* Notification icon */}
              <Link href="/dashboard/notifications" className="relative p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-550 dark:text-zinc-400 dark:hover:text-white transition-all cursor-pointer">
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 bg-rose-500 text-white rounded-full text-[8px] font-black flex items-center justify-center shadow-md animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </Link>

              <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800" />
              <UserButton />
            </div>
          </div>
        </nav>

        {/* Main Workspace Frame container */}
        <div className="flex-grow max-w-7xl w-full mx-auto px-6 py-8 relative">
          {children}
        </div>

        {/* Invitation Popup Notification Toast Overlay */}
        <AnimatePresence>
          {activeInvite && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="fixed bottom-6 right-6 z-50 glass-panel border border-indigo-500/20 dark:border-indigo-500/35 bg-white dark:bg-[#0F1424] max-w-sm w-full p-5 rounded-2xl shadow-2xl flex flex-col gap-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                    <Volume2 className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                      New Invitation
                    </h4>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      Active Real-time Ping
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleToastDismiss}
                  className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-650 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-zinc-800 dark:text-white">
                  {activeInvite.title}
                </h3>
                <p className="text-[11px] text-zinc-550 dark:text-zinc-400 mt-1 leading-relaxed">
                  Host: <span className="font-bold text-zinc-800 dark:text-white">@{activeInvite.hostUsername}</span> ({activeInvite.host})
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleToastJoin}
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-extrabold shadow-md active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Join Meeting</span>
                </button>
                <button
                  onClick={handleToastDismiss}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-[11px] font-extrabold hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardSocketContext.Provider>
  );
}
