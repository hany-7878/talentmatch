import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient'; 
import { 
  FaPlus, FaUsers, FaBriefcase, FaChartLine, FaTimes, 
  FaSearch, FaUserGraduate 
} from 'react-icons/fa';
import ProfileCard from './ProfileCard';

export default function ManagerView() {
  const [viewMode, setViewMode] = useState<'pipeline' | 'discovery'>('pipeline');
  const [applicants, setApplicants] = useState<any[]>([]);
  const [allSeekers, setAllSeekers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeJobsCount, setActiveJobsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', description: '', requirements: '' });

  const fetchData = useCallback(async () => {
    // If we're already loading, don't start again to prevent loops
    setLoading(true);
    try {
      // 1. Fetch Applications with joined data
      const { data: apps, error: appsErr } = await supabase
        .from('applications')
        .select(`
          id, 
          status, 
          match_score, 
          profiles (full_name, avatar_url), 
          projects (title)
        `)
        .order('match_score', { ascending: false });

      if (appsErr) throw appsErr;

      // 2. Fetch all seekers for discovery
      const { data: seekers, error: seekersErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'SEEKER');

      if (seekersErr) throw seekersErr;

      // 3. Get count of active jobs
      const { count, error: countErr } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      if (countErr) throw countErr;

      // Map data safely
      setApplicants(apps?.map((app: any) => ({
        id: app.id,
        name: app.profiles?.full_name || 'Unknown Candidate',
        avatar: app.profiles?.avatar_url,
        role: app.projects?.title || 'General Position',
        match: app.match_score || 0,
        status: app.status
      })) || []);

      setAllSeekers(seekers || []);
      setActiveJobsCount(count || 0);
    } catch (err: any) {
      console.error("Manager fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const filteredSeekers = allSeekers.filter(seeker => {
    const searchLower = searchQuery.toLowerCase();
    const nameMatch = seeker.full_name?.toLowerCase().includes(searchLower);
    // Safe check for skills array
    const skillMatch = seeker.skills?.some((s: string) => s.toLowerCase().includes(searchLower));
    return nameMatch || skillMatch;
  });

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('projects').insert([{
      manager_id: user.id,
      title: newJob.title,
      description: newJob.description,
      requirements: newJob.requirements.split(',').map(r => r.trim()),
      status: 'open'
    }]);

    if (!error) {
      setIsModalOpen(false);
      setNewJob({ title: '', description: '', requirements: '' });
      fetchData(); 
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-500 font-medium">Updating Management Hub...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Recruitment Hub</h2>
          <div className="flex gap-4 mt-2">
            <button 
              onClick={() => setViewMode('pipeline')}
              className={`text-sm font-bold pb-1 border-b-2 transition-all ${viewMode === 'pipeline' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}
            >
              Application Pipeline
            </button>
            <button 
              onClick={() => setViewMode('discovery')}
              className={`text-sm font-bold pb-1 border-b-2 transition-all ${viewMode === 'discovery' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}
            >
              Talent Discovery
            </button>
          </div>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all font-bold text-sm"
        >
          <FaPlus /> Create Job Listing
        </button>
      </div>

      {viewMode === 'pipeline' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard label="Live Roles" value={activeJobsCount} icon={<FaBriefcase />} color="bg-blue-600" />
            <StatCard label="Total Applicants" value={applicants.length} icon={<FaUsers />} color="bg-purple-600" />
            <StatCard 
              label="AI Match Avg" 
              value={applicants.length > 0 ? `${Math.round(applicants.reduce((a,c)=>a+c.match,0)/applicants.length)}%` : '0%'} 
              icon={<FaChartLine />} 
              color="bg-emerald-600" 
            />
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-900">Active Candidates</h3>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-gray-50/50 text-gray-400 text-[10px] uppercase font-black">
                    <tr>
                      <th className="px-8 py-4">Candidate</th>
                      <th className="px-8 py-4">Target Role</th>
                      <th className="px-8 py-4 text-center">Match</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {applicants.length > 0 ? applicants.map(app => (
                      <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-4 font-bold text-gray-800">{app.name}</td>
                        <td className="px-8 py-4 text-sm text-gray-500">{app.role}</td>
                        <td className="px-8 py-4 flex justify-center">
                          <span className={`px-3 py-1 rounded-lg text-xs font-black ${app.match > 75 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {app.match}%
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={3} className="px-8 py-10 text-center text-gray-400 italic text-sm">No applications found yet.</td>
                      </tr>
                    )}
                  </tbody>
               </table>
             </div>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="relative max-w-2xl mx-auto">
            <FaSearch className="absolute left-4 top-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name or skills..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSeekers.map(seeker => (
              <ProfileCard key={seeker.id} profile={seeker} />
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">New Job Listing</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimes size={18} />
              </button>
            </div>
            <form onSubmit={handlePostJob} className="p-6 space-y-4">
              <input required type="text" placeholder="Job Title" className="w-full border p-3 rounded-xl" value={newJob.title} onChange={(e) => setNewJob({...newJob, title: e.target.value})} />
              <textarea required rows={3} placeholder="Description" className="w-full border p-3 rounded-xl" value={newJob.description} onChange={(e) => setNewJob({...newJob, description: e.target.value})} />
              <input type="text" placeholder="Requirements (React, SQL)" className="w-full border p-3 rounded-xl" value={newJob.requirements} onChange={(e) => setNewJob({...newJob, requirements: e.target.value})} />
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-100 transition-all hover:bg-blue-700">Launch Listing</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5">
      <div className={`${color} p-4 rounded-2xl text-white text-2xl shadow-lg`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest leading-none mb-1">{label}</p>
        <p className="text-2xl font-black text-gray-900 leading-none">{value}</p>
      </div>
    </div>
  );
}