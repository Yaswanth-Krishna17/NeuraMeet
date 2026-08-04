import { getMeetingAction } from '@/app/dashboard/actions';
import MeetingRoomClient from './MeetingRoomClient';
import { ShieldAlert } from 'lucide-react';


export default async function MeetingRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const authCheck = (await getMeetingAction(id)) as any;

  if (!authCheck.authorized || !authCheck.meeting || !authCheck.username || !authCheck.fullName) {
    return (
      <div className="min-h-screen bg-[#06070a] bg-mesh flex items-center justify-center p-6 text-slate-100 font-sans">
        <div className="glass-panel p-8 rounded-3xl max-w-md w-full text-center flex flex-col items-center gap-6 border border-slate-900 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-rose-950/50 border border-rose-900 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-900/10">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Access Unauthorized</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Linkless security has blocked your request. You are not on the guest list for this meeting room, or the meeting ID does not exist.
          </p>
          <a 
            href="/dashboard" 
            className="w-full py-3 rounded-xl glowing-button text-white font-bold text-sm shadow-md"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <MeetingRoomClient 
      meeting={authCheck.meeting}
      username={authCheck.username}
      fullName={authCheck.fullName}
    />
  );
}
