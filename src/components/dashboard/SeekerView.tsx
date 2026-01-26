import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import type { JobProject } from '../../types'; 
import { FaSearch, FaStar, FaMapMarkerAlt, FaExternalLinkAlt } from 'react-icons/fa';

export default function SeekerView() {
  const { profile } = useAuth();
  const [availableJobs, setAvailableJobs] = useState<JobProject[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fixed match score logic to handle potential nulls/undefined safely
  const getMatchScore = (jobRequirements: string[] = []) => {
    if (!profile?.skills || !jobRequirements || jobRequirements.length === 0) return 0;
    
    const userSkills = Array.isArray(profile.skills) 
      ? profile.skills.map(s => s.toLowerCase()) 
      : [];
      
    const matches = jobRequirements.filter(req => 
      userSkills.includes(req.toLowerCase())
    );
    return Math.round((matches.length / jobRequirements.length) * 100);
  };

  const fetchDashboardData = useCallback(async (isMounted: boolean) => {
    if (isMounted) setLoading(true);
    
    try {
      // Use auth.getSession for more reliable user retrieval in views
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      // 1. Fetch Open Jobs
      const { data: jobs, error: jobsError } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      // 2. Fetch user's applications with better join syntax
      let formattedApps: any[] = [];
      if (user) {
        const { data: apps, error: appsError } = await supabase
          .from('applications')
          .select(`
            id, 
            status, 
            created_at, 
            projects (title)
          `) // Simplified join
          .eq('user_id', user.id);

        if (appsError) throw appsError;

        if (apps) {
          formattedApps = apps.map((app: any) => ({
            id: app.id,
            role: app.projects?.title || 'Unknown Role',
            company: 'Hiring Manager', 
            date: new Date(app.created_at).toLocaleDateString(),
            status: app.status,
            ...getStatusStyles(app.status)
          }));
        }
      }

      if (isMounted) {
        setAvailableJobs((jobs as JobProject[]) || []);
        setMyApplications(formattedApps);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      if (isMounted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchDashboardData(isMounted);
    
    return () => { isMounted = false; };
  }, [fetchDashboardData]);

  const handleApply = async (projectId: string, jobTitle: string, score: number) => {
  
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Please log in to apply.");

    // Prevent double applications using role or project ID
    const alreadyApplied = myApplications.some(app => app.role === jobTitle);
    if (alreadyApplied) return alert("You have already applied for this position.");

    const { error } = await supabase
      .from('applications')
      .insert([{
        project_id: projectId,
        user_id: user.id, // Use ID from auth directly to be safe
        match_score: score,
        status: 'Applied'
      }]);

    if (!error) {
      alert(`Successfully applied to ${jobTitle}!`);
      fetchDashboardData(true); // Refresh list
    } else {
      alert(error.message);
    }
  };

  function getStatusStyles(status: string) {
    switch (status?.toLowerCase()) {
      case 'shortlisted': return { color: 'text-green-600', bg: 'bg-green-50' };
      case 'rejected': return { color: 'text-red-600', bg: 'bg-red-50' };
      case 'viewed': return { color: 'text-purple-600', bg: 'bg-purple-50' };
      default: return { color: 'text-blue-600', bg: 'bg-blue-50' };
    }
  }

  const filteredJobs = availableJobs.filter(job => 
    job.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // loading UI
  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="text-gray-500 font-medium">Finding your matches...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Growth Dashboard</h2>
          <p className="text-sm text-gray-500">
            Welcome back, <span className="text-blue-600 font-semibold">{profile?.full_name || 'Seeker'}</span>
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by job title..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Job List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-2">
            <FaStar className="text-yellow-500" /> Recommended for You
          </h3>
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => {
              const score = getMatchScore(job.requirements);
              return (
                <div key={job.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{job.title}</h4>
                      <p className="text-gray-600 mt-1 mb-3 line-clamp-2 text-sm">{job.description}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md"><FaMapMarkerAlt /> Remote</span>
                        <div className="flex flex-wrap gap-1">
                          {job.requirements?.slice(0, 3).map((req) => (
                            <span key={req} className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider">{req}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 border-t sm:border-t-0 pt-3 sm:pt-0">
                      <div className="text-center">
                         <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Match Rate</p>
                         <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            score > 70 ? 'bg-green-50 text-green-700 border-green-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                          }`}>
                            {score}%
                         </span>
                      </div>
                      <button 
                        onClick={() => handleApply(job.id, job.title, score)}
                        className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center text-gray-500">
              No jobs found matching your search.
            </div>
          )}
        </div>

        {/* Tracker Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-4">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center justify-between">
              Active Tracker
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">{myApplications.length}</span>
            </h3>
            <div className="space-y-6">
              {myApplications.map((app) => (
                <div key={app.id} className="flex items-start gap-4 group">
                  <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${app.status === 'Shortlisted' ? 'bg-green-500' : 'bg-blue-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold text-gray-800 leading-tight truncate pr-2">{app.role}</p>
                      <FaExternalLinkAlt className="text-gray-300 text-[10px] group-hover:text-blue-400 transition-colors" />
                    </div>
                    <p className="text-[11px] text-gray-400 mb-2">{app.date}</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${app.bg} ${app.color}`}>
                      {app.status}
                    </span>
                  </div>
                </div>
              ))}
              {myApplications.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400">Your applications will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}