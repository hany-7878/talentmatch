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
    /* RESPONSIVE FIX: Added shrink-0 to prevent the header from collapsing 
       and z-20 to keep it above chat messages during scroll */
    <div className="flex flex-col w-full shrink-0 z-20 bg-slate-950/50 backdrop-blur-md">

      {/* 1. STATUS BANNER (Pending - Seeker View) */}
      {status === 'pending' && !isManager && (
        <div className="bg-indigo-600 px-4 md:px-6 py-2.5 flex items-center justify-between shadow-xl animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2 text-white">
            <FaInfoCircle size={14} className="shrink-0 animate-pulse" />
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Invitation</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => onUpdateStatus('accepted')} 
              className="bg-white text-indigo-600 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase active:scale-95 transition"
            >
              Accept
            </button>
            <button 
              onClick={() => onUpdateStatus('declined')} 
              className="bg-indigo-700 text-indigo-100 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase active:scale-95 transition"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* 2. STATUS BANNER (Pending - Manager View) */}
      {status === 'pending' && isManager && (
        <div className="bg-slate-800/80 border-b border-slate-700/50 px-4 md:px-6 py-2 flex items-center gap-2 text-slate-400">
          <FaInfoCircle size={10} className="shrink-0" />
          <span className="text-[9px] font-bold uppercase tracking-widest italic truncate">
            Waiting for {partnerName}...
          </span>
        </div>
      )}

      {/* 3. STATUS BANNER (Declined) */}
      {status === 'declined' && (
        <div className="bg-rose-950/50 border-b border-rose-500/20 px-4 md:px-6 py-2 flex items-center gap-2 text-rose-400">
          <FaLock size={10} className="shrink-0" />
          <span className="text-[9px] font-bold uppercase tracking-widest">Chat Locked</span>
        </div>
      )}

      {/* 4. MAIN HEADER */}
      {/* RESPONSIVE FIX: Adjusted padding for mobile (px-4) vs desktop (px-8) */}
      <header className="px-4 md:px-8 py-4 md:py-5 border-b border-slate-800/50 flex justify-between items-center bg-slate-900/10">
        <div className="min-w-0 flex-1 mr-4"> {/* min-w-0 is vital for the truncate below to work in flex */}
          <h3 className="text-white font-bold text-sm md:text-base leading-none truncate">
            #{title.toLowerCase().replace(/\s+/g, '-')}
          </h3>
          <p className="text-[8px] md:text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2 truncate">
            <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-indigo-500 shadow-[0_0_5px_theme(colors.indigo.500)]" />
            <span className="truncate">{isManager ? 'Candidate' : 'Manager'}: {partnerName}</span>
          </p>
        </div>

        <div className={`shrink-0 text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
          status === 'accepted' ? 'border-emerald-500/30 text-emerald-500' : 'border-slate-700 text-slate-500'
        }`}>
          {status}
        </div>
      </header>
    </div>
  );
}