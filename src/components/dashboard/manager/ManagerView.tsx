import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient'; 
import { 
  FaPlus, FaUsers, FaBriefcase, FaChartLine, FaTimes, 
  FaSearch, FaDollarSign, FaMapMarkerAlt, FaFilter, FaCommentAlt,
  FaCheck, FaUserSlash, FaExternalLinkAlt, FaSpinner
} from 'react-icons/fa';
import ProfileCard from '../ProfileCard';
import JobManagement from './JobManagement'; 
import JobDetailView from '../JobDetailView';

export default function ManagerView({ initialView }: { initialView?: string }) {
  const [viewMode, setViewMode] = useState<string>('pipeline');
  const [applicants, setApplicants] = useState<any[]>([]);
  const [allSeekers, setAllSeekers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeJobsCount, setActiveJobsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null); 
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newJob, setNewJob] = useState({ 
    title: '', description: '', requirements: '', budget: '', 
    location_type: 'remote', category: 'Engineering', is_priority: false 
  });

  useEffect(() => {
    if (initialView) setViewMode(initialView);
  }, [initialView]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Seekers, Active Job Count, and Applications in parallel
      const [seekersRes, jobsRes, appsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'SEEKER'),
        supabase.from('projects').select('*', { count: 'exact' }).eq('manager_id', user.id).eq('status', 'open'),
        supabase.from('applications')
          .select(`
            *,
            profiles:applications_user_id_fkey (
              id, full_name, avatar_url, skills, bio, email
            ),
            projects:project_id (
              id, title, manager_id
            )
          `)
          .eq('projects.manager_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      if (appsRes.error) throw appsRes.error;
      if (seekersRes.error) throw seekersRes.error;

      // 2. Format Applications
      const formattedApps = appsRes.data?.map((app: any) => ({
        ...app,
        name: app.profiles?.full_name || 'Anonymous',
        role: app.projects?.title || 'Unknown Position',
        match: app.match_score || 0,
        project_id: app.project_id 
      })) || [];

      // 3. Update States
      setApplicants(formattedApps);
      setAllSeekers(seekersRes.data || []);
      setActiveJobsCount(jobsRes.count || 0);

    } catch (err: any) {
      console.error("Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateAppStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('applications').update({ status: newStatus }).eq('id', id);
    if (!error) {
      setApplicants(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
      setSelectedApplicant(null);
    }
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from('projects').insert([{
        manager_id: user.id,
        title: newJob.title,
        description: newJob.description,
        requirements: newJob.requirements.split(',').map(r => r.trim()).filter(Boolean),
        budget: newJob.budget,
        location_type: newJob.location_type,
        category: newJob.category,
        is_priority: newJob.is_priority,
        status: 'open'
      }]);

      if (error) throw error;

      setIsModalOpen(false);
      setNewJob({ title: '', description: '', requirements: '', budget: '', location_type: 'remote', category: 'Engineering', is_priority: false });
      fetchData(); 
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Search Filtering for Talent Pool ---
  const filteredSeekers = allSeekers.filter(s => 
    s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.skills?.some((sk: string) => sk.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (selectedJob) {
    const jobSpecificApplicants = applicants.filter(app => app.project_id === selectedJob.id);
    return (
      <JobDetailView 
        job={selectedJob} 
        userRole="MANAGER" 
        onBack={() => setSelectedJob(null)} 
        applicants={jobSpecificApplicants}
        onUpdateApplicantStatus={updateAppStatus}
        isApplied={false} 
      />
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 pb-20">
      {/* Header */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="space-y-1 text-center md:text-left">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Intelligence Dashboard</h2>
          <div className="flex gap-6 pt-4 justify-center md:justify-start">
            {['pipeline', 'management', 'discovery'].map((tab) => (
              <button key={tab} onClick={() => setViewMode(tab)}
                className={`text-xs font-black uppercase tracking-widest pb-2 transition-all border-b-4 ${viewMode === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-300 hover:text-gray-500'}`}>
                {tab === 'pipeline' ? 'Overview' : tab === 'management' ? 'Job Inventory' : 'Talent Pool'}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-2xl hover:bg-indigo-600 transition-all font-bold shadow-2xl shadow-indigo-200">
          <FaPlus /> <span>Post Opportunity</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
           <FaSpinner className="animate-spin text-4xl text-indigo-600" />
           <p className="font-black uppercase tracking-widest text-xs">Syncing Pipeline Data...</p>
        </div>
      ) : (
        <>
          {/* PIPELINE VIEW */}
          {viewMode === 'pipeline' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard label="Active Openings" value={activeJobsCount} icon={<FaBriefcase />} color="bg-indigo-600" />
                <StatCard label="Pipeline Depth" value={applicants.length} icon={<FaUsers />} color="bg-rose-500" />
                <StatCard label="Avg. Match Quality" value={`${applicants.length > 0 ? Math.round(applicants.reduce((a,c)=>a+(c.match_score||0),0)/(applicants.length)) : 0}%`} icon={<FaChartLine />} color="bg-amber-500" />
              </div>

              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><FaFilter /> Candidate Evaluation</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50/30">
                      <tr className="text-[10px] uppercase font-black text-gray-400 tracking-widest">
                        <th className="px-8 py-5 text-left">Talent</th>
                        <th className="px-8 py-5 text-left">The Pitch</th>
                        <th className="px-8 py-5 text-center">AI Fit</th>
                        <th className="px-8 py-5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {applicants.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-8 py-10 text-center text-gray-400 italic">No applications received yet.</td>
                        </tr>
                      ) : (
                        applicants.map(app => (
                          <tr key={app.id} className="hover:bg-indigo-50/30 transition-all group">
                            <td className="px-8 py-5 cursor-pointer" onClick={() => setSelectedApplicant(app)}>
                              <div className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">{app.name}</div>
                              <div className="text-[10px] text-gray-400 uppercase tracking-tighter">{app.role}</div>
                            </td>
                            <td className="px-8 py-5 max-w-xs text-xs italic text-gray-600">
                              <p className="line-clamp-2">{app.pitch}</p>
                            </td>
                            <td className="px-8 py-5 text-center">
                              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${app.match > 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                {app.match}% Match
                              </span>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <button onClick={() => setSelectedApplicant(app)} className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                                <FaExternalLinkAlt size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* JOB INVENTORY */}
          {viewMode === 'management' && <JobManagement onSelectJob={setSelectedJob} />}

          {/* TALENT POOL (DISCOVERY) */}
          {viewMode === 'discovery' && (
            <div className="space-y-6">
              <div className="relative max-w-md">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search skills or names..." 
                  className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredSeekers.length > 0 ? (
                  filteredSeekers.map(s => <ProfileCard key={s.id} profile={s} />)
                ) : (
                  <p className="col-span-full text-center py-10 text-gray-400">No matching talent found.</p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* MODALS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <form onSubmit={handlePostJob} className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
               <h3 className="text-2xl font-black text-gray-900">New Opportunity</h3>
               <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-rose-500 transition-colors"><FaTimes size={24}/></button>
             </div>
             <div className="p-8 grid grid-cols-2 gap-6">
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Job Title</label>
                  <input required value={newJob.title} onChange={e => setNewJob({...newJob, title: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-600 font-bold" placeholder="Senior React Developer" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Budget</label>
                  <input required value={newJob.budget} onChange={e => setNewJob({...newJob, budget: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-600 font-bold" placeholder="$100k - $140k" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Location</label>
                  <select value={newJob.location_type} onChange={e => setNewJob({...newJob, location_type: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-600 font-bold">
                    <option value="remote">Remote</option>
                    <option value="onsite">On-site</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Requirements (comma separated)</label>
                  <textarea required value={newJob.requirements} onChange={e => setNewJob({...newJob, requirements: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-600 font-bold h-24" placeholder="React, TypeScript, Tailwind..." />
                </div>
             </div>
             <div className="p-8 bg-gray-50">
               <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                 {isSubmitting ? 'Architecting...' : 'Broadcast Opportunity'}
               </button>
             </div>
          </form>
        </div>
      )}

      {selectedApplicant && (
        <div className="fixed inset-0 z-[150] flex justify-end">
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setSelectedApplicant(null)} />
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
            <div className="p-8 border-b sticky top-0 bg-white/80 backdrop-blur-md z-10 flex justify-between items-center">
              <h3 className="font-black text-xl text-gray-900">Review Candidate</h3>
              <button onClick={() => setSelectedApplicant(null)} className="p-2 hover:bg-rose-50 text-gray-400 hover:text-rose-500 rounded-full transition-all"><FaTimes size={20} /></button>
            </div>
            <div className="p-8 space-y-8">
              <div className="flex items-center gap-4">
                 <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-2xl font-black text-indigo-600 overflow-hidden">
                    {selectedApplicant.profiles?.avatar_url ? <img src={selectedApplicant.profiles.avatar_url} className="w-full h-full object-cover" /> : selectedApplicant.name.charAt(0)}
                 </div>
                 <div>
                    <h4 className="text-3xl font-black text-gray-900">{selectedApplicant.name}</h4>
                    <p className="text-indigo-600 font-bold text-sm uppercase tracking-widest">{selectedApplicant.role}</p>
                 </div>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem]">
                <p className="text-gray-800 font-medium italic text-sm">"{selectedApplicant.pitch}"</p>
              </div>
              <div className="pt-8 border-t flex gap-3">
                <button onClick={() => updateAppStatus(selectedApplicant.id, 'interviewing')} className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"><FaCheck /> Interview</button>
                <button onClick={() => updateAppStatus(selectedApplicant.id, 'rejected')} className="flex-1 bg-rose-50 text-rose-600 font-black py-4 rounded-2xl hover:bg-rose-100 transition-all flex items-center justify-center gap-2"><FaUserSlash /> Pass</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-6 group">
      <div className={`${color} w-16 h-16 rounded-[1.25rem] text-white flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>{icon}</div>
      <div>
        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-black text-gray-900">{value}</p>
      </div>
    </div>
  );
}