import { FaInfoCircle, FaLock } from 'react-icons/fa';

interface ChatHeaderProps {
  title: string;
  partnerName: string;
  status: 'pending' | 'accepted' | 'declined';
  role?: string;
  onUpdateStatus: (status: 'accepted' | 'declined') => void;
}

export default function ChatHeader({ title, partnerName, status, role, onUpdateStatus }: ChatHeaderProps) {
  const isManager = role?.toLowerCase() === 'manager';

  return (
    <div className="flex flex-col w-full">
      {/* 1. STATUS BANNER (Pending) - Only Seeker can Accept/Decline */}
      {status === 'pending' && !isManager && (
        <div className="bg-indigo-600 px-6 py-2.5 flex items-center justify-between z-10 shadow-xl animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2 text-white">
            <FaInfoCircle size={14} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Pending Invitation</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => onUpdateStatus('accepted')} 
              className="bg-white text-indigo-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase hover:scale-105 active:scale-95 transition"
            >
              Accept
            </button>
            <button 
              onClick={() => onUpdateStatus('declined')} 
              className="bg-indigo-700 text-indigo-200 px-3 py-1 rounded-lg text-[9px] font-black uppercase hover:bg-indigo-800 transition"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* 2. STATUS BANNER (Waiting for Seeker) - Manager View */}
      {status === 'pending' && isManager && (
        <div className="bg-slate-800/50 border-b border-slate-700/50 px-6 py-2 flex items-center gap-2 text-slate-400">
          <FaInfoCircle size={10} />
          <span className="text-[9px] font-bold uppercase tracking-widest italic">Waiting for {partnerName} to accept...</span>
        </div>
      )}

      {/* 3. STATUS BANNER (Declined) */}
      {status === 'declined' && (
        <div className="bg-rose-950/50 border-b border-rose-500/20 px-6 py-2 flex items-center gap-2 text-rose-400">
          <FaLock size={10} />
          <span className="text-[9px] font-bold uppercase tracking-widest">Chat Locked (Declined)</span>
        </div>
      )}

      {/* 4. MAIN HEADER */}
      <header className="px-8 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/10 backdrop-blur-sm">
        <div className="overflow-hidden">
          <h3 className="text-white font-bold leading-none truncate max-w-md">
            #{title.toLowerCase().replace(/\s+/g, '-')}
          </h3>
          <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_5px_theme(colors.indigo.500)]" />
            {isManager ? 'Candidate' : 'Manager'}: {partnerName}
          </p>
        </div>

        <div className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
          status === 'accepted' ? 'border-emerald-500/30 text-emerald-500' : 'border-slate-700 text-slate-500'
        }`}>
          {status}
        </div>
      </header>
    </div>
  );
}