# NeuraMeet — Intelligent, Linkless Video Conferencing Workspace

NeuraMeet is a premium, secure, and engagement-focused video conferencing platform designed to solve real-world security and participant retention issues. Utilizing Client-Side AI/ML, Speech-to-Text transcription, and a Linkless security model, NeuraMeet provides a robust, professional alternative to traditional meeting platforms.

---

## 🚀 Key Innovative Features

### 1. Direct Linkless Security Model
To eliminate the threat of **Zoombombing** (where uninvited third parties crash meetings using shared links), NeuraMeet removes external meeting URLs entirely.
* **Username-based Whitelisting:** Meetings are scheduled directly by inputting verified Clerk usernames. Hosts can add multiple users at once by separating usernames with commas in the invitation panel.
* **In-App Signaling Toasts:** When a host starts a meeting, invited users who are online receive real-time slide-in signaling invitations on their dashboard to join instantly.
* **Access Control:** The server enforces strict validation checks. Only authenticated Clerk accounts belonging to the host or the explicit whitelist guest list can access the room path.

### 2. AI Attention Detection & Telemetry
NeuraMeet tracks active participant attention dynamically.
* **Computer Vision Tracking:** Loads Google MediaPipe's Face Mesh from CDN to analyze landmarks locally in the browser. It calculates the **Eye Aspect Ratio (EAR)** for blink/drowsiness rates, facial ratios for head pose changes (yaw and pitch), and iris coordinates for gaze drift.
* **Host Alerts:** If the rolling average attention score of all participants collapses below 50%, a glowing alert banner (*"Please change your environment"*) is triggered on the host's screen to prompt style adjustments.
* **Camera-Off Workaround:** When a user turns their camera "off", the application continues running the capture stream in a hidden canvas background to compute attention telemetry locally. The visual feed is never transmitted to other participants.
* **Non-Camera Fallback:** If camera access is blocked entirely, the platform falls back to window focus/blur hooks, Page Visibility APIs (tab changes), and mouse/keyboard activity tracking.

### 3. Speech & Text Swearing Moderation
NeuraMeet incorporates real-time chat and audio moderation to ensure a respectful environment.
* **Chat Swearing Filters:** Leverages a leet-speak normalization engine and regex blacklist. Censors offensive terms in chat messages dynamically (`🚫 [CENSORED]`).
* **Verbal Swearing Detection:** Utilizes browser-native continuous Web Speech STT API to transcribe spoken audio streams.
* **Automated Eviction:** Violating policies (speaking or typing blacklisted terms) issues a private Strike Warning. Reaching **3 strikes** triggers an immediate, secure server-side eviction from the call.

---

## 🎨 Centralized Semantic Color System

NeuraMeet implements a centralized semantic color system using CSS variables mapped inside `@theme inline` in `app/globals.css`. This system dynamically transitions between the Light Slate Mode and Dark Space Mode.

### Light Slate Theme Specifications
* **Page Background:** `#F6F7FB`
* **Header / Primary Surfaces:** `#FFFFFF`
* **Secondary Surfaces:** `#F1F3F8`
* **Subtle Surfaces:** `#F8F9FC`
* **Primary Branding Purple:** `#5B4BDB` (Hover state: `#4F40C9`)
* **Soft Primary Highlight:** `#EEEBFF` (Used for active navigation states, badges, and filters)
* **Divider lines:** `#E8EBF2`
* **Borders:** `#E2E6EF`
* **Text Contrast:** `#111827` (Primary text) | `#475569` (Secondary text) | `#94A3B8` (Muted text)

### Dark Space Theme Specifications
* **Page Background:** `#080A0F`
* **Surfaces:** `#0F121A` (Elevated surface: `#151925`)
* **Primary Branding Purple:** `#6C63FF` (Hover state: `#7C74FF`)
* **Borders:** `#252B38`
* **Text Contrast:** `#F8FAFC` (Primary text) | `#94A3B8` (Secondary text) | `#64748B` (Muted text)

---

## 🛠️ Technological Architecture

* **Framework:** Next.js 16 (Turbopack) & React 19
* **Styles:** Tailwind CSS v4 (Centralized CSS variables, Glassmorphism panels, and responsive grid layouts)
* **Auth:** Clerk v7 Authentication (with automated redirect hooks on landing)
* **Database:** MongoDB & Mongoose (meeting schedules, guest configurations, synced profiles)
* **Real-time Engine:** Custom Express server with Socket.io (multi-peer WebRTC mesh handshakes, signaling relay, live notifications, focus aggregates, moderation booting)
* **AI Engine:** Google MediaPipe Face Mesh & Web Speech API

---

## 📂 System User Flows & Interfaces

1. **Dashboard Overview:** Displays your greeting card, real-time activity feed, upcoming whitelisted meetings list, and overview statistics for Total Rooms, Live Now, and Invited Whitelist.
2. **Invitations Inbox:** Allows users to view pending invitations, accept invites to auto-whitelist themselves for upcoming calls, and view past declined/expired invitations.
3. **Meetings Registry:** Features search boxes and status filters grouped inside a clean card layout, showing detailed logs of all rooms you have organized or participated in.
4. **Settings Workspace:** Features a responsive vertical sidebar navigation menu allowing users to modify General preferences, Video/Audio qualities, Privacy toggles (allow invitations, show online status), and access the Danger Zone.
5. **Meeting Call Workspace:** Fully responsive layout with adaptive video stream grids, expandable side panel controls, live chat, participant list, strike indicators, and real-time focus metric monitoring charts.

---

## 📦 Getting Started

### 1. Configure Environment Variables
Create a `.env.local` file at the root of the project:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
MONGODB_URI=mongodb://localhost:27017/ai-video-conference
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
NeuraMeet uses a unified Express backend (`server.js`) that hosts the Next.js frontend alongside the Socket.io WebSocket server. Boot it locally using:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

---

## 🚀 Production Deployment (Render)

When deploying to Render:
1. Configure Render to deploy from the `main` branch.
2. Use the following build and start commands:
   * **Build Command:** `npm run build`
   * **Start Command:** `node server.js`
3. Add all environment keys (`MONGODB_URI`, Clerk keys, and authentication URLs) in the environment settings section of your Render Web Service configuration dashboard.
