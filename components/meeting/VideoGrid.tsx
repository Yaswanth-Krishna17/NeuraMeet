'use client';

import VideoCard from './VideoCard';
import SelfVideo from './SelfVideo';

interface PeerWrapper {
  socketId: string;
  username: string;
  stream: MediaStream | null;
}

interface MediaStatus {
  micEnabled: boolean;
  camEnabled: boolean;
  isSpeaking: boolean;
}

interface VideoGridProps {
  localStream: MediaStream | null;
  localUsername: string;
  localMicEnabled: boolean;
  localCamEnabled: boolean;
  localIsSpeaking: boolean;
  activePeers: PeerWrapper[];
  peerMediaStatuses: Record<string, MediaStatus>;
  meetingHost: string;
}

export default function VideoGrid({
  localStream,
  localUsername,
  localMicEnabled,
  localCamEnabled,
  localIsSpeaking,
  activePeers,
  peerMediaStatuses,
  meetingHost,
}: VideoGridProps) {
  
  // --- Case A: Only the local user is in the room ---
  if (activePeers.length === 0) {
    return (
      <div className="flex-grow flex items-center justify-center p-6 max-w-5xl mx-auto w-full h-full">
        <div className="w-full relative aspect-video max-h-[70vh]">
          <VideoCard
            stream={localStream}
            username={localUsername}
            isLocal={true}
            isHost={meetingHost.toLowerCase() === localUsername.toLowerCase()}
            micEnabled={localMicEnabled}
            camEnabled={localCamEnabled}
            isSpeakingOverride={localIsSpeaking}
          />
        </div>
      </div>
    );
  }

  // --- Case B: One Remote Peer (2 Participants total) ---
  if (activePeers.length === 1) {
    const remotePeer = activePeers[0];
    const remoteStatus = peerMediaStatuses[remotePeer.socketId] || {
      micEnabled: true,
      camEnabled: true,
      isSpeaking: false,
    };

    return (
      <div className="flex-grow flex items-center justify-center p-6 max-w-5xl mx-auto w-full h-full relative">
        {/* Large Remote Speaker Video */}
        <div className="w-full relative aspect-video max-h-[70vh]">
          <VideoCard
            stream={remotePeer.stream}
            username={remotePeer.username}
            isLocal={false}
            isHost={meetingHost.toLowerCase() === remotePeer.username.toLowerCase()}
            micEnabled={remoteStatus.micEnabled}
            camEnabled={remoteStatus.camEnabled}
            isSpeakingOverride={remoteStatus.isSpeaking}
          />
        </div>

        {/* Local Self Video floating in PiP */}
        <SelfVideo
          stream={localStream}
          username={localUsername}
          micEnabled={localMicEnabled}
          camEnabled={localCamEnabled}
          isSpeaking={localIsSpeaking}
        />
      </div>
    );
  }

  // --- Case C: Two or more Remote Peers (3+ Participants total) ---
  const getGridColsClass = (count: number) => {
    if (count === 2) return 'grid-cols-1 md:grid-cols-2';
    if (count <= 4) return 'grid-cols-1 sm:grid-cols-2';
    if (count <= 6) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
  };

  return (
    <div className="flex-grow flex items-center justify-center p-6 w-full h-full relative">
      <div
        className={`grid gap-6 w-full max-w-7xl mx-auto auto-rows-fr ${getGridColsClass(
          activePeers.length
        )}`}
      >
        {/* Remote Peers Cards */}
        {activePeers.map((peer) => {
          const status = peerMediaStatuses[peer.socketId] || {
            micEnabled: true,
            camEnabled: true,
            isSpeaking: false,
          };

          return (
            <VideoCard
              key={peer.socketId}
              stream={peer.stream}
              username={peer.username}
              isLocal={false}
              isHost={meetingHost.toLowerCase() === peer.username.toLowerCase()}
              micEnabled={status.micEnabled}
              camEnabled={status.camEnabled}
              isSpeakingOverride={status.isSpeaking}
            />
          );
        })}
      </div>

      {/* Floating self-view PiP */}
      <SelfVideo
        stream={localStream}
        username={localUsername}
        micEnabled={localMicEnabled}
        camEnabled={localCamEnabled}
        isSpeaking={localIsSpeaking}
      />
    </div>
  );
}
