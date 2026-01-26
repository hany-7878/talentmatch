import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import type { Profile } from '../../types';
import ProfileCard from './ProfileCard';
import { 
  FaUser, FaTools, FaSave, FaCheckCircle, FaCamera, 
  FaFilePdf, FaGlobe, FaEye, FaEdit, FaExternalLinkAlt 
} from 'react-icons/fa';

type ProfileFields = Pick<Profile, 'full_name' | 'bio' | 'website_url' | 'experience_level' | 'avatar_url' | 'resume_url'>;
interface ProfileForm extends ProfileFields {
  skills: string; 
}

export default function ProfileSettings() {
  const { profile, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  
  const [formData, setFormData] = useState<ProfileForm>({
    full_name: '',
    bio: '',
    skills: '',
    website_url: '',
    experience_level: 'Junior',
    avatar_url: '',
    resume_url: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        skills: profile.skills?.join(', ') || '',
        website_url: profile.website_url || '',
        experience_level: profile.experience_level || 'Junior',
        avatar_url: profile.avatar_url || '',
        resume_url: profile.resume_url || ''
      });
    }
  }, [profile]);

  const handleViewResume = async () => {
    if (!formData.resume_url) return;
    try {
      // Logic to extract path from the URL
      const path = formData.resume_url.split('/resumes/')[1];
      const { data, error } = await supabase.storage
        .from('resumes')
        .createSignedUrl(path, 3600);

      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (err) {
      alert("Could not open resume. It may have been moved.");
    }
  };

  const updateProfileData = async (data: Partial<Profile>) => {
    const { error } = await supabase.from('profiles').update(data).eq('id', profile?.id);
    if (error) throw error;
    if (refreshProfile) await refreshProfile();
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>, bucket: 'avatars' | 'resumes') => {
    const file = event.target.files?.[0];
    if (!file || !profile?.id) return;

    try {
      setUploading(true);
      const filePath = `${profile.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      const field = bucket === 'avatars' ? 'avatar_url' : 'resume_url';
      
      await updateProfileData({ [field]: data.publicUrl });
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfileData({
        full_name: formData.full_name,
        bio: formData.bio,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        website_url: formData.website_url,
        experience_level: formData.experience_level as any,
        updated_at: new Date().toISOString()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      {/* HEADER & TOGGLE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <header>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Account Settings</h2>
          <p className="text-gray-500">Manage your professional identity.</p>
        </header>
        
        <button 
          type="button"
          onClick={() => setIsPreview(!isPreview)}
          title={isPreview ? "Switch to edit mode" : "Preview your public profile"}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-2xl shadow-sm hover:bg-gray-50 text-gray-700 font-bold text-sm transition-all"
        >
          {isPreview ? <><FaEdit /> Edit Profile</> : <><FaEye /> Preview Mode</>}
        </button>
      </div>

      {isPreview ? (
        <div className="animate-in zoom-in-95 duration-300">
          <div className="mb-8 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-center">
            <p className="text-sm text-indigo-700 font-medium">Recruiter View Preview</p>
          </div>
          {profile && <ProfileCard profile={profile} />}
        </div>
      ) : (
        <>
          {/* AVATAR SECTION */}
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden shadow-inner">
                {formData.avatar_url ? (
                  <img src={formData.avatar_url} alt="Profile Avatar" className="w-full h-full object-cover" />
                ) : (
                  (formData.full_name && formData.full_name[0]) || 'U'
                )}
              </div>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="Change profile photo"
                className="absolute -bottom-2 -right-2 p-2 bg-white rounded-lg shadow-md border border-gray-100 text-blue-600 hover:scale-110 transition-transform"
              >
                <FaCamera className={uploading ? 'animate-spin' : ''} />
              </button>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => handleFileUpload(e, 'avatars')} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Profile Photo</h3>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">PNG or JPG</p>
            </div>
          </section>

          <form onSubmit={handleSave} className="space-y-6">
            {/* BASIC INFO */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-sm uppercase tracking-wider">
                <FaUser /> Basic Information
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="full_name" className="block text-xs font-bold text-gray-500 mb-1 uppercase">Full Name</label>
                  <input 
                    id="full_name"
                    type="text" 
                    placeholder="Enter your full name"
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.full_name || ''}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  />
                </div>
                <div>
                  <label htmlFor="bio" className="block text-xs font-bold text-gray-500 mb-1 uppercase">Professional Bio</label>
                  <textarea 
                    id="bio"
                    rows={4}
                    placeholder="Tell us about yourself"
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.bio || ''}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* CAREER EXPERTISE (SEEKER ONLY) */}
            {profile?.role === 'SEEKER' && (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                <div className="flex items-center gap-2 text-purple-600 font-bold text-sm uppercase tracking-wider">
                  <FaTools /> Career Expertise
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="experience_level" className="block text-xs font-bold text-gray-500 mb-1 uppercase">Experience Level</label>
                    <select 
                      id="experience_level"
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none"
                      value={formData.experience_level || 'Junior'}
                      onChange={(e) => setFormData({...formData, experience_level: e.target.value as any})}
                    >
                      <option value="Junior">Junior (0-2y)</option>
                      <option value="Intermediate">Mid-Level (3-5y)</option>
                      <option value="Senior">Senior (5y+)</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="portfolio_url" className="block text-xs font-bold text-gray-500 mb-1 uppercase">Portfolio Website</label>
                    <div className="relative">
                      <FaGlobe className="absolute left-4 top-5 text-gray-400" />
                      <input 
                        id="portfolio_url"
                        type="url" 
                        placeholder="https://yourportfolio.com"
                        className="w-full p-4 pl-12 bg-gray-50 border border-gray-200 rounded-2xl outline-none"
                        value={formData.website_url || ''}
                        onChange={(e) => setFormData({...formData, website_url: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* RESUME UPLOAD SECTION */}
                <div className="pt-4">
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Official Resume (PDF)</label>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                    <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                      <FaFilePdf size={24} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900">
                        {formData.resume_url ? "Resume Attached" : "No resume uploaded"}
                      </p>
                      <button 
                        type="button"
                        onClick={() => resumeInputRef.current?.click()}
                        className="text-xs text-blue-600 font-bold hover:underline"
                      >
                        {uploading ? "Uploading..." : "Click to upload new PDF"}
                      </button>
                      <input 
                        type="file" 
                        ref={resumeInputRef} 
                        hidden 
                        accept=".pdf" 
                        onChange={(e) => handleFileUpload(e, 'resumes')} 
                      />
                    </div>
                    {formData.resume_url && (
                      <button 
                        type="button"
                        onClick={handleViewResume}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 transition-all"
                      >
                        <FaExternalLinkAlt size={10} /> View
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading || uploading}
              className={`w-full py-4 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                success ? 'bg-green-500' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100'
              } disabled:opacity-50`}
            >
              {loading ? 'Processing...' : success ? <><FaCheckCircle /> Saved!</> : <><FaSave /> Save Changes</>}
            </button>
          </form>
        </>
      )}
    </div>
  );
}