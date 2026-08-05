'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, AlertTriangle, X, Check, Mic, Users, Clock, Settings } from 'lucide-react';

// Import newly created custom components
import MeetingHeader from '@/components/meeting/MeetingHeader';
import VideoGrid from '@/components/meeting/VideoGrid';
import ChatPanel from '@/components/meeting/ChatPanel';
import ParticipantSidebar from '@/components/meeting/ParticipantSidebar';
import BottomControls from '@/components/meeting/BottomControls';
import VideoCard, { useAudioActivity } from '@/components/meeting/VideoCard';
import { addMeetingInviteeAction } from '@/app/dashboard/actions';

interface MeetingDetails {
  id: string;
  title: string;
  host: string;
  invitees: string[];
  status: 'scheduled' | 'active' | 'ended';
  createdAt: string;
}

interface MeetingRoomClientProps {
  meeting: MeetingDetails;
  username: string;
  fullName: string;
}

interface PeerConnectionWrapper {
  socketId: string;
  username: string;
  peerConnection: RTCPeerConnection;
  stream: MediaStream | null;
  videoTrackAdded: boolean;
}

interface ChatMessage {
  sender: string;
  text: string;
  flagged: boolean;
  timestamp: string;
}

interface PeerScore {
  username: string;
  score: number;
  strikes: number;
}

