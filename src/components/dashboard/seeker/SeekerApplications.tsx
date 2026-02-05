import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import JobDetailView from '../Common/JobDetailView'; 
import { FaClock, FaCheckCircle, FaChevronRight, FaTrashAlt, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function SeekerApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);

  const fetchApps = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id, 
          status, 
          created_at, 
          match_score,
          project_id,
          projects!inner (
            id,
            title,
            description,
            requirements,
            status,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (err: any) {
      console.error("Fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const handleWithdraw = async (projectId: string) => {
    if (!confirm("Withdraw this application?")) return;
    if (!user?.id) {
    toast.error("You must be logged in to perform this action");
    return;
  }
    
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', user?.id);

    if (error) {
      alert("Error: " + error.message);
    } else {
      setApplications(prev => prev.filter(app => app.project_id !== projectId));
      setSelectedJob(null); 
    }
  };

  // --- LOGIC SYNC WITH SEEKERVIEW ---
  if (selectedJob) {
    return (
      <JobDetailView 
        job={selectedJob} 
        userRole="SEEKER" 
        onBack={() => setSelectedJob(null)} 
        onApply={() => handleWithdraw(selectedJob.id)}
        isApplied={true} 
      />
    );
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh]">
      <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-gray-400 font-bold text-[10px] uppercase tracking-tighter">Loading My Applications...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">My Applications</h2>
        <p className="text-gray-500 text-sm font-medium">Track and manage your project interests.</p>
      </div>

      <div className="grid gap-4">
        {applications.length > 0 ? (
          applications.map((app) => (
            <div 
              key={app.id} 
              onClick={() => setSelectedJob(app.projects)}
              className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-6">
                <div className="text-2xl">
                  {app.status === 'shortlisted' ? <FaCheckCircle className="text-emerald-500" /> : <FaClock className="text-amber-500" />}
                </div>
                <div>
                  <h4 className="font-black text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {app.projects?.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Applied {new Date(app.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md">
                      {app.match_score}% Match
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter ${
                  app.status === 'shortlisted' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-500'
                }`}>
                  {app.status}
                </span>
                
                <button title='pagina'
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleWithdraw(app.project_id); 
                  }}
                  className="p-3 text-gray-300 hover:text-rose-500 hover:bg-rose-100 rounded-xl transition-all"
                >
                  <FaTrashAlt size={14} />
                </button>
                
                <FaChevronRight className="text-gray-200 group-hover:text-indigo-400 transform group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
            <FaExclamationTriangle className="mx-auto text-gray-300 mb-4" size={32} />
            <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">No active applications</p>
          </div>
        )}
      </div>
    </div>
  );
}