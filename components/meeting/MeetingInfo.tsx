'use client';

import { Users, ShieldAlert } from 'lucide-react';

interface MeetingInfoProps {
  title: string;
  meetingId: string;
  host: string;
  participantCount: number;
}

export default function MeetingInfo({ title, meetingId, host, participantCount }: MeetingInfoProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3 text-left">
      {/* Title & Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-650 text-white font-extrabold text-sm shadow-md shadow-indigo-900/20">
          NM
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-indigo-400">
            NeuraMeet Video
          </span>
          <h1 className="text-sm font-bold text-white leading-none mt-0.5 max-w-[200px] sm:max-w-[300px] truncate">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Host Badge */}
        <div className="flex items-center gap-1 px-2.5 py-0.75 bg-indigo-950/40 border border-indigo-900/30 rounded-md text-[10px] font-semibold text-indigo-300">
          <ShieldAlert className="w-3 h-3 text-indigo-400" />
          <span>Host: @{host}</span>
        </div>

        {/* Meeting ID Badge (Static Metadata Only) */}
        <div className="flex items-center gap-1.5 px-2.5 py-0.75 bg-zinc-900/80 border border-[#27272A] rounded-md text-[10px] font-mono font-bold text-zinc-400">
          <span>Meeting ID: {meetingId}</span>
        </div>

        {/* Participant Count Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-0.75 bg-zinc-900/60 border border-zinc-800 rounded-md text-[10px] font-semibold text-zinc-300">
          <Users className="w-3 h-3 text-zinc-400" />
          <span>{participantCount}</span>
        </div>
      </div>
    </div>
  );
}
