import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import { 
  FaShieldAlt, FaBell, FaQuestionCircle, FaCommentAlt, 
  FaBug, FaExternalLinkAlt, FaTimes, FaLightbulb 
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function GeneralSettings() {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Feedback Form State
  const [feedback, setFeedback] = useState({ title: '', description: '' });

  const [settings, setSettings] = useState({
    email_notifications: true,
    push_notifications: false,
    ai_match_alerts: true,
    public_profile: true,
    two_factor: false
  });

 useEffect(() => {
  if (profile?.settings && typeof profile.settings === 'object') {
    setSettings(prev => ({ 
      ...prev, 
      ...(profile.settings as Record<string, any>) // 
    }));
  }
}, [profile]);

  const handleToggle = async (key: string) => {
  // 1. Guard Clause: Stop execution if user isn't logged in
  if (!user?.id) {
    toast.error("User session not found");
    return;
  }

  // 2. Optimistic Update: Update UI immediately for zero-lag feel
  const newSettings = { 
    ...settings, 
    [key]: !settings[key as keyof typeof settings] 
  };
  setSettings(newSettings); 
  
  setLoading(true);
  
  // 3. Database Sync
  const { error } = await supabase
    .from('profiles')
    .update({ settings: newSettings })
    .eq('id', user.id); // TS now knows user.id is a string because of the guard

  if (!error) {
    await refreshProfile();
    setMessage('Preferences updated live');
    setTimeout(() => setMessage(''), 3000);
  } else {
    // Rollback UI if the DB update fails
    setSettings(settings);
    toast.error("Failed to sync preferences");
  }
  
  setLoading(false);
};

  const submitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { error } = await supabase.from('feature_requests').insert([{
      user_id: user?.id,
      title: feedback.title,
      description: feedback.description,
      status: 'planned' // Useful for your investor demo
    }]);

    if (!error) {
      setMessage('Feature request sent!');
      setFeedback({ title: '', description: '' });
      setIsModalOpen(false);
      setTimeout(() => setMessage(''), 3000);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* Dynamic Status Header */}
      <div className="flex justify-between items-center mb-4 px-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">System Preferences</h2>
        {message && (
          <span className="text-[10px] bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full font-bold animate-bounce shadow-sm">
            {message}
          </span>
        )}
      </div>

      {/* Security Section */}
      <section className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm transition-all hover:shadow-md">
        <header className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl"><FaShieldAlt /></div>
          <div>
            <h3 className="text-lg font-black text-gray-900">Privacy & Access</h3>
            <p className="text-xs text-gray-500">Manage how your data is shared and secured.</p>
          </div>
        </header>

        <div className="space-y-2">
          <DynamicToggle 
            label="Public Discovery" 
            description="Allow your profile to be indexed in the talent search."
            active={settings.public_profile} 
            onToggle={() => handleToggle('public_profile')} 
          />
          <DynamicToggle 
            label="Two-Factor Auth" 
            description="Secure your account with an extra verification step."
            active={settings.two_factor} 
            onToggle={() => handleToggle('two_factor')} 
          />
        </div>
      </section>

      {/* Notifications Section */}
      <section className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm transition-all hover:shadow-md">
        <header className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl"><FaBell /></div>
          <div>
            <h3 className="text-lg font-black text-gray-900">Communications</h3>
            <p className="text-xs text-gray-500">Control when and how we reach out to you.</p>
          </div>
        </header>

        <div className="space-y-2">
          <DynamicToggle 
            label="Email Digest" 
            description="Receive daily summaries of your pipeline activity."
            active={settings.email_notifications} 
            onToggle={() => handleToggle('email_notifications')} 
          />
          <DynamicToggle 
            label="AI Match Alerts" 
            description="Get instant alerts when a 90%+ match is detected."
            active={settings.ai_match_alerts} 
            onToggle={() => handleToggle('ai_match_alerts')} 
          />
        </div>
      </section>

      {/* Support & Feedback Section */}
      <section className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm transition-all hover:shadow-md">
        <header className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl"><FaQuestionCircle /></div>
          <div>
            <h3 className="text-lg font-black text-gray-900">Support & Feedback</h3>
            <p className="text-xs text-gray-500">Need help or want to suggest an improvement?</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="#" className="flex items-center justify-between p-4 rounded-2xl border border-gray-50 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group">
            <div className="flex items-center gap-3">
              <FaQuestionCircle className="text-gray-400 group-hover:text-indigo-500" />
              <span className="text-sm font-bold text-gray-700">Documentation</span>
            </div>
            <FaExternalLinkAlt className="text-[10px] text-gray-300" />
          </a>

          <button onClick={() => alert('Bug report modal coming soon!')} className="flex items-center justify-between p-4 rounded-2xl border border-gray-50 hover:border-rose-100 hover:bg-rose-50/30 transition-all group text-left">
            <div className="flex items-center gap-3">
              <FaBug className="text-gray-400 group-hover:text-rose-500" />
              <span className="text-sm font-bold text-gray-700">Report a Bug</span>
            </div>
          </button>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="md:col-span-2 flex items-center justify-center gap-3 p-4 rounded-2xl bg-gray-900 text-white hover:bg-indigo-600 transition-all shadow-lg group"
          >
            <FaCommentAlt size={14} className="group-hover:animate-bounce" />
            <span className="text-sm font-bold">Request a Feature</span>
          </button>
        </div>
      </section>

      {/* FEATURE REQUEST MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white/20">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><FaLightbulb /></div>
                <h3 className="text-xl font-black text-gray-900">New Idea</h3>
              </div>
              <button title='close' onClick={() => setIsModalOpen(false)} className="text-gray-300 hover:text-rose-500 transition-colors">
                <FaTimes size={20} />
              </button>
            </div>

            <form onSubmit={submitFeedback} className="p-8 space-y-5">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Feature Title</label>
                <input 
                  required
                  className="w-full bg-gray-50 border-none p-4 rounded-2xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 mt-1"
                  placeholder="e.g. Dark Mode for ManagerView"
                  value={feedback.title}
                  onChange={(e) => setFeedback({...feedback, title: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Details</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full bg-gray-50 border-none p-4 rounded-2xl font-medium text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 mt-1"
                  placeholder="Tell us how this would help you..."
                  value={feedback.description}
                  onChange={(e) => setFeedback({...feedback, description: e.target.value})}
                />
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Sending to Roadmap...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Single, Shared DynamicToggle Component
function DynamicToggle({ label, description, active, onToggle }: any) {
  return (
    <div className="flex justify-between items-center p-4 rounded-2xl hover:bg-gray-50 transition-colors group">
      <div className="pr-4">
        <p className="text-sm font-bold text-gray-800">{label}</p>
        {description && <p className="text-[11px] text-gray-400 group-hover:text-gray-500">{description}</p>}
      </div>
      <button 
        title='toggle'
        onClick={onToggle}
        className={`relative w-14 h-7 rounded-full transition-all duration-300 ${active ? 'bg-indigo-600 shadow-lg shadow-indigo-200' : 'bg-gray-200'}`}
      >
        <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${active ? 'translate-x-7' : ''}`} />
      </button>
    </div>
  );
}