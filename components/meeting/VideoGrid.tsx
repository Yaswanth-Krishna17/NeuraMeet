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
  const totalParticipants = activePeers.length + 1; // peers + self

  // --- Case A: Only the local user is in the room ---
  if (activePeers.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 max-w-5xl mx-auto w-full">
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
    );
  }

  // --- Case B: Two participants (Local User + 1 Remote User) ---
  if (activePeers.length === 1) {
    const remotePeer = activePeers[0];
    const remoteStatus = peerMediaStatuses[remotePeer.socketId] || {
      micEnabled: true,
      camEnabled: true,
      isSpeaking: false,
    };

    return (
      <div className="flex-1 flex items-center justify-center p-4 max-w-5xl mx-auto w-full relative">
        {/* Large Remote Speaker Video */}
        <VideoCard
          stream={remotePeer.stream}
          username={remotePeer.username}
          isLocal={false}
          isHost={meetingHost.toLowerCase() === remotePeer.username.toLowerCase()}
          micEnabled={remoteStatus.micEnabled}
          camEnabled={remoteStatus.camEnabled}
          isSpeakingOverride={remoteStatus.isSpeaking}
        />

        {/* Local Self Video in Floating PiP */}
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

  // --- Case C: Three or more participants (Grid Layout) ---
  // Determine CSS grid columns based on count
  const getGridColsClass = (count: number) => {
    if (count <= 2) return 'grid-cols-1 md:grid-cols-2';
    if (count <= 4) return 'grid-cols-1 sm:grid-cols-2';
    if (count <= 6) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 w-full h-full">
      <div
        className={`grid gap-4 w-full max-w-7xl mx-auto auto-rows-fr ${getGridColsClass(
          totalParticipants
        )}`}
      >
        {/* Local User Card */}
        <VideoCard
          stream={localStream}
          username={localUsername}
          isLocal={true}
          isHost={meetingHost.toLowerCase() === localUsername.toLowerCase()}
          micEnabled={localMicEnabled}
          camEnabled={localCamEnabled}
          isSpeakingOverride={localIsSpeaking}
        />

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
    </div>
  );
}
