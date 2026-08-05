'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface VideoCardProps {
  stream: MediaStream | null;
  username: string;
  isLocal: boolean;
  isHost: boolean;
  micEnabled: boolean;
  camEnabled: boolean;
  isSpeakingOverride?: boolean; // Prop to override speaking state from outside
  onSpeakingChange?: (username: string, isSpeaking: boolean) => void;
}

// Hook to detect audio levels of a MediaStream
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
        
        // Threshold for speaking detection
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

  // If there's an override, we use it, otherwise we detect locally from the stream
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

    // Attach stream to the video tag if it changed
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
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`relative w-full aspect-video rounded-[20px] overflow-hidden bg-zinc-900 border smooth-transition flex items-center justify-center group shadow-lg ${
        isSpeaking
          ? 'video-glow-speaking'
          : 'border-zinc-800'
      }`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        muted={isLocal} // Always mute local user preview to prevent self-echo
        playsInline
        className="w-full h-full object-cover rounded-[20px]"
        style={{ display: showVideo ? 'block' : 'none' }}
      />

      {/* Avatar Fallback Card when Video is Disabled */}
      {!showVideo && (
        <div className="flex flex-col items-center justify-center gap-4 text-center select-none">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-650 to-indigo-500 border border-indigo-400 flex items-center justify-center text-white text-2xl font-bold uppercase shadow-lg shadow-indigo-900/10">
            {username.charAt(0)}
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-semibold text-white">@{username}</span>
            <span className="text-[10px] text-zinc-500 font-medium">Camera turned off</span>
          </div>
        </div>
      )}

      {/* Overlay Status Labels (Bottom Bar) */}
      <div className="absolute inset-x-0 bottom-0 p-3.5 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex items-center justify-between z-20 pointer-events-none">
        {/* Name and Indicators */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white flex items-center gap-1.5 drop-shadow-md">
            {isLocal ? 'You' : `@${username}`}
            {isHost && (
              <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.25 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 rounded-md">
                <ShieldCheck className="w-2.5 h-2.5 text-indigo-400" />
                <span>Host</span>
              </span>
            )}
          </span>

          {/* Equalizer animation when speaking */}
          {isSpeaking && (
            <div className="flex items-center gap-0.5 h-3.5 w-4 px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-400/30 rounded-md">
              <span className="eq-bar" />
              <span className="eq-bar" />
              <span className="eq-bar" />
              <span className="eq-bar" />
            </div>
          )}
        </div>

        {/* Media indicators (mic/camera status badges) */}
        <div className="flex items-center gap-1.5">
          {/* Mic Badge */}
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
              micEnabled
                ? 'bg-zinc-950/70 border-zinc-800 text-zinc-300'
                : 'bg-rose-500/20 border-rose-400/30 text-rose-400'
            }`}
          >
            {micEnabled ? (
              <Mic className="w-3.5 h-3.5" />
            ) : (
              <MicOff className="w-3.5 h-3.5" />
            )}
          </div>

          {/* Cam Badge */}
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
              camEnabled
                ? 'bg-zinc-950/70 border-zinc-800 text-zinc-300'
                : 'bg-rose-500/20 border-rose-400/30 text-rose-400'
            }`}
          >
            {camEnabled ? (
              <Video className="w-3.5 h-3.5" />
            ) : (
              <VideoOff className="w-3.5 h-3.5" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
