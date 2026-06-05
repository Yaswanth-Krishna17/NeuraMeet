import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#06070a] bg-mesh text-slate-100 flex flex-col font-sans">
      {/* Header Dashboard Nav */}
      <nav className="w-full bg-[#0a0c10]/70 backdrop-blur-md border-b border-slate-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-sm shadow-indigo-500/25">
                A
              </div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-200 to-slate-100 bg-clip-text text-transparent">
                AetherCall
              </span>
            </Link>
            <span className="text-slate-700">|</span>
            <span className="text-xs font-semibold text-slate-400">Dashboard</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-900">
              Home
            </Link>
            <div className="w-px h-5 bg-slate-900" />
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
