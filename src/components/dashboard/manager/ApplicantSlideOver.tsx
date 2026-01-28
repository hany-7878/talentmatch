import { FaTimes, FaCheck, FaUserSlash, FaCommentAlt } from 'react-icons/fa';

interface ApplicantSlideOverProps {
  applicant: any | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => void;
}

export default function ApplicantSlideOver({ applicant, onClose, onUpdateStatus }: ApplicantSlideOverProps) {
  // If no applicant is selected, don't render anything
  if (!applicant) return null;

  return (
    <div className="fixed inset-0 z-[150] flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" 
        onClick={onClose} 
      />

      {/* Slide-over Content */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
        
        {/* Header */}
        <div className="p-8 border-b sticky top-0 bg-white/80 backdrop-blur-md z-10 flex justify-between items-center">
          <div>
            <h3 className="font-black text-xl text-gray-900">Review Candidate</h3>
            <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
              applicant.status === 'interviewing' ? 'bg-indigo-100 text-indigo-700' :
              applicant.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-600'
            }`}>
              Status: {applicant.status || 'Pending'}
            </span>
          </div>
          <button title='edit' 
            onClick={onClose} 
            className="p-2 hover:bg-rose-50 text-gray-400 hover:text-rose-500 rounded-full transition-all"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-8 flex-1 overflow-y-auto">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center text-2xl font-black text-indigo-600 overflow-hidden shadow-inner">
              {applicant.profiles?.avatar_url ? (
                <img src={applicant.profiles.avatar_url} className="w-full h-full object-cover" alt="" />
              ) : (
                applicant.name.charAt(0)
              )}
            </div>
            <div>
              <h4 className="text-2xl font-black text-gray-900 leading-tight">{applicant.name}</h4>
              <p className="text-indigo-600 font-bold text-xs uppercase tracking-widest">{applicant.role}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
              <FaCommentAlt /> Application Pitch
            </h5>
            <div className="bg-amber-50/50 border border-amber-100 p-6 rounded-[2rem] italic text-sm text-gray-800">
              "{applicant.pitch || 'No pitch provided.'}"
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Technical Arsenal</h5>
            <div className="flex flex-wrap gap-2">
              {applicant.profiles?.skills?.map((skill: string, i: number) => (
                <span key={`${skill}-${i}`} className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-xl text-[11px] font-bold border border-gray-100">
                  {skill}
                </span>
              )) || <p className="text-xs text-gray-400 italic">No skills listed</p>}
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-8 bg-gray-50 border-t flex gap-4">
          <button 
            disabled={applicant.status === 'interviewing'}
            onClick={() => onUpdateStatus(applicant.id, 'interviewing')} 
            className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <FaCheck /> {applicant.status === 'interviewing' ? 'Shortlisted' : 'Interview'}
          </button>
          <button 
            disabled={applicant.status === 'rejected'}
            onClick={() => onUpdateStatus(applicant.id, 'rejected')} 
            className="flex-1 bg-white text-rose-600 border-2 border-rose-100 font-black py-4 rounded-2xl hover:bg-rose-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <FaUserSlash /> Pass
          </button>
        </div>
      </div>
    </div>
  );
}