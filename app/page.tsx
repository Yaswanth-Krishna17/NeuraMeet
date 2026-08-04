import Link from 'next/link';
import { Show } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Eye, ShieldCheck, MessageSquareWarning, BrainCircuit, Check, Sparkles, Heart, ChevronDown, ArrowRight } from 'lucide-react';
import { FadeUp, StaggerContainer, ScaleHoverCard } from '@/components/LandingMotion';

export default async function Home() {
  const { userId } = await auth();
  if (userId) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-slate-100 flex flex-col justify-between font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Dots Grid */}
      {/* <BackgroundGlows /> */}

      {/* Navbar Header */}
      <header className="w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-zinc-850/60 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md">
            <BrainCircuit className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white">
            NeuraMeet
          </span>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          <a href="#features" className="hover:text-white transition-colors duration-200">Features</a>
          <a href="#faq" className="hover:text-white transition-colors duration-200">FAQ</a>
          <a href="#about" className="hover:text-white transition-colors duration-200">About</a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-200">GitHub</a>
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          <Show when="signed-out">
            <Link
              href="/sign-in"
              className="text-xs font-bold text-zinc-300 hover:text-white transition-colors px-4 py-2 uppercase tracking-wider"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="text-xs font-bold px-4 py-2.5 rounded-lg glowing-button text-white shadow hover:bg-indigo-500 transition-all uppercase tracking-wider"
            >
              Create Account
            </Link>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard" className="text-xs font-bold px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer uppercase tracking-wider">
              Dashboard
            </Link>
          </Show>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-7xl mx-auto px-6 py-16 md:py-24 text-center gap-20 relative z-10">
        <FadeUp>
          <div className="flex flex-col items-center gap-6 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Redefining secure online communication</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
              Meet Smarter with AI-Powered Video Shield
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 max-w-xl leading-relaxed mt-1">
              Secure, username-only meetings with client-side gaze analytics and real-time verbal moderation. Zero public links. Zero intrusions.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <Show when="signed-in">
                <Link href="/dashboard" className="px-6 py-3.5 rounded-lg glowing-button text-white font-bold text-sm shadow cursor-pointer flex items-center gap-2">
                  <span>Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Show>
              <Show when="signed-out">
                <Link
                  href="/sign-up"
                  className="px-6 py-3.5 rounded-lg glowing-button text-white font-bold text-sm shadow flex items-center gap-2"
                >
                  <span>Create Free Account</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Show>
              <a href="#features" className="px-6 py-3.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold text-sm hover:bg-zinc-850 hover:text-white transition-all">
                Explore Features
              </a>
            </div>
          </div>
        </FadeUp>

        {/* Product Mockup Section */}
        <FadeUp delay={0.1}>
          <div className="w-full max-w-5xl mx-auto px-6 relative">
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl overflow-hidden shadow-2xl">
              {/* Browser header */}
              <div className="h-10 border-b border-zinc-900 bg-zinc-900/40 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                </div>
                <div className="bg-zinc-950 border border-zinc-900/80 text-[10px] text-zinc-500 px-6 py-1 rounded mx-auto font-mono">
                  neurameet.com/dashboard
                </div>
              </div>
              {/* Dashboard Layout Mockup */}
              <div className="p-6 bg-[#09090B] flex flex-col gap-6 text-left opacity-80 pointer-events-none">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-400">
                      <BrainCircuit className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="h-4 w-32 bg-zinc-800 rounded" />
                      <div className="h-3 w-48 bg-zinc-900 rounded mt-1.5" />
                    </div>
                  </div>
                  <div className="h-8 w-24 bg-zinc-900 border border-zinc-800 rounded-lg" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl flex flex-col gap-3">
                    <div className="h-3 w-16 bg-zinc-850 rounded" />
                    <div className="h-6 w-10 bg-indigo-500/10 border border-indigo-900/30 rounded mt-1" />
                  </div>
                  <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl flex flex-col gap-3">
                    <div className="h-3 w-16 bg-zinc-850 rounded" />
                    <div className="h-6 w-10 bg-emerald-500/10 border border-emerald-900/30 rounded mt-1" />
                  </div>
                  <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl flex flex-col gap-3">
                    <div className="h-3 w-16 bg-zinc-850 rounded" />
                    <div className="h-6 w-10 bg-cyan-500/10 border border-cyan-900/30 rounded mt-1" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeUp>

        {/* Trust Indicators */}
        <div className="w-full max-w-5xl mx-auto px-6 py-6 border-y border-zinc-900/60 flex flex-wrap items-center justify-center gap-12 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
          <span>Clerk Shield</span>
          <span>WebRTC Mesh</span>
          <span>MediaPipe Telemetry</span>
          <span>Mongoose Database</span>
          <span>Socket.io Relay</span>
        </div>

        {/* Features Timeline Section */}
        <section id="features" className="w-full max-w-5xl mx-auto px-6 py-8 flex flex-col gap-12 text-left">
          <div className="max-w-2xl">
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Core Capabilities</span>
            <h2 className="text-3xl font-extrabold text-white mt-2">Zero-link rooms. Complete engagement insights.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <ScaleHoverCard className="bg-zinc-950 border border-zinc-900 p-8 rounded-xl flex flex-col gap-6 hover:bg-zinc-900/20 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-cyan-950/40 border border-cyan-900/40 flex items-center justify-center text-cyan-400 shadow-sm">
                <Eye className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-bold text-slate-100">AI Focus Tracking</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Maps gaze, blink rates (EAR), and head movements locally using Google MediaPipe Face Mesh. Alerts the host when engagement collapses.
                </p>
              </div>
              <ul className="flex flex-col gap-2 border-t border-zinc-900 pt-4 mt-auto">
                <li className="flex items-center gap-2 text-[11px] text-zinc-300">
                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Real-time local Gaze Mapping</span>
                </li>
                <li className="flex items-center gap-2 text-[11px] text-zinc-300">
                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Continuous EAR attention checks</span>
                </li>
              </ul>
            </ScaleHoverCard>

            {/* Card 2 */}
            <ScaleHoverCard className="bg-zinc-950 border border-zinc-900 p-8 rounded-xl flex flex-col gap-6 hover:bg-zinc-900/20 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-indigo-950/40 border border-indigo-900/40 flex items-center justify-center text-indigo-400 shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-bold text-slate-100">Linkless Meetings</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Removes vulnerable invitation URLs completely to eliminate Zoombombing. Restricts entries server-side to username invites.
                </p>
              </div>
              <ul className="flex flex-col gap-2 border-t border-zinc-900 pt-4 mt-auto">
                <li className="flex items-center gap-2 text-[11px] text-zinc-300">
                  <Check className="w-3.5 h-3.5 text-indigo-400" />
                  <span>No public URLs or links</span>
                </li>
                <li className="flex items-center gap-2 text-[11px] text-zinc-300">
                  <Check className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Direct secure in-app alerts</span>
                </li>
              </ul>
            </ScaleHoverCard>

            {/* Card 3 */}
            <ScaleHoverCard className="bg-zinc-950 border border-zinc-900 p-8 rounded-xl flex flex-col gap-6 hover:bg-zinc-900/20 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-rose-950/40 border border-rose-900/40 flex items-center justify-center text-rose-400 shadow-sm">
                <MessageSquareWarning className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-bold text-slate-100">Speech & Text Moderation</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Scans text chat and verbal speech streams locally using Web Speech APIs. Logs strike warnings and boots offenders on 3 strikes.
                </p>
              </div>
              <ul className="flex flex-col gap-2 border-t border-zinc-900 pt-4 mt-auto">
                <li className="flex items-center gap-2 text-[11px] text-zinc-300">
                  <Check className="w-3.5 h-3.5 text-rose-400" />
                  <span>Leet-speak normalized filtering</span>
                </li>
                <li className="flex items-center gap-2 text-[11px] text-zinc-300">
                  <Check className="w-3.5 h-3.5 text-rose-400" />
                  <span>Continuous verbal swearing check</span>
                </li>
              </ul>
            </ScaleHoverCard>
          </div>
        </section>

        {/* FAQ Section Accordion */}
        <section id="faq" className="w-full max-w-3xl mx-auto px-6 py-8 text-left">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">FAQ</span>
            <h2 className="text-3xl font-extrabold text-white mt-2">Frequently Asked Questions</h2>
          </div>

          <div className="flex flex-col gap-1 border-t border-zinc-900">
            <details className="group border-b border-zinc-900 py-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-slate-200">
                <h3 className="text-sm font-semibold">How do linkless meetings prevent intrusions?</h3>
                <ChevronDown className="h-4 w-4 shrink-0 transition duration-200 group-open:-rotate-180 text-zinc-500" />
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-zinc-400">
                NeuraMeet eliminates invitation links. Instead of sending a URL that can leak, hosts add attendees using their secure platform username. When the call starts, participants receive a real-time notification on their dashboard. Anyone not invited is strictly blocked server-side.
              </p>
            </details>

            <details className="group border-b border-zinc-900 py-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-slate-200">
                <h3 className="text-sm font-semibold">Does focus tracking record my video or feed?</h3>
                <ChevronDown className="h-4 w-4 shrink-0 transition duration-200 group-open:-rotate-180 text-zinc-500" />
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-zinc-400">
                No. All computer vision calculations (eye aspect ratios, head coordinates, gaze shift) are computed locally inside your browser using Google MediaPipe Face Mesh. Only the numeric attention scores (0-100%) are emitted to the host telemetry panel—your video stream is never saved or processed on our servers.
              </p>
            </details>

            <details className="group border-b border-zinc-900 py-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-slate-200">
                <h3 className="text-sm font-semibold">What is swearing moderation?</h3>
                <ChevronDown className="h-4 w-4 shrink-0 transition duration-200 group-open:-rotate-180 text-zinc-500" />
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-zinc-400">
                NeuraMeet uses leet-speak normalization for text chat and browser-native continuous Web Speech APIs for verbal transcripts. Spoken or typed blacklisted words trigger strike warnings. Reaching 3 strikes results in automated server-side eviction from the call.
              </p>
            </details>
          </div>
        </section>

        {/* Dedicated About Section */}
        <section id="about" className="w-full max-w-4xl mx-auto py-8 text-center">
          <FadeUp delay={0.15}>
            <div className="bg-zinc-950 border border-zinc-900 p-8 sm:p-12 rounded-xl flex flex-col items-center gap-6 relative overflow-hidden shadow-xl">
              <div className="w-10 h-10 rounded-lg bg-indigo-950/40 border border-indigo-900/40 flex items-center justify-center text-indigo-400 mb-2">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-extrabold text-white">About NeuraMeet</h2>
              <p className="text-xs leading-relaxed text-zinc-400 max-w-2xl">
                NeuraMeet is built for organizations prioritizing engagement security.
                By utilizing peer-to-peer WebRTC connections, client-side gaze telemetry,
                and automated verbal-speech checks, we deliver a distraction-free environment for professional meetings.
              </p>
              <div className="flex gap-4 mt-2">
                <a
                  href="https://github.com/Yaswanth-Krishna17/NeuraMeet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold text-xs hover:bg-zinc-850 hover:text-white transition-all shadow-sm"
                >
                  View GitHub Repository
                </a>
              </div>
            </div>
          </FadeUp>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-8 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500 relative z-10">
        <div className="flex items-center gap-6 font-semibold uppercase tracking-wider text-[10px]">
          <a href="https://github.com/Yaswanth-Krishna17/NeuraMeet" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">GitHub</a>
          <a href="#features" className="hover:text-zinc-300 transition-colors">Features</a>
          <a href="#faq" className="hover:text-zinc-300 transition-colors">FAQ</a>
          <a href="#" className="hover:text-zinc-300 transition-colors">Privacy</a>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-500">
          <span>© 2026 NeuraMeet. Made with</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline-block" />
          <span>using Next.js</span>
        </div>
      </footer>
    </div>
  );
}
