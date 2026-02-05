import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient'; 
import { 
  FaPlus, FaUsers, FaBriefcase, FaChartLine, FaTimes, 
  FaSearch, FaFilter, 
  FaExternalLinkAlt, FaSpinner, FaPaperPlane
} from 'react-icons/fa';
import ProfileCard from '../Common/ProfileCard';
import JobManagement from './JobManagement'; 
import JobDetailView from '../Common/JobDetailView';
import PostJobModal from './PostJobModal';
import toast from 'react-hot-toast';
import ApplicantSlideOver from './ApplicantSlideOver';
import { useInvitations } from './useInvitations';

interface ManagerViewProps {
  initialView: string;
  onNavigateToMessages: (projectId: string, recipientId: string) => void;
  onTabChange: (tab: any) => void;
  onActionComplete?: () => void;
}

export default function ManagerView({ 
  initialView, 
  onNavigateToMessages, 
  onTabChange,
  onActionComplete
}: ManagerViewProps) {

  const [viewMode, setViewMode] = useState<string>('pipeline');
  const [user, setUser] = useState<any>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [allSeekers, setAllSeekers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeJobsCount, setActiveJobsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [targetSeeker, setTargetSeeker] = useState<any | null>(null);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [scoutingForJobId, setScoutingForJobId] = useState<string>('');

  const [newJob, setNewJob] = useState({ 
    title: '', description: '', requirements: '', budget: '', 
    location_type: 'remote', category: 'Engineering', is_priority: false, deadline: '',
  });

  const { 
    sentInvitations, 
    sendInvitation, 
    withdrawInvitation, 
    isSubmitting: isInviting, 
    fetchInvitations 
  } = useInvitations(user?.id); 

  const handleInternalTabChange = (tab: string) => {
    setViewMode(tab);
    onTabChange(tab);
  };

  const calculateMatch = (seekerSkills: string[], jobRequirements: string[]) => {
    if (!jobRequirements || jobRequirements.length === 0) return 70;
    const seekerSet = new Set(seekerSkills.map(s => s.toLowerCase()));
    const matches = jobRequirements.filter(req => seekerSet.has(req.toLowerCase()));
    return Math.min(Math.max(Math.round((matches.length / jobRequirements.length) * 100), 15), 98); 
  };

  const canChat = useCallback((projectId: string, seekerId: string) => {
    return sentInvitations.some(
      inv => inv.project_id === projectId && 
             inv.seeker_id === seekerId && 
             inv.status === 'accepted'
    );
  }, [sentInvitations]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      setUser(authUser);

      const [seekersRes, jobsRes, appsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'SEEKER'),
        supabase.from('projects').select('*', { count: 'exact' }).eq('manager_id', authUser.id).eq('status', 'open'),
        supabase.from('applications').select(`
            *,
            profiles:applications_user_id_fkey (id, full_name, avatar_url, skills, bio, email),
            projects:project_id!inner (id, title, requirements)
          `).eq('projects.manager_id', authUser.id).order('created_at', { ascending: false }),
        fetchInvitations()
      ]);

      const fetchedJobs = jobsRes.data || [];
      const formatted = appsRes.data?.map((app: any) => ({
        ...app,
        name: app.profiles?.full_name || 'Anonymous',
        role: app.projects?.title || 'Unknown Position',
        match: calculateMatch(app.profiles?.skills || [], app.projects?.requirements || []),
        project_id: app.project_id 
      })) || [];

      setAllSeekers(seekersRes.data || []);
      setMyJobs(fetchedJobs);
      setActiveJobsCount(jobsRes.count || 0);
      setApplicants(formatted);

      if (fetchedJobs.length > 0 && !scoutingForJobId) {
        setScoutingForJobId(fetchedJobs[0].id);
      }
    } catch (err) {
      toast.error("Sync failed");
    } finally {
      setLoading(false);
    }
  }, [fetchInvitations, scoutingForJobId]);

  useEffect(() => { if (initialView) setViewMode(initialView); }, [initialView]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleHireCandidate = async (app: any) => {
    if (!window.confirm(`Finalize hiring for ${app.name}?`)) return;
    const loading = toast.loading("Finalizing hire...");
    try {
      const { error: appErr } = await supabase.from('applications').update({ status: 'hired' }).eq('id', app.id);
      const { error: projErr } = await supabase.from('projects').update({ status: 'closed' }).eq('id', app.project_id);
      if (appErr || projErr) throw new Error("Update failed");
      toast.success("Hired successfully!", { id: loading });
      setSelectedApplicant(null);
      fetchData(); 
      if (onActionComplete) onActionComplete();
    } catch (err) {
      toast.error("Sync failed", { id: loading });
    }
  };

  const updateAppStatus = async (appId: string, newStatus: string) => {
    setApplicants(prev => prev.map(a => String(a.id) === String(appId) ? { ...a, status: newStatus } : a));
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const loadingToast = toast.loading('Publishing...');
    try {
      const { error } = await supabase.from('projects').insert([{
        manager_id: user.id,
        title: newJob.title,
        description: newJob.description,
        requirements: newJob.requirements.split(',').map(r => r.trim()).filter(Boolean),
        budget: newJob.budget,
        location_type: newJob.location_type,
        category: newJob.category,
        deadline: newJob.deadline, 
        is_priority: newJob.is_priority,
        status: 'open' 
      }]);
      if (error) throw error;
      toast.success('Published!', { id: loadingToast });
      setIsModalOpen(false);
      setNewJob({ title: '', description: '', requirements: '', budget: '', location_type: 'remote', category: 'Engineering', deadline: '', is_priority: false });
      fetchData(); 
      if (onActionComplete) onActionComplete();
    } catch (err: any) {
      toast.error(err.message, { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSeekers = useMemo(() => {
    return allSeekers.filter(s => 
      s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.skills?.some((sk: string) => sk.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [allSeekers, searchQuery]);

  if (selectedJob) {
    return (
      <JobDetailView 
        job={selectedJob} 
        userRole="MANAGER" 
        onBack={() => setSelectedJob(null)} 
        applicants={applicants.filter(app => app.project_id === selectedJob.id)}
        onUpdateApplicantStatus={updateAppStatus}
        isApplied={false} 
      />
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto px-4 pb-24">
      {/* HEADER SECTION - Responsive Padding/Flex */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="w-full space-y-4 md:space-y-1 text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Intelligence Dashboard</h2>
          {/* SCROLLABLE TABS ON MOBILE */}
          <div className="flex gap-4 md:gap-6 pt-2 overflow-x-auto no-scrollbar justify-start md:justify-start -mx-4 px-4 md:mx-0 md:px-0">
            {['pipeline', 'management', 'discovery', 'invites'].map((tab) => (
              <button 
                key={tab} 
                onClick={() => handleInternalTabChange(tab)}
                className={`text-[10px] md:text-xs font-black uppercase tracking-widest pb-2 transition-all border-b-4 whitespace-nowrap ${viewMode === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-300 hover:text-gray-500'}`}
              >
                {tab === 'pipeline' ? 'Overview' : tab === 'management' ? 'Inventory' : tab === 'discovery' ? 'Talent' : 'Outreach'}
              </button>
            ))}
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="w-full md:w-auto flex items-center justify-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-2xl hover:bg-indigo-600 transition-all font-bold shadow-lg"
        >
          <FaPlus /> <span>Post Opportunity</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
           <FaSpinner className="animate-spin text-4xl text-indigo-600" />
           <p className="font-black uppercase tracking-widest text-[10px]">Syncing Pipeline...</p>
        </div>
      ) : (
        <>
          {viewMode === 'pipeline' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
                <StatCard label="Active Openings" value={activeJobsCount} icon={<FaBriefcase />} color="bg-indigo-600" />
                <StatCard label="Pipeline Depth" value={applicants.length} icon={<FaUsers />} color="bg-rose-500" />
                <StatCard 
                  label="Match Quality" 
                  value={applicants.length > 0 ? `${Math.round(applicants.reduce((sum, app) => sum + (app.match || 0), 0) / applicants.length)}%` : "0%"} 
                  icon={<FaChartLine />} 
                  color="bg-amber-500" 
                />
              </div>

              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 bg-gray-50/50 border-b border-gray-100">
                  <h3 className="text-md font-bold text-gray-800 flex items-center gap-2"><FaFilter /> Evaluation</h3>
                </div>
                
                {/* MOBILE VIEW FOR APPLICANTS (CARDS) */}
                <div className="block md:hidden divide-y divide-gray-50">
                  {applicants.map(app => (
                    <div key={app.id} className="p-5 space-y-4">
                      <div className="flex justify-between items-start" onClick={() => setSelectedApplicant(app)}>
                        <div>
                          <div className="font-bold text-gray-900">{app.name}</div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-tight">{app.role}</div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${app.match > 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                          {app.match}% Match
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {(canChat(app.project_id, app.profiles.id) || app.status === 'interviewing') && (
                          <button onClick={() => onNavigateToMessages(app.project_id, app.profiles.id)} className="flex-1 py-3 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-[10px] uppercase flex items-center justify-center gap-2">
                            <FaPaperPlane /> Chat
                          </button>
                        )}
                        <button onClick={() => setSelectedApplicant(app)} className="flex-1 py-3 bg-gray-50 text-gray-500 rounded-xl font-bold text-[10px] uppercase flex items-center justify-center gap-2">
                          <FaExternalLinkAlt /> View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* DESKTOP VIEW FOR APPLICANTS (TABLE) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50/30">
                      <tr className="text-[10px] uppercase font-black text-gray-400 tracking-widest">
                        <th className="px-8 py-5 text-left">Talent</th>
                        <th className="px-8 py-5 text-center">Match score</th>
                        <th className="px-8 py-5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {applicants.map(app => (
                        <tr key={app.id} className="hover:bg-indigo-50/30 transition-all group">
                          <td className="px-8 py-5 cursor-pointer" onClick={() => setSelectedApplicant(app)}>
                            <div className="font-bold text-gray-800">{app.name}</div>
                            <div className="text-[10px] text-gray-400 uppercase">{app.role}</div>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${app.match > 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                              {app.match}% Match
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right flex gap-2 justify-end">
                            {(canChat(app.project_id, app.profiles.id) || app.status === 'interviewing') && (
                              <button title='Chat with Applicant' onClick={() => onNavigateToMessages(app.project_id, app.profiles.id)} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all">
                                <FaPaperPlane size={14} />
                              </button>
                            )}
                            <button title='View Applicant Details' onClick={() => setSelectedApplicant(app)} className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                              <FaExternalLinkAlt size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'management' && <JobManagement onSelectJob={setSelectedJob} onDataChange={fetchData} />}

          {viewMode === 'discovery' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/3">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Scouting For:</label>
                  <select title='Select Job to Scout For'
                    value={scoutingForJobId} 
                    onChange={(e) => setScoutingForJobId(e.target.value)}
                    className="w-full p-4 bg-white border border-gray-100 rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-indigo-600"
                  >
                    {myJobs.map(job => <option key={job.id} value={job.id}>{job.title}</option>)}
                  </select>
                </div>
                <div className="w-full md:w-2/3 flex flex-col">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Search Talent:</label>
                  <div className="relative">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Skills or name..." 
                      className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-indigo-600" 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)} 
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSeekers.map(s => (
                  <ProfileCard 
                    key={s.id} 
                    profile={s} 
                    isInvited={sentInvitations.some(inv => inv.seeker_id === s.id && inv.project_id === scoutingForJobId)}
                    onInvite={(profile) => {
                      setTargetSeeker(profile);
                      setIsInviteModalOpen(true);
                    }} 
                  />
                ))}
              </div>
            </div>
          )}

          {viewMode === 'invites' && (
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
               {/* Mobile View Invitations */}
               <div className="md:hidden divide-y divide-gray-50">
                 {sentInvitations.map(inv => (
                   <div key={inv.id} className="p-5 space-y-3">
                     <div className="flex justify-between">
                       <div>
                         <div className="font-bold">{inv.profiles?.full_name}</div>
                         <div className="text-[10px] text-gray-400 font-bold">{inv.projects?.title}</div>
                       </div>
                       <span className="text-[9px] font-black uppercase text-indigo-600">{inv.status}</span>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => onNavigateToMessages(inv.project_id, inv.seeker_id)} className="flex-1 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase">Chat</button>
                        <button title='Withdraw Invitation' onClick={() => withdrawInvitation(inv.id)} className="p-2 bg-gray-50 text-rose-500 rounded-lg"><FaTimes /></button>
                     </div>
                   </div>
                 ))}
               </div>
        
               <div className="hidden md:block">
                  <table className="w-full">
                   
                  </table>
               </div>
            </div>
          )}
        </>
      )}

      {/* MODALS remain mostly same but ensured they use w-full max-w-md for mobile */}
      <PostJobModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handlePostJob} newJob={newJob} setNewJob={setNewJob} isSubmitting={isSubmitting} />
      <ApplicantSlideOver applicant={selectedApplicant} onClose={() => setSelectedApplicant(null)} onUpdateStatus={updateAppStatus} onHire={handleHireCandidate} />

      {isInviteModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setIsInviteModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-t-[2.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black">Invite Seeker</h3>
                <p className="text-[10px] text-indigo-200 uppercase font-bold tracking-widest mt-1">Select a project</p>
              </div>
              <button title='zx' onClick={() => setIsInviteModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full">
                <FaTimes size={18} />
              </button>
            </div>
            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
              {myJobs.map(job => (
                <button 
                  key={job.id} 
                  className="w-full text-left p-4 rounded-2xl border-2 border-gray-50 hover:border-indigo-600 transition-all flex justify-between items-center"
                  onClick={async () => {
                    const success = await sendInvitation(job.id, targetSeeker);
                    if (success) setIsInviteModalOpen(false);
                  }}
                >
                  <span className="font-bold text-gray-900">{job.title}</span>
                  <FaPlus className="text-gray-300" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Updated StatCard for Mobile/Tablet
function StatCard({ label, value, icon, color }: { label: string, value: string | number, icon: any, color: string }) {
  return (
    <div className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 md:gap-6 group">
      <div className={`${color} w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-[1.25rem] text-white flex items-center justify-center text-xl md:text-2xl shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-[9px] md:text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">{label}</p>
        <p className="text-xl md:text-3xl font-black text-gray-900">{value}</p>
      </div>
    </div>
  );
}