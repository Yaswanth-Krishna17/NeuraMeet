'use client';

import { useState, useEffect } from 'react';
import { Settings, Maximize, Minimize, ShieldCheck, Lock, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [isSecurityPopoverOpen, setIsSecurityPopoverOpen] = useState(false);

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
        <div className="relative">
          <button
            onClick={() => setIsSecurityPopoverOpen(prev => !prev)}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-605 dark:text-emerald-405 cursor-pointer hover:bg-emerald-500/20 transition-all select-none active:scale-95"
            title="Inspect Connection Security"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>LINKLESS SECURED</span>
          </button>
          
          <AnimatePresence>
            {isSecurityPopoverOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsSecurityPopoverOpen(false)}
                />
                
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xl z-20 flex flex-col gap-3 text-left font-semibold text-xs leading-normal select-none"
                >
                  <div className="flex items-center gap-1.5 pb-2 border-b border-zinc-150 dark:border-zinc-900 text-zinc-900 dark:text-white font-extrabold text-[11px] uppercase tracking-wide">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Security Integrity</span>
                  </div>
                  
                  <div className="flex flex-col gap-2 text-zinc-650 dark:text-zinc-400">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                      <span className="text-emerald-500 select-none">✓</span>
                      <span>Linkless Access</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                      <span className="text-emerald-500 select-none">✓</span>
                      <span>Identity Verified</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                      <span className="text-emerald-500 select-none">✓</span>
                      <span>Invite Only</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                      <span className="text-emerald-500 select-none">✓</span>
                      <span>Encrypted Connection</span>
                    </div>
                  </div>
                  
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-550 leading-relaxed pt-1.5 border-t border-zinc-100/50 dark:border-zinc-900">
                    NeuraMeet linkless architecture binds whitelists directly to authenticated User Session IDs.
                  </p>
                </motion.div>
              </>
            )}
          </AnimatePresence>
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
