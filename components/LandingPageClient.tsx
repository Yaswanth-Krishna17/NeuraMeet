'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  BrainCircuit, Shield, ShieldCheck, Check, X, Lock, Key, Users, User, 
  Clock, ArrowRight, Sparkles, Activity, Video, Fingerprint, Globe, 
  Laptop, Smartphone, Heart, Menu, Moon, Sun, Monitor, AlertTriangle, ExternalLink 
} from 'lucide-react';
import LandingAccordion from '@/components/LandingAccordion';

export default function LandingPageClient() {
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Ref for mouse tracking on hero card
  const heroCardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!heroCardRef.current) return;
    const rect = heroCardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePosition({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#09090B] text-white flex items-center justify-center font-sans">
        <BrainCircuit className="w-12 h-12 text-indigo-500 animate-pulse" />
      </div>
    );
  }

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } }
  };


  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const scaleHover = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
  };

  const scrollAnchor = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80; // height of fixed navbar
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  const socialBadges = [
    { text: "Universities", icon: "🏫" },
    { text: "Companies", icon: "🏢" },
    { text: "Startups", icon: "🚀" },
    { text: "Remote Teams", icon: "💻" },
    { text: "Hackathons", icon: "🏆" },
    { text: "Government", icon: "🏛️" },
    { text: "Healthcare", icon: "🏥" },
    { text: "Developers", icon: "👨‍💻" }
  ];

  return (
    <div className="min-h-screen bg-landing-bg text-landing-text-primary selection:bg-landing-primary/30 selection:text-landing-text-primary relative overflow-x-hidden font-sans smooth-transition landing-theme-lock">
      {/* Background Decorators */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Subtle grid */}
        <div 
          className="absolute inset-0 opacity-[0.25] dark:opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />
        {/* Animated Blurry Blobs */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.12, 0.22, 0.12],
            x: [0, 40, 0],
            y: [0, -30, 0]
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-[8%] left-[5%] w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full bg-landing-primary/25 blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.10, 0.18, 0.10],
            x: [0, -50, 0],
            y: [0, 50, 0]
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-[25%] right-[2%] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] rounded-full bg-landing-accent/25 blur-[140px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.08, 0.15, 0.08],
            y: [0, 60, 0]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-[15%] left-[20%] w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] rounded-full bg-landing-highlight/20 blur-[110px]"
        />
      </div>

      {/* Floating Translucent Header Navbar */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-3.5 bg-landing-bg/80 dark:bg-[#09090b]/80 backdrop-blur-lg border-b border-landing-border shadow-lg shadow-black/5 dark:shadow-none' : 'py-6 bg-transparent border-b border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-landing-primary flex items-center justify-center shadow-lg shadow-landing-primary/25 relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-corpta text-lg font-black tracking-tight text-landing-text-primary leading-none">
                NeuraMeet
              </span>
              <span className="text-[9px] font-bold tracking-wider text-landing-primary dark:text-landing-highlight uppercase mt-0.5">
                Secure Meetings. Zero Links.
              </span>
            </div>
          </div>

          {/* Center Links */}
          <nav className="hidden lg:flex items-center gap-7">
            {['Features', 'Security', 'How It Works', 'FAQ'].map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={(e) => scrollAnchor(e, link.toLowerCase().replace(/\s+/g, '-'))}
                className="text-xs font-bold tracking-widest text-landing-text-secondary hover:text-landing-text-primary uppercase transition-colors duration-200"
              >
                {link}
              </a>
            ))}
            <a
              href="https://github.com/Yaswanth-Krishna17/NeuraMeet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold tracking-widest text-landing-text-secondary hover:text-landing-text-primary uppercase transition-colors duration-200 flex items-center gap-1.5"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </nav>

          {/* Right Action buttons */}
          <div className="hidden sm:flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-xs font-bold text-landing-text-secondary hover:text-landing-text-primary transition-colors px-4 py-2 uppercase tracking-wider"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="text-xs font-bold px-5 py-2.5 rounded-xl bg-landing-primary hover:bg-landing-primary/90 text-white shadow-lg shadow-landing-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0 uppercase tracking-wider"
            >
              Create Free Account
            </Link>
          </div>

          {/* Hamburger Mobile Menu toggle */}
          <div className="flex items-center gap-3 sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-landing-card dark:bg-zinc-900 border border-landing-border text-landing-text-primary"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed top-[70px] left-0 right-0 z-40 bg-landing-bg dark:bg-[#09090b] border-b border-landing-border px-6 py-6 sm:hidden flex flex-col gap-4 shadow-xl backdrop-blur-xl bg-opacity-95 dark:bg-opacity-95"
          >
            {['Features', 'Security', 'How It Works', 'FAQ'].map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={(e) => scrollAnchor(e, link.toLowerCase().replace(/\s+/g, '-'))}
                className="text-sm font-bold tracking-wider text-landing-text-secondary hover:text-landing-text-primary uppercase py-2 border-b border-landing-border/40"
              >
                {link}
              </a>
            ))}
            <a
              href="https://github.com/Yaswanth-Krishna17/NeuraMeet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold tracking-wider text-landing-text-secondary hover:text-landing-text-primary uppercase py-2 flex items-center gap-2"
            >
              <span>GitHub</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <div className="flex flex-col gap-2 pt-4">
              <Link
                href="/sign-in"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 text-sm font-bold text-landing-text-secondary hover:text-landing-text-primary uppercase tracking-wider rounded-xl bg-landing-card dark:bg-zinc-900 border border-landing-border"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 text-sm font-bold bg-landing-primary hover:bg-landing-primary/90 text-white uppercase tracking-wider rounded-xl shadow-md"
              >
                Create Free Account
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <main className="relative z-10 pt-28">
        <section className="min-h-[85vh] flex flex-col justify-center max-w-7xl mx-auto px-6 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Hero Content */}
            <motion.div 
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left gap-6"
            >
              <motion.div 
                variants={fadeInUp}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-landing-card dark:bg-[#111827] border border-landing-border shadow-sm text-xs font-bold tracking-wider text-landing-primary dark:text-landing-highlight"
              >
                <Sparkles className="w-4 h-4" />
                <span>MEETING REDESIGNED • NO PASSCODES • NO LEAKS</span>
              </motion.div>

              {/* Massive Headline in Corpta font */}
              <motion.h1 
                variants={fadeInUp}
                className="font-corpta text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-black tracking-tight leading-[1.05] text-landing-text-primary uppercase"
              >
                NO LINKS.<br/>
                NO INTRUDERS.<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-landing-primary via-landing-highlight to-landing-accent dark:from-indigo-400 dark:via-cyan-400 dark:to-teal-400 font-extrabold">
                  JUST SECURE MEETINGS.
                </span>
              </motion.h1>

              <motion.p 
                variants={fadeInUp}
                className="font-corpta text-xl sm:text-2xl md:text-3xl font-extrabold text-landing-accent dark:text-landing-highlight leading-tight uppercase tracking-wide"
              >
                Invite People. Not Problems.
              </motion.p>

              <motion.p 
                variants={fadeInUp}
                className="text-sm sm:text-base md:text-lg text-landing-text-secondary max-w-xl leading-relaxed font-medium"
              >
                NeuraMeet replaces insecure meeting links with username-based invitations so only verified participants can access your meetings. Safe, encrypted, and direct.
              </motion.p>

              {/* Action Buttons */}
              <motion.div 
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-2"
              >
                <Link
                  href="/sign-up"
                  className="px-8 py-4 rounded-xl bg-landing-primary hover:bg-landing-primary/95 text-white font-bold text-sm shadow-xl shadow-landing-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group uppercase tracking-wider"
                >
                  <span>Start Secure Meeting</span>
                  <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#how-it-works"
                  onClick={(e) => scrollAnchor(e, 'how-it-works')}
                  className="px-8 py-4 rounded-xl bg-landing-card dark:bg-[#111827] border border-landing-border text-landing-text-primary font-bold text-sm shadow-md hover:bg-landing-bg/50 dark:hover:bg-zinc-800/40 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center"
                >
                  View Demo
                </a>
              </motion.div>

              {/* Trust Badges */}
              <motion.div 
                variants={fadeInUp}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 mt-6 pt-6 border-t border-landing-border/60 dark:border-landing-border/40 w-full"
              >
                {[
                  "Zero Meeting Links",
                  "Username Verification",
                  "Invite Only",
                  "Secure WebRTC",
                  "End-to-End Encryption"
                ].map((badge) => (
                  <span key={badge} className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-landing-text-secondary/80">
                    <Check className="w-3.5 h-3.5 text-landing-primary dark:text-landing-highlight" />
                    {badge}
                  </span>
                ))}
              </motion.div>
            </motion.div>

            {/* Right Hero: Dashboard Mockup */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="lg:col-span-5"
            >
              <div 
                ref={heroCardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                  transform: `perspective(1000px) rotateY(${mousePosition.x * 8}deg) rotateX(${-mousePosition.y * 8}deg) translateY(0px)`,
                  transition: 'transform 0.1s ease-out'
                }}
                className="w-full max-w-lg mx-auto relative group"
              >
                {/* Outer gradient glow */}
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-landing-primary via-landing-highlight to-landing-accent opacity-25 dark:opacity-30 blur-xl group-hover:opacity-40 transition-opacity duration-500" />
                
                {/* Realistic Dashboard Panel */}
                <div className="relative rounded-2xl border border-landing-border bg-landing-card dark:bg-[#111827] backdrop-blur-xl shadow-2xl overflow-hidden text-left">
                  
                  {/* Browser Bar */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-landing-border/80 bg-landing-bg/50 dark:bg-zinc-900/40">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <div className="px-3 py-0.5 rounded-md text-[9px] font-mono text-landing-text-secondary/70 bg-landing-card dark:bg-zinc-950/60 border border-landing-border/40 select-none">
                      neurameet.com/dashboard/meeting/active
                    </div>
                    <div className="w-8" />
                  </div>

                  {/* Dashboard Content */}
                  <div className="p-5 flex flex-col gap-5">
                    
                    {/* Meeting Title & Indicator */}
                    <div className="flex items-center justify-between border-b border-landing-border/40 pb-4">
                      <div>
                        <span className="text-[10px] font-bold text-landing-primary dark:text-landing-highlight uppercase tracking-widest">Active Meeting</span>
                        <h4 className="text-base font-extrabold text-landing-text-primary mt-0.5">Frontend Design Review</h4>
                      </div>
                      <div className="flex flex-col items-end">
                        {/* Linkless Active Tag */}
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold tracking-wider uppercase border border-emerald-500/20 shadow-sm animate-pulse">
                          <Lock className="w-3 h-3" />
                          <span>Linkless Active</span>
                        </span>
                      </div>
                    </div>

                    {/* Left: Participants list */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Active Participants */}
                      <div className="rounded-xl border border-landing-border/60 bg-landing-bg/30 dark:bg-zinc-950/40 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-bold text-landing-text-secondary uppercase tracking-wider flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-landing-primary" />
                            <span>Participants</span>
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-landing-primary/10 text-landing-primary dark:text-indigo-400 font-bold uppercase tracking-wider border border-landing-primary/20">3 In Call</span>
                        </div>
                        <ul className="flex flex-col gap-2">
                          <li className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-landing-card dark:bg-[#111827] border border-landing-border/40">
                            <div className="flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full bg-indigo-500 text-[9px] text-white flex items-center justify-center font-bold">LD</span>
                              <span className="font-bold text-landing-text-primary">lucky_dev</span>
                            </div>
                            <span className="text-[9px] font-semibold px-1 rounded bg-indigo-500/15 text-indigo-500 uppercase tracking-wide">Host</span>
                          </li>
                          <li className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-landing-card dark:bg-[#111827] border border-landing-border/40">
                            <div className="flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full bg-teal-500 text-[9px] text-white flex items-center justify-center font-bold">AK</span>
                              <span className="font-semibold text-landing-text-primary">akhil</span>
                            </div>
                            <span className="text-[9px] text-emerald-500 font-bold uppercase flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> Verified
                            </span>
                          </li>
                          <li className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-landing-card dark:bg-[#111827] border border-landing-border/40">
                            <div className="flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full bg-cyan-500 text-[9px] text-white flex items-center justify-center font-bold">HS</span>
                              <span className="font-semibold text-landing-text-primary">harsha</span>
                            </div>
                            <span className="text-[9px] text-emerald-500 font-bold uppercase flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> Verified
                            </span>
                          </li>
                        </ul>
                      </div>

                      {/* Pending & Verification Ticker */}
                      <div className="flex flex-col gap-4">
                        {/* Pending list */}
                        <div className="rounded-xl border border-landing-border/60 bg-landing-bg/30 dark:bg-zinc-950/40 p-4 flex-1">
                          <span className="text-[10px] font-bold text-landing-text-secondary uppercase tracking-wider flex items-center gap-1 mb-3">
                            <Clock className="w-3.5 h-3.5 text-landing-accent" />
                            <span>Pending Invitations</span>
                          </span>
                          <div className="flex items-center justify-between text-xs py-2 px-2.5 rounded-lg bg-landing-card dark:bg-[#111827] border border-landing-border/40">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-landing-accent animate-ping" />
                              <span className="font-semibold text-landing-text-secondary">rahul</span>
                            </div>
                            <span className="text-[9px] font-bold text-landing-accent uppercase tracking-widest">Invited</span>
                          </div>
                        </div>

                        {/* Verification Ticker Panel */}
                        <div className="rounded-xl border border-landing-border/60 bg-gradient-to-r from-landing-primary/5 to-landing-highlight/5 p-4 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-landing-primary/10 flex items-center justify-center text-landing-primary dark:text-landing-highlight">
                              <Fingerprint className="w-4.5 h-4.5" />
                            </div>
                            <div>
                              <span className="text-[9px] text-landing-text-secondary font-bold uppercase tracking-wider block">ID Registry</span>
                              <span className="text-xs font-black text-landing-text-primary">5 Verified Users</span>
                            </div>
                          </div>
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Status bar */}
                    <div className="flex items-center justify-between border-t border-landing-border/40 pt-4 text-[10px] font-mono text-landing-text-secondary">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block animate-ping" />
                        <span>Signaling: SECURE WEBRTC MESH</span>
                      </div>
                      <span>Room ID: e2e-secured</span>
                    </div>

                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </section>

        {/* PERFECT FOR Badges (Social Proof) */}
        <section className="w-full bg-landing-card/40 dark:bg-zinc-950/20 border-y border-landing-border/60 py-8 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-landing-primary dark:text-landing-highlight mb-4 block">
              PERFECT FOR
            </span>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
              {socialBadges.map((badge, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="px-4 py-2.5 rounded-xl border border-landing-border/80 bg-landing-card dark:bg-[#111827] shadow-[0_2px_8px_rgba(0,0,0,0.02)] dark:shadow-none flex items-center gap-2 select-none"
                >
                  <span className="text-sm">{badge.icon}</span>
                  <span className="text-xs font-bold text-landing-text-primary tracking-wide">
                    {badge.text}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* WHY CHOOSE NEURAMEET Section */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-20 lg:py-28 relative">
          <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col gap-4">
            <span className="text-xs font-black uppercase tracking-widest text-landing-primary dark:text-landing-highlight">
              WHY CHOOSE NEURAMEET?
            </span>
            {/* Heading in Corpta font */}
            <h2 className="font-corpta text-3xl sm:text-4xl md:text-5xl font-black text-landing-text-primary uppercase leading-tight">
              Secures meetings before anyone enters.
            </h2>
            <p className="text-sm sm:text-base text-landing-text-secondary leading-relaxed font-medium">
              Traditional meeting platforms secure meetings <strong className="text-landing-accent font-semibold">after</strong> users join. NeuraMeet secures meetings <strong className="text-landing-primary dark:text-landing-highlight font-semibold">before</strong> anyone enters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: <Lock className="w-5.5 h-5.5 text-indigo-400" />,
                title: "🔒 Linkless Meetings",
                desc: "Meeting links don't exist. There are no URLs to leak, forward, or hack. Only invited usernames can enter the connection."
              },
              {
                icon: <User className="w-5.5 h-5.5 text-teal-400" />,
                title: "👤 Verified Identity",
                desc: "Every participant is fully authenticated and verified before joining. You always know exactly who is in your room."
              },
              {
                icon: <Shield className="w-5.5 h-5.5 text-cyan-400" />,
                title: "🛡 Zero Unauthorized Access",
                desc: "Only invited users can access meetings. No accidental forwarding, no gate-crashing, and zero Zoombombing."
              },
              {
                icon: <Activity className="w-5.5 h-5.5 text-indigo-400" />,
                title: "⚡ Lightning Fast WebRTC",
                desc: "Direct peer-to-peer encrypted communication mesh that reduces latency and keeps conversations private."
              },
              {
                icon: <Clock className="w-5.5 h-5.5 text-teal-400" />,
                title: "📅 Smart Scheduling",
                desc: "Schedule calls with robust timezone support. Set up your meeting details once and invite users instantly."
              },
              {
                icon: <Laptop className="w-5.5 h-5.5 text-cyan-400" />,
                title: "📱 Responsive Everywhere",
                desc: "Works flawlessly across Desktop, Laptop, Tablet, and Mobile. Experience linkless safety wherever you go."
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -6, scale: 1.01 }}
                viewport={{ once: true }}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 22, delay: idx * 0.05 }}
                className="group rounded-2xl border border-landing-border/80 dark:border-landing-border hover:border-landing-primary/30 dark:hover:border-landing-accent/30 bg-landing-card dark:bg-[#111827] p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:shadow-none transition-all flex flex-col gap-4 relative overflow-hidden"
              >
                {/* Glow highlight */}
                <div className="absolute -inset-2 bg-gradient-to-r from-landing-primary to-landing-highlight opacity-0 group-hover:opacity-5 blur-xl transition-opacity duration-300" />
                <div className="w-11 h-11 rounded-xl bg-landing-bg dark:bg-zinc-800/40 border border-landing-border flex items-center justify-center shadow-inner">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-landing-text-primary tracking-wide">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-landing-text-secondary leading-relaxed mt-2 font-medium">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS Section */}
        <section id="how-it-works" className="w-full bg-landing-card/30 dark:bg-zinc-950/10 border-y border-landing-border/60 py-20 lg:py-28 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col gap-4">
              <span className="text-xs font-black uppercase tracking-widest text-landing-primary dark:text-landing-highlight">
                HOW IT WORKS
              </span>
              <h2 className="font-corpta text-3xl sm:text-4xl md:text-5xl font-black text-landing-text-primary uppercase leading-tight">
                Secure Linkless Workflow
              </h2>
              <p className="text-sm sm:text-base text-landing-text-secondary leading-relaxed font-medium">
                Step-by-step security mapping that keeps your meetings invulnerable.
              </p>
            </div>

            {/* Timeline Steps Cards */}
            <div className="relative">
              {/* Timeline Connector Line */}
              <div className="hidden lg:block absolute top-[50%] left-[8%] right-[8%] h-[2px] bg-gradient-to-r from-landing-primary via-landing-highlight to-landing-accent opacity-40 z-0" />
              
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8 relative z-10">
                {[
                  {
                    step: "Step 1",
                    title: "Host creates meeting",
                    desc: "Define meeting details securely inside the dashboard.",
                    icon: <Video className="w-5 h-5 text-indigo-400" />
                  },
                  {
                    step: "Step 2",
                    title: "Invite by username",
                    desc: "Add participants directly using their registered usernames.",
                    icon: <User className="w-5 h-5 text-teal-400" />
                  },
                  {
                    step: "Step 3",
                    title: "Secure invitations",
                    desc: "Participants get a direct notification, bypassing vulnerable email leaks.",
                    icon: <Key className="w-5 h-5 text-cyan-400" />
                  },
                  {
                    step: "Step 4",
                    title: "Identity verified",
                    desc: "Server matches usernames and logs keys before connection.",
                    icon: <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  },
                  {
                    step: "Step 5",
                    title: "Meeting starts",
                    desc: "Launch high-performance WebRTC streams without meeting links.",
                    icon: <Check className="w-5 h-5 text-teal-400" />
                  }
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                    className="rounded-2xl border border-landing-border bg-landing-card dark:bg-[#111827] p-6 shadow-md dark:shadow-none hover:shadow-lg dark:hover:border-landing-primary/20 transition-all flex flex-col gap-4 text-center items-center relative group"
                  >
                    <div className="w-10 h-10 rounded-full bg-landing-bg dark:bg-zinc-800/40 border border-landing-border flex items-center justify-center relative shadow-inner">
                      {item.icon}
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-landing-primary text-white text-[9px] font-bold flex items-center justify-center border border-white dark:border-zinc-900">
                        {idx + 1}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-landing-primary dark:text-landing-highlight">
                        {item.step}
                      </span>
                      <h4 className="text-sm font-bold text-landing-text-primary mt-1">
                        {item.title}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-landing-text-secondary leading-relaxed mt-2 font-medium">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* COMPARISON Section */}
        <section className="max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col gap-4">
            <span className="text-xs font-black uppercase tracking-widest text-landing-primary dark:text-landing-highlight">
              THE COMPARISON
            </span>
            <h2 className="font-corpta text-3xl sm:text-4xl md:text-5xl font-black text-landing-text-primary uppercase leading-tight">
              Why NeuraMeet is Different
            </h2>
            <p className="text-sm sm:text-base text-landing-text-secondary leading-relaxed font-medium">
              We did not just tweak the formula. We re-engineered meeting logic.
            </p>
          </div>

          {/* Comparison Table / Grid */}
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch relative">
            
            {/* Traditional Apps Column */}
            <div className="rounded-2xl border border-landing-border/80 dark:border-landing-border bg-landing-card/60 dark:bg-zinc-950/40 p-8 flex flex-col gap-6 relative select-none">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-landing-text-secondary block">
                  TRADITIONAL PLATFORMS
                </span>
                <h4 className="text-lg font-bold text-landing-text-primary mt-1">
                  Zoom, Teams, Meet
                </h4>
              </div>
              <ul className="flex flex-col gap-4 text-xs sm:text-sm">
                {[
                  "Public meeting links",
                  "Meeting IDs",
                  "Anyone with link joins",
                  "Links can be forwarded",
                  "Waiting rooms"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-landing-text-secondary">
                    <X className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Highlighted NeuraMeet Column */}
            <div className="rounded-2xl border-2 border-landing-primary dark:border-landing-accent bg-landing-card dark:bg-[#111827] p-8 flex flex-col gap-6 relative shadow-xl shadow-landing-primary/10 dark:shadow-none overflow-hidden select-none">
              {/* Glow indicator */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-landing-primary/15 to-transparent blur-md" />
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-landing-primary dark:text-landing-highlight block">
                    NEURAMEET ADVANTAGE
                  </span>
                  <h4 className="text-xl font-black text-landing-text-primary mt-1 uppercase tracking-wide">
                    NeuraMeet
                  </h4>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-landing-primary/10 border border-landing-primary/30 text-[10px] font-black uppercase tracking-wider text-landing-primary dark:text-landing-highlight animate-pulse">
                  Recommended
                </span>
              </div>
              <ul className="flex flex-col gap-4 text-xs sm:text-sm">
                {[
                  "Username Invitations",
                  "Verified Identity",
                  "Invite Only",
                  "No Public URLs",
                  "No Meeting IDs",
                  "Zero Zoombombing"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-landing-text-primary font-bold">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </section>

        {/* SECURITY Section */}
        <section id="security" className="w-full bg-landing-card/30 dark:bg-zinc-950/10 border-y border-landing-border/60 py-20 lg:py-28 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              
              {/* Left Shield visual */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
                  
                  {/* Decorative glowing backdrops */}
                  <div className="absolute inset-0 bg-gradient-to-r from-landing-primary to-landing-highlight rounded-full opacity-10 blur-2xl animate-pulse" />
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-4 rounded-full border border-dashed border-landing-primary/20 dark:border-landing-accent/20"
                  />
                  <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-10 rounded-full border border-dashed border-landing-highlight/30"
                  />

                  {/* Shield Frame */}
                  <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-3xl bg-landing-card dark:bg-[#111827] border border-landing-border shadow-2xl flex items-center justify-center">
                    <div className="absolute inset-1 bg-gradient-to-br from-landing-primary/5 to-transparent rounded-2xl" />
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-landing-primary/10 flex items-center justify-center text-landing-primary dark:text-landing-highlight relative shadow-inner">
                      <Fingerprint className="w-10 h-10 sm:w-12 sm:h-12 relative z-10" />
                    </div>
                  </div>

                  {/* Floating badge items */}
                  <div className="absolute top-2 left-6 w-9 h-9 rounded-xl bg-landing-card dark:bg-zinc-900 border border-landing-border shadow-md flex items-center justify-center text-landing-primary">
                    <Lock className="w-4.5 h-4.5" />
                  </div>
                  <div className="absolute bottom-6 right-6 w-10 h-10 rounded-xl bg-landing-card dark:bg-zinc-900 border border-landing-border shadow-md flex items-center justify-center text-landing-primary">
                    <ShieldCheck className="w-5 h-5" />
                  </div>

                </div>
              </div>

              {/* Right security descriptions */}
              <div className="lg:col-span-7 flex flex-col gap-6 text-center lg:text-left">
                <span className="text-xs font-black uppercase tracking-widest text-landing-primary dark:text-landing-highlight">
                  SECURITY FIRST. ALWAYS.
                </span>
                <h2 className="font-corpta text-3xl sm:text-4xl md:text-5xl font-black text-landing-text-primary uppercase leading-tight">
                  Zero Trust Architecture
                </h2>
                <p className="text-sm sm:text-base text-landing-text-secondary leading-relaxed font-medium">
                  We build upon a secure identity ledger, verifying credentials at every layer of communication.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  {[
                    "Username Authentication",
                    "Identity Verification",
                    "End-to-End Encryption",
                    "Linkless Architecture",
                    "Permission Based Entry"
                  ].map((item, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center gap-3.5 p-4 rounded-xl border border-landing-border bg-landing-card dark:bg-[#111827] shadow-sm select-none"
                    >
                      <div className="w-8 h-8 rounded-lg bg-landing-primary/10 flex items-center justify-center text-landing-primary dark:text-landing-highlight shrink-0">
                        <Shield className="w-4 h-4" />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-landing-text-primary">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* FAQ Accordion Section */}
        <section id="faq" className="max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col gap-4">
            <span className="text-xs font-black uppercase tracking-widest text-landing-primary dark:text-landing-highlight">
              FAQ
            </span>
            <h2 className="font-corpta text-3xl sm:text-4xl md:text-5xl font-black text-landing-text-primary uppercase leading-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm sm:text-base text-landing-text-secondary leading-relaxed font-medium">
              Everything you need to know about linkless video security.
            </p>
          </div>

          <LandingAccordion />
        </section>

        {/* FINAL CTA Section */}
        <section className="max-w-7xl mx-auto px-6 pb-20">
          <div className="relative rounded-3xl border border-landing-border bg-landing-card dark:bg-[#111827] overflow-hidden shadow-2xl p-8 sm:p-12 md:p-16 text-center z-10 select-none">
            
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-landing-primary/5 via-landing-highlight/5 to-landing-accent/5 opacity-80" />
            <div className="absolute inset-0 opacity-[0.25] dark:opacity-[0.04]"
              style={{
                backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
                backgroundSize: '24px 24px'
              }}
            />

            <div className="relative z-10 flex flex-col items-center gap-6 max-w-2xl mx-auto">
              <span className="text-xs font-black uppercase tracking-widest text-landing-primary dark:text-landing-highlight">
                GET STARTED TODAY
              </span>
              <h2 className="font-corpta text-3xl sm:text-4xl md:text-5xl font-black text-landing-text-primary uppercase leading-tight">
                Ready to Stop Sharing Meeting Links?
              </h2>
              <p className="text-sm sm:text-base text-landing-text-secondary leading-relaxed font-medium">
                Host your first secure username-based meeting today and experience zero-leak conferencing.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4 justify-center">
                <Link
                  href="/sign-up"
                  className="px-8 py-4 rounded-xl bg-landing-primary hover:bg-landing-primary/95 text-white font-bold text-sm shadow-xl shadow-landing-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0 uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <span>Start Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="https://github.com/Yaswanth-Krishna17/NeuraMeet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 rounded-xl bg-landing-card dark:bg-zinc-900 border border-landing-border text-landing-text-primary font-bold text-sm hover:bg-landing-bg/50 dark:hover:bg-zinc-800/40 transition-all hover:-translate-y-0.5 active:translate-y-0 uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <span>GitHub</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-landing-border bg-landing-card/30 dark:bg-zinc-950/20 py-12 relative z-10 select-none">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            
            {/* Brand block */}
            <div className="flex flex-col gap-3 md:col-span-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-landing-primary flex items-center justify-center">
                  <BrainCircuit className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="font-corpta text-base font-black tracking-tight text-landing-text-primary uppercase">
                  NeuraMeet
                </span>
              </div>
              <p className="text-xs text-landing-text-secondary leading-relaxed max-w-xs font-medium">
                Replacing insecure links with username-based invitations. Direct, linkless WebRTC video conferencing.
              </p>
            </div>

            {/* Sitemap 1 */}
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-landing-primary dark:text-landing-highlight block mb-4">
                Product
              </span>
              <ul className="flex flex-col gap-2.5 text-xs text-landing-text-secondary">
                <li><a href="#features" onClick={(e) => scrollAnchor(e, 'features')} className="hover:text-landing-text-primary transition-colors">Features</a></li>
                <li><a href="#security" onClick={(e) => scrollAnchor(e, 'security')} className="hover:text-landing-text-primary transition-colors">Security</a></li>
                <li><a href="#how-it-works" onClick={(e) => scrollAnchor(e, 'how-it-works')} className="hover:text-landing-text-primary transition-colors">How It Works</a></li>
                <li><a href="#faq" onClick={(e) => scrollAnchor(e, 'faq')} className="hover:text-landing-text-primary transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* Sitemap 2 */}
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-landing-primary dark:text-landing-highlight block mb-4">
                Connect
              </span>
              <ul className="flex flex-col gap-2.5 text-xs text-landing-text-secondary">
                <li><a href="https://github.com/Yaswanth-Krishna17/NeuraMeet" target="_blank" rel="noopener noreferrer" className="hover:text-landing-text-primary transition-colors">GitHub</a></li>
                <li><a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-landing-text-primary transition-colors">LinkedIn</a></li>
                <li><a href="#" className="hover:text-landing-text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="mailto:contact@neurameet.com" className="hover:text-landing-text-primary transition-colors">Contact</a></li>
              </ul>
            </div>

          </div>

          <div className="border-t border-landing-border/50 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-landing-text-secondary font-medium">
            <span>© 2026 NeuraMeet. All rights reserved.</span>
            <div className="flex items-center gap-1">
              <span>Made with</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>by Yaswanth Krishna</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
