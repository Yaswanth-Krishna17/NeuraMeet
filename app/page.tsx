import Link from 'next/link';
import { Show } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Eye, ShieldCheck, MessageSquareWarning, BrainCircuit, Check, Sparkles, Heart } from 'lucide-react';
import { FadeUp, StaggerContainer, ScaleHoverCard, BackgroundGlows } from '@/components/LandingMotion';

export default async function Home() {
  const { userId } = await auth();
  if (userId) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#06070a] bg-mesh text-slate-100 flex flex-col justify-between font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Dynamic Background Glows and Dots Pattern */}
      <BackgroundGlows />

      {/* Navbar Header */}
      <header className="w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-slate-900/60 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-200 via-slate-100 to-cyan-200 bg-clip-text text-transparent">
            NeuraMeet <span className="text-cyan-400 text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 ml-1">AI</span>
          </span>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-400">
          <a href="#features" className="hover:text-white transition-colors duration-200">Features</a>
          <a href="#about" className="hover:text-white transition-colors duration-200">About</a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-200">GitHub</a>
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          <Show when="signed-out">
            <Link
              href="/sign-in"
              className="text-sm font-semibold text-slate-300 hover:text-white transition-colors px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="text-sm font-semibold px-5 py-2.5 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/35 hover:bg-indigo-500 transition-all"
            >
              Create Free Account
            </Link>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard" className="text-sm font-semibold px-5 py-2.5 rounded-full bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white transition-all cursor-pointer">
              Go to Dashboard
            </Link>
          </Show>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-7xl mx-auto px-6 py-12 md:py-20 text-center gap-16 relative z-10">
        <FadeUp>
          <div className="flex flex-col items-center gap-6 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-xs font-semibold text-indigo-300 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Redefining Video Conferencing Engagement & Security</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.15] bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Meet Smarter with AI-Powered Video Conferencing
            </h1>
            <p className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
              Secure, AI-powered video meetings with intelligent moderation, focus tracking, and seamless collaboration—all in one modern platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <Show when="signed-in">
                <Link href="/dashboard" className="px-8 py-4 rounded-full glowing-button text-white font-bold text-lg shadow-lg cursor-pointer">
                  Launch App Dashboard
                </Link>
              </Show>
              <Show when="signed-out">
                <Link
                  href="/sign-up"
                  className="px-8 py-4 rounded-full glowing-button text-white font-bold text-lg shadow-lg"
                >
                  Create Free Account
                </Link>
              </Show>
              <a href="#features" className="px-8 py-4 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-semibold text-lg hover:bg-slate-850 hover:text-white transition-all">
                Explore Features
              </a>
            </div>
          </div>
        </FadeUp>

        {/* Feature Cards Grid */}
        <StaggerContainer className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 text-left pt-12">
          {/* Card 1 */}
          <ScaleHoverCard className="glass-panel p-8 rounded-2xl glass-card-hover flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">AI Focus Tracking</h3>
            <p className="text-sm text-slate-400 leading-relaxed font-semibold">
              Tracks participant attention
            </p>
            <ul className="flex flex-col gap-2 mt-1">
              <li className="flex items-center gap-2 text-xs text-slate-300">
                <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Eye Tracking</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-300">
                <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Head Pose</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-300">
                <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Focus Alerts</span>
              </li>
            </ul>
          </ScaleHoverCard>

          {/* Card 2 */}
          <ScaleHoverCard className="glass-panel p-8 rounded-2xl glass-card-hover flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-950/60 border border-indigo-800 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Linkless Meetings</h3>
            <p className="text-sm text-slate-400 leading-relaxed font-semibold">
              Prevents meeting intrusions
            </p>
            <ul className="flex flex-col gap-2 mt-1">
              <li className="flex items-center gap-2 text-xs text-slate-300">
                <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Zero-Link Security</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-300">
                <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Direct In-App Invites</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-300">
                <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Access Control</span>
              </li>
            </ul>
          </ScaleHoverCard>

          {/* Card 3 */}
          <ScaleHoverCard className="glass-panel p-8 rounded-2xl glass-card-hover flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-950/60 border border-rose-800 flex items-center justify-center text-rose-400">
              <MessageSquareWarning className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Speech & Text Moderation</h3>
            <p className="text-sm text-slate-400 leading-relaxed font-semibold">
              Ensures workspace decorum
            </p>
            <ul className="flex flex-col gap-2 mt-1">
              <li className="flex items-center gap-2 text-xs text-slate-300">
                <Check className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Real-Time Chat Filters</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-300">
                <Check className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Verbal Speech Checks</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-300">
                <Check className="w-4 h-4 text-rose-400 shrink-0" />
                <span>3-Strike Eviction</span>
              </li>
            </ul>
          </ScaleHoverCard>
        </StaggerContainer>

        {/* Dedicated About Section */}
        <section id="about" className="w-full max-w-4xl mx-auto py-16 border-t border-slate-900/60 mt-8 text-center">
          <FadeUp delay={0.15}>
            <div className="glass-panel p-8 sm:p-12 rounded-3xl flex flex-col items-center gap-6 relative overflow-hidden shadow-2xl">
              {/* Radial overlay elements */}
              <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-indigo-500/10 blur-xl pointer-events-none" />
              <div className="absolute -left-16 -bottom-16 w-36 h-36 rounded-full bg-cyan-500/10 blur-xl pointer-events-none" />
              
              <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 border border-indigo-800 flex items-center justify-center text-indigo-400 mb-2">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-extrabold text-white">About NeuraMeet</h2>
              <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
                NeuraMeet is a cutting-edge video conferencing platform designed to maximize engagement and security. 
                By leveraging local WebRTC streams, client-side gaze telemetry via MediaPipe, and automatic real-time speech moderation, 
                we create a professional environment free of uninvited intrusions and distractions.
              </p>
              <div className="flex gap-4 mt-2">
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-6 py-2.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-850 hover:text-white transition-all shadow-md"
                >
                  View Source Code
                </a>
              </div>
            </div>
          </FadeUp>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 relative z-10">
        <div className="flex items-center gap-6">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors">GitHub</a>
          <a href="#features" className="hover:text-slate-300 transition-colors">Features</a>
          <a href="#" className="hover:text-slate-300 transition-colors">Privacy</a>
          <a href="#" className="hover:text-slate-300 transition-colors">Contact</a>
        </div>
        <div className="flex items-center gap-1 text-slate-500">
          <span>© 2026 NeuraMeet. Made with</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline-block" />
          <span>using Next.js</span>
        </div>
      </footer>
    </div>
  );
}
