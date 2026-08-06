'use client';

import { useState } from 'react';
import { Users, Shield, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface MeetingInfoProps {
  title: string;
  meetingId: string;
  host: string;
  participantCount: number;
}

export default function MeetingInfo({ title, meetingId, host, participantCount }: MeetingInfoProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(meetingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 text-left select-none">
      {/* Brand Icon & Meeting title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-landing-primary flex items-center justify-center text-white font-extrabold text-xs shadow-md shadow-landing-primary/20 shrink-0">
          NM
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-black tracking-widest text-landing-primary dark:text-landing-highlight">
            NeuraMeet Call
          </span>
          <h1 className="text-sm sm:text-base font-black text-zinc-900 dark:text-white leading-none mt-0.5 max-w-[160px] sm:max-w-[240px] truncate">
            {title}
          </h1>
        </div>
      </div>

      {/* Info Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Host Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 rounded-xl text-[10px] font-bold text-indigo-600 dark:text-indigo-300">
          <Shield className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span>Host: @{host}</span>
        </div>

        {/* Copy Meeting ID Button */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl text-[10px] font-mono font-bold text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-850 transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
          title="Copy Meeting ID"
        >
          <span>ID: {meetingId}</span>
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Copy className="w-3 h-3 text-zinc-400 hover:text-zinc-200" />
          )}
        </button>

        {/* Participants count */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl text-[10px] font-bold text-zinc-700 dark:text-zinc-300 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <Users className="w-3.5 h-3.5 text-zinc-400" />
          <span>{participantCount} {participantCount === 1 ? 'User' : 'Users'}</span>
        </div>
      </div>
    </div>
  );
}
