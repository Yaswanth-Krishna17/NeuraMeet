'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface MeetingTimerProps {
  startTime?: string;
}

export default function MeetingTimer({ startTime }: MeetingTimerProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let initialSeconds = 0;
    if (startTime) {
      const parsedStart = new Date(startTime).getTime();
      if (!isNaN(parsedStart)) {
        initialSeconds = Math.max(0, Math.floor((Date.now() - parsedStart) / 1000));
      }
    }
    setSeconds(initialSeconds);

    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    const pad = (n: number) => String(n).padStart(2, '0');

    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] backdrop-blur-md text-zinc-700 dark:text-zinc-300 transition-all select-none"
    >
      <Clock className="w-4 h-4 text-landing-primary dark:text-landing-highlight animate-pulse" />
      <span className="font-mono font-bold tracking-wider text-zinc-900 dark:text-zinc-150">{formatTime(seconds)}</span>
    </motion.div>
  );
}
