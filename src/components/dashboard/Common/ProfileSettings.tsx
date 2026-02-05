import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import type { Profile } from '../../../types';
import ProfileCard from './ProfileCard';
import { 
  FaUser, FaTools, FaCheckCircle, FaCamera, 
  FaFilePdf, FaGlobe, FaEye, FaEdit, FaExternalLinkAlt,
  FaLanguage, FaLayerGroup, FaBuilding
} from 'react-icons/fa';

interface ProfileForm {
  full_name: string;
  bio: string;
  skills: string; 
  languages: string;
  email: string;
  phone: string;
  website_url: string;
  experience_level: string;
  avatar_url: string;
  resume_url: string;
  company_name: string;
}

export default function ProfileSettings() {
  const { profile, refreshProfile } = useAuth();
  
  // --- Refs ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  
  // --- UI State ---
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  
  // --- Form State ---
  const [formData, setFormData] = useState<ProfileForm>({
    full_name: '', bio: '', skills: '', languages: '',
    website_url: '', experience_level: 'Junior', avatar_url: '',
    resume_url: '', email: '', phone: '', company_name: '',
  });

  /**
   * 1. SYNC LOGIC
   * Maps the profile object from AuthContext to the local form state.
   * Defensive: Watches profile?.id to ensure we only sync when data actually exists.
   */
  useEffect(() => {
    if (!profile?.id) return;

    const formatList = (val: any): string => {
      if (Array.isArray(val)) return val.join(', ');
      return typeof val === 'string' ? val : '';
    };

    setFormData({
      full_name: profile.full_name || '',
      bio: profile.bio || '',
      skills: formatList(profile.skills),
      languages: formatList(profile.languages),
      email: profile.email || '', 
      phone: profile.phone || '',
      website_url: profile.website_url || '',
      experience_level: profile.experience_level || 'Junior',
      avatar_url: profile.avatar_url || '',
      resume_url: profile.resume_url || '',
      company_name: profile.company_name || '',
    });
  }, [profile?.id]); // Senior Note: Only trigger on ID change to avoid infinite loops

  /**
   * 2. DATA PERSISTENCE (INTERNAL HELPER)
   * The "Engine" for updating the database.
   */
  const performUpdate = async (updatePayload: Partial<Profile>) => {
    if (!profile?.id) {
      throw new Error("Session expired or profile ID missing. Please refresh.");
    }

    const { error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', profile.id);

    if (error) throw error;
    if (refreshProfile) await refreshProfile();
  };

  /**
   * 3. HANDLERS
   */
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Build and Sanitize Payload
      const payload: any = {
        full_name: formData.full_name.trim(),
        bio: formData.bio.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        company_name: formData.company_name.trim(),
        website_url: formData.website_url.trim(),
        experience_level: formData.experience_level,
        updated_at: new Date().toISOString(),
        // Convert strings back to Arrays for the DB
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        languages: formData.languages.split(',').map(l => l.trim()).filter(Boolean)
      };

      await performUpdate(payload);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error("[ProfileSettings] Save Failed:", error);
      alert(error.message || "An error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>, bucket: 'avatars' | 'resumes') => {
    const file = event.target.files?.[0];
    if (!file || !profile?.id) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      
      const updateField = bucket === 'avatars' ? 'avatar_url' : 'resume_url';
      await performUpdate({ [updateField]: data.publicUrl });
      
    } catch (error: any) {
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
      if (event.target) event.target.value = ''; // Reset input
    }
  };

  const handleViewResume = async () => {
    if (!formData.resume_url) return;
    try {
      // Extracts the relative path from the public URL
      const path = formData.resume_url.split(`/${'resumes'}/`)[1];
      const { data, error } = await supabase.storage.from('resumes').createSignedUrl(path, 60);
      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (err) {
      alert("Unable to generate secure link for resume.");
    }
  };

  /**
   * 4. MASTER GUARD
   * If the profile isn't loaded, we stop the render. 
   * This prevents the "undefined" API call entirely.
   */
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium animate-pulse">Loading secure profile...</p>
      </div>
    );
  }

  // --- RENDER ---
  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <header>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Account Settings</h2>
          <p className="text-gray-500">Manage your professional identity.</p>
        </header>
        <button 
          type="button"
          onClick={() => setIsPreview(!isPreview)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:bg-gray-50 text-gray-700 font-bold text-sm transition-all active:scale-95"
        >
          {isPreview ? <><FaEdit className="text-indigo-500" /> Edit Profile</> : <><FaEye className="text-indigo-500" /> Preview Mode</>}
        </button>
      </div>

      {isPreview ? (
        <div className="animate-in zoom-in-95 duration-300">
           <ProfileCard profile={profile} />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* PHOTO SECTION */}
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden border-4 border-white shadow-lg">
                {formData.avatar_url ? (
                  <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                ) : (
                  formData.full_name?.charAt(0) || 'U'
                )}
              </div>
              <button title='sd'
                type="button" 
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()} 
                className="absolute -bottom-2 -right-2 p-2.5 bg-indigo-600 rounded-xl shadow-lg text-white hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
              >
                <FaCamera size={14} className={uploading ? 'animate-spin' : ''} />
              </button>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => handleFileUpload(e, 'avatars')} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Profile Image</h3>
              <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Recommended: Square JPG/PNG</p>
            </div>
          </section>

          {/* BASIC INFO */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-sm uppercase tracking-wider">
              <FaUser /> Identification
            </div>
            <div className="grid gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 ml-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. John Doe"
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 ml-1">Professional Bio</label>
                <textarea 
                  rows={3}
                  placeholder="Tell us about your background..."
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* MANAGER FIELDS */}
          {(profile?.role?.toUpperCase() === 'MANAGER') && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6 animate-in slide-in-from-left-4">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-wider">
                <FaBuilding /> Work Details
              </div>
              <div className="relative">
                <FaBuilding className="absolute left-4 top-5 text-gray-300" />
                <input 
                  type="text" 
                  placeholder="Company Name"
                  className="w-full p-4 pl-12 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={formData.company_name}
                  onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                />
              </div>
            </div>
          )}

          {/* CONTACT SECTION */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm uppercase tracking-wider">
              <FaGlobe /> Contact & Links
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="email" 
                placeholder="Email Address"
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              <input 
                type="tel" 
                placeholder="Phone Number"
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <input 
              type="url" 
              placeholder="Portfolio/Website URL (https://...)"
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              value={formData.website_url}
              onChange={(e) => setFormData({...formData, website_url: e.target.value})}
            />
          </div>

          {/* SEEKER FIELDS */}
          {(profile?.role?.toUpperCase() === 'SEEKER') && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6 animate-in slide-in-from-right-4">
              <div className="flex items-center gap-2 text-purple-600 font-bold text-sm uppercase tracking-wider">
                <FaTools /> Career & Skills
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <FaLayerGroup className="absolute left-4 top-5 text-gray-300" />
                  <input 
                    type="text" 
                    placeholder="Skills (comma separated: React, Python, etc.)"
                    className="w-full p-4 pl-12 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    value={formData.skills}
                    onChange={(e) => setFormData({...formData, skills: e.target.value})}
                  />
                </div>
                <div className="relative">
                  <FaLanguage className="absolute left-4 top-5 text-gray-300" />
                  <input 
                    type="text" 
                    placeholder="Languages (comma separated: English, French)"
                    className="w-full p-4 pl-12 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    value={formData.languages}
                    onChange={(e) => setFormData({...formData, languages: e.target.value})}
                  />
                </div>
                <select title='s' 
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 transition-all appearance-none cursor-pointer"
                  value={formData.experience_level}
                  onChange={(e) => setFormData({...formData, experience_level: e.target.value})}
                >
                  <option value="Junior">Junior (0-2y)</option>
                  <option value="Intermediate">Mid-Level (3-5y)</option>
                  <option value="Senior">Senior (5y+)</option>
                </select>
              </div>

              {/* RESUME UPLOAD */}
              <div className="p-6 bg-red-50/30 border border-red-100 rounded-3xl flex items-center gap-4 transition-all hover:bg-red-50/50">
                <div className="p-3 bg-red-100 rounded-2xl">
                  <FaFilePdf className="text-red-500 text-2xl" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800">{formData.resume_url ? "Curriculum Vitae Attached" : "No Resume Uploaded"}</p>
                  <button 
                    type="button" 
                    onClick={() => resumeInputRef.current?.click()} 
                    className="text-xs text-blue-600 font-bold uppercase tracking-tight hover:underline"
                  >
                    {uploading ? "Uploading..." : formData.resume_url ? "Replace PDF" : "Upload PDF"}
                  </button>
                  <input type="file" ref={resumeInputRef} hidden accept=".pdf" onChange={(e) => handleFileUpload(e, 'resumes')} />
                </div>
                {formData.resume_url && (
                  <button title='sa' 
                    type="button" 
                    onClick={handleViewResume} 
                    className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 hover:text-blue-600 transition-colors"
                  >
                    <FaExternalLinkAlt size={14} />
                  </button>
                )}
              </div>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading || uploading}
            className={`w-full py-5 rounded-2xl font-bold text-white shadow-xl transition-all active:scale-[0.98] ${
              success ? 'bg-green-500 scale-[1.02]' : 'bg-gray-900 hover:bg-black hover:shadow-2xl'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving Changes...
              </span>
            ) : success ? (
              <span className="flex items-center justify-center gap-2">
                <FaCheckCircle /> Profile Updated!
              </span>
            ) : (
              'Save All Changes'
            )}
          </button>
        </form>
      )}
    </div>
  );
}