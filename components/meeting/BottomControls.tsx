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
  PhoneOff,
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
  onEndMeeting?: () => void;
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
  onEndMeeting,
}: BottomControlsProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 select-none w-[90%] sm:w-auto max-w-full">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 px-4 sm:px-6 py-3 rounded-2xl sm:rounded-full flex items-center justify-between sm:justify-start gap-2.5 sm:gap-4 shadow-xl shadow-black/5 dark:shadow-none"
      >
        {/* Toggle Microphone */}
        <button
          onClick={onToggleMic}
          className={`w-10 h-10 rounded-xl sm:rounded-full flex items-center justify-center border transition-all hover:scale-105 active:scale-95 cursor-pointer relative group ${
            micEnabled
              ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-500 hover:bg-rose-500/25'
          }`}
          aria-label={micEnabled ? 'Mute Mic' : 'Unmute Mic'}
        >
          {micEnabled ? (
            <Mic className="w-4.5 h-4.5" />
          ) : (
            <MicOff className="w-4.5 h-4.5" />
          )}

          {/* Tooltip */}
          <span className="hidden sm:block absolute bottom-14 scale-0 group-hover:scale-100 transition-all duration-100 origin-bottom bg-zinc-950 border border-zinc-800 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-xl whitespace-nowrap z-50">
            {micEnabled ? 'Mute' : 'Unmute'} (M)
          </span>
        </button>

        {/* Toggle Camera */}
        <button
          onClick={onToggleCam}
          className={`w-10 h-10 rounded-xl sm:rounded-full flex items-center justify-center border transition-all hover:scale-105 active:scale-95 cursor-pointer relative group ${
            camEnabled
              ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-500 hover:bg-rose-500/25'
          }`}
          aria-label={camEnabled ? 'Turn Camera Off' : 'Turn Camera On'}
        >
          {camEnabled ? (
            <Video className="w-4.5 h-4.5" />
          ) : (
            <VideoOff className="w-4.5 h-4.5" />
          )}

          {/* Tooltip */}
          <span className="hidden sm:block absolute bottom-14 scale-0 group-hover:scale-100 transition-all duration-100 origin-bottom bg-zinc-950 border border-zinc-800 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-xl whitespace-nowrap z-50">
            {camEnabled ? 'Stop Video' : 'Start Video'} (V)
          </span>
        </button>

        <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800" />

        {/* Screen Share */}
        <button
          onClick={onToggleScreenShare}
          className={`w-10 h-10 rounded-xl sm:rounded-full flex items-center justify-center border transition-all hover:scale-105 active:scale-95 cursor-pointer relative group ${
            screenShareEnabled
              ? 'bg-landing-primary/10 border-landing-primary/30 text-landing-primary hover:bg-landing-primary/20'
              : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
          }`}
          aria-label="Share Screen"
        >
          <Monitor className="w-4.5 h-4.5" />

          {/* Tooltip */}
          <span className="hidden sm:block absolute bottom-14 scale-0 group-hover:scale-100 transition-all duration-100 origin-bottom bg-zinc-950 border border-zinc-800 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-xl whitespace-nowrap z-50">
            Share Screen
          </span>
        </button>

        {/* Chat Toggle */}
        <button
          onClick={onToggleChat}
          className={`w-10 h-10 rounded-xl sm:rounded-full flex items-center justify-center border transition-all hover:scale-105 active:scale-95 cursor-pointer relative group ${
            chatOpen
              ? 'bg-landing-primary/15 border-landing-primary/30 text-landing-primary'
              : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
          }`}
          aria-label="Toggle Chat"
        >
          <MessageSquare className="w-4.5 h-4.5" />

          {/* Unread badge */}
          {unreadChatCount > 0 && !chatOpen && (
            <span className="absolute -top-1.5 -right-1.5 bg-rose-500 border border-white dark:border-zinc-950 text-white text-[9px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-lg">
              {unreadChatCount}
            </span>
          )}

          {/* Tooltip */}
          <span className="hidden sm:block absolute bottom-14 scale-0 group-hover:scale-100 transition-all duration-100 origin-bottom bg-zinc-950 border border-zinc-800 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-xl whitespace-nowrap z-50">
            Chat (C)
          </span>
        </button>

        {/* Participants Toggle */}
        <button
          onClick={onToggleParticipants}
          className={`w-10 h-10 rounded-xl sm:rounded-full flex items-center justify-center border transition-all hover:scale-105 active:scale-95 cursor-pointer relative group ${
            participantsOpen
              ? 'bg-landing-primary/15 border-landing-primary/30 text-landing-primary'
              : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
          }`}
          aria-label="Toggle Participants"
        >
          <Users className="w-4.5 h-4.5" />

          {/* Tooltip */}
          <span className="hidden sm:block absolute bottom-14 scale-0 group-hover:scale-100 transition-all duration-100 origin-bottom bg-zinc-950 border border-zinc-800 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-xl whitespace-nowrap z-50">
            Participants (P)
          </span>
        </button>

        {/* Settings button */}
        {onToggleSettings && (
          <button
            onClick={onToggleSettings}
            className="w-10 h-10 rounded-xl sm:rounded-full flex items-center justify-center border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all hover:scale-105 active:scale-95 cursor-pointer relative group hidden md:flex"
            aria-label="Meeting Settings"
          >
            <Settings className="w-4.5 h-4.5" />
            <span className="absolute bottom-14 scale-0 group-hover:scale-100 transition-all duration-100 origin-bottom bg-zinc-950 border border-zinc-800 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-xl whitespace-nowrap z-50">
              Settings
            </span>
          </button>
        )}

        <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />

        {/* Disconnect/Leave Call Button */}
        <button
          onClick={onLeave}
          className="w-10 h-10 sm:w-auto sm:px-5 rounded-xl sm:rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-2 border border-rose-650 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer group relative shrink-0"
          aria-label="Leave Call"
        >
          <LogOut className="w-4.5 h-4.5" />
          <span className="text-xs font-black hidden sm:inline uppercase tracking-wider">Leave</span>

          {/* Tooltip */}
          <span className="hidden sm:block absolute bottom-14 scale-0 group-hover:scale-100 transition-all duration-100 origin-bottom bg-zinc-950 border border-zinc-800 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-xl whitespace-nowrap z-50">
            Leave Call (L)
          </span>
        </button>

        {/* End Meeting Button (Host only) */}
        {onEndMeeting && (
          <button
            onClick={onEndMeeting}
            className="w-10 h-10 sm:w-auto sm:px-5 rounded-xl sm:rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center gap-2 border border-red-700 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer group relative shrink-0"
            aria-label="End Meeting"
          >
            <PhoneOff className="w-4.5 h-4.5" />
            <span className="text-xs font-black hidden sm:inline uppercase tracking-wider">End</span>

            {/* Tooltip */}
            <span className="hidden sm:block absolute bottom-14 scale-0 group-hover:scale-100 transition-all duration-100 origin-bottom bg-zinc-950 border border-zinc-800 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-xl whitespace-nowrap z-50">
              End Meeting (E)
            </span>
          </button>
        )}
      </motion.div>
    </div>
  );
}
