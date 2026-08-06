'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { getUserProfileStatsAction, getMeetingHistoryAction } from '../actions';
import { 
  User, Mail, Calendar, ShieldCheck, Video, Clock, Key, Award, BarChart3, Users, CheckCircle, ArrowUpRight, ArrowRight 
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
    // Fetch stats
    const statsRes = await getUserProfileStatsAction();
    if (statsRes.success && statsRes.stats) {
      setStats(statsRes.stats);
    }

    // Fetch up to 3 recent meetings
    const meetingsRes = await getMeetingHistoryAction('', 'all', 'all', 'newest', 1, 3);
    if (meetingsRes.success && meetingsRes.meetings) {
      setRecentMeetings(meetingsRes.meetings);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  return (
    <div className="flex flex-col gap-6 select-none max-w-5xl mx-auto text-left">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
          <User className="w-7 h-7 text-indigo-500" />
          <span>User Profile</span>
        </h1>
        <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1">
          Review your conference statistics, platform activity, and identity credentials.
        </p>
      </div>

      {loading || !clerkLoaded ? (
        // Skeletons
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="lg:col-span-1 glass-panel p-6 rounded-3xl border border-zinc-200 dark:border-zinc-900 flex flex-col items-center gap-4 bg-white dark:bg-zinc-950/20">
            <div className="w-24 h-24 bg-zinc-200 dark:bg-zinc-850 rounded-full" />
            <div className="h-4 bg-zinc-200 dark:bg-zinc-850 rounded w-2/3" />
            <div className="h-3.5 bg-zinc-200 dark:bg-zinc-850 rounded w-1/2" />
          </div>
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(idx => (
                <div key={idx} className="h-24 bg-zinc-200 dark:bg-zinc-850 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
          
          {/* Left panel: Profile Card Summary */}
          <div className="lg:col-span-1 flex flex-col gap-4">
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
                  className="w-24 h-24 rounded-full border-2 border-indigo-500/30 object-cover shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white text-3xl font-black shadow-lg">
                  {clerkUser?.firstName?.charAt(0) || 'U'}
                </div>
              )}

              <div>
                <h2 className="text-base font-black text-zinc-850 dark:text-white flex items-center justify-center gap-1.5">
                  <span>{clerkUser?.fullName || clerkUser?.username}</span>
                </h2>
                <p className="text-xs text-indigo-500 dark:text-indigo-400 font-bold mt-0.5">
                  @{clerkUser?.username || clerkUser?.emailAddresses[0]?.emailAddress.split('@')[0]}
                </p>
              </div>

              <div className="h-px bg-zinc-250/50 dark:bg-zinc-900/50 w-full my-1" />

              <div className="w-full flex flex-col gap-2.5 text-xs text-zinc-600 dark:text-zinc-400 text-left px-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span className="truncate" title={clerkUser?.emailAddresses[0]?.emailAddress}>
                    {clerkUser?.emailAddresses[0]?.emailAddress}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span>Joined: <strong>{new Date(clerkUser?.createdAt || Date.now()).toLocaleDateString()}</strong></span>
                </div>
              </div>

              <Link
                href="/dashboard/settings"
                className="w-full py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 text-xs font-black hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all text-center mt-2"
              >
                Edit Platform Settings
              </Link>
            </div>
          </div>

          {/* Right panel: Statistics Grid and Recent Meetings */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Stats list */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-550 mb-3.5 flex items-center gap-1">
                <BarChart3 className="w-4 h-4" />
                <span>Conference Performance</span>
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {/* Stats 1 */}
                <div className="glass-panel p-4.5 rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-[#111827]/10 flex flex-col justify-between h-24">
                  <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-550 uppercase tracking-widest">Hosted</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-black text-zinc-850 dark:text-white">
                      {stats?.hostedCount || 0}
                    </span>
                    <span className="text-[9px] font-bold text-zinc-500">meetings</span>
                  </div>
                </div>

                {/* Stats 2 */}
                <div className="glass-panel p-4.5 rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-[#111827]/10 flex flex-col justify-between h-24">
                  <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-550 uppercase tracking-widest">Joined</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-black text-zinc-850 dark:text-white">
                      {stats?.joinedCount || 0}
                    </span>
                    <span className="text-[9px] font-bold text-zinc-500">attended</span>
                  </div>
                </div>

                {/* Stats 3 */}
                <div className="glass-panel p-4.5 rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-[#111827]/10 flex flex-col justify-between h-24">
                  <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-550 uppercase tracking-widest">Air Time</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-black text-zinc-850 dark:text-white">
                      {stats?.hoursInMeetings || 0}
                    </span>
                    <span className="text-[9px] font-bold text-zinc-500">hours</span>
                  </div>
                </div>

                {/* Stats 4 */}
                <div className="glass-panel p-4.5 rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-[#111827]/10 flex flex-col justify-between h-24">
                  <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-550 uppercase tracking-widest">Invites Sent</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-black text-zinc-850 dark:text-white">
                      {stats?.invitesSent || 0}
                    </span>
                    <span className="text-[9px] font-bold text-zinc-500">outbound</span>
                  </div>
                </div>

                {/* Stats 5 */}
                <div className="glass-panel p-4.5 rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-[#111827]/10 flex flex-col justify-between h-24">
                  <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-550 uppercase tracking-widest">Accepted</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-black text-zinc-850 dark:text-white">
                      {stats?.invitesAccepted || 0}
                    </span>
                    <span className="text-[9px] font-bold text-zinc-500">invitations</span>
                  </div>
                </div>

                {/* Stats 6 */}
                <div className="glass-panel p-4.5 rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-[#111827]/10 flex flex-col justify-between h-24">
                  <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-550 uppercase tracking-widest">Success Rate</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-black text-zinc-850 dark:text-white">
                      {stats?.completionRate || 0}%
                    </span>
                    <span className="text-[9px] font-bold text-zinc-500">conversion</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Meetings */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-550 flex items-center gap-1">
                  <Video className="w-4 h-4" />
                  <span>Recent Conferences</span>
                </h3>
                {recentMeetings.length > 0 && (
                  <Link href="/dashboard/history" className="text-[10px] font-bold text-indigo-500 hover:text-indigo-400 flex items-center gap-0.5">
                    <span>View All History</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              {recentMeetings.length === 0 ? (
                <div className="glass-panel border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950/20 p-6 rounded-2xl text-center text-xs text-zinc-500">
                  No conference records available.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {recentMeetings.map(m => (
                    <div key={m.id} className="glass-panel p-4 rounded-xl border border-zinc-200 dark:border-zinc-900/60 bg-white dark:bg-[#111827]/10 flex justify-between items-center text-xs">
                      <div className="flex flex-col gap-0.5">
                        <strong className="text-zinc-800 dark:text-white">{m.title}</strong>
                        <span className="text-[10px] text-zinc-500">Organizer: @{m.host} • {new Date(m.createdAt).toLocaleDateString()}</span>
                      </div>
                      <Link
                        href="/dashboard/history"
                        className="p-1.5 rounded-lg border border-zinc-250 dark:border-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 hover:text-indigo-500 transition-colors"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
