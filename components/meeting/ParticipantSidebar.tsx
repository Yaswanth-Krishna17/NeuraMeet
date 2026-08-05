'use client';

import { useState } from 'react';
import { Search, Mic, MicOff, Video, VideoOff, ShieldCheck, AlertTriangle, UserPlus, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Participant {
  username: string;
  isHost: boolean;
  micEnabled: boolean;
  camEnabled: boolean;
  isSpeaking: boolean;
  strikes: number;
}

interface ParticipantSidebarProps {
  participants: Participant[];
  isHost: boolean;
  onInviteUser?: (username: string) => Promise<{ success: boolean; error?: string }>;
}

export default function ParticipantSidebar({ participants, isHost, onInviteUser }: ParticipantSidebarProps) {
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

  // Filter list by search query
  const filteredParticipants = participants.filter((p) =>
    p.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950/60 overflow-hidden">
      {/* Host Invite Member controls */}
      {isHost && onInviteUser && (
        <div className="p-4 border-b border-zinc-900 bg-zinc-950/20 flex flex-col gap-2">
          <button
            onClick={() => {
              setShowInviteForm(!showInviteForm);
              setInviteError('');
              setInviteSuccess('');
            }}
            className="w-full py-2 rounded-xl bg-indigo-650/10 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white hover:border-indigo-550 text-indigo-400 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4 animate-pulse" />
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
                    placeholder="Invitee username..."
                    className="flex-grow px-3 py-1.5 bg-[#09090B] border border-zinc-800 text-xs rounded-lg text-zinc-150 focus:outline-none focus:border-indigo-500/80 transition-colors placeholder:text-zinc-650"
                  />
                  <button
                    type="submit"
                    disabled={inviting}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-550 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center min-w-[70px] cursor-pointer disabled:opacity-50"
                  >
                    {inviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Invite'}
                  </button>
                </div>
                {inviteError && <span className="text-[10px] text-rose-400 font-semibold mt-0.5">⚠ {inviteError}</span>}
                {inviteSuccess && (
                  <span className="text-[10px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>{inviteSuccess}</span>
                  </span>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Search Input */}
      <div className="p-4 border-b border-zinc-900 bg-zinc-950/40">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search participants..."
            className="w-full pl-9 pr-4 py-2 bg-[#09090B] border border-zinc-800 text-xs rounded-full text-zinc-150 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 transition-all placeholder:text-zinc-650"
          />
        </div>
      </div>

      {/* Participants Scroll List */}
      <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-2.5 custom-scrollbar">
        {filteredParticipants.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-zinc-600 select-none">
            <span className="text-sm">No participants found</span>
          </div>
        ) : (
          filteredParticipants.map((peer, idx) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              key={idx}
              className={`bg-zinc-900/40 border rounded-xl p-3.5 flex items-center justify-between text-xs transition-all ${
                peer.isSpeaking
                  ? 'border-indigo-500/50 bg-indigo-950/5'
                  : 'border-zinc-900 hover:border-zinc-800'
              }`}
            >
              {/* Profile Meta info */}
              <div className="flex items-center gap-3">
                {/* Custom Initial Avatar */}
                <div
                  className={`w-8.5 h-8.5 rounded-full flex items-center justify-center font-extrabold uppercase text-[11px] border shadow-sm ${
                    peer.isSpeaking
                      ? 'bg-indigo-650 border-indigo-400 text-white'
                      : 'bg-zinc-850 border-zinc-750 text-zinc-300'
                  }`}
                >
                  {peer.username.charAt(0)}
                </div>

                <div className="flex flex-col gap-0.5 text-left">
                  <span className="font-bold text-white flex items-center gap-1">
                    @{peer.username}
                    {peer.isHost && (
                      <span title="Meeting Host">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                      </span>
                    )}
                  </span>

                  {/* strikes tracking indicator */}
                  {peer.strikes > 0 && (
                    <span className="text-[9px] font-bold text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5 text-rose-500" />
                      <span>Strikes: {peer.strikes}/3</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Status Icons */}
              <div className="flex items-center gap-1.5">
                {/* Speaking indicator dot */}
                {peer.isSpeaking && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}

                {/* Mic Status */}
                <div
                  className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center border transition-all ${
                    peer.micEnabled
                      ? 'bg-zinc-950/70 border-zinc-800 text-zinc-400'
                      : 'bg-rose-500/10 border-rose-450/20 text-rose-400'
                  }`}
                >
                  {peer.micEnabled ? (
                    <Mic className="w-3.5 h-3.5 text-zinc-400" />
                  ) : (
                    <MicOff className="w-3.5 h-3.5 text-rose-400" />
                  )}
                </div>

                {/* Camera Status */}
                <div
                  className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center border transition-all ${
                    peer.camEnabled
                      ? 'bg-zinc-950/70 border-zinc-800 text-zinc-400'
                      : 'bg-rose-500/10 border-rose-450/20 text-rose-400'
                  }`}
                >
                  {peer.camEnabled ? (
                    <Video className="w-3.5 h-3.5 text-zinc-400" />
                  ) : (
                    <VideoOff className="w-3.5 h-3.5 text-rose-400" />
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
