import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import type { Profile } from '../../../types';
import ProfileCard from './ProfileCard';
import { 
  FaUser, FaTools, FaSave, FaCheckCircle, FaCamera, 
  FaFilePdf, FaGlobe, FaEye, FaEdit, FaExternalLinkAlt,
  FaLanguage, FaLayerGroup 
} from 'react-icons/fa';

// Updated interface to include languages
type ProfileFields = Pick<Profile, 'full_name' | 'bio' | 'website_url' | 'experience_level' | 'avatar_url' | 'resume_url'>;
interface ProfileForm extends ProfileFields {
  skills: string; 
  languages: string;
  email: string;
  phone: string;
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
    languages: '',
    website_url: '',
    experience_level: 'Junior',
    avatar_url: '',
    resume_url: '',
    email: '', 
  phone: ''
  });

 useEffect(() => {
  if (profile) {
    setFormData({
      full_name: profile.full_name || '',
      bio: profile.bio || '',
      skills: Array.isArray(profile.skills) ? profile.skills.join(', ') : '',
      languages: Array.isArray((profile as any).languages) ? (profile as any).languages.join(', ') : '',
      email: (profile as any).email || '', 
      phone: (profile as any).phone || '',
      website_url: profile.website_url || '',
      experience_level: profile.experience_level || 'Junior',
      avatar_url: profile.avatar_url || '',
      resume_url: profile.resume_url || '',
      company_name: (profile as any).company_name || '',
      job_title: (profile as any).job_title || '',
    });
  }
}, [profile]);

  const handleViewResume = async () => {
    if (!formData.resume_url) return;
    try {
      const path = formData.resume_url.split('/resumes/')[1];
      const { data, error } = await supabase.storage.from('resumes').createSignedUrl(path, 3600);
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
      email: formData.email, // Add this
      phone: formData.phone, // Add this
      skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
      languages: formData.languages.split(',').map(l => l.trim()).filter(Boolean) as any,
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
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <header>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Account Settings</h2>
          <p className="text-gray-500">Update your skills and professional details.</p>
        </header>
        
        <button 
          type="button"
          onClick={() => setIsPreview(!isPreview)}
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
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* PHOTO SECTION */}
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden shadow-inner border-4 border-gray-50">
                {formData.avatar_url ? (
                  <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  (formData.full_name && formData.full_name[0]) || 'U'
                )}
              </div>
              <button title='button'
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 rounded-lg shadow-lg text-white hover:scale-110 transition-transform"
              >
                <FaCamera size={14} className={uploading ? 'animate-spin' : ''} />
              </button>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => handleFileUpload(e, 'avatars')} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Profile Image</h3>
              <p className="text-xs text-gray-400 uppercase tracking-tighter">Click camera icon to upload</p>
            </div>
          </section>

          {/* BASIC INFO */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-sm uppercase tracking-wider">
              <FaUser /> Identification
            </div>
            {/* CONTACT DETAILS */}
<div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
  <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm uppercase tracking-wider">
    <FaGlobe /> Contact Channels
  </div>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Professional Email</label>
      <input 
        type="email" 
        placeholder="hello@example.com"
        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
      />
    </div>
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Phone Number</label>
      <input 
        type="tel" 
        placeholder="+1 (555) 000-0000"
        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
        value={formData.phone}
        onChange={(e) => setFormData({...formData, phone: e.target.value})}
      />
    </div>
  </div>
</div>
            <div className="grid gap-4">
              <input 
                type="text" 
                placeholder="Full Name"
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              />
              <textarea 
                rows={3}
                placeholder="Write a short, catchy professional bio..."
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
              />
            </div>
          </div>

          {/* CAREER EXPERTISE */}
          {profile?.role === 'SEEKER' && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
              <div className="flex items-center gap-2 text-purple-600 font-bold text-sm uppercase tracking-wider">
                <FaTools /> Career & Skills
              </div>
              
              <div className="space-y-4">
                {/* SKILLS AREA */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Technical Skills (Comma Separated)</label>
                  <div className="relative mt-1">
                    <FaLayerGroup className="absolute left-4 top-5 text-gray-300" />
                    <input 
                      type="text" 
                      placeholder="e.g. React, Python, Figma, AWS"
                      className="w-full p-4 pl-12 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none"
                      value={formData.skills}
                      onChange={(e) => setFormData({...formData, skills: e.target.value})}
                    />
                  </div>
                </div>

                {/* LANGUAGES AREA */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Languages</label>
                  <div className="relative mt-1">
                    <FaLanguage className="absolute left-4 top-5 text-gray-300" />
                    <input 
                      type="text" 
                      placeholder="e.g. English (Fluent), French (Native)"
                      className="w-full p-4 pl-12 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none"
                      value={formData.languages}
                      onChange={(e) => setFormData({...formData, languages: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <select title='se'
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none"
                    value={formData.experience_level}
                    onChange={(e) => setFormData({...formData, experience_level: e.target.value as any})}
                  >
                    <option value="Junior">Junior (0-2y)</option>
                    <option value="Intermediate">Mid-Level (3-5y)</option>
                    <option value="Senior">Senior (5y+)</option>
                  </select>
                  <div className="relative">
                    <FaGlobe className="absolute left-4 top-5 text-gray-300" />
                    <input 
                      type="url" 
                      placeholder="Portfolio URL"
                      className="w-full p-4 pl-12 bg-gray-50 border border-gray-100 rounded-2xl outline-none"
                      value={formData.website_url}
                      onChange={(e) => setFormData({...formData, website_url: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* RESUME */}
              <div className="p-4 bg-red-50/50 border border-red-100 rounded-2xl flex items-center gap-4 mt-4">
                <FaFilePdf className="text-red-500 text-2xl" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-700">{formData.resume_url ? "Resume Uploaded" : "No Resume Found"}</p>
                  <button type="button" onClick={() => resumeInputRef.current?.click()} className="text-[10px] text-blue-600 font-bold uppercase hover:underline">
                    {uploading ? "Uploading..." : "Replace File"}
                  </button>
                  <input type="file" ref={resumeInputRef} hidden accept=".pdf" onChange={(e) => handleFileUpload(e, 'resumes')} />
                </div>
                {formData.resume_url && (
                  <button title='rev' type="button" onClick={handleViewResume} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50">
                    <FaExternalLinkAlt size={12} className="text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading || uploading}
            className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all ${
              success ? 'bg-green-500' : 'bg-gray-900 hover:bg-black'
            } disabled:opacity-50`}
          >
            {loading ? 'Saving...' : success ? <><FaCheckCircle className="inline mr-2" /> Updated!</> : <><FaSave className="inline mr-2" /> Save All Changes</>}
          </button>
        </form>
      )}
    </div>
  );
}