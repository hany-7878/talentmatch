import { 
  FaGlobe, FaFilePdf, FaPaperPlane, FaCheckCircle, 
  FaEnvelope, FaPhone, FaLanguage, FaTimesCircle, FaHourglassHalf, FaBuilding
} from 'react-icons/fa';
import { supabase } from '../../../lib/supabaseClient';
import type { Profile } from '../../../types';
import toast from 'react-hot-toast';

interface ProfileCardProps {
  profile: Profile;
  onInvite?: (profile: Profile) => void;
  isInvited?: boolean;
  handshakeStatus?: 'pending' | 'accepted' | 'declined' | null;
}

export default function ProfileCard({ profile, onInvite, isInvited, handshakeStatus }: ProfileCardProps) {
  if (!profile) return null;

  const isManager = profile.role === 'MANAGER' || (profile as any).role === 'manager';
  const firstLetter = profile.full_name?.trim().charAt(0).toUpperCase() || 'U';


  const skills = Array.isArray(profile.skills) ? profile.skills : [];
  
 
  const languages = Array.isArray(profile.languages) 
    ? profile.languages 
    : typeof profile.languages === 'string' 
      ? profile.languages.split(',').map(l => l.trim()) 
      : [];

  const handleViewResume = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profile.resume_url) return;
    
    try {
      const urlParts = profile.resume_url.split('resumes/');
      const path = urlParts[urlParts.length - 1]; 
      
      if (!path) throw new Error("Path extraction failed");
      
      const { data, error } = await supabase.storage
        .from('resumes')
        .createSignedUrl(path, 3600);

      if (error) throw error;
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error("Storage Error:", err);
      toast.error("Resume link expired or unavailable.");
    }
  };

  const getStatusStyles = () => {
    if (handshakeStatus === 'accepted' || (isInvited && handshakeStatus === null)) return 'from-emerald-500 to-teal-600';
    if (handshakeStatus === 'declined') return 'from-rose-500 to-red-600';
    if (handshakeStatus === 'pending') return 'from-amber-400 to-orange-500';
    
    return isManager ? 'from-slate-700 to-slate-900' : 'from-indigo-600 to-blue-700';
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100 max-w-md mx-auto transition-all hover:shadow-2xl duration-300">
      {/* Banner */}
      <div className={`h-28 bg-gradient-to-br transition-colors duration-500 ${getStatusStyles()}`} />
      
      <div className="px-8 pb-8">
        {/* Avatar Section */}
        <div className="relative -mt-12 mb-6">
          <div className="w-24 h-24 rounded-3xl border-4 border-white bg-white shadow-2xl overflow-hidden flex items-center justify-center">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={`${profile.full_name}`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-50 flex items-center justify-center text-3xl font-black text-indigo-200">
                {firstLetter}
              </div>
            )}
          </div>
          
          {/* Status Badge */}
          {(isInvited || handshakeStatus) && (
            <div className={`absolute top-0 left-20 text-white p-2 rounded-full border-4 border-white shadow-lg animate-bounce ${
              (handshakeStatus === 'accepted' || (isInvited && !handshakeStatus)) ? 'bg-emerald-500' : 
              handshakeStatus === 'declined' ? 'bg-rose-500' : 'bg-amber-500'
            }`}>
              {(handshakeStatus === 'accepted' || (isInvited && !handshakeStatus)) && <FaCheckCircle size={14} />}
              {handshakeStatus === 'declined' && <FaTimesCircle size={14} />}
              {handshakeStatus === 'pending' && <FaHourglassHalf size={14} />}
            </div>
          )}
        </div>

        {/* Header Info */}
        <div className="space-y-4">
          <div>
            <h3 className="text-3xl font-black text-gray-900 tracking-tighter leading-none">
              {profile.full_name || 'Anonymous'}
            </h3>
            
            {/* Display Role Details */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">
                {isManager ? 'Company Partner' : (profile.experience_level || 'Professional')}
              </span>
              {isManager && profile.company_name && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase">
                  <FaBuilding size={10} /> {profile.company_name}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1 border-y border-gray-50 py-3">
            {profile.email && (
              <div className="flex items-center gap-1.5 text-gray-500 text-[11px] font-bold">
                <FaEnvelope className="text-indigo-400" /> {profile.email}
              </div>
            )}
            {profile.phone && (
              <div className="flex items-center gap-1.5 text-gray-500 text-[11px] font-bold">
                <FaPhone className="text-emerald-400" /> {profile.phone}
              </div>
            )}
            {languages.length > 0 && (
              <div className="flex items-center gap-1.5 text-gray-500 text-[11px] font-bold">
                <FaLanguage className="text-amber-400 text-sm" /> 
                <span className="uppercase">{languages.join(' • ')}</span>
              </div>
            )}
          </div>
          
          <p className="text-gray-600 text-sm leading-relaxed italic line-clamp-3">
            "{profile.bio || 'Ready for new professional opportunities.'}"
          </p>
        </div>

        {/* Tech Stack */}
        {!isManager && skills.length > 0 && (
          <div className="mt-6">
            <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest mb-3">Core Expertise</p>
            <div className="flex flex-wrap gap-2">
              {skills.slice(0, 8).map((skill) => (
                <span key={skill} className="px-3 py-1.5 bg-slate-50 text-slate-700 text-[10px] font-black rounded-xl border border-slate-100 hover:border-indigo-200 transition-all">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center">
          {profile.website_url ? (
            <a 
              href={profile.website_url} 
              target="_blank" 
              rel="noreferrer" 
              className="group flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-indigo-600 transition-colors"
            >
              <FaGlobe className="group-hover:animate-spin" /> Portfolio
            </a>
          ) : <div />}

          <div className="flex gap-3">
            {!isManager && onInvite && (
              <button 
                onClick={(e) => { e.stopPropagation(); onInvite(profile); }}
                disabled={isInvited || !!handshakeStatus}
                className={`flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 ${
                  (handshakeStatus === 'accepted' || (isInvited && !handshakeStatus))
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                    : handshakeStatus === 'pending'
                    ? 'bg-amber-50 text-amber-600 border border-amber-200 cursor-not-allowed' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {(handshakeStatus === 'accepted' || (isInvited && !handshakeStatus)) ? (
                  <><FaCheckCircle /> Accepted</>
                ) : handshakeStatus === 'pending' ? (
                  'Pending'
                ) : (
                  <><FaPaperPlane /> Invite</>
                )}
              </button>
            )}

            {!isManager && profile.resume_url && (
              <button aria-label="View Resume" title="View Resume"
                onClick={handleViewResume} 
                className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-rose-600 transition-all shadow-lg active:scale-95"
              >
                <FaFilePdf size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}