# AetherCall AI - Next-Gen Video Conferencing

AetherCall AI is an advanced, secure, and engagement-focused video conferencing platform designed to solve real-world security and participant retention issues. Utilizing Client-Side AI/ML, Speech-to-Text transcription, and Linkless authorization, AetherCall provides a robust alternative to traditional meeting platforms like Zoom or Microsoft Teams.

---

## 🚀 Key Innovative Features

### 1. AI Focus Detection & Telemetry
AetherCall tracks active participant attention dynamically.
* **Computer Vision Tracking:** Loads Google MediaPipe's Face Mesh from CDN to analyze landmarks locally in the browser. It calculates the **Eye Aspect Ratio (EAR)** for blink/drowsiness rates, facial ratios for head pose changes (yaw and pitch), and iris coordinates for gaze drift.
* **Host Alerts:** If the rolling average attention score of all participants collapses below 50%, a glowing alert banner (*"Please change your environment"*) is triggered on the host's screen to prompt style adjustments.
* **Camera-Off Workaround:** When a user turns their camera "off", the application continues running the capture stream in a hidden canvas background to compute attention telemetry locally. The visual feed is never transmitted to other participants.
* **Non-Camera Fallback:** If camera access is blocked entirely, the platform falls back to window focus/blur hooks, Page Visibility APIs (tab changes), and mouse/keyboard activity tracking.

### 2. Direct Linkless Meetings
To eliminate the threat of **Zoombombing** (where uninvited third parties crash meetings using shared links), AetherCall removes external meeting URLs entirely.
* **Username-based Invites:** Meetings are scheduled directly by inputting verified usernames.
* **In-App Signaling Toasts:** When a host starts a meeting, invited users who are online receive a real-time sliding notification card on their dashboard to join instantly.
* **Access Control:** The server enforces strict validation checks. Only authenticated Clerk accounts belonging to the host or explicit guest list can access the room path.

### 3. Speech & Text Swearing Moderation
AetherCall incorporates real-time chat and audio moderation to ensure a professional and respectful environment.
* **Chat Swearing Filters:** Leverages a leet-speak normalization engine and regex blacklist. Censors offensive terms in chat messages dynamically (`🚫 [CENSORED]`).
* **Verbal Swearing Detection:** Utilizes browser-native continuous Web Speech STT API to transcribe spoken audio streams.
* **Automated Eviction:** Violating policies (speaking or typing blacklisted terms) issues a private Strike Warning. Reaching **3 strikes** triggers an immediate, secure server-side eviction from the call.

---

## 🛠️ Technological Architecture

* **Framework:** Next.js 16 (Turbopack) & React 19
* **Styles:** Tailwind CSS v4 (Glassmorphism design, pulsing telemetry indicators, responsive layouts)
* **Auth:** Clerk v7 Authentication (with automated redirect hooks on landing)
* **Database:** MongoDB & Mongoose (meeting schedules, guest configurations, synced profiles)
* **Real-time:** Custom Express server with Socket.io (multi-peer WebRTC mesh handshakes, signaling relay, live notifications, focus aggregates, moderation booting)
* **AI Engine:** Google MediaPipe Face Mesh & Web Speech API

---

## 📦 Getting Started

### 1. Prerequisite Configuration
Ensure you have a local **MongoDB** service running, and configure your `.env.local` file at the root:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
MONGODB_URI=mongodb://localhost:27017/ai-video-conference
```

### 2. Install Dependencies
```bash
cd clerk-nextjs
npm install
```

### 3. Start Development Server
This boots our custom `server.js` wrapper containing the Node.js WebSocket backend and the Next.js frontend:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.
