'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface MeetingTimerProps {
  startTime?: string; // Optional start time ISO string
}

export default function MeetingTimer({ startTime }: MeetingTimerProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    // Determine initial offset if startTime is provided
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
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-zinc-900/60 border border-zinc-800 text-zinc-300">
      <Clock className="w-3.5 h-3.5 text-indigo-400" />
      <span className="font-mono text-white">{formatTime(seconds)}</span>
    </div>
  );
}
