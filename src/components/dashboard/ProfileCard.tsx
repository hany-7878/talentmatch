import { FaGlobe, FaFilePdf, FaBriefcase } from 'react-icons/fa';
import type { Profile } from '../../types';

export default function ProfileCard({ profile }: { profile: Profile }) {
  // Logic to get the first letter of the name for the fallback
  const firstLetter = profile.full_name?.trim().charAt(0).toUpperCase() || '?';

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 max-w-md mx-auto">
      {/* Banner / Header */}
      <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-700" />
      
      <div className="px-6 pb-8">
        {/* Avatar Overlay */}
        <div className="relative -mt-12 mb-4">
          <div className="w-24 h-24 rounded-2xl border-4 border-white bg-white shadow-lg overflow-hidden mx-auto sm:mx-0 flex items-center justify-center">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={`${profile.full_name}'s profile`} 
                className="w-full h-full object-cover"
                // Optional: handle broken images by hiding them
                onError={(e) => (e.currentTarget.style.display = 'none')} 
              />
            ) : (
              // FALLBACK AVATAR: Shown if no avatar_url exists
              <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-3xl font-bold text-blue-600">
                {firstLetter}
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="text-center sm:text-left">
          <h3 className="text-xl font-bold text-gray-900">{profile.full_name || 'Anonymous User'}</h3>
          <p className="text-sm text-blue-600 font-medium flex items-center justify-center sm:justify-start gap-1">
            <FaBriefcase className="text-xs" /> {profile.experience_level} Professional
          </p>
          
          <p className="mt-4 text-gray-600 text-sm leading-relaxed italic">
            "{profile.bio || 'No bio provided yet.'}"
          </p>
        </div>

        {/* Skills Tags */}
        <div className="mt-6 flex flex-wrap gap-2">
          {profile.skills?.length ? (
            profile.skills.map((skill) => (
              <span key={skill} className="px-3 py-1 bg-gray-50 text-gray-600 text-xs font-semibold rounded-full border border-gray-100">
                {skill}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400">No skills listed</span>
          )}
        </div>

        {/* Action Links */}
        <div className="mt-8 pt-6 border-t border-gray-50 flex justify-between items-center">
          {profile.website_url ? (
            <a href={profile.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors">
              <FaGlobe /> Portfolio
            </a>
          ) : <div />}
          
          {profile.resume_url && (
            <button 
              onClick={() => {/* Trigger the handleViewResume function here */}}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 text-sm font-bold rounded-xl hover:bg-blue-100 transition-colors"
            >
              <FaFilePdf /> View CV
            </button>
          )}
        </div>
      </div>
    </div>
  );
}