import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import type { JobProject } from '../../../types'; 
import { FaSearch, FaTimes, FaBookmark, FaRegBookmark, FaPaperPlane} from 'react-icons/fa'; 
import JobDetailView from '../Common/JobDetailView'; 
import { toast } from 'react-hot-toast';
import EmptyState from '../Common/EmptyState';
import confetti from 'canvas-confetti';

const JOBS_PER_PAGE = 6; 

interface HandshakeInfo {
  name: string;
  email: string;
}

interface SeekerViewProps {
  onApplicationSent?: () => void;
  onNavigateToMessages: (projectId: string, recipientId: string) => void;
}

export default function SeekerView({ onApplicationSent, onNavigateToMessages }: SeekerViewProps) {
  const { profile } = useAuth();
  const [availableJobs, setAvailableJobs] = useState<JobProject[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [myInvitations, setMyInvitations] = useState<any[]>([]);
  const [handshakes, setHandshakes] = useState<Record<string, HandshakeInfo>>({});
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<JobProject | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'applied' | 'invites' | 'saved' | 'connections'>('all');

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [savedJobs, setSavedJobs] = useState<string[]>(() => 
    JSON.parse(localStorage.getItem('saved_projects') || '[]')
  );

  const triggerSuccess = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#10b981', '#f59e0b']
    });
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedJob(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getMatchScore = useCallback((job: JobProject) => {
    if (!profile?.skills || !Array.isArray(profile.skills)) return 0;
    const userSkills = (profile.skills as string[]).map((s: string) => s.toLowerCase());
    const jobText = `${job.title} ${job.description} ${job.requirements?.join(' ')}`.toLowerCase();
    const matchedSkills = userSkills.filter((skill: string) => jobText.includes(skill));
    if (userSkills.length === 0) return 0;
    let score = (matchedSkills.length / userSkills.length) * 100;
    const titleMatches = userSkills.filter((skill: string) => job.title.toLowerCase().includes(skill));
    score += (titleMatches.length * 15); 
    return Math.min(Math.round(score), 98);
  }, [profile?.skills]);

  const fetchDashboardData = useCallback(async (isInitial = true) => {
    if (!profile?.id) return;
    const targetPage = isInitial ? 0 : page + 1;
    isInitial ? setLoading(true) : setLoadingMore(true);

    try {
      const from = targetPage * JOBS_PER_PAGE;
      const to = from + JOBS_PER_PAGE - 1;

      const jobsQuery = supabase
        .from('projects')
        .select('*', { count: 'exact' }) 
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (searchQuery.trim()) {
        jobsQuery.ilike('title', `%${searchQuery}%`);
      }

      // inside fetchDashboardData
const [jobsRes, appsRes, invitesRes] = await Promise.all([
  jobsQuery,
  supabase.from('applications').select('project_id, status').eq('user_id', profile.id),
  supabase.from('invitations').select(`
    project_id, 
    status,
    projects (
      id, 
      title, 
      manager_id,
      profiles:manager_id (
        full_name, 
        email
      )
    )
  `).eq('seeker_id', profile.id)
]);

      if (jobsRes.error) throw jobsRes.error;

      // --- CRITICAL FIX: MAP HANDSHAKES ---
      const contactMap: Record<string, HandshakeInfo> = {};

invitesRes.data?.forEach((inv: any) => {
  // 1. Check for 'accepted' status
  // 2. Ensure 'projects' exists (it might be an array or object depending on your SDK version)
  const project = Array.isArray(inv.projects) ? inv.projects[0] : inv.projects;
  
  if (inv.status?.toLowerCase() === 'accepted' && project) {
    // Handle the nested profile from manager_id
    const manager = Array.isArray(project.profiles) ? project.profiles[0] : project.profiles;

    if (manager) {
      contactMap[inv.project_id] = {
        name: manager.full_name ?? 'Hiring Manager',
        email: manager.email ?? ''
      };
    }
  }
});

      const sanitizedJobs = (jobsRes.data || []).map((job: any) => ({
        ...job,
        budget: job.budget ?? '',
        category: job.category ?? 'General',
        location_type: job.location_type ?? 'Remote',
        requirements: job.requirements ?? [],
        description: job.description ?? ''
      })) as JobProject[];

      setAvailableJobs(prev => isInitial ? sanitizedJobs : [...prev, ...sanitizedJobs]);
      setPage(isInitial ? 0 : targetPage);
      setMyApplications(appsRes.data || []);
      setMyInvitations(invitesRes.data || []);
      setHandshakes(contactMap);

      if (jobsRes.count !== null) {
        setHasMore(from + (jobsRes.data?.length || 0) < jobsRes.count);
      }
    } catch (err: any) {
      console.error("Dashboard Fetch Error:", err);
      if (isInitial) toast.error("Failed to sync dashboard");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page, profile?.id, searchQuery]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchDashboardData(true);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const filteredJobs = useMemo(() => {
    // Start with search filtering
    let jobs = availableJobs.filter(j => j.title?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter by Tab
    if (activeTab === 'connections') {
      jobs = jobs.filter(j => handshakes[j.id]);
    } else if (activeTab === 'applied') {
      jobs = jobs.filter(j => myApplications.some(a => a.project_id === j.id));
    } else if (activeTab === 'invites') {
      jobs = jobs.filter(j => myInvitations.some(i => i.project_id === j.id && i.status === 'pending'));
    } else if (activeTab === 'saved') {
      jobs = jobs.filter(j => savedJobs.includes(j.id));
    }

    // Sort: Pending invites at the top
    return [...jobs].sort((a, b) => {
      const aInv = myInvitations.some(i => i.project_id === a.id && i.status === 'pending') ? 1 : 0;
      const bInv = myInvitations.some(i => i.project_id === b.id && i.status === 'pending') ? 1 : 0;
      return bInv - aInv;
    });
  }, [availableJobs, searchQuery, activeTab, myApplications, myInvitations, savedJobs, handshakes]);

  const toggleSave = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const isSaved = savedJobs.includes(id);
    const newSaved = isSaved ? savedJobs.filter(itemId => itemId !== id) : [...savedJobs, id];
    setSavedJobs(newSaved);
    localStorage.setItem('saved_projects', JSON.stringify(newSaved));
    toast.success(isSaved ? "Removed from saved" : "Project saved!");
  };

  const handleAcceptInvitation = async (projectId: string) => {
    if (!profile?.id) return toast.error("User profile not found");
    const loadingToast = toast.loading("Confirming partnership...");

    try {
      const { data, error } = await supabase
        .from('invitations')
        .update({ status: 'accepted' })
        .eq('project_id', projectId)
        .eq('seeker_id', profile.id)
        .select(`
          project_id,
          projects!project_id (
            id, title, manager_id,
            profiles!manager_id (full_name, email)
          )
        `)
        .single();

      if (error) throw error;

      await supabase.from('applications').upsert({
        project_id: projectId,
        user_id: profile.id,
        status: 'pending',
        pitch: "Accepted direct invitation from manager."
      }, { onConflict: 'project_id,user_id' });

      const projectData = data.projects as any;
      const managerProfile = projectData?.profiles;

      if (projectData?.manager_id) {
        await supabase.from('notifications').insert({
          user_id: projectData.manager_id,
          title: "Invitation Accepted! 🎉",
          message: `${profile.full_name || 'A seeker'} has accepted your invite for ${projectData.title}.`,
          type: 'invitation_accepted',
          link: `/manager/projects/${projectId}`
        });
      }

      triggerSuccess();
      setMyInvitations(prev => prev.map(inv => inv.project_id === projectId ? { ...inv, status: 'accepted' } : inv));
      
      if (managerProfile) {
        setHandshakes(prev => ({
          ...prev,
          [projectId]: { 
            name: managerProfile.full_name ?? 'Hiring Manager', 
            email: managerProfile.email ?? '' 
          }
        }));
      }

      toast.success("Handshake complete!", { id: loadingToast });
    } catch (err: any) {
      toast.error(err.message || "Failed to accept", { id: loadingToast });
    }
  };

 const handleDeclineInvitation = async (projectId: string) => {
  // 1. Guard: Ensure the user is actually authenticated
  if (!profile?.id) {
    toast.error("Session expired. Please log in again.");
    return;
  }

  // 2. Confirmation (Standard for destructive actions)
  if (!window.confirm("Decline this project invitation?")) return;

  const loadingToast = toast.loading("Removing invitation...");

  try {
    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('project_id', projectId)
      .eq('seeker_id', profile.id); // No more '?' - we guarded against undefined above

    if (error) throw error;

    // 3. UI Update: Remove from local state immediately
    setMyInvitations(prev => prev.filter(inv => inv.project_id !== projectId));
    
    toast.success("Invitation removed", { id: loadingToast });
  } catch (err: any) {
    console.error("Decline Error:", err);
    toast.error("Failed to decline. Please check your connection.", { id: loadingToast });
  }
};

  const handleWithdraw = async (projectId: string) => {
    // 1. Guard against undefined profile
    if (!profile?.id) return toast.error("Please log in to manage applications");

    // 2. Add confirmation for better UX
    if (!window.confirm("Are you sure you want to withdraw?")) return;

    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', profile.id); // 'profile.id' is now safe here

    if (!error) {
      setMyApplications(prev => prev.filter(app => app.project_id !== projectId));
      toast.success("Application withdrawn");
    } else {
      toast.error("Withdrawal failed. Please try again.");
    }
  };

  if (loading) return <div className="text-center py-20 animate-pulse font-black text-gray-400 uppercase tracking-widest">Entering Marketplace...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 pb-24 space-y-6 md:space-y-8 overflow-x-hidden">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mt-4 md:mt-8 bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm">
        <div className="w-full">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Marketplace</h2>
          <p className="text-gray-500 font-medium text-sm md:text-base">Opportunities curated for your skillset.</p>
        </div>
        <div className="relative w-full md:w-96">
          <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" placeholder="Search projects..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-3 md:py-4 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold text-sm md:text-base"
          />
        </div>
      </div>

      {/* Active Partnerships Section */}
      {Object.keys(handshakes).length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Active Partnerships
            </h3>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 px-2 no-scrollbar snap-x touch-pan-x">
            {Object.entries(handshakes).map(([projectId, info]) => {
              const job = availableJobs.find(j => j.id === projectId);
              return (
                <div key={projectId} className="flex-shrink-0 w-[240px] md:w-[280px] bg-white p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] border border-emerald-100 shadow-sm transition-all hover:shadow-md snap-start">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-xs md:text-sm shadow-lg shadow-emerald-100">
                      {info.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-gray-900 text-xs md:text-sm truncate">{info.name}</h4>
                      <p className="text-[8px] md:text-[9px] font-bold text-emerald-600 uppercase tracking-widest truncate">{job?.title || 'Private Project'}</p>
                    </div>
                  </div>
                  <button onClick={() => onNavigateToMessages(projectId, job?.manager_id || '')} className="w-full py-2 bg-emerald-50 text-emerald-700 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2 border border-emerald-100">
                    💬 Chat
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 md:gap-8 border-b border-gray-100 px-2 md:px-4 overflow-x-auto no-scrollbar whitespace-nowrap">
        {[
          { id: 'all', label: 'Discovery', count: 0 },
          { id: 'invites', label: 'Invitations', count: myInvitations.filter(i => i.status === 'pending').length },
          { id: 'applied', label: 'Applied', count: myApplications.length },
          { id: 'connections', label: 'Connections', count: Object.keys(handshakes).length },
          { id: 'saved', label: 'Saved', count: savedJobs.length }
        ].map(tab => (
          <button
            key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`pb-4 text-[10px] md:text-xs font-black uppercase tracking-widest transition-all border-b-4 relative ${
              activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'
            }`}
          >
            {tab.label}
            {tab.count > 0 && <span className="ml-1.5 md:ml-2 bg-rose-500 text-white text-[8px] md:text-[9px] px-1.5 py-0.5 rounded-full">{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Grid of Jobs */}
      <div className="grid gap-4">
        {filteredJobs.length > 0 ? (
          filteredJobs.map(job => {
            const score = getMatchScore(job);
            const application = myApplications.find(a => a.project_id === job.id);
            const invitation = myInvitations.find(i => i.project_id === job.id);
            const isAccepted = invitation?.status === 'accepted';
            const isSaved = savedJobs.includes(job.id);

            return (
              <div key={job.id} onClick={() => setSelectedJob(job)} className="bg-white p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 hover:shadow-xl transition-all group cursor-pointer relative animate-in fade-in slide-in-from-bottom-2">
                <button 
                  onClick={(e) => toggleSave(e, job.id)} 
                  className="absolute top-5 right-5 z-10 p-2 rounded-xl bg-gray-50 hover:bg-white border border-transparent hover:border-gray-100 transition-all text-orange-600"
                >
                  {isSaved ? <FaBookmark size={14} /> : <FaRegBookmark size={14} />}
                </button>
                <div className="flex flex-col lg:flex-row justify-between gap-4 md:gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-[9px] md:text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1.5 ${score > 70 ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                        <span className="relative flex h-2 w-2">
                          {score > 70 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>}
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${score > 70 ? 'bg-indigo-600' : 'bg-gray-400'}`}></span>
                        </span>
                        {score}% Match
                      </span>
                      <span className="bg-gray-50 text-gray-400 text-[9px] md:text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">Posted {getTimeAgo(job.created_at ?? new Date().toISOString())}</span>
                    </div>
                    <h4 className="text-xl md:text-2xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors pr-10">{job.title ?? 'Untitled Project'}</h4>
                    <p className="text-gray-500 text-xs md:text-sm line-clamp-2">{job.description ?? ''}</p>
                  </div>
                  
                  <div className="w-full lg:min-w-[220px] lg:w-auto">
                    {isAccepted ? (
                      <button onClick={(e) => { e.stopPropagation(); onNavigateToMessages(job.id, job.manager_id ?? '') }} className="w-full py-3 bg-emerald-50 text-emerald-700 rounded-2xl font-black text-[10px] uppercase hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2">
                        <FaPaperPlane size={12} /> Chat
                      </button>
                    ) : invitation?.status === 'pending' ? (
                      <div className="flex flex-row lg:flex-col gap-2">
                        <button onClick={(e) => { e.stopPropagation(); handleAcceptInvitation(job.id); }} className="flex-1 lg:w-full py-3 md:py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Accept</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeclineInvitation(job.id); }} className="px-4 lg:w-full py-2 bg-rose-50 text-rose-600 rounded-xl font-black text-[9px] md:text-[10px] uppercase hover:bg-rose-100 transition-all">Decline</button>
                      </div>
                    ) : application ? (
                      <button onClick={(e) => { e.stopPropagation(); handleWithdraw(job.id); }} className="w-full py-3 bg-rose-50 text-rose-600 rounded-2xl font-black text-[10px] uppercase">Withdraw Application</button>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); setSelectedJob(job); }} className="w-full py-3 md:py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-gray-100">View & Apply</button>
                    )} 
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="mt-4">
            <EmptyState icon={FaSearch} title="No Projects Found" description="Try a different tab or search query." variant="indigo" />
          </div>
        )}
      </div>

      {/* Pagination */}
      {hasMore && filteredJobs.length > 0 && (
        <div className="flex justify-center pt-8">
          <button onClick={() => fetchDashboardData(false)} disabled={loadingMore} className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-indigo-600 transition-all disabled:opacity-50 font-black text-xs uppercase tracking-widest text-gray-600">
            {loadingMore ? 'Loading...' : 'Load More Opportunities'}
          </button>
        </div>
      )}

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-gray-900/60 backdrop-blur-md" onClick={() => setSelectedJob(null)}>
          <div className="relative w-full max-w-4xl max-h-[92vh] md:max-h-[90vh] overflow-y-auto bg-white rounded-t-[2.5rem] md:rounded-[3rem] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button title='Close Detail View' onClick={() => setSelectedJob(null)}
              className="absolute top-6 right-6 md:top-8 md:right-8 z-[110] p-3 md:p-4 bg-gray-100 hover:bg-rose-50 hover:text-rose-600 rounded-full transition-all"><FaTimes size={14} /></button>
            <div className="p-1">
              <JobDetailView 
                job={selectedJob} 
                userRole="SEEKER" 
                isApplied={myApplications.some(a => a.project_id === selectedJob.id)} 
                onBack={() => setSelectedJob(null)} 
                onApply={async (pitch: string) => {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user) throw new Error("No user found");
                  const { error } = await supabase.from('applications').insert({ project_id: selectedJob.id, user_id: user.id, pitch, status: 'pending' });
                  if (error) throw error;
                  triggerSuccess();
                  toast.success("Application sent!");
                  await fetchDashboardData(true);
                  setSelectedJob(null); 
                  if (onApplicationSent) onApplicationSent();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}