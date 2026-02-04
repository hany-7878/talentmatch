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
export default function ManagerView({ initialView, onNavigateToMessages }: { initialView?: string;
  onNavigateToMessages: (projectId: string, recipientId: string) => void;
}) {

  
  // 1. ALL STATES
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
  
  // NEW: Project-specific scouting state
  const [scoutingForJobId, setScoutingForJobId] = useState<string>('');

  const [newJob, setNewJob] = useState({ 
    title: '', description: '', requirements: '', budget: '', 
    location_type: 'remote', category: 'Engineering', is_priority: false, deadline: '',
  });

  // 2. INITIALIZE HOOK
  const { 
    sentInvitations, 
    sendInvitation, 
    withdrawInvitation, 
    isSubmitting: isInviting, 
    fetchInvitations 
  } = useInvitations(user?.id); 

  const canChat = useCallback((projectId: string, seekerId: string) => {
    return sentInvitations.some(
      inv => inv.project_id === projectId && 
             inv.seeker_id === seekerId && 
             inv.status === 'accepted'
    );
  }, [sentInvitations]);

  const calculateMatch = (seekerSkills: string[], jobRequirements: string[]) => {
  if (!jobRequirements || jobRequirements.length === 0) return 70; // Baseline
  
  const seekerSet = new Set(seekerSkills.map(s => s.toLowerCase()));
  const matches = jobRequirements.filter(req => seekerSet.has(req.toLowerCase()));
  
  // Calculate percentage
  const score = (matches.length / jobRequirements.length) * 100;
  
  // Return score, capped at 98 (to keep it looking "calculated")
  return Math.min(Math.max(Math.round(score), 15), 98); 
};



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

    // CALCULATE MATCHES HERE
    const formatted = appsRes.data?.map((app: any) => ({
      ...app,
      name: app.profiles?.full_name || 'Anonymous',
      role: app.projects?.title || 'Unknown Position',
      // We use your calculateMatch function here
      match: calculateMatch(app.profiles?.skills || [], app.projects?.requirements || []),
      project_id: app.project_id 
    })) || [];

    setAllSeekers(seekersRes.data || []);
    setMyJobs(jobsRes.data || []);
    setActiveJobsCount(jobsRes.count || 0);
    setApplicants(formatted); // Save the calculated matches to state

    if (jobsRes.data && jobsRes.data.length > 0 && !scoutingForJobId) {
      setScoutingForJobId(jobsRes.data[0].id);
    }
  } catch (err: any) {
    toast.error("Sync failed");
  } finally {
    setLoading(false);
  }
}, [fetchInvitations, scoutingForJobId]);

  // 4. EFFECTS
  useEffect(() => {
    if (initialView) setViewMode(initialView);
  }, [initialView]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  // 5. HELPER FUNCTIONS
const updateAppStatus = async (appId: string, newStatus: string) => {
  try {
    const { error: appError } = await supabase
      .from('applications')
      .update({ status: newStatus })
      .eq('id', appId);

    if (appError) throw appError;

    if (newStatus === 'interviewing') {
      const app = applicants.find(a => a.id === appId);
      if (!app || !user) return;

      // Senior fix: Check if invitation exists before upserting
      const invitationExists = sentInvitations.some(
        i => i.project_id === app.project_id && i.seeker_id === app.profiles.id
      );

      if (!invitationExists) {
        const { error: handshakeError } = await supabase
          .from('invitations')
          .insert({
            project_id: app.project_id,
            seeker_id: app.profiles.id,
            manager_id: user.id, 
            status: 'accepted' 
          });
        if (handshakeError) throw handshakeError;
        toast.success('Channel Opened!');
      }
    }
    setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
  } catch (err) {
    toast.error("Status sync failed");
  }
};

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const loadingToast = toast.loading('Publishing...');
    try {
      if (!user) throw new Error("Not authenticated");
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

  // Early Return for Detail View
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

  useEffect(() => {
  if (viewMode === 'discovery' && myJobs.length > 0 && !scoutingForJobId) {
    setScoutingForJobId(myJobs[0].id);
  }
}, [viewMode, myJobs, scoutingForJobId]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 pb-20">
      {/* HEADER SECTION */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="space-y-1 text-center md:text-left">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Intelligence Dashboard</h2>
          <div className="flex gap-6 pt-4 justify-center md:justify-start">
            {['pipeline', 'management', 'discovery', 'invites'].map((tab) => (
              <button key={tab} onClick={() => setViewMode(tab)}
                className={`text-xs font-black uppercase tracking-widest pb-2 transition-all border-b-4 ${viewMode === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-300 hover:text-gray-500'}`}>
                {tab === 'pipeline' ? 'Overview' : tab === 'management' ? 'Job Inventory' : tab === 'discovery' ? 'Talent Pool' : 'Outreach'}
              </button>

              
            ))}
          </div>
          
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-2xl hover:bg-indigo-600 transition-all font-bold shadow-2xl">
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
  {/* Card 1: Active Openings */}
  <StatCard 
    label="Active Openings" 
    value={activeJobsCount} 
    icon={<FaBriefcase />} 
    color="bg-indigo-600" 
  />

  {/* Card 2: Pipeline Depth */}
  <StatCard 
    label="Pipeline Depth" 
    value={applicants.length} 
    icon={<FaUsers />} 
    color="bg-rose-500" 
  />

  {/* Card 3: Avg. Match Quality */}
  <StatCard 
    label="Avg. Match Quality" 
    value={
      applicants.length > 0 
        ? `${Math.round(applicants.reduce((sum, app) => sum + (app.match || 0), 0) / applicants.length)}%`
        : "0%"
    } 
    icon={<FaChartLine />} 
    color="bg-amber-500" 
  />
</div>

              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><FaFilter /> Evaluation</h3>
                </div>
                <div className="overflow-x-auto">
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

      {/* CORRECTED ACTION CELL */}
      <td className="px-8 py-5 text-right flex gap-2 justify-end">
        {canChat(app.project_id, app.profiles.id) && (
    <button 
      onClick={() => onNavigateToMessages(app.project_id, app.profiles.id)} 
      className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center gap-2"
    >
      <FaPaperPlane size={14} />
      <span className="text-[10px] font-bold uppercase">Chat</span>
    </button>)}
  {app.status === 'interviewing' && (
    <button 
      onClick={() => onNavigateToMessages(app.project_id, app.profiles.id)} 
      className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center gap-2"
      title="Open Chat"
    >
      <FaPaperPlane size={14} />
      <span className="text-[10px] font-bold uppercase">Chat</span>
    </button>
  )}
        
        <button 
          onClick={() => setSelectedApplicant(app)} 
          className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
        >
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

          {viewMode === 'management' && <JobManagement onSelectJob={setSelectedJob} />}

        {viewMode === 'discovery' && (
  <div className="space-y-6">
    <div className="flex flex-col md:flex-row gap-4 items-end">
      <div className="flex-1 space-y-2">
        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Scouting For:</label>
        <select 
          value={scoutingForJobId} 
          onChange={(e) => setScoutingForJobId(e.target.value)}
          className="w-full p-4 bg-white border border-gray-100 rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-indigo-600 outline-none shadow-sm"
        >
          {myJobs.map(job => (
            <option key={job.id} value={job.id}>{job.title}</option>
          ))}
        </select>
      </div>
      
      <div className="relative flex-[2]">
        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search skills..." 
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl font-bold shadow-sm" 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
        />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {filteredSeekers.map(s => {
        // FIX: Now we check if invited specifically to the selected job
        const isInvitedToThisJob = sentInvitations.some(
          inv => inv.seeker_id === s.id && inv.project_id === scoutingForJobId
        );

        return (
          <ProfileCard 
            key={s.id} 
            profile={s} 
            isInvited={isInvitedToThisJob}
            onInvite={(profile) => {
              setTargetSeeker(profile);
              setIsInviteModalOpen(true);
            }} 
          />
        );
      })}
    </div>
  </div>
)}
          {/* OUTREACH/INVITES VIEW */}
         {/* OUTREACH/INVITES VIEW */}
{viewMode === 'invites' && (
  <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
    <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
        <FaPaperPlane className="text-indigo-600" /> My Sent Invitations
      </h3>
      <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full tracking-widest uppercase">
        {sentInvitations.length} Active Pitches
      </span>
    </div>
    
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-[10px] uppercase font-black text-gray-400 tracking-widest bg-gray-50/30">
            <th className="px-8 py-4 text-left">Candidate</th>
            <th className="px-8 py-4 text-left">Project</th>
            <th className="px-8 py-4 text-center">Status</th>
            <th className="px-8 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {sentInvitations.length === 0 ? (
            <tr><td colSpan={4} className="px-8 py-20 text-center text-gray-400 italic">No outreach active. Use the Talent Pool to find seekers.</td></tr>
          ) : (
            sentInvitations.map((inv) => (
              <tr key={inv.id} className="group hover:bg-gray-50/50 transition-all">
                <td className="px-8 py-5">
                  <div className="font-bold text-gray-900">{inv.profiles?.full_name}</div>
                  <div className="text-[10px] text-gray-400 font-medium">{inv.profiles?.email}</div>
                </td>
                <td className="px-8 py-5">
                  <div className="text-sm font-bold text-gray-700">{inv.projects?.title}</div>
                </td>
                <td className="px-8 py-5 text-center">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    inv.status === 'accepted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    inv.status === 'declined' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                    'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {inv.status}
                  </span>
                </td>
              <td className="px-8 py-5 text-right flex gap-3 justify-end">
  {inv.status !== 'declined' && (
    <button 
      onClick={() => onNavigateToMessages(inv.project_id, inv.seeker_id)} 
      className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center gap-2"
    >
      <FaPaperPlane size={12} />
      <span className="text-[10px] font-bold uppercase">Chat</span>
    </button>
  )}

  <button 
    onClick={() => withdrawInvitation(inv.id)} 
    className="p-3 bg-white text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-rose-100"
    title="Withdraw"
  >
    <FaTimes size={14} />
  </button>
</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
)}
        </>
      )}

      {/* MODALS */}
      <PostJobModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handlePostJob} newJob={newJob} setNewJob={setNewJob} isSubmitting={isSubmitting} />
      <ApplicantSlideOver applicant={selectedApplicant} onClose={() => setSelectedApplicant(null)} onUpdateStatus={updateAppStatus} />

      {/* INVITATION MODAL */}
      {/* INVITATION MODAL */}
{isInviteModalOpen && (
  <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setIsInviteModalOpen(false)} />
    <div className="relative bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
      <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black">Invite {targetSeeker?.full_name}</h3>
          <p className="text-[10px] text-indigo-200 uppercase font-bold tracking-widest mt-1">Select a project to pitch</p>
        </div>
        <button onClick={() => setIsInviteModalOpen(false)} className="hover:rotate-90 transition-transform">
          <FaTimes size={20} />
        </button>
      </div>
      
      <div className="p-8 space-y-3 max-h-[400px] overflow-y-auto">
        {myJobs.length === 0 ? (
          <p className="text-center text-gray-400 py-10 italic">No active jobs found. Post a job first!</p>
        ) : (
          myJobs.map(job => {
            const isAlreadyInvited = sentInvitations.some(
              inv => inv.project_id === job.id && inv.seeker_id === targetSeeker?.id
            );
            
            return (
              <button 
                key={job.id} 
                disabled={isInviting || isAlreadyInvited}
                onClick={async () => {
                  const success = await sendInvitation(job.id, targetSeeker);
                  if (success) setIsInviteModalOpen(false);
                }}
                className={`w-full text-left p-5 rounded-2xl border-2 flex items-center justify-between transition-all group ${
                  isAlreadyInvited 
                    ? 'bg-emerald-50 border-emerald-100 cursor-not-allowed opacity-80' 
                    : 'border-gray-50 hover:border-indigo-600 hover:bg-indigo-50 active:scale-[0.98]'
                }`}
              >
                <div>
                  <div className={`font-bold ${isAlreadyInvited ? 'text-emerald-700' : 'text-gray-900'}`}>
                    {job.title}
                  </div>
                  <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
                    {isAlreadyInvited ? 'Invitation Pending' : job.category}
                  </div>
                </div>
                {isInviting ? (
                  <FaSpinner className="animate-spin text-indigo-600" />
                ) : isAlreadyInvited ? (
                  <div className="bg-emerald-500 text-white p-1 rounded-full"><FaPlus className="rotate-45" size={10} /></div>
                ) : (
                  <FaPlus className="text-gray-300 group-hover:text-indigo-600 transition-colors" />
                )}
              </button>
            );
          })
        )}
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