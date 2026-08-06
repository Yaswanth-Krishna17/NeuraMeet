import next from 'next';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { parse } from 'url';

import {
  getMeeting,
  updateMeetingStatus,
  updateMeetingHost,
  updateMeetingLock,
  updateMeetingWaitingRoom,
  addMeetingAttendee,
  removeMeetingAttendee,
  createNotification
} from './lib/db.js';
import { moderateContent } from './lib/moderator.js';

dotenv.config({ path: '.env.local' });

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);
const nextApp = next({ dev, hostname, port });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // In-Memory map to link Usernames to Web Socket ID arrays (supporting multi-tab logins)
  const activeSockets = new Map();

  // In-Memory registry tracking state of active meetings
  // Format: meetingId => { host, title, participants: Map(socketId => { username, focusScore, strikes }) }
  const activeRooms = new Map();

  // In-Memory registry tracking user online statuses: username => status ('online' | 'in-meeting' | 'busy' | 'offline')
  const userStatuses = new Map();

  io.on('connection', (socket) => {
    let socketUsername = null;
    let activeMeetingId = null;

    // 1. Link active Socket connection with User's logged-in identity
    socket.on('register-user', ({ username }) => {
      if (!username) return;
      socketUsername = username.toLowerCase().trim();

      if (!activeSockets.has(socketUsername)) {
        activeSockets.set(socketUsername, []);
      }
      activeSockets.get(socketUsername).push(socket.id);

      // Set user status to online
      if (!userStatuses.has(socketUsername) || userStatuses.get(socketUsername) === 'offline') {
        userStatuses.set(socketUsername, 'online');
        io.emit('status-changed', { username: socketUsername, status: 'online' });
      }

      console.log(`[SOCKET] Registered user socket: ${socketUsername} -> ${socket.id}`);
    });

    // 2. Multi-Peer WebRTC Room Join Router
    socket.on('join-meeting', async ({ meetingId, username }) => {
      if (!meetingId || !username) return;
      username = username.toLowerCase().trim();
      activeMeetingId = meetingId;

      // Fetch details to configure or validate room settings
      const meeting = await getMeeting(meetingId);
      if (!meeting) {
        return socket.emit('join-error', 'Meeting does not exist.');
      }

      // Check if meeting has ended
      if (meeting.status === 'ended' || meeting.status === 'cancelled') {
        return socket.emit('join-error', 'This meeting has ended or was cancelled.');
      }

      // Verify authorized linkless entry
      const isHost = meeting.host === username;
      const isInvited = meeting.invitees.includes(username);
      if (!isHost && !isInvited) {
        return socket.emit('join-error', 'You are not authorized or invited to join this room.');
      }

      // Check if room is locked
      const currentRoomState = activeRooms.get(meetingId);
      const isLocked = currentRoomState ? currentRoomState.isLocked : meeting.isLocked;
      if (isLocked && !isHost) {
        return socket.emit('join-error', 'This meeting is locked by the host.');
      }

      // Check if waiting room is enabled
      const waitingRoomEnabled = currentRoomState ? currentRoomState.waitingRoomEnabled : meeting.waitingRoomEnabled;
      const isApproved = currentRoomState && currentRoomState.approvedParticipants && currentRoomState.approvedParticipants.has(username);

      if (waitingRoomEnabled && !isHost && !isApproved) {
        // Initialize room state if not present
        if (!activeRooms.has(meetingId)) {
          activeRooms.set(meetingId, {
            host: meeting.host,
            title: meeting.title,
            participants: new Map(),
            waitingQueue: new Map(),
            approvedParticipants: new Set(),
            isLocked: meeting.isLocked,
            waitingRoomEnabled: meeting.waitingRoomEnabled
          });
        }
        
        const room = activeRooms.get(meetingId);
        if (!room.waitingQueue) room.waitingQueue = new Map();
        room.waitingQueue.set(socket.id, username);
        
        socket.join(meetingId);
        socket.emit('waiting-for-approval');
        
        // Notify host
        io.to(meetingId).emit('waiting-user-join', {
          socketId: socket.id,
          username
        });
        
        console.log(`[SOCKET] User ${username} (${socket.id}) placed in waiting queue for room: ${meetingId}`);
        return;
      }

      socket.join(meetingId);
      console.log(`[SOCKET] User ${username} joined room: ${meetingId}`);

      // Initialize meeting tracker room in-memory if first peer
      if (!activeRooms.has(meetingId)) {
        activeRooms.set(meetingId, {
          host: meeting.host,
          title: meeting.title,
          participants: new Map(),
          waitingQueue: new Map(),
          approvedParticipants: new Set(),
          isLocked: meeting.isLocked,
          waitingRoomEnabled: meeting.waitingRoomEnabled
        });
        await updateMeetingStatus(meetingId, 'active');
      }

      const room = activeRooms.get(meetingId);
      room.participants.set(socket.id, {
        username,
        focusScore: 100, // Starts fully focused
        strikes: 0      // 0 strikes
      });

      // Track attendee join in DB
      await addMeetingAttendee(meetingId, username);

      // Update user status to in-meeting
      userStatuses.set(username, 'in-meeting');
      io.emit('status-changed', { username, status: 'in-meeting' });

      // Notify other peers in room to trigger standard WebRTC signaling connections
      socket.to(meetingId).emit('user-connected', {
        socketId: socket.id,
        username
      });

      // Provide the newly joined client with a list of existing active peers in the room
      const otherPeers = [];
      room.participants.forEach((data, sid) => {
        if (sid !== socket.id) {
          otherPeers.push({
            socketId: sid,
            username: data.username
          });
        }
      });
      socket.emit('lobby-peers', otherPeers);
    });

    // 3. WebRTC Signal Relayer
    socket.on('signal', ({ targetSocketId, signalData }) => {
      // Relays the RTCPeerConnection Offer/Answer/ICE Candidate directly to target peer
      io.to(targetSocketId).emit('signal', {
        senderSocketId: socket.id,
        signalData
      });
    });

    // 4. Real-time Chat Moderation Router
    socket.on('chat-message', ({ text }) => {
      if (!activeMeetingId || !socketUsername) return;
      const room = activeRooms.get(activeMeetingId);
      if (!room) return;

      const participant = room.participants.get(socket.id);
      if (!participant) return;

      // Run abusive language model checks on text content
      const modResult = moderateContent(text);

      if (modResult.isAbusive) {
        participant.strikes += 1;

        // Notify the offender privately
        socket.emit('moderation-warning', {
          strikes: participant.strikes,
          reason: `Abusive phrase detected: "${modResult.matchedWords.join(', ')}"`
        });

        // Log moderation event
        console.log(`[MODERATION] User ${socketUsername} received strike ${participant.strikes}/3 in meeting ${activeMeetingId}`);

        // Broadcast the censored version of the message so the chat isn't disrupted, but mark it flagged
        io.to(activeMeetingId).emit('chat-message', {
          sender: socketUsername,
          text: modResult.cleanedText,
          flagged: true
        });

        // If offender reaches 3 strikes, kick them immediately from the meeting
        if (participant.strikes >= 3) {
          handleKickUser(activeMeetingId, socket.id, socketUsername, 'Exceeded abusive language strike limit (3/3).');
        }
      } else {
        // Clear message: broadcast to entire room
        io.to(activeMeetingId).emit('chat-message', {
          sender: socketUsername,
          text,
          flagged: false
        });
      }
    });

    // 5. Speech-to-Text Moderation Router
    socket.on('speech-transcript', ({ text }) => {
      if (!activeMeetingId || !socketUsername) return;
      const room = activeRooms.get(activeMeetingId);
      if (!room) return;

      const participant = room.participants.get(socket.id);
      if (!participant) return;

      const modResult = moderateContent(text);

      if (modResult.isAbusive) {
        participant.strikes += 1;

        console.log(`[MODERATION-SPEECH] User ${socketUsername} received strike ${participant.strikes}/3 via Audio in ${activeMeetingId}`);

        socket.emit('moderation-warning', {
          strikes: participant.strikes,
          reason: `Abusive speech phrase spoken: "${modResult.matchedWords.join(', ')}"`
        });

        if (participant.strikes >= 3) {
          handleKickUser(activeMeetingId, socket.id, socketUsername, 'Exceeded abusive verbal language strike limit (3/3).');
        }
      }
    });

    // 6. Focus Scoring Analytics Aggregator
    socket.on('focus-score', ({ score }) => {
      if (!activeMeetingId) return;
      const room = activeRooms.get(activeMeetingId);
      if (!room) return;

      const participant = room.participants.get(socket.id);
      if (!participant) return;

      // Update in-memory score
      participant.focusScore = Math.max(0, Math.min(100, score));

      // Calculate rolling average score of all active participants (excluding host)
      let totalScore = 0;
      let participantCount = 0;

      room.participants.forEach((data) => {
        if (data.username !== room.host) {
          totalScore += data.focusScore;
          participantCount++;
        }
      });

      if (participantCount > 0) {
        const averageFocus = Math.round(totalScore / participantCount);

        // Broadcast real-time focus statistical tracking payload to everyone in the room!
        io.to(activeMeetingId).emit('focus-analytics-update', {
          averageFocus,
          participantCount,
          peerScores: Array.from(room.participants.entries()).map(([sid, data]) => ({
            username: data.username,
            score: data.focusScore,
            strikes: data.strikes
          }))
        });
      }
    });

    // End meeting handler (triggered by host)
    socket.on('end-meeting', async ({ meetingId }) => {
      if (!meetingId) return;
      const room = activeRooms.get(meetingId);
      if (!room) return;

      const normalizedHost = room.host.toLowerCase().trim();
      const normalizedUsername = socketUsername ? socketUsername.toLowerCase().trim() : '';

      if (normalizedHost === normalizedUsername) {
        console.log(`[MEETING] Host ${socketUsername} ended meeting ${meetingId}`);

        // Update status in MongoDB
        await updateMeetingStatus(meetingId, 'ended');

        // Notify all participants in the room
        io.to(meetingId).emit('meeting-ended', { reason: 'The host has ended the meeting.' });

        // Clean up from activeRooms map
        activeRooms.delete(meetingId);
      } else {
        console.warn(`[MEETING] Unauthorized attempt to end meeting ${meetingId} by ${socketUsername}`);
      }
    });

    // Room Lock Toggle
    socket.on('lock-meeting', async ({ meetingId, isLocked }) => {
      if (!meetingId) return;
      const room = activeRooms.get(meetingId);
      if (!room) return;

      if (room.host.toLowerCase().trim() === (socketUsername || '').toLowerCase().trim()) {
        room.isLocked = isLocked;
        await updateMeetingLock(meetingId, isLocked);
        io.to(meetingId).emit('meeting-locked-status', { isLocked });
        console.log(`[MEETING] Lock status updated for ${meetingId} -> ${isLocked}`);
      }
    });

    // Toggle Waiting Room
    socket.on('toggle-waiting-room', async ({ meetingId, waitingRoomEnabled }) => {
      if (!meetingId) return;
      const room = activeRooms.get(meetingId);
      if (!room) return;

      if (room.host.toLowerCase().trim() === (socketUsername || '').toLowerCase().trim()) {
        room.waitingRoomEnabled = waitingRoomEnabled;
        await updateMeetingWaitingRoom(meetingId, waitingRoomEnabled);
        io.to(meetingId).emit('waiting-room-status', { waitingRoomEnabled });
        console.log(`[MEETING] Waiting room status updated for ${meetingId} -> ${waitingRoomEnabled}`);
      }
    });

    // Approve Waiting User
    socket.on('approve-waiting-user', async ({ meetingId, targetSocketId }) => {
      if (!meetingId || !targetSocketId) return;
      const room = activeRooms.get(meetingId);
      if (!room) return;

      if (room.host.toLowerCase().trim() === (socketUsername || '').toLowerCase().trim()) {
        if (!room.waitingQueue) return;
        const targetUsername = room.waitingQueue.get(targetSocketId);
        if (!targetUsername) return;

        room.waitingQueue.delete(targetSocketId);
        if (!room.approvedParticipants) room.approvedParticipants = new Set();
        room.approvedParticipants.add(targetUsername);

        // Add to active participants
        room.participants.set(targetSocketId, {
          username: targetUsername,
          focusScore: 100,
          strikes: 0
        });

        // Add attendee in DB
        await addMeetingAttendee(meetingId, targetUsername);

        // Notify user
        io.to(targetSocketId).emit('waiting-approved');

        // Notify other room members
        io.to(meetingId).emit('user-connected', {
          socketId: targetSocketId,
          username: targetUsername
        });

        console.log(`[WAITING-ROOM] Approved user ${targetUsername} (${targetSocketId}) in ${meetingId}`);
      }
    });

    // Reject Waiting User
    socket.on('reject-waiting-user', ({ meetingId, targetSocketId }) => {
      if (!meetingId || !targetSocketId) return;
      const room = activeRooms.get(meetingId);
      if (!room) return;

      if (room.host.toLowerCase().trim() === (socketUsername || '').toLowerCase().trim()) {
        if (!room.waitingQueue) return;
        const targetUsername = room.waitingQueue.get(targetSocketId);
        if (!targetUsername) return;

        room.waitingQueue.delete(targetSocketId);

        // Notify user
        io.to(targetSocketId).emit('waiting-rejected', { reason: 'The host has declined your entry request.' });
        console.log(`[WAITING-ROOM] Rejected user ${targetUsername} (${targetSocketId}) in ${meetingId}`);
      }
    });

    // Mute User (Host command)
    socket.on('mute-user', ({ meetingId, targetSocketId }) => {
      if (!meetingId || !targetSocketId) return;
      const room = activeRooms.get(meetingId);
      if (!room) return;

      if (room.host.toLowerCase().trim() === (socketUsername || '').toLowerCase().trim()) {
        io.to(targetSocketId).emit('force-mute');
        console.log(`[MEETING] Host muted socket ${targetSocketId} in ${meetingId}`);
      }
    });

    // Kick User (Host command)
    socket.on('kick-user', ({ meetingId, targetSocketId, targetUsername }) => {
      if (!meetingId || !targetSocketId) return;
      const room = activeRooms.get(meetingId);
      if (!room) return;

      if (room.host.toLowerCase().trim() === (socketUsername || '').toLowerCase().trim()) {
        handleKickUser(meetingId, targetSocketId, targetUsername, 'Removed by meeting host.');
      }
    });

    // Transfer Host
    socket.on('transfer-host', async ({ meetingId, targetUsername }) => {
      if (!meetingId || !targetUsername) return;
      const room = activeRooms.get(meetingId);
      if (!room) return;

      if (room.host.toLowerCase().trim() === (socketUsername || '').toLowerCase().trim()) {
        const targetClean = targetUsername.toLowerCase().trim();
        room.host = targetClean;
        await updateMeetingHost(meetingId, targetClean);

        io.to(meetingId).emit('host-transferred', { newHost: targetClean });
        console.log(`[MEETING] Host role transferred to ${targetClean} in ${meetingId}`);
      }
    });

    // Get active user status query
    socket.on('get-user-status', ({ username }, callback) => {
      if (!username) return;
      const cleanU = username.toLowerCase().trim();
      const status = userStatuses.get(cleanU) || 'offline';
      if (callback) callback({ status });
    });

    socket.on('get-all-statuses', (callback) => {
      if (callback) {
        callback(Object.fromEntries(userStatuses));
      }
    });

    // Linkless socket room invitation dispatcher
    socket.on('meeting-created', ({ meetingId, title, host, hostUsername, invitees }) => {
      if (!invitees || !Array.isArray(invitees)) return;
      
      invitees.forEach(invitee => {
        const cleanInvitee = invitee.toLowerCase().trim();
        const sockets = activeSockets.get(cleanInvitee);
        if (sockets && sockets.length > 0) {
          sockets.forEach(sid => {
            io.to(sid).emit('meeting-invite', {
              meetingId,
              title,
              host,
              hostUsername
            });
          });
        }
      });
    });

    // Kick logic handler helper
    function handleKickUser(meetingId, targetSocketId, username, reason) {
      console.log(`[KICK] Kicking ${username} from ${meetingId} due to: ${reason}`);

      // 1. Force the client to close the WebRTC streams and disconnect
      io.to(targetSocketId).emit('force-kick', { reason });

      // 2. Notify other room members of the eviction
      io.to(meetingId).emit('user-disconnected', {
        socketId: targetSocketId,
        username,
        kicked: true,
        reason
      });

      // 3. Clear participant from tracking registry
      const room = activeRooms.get(meetingId);
      if (room) {
        room.participants.delete(targetSocketId);
      }
    }

    // 7. Cleanup on WebSocket Connection Disconnect
    socket.on('disconnect', async () => {
      // A. Remove socket from registered user accounts map
      if (socketUsername && activeSockets.has(socketUsername)) {
        const list = activeSockets.get(socketUsername);
        const filtered = list.filter(sid => sid !== socket.id);
        if (filtered.length === 0) {
          activeSockets.delete(socketUsername);

          // Last socket disconnected: set user status to offline
          userStatuses.set(socketUsername, 'offline');
          io.emit('status-changed', { username: socketUsername, status: 'offline' });
        } else {
          activeSockets.set(socketUsername, filtered);
        }
      }

      // B. Clean up user from active video call room session
      if (activeMeetingId && activeRooms.has(activeMeetingId)) {
        const room = activeRooms.get(activeMeetingId);
        room.participants.delete(socket.id);

        if (room.waitingQueue) {
          room.waitingQueue.delete(socket.id);
        }

        socket.to(activeMeetingId).emit('user-disconnected', {
          socketId: socket.id,
          username: socketUsername
        });

        // Track attendee leaving in DB
        if (socketUsername) {
          await removeMeetingAttendee(activeMeetingId, socketUsername);

          // Revert status to online if still connected on other tabs
          const userSocks = activeSockets.get(socketUsername);
          if (userSocks && userSocks.length > 0) {
            userStatuses.set(socketUsername, 'online');
            io.emit('status-changed', { username: socketUsername, status: 'online' });
          }
        }

        // If room is empty, flag database status and prune memory registry
        if (room.participants.size === 0) {
          await updateMeetingStatus(activeMeetingId, 'ended');
          activeRooms.delete(activeMeetingId);
          console.log(`[MEETING] Meeting ${activeMeetingId} closed and marked ended.`);
        }
      }
    });
  });

  // Delegate all standard HTTP requests to Next.js handler
  app.all('*', (req, res) => {
    const parsedUrl = parse(req.url, true);
    return handle(req, res, parsedUrl);
  });

  httpServer.listen(port, () => {
    console.log(`🚀 AI Video Conferencing Server running on http://${hostname}:${port}`);
  });
});
