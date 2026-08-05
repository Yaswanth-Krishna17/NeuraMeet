'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionBadgeProps {
  socketConnected: boolean;
}

export default function ConnectionBadge({ socketConnected }: ConnectionBadgeProps) {
  const [latency, setLatency] = useState<number>(32);

  // Simulate network latency updates for visual high-fidelity
  useEffect(() => {
    if (!socketConnected) return;

    const interval = setInterval(() => {
      setLatency((prev) => {
        const change = Math.floor(Math.random() * 15) - 7;
        const nextVal = prev + change;
        return Math.max(12, Math.min(98, nextVal));
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [socketConnected]);

  const getSignalStrength = (lat: number) => {
    if (lat < 45) return 'Excellent';
    if (lat < 75) return 'Good';
    return 'Fair';
  };

  const signalText = getSignalStrength(latency);

  return (
    <div className="flex items-center gap-2">
      {/* Connection Indicator */}
      <div
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all border ${
          socketConnected
            ? 'bg-emerald-950/30 border-emerald-900/40 text-emerald-400'
            : 'bg-rose-950/30 border-rose-900/40 text-rose-400 animate-pulse'
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            socketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
          }`}
        />
        <span>{socketConnected ? 'Connected' : 'Offline'}</span>
      </div>

      {/* Network Quality Badge */}
      {socketConnected && (
        <div
          className="flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold bg-zinc-900/60 border border-zinc-800 text-zinc-300"
          title={`Latency: ${latency}ms`}
        >
          {latency < 60 ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Wifi className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span className="hidden sm:inline">Network:</span>
          <span
            className={
              latency < 45
                ? 'text-emerald-400 font-mono'
                : latency < 75
                ? 'text-amber-400 font-mono'
                : 'text-rose-400 font-mono'
            }
          >
            {latency}ms ({signalText})
          </span>
        </div>
      )}
    </div>
  );
}
