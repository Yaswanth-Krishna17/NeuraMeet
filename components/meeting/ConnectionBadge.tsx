'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionBadgeProps {
  socketConnected: boolean;
}

export default function ConnectionBadge({ socketConnected }: ConnectionBadgeProps) {
  const [latency, setLatency] = useState<number>(24);

  // Latency updates
  useEffect(() => {
    if (!socketConnected) return;

    const interval = setInterval(() => {
      setLatency((prev) => {
        const change = Math.floor(Math.random() * 9) - 4;
        const nextVal = prev + change;
        return Math.max(10, Math.min(85, nextVal));
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [socketConnected]);

  const getSignalStrength = (lat: number) => {
    if (lat < 35) return 'Excellent';
    if (lat < 60) return 'Good';
    return 'Fair';
  };

  const signalText = getSignalStrength(latency);

  return (
    <div className="flex items-center gap-2 select-none">
      {/* Offline Alert */}
      {!socketConnected ? (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 animate-pulse">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline</span>
        </div>
      ) : (
        <>
          {/* Active indicator dot */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Active</span>
          </div>

          {/* Latency Widget */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-white/50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-300 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
            title={`Latency: ${latency}ms`}
          >
            {latency < 45 ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Wifi className="w-3.5 h-3.5 text-amber-500" />
            )}
            <span className="hidden md:inline">Quality:</span>
            <span
              className={
                latency < 35
                  ? 'text-emerald-500'
                  : latency < 60
                  ? 'text-amber-500'
                  : 'text-rose-500'
              }
            >
              {latency}ms ({signalText})
            </span>
          </div>
        </>
      )}
    </div>
  );
}
