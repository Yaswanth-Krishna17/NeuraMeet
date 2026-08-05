'use client';

import { useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';
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
      // Constraints can be set to window or bounding boxes, dragConstraints ref is handled by parent, or default to viewport
      dragConstraints={{ left: -1000, right: 0, top: -1000, bottom: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`fixed bottom-24 right-6 z-30 w-48 sm:w-56 aspect-video rounded-[20px] bg-zinc-950/90 border-2 overflow-hidden shadow-2xl transition-shadow cursor-grab active:cursor-grabbing select-none ${
        isSpeaking ? 'border-indigo-500 shadow-indigo-500/10' : 'border-zinc-800'
      }`}
    >
      {/* Video Preview */}
      <video
        ref={videoRef}
        muted
        playsInline
        className="w-full h-full object-cover rounded-[20px] pointer-events-none"
        style={{ display: hasVideo ? 'block' : 'none' }}
      />

      {/* Avatar Fallback */}
      {!hasVideo && (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-zinc-900 pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-indigo-650 text-white flex items-center justify-center font-bold text-sm uppercase border border-indigo-400">
            {username.charAt(0)}
          </div>
          <span className="text-[9px] text-zinc-500 font-semibold">You (Camera off)</span>
        </div>
      )}

      {/* Mini Overlay Label */}
      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/85 to-transparent flex items-center justify-between pointer-events-none">
        <span className="text-[10px] font-bold text-white drop-shadow-md">You</span>
        <div className="flex gap-1">
          {!micEnabled && (
            <div className="w-4.5 h-4.5 rounded bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-400">
              <MicOff className="w-2.5 h-2.5" />
            </div>
          )}
          {!camEnabled && (
            <div className="w-4.5 h-4.5 rounded bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-400">
              <VideoOff className="w-2.5 h-2.5" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
