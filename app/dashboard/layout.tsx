import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { BrainCircuit } from 'lucide-react';
import ThemeToggle from '@/components/meeting/ThemeToggle';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background bg-mesh text-foreground flex flex-col font-sans">
      {/* Header Dashboard Nav */}
      <nav className="w-full bg-card/75 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <ThemeToggle />
            <Link href="/" className="flex items-center gap-2 mr-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-indigo-500/25">
                <BrainCircuit className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-200 to-slate-100 bg-clip-text text-transparent">
                NeuraMeet
              </span>
            </Link>
            
            {/* SaaS Navigation Tabs */}
            <div className="hidden md:flex items-center gap-1 bg-zinc-900/30 dark:bg-zinc-950/40 light:bg-zinc-100/60 p-1 rounded-xl border border-zinc-850 dark:border-zinc-900 light:border-zinc-250 select-none">
              <Link href="/dashboard" className="text-[11px] font-extrabold text-indigo-500 dark:text-indigo-400 light:text-indigo-700 bg-indigo-50/10 dark:bg-indigo-950/20 px-3 py-1.5 rounded-lg border border-indigo-500/20 dark:border-indigo-900/30 shadow-sm transition-all">
                Dashboard
              </Link>
              <span className="text-[11px] font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-150 px-3 py-1.5 rounded-lg transition-colors cursor-not-allowed" title="Coming soon in Enterprise Tier">
                Meetings
              </span>
              <span className="text-[11px] font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-150 px-3 py-1.5 rounded-lg transition-colors cursor-not-allowed" title="Coming soon in Enterprise Tier">
                History
              </span>
              <span className="text-[11px] font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-150 px-3 py-1.5 rounded-lg transition-colors cursor-not-allowed" title="Coming soon in Enterprise Tier">
                Settings
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs font-semibold text-zinc-400 hover:text-zinc-150 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-900">
              Home
            </Link>
            <div className="w-px h-5 bg-border" />
            <UserButton />
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="flex-grow max-w-7xl w-full mx-auto px-6 py-8">
        {children}
      </div>
    </div>
  );
}
