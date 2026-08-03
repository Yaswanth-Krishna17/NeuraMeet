'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, Shield, CheckCircle, AlertTriangle, MessageSquare, Mic, MicOff, Video, VideoOff, BarChart2 } from 'lucide-react';

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

  // Socket & Streams State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);

  // WebRTC Senders to dynamically add/remove tracks
  const videoSendersRef = useRef<Map<string, RTCRtpSender>>(new Map()); // targetSocketId -> RTCRtpSender
  const peerConnectionsRef = useRef<Map<string, PeerConnectionWrapper>>(new Map()); // socketId -> Peer
  const [activePeers, setActivePeers] = useState<{ socketId: string; username: string; stream: MediaStream | null }[]>([]);

  // Speech Recognition continuous transcript State
  const [sttActive, setSttActive] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Chat Panel State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatCollapsed, setChatCollapsed] = useState(false);

  // Moderation warning toast
  const [warningToast, setWarningToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

  // Focus Analytics State
  const [focusScore, setFocusScore] = useState(100);
  const [focusDetails, setFocusDetails] = useState({ distracted: false, drowsy: false });
  const [hostAvgFocus, setHostAvgFocus] = useState(100);
  const [hostParticipantCount, setHostParticipantCount] = useState(0);
  const [peerScores, setPeerScores] = useState<PeerScore[]>([]);

  // DOM Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Dynamic MediaPipe Scripts Loading State
  const [mediaPipeLoaded, setMediaPipeLoaded] = useState(false);

  // Non-Camera Telemetry tracking variables
  const lastActivityTimeRef = useRef<number>(Date.now());
  const windowFocusedRef = useRef<boolean>(true);
  const tabVisibleRef = useRef<boolean>(true);

  // 1. Load Google MediaPipe CDN Scripts dynamically
  useEffect(() => {
    let cameraScript: HTMLScriptElement;
    let faceMeshScript: HTMLScriptElement;

    const loadCamera = () => {
      cameraScript = document.createElement('script');
      cameraScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
      cameraScript.async = true;
      document.body.appendChild(cameraScript);

      cameraScript.onload = () => {
        faceMeshScript = document.createElement('script');
        faceMeshScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
        faceMeshScript.async = true;
        document.body.appendChild(faceMeshScript);

        faceMeshScript.onload = () => {
          setMediaPipeLoaded(true);
          console.log('🚀 MediaPipe Face Mesh & Camera loaded successfully.');
        };
      };
    };

    loadCamera();

    return () => {
      if (cameraScript) document.body.removeChild(cameraScript);
      if (faceMeshScript) document.body.removeChild(faceMeshScript);
    };
  }, []);

  // 2. Setup non-camera telemetry hooks
  useEffect(() => {
    const handleFocus = () => {
      windowFocusedRef.current = true;
      lastActivityTimeRef.current = Date.now();
    };
    const handleBlur = () => {
      windowFocusedRef.current = false;
      setFocusDetails((prev) => ({ ...prev, distracted: true }));
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        tabVisibleRef.current = false;
        setFocusDetails((prev) => ({ ...prev, distracted: true }));
      } else {
        tabVisibleRef.current = true;
        lastActivityTimeRef.current = Date.now();
      }
    };
    const handleActivity = () => {
      lastActivityTimeRef.current = Date.now();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibility);

    const activityEvents = ['mousemove', 'keypress', 'scroll', 'click'];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleActivity, { passive: true });
    });

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibility);
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleActivity);
      });
    };
  }, []);

  // 3. Audio/Video Local Stream Capture
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    const setupMedia = async () => {
      try {
        // Try getting video & audio
        activeStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 360, frameRate: { ideal: 24 } },
          audio: true,
        });
      } catch (err) {
        console.warn('Full media capture failed. Attempting audio only...', err);
        try {
          activeStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (audioErr) {
          console.error('All media hardware blocked.', audioErr);
        }
      }

      if (activeStream) {
        setLocalStream(activeStream);
        if (localVideoRef.current && activeStream.getVideoTracks().length > 0) {
          localVideoRef.current.srcObject = activeStream;
          localVideoRef.current.play().catch(e => console.warn('Autoplay blocked:', e));
        }
        if (hiddenVideoRef.current && activeStream.getVideoTracks().length > 0) {
          hiddenVideoRef.current.srcObject = activeStream;
          hiddenVideoRef.current.play().catch(e => console.warn('Hidden stream autoplay blocked:', e));
        }
      }
    };

    setupMedia();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 4. Focus Telemetry Heartbeat Score Calculator (every 10s)
  useEffect(() => {
    const dispatchHeartbeat = () => {
      setFocusScore((prevScore) => {
        let newScore = prevScore;
        const inactiveDuration = Date.now() - lastActivityTimeRef.current;

        if (!windowFocusedRef.current || !tabVisibleRef.current) {
          newScore = 0;
          setFocusDetails((prev) => ({ ...prev, distracted: true }));
        } else if (focusDetails.drowsy) {
          newScore = Math.max(0, newScore - 30);
        } else if (focusDetails.distracted) {
          newScore = Math.max(0, newScore - 20);
        } else if (inactiveDuration > 180000) {
          // Inactive mouse/keyboard for >3 minutes
          newScore = Math.max(10, newScore - 15);
        } else {
          newScore = Math.min(100, newScore + 15);
        }

        // Emit local focus updates to WebSockets
        if (socket && socket.connected) {
          socket.emit('focus-score', { score: newScore });
        }

        return newScore;
      });
    };

    const interval = setInterval(dispatchHeartbeat, 10000);
    return () => clearInterval(interval);
  }, [focusDetails, socket]);

  // 5. Google MediaPipe Face Mesh Initialization
  useEffect(() => {
    if (!mediaPipeLoaded || !localStream || localStream.getVideoTracks().length === 0 || !hiddenVideoRef.current) return;

    let faceMesh: any;
    let camera: any;

    try {
      const FaceMeshClass = (window as any).FaceMesh;
      const CameraClass = (window as any).Camera;

      if (!FaceMeshClass || !CameraClass) return;

      faceMesh = new FaceMeshClass({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      let eyesClosedStartTime: number | null = null;

      faceMesh.onResults((results: any) => {
        const landmarks = results.multiFaceLandmarks ? results.multiFaceLandmarks[0] : null;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');

        if (!canvas || !ctx) return;

        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!landmarks) {
          // Face missing
          setFocusDetails({ distracted: true, drowsy: false });
          return;
        }

        // --- Render glow mesh layers (Cyber visual wow factor) ---
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)'; // Cyan mesh lines
        ctx.lineWidth = 1;

        const drawPolyline = (points: number[]) => {
          ctx.beginPath();
          points.forEach((idx, i) => {
            const pt = landmarks[idx];
            if (!pt) return;
            const x = pt.x * canvas.width;
            const y = pt.y * canvas.height;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.closePath();
          ctx.stroke();
        };

        const drawDot = (pt: any) => {
          if (!pt) return;
          ctx.beginPath();
          ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 2.5, 0, 2 * Math.PI);
          ctx.fillStyle = '#10b981'; // emerald green dots
          ctx.fill();
        };

        // Draw left eye boundary
        drawPolyline([33, 160, 158, 133, 153, 144]);
        // Draw right eye boundary
        drawPolyline([362, 385, 387, 263, 373, 380]);
        // Outer face boundary
        drawPolyline([10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]);

        // Draw glowing eye centers
        drawDot(landmarks[468]);
        drawDot(landmarks[473]);

        // --- Core Algorithm Feature A: Eye Aspect Ratio (EAR) for Drowsiness ---
        const getEyeRatio = (top: number, bottom: number, left: number, right: number) => {
          const pTop = landmarks[top];
          const pBottom = landmarks[bottom];
          const pLeft = landmarks[left];
          const pRight = landmarks[right];
          const vert = Math.sqrt(Math.pow(pTop.x - pBottom.x, 2) + Math.pow(pTop.y - pBottom.y, 2));
          const horiz = Math.sqrt(Math.pow(pLeft.x - pRight.x, 2) + Math.pow(pLeft.y - pRight.y, 2));
          return vert / horiz;
        };

        const earLeft = getEyeRatio(386, 374, 362, 263);
        const earRight = getEyeRatio(159, 145, 33, 133);
        const avgEAR = (earLeft + earRight) / 2;

        let localDrowsy = false;
        if (avgEAR < 0.15) {
          if (!eyesClosedStartTime) {
            eyesClosedStartTime = Date.now();
          } else if (Date.now() - eyesClosedStartTime > 2000) {
            localDrowsy = true;
          }
        } else {
          eyesClosedStartTime = null;
        }

        // --- Feature B: Head turn Pose ---
        const nose = landmarks[4];
        const leftFace = landmarks[234];
        const rightFace = landmarks[454];
        const horizontalRatio = Math.abs(nose.x - leftFace.x) / Math.abs(nose.x - rightFace.x);

        const chin = landmarks[152];
        const noseBridge = landmarks[168];
        const verticalRatio = Math.abs(nose.y - noseBridge.y) / Math.abs(nose.y - chin.y);

        const turnedAway = horizontalRatio < 0.45 || horizontalRatio > 2.2 || verticalRatio < 0.35 || verticalRatio > 1.8;

        // --- Feature C: Eye Gaze offset ---
        const leftIris = landmarks[468];
        const rightIris = landmarks[473];
        const leftIrisOffset = Math.abs(leftIris.x - landmarks[362].x) / Math.abs(landmarks[263].x - landmarks[362].x);
        const rightIrisOffset = Math.abs(rightIris.x - landmarks[33].x) / Math.abs(landmarks[133].x - landmarks[33].x);

        const gazeShifted = leftIrisOffset < 0.28 || leftIrisOffset > 0.72 || rightIrisOffset < 0.28 || rightIrisOffset > 0.72;

        setFocusDetails({
          drowsy: localDrowsy,
          distracted: turnedAway || gazeShifted,
        });
      });

      camera = new CameraClass(hiddenVideoRef.current, {
        onFrame: async () => {
          // Read local camera frame even if camera is turned off locally (camera-off background processing)
          if (localStream.getVideoTracks()[0]?.readyState === 'live') {
            await faceMesh.send({ image: hiddenVideoRef.current });
          }
        },
        width: 640,
        height: 360,
      });

      camera.start();
    } catch (err) {
      console.error('FaceMesh starting failure:', err);
    }

    return () => {
      if (camera) camera.stop();
      if (faceMesh) faceMesh.close();
    };
  }, [mediaPipeLoaded, localStream]);

  // 6. Sockets Initialization & Signaling Mesh Router
  useEffect(() => {
    if (!localStream) return;

    const socketConn = io();
    setSocket(socketConn);

    const peerConfiguration = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    };

    socketConn.on('connect', () => {
      socketConn.emit('register-user', { username });
      socketConn.emit('join-meeting', { meetingId: meeting.id, username });
    });

    // Receive initial lobby peer list
    socketConn.on('lobby-peers', (peersList: { socketId: string; username: string }[]) => {
      console.log(`Lobby has ${peersList.length} peers. Establishing handshakes.`);
      peersList.forEach((peer) => {
        initiatePeerConnection(peer.socketId, peer.username, true);
      });
    });

    // Handle new incoming peer connections
    socketConn.on('user-connected', ({ socketId, username: peerName }) => {
      console.log(`User connected: ${peerName} (${socketId})`);
      initiatePeerConnection(socketId, peerName, false);
    });

    // WebRTC Signaling relayer
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
          console.error('Error appending ICE candidate', e);
        }
      }
    });

    // Handle user disconnect
    socketConn.on('user-disconnected', ({ socketId, username: peerName, kicked, reason }) => {
      console.log(`Peer left: ${peerName}`);
      cleanupPeer(socketId);
      if (kicked) {
        appendSystemMessage(`🚨 @${peerName} was kicked from the meeting. Reason: ${reason}`);
      }
    });

    // Handle warnings and eviction from server moderation
    socketConn.on('moderation-warning', ({ strikes, reason }) => {
      showSecurityWarning(`Strike ${strikes}/3 warning: ${reason}`);
    });

    socketConn.on('force-kick', ({ reason }) => {
      alert(`⚠️ SECURE BOOT NOTICE:\nYou have been kicked from the meeting room.\nReason: ${reason}`);
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
      router.push('/dashboard');
    });

    // Chat message routing
    socketConn.on('chat-message', (msg) => {
      appendChatMessage(msg.sender, msg.text, msg.flagged);
    });

    // Host statistics updates & visual indicators on remote peers
    socketConn.on('focus-analytics-update', ({ averageFocus, participantCount, peerScores: incomingScores }) => {
      setPeerScores(incomingScores);
      if (isHost) {
        setHostAvgFocus(averageFocus);
        setHostParticipantCount(participantCount);
      }
    });

    socketConn.on('join-error', (err) => {
      alert(`Meeting Join Error: ${err}`);
      router.push('/dashboard');
    });

    // --- Helper WebRTC connection actions ---
    const initiatePeerConnection = (targetSocketId: string, peerName: string, isOfferInitiator: boolean) => {
      if (peerConnectionsRef.current.has(targetSocketId)) return;

      const pc = new RTCPeerConnection(peerConfiguration);
      const stream = new MediaStream();

      const peerWrapper: PeerConnectionWrapper = {
        socketId: targetSocketId,
        username: peerName,
        peerConnection: pc,
        stream,
        videoTrackAdded: false,
      };

      // Add local audio track immediately
      localStream.getAudioTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      // Camera-off Workaround: Only append local video track to RTCPeerConnection IF camera is turned ON
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

        // Trigger react state update
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
            console.error('Offer generation error during negotiation:', e);
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
        syncActivePeersList();
      }
    };

    const syncActivePeersList = () => {
      const list: any[] = [];
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
    };
  }, [localStream, username]);

  // 7. Dynamic Camera track toggler & WebRTC updates (Camera Off Workaround)
  useEffect(() => {
    if (!localStream) return;

    // A. Modify local video preview track enablement
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = camEnabled;
    });

    // B. Handle the dynamic transmission of local video track over WebRTC peer connections
    peerConnectionsRef.current.forEach((wrapper, sid) => {
      const pc = wrapper.peerConnection;

      if (camEnabled && localStream.getVideoTracks().length > 0) {
        const videoTrack = localStream.getVideoTracks()[0];
        
        // If track is not yet added to peer connection, append it dynamically
        if (!wrapper.videoTrackAdded) {
          const sender = pc.addTrack(videoTrack, localStream);
          videoSendersRef.current.set(sid, sender);
          wrapper.videoTrackAdded = true;
          
          // Re-negotiate offer
          pc.createOffer().then((offer) => {
            pc.setLocalDescription(offer);
            socket?.emit('signal', {
              targetSocketId: sid,
              signalData: offer
            });
          });
        }
      } else {
        // Camera Turned Off: remove dynamic video track sender to block broadcast
        const sender = videoSendersRef.current.get(sid);
        if (sender) {
          try {
            pc.removeTrack(sender);
          } catch (e) {
            console.warn('Track remove failed', e);
          }
          videoSendersRef.current.delete(sid);
          wrapper.videoTrackAdded = false;

          // Re-negotiate offer to update video streams
          pc.createOffer().then((offer) => {
            pc.setLocalDescription(offer);
            socket?.emit('signal', {
              targetSocketId: sid,
              signalData: offer
            });
          });
        }
      }
    });
  }, [camEnabled, localStream, socket]);

  // 8. Continuous Speech-to-Text Setup (SpeechSwearingModerator)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Web Speech Recognition API not supported in this browser.');
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
        console.log(`[STT Audio Swearing Moderation Transcript]: "${transcript}"`);
        socket.emit('speech-transcript', { text: transcript });
      }
    };

    recognition.onend = () => {
      // Loop transcription if toggle is active
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

  // 9. Chat Message submit action
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket || !socket.connected) return;

    socket.emit('chat-message', { text: chatInput });
    setChatInput('');
  };

  // UI Helpers
  const showSecurityWarning = (message: string) => {
    setWarningToast({ visible: true, message });
    setTimeout(() => {
      setWarningToast((prev) => (prev.message === message ? { visible: false, message: '' } : prev));
    }, 4500);
  };

  const appendChatMessage = (sender: string, text: string, flagged: boolean) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) => [...prev, { sender, text, flagged, timestamp }]);
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const appendSystemMessage = (text: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) => [...prev, { sender: 'SystemAlert', text, flagged: false, timestamp }]);
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !micEnabled;
      });
      setMicEnabled(!micEnabled);
    }
  };

  const toggleCam = () => {
    setCamEnabled(!camEnabled);
  };

  const toggleStt = () => {
    setSttActive(!sttActive);
  };

  const handleLeaveCall = () => {
    if (confirm('Are you sure you want to leave this secure room?')) {
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
      router.push('/dashboard');
    }
  };

  // Determine focus visual status classes
  const getPeerFocusClass = (score: number) => {
    if (score < 40) return 'video-wrapper-drowsy';
    if (score < 70) return 'video-wrapper-distracted';
    return 'video-wrapper-focused';
  };

  const getPeerFocusStatusText = (score: number) => {
    if (score < 40) return 'Drowsy';
    if (score < 70) return 'Looking Away';
    return 'Focused';
  };

  return (
    <div className="min-h-screen bg-[#06070a] bg-mesh text-slate-100 flex flex-col font-sans relative">
      
      {/* 1. Header Area */}
      <header className="h-16 border-b border-slate-900 px-6 flex items-center justify-between bg-[#0a0c10]/70 backdrop-blur-md sticky top-0 z-40">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Secure Shield Room</span>
          <h2 className="text-sm sm:text-base font-extrabold text-white line-clamp-1">{meeting.title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] sm:text-xs font-semibold px-2.5 py-1 bg-slate-950 border border-slate-900 rounded-full text-slate-400">
            Room ID: {meeting.id}
          </span>
          <span className="text-[10px] sm:text-xs font-semibold px-2.5 py-1 bg-indigo-950/40 border border-indigo-900/40 rounded-full text-indigo-300">
            Host: @{meeting.host}
          </span>
        </div>
      </header>

      {/* 2. Interactive Area wrapper */}
      <div className="flex-1 flex flex-col lg:flex-row relative">
        
        {/* Main Streams Side */}
        <div className="flex-grow flex flex-col p-6 gap-6 relative overflow-y-auto max-h-[calc(100vh-10rem)] lg:max-h-[calc(100vh-8rem)]">
          
          {/* Host distraction banner */}
          {isHost && hostAvgFocus < 50 && hostParticipantCount > 0 && (
            <div className="w-full glass-panel bg-rose-950/60 border border-rose-900 p-4 rounded-2xl flex items-center gap-4 shadow-xl shadow-rose-900/10 animate-bounce">
              <div className="w-10 h-10 rounded-full bg-rose-900/60 flex items-center justify-center text-rose-400 text-lg font-bold">
                ⚠️
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Low Participant Engagement Alert</span>
                <span className="text-sm font-semibold text-white mt-0.5">"Please change your environment" (average attention has collapsed to {hostAvgFocus}%)</span>
              </div>
            </div>
          )}

          {/* Video grid */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            
            {/* A. Local video user container */}
            <div className={`glass-panel rounded-2xl relative overflow-hidden flex items-center justify-center ${
              getPeerFocusClass(focusScore)
            }`}>
              {/* MediaStream Preview element */}
              <video 
                ref={localVideoRef} 
                muted 
                playsInline
                className="w-full h-full object-cover"
                style={{ display: camEnabled && localStream && localStream.getVideoTracks().length > 0 ? 'block' : 'none' }}
              />

              {/* Avatar placeholder card */}
              {(!camEnabled || !localStream || localStream.getVideoTracks().length === 0) && (
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold uppercase shadow-lg">
                    {fullName.charAt(0)}
                  </div>
                  <span className="text-xs text-slate-400 font-semibold">Your camera is turned off</span>
                </div>
              )}

              {/* MediaPipe Cyber mesh local Canvas overlay */}
              {camEnabled && localStream && localStream.getVideoTracks().length > 0 && (
                <canvas 
                  ref={canvasRef} 
                  className="absolute inset-0 w-full h-full pointer-events-none z-10"
                />
              )}

              {/* Overlay labels */}
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between z-20">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">@{username} (You)</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Focus status: {getPeerFocusStatusText(focusScore)}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/60 border border-slate-900 text-indigo-400 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Focus: {focusScore}%</span>
                </span>
              </div>
            </div>

            {/* B. Remote peer streams dynamic cards */}
            {activePeers.map((peer) => {
              const peerScore = peerScores.find((p) => p.username.toLowerCase() === peer.username.toLowerCase());
              const currentScore = peerScore ? peerScore.score : 100;
              const currentStrikes = peerScore ? peerScore.strikes : 0;
              
              const hasVideo = peer.stream && peer.stream.getVideoTracks().length > 0;

              return (
                <div 
                  key={peer.socketId}
                  className={`glass-panel rounded-2xl relative overflow-hidden flex items-center justify-center ${
                    getPeerFocusClass(currentScore)
                  }`}
                >
                  <video 
                    ref={(el) => {
                      if (el && peer.stream && el.srcObject !== peer.stream) {
                        el.srcObject = peer.stream;
                        el.play().catch(e => console.warn('Peer autoplay blocked:', e));
                      }
                    }}
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ display: hasVideo ? 'block' : 'none' }}
                  />

                  {/* Remote Avatar fallback placeholder */}
                  {!hasVideo && (
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 text-2xl font-bold uppercase shadow-lg">
                        {peer.username.charAt(0)}
                      </div>
                      <span className="text-xs text-slate-400 font-semibold">Camera turned off</span>
                    </div>
                  )}

                  {/* Remote overlay descriptors */}
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between z-20">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        @{peer.username}
                        {currentStrikes > 0 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.25 bg-rose-950 border border-rose-800 text-rose-400 rounded">
                            Strike {currentStrikes}/3
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Focus: {getPeerFocusStatusText(currentScore)}</span>
                    </div>
                    {/* Only show scores on grid overlays if user is Host */}
                    {isHost && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/60 border border-slate-900 text-indigo-400 flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Focus: {currentScore}%</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

          </div>

          {/* Background capture processing element */}
          <video 
            ref={hiddenVideoRef} 
            muted 
            playsInline
            style={{ display: 'none' }}
          />

          {/* 3. Host Analytics Sidebar section */}
          {isHost && (
            <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 border border-indigo-500/10">
              <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                <BarChart2 className="w-4 h-4" />
                <span>Host Telemetry Dashboard</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Student attention</span>
                  <div className="text-lg sm:text-2xl font-extrabold text-white mt-1">{hostAvgFocus}%</div>
                </div>
                <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Invited online</span>
                  <div className="text-lg sm:text-2xl font-extrabold text-white mt-1">{hostParticipantCount} User(s)</div>
                </div>
                <div className="col-span-2 p-3 bg-slate-950/60 border border-slate-900 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Moderation status</span>
                    <span className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Moderation Shield Active</span>
                    </span>
                  </div>
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Chat Sidebar Panel */}
        <div className={`w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-900 bg-[#0a0c10]/40 backdrop-blur-md flex flex-col justify-between transition-all duration-350 ${
          chatCollapsed ? 'lg:w-0 lg:opacity-0 hidden lg:flex' : ''
        }`}>
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-900 flex items-center justify-between bg-slate-950/30">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span>Secure Meeting Chat</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
              {activePeers.length + 1} online
            </span>
          </div>

          {/* Message List */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 max-h-[300px] lg:max-h-[calc(100vh-20rem)] min-h-[200px]">
            {chatMessages.map((msg, index) => {
              if (msg.sender === 'SystemAlert') {
                return (
                  <div key={index} className="w-full text-center py-1.5 px-3 bg-slate-900/60 border border-slate-850/80 rounded-xl text-slate-400 text-[11px] leading-relaxed">
                    {msg.text}
                  </div>
                );
              }

              const isMine = msg.sender.toLowerCase() === username.toLowerCase();
              return (
                <div 
                  key={index}
                  className={`flex flex-col max-w-[80%] gap-1.5 ${isMine ? 'self-end items-end' : 'self-start items-start'}`}
                >
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="font-semibold text-slate-400">@{msg.sender}</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.flagged 
                      ? 'bg-rose-950/40 border border-rose-900/60 text-rose-400 font-medium' 
                      : isMine
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-650/10'
                      : 'bg-slate-900 border border-slate-850/80 text-slate-200 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={chatBottomRef} />
          </div>

          {/* Form input submit */}
          <form onSubmit={handleSendChatMessage} className="p-4 border-t border-slate-900 bg-slate-950/30 flex gap-2">
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Send message..."
              className="flex-grow px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-250 focus:outline-none focus:border-indigo-500/60"
            />
            <button 
              type="submit" 
              className="px-4 rounded-xl bg-indigo-600 hover:bg-indigo-550 text-white font-bold text-xs shadow-md shadow-indigo-650/15 cursor-pointer"
            >
              Send
            </button>
          </form>

        </div>

      </div>

      {/* 4. bottom control bar layout */}
      <footer className="h-20 border-t border-slate-900 bg-[#0a0c10]/90 backdrop-blur-md px-6 flex items-center justify-between z-30">
        
        {/* Left Status info */}
        <div className="hidden md:flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Shield Moderation Active
          </span>
        </div>

        {/* Center Control Action buttons */}
        <div className="flex items-center gap-3 sm:gap-4 mx-auto md:mx-0">
          
          {/* Toggle Mic */}
          <button 
            onClick={toggleMic} 
            className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg transition-all border cursor-pointer ${
              micEnabled 
                ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white' 
                : 'bg-rose-950 border-rose-900 text-rose-400 hover:bg-rose-900 hover:text-white'
            }`}
            title={micEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-rose-400" />}
          </button>

          {/* Toggle Cam */}
          <button 
            onClick={toggleCam} 
            className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg transition-all border cursor-pointer ${
              camEnabled 
                ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white' 
                : 'bg-rose-950 border-rose-900 text-rose-400 hover:bg-rose-900 hover:text-white'
            }`}
            title={camEnabled ? 'Turn Camera Off' : 'Turn Camera On'}
          >
            {camEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5 text-rose-400" />}
          </button>

          {/* Toggle continuous swearing voice moderation (STT) */}
          <button 
            onClick={toggleStt}
            className={`px-4 h-11 rounded-xl flex items-center gap-2 font-bold text-xs transition-all border cursor-pointer ${
              sttActive
                ? 'bg-emerald-950 border-emerald-900 text-emerald-400 hover:bg-emerald-900 hover:text-white shadow-emerald-900/10 shadow-lg'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
            title={sttActive ? 'Deactivate SpeechSwearingModeration' : 'Activate SpeechSwearingModeration'}
          >
            <Mic className="w-4 h-4 text-emerald-400" />
            <span>Audio Moderation</span>
            <span className={`w-2 h-2 rounded-full ${sttActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-650'}`} />
          </button>

          {/* Toggle Chat Panel Visibility */}
          <button 
            onClick={() => setChatCollapsed(!chatCollapsed)}
            className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg transition-all border cursor-pointer lg:hidden ${
              !chatCollapsed 
                ? 'bg-indigo-950 border-indigo-900 text-indigo-400' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-slate-900 hidden sm:block" />

          {/* Disconnect Leave Button */}
          <button 
            onClick={handleLeaveCall}
            className="px-5 h-11 rounded-xl bg-rose-600 hover:bg-rose-500 hover:scale-[1.02] active:scale-[0.98] text-white font-extrabold text-xs shadow-md shadow-rose-950/20 transition-all cursor-pointer"
          >
            Leave Meeting
          </button>

        </div>

        {/* Right side Toggle Chat Panel desktop only */}
        <div className="hidden lg:flex items-center">
          <button 
            onClick={() => setChatCollapsed(!chatCollapsed)}
            className={`px-4 h-11 rounded-xl flex items-center gap-2 font-bold text-xs transition-all border cursor-pointer ${
              !chatCollapsed 
                ? 'bg-indigo-950 border-indigo-900 text-indigo-400' 
                : 'bg-slate-900 border-slate-800 text-slate-450 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <span>Meeting Chat</span>
            <span className={`w-2 h-2 rounded-full ${!chatCollapsed ? 'bg-indigo-400' : 'bg-slate-600'}`} />
          </button>
        </div>

      </footer>

      {/* Floating Warnings Toast overlay */}
      {warningToast.visible && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm glass-panel bg-rose-950/70 border-l-4 border-l-rose-500 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-down">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          <div className="flex flex-col flex-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-rose-400">Content Warning</span>
            <span className="text-xs font-semibold text-slate-200 mt-0.5">{warningToast.message}</span>
          </div>
        </div>
      )}

      {/* Animations Helper Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slide-down {
          from { transform: translate(-50%, -50px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        .animate-slide-down {
          animation: slide-down 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}} />
    </div>
  );
}
