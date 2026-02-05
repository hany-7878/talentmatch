import { FaTimes, FaCheck, FaUserSlash, FaCommentAlt, FaCrown } from 'react-icons/fa';

interface ApplicantSlideOverProps {
  applicant: any | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  onHire: (applicant: any) => void; // Added the senior hire action
}

export default function ApplicantSlideOver({ applicant, onClose, onUpdateStatus, onHire }: ApplicantSlideOverProps) {
  if (!applicant) return null;

  // Senior UI Logic: Only show the Hire button if they are already in the 'interviewing' stage
  // This prevents accidental hiring before at least a shortlist/chat.
  const isInterviewing = applicant.status === 'interviewing';

  return (
    <div className="fixed inset-0 z-[150] flex justify-end">
      <div 
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
        
        {/* Header */}
        <div className="p-8 border-b sticky top-0 bg-white/80 backdrop-blur-md z-10 flex justify-between items-center">
          <div>
            <h3 className="font-black text-xl text-gray-900">Review Candidate</h3>
            <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
              applicant.status === 'hired' ? 'bg-emerald-500 text-white':
              applicant.status === 'interviewing' ? 'bg-indigo-100 text-indigo-700' :
              applicant.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-600'
            }`}>
              Status: {applicant.status || 'Pending'}
            </span>
          </div>
          <button title="Close Slide Over" 
           aria-label="Close Slide Over"
            onClick={onClose} 
            className="p-2 hover:bg-rose-50 text-gray-400 hover:text-rose-500 rounded-full transition-all"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-8 flex-1 overflow-y-auto">
          {/* Profile Section */}
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center text-2xl font-black text-indigo-600 overflow-hidden shadow-inner border-4 border-white ring-1 ring-gray-100">
              {applicant.profiles?.avatar_url ? (
                <img src={applicant.profiles.avatar_url} className="w-full h-full object-cover" alt="" />
              ) : (
                applicant.name.charAt(0)
              )}
            </div>
            <div>
              <h4 className="text-2xl font-black text-gray-900 leading-tight">{applicant.name}</h4>
              <p className="text-indigo-600 font-bold text-xs uppercase tracking-widest">{applicant.role}</p>
              <div className="mt-1 flex items-center gap-2">
                 <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-black tracking-tighter">
                   {applicant.match}% MATCH
                 </span>
              </div>
            </div>
          </div>

          {/* Application Pitch */}
          <div className="space-y-3">
            <h5 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
              <FaCommentAlt className="text-indigo-400" /> Application Pitch
            </h5>
            <div className="bg-slate-50 border border-slate-100 p-6 rounded-[2rem] text-sm text-gray-800 leading-relaxed">
              {applicant.pitch || 'No pitch provided.'}
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-3">
            <h5 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Technical Arsenal</h5>
            <div className="flex flex-wrap gap-2">
              {applicant.profiles?.skills?.map((skill: string, i: number) => (
                <span key={i} className="px-3 py-1.5 bg-white text-gray-600 rounded-xl text-[11px] font-bold border border-gray-100 shadow-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-8 bg-gray-50 border-t space-y-4">
          
          {/* The "Senior" Big Move: Hiring Action */}
          {isInterviewing && (
            <button 
              onClick={() => onHire(applicant)}
              className="w-full bg-emerald-600 text-white font-black py-5 rounded-[1.5rem] hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-100 animate-in zoom-in-95 duration-200"
            >
              <FaCrown className="animate-bounce" />
              <span className="uppercase tracking-widest text-sm">Hire Candidate</span>
            </button>
          )}

          <div className="flex gap-4">
            <button 
              disabled={applicant.status === 'interviewing' || applicant.status === 'hired'}
              onClick={() => onUpdateStatus(applicant.id, 'interviewing')} 
              className="flex-1 bg-white border-2 border-gray-100 text-gray-900 font-black py-4 rounded-2xl hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FaCheck /> Shortlist
            </button>
            <button 
              disabled={applicant.status === 'rejected' || applicant.status === 'hired'}
              onClick={() => onUpdateStatus(applicant.id, 'rejected')} 
              className="flex-1 bg-white text-rose-600 border-2 border-rose-100 font-black py-4 rounded-2xl hover:bg-rose-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FaUserSlash /> Pass
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}