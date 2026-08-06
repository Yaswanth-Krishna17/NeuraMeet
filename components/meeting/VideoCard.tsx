'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, ShieldCheck, CheckCircle, Wifi } from 'lucide-react';
import { motion } from 'framer-motion';

interface VideoCardProps {
  stream: MediaStream | null;
  username: string;
  isLocal: boolean;
  isHost: boolean;
  micEnabled: boolean;
  camEnabled: boolean;
  isSpeakingOverride?: boolean;
  onSpeakingChange?: (username: string, isSpeaking: boolean) => void;
}

export function useAudioActivity(stream: MediaStream | null, enabled: boolean) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (!stream || !enabled) {
      setIsSpeaking(false);
      return;
    }

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      setIsSpeaking(false);
      return;
    }

    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let rafId: number | null = null;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContext = new AudioContextClass();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      
      source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkAudio = () => {
        if (!analyser) return;
        analyser.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        
        setIsSpeaking(average > 12);
        rafId = requestAnimationFrame(checkAudio);
      };

      checkAudio();
    } catch (err) {
      console.warn("Audio analysis failed", err);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (source) source.disconnect();
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, [stream, enabled]);

  return isSpeaking;
}

export default function VideoCard({
  stream,
  username,
  isLocal,
  isHost,
  micEnabled,
  camEnabled,
  isSpeakingOverride,
  onSpeakingChange,
}: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const detectedSpeaking = useAudioActivity(stream, micEnabled);
  const isSpeaking = isSpeakingOverride !== undefined ? isSpeakingOverride : detectedSpeaking;

  const hasVideoTrack = stream && stream.getVideoTracks().length > 0;
  const showVideo = camEnabled && hasVideoTrack;

  useEffect(() => {
    if (onSpeakingChange) {
      onSpeakingChange(username, isSpeaking);
    }
  }, [isSpeaking, username, onSpeakingChange]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !stream) return;

    if (videoElement.srcObject !== stream) {
      videoElement.srcObject = stream;
      videoElement.play().catch((err) => {
        console.warn(`Autoplay blocked on video for user: ${username}`, err);
      });
    }
  }, [stream, username]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`relative w-full aspect-video rounded-3xl overflow-hidden bg-white dark:bg-zinc-900/60 border-2 transition-all duration-300 flex items-center justify-center group shadow-md dark:shadow-none ${
        isSpeaking
          ? 'border-landing-primary dark:border-landing-primary shadow-lg shadow-landing-primary/25 ring-2 ring-landing-primary/25'
          : 'border-zinc-200/80 dark:border-zinc-800/80'
      }`}
    >
      {/* Video Stream Element */}
      <video
        ref={videoRef}
        muted={isLocal}
        playsInline
        className="w-full h-full object-cover rounded-3xl"
        style={{ display: showVideo ? 'block' : 'none' }}
      />

      {/* Avatar Fallback Card when Video is Disabled */}
      {!showVideo && (
        <div className="flex flex-col items-center justify-center gap-3.5 text-center select-none w-full h-full bg-stone-50 dark:bg-zinc-950/40">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-landing-primary to-landing-highlight border border-white/20 flex items-center justify-center text-white text-xl font-bold uppercase shadow-lg shadow-landing-primary/20 animate-pulse">
            {username.charAt(0)}
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">@{username}</span>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/10 shrink-0" />
            </div>
            <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Camera turned off</span>
          </div>
        </div>
      )}

      {/* Overlay Status Labels (Bottom Bar) */}
      <div className="absolute inset-x-3 bottom-3 p-2 bg-white/70 dark:bg-[#111827]/70 backdrop-blur-md border border-zinc-200/60 dark:border-white/5 rounded-2xl flex items-center justify-between z-20 pointer-events-none transition-colors shadow-[0_4px_12px_rgba(0,0,0,0.03)] select-none">
        
        {/* Name and verified indicators */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black text-zinc-800 dark:text-white flex items-center gap-1">
            {isLocal ? 'You' : `@${username}`}
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/10 shrink-0" />
            
            {isHost && (
              <span className="flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 bg-landing-primary/10 border border-landing-primary/30 text-landing-primary dark:text-indigo-400 rounded-lg">
                <ShieldCheck className="w-2.5 h-2.5 text-landing-primary dark:text-indigo-400" />
                <span>Host</span>
              </span>
            )}
          </span>

          {/* Equalizer animation when speaking */}
          {isSpeaking && (
            <div className="flex items-center gap-0.5 h-3 w-3 px-0.5 bg-emerald-500/15 border border-emerald-500/25 rounded-md">
              <span className="eq-bar bg-emerald-500" />
              <span className="eq-bar bg-emerald-500" />
              <span className="eq-bar bg-emerald-500" />
              <span className="eq-bar bg-emerald-500" />
            </div>
          )}
        </div>

        {/* Media & connection badges (mic/camera status) */}
        <div className="flex items-center gap-1.5">
          {/* Signal Wifi indicator */}
          {!isLocal && (
            <div className="w-6 h-6 rounded-lg bg-zinc-100/50 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-center text-emerald-500">
              <Wifi className="w-3 h-3 text-emerald-500" />
            </div>
          )}

          {/* Mic Status */}
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
              micEnabled
                ? 'bg-zinc-100/50 dark:bg-zinc-950/50 border-zinc-200/80 dark:border-zinc-800/80 text-zinc-650 dark:text-zinc-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-500'
            }`}
          >
            {micEnabled ? (
              <Mic className="w-3 h-3" />
            ) : (
              <MicOff className="w-3 h-3" />
            )}
          </div>

          {/* Cam Status */}
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
              camEnabled
                ? 'bg-zinc-100/50 dark:bg-zinc-950/50 border-zinc-200/80 dark:border-zinc-800/80 text-zinc-650 dark:text-zinc-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-500'
            }`}
          >
            {camEnabled ? (
              <Video className="w-3 h-3" />
            ) : (
              <VideoOff className="w-3 h-3" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
