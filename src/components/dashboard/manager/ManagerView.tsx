import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient'; 
import { 
  FaPlus, FaUsers, FaBriefcase, FaChartLine, FaTimes, 
  FaSearch, FaDollarSign, FaMapMarkerAlt, FaFilter
} from 'react-icons/fa';
import ProfileCard from '../ProfileCard';
import JobManagement from './JobManagement'; 
import JobDetailView from '../JobDetailView'; // Imported Common Detail View

const CATEGORIES = ['Engineering', 'Design', 'Marketing', 'Product', 'Sales'];

export default function ManagerView({ initialView }: { initialView?: string }) {
  const [viewMode, setViewMode] = useState<string>('pipeline');
  const [applicants, setApplicants] = useState<any[]>([]);
  const [allSeekers, setAllSeekers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeJobsCount, setActiveJobsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // DETAIL STATE: When this is not null, the Detail Page is shown
  const [selectedJob, setSelectedJob] = useState<any | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newJob, setNewJob] = useState({ 
    title: '', 
    description: '', 
    requirements: '', 
    budget: '', 
    location_type: 'remote',
    category: 'Engineering',
    is_priority: false 
  });

  useEffect(() => {
    if (initialView) {
      setViewMode(initialView);
    }
  }, [initialView]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetching applications + nested project data for the Detail View
      const { data: apps, error: appsErr } = await supabase
        .from('applications')
        .select(`
          id, status, match_score, 
          profiles (id, full_name, avatar_url, skills, bio), 
          projects (*)
        `)
        .order('match_score', { ascending: false });

      if (appsErr) throw appsErr;

      const { data: seekers, error: seekersErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'SEEKER');

      if (seekersErr) throw seekersErr;

      const { count } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      setApplicants(apps?.map((app: any) => ({
        id: app.id,
        name: app.profiles?.full_name || 'Anonymous',
        avatar: app.profiles?.avatar_url,
        role: app.projects?.title,
        match: app.match_score || 0,
        status: app.status,
        budget: app.projects?.budget,
        location: app.projects?.location_type,
        fullJobData: app.projects // Storing the full object for the Detail View
      })) || []);

      setAllSeekers(seekers || []);
      setActiveJobsCount(count || 0);
    } catch (err: any) {
      console.error("Management API Error:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // UI GUARD: If a manager clicks a job, intercept the render and show the JobDetailView
  if (selectedJob) {
    return (
      <JobDetailView 
        job={selectedJob} 
        userRole="MANAGER" 
        onBack={() => setSelectedJob(null)}
        onEdit={(job) => {
          // You can connect this to your edit modal logic
          console.log("Edit requested for:", job.title);
        }}
      />
    );
  }

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('projects').insert([{
      manager_id: user.id,
      title: newJob.title,
      description: newJob.description,
      requirements: newJob.requirements.split(',').map(r => r.trim()),
      budget: newJob.budget,
      location_type: newJob.location_type,
      category: newJob.category,
      is_priority: newJob.is_priority,
      status: 'open'
    }]);

    if (!error) {
      setIsModalOpen(false);
      setNewJob({ title: '', description: '', requirements: '', budget: '', location_type: 'remote', category: 'Engineering', is_priority: false });
      fetchData(); 
    }
    setIsSubmitting(false);
  };

  const filteredSeekers = allSeekers.filter(s => 
    s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.skills?.some((sk: string) => sk.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 animate-pulse">
      <div className="w-16 h-16 border-4 border-t-indigo-600 border-gray-200 rounded-full animate-spin mb-4"></div>
      <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Syncing Enterprise Data</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 pb-20">
      {/* Header / Sub-Nav */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="space-y-1 text-center md:text-left">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Intelligence Dashboard</h2>
          <div className="flex gap-6 pt-4 justify-center md:justify-start">
            {[
              { id: 'pipeline', label: 'Overview' },
              { id: 'management', label: 'Job Inventory' }, 
              { id: 'discovery', label: 'Talent Pool' }
            ].map((tab) => (
              <button key={tab.id} onClick={() => setViewMode(tab.id)}
                className={`text-xs font-black uppercase tracking-widest pb-2 transition-all border-b-4 ${viewMode === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-300 hover:text-gray-500'}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        <button onClick={() => setIsModalOpen(true)}
          className="group relative flex items-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-2xl hover:bg-indigo-600 transition-all duration-300 font-bold shadow-2xl shadow-indigo-200">
          <FaPlus className="group-hover:rotate-90 transition-transform" /> 
          <span>Post Opportunity</span>
        </button>
      </div>

      {/* VIEW: PIPELINE (Overview) */}
      {viewMode === 'pipeline' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard label="Active Openings" value={activeJobsCount} icon={<FaBriefcase />} color="bg-indigo-600" />
            <StatCard label="Pipeline Depth" value={applicants.length} icon={<FaUsers />} color="bg-rose-500" />
            <StatCard label="Avg. Match Quality" value={`${Math.round(applicants.reduce((a,c)=>a+c.match,0)/(applicants.length||1))}%`} icon={<FaChartLine />} color="bg-amber-500" />
          </div>

          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FaFilter className="text-gray-400 text-sm" /> Candidate Evaluation
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/30">
                  <tr className="text-[10px] uppercase font-black text-gray-400 tracking-widest">
                    <th className="px-8 py-5 text-left">Talent</th>
                    <th className="px-8 py-5 text-left">Projected Role</th>
                    <th className="px-8 py-5 text-center">Budget Range</th>
                    <th className="px-8 py-5 text-center">AI Fit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {applicants.map(app => (
                    <tr 
                      key={app.id} 
                      onClick={() => setSelectedJob(app.fullJobData)} // TRIGGER DETAIL VIEW
                      className="hover:bg-indigo-50/30 transition-all group cursor-pointer"
                    >
                      <td className="px-8 py-5 text-left font-bold text-gray-800">{app.name}</td>
                      <td className="px-8 py-5 text-sm text-gray-500 font-medium">{app.role}</td>
                      <td className="px-8 py-5 text-center">
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{app.budget || 'Unset'}</span>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${app.match > 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                          {app.match}% Match
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: MANAGEMENT (The Read/Edit Component) */}
      {viewMode === 'management' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Passing the selection handler to JobManagement */}
          <JobManagement onSelectJob={(job: any) => setSelectedJob(job)} />
        </div>
      )}

      {/* VIEW: DISCOVERY (Talent Pool) */}
      {viewMode === 'discovery' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="relative max-w-3xl mx-auto group">
            <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500 transition-colors" />
            <input type="text" placeholder="Query talent pool..." 
              className="w-full pl-16 pr-8 py-6 bg-white border-2 border-gray-100 rounded-[2rem] shadow-lg focus:border-indigo-500 outline-none transition-all font-medium"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSeekers.map(seeker => (
              <ProfileCard key={seeker.id} profile={seeker} />
            ))}
          </div>
        </div>
      )}

      {/* POST JOB MODAL (Existing logic maintained) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-white/20">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-2xl font-black text-gray-900 leading-none">Create Opportunity</h3>
              <button title="Close" onClick={() => setIsModalOpen(false)} className="text-gray-300 hover:text-rose-500 transition-all">
                <FaTimes size={20} />
              </button>
            </div>
            <form onSubmit={handlePostJob} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Project / Role Title</Label>
                    <Input required placeholder="e.g. Lead Full-Stack Architect" value={newJob.title} onChange={(v: string) => setNewJob({...newJob, title: v})} />
                  </div>
                  <div className="space-y-2">
                    <Label icon={<FaDollarSign />}>Budget Allocation</Label>
                    <Input required placeholder="e.g. $80k - $120k" value={newJob.budget} onChange={(v: string) => setNewJob({...newJob, budget: v})} />
                  </div>
                  <div className="space-y-2">
                    <Label icon={<FaMapMarkerAlt />}>Work Mode</Label>
                    <select title="Work Mode" className="w-full bg-gray-50 border-none p-4 rounded-2xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
                      value={newJob.location_type} onChange={(e) => setNewJob({...newJob, location_type: e.target.value})}>
                      <option value="remote">Remote (Global)</option>
                      <option value="on-site">On-Site (Office)</option>
                      <option value="hybrid">Hybrid System</option>
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Scope & Responsibilities</Label>
                    <textarea required rows={4} className="w-full bg-gray-50 border-none p-4 rounded-2xl font-medium text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Briefly explain the mission..." value={newJob.description} onChange={(e) => setNewJob({...newJob, description: e.target.value})} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Required Technical Stack (CSV)</Label>
                    <Input placeholder="React, Node.js, AWS, Postgres" value={newJob.requirements} onChange={(v: string) => setNewJob({...newJob, requirements: v})} /> 
                  </div>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white font-black py-5 rounded-[1.5rem] shadow-2xl hover:bg-indigo-700 transition-all">
                {isSubmitting ? 'Syncing...' : 'Launch Project Opening'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Helpers
const Label = ({ children, icon }: any) => (
  <label className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 mb-1">
    {icon} {children}
  </label>
);

const Input = ({ ...props }: any) => (
  <input {...props} onChange={(e) => props.onChange(e.target.value)} 
    className="w-full bg-gray-50 border-none p-4 rounded-2xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-gray-300" />
);

function StatCard({ label, value, icon, color }: any) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-6 group">
      <div className={`${color} w-16 h-16 rounded-[1.25rem] text-white flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-black text-gray-900">{value}</p>
      </div>
    </div>
  );
}