export default function MeetingRoomClient({ meeting, username, fullName }: MeetingRoomClientProps) {
  const router = useRouter();
  const isHost = meeting.host.toLowerCase() === username.toLowerCase();

  // Socket & local stream states
  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [screenShareEnabled, setScreenShareEnabled] = useState(false);

  // Side panels state (Chat / Participants)
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'participants'>('chat');
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Modals state
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Typing & Peer states synchronized via WebRTC Data Channels
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [peerMediaStatuses, setPeerMediaStatuses] = useState<
    Record<string, { micEnabled: boolean; camEnabled: boolean; isSpeaking: boolean }>
  >({});

  // WebRTC Peer connections
  const videoSendersRef = useRef<Map<string, RTCRtpSender>>(new Map()); // targetSocketId -> RTCRtpSender
  const peerConnectionsRef = useRef<Map<string, PeerConnectionWrapper>>(new Map()); // socketId -> Peer
  const dataChannelsRef = useRef<Map<string, RTCDataChannel>>(new Map()); // socketId -> RTCDataChannel
  const [activePeers, setActivePeers] = useState<
    { socketId: string; username: string; stream: MediaStream | null }[]
  >([]);

  // Speech Recognition continuous transcript (STT Swearing moderation)
  const [sttActive, setSttActive] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Chat message logs
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Security warning alerts from moderation backend
  const [warningToast, setWarningToast] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: '',
  });

  // Server moderation strike tracker (updated via focus-analytics-update event)
  const [peerScores, setPeerScores] = useState<PeerScore[]>([]);

  // Local user speaking activity
  const localIsSpeaking = useAudioActivity(localStream, micEnabled);

  // Setup WebRTC configurations
  const peerConfiguration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  };

  // 1. Initial capture of Audio/Video stream
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    const setupMedia = async () => {
      try {
        activeStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, frameRate: { ideal: 24 } },
          audio: true,
        });
      } catch (err) {
        console.warn('Full HD capture failed. Attempting standard visual...', err);
        try {
          activeStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
        } catch (videoErr) {
          console.warn('Video hardware blocked. Attempting audio only...', videoErr);
          try {
            activeStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          } catch (audioErr) {
            console.error('All media hardware blocked.', audioErr);
            appendSystemMessage('⚠️ Hardware error: No microphone or camera could be accessed.');
          }
        }
      }

      if (activeStream) {
        setLocalStream(activeStream);
      }
    };

    setupMedia();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 2. Setup WebRTC Data Channels and state updates
  const setupDataChannel = (dc: RTCDataChannel, targetSocketId: string) => {
    dc.onopen = () => {
      dataChannelsRef.current.set(targetSocketId, dc);
      // Sync starting states immediately
      dc.send(
        JSON.stringify({
          type: 'media-status',
          micEnabled,
          camEnabled,
        })
      );
    };

    dc.onclose = () => {
      dataChannelsRef.current.delete(targetSocketId);
    };

    dc.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'media-status') {
          setPeerMediaStatuses((prev) => ({
            ...prev,
            [targetSocketId]: {
              micEnabled: payload.micEnabled,
              camEnabled: payload.camEnabled,
              isSpeaking: prev[targetSocketId]?.isSpeaking || false,
            },
          }));
        } else if (payload.type === 'typing') {
          setTypingUsers((prev) => {
            if (payload.isTyping) {
              if (prev.includes(payload.username)) return prev;
              return [...prev, payload.username];
            } else {
              return prev.filter((u) => u !== payload.username);
            }
          });
        }
      } catch (err) {
        console.error('[DATA CHANNEL] Parse error:', err);
      }
    };
  };

  const sendMediaStatusToAll = (mic: boolean, cam: boolean) => {
    const payload = JSON.stringify({
      type: 'media-status',
      micEnabled: mic,
      camEnabled: cam,
    });
    dataChannelsRef.current.forEach((dc) => {
      if (dc.readyState === 'open') dc.send(payload);
    });
  };

  const sendTypingStatusToAll = (typing: boolean) => {
    const payload = JSON.stringify({
      type: 'typing',
      username,
      isTyping: typing,
    });
    dataChannelsRef.current.forEach((dc) => {
      if (dc.readyState === 'open') dc.send(payload);
    });
  };

  // 3. Socket.IO connection & signaling mesh lifecycle
  useEffect(() => {
    if (!localStream) return;

    const socketConn = io();
    setSocket(socketConn);

    socketConn.on('connect', () => {
      setSocketConnected(true);
      socketConn.emit('register-user', { username });
      socketConn.emit('join-meeting', { meetingId: meeting.id, username });
    });

    socketConn.on('disconnect', () => {
      setSocketConnected(false);
    });

    // Receive peer list
    socketConn.on('lobby-peers', (peersList: { socketId: string; username: string }[]) => {
      peersList.forEach((peer) => {
        initiatePeerConnection(peer.socketId, peer.username, true);
      });
    });

    // Handle new peer connecting
    socketConn.on('user-connected', ({ socketId, username: peerName }) => {
      initiatePeerConnection(socketId, peerName, false);
    });

    // WebRTC Signaling relayer channel
    socketConn.on('signal', async ({ senderSocketId, signalData }) => {
      const wrapper = peerConnectionsRef.current.get(senderSocketId);
      if (!wrapper) return;

      const pc = wrapper.peerConnection;

      if (signalData.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signalData));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketConn.emit('signal', {
          targetSocketId: senderSocketId,
          signalData: answer,
        });
      } else if (signalData.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signalData));
      } else if (signalData.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signalData));
        } catch (e) {
          console.error('[WebRTC] ICE candidate appending failure', e);
        }
      }
    });

    // Handle user disconnect
    socketConn.on('user-disconnected', ({ socketId, username: peerName, kicked, reason }) => {
      cleanupPeer(socketId);
      if (kicked) {
        appendSystemMessage(`🚨 @${peerName} was kicked from the meeting. Reason: ${reason}`);
      } else {
        appendSystemMessage(`👤 @${peerName} left the room.`);
      }
    });

    // Warnings and kicks from socket moderation
    socketConn.on('moderation-warning', ({ strikes, reason }) => {
      showSecurityWarning(`Moderation warning [Strike ${strikes}/3]: ${reason}`);
    });

    socketConn.on('force-kick', ({ reason }) => {
      alert(`⚠️ SECURE BOOT NOTICE:\nYou have been kicked from the meeting.\nReason: ${reason}`);
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
      router.push('/dashboard');
    });

    // Chat routing
    socketConn.on('chat-message', (msg) => {
      appendChatMessage(msg.sender, msg.text, msg.flagged);
      
      // Update unread count if panel isn't open on chat tab
      setSidebarOpen((isOpen) => {
        if (!isOpen || sidebarTab !== 'chat') {
          setUnreadChatCount((count) => count + 1);
        }
        return isOpen;
      });
    });

    // Striking details from server
    socketConn.on('focus-analytics-update', ({ peerScores: incomingScores }) => {
      setPeerScores(incomingScores);
    });

    socketConn.on('join-error', (err) => {
      alert(`Room entry error: ${err}`);
      router.push('/dashboard');
    });

    // Initialize RTCPeerConnection helper
    const initiatePeerConnection = (
      targetSocketId: string,
      peerName: string,
      isOfferInitiator: boolean
    ) => {
      if (peerConnectionsRef.current.has(targetSocketId)) return;

      const pc = new RTCPeerConnection(peerConfiguration);
      const stream = new MediaStream();

      // Create WebRTC Data Channel for chat features & statuses sync
      if (isOfferInitiator) {
        const dc = pc.createDataChannel('neura-meet-sync');
        setupDataChannel(dc, targetSocketId);
      }

      pc.ondatachannel = (event) => {
        setupDataChannel(event.channel, targetSocketId);
      };

      const peerWrapper: PeerConnectionWrapper = {
        socketId: targetSocketId,
        username: peerName,
        peerConnection: pc,
        stream,
        videoTrackAdded: false,
      };

      // Add local audio tracks to the peer connection
      localStream.getAudioTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      // Camera off workaround: Add video track only if camera is enabled
      if (camEnabled && localStream.getVideoTracks().length > 0) {
        const videoTrack = localStream.getVideoTracks()[0];
        const videoSender = pc.addTrack(videoTrack, localStream);
        videoSendersRef.current.set(targetSocketId, videoSender);
        peerWrapper.videoTrackAdded = true;
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketConn.emit('signal', {
            targetSocketId,
            signalData: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        const track = event.track;
        if (track.kind === 'video') {
          stream.getVideoTracks().forEach((t) => stream.removeTrack(t));
          stream.addTrack(track);
        } else if (track.kind === 'audio') {
          stream.getAudioTracks().forEach((t) => stream.removeTrack(t));
          stream.addTrack(track);
        }
        syncActivePeersList();
      };

      peerConnectionsRef.current.set(targetSocketId, peerWrapper);
      syncActivePeersList();

      if (isOfferInitiator) {
        pc.onnegotiationneeded = async () => {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socketConn.emit('signal', {
              targetSocketId,
              signalData: offer,
            });
          } catch (e) {
            console.error('[WebRTC] Offer generation negotiation error:', e);
          }
        };
      }
    };

    const cleanupPeer = (socketId: string) => {
      const wrapper = peerConnectionsRef.current.get(socketId);
      if (wrapper) {
        wrapper.peerConnection.close();
        peerConnectionsRef.current.delete(socketId);
        videoSendersRef.current.delete(socketId);

        const dc = dataChannelsRef.current.get(socketId);
        if (dc) {
          dc.close();
          dataChannelsRef.current.delete(socketId);
        }

        // Cleanup local states for this peer
        setPeerMediaStatuses((prev) => {
          const next = { ...prev };
          delete next[socketId];
          return next;
        });

        syncActivePeersList();
      }
    };

    const syncActivePeersList = () => {
      const list: { socketId: string; username: string; stream: MediaStream | null }[] = [];
      peerConnectionsRef.current.forEach((val) => {
        list.push({
          socketId: val.socketId,
          username: val.username,
          stream: val.stream,
        });
      });
      setActivePeers(list);
    };

    return () => {
      socketConn.disconnect();
      peerConnectionsRef.current.forEach((val) => {
        val.peerConnection.close();
      });
      peerConnectionsRef.current.clear();
      videoSendersRef.current.clear();
      dataChannelsRef.current.clear();
    };
  }, [localStream, username]);

  // 4. Dynamic camera track updates & WebRTC renegotiation
  useEffect(() => {
    if (!localStream) return;

    localStream.getVideoTracks().forEach((track) => {
      track.enabled = camEnabled;
    });

    peerConnectionsRef.current.forEach((wrapper, sid) => {
      const pc = wrapper.peerConnection;

      if (camEnabled && localStream.getVideoTracks().length > 0) {
        const videoTrack = localStream.getVideoTracks()[0];

        if (!wrapper.videoTrackAdded) {
          const sender = pc.addTrack(videoTrack, localStream);
          videoSendersRef.current.set(sid, sender);
          wrapper.videoTrackAdded = true;

          pc.createOffer().then((offer) => {
            pc.setLocalDescription(offer);
            socket?.emit('signal', {
              targetSocketId: sid,
              signalData: offer,
            });
          });
        }
      } else {
        const sender = videoSendersRef.current.get(sid);
        if (sender) {
          try {
            pc.removeTrack(sender);
          } catch (e) {
            console.warn('Track remove failed', e);
          }
          videoSendersRef.current.delete(sid);
          wrapper.videoTrackAdded = false;

          pc.createOffer().then((offer) => {
            pc.setLocalDescription(offer);
            socket?.emit('signal', {
              targetSocketId: sid,
              signalData: offer,
            });
          });
        }
      }
    });
  }, [camEnabled, localStream, socket]);

  // 5. Emit background focus score of 100 to prevent server kicks or analytics crash
  useEffect(() => {
    if (!socket) return;

    const dispatchHeartbeat = () => {
      if (socket.connected) {
        socket.emit('focus-score', { score: 100 });
      }
    };

    const interval = setInterval(dispatchHeartbeat, 10000);
    return () => clearInterval(interval);
  }, [socket]);

  // 6. Speech-to-Text Setup (Continuous Swearing moderation)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser environment.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const lastIdx = event.results.length - 1;
      const transcript = event.results[lastIdx][0].transcript.trim();

      if (transcript && socket && socket.connected) {
        console.log(`[STT Moderation]: "${transcript}"`);
        socket.emit('speech-transcript', { text: transcript });
      }
    };

    recognition.onend = () => {
      if (sttActive) {
        recognition.start();
      }
    };

    recognitionRef.current = recognition;

    if (sttActive) {
      recognition.start();
      appendSystemMessage('🎙️ Continuous verbal swearing moderation activated.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
    };
  }, [sttActive, socket]);

  // 7. Global Keyboard Shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'm') {
        e.preventDefault();
        toggleMic();
      } else if (key === 'v') {
        e.preventDefault();
        toggleCam();
      } else if (key === 'c') {
        e.preventDefault();
        setSidebarOpen((prev) => {
          if (prev && sidebarTab === 'chat') return false;
          setSidebarTab('chat');
          return true;
        });
      } else if (key === 'p') {
        e.preventDefault();
        setSidebarOpen((prev) => {
          if (prev && sidebarTab === 'participants') return false;
          setSidebarTab('participants');
          return true;
        });
      } else if (key === 'l') {
        e.preventDefault();
        handleLeaveCall();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [micEnabled, camEnabled, sidebarTab, localStream, socket]);

  // Clear unread count when chat panel is opened
  useEffect(() => {
    if (sidebarOpen && sidebarTab === 'chat') {
      setUnreadChatCount(0);
    }
  }, [sidebarOpen, sidebarTab]);

  // UI action operations
  const toggleMic = () => {
    if (localStream) {
      const nextMic = !micEnabled;
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = nextMic;
      });
      setMicEnabled(nextMic);
      sendMediaStatusToAll(nextMic, camEnabled);
    }
  };

  const toggleCam = () => {
    const nextCam = !camEnabled;
    setCamEnabled(nextCam);
    sendMediaStatusToAll(micEnabled, nextCam);
  };

  const toggleScreenShare = () => {
    setScreenShareEnabled((prev) => {
      const next = !prev;
      if (next) {
        appendSystemMessage('🖥️ You started screen sharing (visual mock).');
      } else {
        appendSystemMessage('🖥️ You stopped screen sharing.');
      }
      return next;
    });
  };

  const toggleSidebarTab = (tab: 'chat' | 'participants') => {
    if (sidebarOpen && sidebarTab === tab) {
      setSidebarOpen(false);
    } else {
      setSidebarTab(tab);
      setSidebarOpen(true);
    }
  };

  const handleSendMessage = (text: string) => {
    if (socket && socket.connected) {
      socket.emit('chat-message', { text });
    }
  };

  const handleTypingStart = () => {
    sendTypingStatusToAll(true);
  };

  const handleTypingEnd = () => {
    sendTypingStatusToAll(false);
  };

  const handleInviteUserLive = async (targetUsername: string) => {
    const res = await addMeetingInviteeAction(meeting.id, targetUsername);
    if (res.success && res.meeting) {
      if (socket) {
        socket.emit('meeting-created', {
          meetingId: meeting.id,
          title: meeting.title,
          host: res.hostFullName,
          hostUsername: username,
          invitees: [res.addedUsername],
        });
      }
      return { success: true };
    } else {
      return { success: false, error: res.error };
    }
  };

  const handleLeaveCall = () => {
    if (confirm('Are you sure you want to leave this meeting?')) {
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
      router.push('/dashboard');
    }
  };

  const handleSpeakingChange = (name: string, isSpeaking: boolean) => {
    // If it's local user, we do not need to update remote maps
    if (name.toLowerCase() === username.toLowerCase()) return;

    // Find remote peer target socket ID
    const peerWrapper = activePeers.find((p) => p.username.toLowerCase() === name.toLowerCase());
    if (!peerWrapper) return;

    setPeerMediaStatuses((prev) => {
      const current = prev[peerWrapper.socketId];
      if (current && current.isSpeaking === isSpeaking) return prev;
      return {
        ...prev,
        [peerWrapper.socketId]: {
          micEnabled: current?.micEnabled ?? true,
          camEnabled: current?.camEnabled ?? true,
          isSpeaking,
        },
      };
    });
  };

  const showSecurityWarning = (message: string) => {
    setWarningToast({ visible: true, message });
    setTimeout(() => {
      setWarningToast((prev) => (prev.message === message ? { visible: false, message: '' } : prev));
    }, 4500);
  };

  const appendChatMessage = (sender: string, text: string, flagged: boolean) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) => [...prev, { sender, text, flagged, timestamp }]);
  };

  const appendSystemMessage = (text: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) => [...prev, { sender: 'SystemAlert', text, flagged: false, timestamp }]);
  };

  // Compile participant list for the Sidebar view
  const participantsList = [
    {
      username,
      isHost: meeting.host.toLowerCase() === username.toLowerCase(),
      micEnabled,
      camEnabled,
      isSpeaking: localIsSpeaking,
      strikes: peerScores.find((p) => p.username.toLowerCase() === username.toLowerCase())?.strikes || 0,
    },
    ...activePeers.map((peer) => {
      const mediaStatus = peerMediaStatuses[peer.socketId] || {
        micEnabled: true,
        camEnabled: true,
        isSpeaking: false,
      };
      const scoreData = peerScores.find((p) => p.username.toLowerCase() === peer.username.toLowerCase());
      return {
        username: peer.username,
        isHost: meeting.host.toLowerCase() === peer.username.toLowerCase(),
        micEnabled: mediaStatus.micEnabled,
        camEnabled: mediaStatus.camEnabled,
        isSpeaking: mediaStatus.isSpeaking,
        strikes: scoreData ? scoreData.strikes : 0,
      };
    }),
  ];

  return (
    <div className="min-h-screen bg-[#09090B] bg-mesh text-slate-100 flex flex-col font-sans relative overflow-hidden select-none">
      
      {/* Top sticky meeting room header */}
      <MeetingHeader
        title={meeting.title}
        meetingId={meeting.id}
        host={meeting.host}
        socketConnected={socketConnected}
        participantCount={participantsList.length}
        startTime={meeting.createdAt}
        onSettingsClick={() => setSettingsOpen(true)}
      />

      {/* Main room view body */}
      <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
        
        {/* Left main: Video layout */}
        <div className="flex-grow flex flex-col relative overflow-y-auto custom-scrollbar pb-24 h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)]">
          <VideoGrid
            localStream={localStream}
            localUsername={username}
            localMicEnabled={micEnabled}
            localCamEnabled={camEnabled}
            localIsSpeaking={localIsSpeaking}
            activePeers={activePeers}
            peerMediaStatuses={peerMediaStatuses}
            meetingHost={meeting.host}
          />
        </div>

        {/* Right side panels: Desktop Sidebar only */}
        {sidebarOpen && (
          <div className="hidden lg:flex w-80 xl:w-96 border-l border-zinc-900 bg-zinc-950 flex-col h-[calc(100vh-4rem)] shrink-0 z-20">
            {/* Sidebar Tabs */}
            <div className="flex border-b border-zinc-900 bg-zinc-950/40">
              <button
                onClick={() => setSidebarTab('chat')}
                className={`flex-1 py-4 text-[10px] font-extrabold uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
                  sidebarTab === 'chat'
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-zinc-550 hover:text-zinc-350'
                }`}
              >
                Room Chat
              </button>
              <button
                onClick={() => setSidebarTab('participants')}
                className={`flex-1 py-4 text-[10px] font-extrabold uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
                  sidebarTab === 'participants'
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-zinc-550 hover:text-zinc-350'
                }`}
              >
                Participants ({participantsList.length})
              </button>
            </div>

            {/* Sidebar Contents */}
            <div className="flex-1 overflow-hidden">
              {sidebarTab === 'chat' ? (
                <ChatPanel
                  messages={chatMessages}
                  onSendMessage={handleSendMessage}
                  username={username}
                  typingUsers={typingUsers}
                  onTypingStart={handleTypingStart}
                  onTypingEnd={handleTypingEnd}
                />
              ) : (
                <ParticipantSidebar 
                  participants={participantsList} 
                  isHost={isHost}
                  onInviteUser={handleInviteUserLive}
                />
              )}
            </div>
          </div>
        )}

      </div>

      {/* Floating Bottom Control pill */}
      <BottomControls
        micEnabled={micEnabled}
        camEnabled={camEnabled}
        screenShareEnabled={screenShareEnabled}
        chatOpen={sidebarOpen && sidebarTab === 'chat'}
        participantsOpen={sidebarOpen && sidebarTab === 'participants'}
        unreadChatCount={unreadChatCount}
        onToggleMic={toggleMic}
        onToggleCam={toggleCam}
        onToggleScreenShare={toggleScreenShare}
        onToggleChat={() => toggleSidebarTab('chat')}
        onToggleParticipants={() => toggleSidebarTab('participants')}
        onToggleSettings={() => setSettingsOpen(true)}
        onLeave={handleLeaveCall}
      />

      {/* Mobile Drawer Bottom Sheet for Chat / Participants */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden flex items-end justify-center"
            onClick={() => setSidebarOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-h-[75vh] bg-zinc-950 border-t border-zinc-900 rounded-t-[20px] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sheet header */}
              <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-900">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  {sidebarTab === 'chat' ? 'Meeting Chat' : 'Participants'}
                </span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sheet Body */}
              <div className="flex-1 overflow-hidden min-h-0">
                {sidebarTab === 'chat' ? (
                  <ChatPanel
                    messages={chatMessages}
                    onSendMessage={handleSendMessage}
                    username={username}
                    typingUsers={typingUsers}
                    onTypingStart={handleTypingStart}
                    onTypingEnd={handleTypingEnd}
                  />
                ) : (
                  <ParticipantSidebar 
                    participants={participantsList} 
                    isHost={isHost}
                    onInviteUser={handleInviteUserLive}
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* settings modal overlay */}
      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="glass-panel max-w-md w-full p-6 text-left flex flex-col gap-5 border border-zinc-800 shadow-2xl relative"
            >
              {/* Close settings */}
              <button
                onClick={() => setSettingsOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-transparent hover:border-zinc-750"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                <span>Room Configuration</span>
              </h3>

              <div className="h-px bg-zinc-850 w-full" />

              {/* Settings configuration items */}
              <div className="flex flex-col gap-4 py-2">
                
                {/* Audio Moderation Toggle */}
                <div className="flex items-center justify-between p-3 bg-zinc-900/40 border border-zinc-900 rounded-xl">
                  <div className="flex flex-col text-left pr-4">
                    <span className="text-xs font-bold text-white">Audio Swearing Moderation</span>
                    <span className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">
                      Analyze spoken audio tracks and flag abusive verbal words in chat.
                    </span>
                  </div>
                  <button
                    onClick={() => setSttActive(!sttActive)}
                    className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                      sttActive
                        ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30'
                        : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-zinc-750'
                    }`}
                  >
                    {sttActive ? 'ACTIVE' : 'OFF'}
                  </button>
                </div>

                {/* Local Room Information details */}
                <div className="flex flex-col gap-2.5 p-3.5 bg-zinc-900/40 border border-zinc-900 rounded-xl text-[11px]">
                  <span className="font-bold text-indigo-400 uppercase tracking-widest text-[9px]">
                    Lobby Parameters
                  </span>
                  <div className="flex justify-between mt-1 text-zinc-400">
                    <span>Host Status</span>
                    <span className="text-white font-semibold">
                      {isHost ? 'Meeting Owner' : 'Participant'}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Active Audio Device</span>
                    <span className="text-white truncate max-w-[180px] font-semibold">
                      {localStream && localStream.getAudioTracks().length > 0
                        ? 'Default System Microphone'
                        : 'No Hardware Selected'}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Active Video Source</span>
                    <span className="text-white truncate max-w-[180px] font-semibold">
                      {localStream && localStream.getVideoTracks().length > 0
                        ? 'Default System Camera'
                        : 'No Video Feed Available'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSettingsOpen(false)}
                className="w-full py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-550 text-white font-extrabold text-xs shadow-md transition-all active:scale-[0.98] mt-2 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save and Exit</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Warnings Toast overlay */}
      <AnimatePresence>
        {warningToast.visible && (
          <motion.div
            initial={{ y: -50, x: '-50%', opacity: 0 }}
            animate={{ y: 0, x: '-50%', opacity: 1 }}
            exit={{ y: -50, x: '-50%', opacity: 0 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm bg-rose-950 border border-rose-900/60 p-4 rounded-xl shadow-2xl flex items-center gap-3.5"
          >
            <AlertTriangle className="w-5 h-5 text-rose-450 shrink-0" />
            <div className="flex flex-col flex-1 text-left">
              <span className="text-[9px] uppercase font-extrabold tracking-wider text-rose-400">
                Security Warning
              </span>
              <span className="text-xs font-semibold text-slate-200 mt-0.5 leading-relaxed">
                {warningToast.message}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
