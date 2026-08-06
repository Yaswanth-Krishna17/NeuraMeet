'use client';

import { useState } from 'react';
import { 
  Search, Mic, MicOff, Video, VideoOff, ShieldCheck, AlertTriangle, 
  UserPlus, Check, Loader2, CheckCircle2, Lock, ShieldAlert, Key, 
  Trash2, Crown, VolumeX, UserMinus, UserCheck, UserX 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Participant {
  username: string;
  isHost: boolean;
  micEnabled: boolean;
  camEnabled: boolean;
  isSpeaking: boolean;
  strikes: number;
}

interface WaitingUser {
  socketId: string;
  username: string;
}

interface ParticipantSidebarProps {
  participants: Participant[];
  isHost: boolean;
  onInviteUser?: (username: string) => Promise<{ success: boolean; error?: string }>;
  
  // Host controls
  onMuteUser?: (username: string) => void;
  onKickUser?: (username: string) => void;
  onTransferHost?: (username: string) => void;
  
  // Waiting queue
  waitingQueue?: WaitingUser[];
  onApproveWaiting?: (socketId: string, username: string) => void;
  onRejectWaiting?: (socketId: string, username: string) => void;
}

export default function ParticipantSidebar({ 
  participants, 
  isHost, 
  onInviteUser,
  onMuteUser,
  onKickUser,
  onTransferHost,
  waitingQueue = [],
  onApproveWaiting,
  onRejectWaiting
}: ParticipantSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteInput, setInviteInput] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviting, setInviting] = useState(false);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    
    const targetUser = inviteInput.trim().toLowerCase();
    if (!targetUser) return;
    if (!onInviteUser) return;

    setInviting(true);
    const res = await onInviteUser(targetUser);
    if (res.success) {
      setInviteSuccess(`@${targetUser} added and notified!`);
      setInviteInput('');
      setTimeout(() => {
        setInviteSuccess('');
        setShowInviteForm(false);
      }, 2500);
    } else {
      setInviteError(res.error || 'Failed to invite user.');
    }
    setInviting(false);
  };

  const filteredParticipants = participants.filter((p) =>
    p.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-grow flex flex-col h-full bg-stone-50 dark:bg-zinc-950/40 overflow-hidden relative select-none">
      
      {/* Security USP Card Widget */}
      <div className="p-4 border-b border-zinc-200/80 dark:border-zinc-900 bg-stone-100/50 dark:bg-zinc-950/20">
        <div className="rounded-2xl border border-landing-primary/25 dark:border-landing-primary/20 bg-gradient-to-r from-landing-primary/5 to-landing-highlight/5 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.01)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-landing-primary/10 to-transparent blur-md" />
          
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-landing-primary dark:text-landing-highlight" />
            <span className="text-[10px] font-black uppercase tracking-wider text-landing-primary dark:text-landing-highlight">
              Meeting Security credentials
            </span>
          </div>
          
          <ul className="flex flex-col gap-2 text-[10px] font-bold text-zinc-650 dark:text-zinc-400">
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Linkless Active (No leaks possible)</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>100% Username Verified entries</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Encrypted peer-to-peer WebRTC</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Host Invitation Drawer */}
      {isHost && onInviteUser && (
        <div className="p-4 border-b border-zinc-200/80 dark:border-zinc-900 bg-stone-100/30 dark:bg-zinc-950/10 flex flex-col gap-2">
          <button
            onClick={() => {
              setShowInviteForm(!showInviteForm);
              setInviteError('');
              setInviteSuccess('');
            }}
            className={`w-full py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98] ${
              showInviteForm
                ? 'bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                : 'bg-landing-primary/10 border-landing-primary/25 hover:bg-landing-primary hover:text-white text-landing-primary font-bold'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>{showInviteForm ? 'Close Invite Panel' : 'Invite User to Call'}</span>
          </button>

          <AnimatePresence>
            {showInviteForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleInviteSubmit}
                className="flex flex-col gap-2 overflow-hidden mt-1"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteInput}
                    onChange={(e) => setInviteInput(e.target.value)}
                    placeholder="Enter registered username..."
                    className="flex-grow px-3 py-1.5 bg-zinc-100 dark:bg-[#09090B] border border-zinc-200 dark:border-zinc-800 text-xs rounded-xl text-zinc-850 dark:text-zinc-150 focus:outline-none focus:border-landing-primary/80 transition-all placeholder:text-zinc-500"
                  />
                  <button
                    type="submit"
                    disabled={inviting}
                    className="px-4 py-1.5 bg-landing-primary hover:bg-landing-primary/95 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center min-w-[70px] cursor-pointer disabled:opacity-50"
                  >
                    {inviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Invite'}
                  </button>
                </div>
                {inviteError && <span className="text-[10px] text-rose-500 font-bold mt-0.5">⚠️ {inviteError}</span>}
                {inviteSuccess && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span>{inviteSuccess}</span>
                  </span>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Waiting Room Queue (Host only collapsible section) */}
      {isHost && waitingQueue.length > 0 && (
        <div className="p-4 border-b border-zinc-200/80 dark:border-zinc-900 bg-amber-500/5 dark:bg-amber-500/10 flex flex-col gap-2.5">
          <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Waiting Room Queue ({waitingQueue.length})</span>
          </span>
          <div className="flex flex-col gap-2">
            {waitingQueue.map((user) => (
              <div key={user.socketId} className="flex justify-between items-center bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs">
                <span className="font-extrabold text-zinc-800 dark:text-white truncate max-w-[110px]">
                  @{user.username}
                </span>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => onApproveWaiting && onApproveWaiting(user.socketId, user.username)}
                    className="p-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer"
                    title="Approve User Entry"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onRejectWaiting && onRejectWaiting(user.socketId, user.username)}
                    className="p-1 rounded bg-rose-500 hover:bg-rose-600 text-white cursor-pointer"
                    title="Decline User Entry"
                  >
                    <UserX className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="p-4 border-b border-zinc-200/80 dark:border-zinc-900 bg-stone-100/30 dark:bg-zinc-950/10 shrink-0">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search verified guests..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-100 dark:bg-[#09090B] border border-zinc-200 dark:border-zinc-800 text-xs rounded-full text-zinc-850 dark:text-zinc-150 focus:outline-none focus:border-landing-primary/80 transition-all placeholder:text-zinc-500"
          />
        </div>
      </div>

      {/* Guest Directory List */}
      <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-2.5 custom-scrollbar min-h-0">
        {filteredParticipants.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-zinc-550 select-none">
            <span className="text-xs">No active participants found</span>
          </div>
        ) : (
          filteredParticipants.map((peer, idx) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              key={idx}
              className={`bg-white dark:bg-zinc-900/40 border rounded-2xl p-3 flex items-center justify-between text-xs transition-all shadow-[0_2px_6px_rgba(0,0,0,0.01)] group ${
                peer.isSpeaking
                  ? 'border-landing-primary/50 bg-landing-primary/5 dark:bg-indigo-950/5'
                  : 'border-zinc-200/60 dark:border-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-800'
              }`}
            >
              {/* Profile Card */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`w-8.5 h-8.5 rounded-2xl flex items-center justify-center font-black uppercase text-[11px] border transition-all shrink-0 ${
                    peer.isSpeaking
                      ? 'bg-landing-primary border-landing-primary text-white shadow-md'
                      : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {peer.username.charAt(0)}
                </div>

                <div className="flex flex-col gap-0.5 text-left min-w-0">
                  <span className="font-bold text-zinc-800 dark:text-white flex items-center gap-1.5 truncate">
                    <span className="truncate">@{peer.username}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/10 shrink-0" />
                    
                    {peer.isHost && (
                      <span title="Owner">
                        <ShieldCheck className="w-3.5 h-3.5 text-landing-primary shrink-0" />
                      </span>
                    )}
                  </span>

                  {peer.strikes > 0 && (
                    <span className="text-[9px] font-black text-rose-500 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5 text-rose-500" />
                      <span>Strikes: {peer.strikes}/3</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons (Host only, hides for self) */}
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {isHost && !peer.isHost && (
                  <div className="hidden group-hover:flex items-center gap-1 transition-all mr-1.5">
                    {peer.micEnabled && onMuteUser && (
                      <button
                        onClick={() => onMuteUser(peer.username)}
                        className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-500 hover:text-rose-500 dark:hover:text-rose-450 hover:bg-zinc-50 transition-all cursor-pointer"
                        title="Force Mute Microphone"
                      >
                        <VolumeX className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onTransferHost && (
                      <button
                        onClick={() => onTransferHost(peer.username)}
                        className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-500 hover:text-amber-500 dark:hover:text-amber-450 hover:bg-zinc-50 transition-all cursor-pointer"
                        title="Transfer Meeting Host"
                      >
                        <Crown className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onKickUser && (
                      <button
                        onClick={() => onKickUser(peer.username)}
                        className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-500 hover:text-rose-600 dark:hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
                        title="Remove Participant from Call"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {peer.isSpeaking && (
                  <span className="flex h-2 w-2 relative mx-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}

                {/* Mic Status icon */}
                <div
                  className={`w-6.5 h-6.5 rounded-xl flex items-center justify-center border transition-all ${
                    peer.micEnabled
                      ? 'bg-zinc-100/50 dark:bg-zinc-950/50 border-zinc-200/80 dark:border-zinc-800/80 text-zinc-500 dark:text-zinc-400'
                      : 'bg-rose-500/15 border-rose-500/25 text-rose-500'
                  }`}
                >
                  {peer.micEnabled ? (
                    <Mic className="w-3 h-3" />
                  ) : (
                    <MicOff className="w-3 h-3" />
                  )}
                </div>

                {/* Cam Status icon */}
                <div
                  className={`w-6.5 h-6.5 rounded-xl flex items-center justify-center border transition-all ${
                    peer.camEnabled
                      ? 'bg-zinc-100/50 dark:bg-zinc-950/50 border-zinc-200/80 dark:border-zinc-800/80 text-zinc-500 dark:text-zinc-400'
                      : 'bg-rose-500/15 border-rose-500/25 text-rose-500'
                  }`}
                >
                  {peer.camEnabled ? (
                    <Video className="w-3 h-3" />
                  ) : (
                    <VideoOff className="w-3 h-3" />
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
