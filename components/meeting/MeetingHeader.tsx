'use client';

import { useState, useEffect } from 'react';
import { Settings, Maximize, Minimize, ShieldCheck, Lock, User } from 'lucide-react';
import { motion } from 'framer-motion';
import MeetingInfo from './MeetingInfo';
import MeetingTimer from './MeetingTimer';
import ConnectionBadge from './ConnectionBadge';
import ThemeToggle from './ThemeToggle';

interface MeetingHeaderProps {
  title: string;
  meetingId: string;
  host: string;
  socketConnected: boolean;
  participantCount: number;
  startTime?: string;
  onSettingsClick?: () => void;
}

export default function MeetingHeader({
  title,
  meetingId,
  host,
  socketConnected,
  participantCount,
  startTime,
  onSettingsClick,
}: MeetingHeaderProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Error enabling fullscreen mode', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <header className="h-20 border-b border-zinc-200/80 dark:border-zinc-800/80 px-4 sm:px-6 flex items-center justify-between bg-white/70 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 w-full select-none transition-colors duration-300">
      
      {/* Left section: Theme Toggle, brand icon, and Meeting Details */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 hidden md:block" />
        <MeetingInfo
          title={title}
          meetingId={meetingId}
          host={host}
          participantCount={participantCount}
        />
      </div>

      {/* Right section: Latency, Timer, Connection stats, Settings and Utilities */}
      <div className="flex items-center gap-2.5">
        
        {/* Security USP Ticker badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          <Lock className="w-3.5 h-3.5" />
          <span>LINKLESS SECURED</span>
        </div>

        <MeetingTimer startTime={startTime} />
        
        <div className="hidden sm:block">
          <ConnectionBadge socketConnected={socketConnected} />
        </div>

        <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="w-9 h-9 rounded-xl flex items-center justify-center border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-850 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize className="w-4.5 h-4.5" /> : <Maximize className="w-4.5 h-4.5" />}
        </button>

        {/* Settings button */}
        {onSettingsClick && (
          <button
            onClick={onSettingsClick}
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-850 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
            title="Meeting Settings"
            aria-label="Meeting Settings"
          >
            <Settings className="w-4.5 h-4.5" />
          </button>
        )}

        {/* User initials placeholder profile button */}
        <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:scale-105 transition-transform duration-200">
          <User className="w-4 h-4" />
        </div>
        
      </div>
    </header>
  );
}
