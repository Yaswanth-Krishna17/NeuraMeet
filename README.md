# Project Walkthrough - AI-Powered Video Conferencing Application

We have successfully migrated the AI-powered video conferencing project to Next.js 16 with Tailwind CSS v4, integrated with Clerk Authentication and local MongoDB persistence!

---

## 🛠️ Changes Implemented

### 1. Project Dependencies and Environment
- Modified [package.json](file:///c:/Users/lucky/OneDrive/Desktop/Video%20Conference/clerk-nextjs/package.json) to include `mongoose`, `socket.io`, `socket.io-client`, `dotenv`, and `express`.
- Enabled `"type": "module"` for native ES module compilation.
- Renamed the deprecated `middleware.ts` to [proxy.ts](file:///c:/Users/lucky/OneDrive/Desktop/Video%20Conference/clerk-nextjs/proxy.ts) per Next.js 16 requirements to protect routes.

### 2. Database and Content Moderation
- Created [lib/db.js](file:///c:/Users/lucky/OneDrive/Desktop/Video%20Conference/clerk-nextjs/lib/db.js) containing schemas for `User` and `Meeting` and persistent connection wrappers to prevent socket leaks.
- Created [lib/moderator.js](file:///c:/Users/lucky/OneDrive/Desktop/Video%20Conference/clerk-nextjs/lib/moderator.js) carrying the leet-speak profanity mapping, tokenized word matches, and punctuation bypass filters.

### 3. Custom Server and WebSocket signaling
- Created [server.js](file:///c:/Users/lucky/OneDrive/Desktop/Video%20Conference/clerk-nextjs/server.js) to spin up Next.js inside an Express wrapper.
- Integrated Socket.io signaling to handle multi-peer WebRTC connections, chat and speech transcript filters, warning indicators, eviction triggers (strikes), and rolling participant focus scoring updates.

### 4. Custom Frontend Pages
- Replaced the homepage [app/page.tsx](file:///c:/Users/lucky/OneDrive/Desktop/Video%20Conference/clerk-nextjs/app/page.tsx) with a premium neon dark-mode theme, detailing the core features and utilizing Clerk's `<Show>` tags.
- Created the dashboard page [app/dashboard/page.tsx](file:///c:/Users/lucky/OneDrive/Desktop/Video%20Conference/clerk-nextjs/app/dashboard/page.tsx) and layout for user sync triggers, username-validated meeting scheduling, and live WebRTC call invitation toast cards.
- Created the dynamic meeting room page [app/meetings/[id]/page.tsx](file:///c:/Users/lucky/OneDrive/Desktop/Video%20Conference/clerk-nextjs/app/meetings/%5Bid%5D/page.tsx) and its corresponding interactive client component [MeetingRoomClient.tsx](file:///c:/Users/lucky/OneDrive/Desktop/Video%20Conference/clerk-nextjs/app/meetings/%5Bid%5D/MeetingRoomClient.tsx) incorporating WebRTC RTCPeerConnections, browser-native SpeechRecognition, and MediaPipe dynamic loading.

---

## ⚡ How to Run and Test Locally

### 1. Configure the Environment
Ensure your `.env.local` file is populated with valid Clerk environment keys:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
MONGODB_URI=mongodb://localhost:27017/ai-video-conference
```

### 2. Startup Server
Run the development server script (which boots our custom `server.js` containing WebSockets and Next.js):
```bash
npm run dev
```

### 3. Verification Guidelines

#### Feature 1: Focus Detection & Camera-Off Fallback
- Enter a meeting room. Allow camera access.
- Note the cyan/emerald face landmark mesh drawn over your video.
- Test eye closing/drowsiness (EAR < 0.15 for >2 seconds) and head turning; check that your focus score decays.
- Click **"Turn Camera Off"**. Notice that your video disappears from the screen (and won't be broadcast to peers), but the background camera capture continues computing facial statistics locally, updating your focus score in real-time.
- If you block camera access entirely, check that focus tracking transitions to window focus/blur, tab switches, and mouse/keyboard activity.

#### Feature 2: Linkless Meetings
- Schedule a meeting on your dashboard. Try typing an invalid username; verify that a validation warning prevents creation.
- Once created, check that the invited user (if logged into their dashboard) instantly receives a floating alert toast to join the room.
- Try accessing a meeting ID directly using a non-invited user account; verify that access is blocked and you are redirected to `/dashboard`.

#### Feature 3: Abusive Language Moderation
- Swear in chat; check that the message gets replaced with `🚫 [CENSORED - Abusive Language Flagged]` and you receive a strike warnings overlay.
- Toggle **"Audio Moderation"**. Speak blacklisted terms into your mic (e.g. in Chrome/Edge); verify that real-time transcription triggers warnings.
- Check that reaching 3 strikes boots you to the dashboard.
