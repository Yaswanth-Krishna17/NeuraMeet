'use client';

import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MessageSquare,
  Users,
  Settings,
  LogOut,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface BottomControlsProps {
  micEnabled: boolean;
  camEnabled: boolean;
  screenShareEnabled: boolean;
  chatOpen: boolean;
  participantsOpen: boolean;
  unreadChatCount: number;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onToggleSettings?: () => void;
  onLeave: () => void;
}

export default function BottomControls({
  micEnabled,
  camEnabled,
  screenShareEnabled,
  chatOpen,
  participantsOpen,
  unreadChatCount,
  onToggleMic,
  onToggleCam,
  onToggleScreenShare,
  onToggleChat,
  onToggleParticipants,
  onToggleSettings,
  onLeave,
}: BottomControlsProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 select-none">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="glass-controls px-5 py-3 rounded-full flex items-center gap-3.5"
      >
        {/* Toggle Microphone */}
        <button
          onClick={onToggleMic}
          className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all hover:scale-105 active:scale-95 cursor-pointer relative group ${
            micEnabled
              ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white'
              : 'bg-rose-500/20 border-rose-500/30 text-rose-450 hover:bg-rose-500/30'
          }`}
          title="Toggle Mic [M]"
          aria-label={micEnabled ? 'Mute Mic' : 'Unmute Mic'}
        >
          {micEnabled ? (
            <Mic className="w-5 h-5" />
          ) : (
            <MicOff className="w-5 h-5 text-rose-450" />
          )}

          {/* Tooltip */}
          <span className="absolute bottom-14 scale-0 group-hover:scale-100 transition-all duration-100 origin-bottom bg-zinc-950 border border-zinc-800 text-white text-[10px] font-semibold px-2 py-0.75 rounded-md shadow-xl whitespace-nowrap">
            {micEnabled ? 'Mute' : 'Unmute'} (M)
          </span>
        </button>

        {/* Toggle Camera */}
        <button
          onClick={onToggleCam}
          className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all hover:scale-105 active:scale-95 cursor-pointer relative group ${
            camEnabled
              ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white'
              : 'bg-rose-500/20 border-rose-500/30 text-rose-450 hover:bg-rose-500/30'
          }`}
          title="Toggle Camera [V]"
          aria-label={camEnabled ? 'Turn Camera Off' : 'Turn Camera On'}
        >
          {camEnabled ? (
            <Video className="w-5 h-5" />
          ) : (
            <VideoOff className="w-5 h-5 text-rose-450" />
          )}

          {/* Tooltip */}
          <span className="absolute bottom-14 scale-0 group-hover:scale-100 transition-all duration-100 origin-bottom bg-zinc-950 border border-zinc-800 text-white text-[10px] font-semibold px-2 py-0.75 rounded-md shadow-xl whitespace-nowrap">
            {camEnabled ? 'Stop Video' : 'Start Video'} (V)
          </span>
        </button>

        <div className="w-px h-5 bg-zinc-800" />

        {/* Screen Share (Mock Toggle) */}
        <button
          onClick={onToggleScreenShare}
          className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all hover:scale-105 active:scale-95 cursor-pointer relative group ${
            screenShareEnabled
              ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-450 hover:bg-emerald-500/30 animate-pulse'
              : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white'
          }`}
          title="Screen Share [S]"
          aria-label="Share Screen"
        >
          <Monitor className="w-5 h-5" />

          {/* Tooltip */}
          <span className="absolute bottom-14 scale-0 group-hover:scale-100 transition-all duration-100 origin-bottom bg-zinc-950 border border-zinc-800 text-white text-[10px] font-semibold px-2 py-0.75 rounded-md shadow-xl whitespace-nowrap">
            Share Screen
          </span>
        </button>

        {/* Chat Toggle */}
        <button
          onClick={onToggleChat}
          className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all hover:scale-105 active:scale-95 cursor-pointer relative group ${
            chatOpen
              ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-400'
              : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white'
          }`}
          title="Toggle Chat [C]"
          aria-label="Toggle Chat"
        >
          <MessageSquare className="w-5 h-5" />

          {/* Unread count badge */}
          {unreadChatCount > 0 && !chatOpen && (
            <span className="absolute -top-1.5 -right-1.5 bg-rose-550 border border-zinc-950 text-white text-[9px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-lg">
              {unreadChatCount}
            </span>
          )}

          {/* Tooltip */}
          <span className="absolute bottom-14 scale-0 group-hover:scale-100 transition-all duration-100 origin-bottom bg-zinc-950 border border-zinc-800 text-white text-[10px] font-semibold px-2 py-0.75 rounded-md shadow-xl whitespace-nowrap">
            Chat (C)
          </span>
        </button>

        {/* Participants Toggle */}
        <button
          onClick={onToggleParticipants}
          className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all hover:scale-105 active:scale-95 cursor-pointer relative group ${
            participantsOpen
              ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-400'
              : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white'
          }`}
          title="Toggle Participants [P]"
          aria-label="Toggle Participants"
        >
          <Users className="w-5 h-5" />

          {/* Tooltip */}
          <span className="absolute bottom-14 scale-0 group-hover:scale-100 transition-all duration-100 origin-bottom bg-zinc-950 border border-zinc-800 text-white text-[10px] font-semibold px-2 py-0.75 rounded-md shadow-xl whitespace-nowrap">
            Participants (P)
          </span>
        </button>

        {/* Settings Action Button (desktop) */}
        {onToggleSettings && (
          <button
            onClick={onToggleSettings}
            className="w-11 h-11 rounded-full flex items-center justify-center border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all hover:scale-105 active:scale-95 cursor-pointer relative group hidden md:flex"
            title="Settings"
            aria-label="Meeting Settings"
          >
            <Settings className="w-5 h-5" />
            <span className="absolute bottom-14 scale-0 group-hover:scale-100 transition-all duration-100 origin-bottom bg-zinc-950 border border-zinc-800 text-white text-[10px] font-semibold px-2 py-0.75 rounded-md shadow-xl whitespace-nowrap">
              Settings
            </span>
          </button>
        )}

        <div className="w-px h-5 bg-zinc-800" />

        {/* Disconnect Leave Meeting button */}
        <button
          onClick={onLeave}
          className="w-11 h-11 sm:w-auto sm:px-5 h-11 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-2 border border-rose-550 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer group relative"
          title="Leave Meeting [L]"
          aria-label="Leave Call"
        >
          <LogOut className="w-4.5 h-4.5" />
          <span className="text-xs font-extrabold hidden sm:inline">Leave</span>

          {/* Tooltip */}
          <span className="absolute bottom-14 scale-0 group-hover:scale-100 transition-all duration-100 origin-bottom bg-zinc-950 border border-zinc-800 text-white text-[10px] font-semibold px-2 py-0.75 rounded-md shadow-xl whitespace-nowrap">
            Leave Call (L)
          </span>
        </button>
      </motion.div>
    </div>
  );
}
