import Link from 'next/link';
import { Show, SignInButton, SignUpButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const { userId } = await auth();
  if (userId) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#06070a] bg-mesh text-slate-100 flex flex-col justify-between font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navbar Header */}
      <header className="w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-500/20">
            A
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-200 via-slate-100 to-cyan-200 bg-clip-text text-transparent">
            AetherCall <span className="text-cyan-400 text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 ml-1">AI</span>
          </span>
        </div>

        <nav className="flex items-center gap-4">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="text-sm font-semibold text-slate-300 hover:text-white cursor-pointer transition-colors px-4 py-2">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="text-sm font-semibold px-5 py-2.5 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/35 hover:bg-indigo-500 transition-all cursor-pointer">
                Create Account
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard" className="text-sm font-semibold px-5 py-2.5 rounded-full bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white transition-all cursor-pointer">
              Go to Dashboard
            </Link>
          </Show>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-7xl mx-auto px-6 py-12 md:py-20 text-center gap-16">
        <div className="flex flex-col items-center gap-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-xs font-semibold text-indigo-300 mb-2">
            ✨ Redefining Video Conferencing Engagement & Security
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.15] bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            The Next-Generation AI Video Conferencing Shield
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
            Protect your meetings from intrusions and keep your audience locked in. AetherCall combines MediaPipe gaze telemetry, linkless invite security, and real-time audio/text moderation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Show when="signed-in">
              <Link href="/dashboard" className="px-8 py-4 rounded-full glowing-button text-white font-bold text-lg shadow-lg cursor-pointer">
                Launch App Dashboard
              </Link>
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="px-8 py-4 rounded-full glowing-button text-white font-bold text-lg shadow-lg cursor-pointer">
                  Get Started Free
                </button>
              </SignInButton>
            </Show>
            <a href="#features" className="px-8 py-4 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-semibold text-lg hover:bg-slate-850 hover:text-white transition-all">
              Learn More
            </a>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <section id="features" className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 text-left pt-12">
          {/* Card 1 */}
          <div className="glass-panel p-8 rounded-2xl glass-card-hover flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-800 flex items-center justify-center text-cyan-400 text-xl font-bold">
              🔍
            </div>
            <h3 className="text-xl font-bold text-slate-100">AI Focus Tracking</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Google MediaPipe Face Mesh maps eye aspect ratio (EAR), gaze drift, and head coordinates locally. Triggers env warnings if distraction average collapses below 50%. Tracks page visibility events when camera is off.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-8 rounded-2xl glass-card-hover flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-950/60 border border-indigo-800 flex items-center justify-center text-indigo-400 text-xl font-bold">
              🔒
            </div>
            <h3 className="text-xl font-bold text-slate-100">Linkless Meetings</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Eliminates URL links entirely to prevent Zoombombing. Schedules calls by unique verified usernames. Invitees receive direct in-app alerts and join through their dashboard. Uninvited users are blocked server-side.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-8 rounded-2xl glass-card-hover flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-950/60 border border-rose-800 flex items-center justify-center text-rose-400 text-xl font-bold">
              🛡️
            </div>
            <h3 className="text-xl font-bold text-slate-100">Speech & Text Moderation</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Constant leet-speak parsing checks the chat stream. Browser-native speech recognition transcribes audio inputs locally to catch spoken swearing. Automatically flags messages and evicts users on 3 strikes.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 h-16 flex items-center justify-center border-t border-slate-900 text-xs text-slate-650">
        © 2026 AetherCall AI Video Conference. Built using Next.js, Clerk, and WebSockets.
      </footer>
    </div>
  );
}
