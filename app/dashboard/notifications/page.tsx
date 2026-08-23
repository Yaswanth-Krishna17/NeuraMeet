'use client';

import { useEffect, useState } from 'react';
import { useDashboardSocket } from '../layout';
import { getNotificationsAction, markNotificationReadAction, deleteNotificationAction, clearAllNotificationsAction } from '../actions';
import { Bell, Check, Trash2, Shield, Info, Clock, Loader2 } from 'lucide-react';
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

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    setLoading(true);
    try {
      await Promise.all(unread.map(n => markNotificationReadAction(n._id)));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      refreshNotifications();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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

  // Group notifications chronologically
  const getGroupedNotifications = () => {
    const today: Notification[] = [];
    const yesterday: Notification[] = [];
    const older: Notification[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;

    notifications.forEach(item => {
      const time = new Date(item.createdAt).getTime();
      if (time >= todayStart) {
        today.push(item);
      } else if (time >= yesterdayStart) {
        yesterday.push(item);
      } else {
        older.push(item);
      }
    });

    return [
      { title: 'Today', data: today },
      { title: 'Yesterday', data: yesterday },
      { title: 'Older', data: older }
    ].filter(g => g.data.length > 0);
  };

  const grouped = getGroupedNotifications();

  return (
    <div className="flex flex-col gap-6 select-none max-w-3xl mx-auto w-full text-left">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-900/80 pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2 uppercase">
            <Bell className="w-6 h-6 text-indigo-500" />
            <span>Notification Center</span>
          </h1>
          <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1 font-semibold">
            {unreadCount > 0 
              ? `You have ${unreadCount} unread alert${unreadCount === 1 ? '' : 's'}.` 
              : 'You are all caught up.'}
          </p>
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-extrabold uppercase hover:bg-zinc-200 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
              >
                Mark as read
              </button>
            )}
            <button
              onClick={handleClearAll}
              className="px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-950/40 text-rose-600 dark:text-rose-455 hover:bg-rose-50 dark:hover:bg-rose-950/15 text-xs font-extrabold uppercase transition-colors cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {loading ? (
        // Skeletons
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(idx => (
            <div key={idx} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-900 flex items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-3 w-2/3">
                <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-850 rounded-full" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-850 rounded w-1/2" />
                  <div className="h-2.5 bg-zinc-200 dark:bg-zinc-850 rounded w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="border border-zinc-200/80 dark:border-zinc-900/80 rounded-3xl p-16 text-center bg-white/20 dark:bg-zinc-955/20 max-w-xl mx-auto w-full mt-6 flex flex-col items-center justify-center gap-3">
          <Bell className="w-12 h-12 text-zinc-405 dark:text-zinc-650" />
          <h3 className="text-base font-extrabold text-zinc-800 dark:text-white uppercase tracking-wider">
            All Caught Up!
          </h3>
          <p className="text-xs text-zinc-555 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
            There are no notifications in your registry. Whitelist updates and security alerts will appear here live.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8 mt-4 pl-4 select-none relative">
          
          {grouped.map((group) => (
            <div key={group.title} className="flex flex-col gap-5">
              
              {/* Chronological Header */}
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-555 select-none pb-1 border-b border-zinc-100 dark:border-zinc-900">
                {group.title}
              </h3>
              
              {/* Timeline nodes connection container */}
              <div className="relative pl-6 flex flex-col gap-6 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-zinc-200 dark:before:bg-zinc-850">
                
                {group.data.map((notif) => (
                  <div 
                    key={notif._id} 
                    className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all text-left ${
                      notif.read 
                        ? 'border-zinc-200/50 dark:border-zinc-900/50 bg-white/40 dark:bg-zinc-950/[0.01] opacity-75' 
                        : 'border-indigo-500/20 bg-indigo-500/[0.01] dark:bg-indigo-500/[0.02] hover:border-indigo-500/40 shadow-xs'
                    }`}
                  >
                    
                    {/* Timeline dot node */}
                    <span className={`absolute -left-[23.5px] top-4.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#09090b] ${
                      notif.read ? 'bg-zinc-400' : 'bg-indigo-500 animate-pulse'
                    }`} />
                    
                    <div className="flex items-start gap-3 flex-grow min-w-0">
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`text-xs ${notif.read ? 'font-bold text-zinc-700 dark:text-zinc-400' : 'font-extrabold text-zinc-900 dark:text-white'}`}>
                            {notif.title}
                          </h4>
                          {!notif.read && (
                            <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.25 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-450 mt-1 line-clamp-2 leading-relaxed font-semibold">
                          {notif.message}
                        </p>
                        <span className="text-[9px] text-zinc-400 dark:text-zinc-550 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          <span>{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                      {!notif.read && (
                        <button
                          onClick={() => handleMarkRead(notif._id)}
                          disabled={actioningId === notif._id}
                          className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-405 hover:text-indigo-505 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                          title="Mark as Read"
                        >
                          {actioningId === notif._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDelete(notif._id)}
                        disabled={actioningId === notif._id}
                        className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-405 hover:text-rose-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                        title="Delete Alert"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                ))}

              </div>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}
