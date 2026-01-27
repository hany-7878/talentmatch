import { FaGlobe, FaFilePdf, FaBriefcase, FaCode } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import type { Profile } from '../../types';

export default function ProfileCard({ profile }: { profile: Profile }) {
  const firstLetter = profile.full_name?.trim().charAt(0).toUpperCase() || '?';

  // Handle viewing resume directly from the card (useful for Recruiters/Previews)
  const handleViewResume = async () => {
    if (!profile.resume_url) return;
    try {
      // Logic to extract path from the URL
      const path = profile.resume_url.split('/resumes/')[1];
      const { data, error } = await supabase.storage
        .from('resumes')
        .createSignedUrl(path, 3600);

      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (err) {
      console.error("Error opening resume:", err);
      alert("Could not open resume.");
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Banner / Header */}
      <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-700" />
      
      <div className="px-6 pb-8">
        {/* Avatar Overlay */}
        <div className="relative -mt-12 mb-4">
          <div className="w-24 h-24 rounded-2xl border-4 border-white bg-white shadow-lg overflow-hidden mx-auto sm:mx-0 flex items-center justify-center">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.full_name || 'Profile'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-3xl font-bold text-blue-600">
                {firstLetter}
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="text-center sm:text-left">
          <h3 className="text-2xl font-black text-gray-900 leading-tight">
            {profile.full_name || 'Anonymous User'}
          </h3>
          <div className="mt-1 flex items-center justify-center sm:justify-start gap-2">
            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider rounded-md border border-blue-100">
              {profile.experience_level || 'Junior'}
            </span>
            <span className="text-gray-400 text-xs font-medium">• Professional</span>
          </div>
          
          <p className="mt-4 text-gray-600 text-sm leading-relaxed line-clamp-3">
            {profile.bio || 'No professional bio provided yet.'}
          </p>
        </div>

        {/* Skills Tags */}
        <div className="mt-6">
          <div className="flex items-center gap-2 text-gray-400 text-[10px] font-black uppercase tracking-widest mb-3">
            <FaCode /> Tech Stack
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.skills && profile.skills.length > 0 ? (
              profile.skills.map((skill) => (
                <span 
                  key={skill} 
                  className="px-3 py-1.5 bg-white text-gray-700 text-xs font-bold rounded-xl border border-gray-200 shadow-sm hover:border-indigo-200 transition-colors"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400 italic font-medium">No skills highlighted.</span>
            )}
          </div>
        </div>

        {/* Action Links */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center">
          {profile.website_url ? (
            <a 
              href={profile.website_url} 
              target="_blank" 
              rel="noreferrer" 
              className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-all"
            >
              <FaGlobe className="text-gray-400" /> Portfolio
            </a>
          ) : <div />}
          
          {profile.resume_url && (
            <button 
              onClick={handleViewResume}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 shadow-lg shadow-blue-100 transition-all active:scale-95"
            >
              <FaFilePdf /> View CV
            </button>
          )}
        </div>
      </div>
    </div>
  );
}