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
  const [selectedInvite, setSelectedInvite] = useState<Invitation | null>(null);
  
  const [collapsedGroups, setCollapsedGroups] = useState({
    pending: false,
    accepted: false,
    past: false
  });

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

  const getRelativeTime = (dateStr: string) => {
    try {
      const ms = new Date().getTime() - new Date(dateStr).getTime();
      const mins = Math.floor(ms / 60000);
      if (mins < 1) return 'just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      return `${days}d ago`;
    } catch (e) {
      return 'some time ago';
    }
  };

  const pendingInvites = invitations.filter(inv => inv.status === 'pending');
  const acceptedInvites = invitations.filter(inv => inv.status === 'accepted');
  const pastInvites = invitations.filter(inv => 
    inv.status === 'declined' || inv.status === 'expired' || inv.status === 'missed'
  );

  const renderInvitationRow = (invite: Invitation) => {
    const isPending = invite.status === 'pending';
    const isAccepted = invite.status === 'accepted';
    
    return (
      <div 
        key={invite.meetingId}
        className={`group p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
          isPending 
            ? 'border-indigo-500/35 bg-indigo-500/[0.02] hover:border-indigo-500/50 shadow-sm' 
            : isAccepted 
            ? 'border-emerald-500/25 bg-emerald-500/[0.01] hover:border-emerald-500/40 shadow-xs' 
            : 'border-zinc-200/60 dark:border-zinc-900/60 bg-white/20 dark:bg-zinc-955/[0.02] hover:border-zinc-350 dark:hover:border-zinc-800'
        }`}
      >
        <div className="flex-grow min-w-0 text-left flex items-start gap-3.5">
          {/* Status color indicator stripe */}
          <span className={`w-1 h-10 rounded-full shrink-0 ${
            isPending ? 'bg-indigo-500' : isAccepted ? 'bg-emerald-500' : 'bg-zinc-400'
          }`} />

          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white truncate">
                {invite.meetingTitle}
              </h4>
              <span className="text-[10px] text-indigo-650 dark:text-indigo-400 font-extrabold tracking-wide bg-indigo-500/5 px-2 py-0.5 rounded-md font-mono">
                @{invite.host}
              </span>
            </div>
            
            <p className="text-xs text-zinc-500 dark:text-zinc-450 mt-1 truncate leading-relaxed">
              {invite.description || 'No meeting description provided.'}
            </p>
            
            <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-400 dark:text-zinc-550 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-zinc-450" />
                <span>{new Date(invite.scheduledAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
              </span>
              <span>•</span>
              <span>Invited {getRelativeTime(invite.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            onClick={() => setSelectedInvite(invite)}
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-850 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            title="View Details"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
          
          {isPending && (
            <>
              <button
                onClick={() => handleResponse(invite.meetingId, 'accepted')}
                className="px-3.5 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all shadow active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Accept</span>
              </button>
              <button
                onClick={() => handleResponse(invite.meetingId, 'declined')}
                className="px-3.5 py-1.5 border border-zinc-205 dark:border-zinc-800 hover:bg-rose-500/10 hover:text-rose-500 text-zinc-600 dark:text-zinc-405 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <X className="w-3.5 h-3.5" />
                <span>Decline</span>
              </button>
            </>
          )}

          {isAccepted && (
            <Link
              href={`/meetings/${invite.meetingId}`}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all shadow shadow-emerald-500/10 active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Join</span>
            </Link>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 select-none max-w-5xl mx-auto w-full text-left">
            {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-divider pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-primary-text flex items-center gap-2 uppercase">
            <Inbox className="w-6 h-6 text-primary" />
            <span>Invitation Inbox</span>
          </h1>
          <p className="text-xs text-secondary-text mt-1 font-semibold">
            Real-time secure meeting invitations routed directly to your username binding.
          </p>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] text-[10px] font-extrabold text-[#047857] dark:border-zinc-800 dark:bg-zinc-955/20 dark:text-indigo-400 uppercase tracking-wider self-start sm:self-auto">
          <Shield className="w-3.5 h-3.5 text-[#059669] dark:text-indigo-400" />
          <span>Username Auth Whitelisted</span>
        </div>
      </div>

      {loading ? (
        // Loading Skeletons
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(idx => (
            <div key={idx} className="p-5 rounded-2xl border border-border dark:border-zinc-900 flex flex-col gap-3 animate-pulse">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-850 rounded w-1/3" />
              <div className="h-3 bg-zinc-200 dark:bg-zinc-850 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-8 w-full mt-2">
          
          {/* Group 1: Pending */}
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setCollapsedGroups(prev => ({ ...prev, pending: !prev.pending }))}
              className="flex items-center justify-between w-full pb-2 border-b border-divider text-left cursor-pointer group"
            >
              <div className="flex items-center gap-2 select-none">
                <span className="text-xs font-black uppercase tracking-widest text-primary-text">
                  Pending Invitations
                </span>
                {pendingInvites.length > 0 ? (
                  <span className="px-2 py-0.5 rounded bg-[#EEEBFF] border border-[#EEEBFF] text-[#5B4BDB] dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                    {pendingInvites.length} Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-secondary dark:bg-zinc-900 text-secondary-text text-[10px] font-extrabold">
                    0
                  </span>
                )}
              </div>
              <span className="text-[10px] uppercase font-black tracking-wider text-[#64748B] group-hover:text-zinc-650 dark:group-hover:text-white transition-colors">
                {collapsedGroups.pending ? 'Expand' : 'Collapse'}
              </span>
            </button>
            
            {!collapsedGroups.pending && (
              pendingInvites.length === 0 ? (
                <p className="text-xs text-[#64748B] dark:text-zinc-555 italic py-4">No pending invitations found.</p>
              ) : (
                <div className="flex flex-col gap-3.5">
                  {pendingInvites.map(renderInvitationRow)}
                </div>
              )
            )}
          </div>

          {/* Group 2: Accepted */}
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setCollapsedGroups(prev => ({ ...prev, accepted: !prev.accepted }))}
              className="flex items-center justify-between w-full pb-2 border-b border-divider text-left cursor-pointer group"
            >
              <div className="flex items-center gap-2 select-none">
                <span className="text-xs font-black uppercase tracking-widest text-primary-text">
                  Accepted Invitations
                </span>
                {acceptedInvites.length > 0 ? (
                  <span className="px-2 py-0.5 rounded bg-[#EEEBFF] border border-[#EEEBFF] text-[#5B4BDB] dark:bg-[#EEEBFF]/10 dark:border-emerald-500/20 dark:text-emerald-450 text-[10px] font-black uppercase tracking-widest">
                    {acceptedInvites.length} Whitelisted
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-secondary dark:bg-zinc-900 text-secondary-text text-[10px] font-extrabold">
                    0
                  </span>
                )}
              </div>
              <span className="text-[10px] uppercase font-black tracking-wider text-[#64748B] group-hover:text-zinc-650 dark:group-hover:text-white transition-colors">
                {collapsedGroups.accepted ? 'Expand' : 'Collapse'}
              </span>
            </button>
            
            {!collapsedGroups.accepted && (
              acceptedInvites.length === 0 ? (
                <p className="text-xs text-[#64748B] dark:text-zinc-555 italic py-4">No accepted invitations found.</p>
              ) : (
                <div className="flex flex-col gap-3.5">
                  {acceptedInvites.map(renderInvitationRow)}
                </div>
              )
            )}
          </div>

          {/* Group 3: Declined & Expired */}
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setCollapsedGroups(prev => ({ ...prev, past: !prev.past }))}
              className="flex items-center justify-between w-full pb-2 border-b border-divider text-left cursor-pointer group"
            >
              <div className="flex items-center gap-2 select-none">
                <span className="text-xs font-black uppercase tracking-widest text-primary-text">
                  Past / Declined
                </span>
                {pastInvites.length > 0 ? (
                  <span className="px-2 py-0.5 rounded bg-secondary dark:bg-zinc-900 text-secondary-text text-[10px] font-black">
                    {pastInvites.length} Records
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-secondary dark:bg-zinc-900 text-secondary-text text-[10px] font-extrabold">
                    0
                  </span>
                )}
              </div>
              <span className="text-[10px] uppercase font-black tracking-wider text-[#64748B] group-hover:text-zinc-655 dark:group-hover:text-white transition-colors">
                {collapsedGroups.past ? 'Expand' : 'Collapse'}
              </span>
            </button>
            
            {!collapsedGroups.past && (
              pastInvites.length === 0 ? (
                <p className="text-xs text-[#64748B] dark:text-zinc-555 italic py-4">No past or declined invitations.</p>
              ) : (
                <div className="flex flex-col gap-3.5">
                  {pastInvites.map(renderInvitationRow)}
                </div>
              )
            )}
          </div>

        </div>
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
                      className="flex-1 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-md cursor-pointer active:scale-98 transition-all"
                    >
                      Accept invite
                    </button>
                    <button
                      onClick={() => {
                        handleResponse(selectedInvite.meetingId, 'declined');
                        setSelectedInvite(null);
                      }}
                      className="flex-1 py-2.5 rounded-xl border border-zinc-205 dark:border-zinc-850 text-zinc-600 dark:text-zinc-450 text-xs font-black uppercase tracking-wider hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer active:scale-98 transition-all"
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
                  className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-405 text-xs font-black hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all cursor-pointer"
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
