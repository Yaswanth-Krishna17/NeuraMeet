'use client';

import { useEffect, useState } from 'react';
import { useDashboardSocket } from '../layout';
import { getInvitationsAction, respondToInvitationAction } from '../actions';
import { Calendar, User, Clock, Check, X, Shield, Info, ArrowRight, ExternalLink, CalendarDays, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Invitation {
  meetingId: string;
  meetingTitle: string;
  invitee: string;
  host: string;
  description: string;
  scheduledAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'missed';
  createdAt: string;
}

export default function InvitationsPage() {
  const { socket, invitationsVersion, refreshNotifications } = useDashboardSocket();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'declined'>('pending');
  const [selectedInvite, setSelectedInvite] = useState<Invitation | null>(null);

  const fetchInvitations = async () => {
    setLoading(true);
    const res = await getInvitationsAction();
    if (res.success && res.invitations) {
      setInvitations(res.invitations);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInvitations();
  }, [invitationsVersion]);

  // Handle socket event to refresh invitations in real-time
  useEffect(() => {
    if (!socket) return;
    
    socket.on('meeting-invite', () => {
      fetchInvitations();
    });

    return () => {
      socket.off('meeting-invite');
    };
  }, [socket]);

  const handleResponse = async (meetingId: string, status: 'accepted' | 'declined') => {
    const res = await respondToInvitationAction(meetingId, status);
    if (res.success) {
      // Optimistic update
      setInvitations(prev =>
        prev.map(inv => (inv.meetingId === meetingId ? { ...inv, status } : inv))
      );
      refreshNotifications();
      
      // Emit socket event to notify host that invitation status updated
      if (socket && socket.connected) {
        socket.emit('invitation-updated', { meetingId, status });
      }
    } else {
      alert(`Action failed: ${res.error}`);
    }
  };

  const getFilteredInvites = () => {
    return invitations.filter(inv => {
      if (activeTab === 'pending') return inv.status === 'pending';
      if (activeTab === 'accepted') return inv.status === 'accepted';
      return inv.status === 'declined' || inv.status === 'expired' || inv.status === 'missed';
    });
  };

  const filteredInvites = getFilteredInvites();

  const EmptyInvitationsIllustration = () => (
    <svg className="w-36 h-36 mx-auto text-indigo-500/20 dark:text-indigo-400/10 mb-4" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="envGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="75" fill="url(#circleGrad)" />
      <rect x="60" y="70" width="80" height="60" rx="12" stroke="url(#envGrad)" strokeWidth="2" fill="none" />
      <path d="M60 82L100 108L140 82" stroke="url(#envGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <div className="flex flex-col gap-6 select-none max-w-5xl mx-auto">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-7 h-7 text-indigo-500" />
            <span>Invitation Center</span>
          </h1>
          <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1">
            Real-time secure linkless meeting invitations routed directly to your username.
          </p>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/20 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider self-start md:self-auto">
          <Shield className="w-3.5 h-3.5" />
          <span>🔒 Username-Only Invites</span>
        </div>
      </div>

      {/* Categories Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-900 w-full shrink-0 gap-2">
        {(['pending', 'accepted', 'declined'] as const).map(tab => {
          const count = invitations.filter(inv => {
            if (tab === 'pending') return inv.status === 'pending';
            if (tab === 'accepted') return inv.status === 'accepted';
            return inv.status === 'declined' || inv.status === 'expired' || inv.status === 'missed';
          }).length;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer px-4 relative ${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-600 dark:text-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              <span>{tab === 'declined' ? 'Past/Declined' : tab}</span>
              {count > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-[9px] font-bold text-zinc-700 dark:text-zinc-300">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Invitations List container */}
      {loading ? (
        // Loading Skeletons
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(idx => (
            <div key={idx} className="glass-panel p-5 rounded-2xl border border-zinc-200 dark:border-zinc-900 flex flex-col gap-4 animate-pulse">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-850 rounded w-2/3" />
              <div className="h-3 bg-zinc-200 dark:bg-zinc-850 rounded w-1/2" />
              <div className="h-10 bg-zinc-200 dark:bg-zinc-850 rounded-xl w-full" />
              <div className="flex gap-2 mt-2">
                <div className="h-9 bg-zinc-200 dark:bg-zinc-850 rounded-xl flex-1" />
                <div className="h-9 bg-zinc-200 dark:bg-zinc-850 rounded-xl flex-1" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredInvites.length === 0 ? (
        // Empty State card
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel text-center py-16 px-6 border border-zinc-200 dark:border-zinc-900 rounded-3xl bg-white dark:bg-zinc-950/20 max-w-xl mx-auto w-full mt-6"
        >
          <EmptyInvitationsIllustration />
          <h3 className="text-base font-extrabold text-zinc-800 dark:text-white uppercase tracking-wider">
            No {activeTab} Invitations
          </h3>
          <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-2 max-w-sm mx-auto leading-relaxed">
            There are no invitations currently classified as {activeTab}. When users invite your username, they will appear here in real-time.
          </p>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 mt-6 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md transition-all active:scale-98">
            <span>Go to Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      ) : (
        // Card Grid
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredInvites.map(invite => (
              <motion.div
                layout
                key={invite.meetingId}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="glass-panel p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-900/80 bg-white dark:bg-[#111827]/40 shadow-md hover:shadow-lg dark:hover:border-zinc-800 transition-all flex flex-col justify-between"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-black text-zinc-800 dark:text-white line-clamp-1">
                      {invite.meetingTitle}
                    </h3>
                    
                    {/* Status Badge */}
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                      invite.status === 'pending'
                        ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                        : invite.status === 'accepted'
                        ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                    }`}>
                      {invite.status}
                    </span>
                  </div>

                  {/* Description */}
                  {invite.description ? (
                    <p className="text-xs text-zinc-550 dark:text-zinc-450 line-clamp-2 leading-relaxed text-left">
                      {invite.description}
                    </p>
                  ) : (
                    <p className="text-xs italic text-zinc-400 dark:text-zinc-650 text-left">
                      No meeting description provided.
                    </p>
                  )}

                  {/* Details row */}
                  <div className="flex flex-col gap-2 mt-2 bg-zinc-50 dark:bg-zinc-900/40 p-3 rounded-xl border border-zinc-200/50 dark:border-zinc-900/60 text-[10px] text-zinc-600 dark:text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Host: <strong className="text-zinc-800 dark:text-zinc-200">@{invite.host}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Scheduled: <strong className="text-zinc-800 dark:text-zinc-200">{new Date(invite.scheduledAt).toLocaleString()}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Operations buttons */}
                <div className="flex gap-2 mt-5">
                  {invite.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleResponse(invite.meetingId, 'accepted')}
                        className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => handleResponse(invite.meetingId, 'declined')}
                        className="flex-1 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-black uppercase tracking-wider hover:bg-zinc-50 dark:hover:bg-zinc-900 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </>
                  )}

                  {invite.status === 'accepted' && (
                    <Link
                      href={`/meetings/${invite.meetingId}`}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Join Meeting Room</span>
                    </Link>
                  )}

                  <button
                    onClick={() => setSelectedInvite(invite)}
                    className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-450 hover:bg-zinc-50 dark:hover:bg-zinc-900 active:scale-98 transition-all cursor-pointer"
                    title="View Invitation Details"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* View Details Overlay Modal */}
      <AnimatePresence>
        {selectedInvite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="glass-panel max-w-md w-full p-6 text-left flex flex-col gap-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111827] relative rounded-3xl"
            >
              <button
                onClick={() => setSelectedInvite(null)}
                className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-550 dark:text-zinc-400 transition-all border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-black text-zinc-850 dark:text-white uppercase tracking-wider">
                  Invitation Parameters
                </h3>
              </div>

              <div className="h-px bg-zinc-200 dark:bg-zinc-900 w-full" />

              <div className="flex flex-col gap-3.5 text-xs text-left">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-550 uppercase tracking-widest">Meeting Title</span>
                  <span className="text-zinc-800 dark:text-zinc-200 font-extrabold">{selectedInvite.meetingTitle}</span>
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-550 uppercase tracking-widest">Description</span>
                  <span className="text-zinc-650 dark:text-zinc-400 leading-relaxed">
                    {selectedInvite.description || 'No description provided.'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-1 bg-zinc-50 dark:bg-zinc-900/30 p-3 rounded-2xl border border-zinc-200/50 dark:border-zinc-900/60">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-indigo-550 dark:text-indigo-400 uppercase tracking-widest">Organizer</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-300 truncate">@{selectedInvite.host}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-indigo-550 dark:text-indigo-400 uppercase tracking-widest">Response Status</span>
                    <span className="font-bold uppercase tracking-wider text-[10px] text-zinc-800 dark:text-zinc-300">{selectedInvite.status}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/30 p-3 rounded-2xl border border-zinc-200/50 dark:border-zinc-900/60 text-zinc-600 dark:text-zinc-400">
                  <span>Scheduled Time</span>
                  <span className="font-bold text-zinc-850 dark:text-zinc-200">{new Date(selectedInvite.scheduledAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                {selectedInvite.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        handleResponse(selectedInvite.meetingId, 'accepted');
                        setSelectedInvite(null);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-md cursor-pointer active:scale-98 transition-all"
                    >
                      Accept invite
                    </button>
                    <button
                      onClick={() => {
                        handleResponse(selectedInvite.meetingId, 'declined');
                        setSelectedInvite(null);
                      }}
                      className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-850 text-zinc-600 dark:text-zinc-400 text-xs font-black uppercase tracking-wider hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer active:scale-98 transition-all"
                    >
                      Decline
                    </button>
                  </>
                )}
                {selectedInvite.status === 'accepted' && (
                  <Link
                    href={`/meetings/${selectedInvite.meetingId}`}
                    onClick={() => setSelectedInvite(null)}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider shadow-md text-center cursor-pointer active:scale-98 transition-all"
                  >
                    Join Room
                  </Link>
                )}
                <button
                  onClick={() => setSelectedInvite(null)}
                  className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 text-xs font-black hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
