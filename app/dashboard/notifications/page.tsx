'use client';

import { useEffect, useState } from 'react';
import { useDashboardSocket } from '../layout';
import { getNotificationsAction, markNotificationReadAction, deleteNotificationAction, clearAllNotificationsAction } from '../actions';
import { Bell, Check, Trash2, Eye, Calendar, Shield, Info, Clock, CheckCheck, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  _id: string;
  recipient: string;
  type: 'invite' | 'meeting_started' | 'meeting_cancelled' | 'meeting_ended' | 'invite_accepted' | 'invite_declined' | 'user_joined' | 'user_left' | 'system';
  title: string;
  message: string;
  sender: string;
  meetingId: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { socket, unreadCount, setUnreadCount, refreshNotifications } = useDashboardSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'invite' | 'system'>('all');
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    const res = await getNotificationsAction();
    if (res.success && res.notifications) {
      setNotifications(res.notifications);
      const unread = res.notifications.filter((n: any) => !n.read).length;
      setUnreadCount(unread);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Listen to live invitation changes to refresh notifications list
  useEffect(() => {
    if (!socket) return;
    
    const handleNewInvite = () => {
      fetchNotifications();
    };

    socket.on('meeting-invite', handleNewInvite);

    return () => {
      socket.off('meeting-invite', handleNewInvite);
    };
  }, [socket]);

  const handleMarkRead = async (id: string) => {
    setActioningId(id);
    const res = await markNotificationReadAction(id);
    if (res.success) {
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setActioningId(null);
  };

  const handleDelete = async (id: string) => {
    setActioningId(id);
    const res = await deleteNotificationAction(id);
    if (res.success) {
      setNotifications(prev => {
        const filtered = prev.filter(n => n._id !== id);
        const unread = filtered.filter(n => !n.read).length;
        setUnreadCount(unread);
        return filtered;
      });
    }
    setActioningId(null);
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all your notifications?')) return;
    setLoading(true);
    const res = await clearAllNotificationsAction();
    if (res.success) {
      setNotifications([]);
      setUnreadCount(0);
    }
    setLoading(false);
  };

  const getFilteredNotifications = () => {
    return notifications.filter(n => {
      if (filter === 'all') return true;
      if (filter === 'unread') return !n.read;
      if (filter === 'invite') return n.type === 'invite';
      return n.type === 'system';
    });
  };

  const filteredNotifications = getFilteredNotifications();

  // Premium SVG Empty State Illustration
  const EmptyNotificationsIllustration = () => (
    <svg className="w-36 h-36 mx-auto text-indigo-500/20 dark:text-indigo-400/10 mb-4" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bellCircleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="bellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="75" fill="url(#bellCircleGrad)" />
      <path d="M100 45C85.5 45 75 55.5 75 70V110L60 125V135H140V125L125 110V70C125 55.5 114.5 45 100 45Z" stroke="url(#bellGrad)" strokeWidth="2.5" fill="none" />
      <path d="M90 145C90 150.5 94.5 155 100 155C105.5 155 110 150.5 110 145" stroke="url(#bellGrad)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );

  return (
    <div className="flex flex-col gap-6 select-none max-w-4xl mx-auto">
      
      {/* Header operations */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <Bell className="w-7 h-7 text-indigo-500" />
            <span>Notification Center</span>
          </h1>
          <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1">
            Stay up to date with real-time invitations, response status changes, and meeting alerts.
          </p>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={handleClearAll}
            className="px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-950/40 text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/15 text-xs font-black uppercase tracking-wider transition-all self-start sm:self-auto cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Categories Tabs Filter */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-900 w-full shrink-0 gap-2">
        {(['all', 'unread', 'invite', 'system'] as const).map(tab => {
          const count = notifications.filter(n => {
            if (tab === 'all') return true;
            if (tab === 'unread') return !n.read;
            if (tab === 'invite') return n.type === 'invite';
            return n.type === 'system';
          }).length;

          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer px-4 relative capitalize ${
                filter === tab
                  ? 'border-indigo-500 text-indigo-600 dark:text-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              <span>{tab}</span>
              {count > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-[9px] font-bold text-zinc-700 dark:text-zinc-300">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      {loading ? (
        // Skeletons
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map(idx => (
            <div key={idx} className="glass-panel p-4 rounded-xl border border-zinc-200 dark:border-zinc-900 flex items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-3 w-2/3">
                <div className="w-9 h-9 bg-zinc-200 dark:bg-zinc-850 rounded-full" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-3.5 bg-zinc-200 dark:bg-zinc-850 rounded w-1/2" />
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-850 rounded w-full" />
                </div>
              </div>
              <div className="w-16 h-8 bg-zinc-200 dark:bg-zinc-850 rounded-lg" />
            </div>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        // Empty State card
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel text-center py-16 px-6 border border-zinc-200 dark:border-zinc-900 rounded-3xl bg-white dark:bg-zinc-950/20 max-w-xl mx-auto w-full mt-6"
        >
          <EmptyNotificationsIllustration />
          <h3 className="text-base font-extrabold text-zinc-800 dark:text-white uppercase tracking-wider">
            All caught up!
          </h3>
          <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-2 max-w-sm mx-auto leading-relaxed">
            There are no notifications matching the "{filter}" filter. You're completely clear.
          </p>
        </motion.div>
      ) : (
        // Notifications list items
        <motion.div
          layout
          className="flex flex-col gap-3"
        >
          <AnimatePresence mode="popLayout">
            {filteredNotifications.map(notif => (
              <motion.div
                layout
                key={notif._id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className={`glass-panel p-4 rounded-xl border transition-all flex items-start sm:items-center justify-between gap-4 text-left ${
                  notif.read
                    ? 'bg-white/40 dark:bg-[#111827]/10 border-zinc-200/50 dark:border-zinc-900/50 opacity-80'
                    : 'bg-white dark:bg-[#111827]/60 border-zinc-200 dark:border-zinc-850 shadow-sm border-l-4 border-l-indigo-500'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                  {/* Left Icon Badge */}
                  <div className={`w-9.5 h-9.5 rounded-full flex items-center justify-center shrink-0 ${
                    notif.read
                      ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-550'
                      : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400'
                  }`}>
                    {notif.type === 'invite' ? (
                      <Calendar className="w-4.5 h-4.5" />
                    ) : notif.type === 'system' ? (
                      <Shield className="w-4.5 h-4.5" />
                    ) : (
                      <Info className="w-4.5 h-4.5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-xs truncate ${notif.read ? 'font-semibold text-zinc-550 dark:text-zinc-400' : 'font-extrabold text-zinc-800 dark:text-white'}`}>
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-550 dark:text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-1.5 text-[9px] text-zinc-400 dark:text-zinc-550 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(notif.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Individual Action buttons */}
                <div className="flex gap-1.5 shrink-0 self-center">
                  {!notif.read && (
                    <button
                      onClick={() => handleMarkRead(notif._id)}
                      disabled={actioningId === notif._id}
                      className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-500 hover:text-indigo-500 dark:hover:text-indigo-400 cursor-pointer disabled:opacity-50"
                      title="Mark as Read"
                    >
                      {actioningId === notif._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCheck className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notif._id)}
                    disabled={actioningId === notif._id}
                    className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-zinc-500 hover:text-rose-500 dark:hover:text-rose-400 cursor-pointer disabled:opacity-50"
                    title="Delete Notification"
                  >
                    {actioningId === notif._id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

    </div>
  );
}
