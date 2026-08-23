'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { getUserProfileStatsAction, getMeetingHistoryAction } from '../actions';
import { 
  User, Mail, Calendar, ShieldCheck, Video, Clock, BarChart3, ArrowUpRight, ArrowRight 
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Stats {
  hostedCount: number;
  joinedCount: number;
  hoursInMeetings: number;
  invitesSent: number;
  invitesAccepted: number;
  completionRate: number;
}

interface RecentMeeting {
  id: string;
  title: string;
  host: string;
  status: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentMeetings, setRecentMeetings] = useState<RecentMeeting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfileData = async () => {
    setLoading(true);
    const statsRes = await getUserProfileStatsAction();
    if (statsRes.success && statsRes.stats) {
      setStats(statsRes.stats);
    }

    const meetingsRes = await getMeetingHistoryAction('', 'all', 'all', 'newest', 1, 6);
    if (meetingsRes.success && meetingsRes.meetings) {
      setRecentMeetings(meetingsRes.meetings);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  return (
    <div className="flex flex-col gap-6 select-none max-w-5xl mx-auto text-left w-full">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2 uppercase">
          <User className="w-6 h-6 text-indigo-500" />
          <span>User Profile</span>
        </h1>
        <p className="text-xs text-zinc-555 dark:text-zinc-400 mt-1 font-semibold">
          Review your conference statistics, platform activity, and identity credentials.
        </p>
      </div>

      {loading || !clerkLoaded ? (
        // Skeletons
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse mt-2">
          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="h-48 bg-zinc-200 dark:bg-zinc-850 rounded-3xl w-full" />
            <div className="h-40 bg-zinc-200 dark:bg-zinc-850 rounded-2xl w-full" />
          </div>
          <div className="lg:col-span-2 h-96 bg-zinc-200 dark:bg-zinc-850 rounded-3xl w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2 items-start">
          
          {/* Left Column: Profile Card & Activity Summary */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            
            {/* Identity Card */}
            <div className="glass-panel p-6 rounded-3xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-[#111827]/10 flex flex-col items-center text-center gap-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-4 right-4 text-emerald-500 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified</span>
              </div>

              {/* Avatar */}
              {clerkUser?.imageUrl ? (
                <img
                  src={clerkUser.imageUrl}
                  alt={clerkUser.fullName || 'User Avatar'}
                  className="w-20 h-20 rounded-full border border-indigo-500/30 object-cover shadow-md bg-zinc-900"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white text-3xl font-black shadow-md">
                  {clerkUser?.firstName?.charAt(0) || 'U'}
                </div>
              )}

              <div>
                <h2 className="text-base font-black text-zinc-900 dark:text-white flex items-center justify-center gap-1.5 leading-tight">
                  <span>{clerkUser?.fullName || clerkUser?.username}</span>
                </h2>
                <p className="text-xs text-indigo-500 dark:text-indigo-400 font-extrabold mt-1">
                  @{clerkUser?.username || clerkUser?.emailAddresses[0]?.emailAddress.split('@')[0]}
                </p>
              </div>

              <div className="h-px bg-zinc-200 dark:bg-zinc-900 w-full my-1" />

              <div className="w-full flex flex-col gap-2.5 text-xs text-zinc-600 dark:text-zinc-450 text-left px-2 leading-relaxed">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span className="truncate font-semibold" title={clerkUser?.emailAddresses[0]?.emailAddress}>
                    {clerkUser?.emailAddresses[0]?.emailAddress}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span className="font-semibold">Joined: <strong>{new Date(clerkUser?.createdAt || Date.now()).toLocaleDateString([], { month: 'long', year: 'numeric' })}</strong></span>
                </div>
              </div>

              <Link
                href="/dashboard/settings"
                className="w-full py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-extrabold text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-center mt-2 cursor-pointer"
              >
                Edit Platform Settings
              </Link>
            </div>

            {/* Platform Activity Summary */}
            <div className="glass-panel p-5 rounded-3xl border border-zinc-200 dark:border-zinc-900 bg-white/40 dark:bg-zinc-950/20 text-xs flex flex-col gap-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-450 dark:text-zinc-550 border-b border-zinc-200/50 dark:border-zinc-900/50 pb-2 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Platform Activity</span>
              </h3>
              
              <div className="flex flex-col gap-2.5 text-zinc-600 dark:text-zinc-450 font-semibold">
                <div className="flex justify-between items-center">
                  <span>Rooms Hosted</span>
                  <span className="font-mono font-extrabold text-zinc-800 dark:text-white">{stats?.hostedCount || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Rooms Joined</span>
                  <span className="font-mono font-extrabold text-zinc-800 dark:text-white">{stats?.joinedCount || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Air Time</span>
                  <span className="font-mono font-extrabold text-zinc-800 dark:text-white">{stats?.hoursInMeetings || 0} hrs</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Whitelists Created</span>
                  <span className="font-mono font-extrabold text-zinc-800 dark:text-white">{stats?.invitesSent || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Invitations Accepted</span>
                  <span className="font-mono font-extrabold text-zinc-800 dark:text-white">{stats?.invitesAccepted || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Completion Rate</span>
                  <span className="font-mono font-extrabold text-indigo-500 dark:text-indigo-400">{stats?.completionRate || 0}%</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Recent Meetings */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-200/80 dark:border-zinc-900/80">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-450 dark:text-zinc-550 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-indigo-500" />
                <span>Recent Whitelisted Sessions</span>
              </h3>
              {recentMeetings.length > 0 && (
                <Link href="/dashboard/meetings" className="text-[10px] font-extrabold text-indigo-500 hover:text-indigo-400 flex items-center gap-0.5">
                  <span>View All Registry</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {recentMeetings.length === 0 ? (
              <div className="border border-dashed border-zinc-250 dark:border-zinc-850 p-12 rounded-3xl text-center text-xs text-zinc-500">
                No conference logs registered.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {recentMeetings.map(m => (
                  <div 
                    key={m.id} 
                    className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-[#0c0f19]/35 hover:border-zinc-350 dark:hover:border-zinc-800 transition-all flex justify-between items-center text-xs"
                  >
                    <div className="flex flex-col gap-1 text-left min-w-0 flex-1 pr-4">
                      <strong className="text-zinc-800 dark:text-white truncate font-bold text-sm leading-tight">{m.title}</strong>
                      <span className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-0.5 truncate font-mono">
                        Organizer: @{m.host} • Registered {new Date(m.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    
                    <Link
                      href="/dashboard/meetings"
                      className="p-2 rounded-xl border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-500 hover:text-indigo-500 transition-all shrink-0 cursor-pointer"
                      title="Inspect Logs"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
