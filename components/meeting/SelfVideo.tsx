'use client';

import { useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface SelfVideoProps {
  stream: MediaStream | null;
  username: string;
  micEnabled: boolean;
  camEnabled: boolean;
  isSpeaking: boolean;
}

export default function SelfVideo({
  stream,
  username,
  micEnabled,
  camEnabled,
  isSpeaking,
}: SelfVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !stream) return;

    if (videoElement.srcObject !== stream) {
      videoElement.srcObject = stream;
      videoElement.play().catch((err) => {
        console.warn('Autoplay blocked on self floating video', err);
      });
    }
  }, [stream]);

  const hasVideo = stream && stream.getVideoTracks().length > 0 && camEnabled;

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.1}
      dragConstraints={{ left: -1200, right: 0, top: -800, bottom: 0 }}
      whileHover={{ scale: 1.03 }}
      className={`fixed bottom-24 right-6 z-30 w-44 sm:w-52 aspect-video rounded-3xl overflow-hidden bg-white/95 dark:bg-[#111827]/95 border-2 shadow-2xl cursor-grab active:cursor-grabbing select-none transition-shadow ${
        isSpeaking 
          ? 'border-landing-primary shadow-landing-primary/20' 
          : 'border-zinc-200/80 dark:border-zinc-800/80'
      }`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        muted
        playsInline
        className="w-full h-full object-cover rounded-3xl pointer-events-none"
        style={{ display: hasVideo ? 'block' : 'none' }}
      />

      {/* Avatar Fallback */}
      {!hasVideo && (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-stone-50 dark:bg-zinc-950/40 pointer-events-none">
          <div className="w-8.5 h-8.5 rounded-2xl bg-gradient-to-tr from-landing-primary to-landing-highlight text-white flex items-center justify-center font-bold text-xs uppercase shadow-md shadow-landing-primary/10">
            {username.charAt(0)}
          </div>
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">You (Camera off)</span>
        </div>
      )}

      {/* Mini Overlay Label */}
      <div className="absolute inset-x-2 bottom-2 p-1.5 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md rounded-xl border border-zinc-200/50 dark:border-white/5 flex items-center justify-between pointer-events-none">
        <span className="text-[10px] font-bold text-zinc-800 dark:text-white flex items-center gap-0.5">
          <span>You</span>
          <CheckCircle className="w-3 h-3 text-emerald-500 fill-emerald-500/10 shrink-0" />
        </span>
        <div className="flex gap-1">
          {!micEnabled && (
            <div className="w-4.5 h-4.5 rounded bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
              <MicOff className="w-2.5 h-2.5" />
            </div>
          )}
          {!camEnabled && (
            <div className="w-4.5 h-4.5 rounded bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
              <VideoOff className="w-2.5 h-2.5" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
