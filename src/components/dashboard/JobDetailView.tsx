/* --- JobDetailView.tsx --- */
import { useState, useEffect } from 'react';
import { 
  FaMapMarkerAlt, FaDollarSign, FaClock, FaArrowLeft, 
  FaBolt, FaEdit, FaCheckCircle, FaLock, FaTimesCircle, FaCommentAlt,
  FaUserCircle, FaEnvelope, FaPhone, FaGlobe, FaFilePdf, FaTimes, FaCheck, FaUserSlash
} from 'react-icons/fa';

interface JobDetailProps {
  job: any;
  userRole: 'MANAGER' | 'SEEKER';
  onBack: () => void;
  onApply?: (pitch: string) => Promise<void> | void; 
  onEdit?: (job: any) => void;
  onUpdateApplicantStatus?: (appId: string, newStatus: string) => Promise<void>;
  isApplied: boolean; 
  applicants?: any[]; // Passed from parent (e.g. applications table data)
}

export default function JobDetailView({ 
  job, userRole, onBack, onApply, onEdit, onUpdateApplicantStatus, isApplied, applicants = [] 
}: JobDetailProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [pitch, setPitch] = useState("");
  const [confirmMode, setConfirmMode] = useState<'NONE' | 'APPLY' | 'WITHDRAW'>('NONE');
  
  // State for the Slide-Over Drawer
  const [selectedApp, setSelectedApp] = useState<any | null>(null);

  const isManager = userRole === 'MANAGER';
  const isClosed = job.status === 'closed';
  const MAX_CHARS = 500;

  useEffect(() => {
    if (confirmMode !== 'NONE') {
      const timer = setTimeout(() => setConfirmMode('NONE'), 5000);
      return () => clearTimeout(timer);
    }
  }, [confirmMode]);

  const handleActionInternal = async () => {
    if (isClosed || isApplying) return;
    if (isApplied) {
      if (confirmMode !== 'WITHDRAW') { setConfirmMode('WITHDRAW'); return; }
      setIsApplying(true);
      try { await onApply?.(""); setConfirmMode('NONE'); } finally { setIsApplying(false); }
      return;
    }
    if (confirmMode !== 'APPLY') { setConfirmMode('APPLY'); return; }
    setIsApplying(true);
    try {
      if (onApply) { await onApply(pitch); setConfirmMode('NONE'); }
    } catch (error) { console.error(error); } finally { setIsApplying(false); }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right duration-300 bg-white min-h-screen relative">
      
      {/* --- MANAGER SLIDE-OVER DRAWER --- */}
      {isManager && selectedApp && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedApp(null)} />
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-black text-xl uppercase tracking-tight">Applicant Profile</h3>
              <button title='g' onClick={() => setSelectedApp(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><FaTimes /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-10">
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 bg-indigo-100 rounded-[2rem] flex items-center justify-center text-3xl font-black text-indigo-600 overflow-hidden shadow-inner">
                   {selectedApp.profiles?.avatar_url ? (
                     <img src={selectedApp.profiles.avatar_url} className="w-full h-full object-cover" alt="" />
                   ) : (
                     selectedApp.profiles?.full_name?.charAt(0) || <FaUserCircle />
                   )}
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-gray-900 leading-tight">
                    {selectedApp.profiles?.full_name || "Applicant"}
                  </h2>
                  <div className="flex flex-col gap-1 text-gray-500 font-bold text-sm">
                    <span className="flex items-center gap-2"><FaEnvelope className="text-indigo-500" /> {selectedApp.profiles?.email}</span>
                    <span className="flex items-center gap-2"><FaPhone className="text-indigo-500" /> {selectedApp.profiles?.phone || "No phone provided"}</span>
                    {selectedApp.profiles?.website && (
                      <span className="flex items-center gap-2"><FaGlobe className="text-indigo-500" /> {selectedApp.profiles.website}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-50 pt-8">
                <div>
                  <h4 className="text-[10px] font-black uppercase text-gray-400 mb-3">Professional Bio</h4>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                    {selectedApp.profiles?.bio || "No bio content provided."}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase text-gray-400 mb-3">Skills & Languages</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedApp.profiles?.skills?.length > 0 ? (
                      selectedApp.profiles.skills.map((s: string) => (
                        <span key={s} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold border border-gray-200">{s}</span>
                      ))
                    ) : (
                      <span className="text-gray-400 text-xs italic">Not specified</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100">
                <h4 className="text-indigo-900 font-black text-xs uppercase mb-3 flex items-center gap-2"><FaCommentAlt /> Application Pitch</h4>
                <p className="text-indigo-800 text-sm italic leading-relaxed">"{selectedApp.pitch || "No pitch provided."}"</p>
              </div>

              {selectedApp.profiles?.cv_url && (
                <a href={selectedApp.profiles.cv_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3 w-full py-5 bg-gray-900 text-white rounded-2xl font-black hover:bg-indigo-600 transition-all shadow-xl">
                  <FaFilePdf size={20} /> Review Resume / CV
                </a>
              )}
            </div>

            <div className="p-8 bg-gray-50 border-t border-gray-100 grid grid-cols-3 gap-3">
              <button onClick={() => { onUpdateApplicantStatus?.(selectedApp.id, 'rejected'); setSelectedApp(null); }} className="flex flex-col items-center gap-1 py-4 bg-white border border-gray-200 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-all">
                <FaUserSlash /> <span className="text-[10px] font-black uppercase">Reject</span>
              </button>
              <button onClick={() => { onUpdateApplicantStatus?.(selectedApp.id, 'interviewing'); setSelectedApp(null); }} className="flex flex-col items-center gap-1 py-4 bg-white border border-gray-200 rounded-2xl hover:bg-amber-50 hover:text-amber-600 transition-all">
                <FaBolt /> <span className="text-[10px] font-black uppercase">Interview</span>
              </button>
              <button onClick={() => { onUpdateApplicantStatus?.(selectedApp.id, 'hired'); setSelectedApp(null); }} className="flex flex-col items-center gap-1 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all">
                <FaCheck /> <span className="text-[10px] font-black uppercase">Hire</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 font-bold transition-all">
            <FaArrowLeft /> Exit Detail
          </button>
          
          <div className="flex gap-3">
            {isManager ? (
              <button onClick={() => onEdit?.(job)} className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center gap-2">
                <FaEdit /> Edit Post
              </button>
            ) : (
              <button 
                disabled={isClosed || isApplying}
                onClick={handleActionInternal}
                className={`px-8 py-2.5 rounded-xl font-black transition-all flex items-center gap-2 shadow-lg ${
                  confirmMode !== 'NONE' ? "bg-amber-500 text-white scale-105" : isApplied ? "bg-rose-50 text-rose-600 shadow-none hover:bg-rose-100 border border-rose-100" : isClosed ? "bg-gray-200 text-gray-500 cursor-not-allowed shadow-none" : "bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700"
                } ${isApplying ? "opacity-70 cursor-wait" : ""}`}
              >
                {isApplying ? "Processing..." : confirmMode === 'APPLY' ? "Confirm Application?" : confirmMode === 'WITHDRAW' ? "Confirm Withdrawal?" : isApplied ? <><FaTimesCircle /> Withdraw</> : isClosed ? <><FaLock /> Closed</> : <><FaBolt /> Quick Apply</>}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-8">
          
          {/* MANAGER: APPLICANT GRID */}
          {isManager && (
            <section className="animate-in fade-in duration-700">
               <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <FaUserCircle className="text-indigo-600" /> Talent Review Pipeline ({applicants.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {applicants.map((app) => (
                  <div key={app.id} onClick={() => setSelectedApp(app)} className="bg-white border border-gray-100 p-5 rounded-[2rem] flex items-center gap-4 cursor-pointer hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-50/40 transition-all group">
                    <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center font-black text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all overflow-hidden">
                       {app.profiles?.avatar_url ? (
                         <img src={app.profiles.avatar_url} className="w-full h-full object-cover" alt="" />
                       ) : (
                         app.profiles?.full_name?.charAt(0) || "U"
                       )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-gray-900">{app.profiles?.full_name || "Candidate"}</h4>
                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{app.status || 'pending'}</p>
                    </div>
                  </div>
                ))}
              </div>
              {applicants.length === 0 && <p className="text-gray-400 font-medium italic p-8 border-2 border-dashed border-gray-50 rounded-[2rem] text-center">No candidates have applied yet.</p>}
              <hr className="border-gray-50 mt-12" />
            </section>
          )}

          <div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight leading-tight">{job.title}</h1>
            <div className="flex flex-wrap gap-3 text-sm font-bold">
              <span className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg flex items-center gap-2"><FaMapMarkerAlt /> {job.location_type || job.location}</span>
              <span className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg flex items-center gap-2"><FaDollarSign /> {job.budget || "Competitive"}</span>
              <span className="px-4 py-2 bg-amber-50 text-amber-700 rounded-lg flex items-center gap-2"><FaClock /> Full-time</span>
            </div>
          </div>

          {!isManager && !isApplied && !isClosed && (
            <div className="bg-indigo-50/50 p-6 rounded-[2.5rem] border border-indigo-100 space-y-4 animate-in slide-in-from-top-4 duration-500">
              <div className="flex justify-between items-center">
                <h3 className="text-indigo-900 font-black text-sm uppercase tracking-wider flex items-center gap-2">
                  <FaCommentAlt /> Personal Pitch
                </h3>
                <span className={`text-[10px] font-bold ${pitch.length >= MAX_CHARS ? 'text-rose-500' : 'text-indigo-400'}`}>
                  {pitch.length} / {MAX_CHARS}
                </span>
              </div>
              <textarea 
                value={pitch} onChange={(e) => setPitch(e.target.value)}
                placeholder="Tell the manager why you're a perfect match..."
                className="w-full p-5 rounded-[1.5rem] border-none focus:ring-2 focus:ring-indigo-600 outline-none text-gray-700 font-medium bg-white shadow-sm min-h-[120px] transition-all"
                maxLength={MAX_CHARS}
              />
            </div>
          )}

          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900">Description</h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line text-lg">{job.description}</p>
            
            <h3 className="text-2xl font-bold text-gray-900 mt-10 mb-4">Core Requirements</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {job.requirements?.map((req: string, i: number) => (
                <div key={i} className="flex items-start gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="mt-1.5 w-2 h-2 bg-indigo-500 rounded-full shrink-0" />
                  <span className="text-gray-700 font-medium">{req}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className={`rounded-[2.5rem] p-8 text-white transition-colors duration-500 ${isClosed ? 'bg-gray-400' : (isApplied && !isManager) ? 'bg-emerald-600' : 'bg-gray-900 shadow-2xl shadow-gray-200'}`}>
            <h3 className="font-bold text-xl mb-4">
              {isManager ? "Post Management" : isClosed ? "Listing Expired" : isApplied ? "Application Sent!" : "Application Tips"}
            </h3>
            <p className="text-white/80 mb-6 leading-relaxed text-sm">
              {isManager 
                ? "Click on any applicant card to view their full background, contact details, and technical skills."
                : isClosed 
                ? "This opportunity is no longer accepting new applicants."
                : isApplied 
                ? "Your profile and pitch have been shared. An email confirmation has been sent to your inbox."
                : "Managers love to see specific examples of your work. Keep your pitch concise and results-oriented."}
            </p>
            {isApplied && !isManager && (
              <div className="p-4 bg-white/20 rounded-2xl flex items-center gap-3 font-bold text-sm animate-pulse">
                <FaCheckCircle /> Status: Applied
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}