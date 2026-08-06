'use client';

import { useEffect, useState } from 'react';
import { getMeetingHistoryAction, deleteMeetingAction } from '../actions';
import { useUser } from '@clerk/nextjs';
import { 
  History, Search, Filter, SortAsc, Clipboard, Trash2, Info, ChevronLeft, ChevronRight, X, Clock, Calendar, Shield, Users, Loader2, User 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Attendee {
  username: string;
  joinedAt: string;
  leftAt?: string;
}

interface Meeting {
  id: string;
  title: string;
  description: string;
  host: string;
  invitees: string[];
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';
  createdAt: string;
  scheduledAt: string;
  isLocked: boolean;
  waitingRoomEnabled: boolean;
  attendees: Attendee[];
}

export default function MeetingHistoryPage() {
  const { user } = useUser();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [hostFilter, setHostFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    const res = await getMeetingHistoryAction(search, statusFilter, hostFilter, sortBy, page, 8);
    if (res.success && res.meetings) {
      setMeetings(res.meetings);
      setTotalPages(res.totalPages);
      setTotalCount(res.totalCount || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, [page, statusFilter, hostFilter, sortBy]);

  // Trigger search with delay
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setPage(1);
      fetchHistory();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    alert('Meeting ID copied to clipboard!');
  };

  const handleDeleteHistory = async (meetingId: string) => {
    if (!confirm('Are you sure you want to remove this meeting from your history?')) return;
    setActioningId(meetingId);
    const res = await deleteMeetingAction(meetingId);
    if (res.success) {
      fetchHistory();
    } else {
      alert(`Deletion failed: ${res.error}`);
    }
    setActioningId(null);
  };

  const calculateMeetingDuration = (meeting: Meeting) => {
    if (meeting.status === 'scheduled') return 'Scheduled';
    if (meeting.status === 'active') return 'Active Room';
    if (!meeting.attendees || meeting.attendees.length === 0) return '0m';

    // Find first join and last leave
    const joinTimes = meeting.attendees.map(a => new Date(a.joinedAt).getTime());
    const leaveTimes = meeting.attendees.map(a => a.leftAt ? new Date(a.leftAt).getTime() : new Date().getTime());
    
    if (joinTimes.length === 0) return '0m';
    
    const start = Math.min(...joinTimes);
    const end = Math.max(...leaveTimes);
    
    const diffMs = end - start;
    const diffMins = Math.round(diffMs / (1000 * 60));
    
    if (diffMins < 60) return `${diffMins}m`;
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hrs}h ${mins}m`;
  };

  const EmptyHistoryIllustration = () => (
    <svg className="w-36 h-36 mx-auto text-indigo-500/20 dark:text-indigo-400/10 mb-4" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="75" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" className="text-zinc-350 dark:text-zinc-800" />
      <path d="M100 60V100L125 115" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="100" cy="100" r="8" fill="#22D3EE" opacity="0.4" />
    </svg>
  );

  return (
    <div className="flex flex-col gap-6 select-none max-w-6xl mx-auto">
      
      {/* Header section */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
          <History className="w-7 h-7 text-indigo-500" />
          <span>Meeting History</span>
        </h1>
        <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1">
          Review, filter, and inspect details of all meetings you organized or attended.
        </p>
      </div>

      {/* Filters, sorting and search container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-white/40 dark:bg-[#111827]/20 border border-zinc-255/50 dark:border-zinc-900/60 p-4 rounded-2xl">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by meeting title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 px-10 py-2.5 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-all font-semibold"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Filter className="absolute left-3.5 top-3.5 w-3.5 h-3.5 text-zinc-400" />
          <select
            value={statusFilter}
            onChange={e => { setPage(1); setStatusFilter(e.target.value); }}
            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-all font-semibold cursor-pointer appearance-none"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="active">Active</option>
            <option value="ended">Ended</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Host Filter */}
        <div className="relative">
          <User className="absolute left-3.5 top-3.5 w-3.5 h-3.5 text-zinc-400" />
          <select
            value={hostFilter}
            onChange={e => { setPage(1); setHostFilter(e.target.value); }}
            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-all font-semibold cursor-pointer appearance-none"
          >
            <option value="all">All Roles</option>
            <option value="hosted">Hosted by Me</option>
            <option value="invited">Invited Guest</option>
          </select>
        </div>

        {/* Sorting */}
        <div className="relative">
          <SortAsc className="absolute left-3.5 top-3.5 w-3.5 h-3.5 text-zinc-400" />
          <select
            value={sortBy}
            onChange={e => { setPage(1); setSortBy(e.target.value); }}
            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-all font-semibold cursor-pointer appearance-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </div>
      </div>

      {/* History content table */}
      {loading ? (
        // Skeleton lines
        <div className="glass-panel border border-zinc-200 dark:border-zinc-900 rounded-2xl overflow-hidden p-4 flex flex-col gap-3 animate-pulse bg-white dark:bg-zinc-950/20">
          {[1, 2, 3, 4, 5].map(idx => (
            <div key={idx} className="h-10 bg-zinc-200 dark:bg-zinc-850 rounded-lg w-full" />
          ))}
        </div>
      ) : meetings.length === 0 ? (
        // Empty State layout
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel text-center py-16 px-6 border border-zinc-200 dark:border-zinc-900 rounded-3xl bg-white dark:bg-zinc-950/20 max-w-xl mx-auto w-full mt-6"
        >
          <EmptyHistoryIllustration />
          <h3 className="text-base font-extrabold text-zinc-800 dark:text-white uppercase tracking-wider">
            No Meeting Records
          </h3>
          <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-2 max-w-sm mx-auto leading-relaxed">
            There are no meeting logs match your filters. Once you participate in or organize rooms, they will show up here.
          </p>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Desktop Table View */}
          <div className="hidden md:block glass-panel border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-[#111827]/20 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-[#111827]/40 border-b border-zinc-200 dark:border-zinc-900 text-zinc-500 font-black uppercase tracking-widest text-[9px]">
                  <th className="px-5 py-3">Meeting Name</th>
                  <th className="px-5 py-3">Host</th>
                  <th className="px-5 py-3">Attendees</th>
                  <th className="px-5 py-3">Scheduled Date</th>
                  <th className="px-5 py-3">Duration</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {meetings.map(m => (
                  <tr key={m.id} className="border-b border-zinc-200/50 dark:border-zinc-900/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 text-zinc-700 dark:text-zinc-300 font-semibold transition-colors">
                    <td className="px-5 py-4 font-bold text-zinc-850 dark:text-white truncate max-w-[200px]" title={m.title}>
                      {m.title}
                    </td>
                    <td className="px-5 py-4 truncate">
                      @{m.host}
                    </td>
                    <td className="px-5 py-4">
                      {m.attendees ? m.attendees.length : 0} users
                    </td>
                    <td className="px-5 py-4">
                      {new Date(m.scheduledAt || m.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      {calculateMeetingDuration(m)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                        m.status === 'ended'
                          ? 'bg-zinc-150 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                          : m.status === 'active'
                          ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                          : m.status === 'cancelled'
                          ? 'bg-rose-105 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                          : 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedMeeting(m)}
                        className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-450 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer transition-all"
                        title="View Meeting Details"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleCopyId(m.id)}
                        className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-450 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer transition-all"
                        title="Copy Meeting ID"
                      >
                        <Clipboard className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteHistory(m.id)}
                        disabled={actioningId === m.id}
                        className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-rose-500 dark:hover:text-rose-400 cursor-pointer transition-all disabled:opacity-50"
                        title="Delete Record"
                      >
                        {actioningId === m.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden flex flex-col gap-3.5">
            {meetings.map(m => (
              <div key={m.id} className="glass-panel p-4 rounded-xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-[#111827]/10 flex flex-col gap-3 text-left">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-zinc-850 dark:text-white line-clamp-1">{m.title}</h3>
                    <p className="text-[10px] text-zinc-450 mt-0.5">Host: @{m.host}</p>
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                    m.status === 'ended'
                      ? 'bg-zinc-150 dark:bg-zinc-900 text-zinc-650 dark:text-zinc-450'
                      : m.status === 'active'
                      ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                      : m.status === 'cancelled'
                      ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                      : 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                  }`}>
                    {m.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 bg-zinc-50 dark:bg-zinc-950/20 p-2.5 rounded-lg text-[10px] text-zinc-550 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-900/50">
                  <div>
                    <span className="block text-[8px] font-black text-zinc-400 uppercase tracking-wider">Date</span>
                    <strong className="text-zinc-700 dark:text-zinc-300">{new Date(m.scheduledAt || m.createdAt).toLocaleDateString()}</strong>
                  </div>
                  <div>
                    <span className="block text-[8px] font-black text-zinc-400 uppercase tracking-wider">Duration</span>
                    <strong className="text-zinc-700 dark:text-zinc-300">{calculateMeetingDuration(m)}</strong>
                  </div>
                  <div>
                    <span className="block text-[8px] font-black text-zinc-400 uppercase tracking-wider">Attendees</span>
                    <strong className="text-zinc-700 dark:text-zinc-300">{m.attendees?.length || 0} users</strong>
                  </div>
                </div>

                <div className="flex gap-2 justify-end mt-1">
                  <button
                    onClick={() => setSelectedMeeting(m)}
                    className="flex-1 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-wider hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>Info</span>
                  </button>
                  <button
                    onClick={() => handleCopyId(m.id)}
                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-indigo-500 cursor-pointer"
                  >
                    <Clipboard className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteHistory(m.id)}
                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-rose-500 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-1">
              <span className="text-[11px] font-semibold text-zinc-500">
                Showing page {page} of {totalPages} ({totalCount} total rooms)
              </span>
              <div className="flex gap-1.5">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-550 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-550 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Meeting Details Overlay Modal */}
      <AnimatePresence>
        {selectedMeeting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="glass-panel max-w-lg w-full p-6 text-left flex flex-col gap-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111827] relative rounded-3xl"
            >
              <button
                onClick={() => setSelectedMeeting(null)}
                className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-black text-zinc-800 dark:text-white uppercase tracking-wider">
                  Secure Meeting Details
                </h3>
              </div>

              <div className="h-px bg-zinc-200 dark:bg-zinc-900 w-full" />

              <div className="flex flex-col gap-4 text-xs text-left max-h-[380px] overflow-y-auto custom-scrollbar pr-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Meeting Title</span>
                  <span className="text-zinc-800 dark:text-white font-extrabold text-sm">{selectedMeeting.title}</span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Description</span>
                  <span className="text-zinc-600 dark:text-zinc-450 leading-relaxed">
                    {selectedMeeting.description || 'No description provided.'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-950/20 p-3 rounded-2xl border border-zinc-200/50 dark:border-zinc-900/60">
                  <div>
                    <span className="block text-[8px] font-black text-indigo-550 dark:text-indigo-400 uppercase tracking-widest">Meeting Host</span>
                    <strong className="text-zinc-800 dark:text-zinc-250 font-bold text-[11px]">@{selectedMeeting.host}</strong>
                  </div>
                  <div>
                    <span className="block text-[8px] font-black text-indigo-550 dark:text-indigo-400 uppercase tracking-widest">Meeting ID</span>
                    <strong className="text-zinc-800 dark:text-zinc-250 font-bold text-[11px]">{selectedMeeting.id}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-zinc-650 dark:text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-zinc-400" />
                    <span>Created: <strong>{new Date(selectedMeeting.createdAt).toLocaleDateString()}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    <span>Duration: <strong>{calculateMeetingDuration(selectedMeeting)}</strong></span>
                  </div>
                </div>

                <div className="h-px bg-zinc-100 dark:bg-zinc-900 w-full" />

                {/* Invitees lists */}
                <div className="flex flex-col gap-2">
                  <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>Invite Guest List ({selectedMeeting.invitees.length})</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedMeeting.invitees.map(invitee => (
                      <span key={invitee} className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-850 text-zinc-650 dark:text-zinc-400 text-[10px] font-semibold">
                        @{invitee}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actual Attendees lists */}
                <div className="flex flex-col gap-2 mt-1">
                  <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Actual Participant Logs ({selectedMeeting.attendees ? selectedMeeting.attendees.length : 0})</span>
                  </span>
                  {selectedMeeting.attendees && selectedMeeting.attendees.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      {selectedMeeting.attendees.map((attendee, idx) => {
                        const joined = new Date(attendee.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const left = attendee.leftAt 
                          ? new Date(attendee.leftAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Active';
                        return (
                          <div key={idx} className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/20 p-2.5 rounded-xl border border-zinc-200/50 dark:border-zinc-900/50 text-[10px]">
                            <strong className="text-zinc-800 dark:text-zinc-200">@{attendee.username}</strong>
                            <span className="text-zinc-500">Joined: {joined} • Left: {left}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-[10px] italic text-zinc-400 dark:text-zinc-650">No attendee logs recorded.</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleCopyId(selectedMeeting.id)}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-md cursor-pointer active:scale-98 transition-all"
                >
                  Copy Room ID
                </button>
                <button
                  onClick={() => setSelectedMeeting(null)}
                  className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-850 text-zinc-650 dark:text-zinc-400 text-xs font-black hover:bg-zinc-150 dark:hover:bg-zinc-900 transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
