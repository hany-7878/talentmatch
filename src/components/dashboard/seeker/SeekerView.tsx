import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import type { JobProject } from '../../../types'; 
import { FaSearch, FaChevronRight, FaTimes } from 'react-icons/fa'; 
import JobDetailView from '../JobDetailView'; 

const JOBS_PER_PAGE = 6; 

interface SeekerViewProps {
  onApplicationSent?: () => void; 
}

export default function SeekerView({ onApplicationSent }: SeekerViewProps) {
  const { profile } = useAuth();
  const [availableJobs, setAvailableJobs] = useState<JobProject[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<JobProject | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // --- LOGIC: MATCH SCORE ---
  const getMatchScore = useCallback((jobRequirements: string[] = []) => {
    if (!profile?.skills || !jobRequirements.length) return 0;
    const userSkills = Array.isArray(profile.skills) ? profile.skills.map(s => s.toLowerCase()) : [];
    const matches = jobRequirements.filter(req => userSkills.includes(req.toLowerCase()));
    return Math.round((matches.length / jobRequirements.length) * 100);
  }, [profile?.skills]);

  // --- LOGIC: FETCH DATA ---
  const fetchDashboardData = useCallback(async (isInitial = true) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentPage = isInitial ? 0 : page + 1;
      const from = currentPage * JOBS_PER_PAGE;
      const to = from + JOBS_PER_PAGE - 1;

      const [jobsRes, appsRes] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact' }).eq('status', 'open').order('created_at', { ascending: false }).range(from, to),
        isInitial && user ? supabase.from('applications').select(`project_id`).eq('user_id', user.id) : Promise.resolve({ data: null })
      ]);

      if (jobsRes.error) throw jobsRes.error;

      if (isInitial) {
        setAvailableJobs(jobsRes.data as JobProject[]);
        setPage(0);
        if (appsRes.data) setMyApplications(appsRes.data);
      } else {
        setAvailableJobs(prev => [...prev, ...(jobsRes.data as JobProject[])]);
        setPage(currentPage);
      }
      if (jobsRes.count !== null) setHasMore(from + (jobsRes.data?.length || 0) < jobsRes.count);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page]); 

  useEffect(() => { fetchDashboardData(true); }, []);

  // --- LOGIC: APPLY (FIXED STATUS & SCORE) ---
  const handleApply = async (jobId: string, pitchValue: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Session expired. Please log in.");

    const targetJob = availableJobs.find(j => j.id === jobId);
    const score = getMatchScore(targetJob?.requirements);

    const { error } = await supabase
      .from('applications')
      .insert([{ 
        project_id: jobId, 
        user_id: user.id, 
        pitch: pitchValue,
        status: 'Applied', 
        match_score: score
      }]);

    if (error) {
      console.error("Apply error:", error.message);
      alert(`Application failed: ${error.message}`);
      return;
    }

    // Update state to show 'Applied' immediately
    setMyApplications(prev => [...prev, { project_id: jobId }]);
    setSelectedJob(null); 
    if (onApplicationSent) onApplicationSent(); 
  };

  // --- LOGIC: WITHDRAW ---
  const handleWithdraw = async (projectId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', user.id);

    if (error) {
      alert("Withdraw failed: " + error.message);
    } else {
      setMyApplications(prev => prev.filter(app => app.project_id !== projectId));
      if (onApplicationSent) onApplicationSent(); 
    }
  };

  const filteredJobs = useMemo(() => 
    availableJobs.filter(job => job.title?.toLowerCase().includes(searchQuery.toLowerCase())),
    [availableJobs, searchQuery]
  );

  // --- VIEW: DETAIL MODAL ---
  if (selectedJob) {
    const isApplied = myApplications.some(app => app.project_id === selectedJob.id);
    return (
      <JobDetailView 
        job={selectedJob} 
        userRole="SEEKER" 
        onBack={() => setSelectedJob(null)} 
        onApply={async (pitch: string) => {
          if (isApplied) {
            if(window.confirm("Withdraw your application?")) await handleWithdraw(selectedJob.id);
          } else {
            await handleApply(selectedJob.id, pitch);
          }
        }}
        isApplied={isApplied} 
      />
    );
  }

  // --- VIEW: LOADING ---
  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Loading Marketplace...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 pb-24 space-y-8 animate-in fade-in duration-500">
      {/* Search Header */}
      <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 mt-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Marketplace</h2>
          <p className="text-gray-500 font-medium">Find high-impact projects matching your skills.</p>
        </div>
        <div className="relative w-full md:w-96">
          <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search roles..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold text-gray-700 shadow-inner"
          />
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.map((job) => {
          const score = getMatchScore(job.requirements);
          const isApplied = myApplications.some(app => app.project_id === job.id);
          
          return (
            <div 
              key={job.id} 
              onClick={() => setSelectedJob(job)}
              className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group cursor-pointer"
            >
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider">{score}% Skill Match</span>
                    {isApplied && (
                      <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider">Applied</span>
                    )}
                  </div>
                  <h4 className="text-2xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{job.title}</h4>
                  <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">{job.description}</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {job.requirements?.slice(0, 4).map(req => (
                      <span key={req} className="bg-gray-50 text-gray-400 text-[9px] font-black px-3 py-1.5 rounded-xl border border-gray-100 uppercase">{req}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col justify-center min-w-[180px] gap-2">
                  {isApplied ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); if(confirm("Withdraw?")) handleWithdraw(job.id); }}
                      className="w-full px-6 py-3 rounded-2xl bg-rose-50 text-rose-600 font-black text-[10px] uppercase tracking-widest transition-all hover:bg-rose-100 flex items-center justify-center gap-2"
                    >
                      <FaTimes className="text-[10px]" /> Withdraw
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedJob(job); }}
                      className="w-full px-6 py-4 rounded-2xl bg-gray-900 text-white font-black text-xs uppercase tracking-widest transition-all hover:bg-indigo-600 shadow-lg shadow-indigo-200"
                    >
                      View & Apply
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}