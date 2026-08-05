'use client';

import { Settings, LogOut } from 'lucide-react';
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
  onLeaveClick?: () => void;
}

export default function MeetingHeader({
  title,
  meetingId,
  host,
  socketConnected,
  participantCount,
  startTime,
  onSettingsClick,
  onLeaveClick,
}: MeetingHeaderProps) {
  return (
    <header className="h-16 border-b border-zinc-900 px-4 sm:px-6 flex items-center justify-between bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 w-full select-none">
      {/* Left side: Brand and Meeting Details */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <MeetingInfo
          title={title}
          meetingId={meetingId}
          host={host}
          participantCount={participantCount}
        />
      </div>

      {/* Right side: Timer, Network quality, Settings, and Actions */}
      <div className="flex items-center gap-3">
        <MeetingTimer startTime={startTime} />
        <ConnectionBadge socketConnected={socketConnected} />

        <div className="w-px h-4 bg-zinc-800 hidden sm:block" />

        {/* Settings button */}
        {onSettingsClick && (
          <button
            onClick={onSettingsClick}
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-850 text-zinc-400 hover:text-white transition-all cursor-pointer"
            title="Meeting Settings"
            aria-label="Meeting Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
