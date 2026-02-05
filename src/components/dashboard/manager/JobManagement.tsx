import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient'; 
import { 
  FaEdit, FaTrashAlt, FaMapMarkerAlt, 
  FaTimes, FaSave, FaBriefcase, FaCircleNotch, FaEye, FaLock, FaBolt,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

interface Job {
  id: string;
  title: string;
  location_type: string; 
  status: string;
  description: string;
  budget?: string;
  requirements?: string[] | string;
  category?: string;
}

interface JobManagementProps {
  onSelectJob?: (job: Job) => void;
  onAddNew?: () => void; 
  onDataChange: () => void; // Triggered to refresh parent stats
}

export default function JobManagement({ onSelectJob, onAddNew, onDataChange }: JobManagementProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  // Senior Dev: Modal Scroll Lock
  useEffect(() => {
    document.body.style.overflow = editingJob ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [editingJob]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('manager_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const sanitizedJobs = data.map((job: any) => ({
          ...job,
          budget: job.budget ?? '',
          category: job.category ?? '',
          description: job.description ?? '',
          location_type: job.location_type ?? 'remote',
          status: job.status ?? 'draft',
          requirements: job.requirements ?? [],
        })) as Job[];
        setJobs(sanitizedJobs);
      }
    } catch (error: any) {
      toast.error("Error loading inventory");
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleJobStatus = async (jobId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'open' ? 'closed' : 'open';
    
    // Optimistic Update
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus } : j));

    const { error } = await supabase
      .from('projects')
      .update({ status: newStatus })
      .eq('id', jobId);

    if (error) {
      toast.error("Failed to update status");
      fetchJobs(); // Rollback on error
    } else {
      toast.success(`Job ${newStatus === 'open' ? 'Published' : 'Closed'}`);
      onDataChange(); // Refresh Parent Stats
    }
  };

  const handleEditInit = (job: Job) => {
    setEditingJob({
      ...job,
      requirements: Array.isArray(job.requirements) 
        ? job.requirements.join(', ') 
        : (job.requirements || '')
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;
    setActionLoading(true);

    const reqArray = typeof editingJob.requirements === 'string' 
      ? editingJob.requirements.split(',').map(r => r.trim()).filter(Boolean)
      : editingJob.requirements;

    const { error } = await supabase
      .from('projects')
      .update({
        title: editingJob.title.trim(),
        location_type: editingJob.location_type,
        status: editingJob.status,
        description: editingJob.description,
        budget: editingJob.budget,
        requirements: reqArray,
        category: editingJob.category
      })
      .eq('id', editingJob.id);

    if (!error) {
      toast.success("Changes saved!");
      setEditingJob(null);
      await fetchJobs(); // Refresh local list
      onDataChange();    // Refresh Parent Stats
    } else {
      toast.error(error.message);
    }
    setActionLoading(false);
  };

  const handleDeleteInternal = async (id: string) => {
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      return;
    }

    setActionLoading(true);
    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (!error) {
      setJobs(jobs.filter(j => j.id !== id));
      toast.success("Job deleted permanently");
      onDataChange(); // Refresh Parent Stats
    } else {
      toast.error("Delete failed");
    }
    setDeleteConfirmId(null);
    setActionLoading(false);
  };

  if (loading) return (
    <div className="flex justify-center p-20">
      <FaCircleNotch className="animate-spin text-indigo-600 text-3xl" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Inventory</h2>
          <p className="text-slate-500 font-medium">You have {jobs.length} active listings</p>
        </div>
      </div>

      <div className="grid gap-4">
        {jobs.length === 0 ? (
          <div className="text-center p-16 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <FaBriefcase className="text-slate-300 text-2xl" />
            </div>
            <p className="text-slate-500 font-bold mb-6">No jobs found in your inventory.</p>
            <button onClick={onAddNew} className="text-indigo-600 font-black uppercase text-xs tracking-widest hover:underline">
              Create your first post &rarr;
            </button>
          </div>
        ) : (
          jobs.map((job) => (
            <div key={job.id} 
              className="group bg-white border border-slate-100 p-5 rounded-[2rem] shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex gap-5 items-center flex-1">
                <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all shrink-0">
                  <FaBriefcase />
                </div>
                
                <div className="flex-1 cursor-pointer" onClick={() => onSelectJob?.(job)}>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1">{job.title}</h3>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                      <FaMapMarkerAlt className="text-indigo-400" /> {job.location_type}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                      <FaEye /> Review Applicants
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => toggleJobStatus(job.id, job.status)}
                  className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all border ${
                    job.status === 'open' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' 
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {job.status === 'open' ? <><FaBolt className="inline mr-1" /> Active</> : <><FaLock className="inline mr-1" /> Closed</>}
                </button>
                
                <div className="flex items-center gap-1 bg-slate-50 rounded-2xl p-1">
                  <button 
                    aria-label="Edit Job"
                    onClick={() => handleEditInit(job)} 
                    className="p-3 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    <FaEdit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteInternal(job.id)} 
                    className={`p-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-tighter ${
                      deleteConfirmId === job.id 
                        ? "bg-rose-600 text-white px-4" 
                        : "text-slate-400 hover:text-rose-500"
                    }`}
                  >
                    {deleteConfirmId === job.id ? "Delete?" : <FaTrashAlt size={16} />}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !actionLoading && setEditingJob(null)} />
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h3 className="font-black text-slate-900 text-2xl tracking-tight">Edit Post</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Refining Opportunity</p>
              </div>
              <button title='Close Edit Modal'
                onClick={() => setEditingJob(null)} 
                className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-full transition-all"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-8 space-y-6 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Position Title</label>
                  <input title='Position Title' 
                    type="text" 
                    value={editingJob.title}
                    onChange={(e) => setEditingJob({...editingJob, title: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none font-bold focus:border-indigo-500 focus:bg-white transition-all"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Budget</label>
                    <input 
                      type="text" 
                      value={editingJob.budget || ''}
                      onChange={(e) => setEditingJob({...editingJob, budget: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none font-bold focus:border-indigo-500 focus:bg-white transition-all"
                      placeholder="e.g. $5k - $10k"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Work Mode</label>
                    <select title='a' 
                      value={editingJob.location_type}
                      onChange={(e) => setEditingJob({...editingJob, location_type: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none font-bold focus:border-indigo-500 focus:bg-white transition-all appearance-none"
                    >
                      <option value="remote">Remote</option>
                      <option value="on-site">On-Site</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Requirements (Separated by commas)</label>
                  <textarea  title='editing'
                    value={editingJob.requirements}
                    onChange={(e) => setEditingJob({...editingJob, requirements: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none font-bold focus:border-indigo-500 focus:bg-white transition-all min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Full Description</label>
                  <textarea title='editing'
                    value={editingJob.description}
                    onChange={(e) => setEditingJob({...editingJob, description: e.target.value})}
                    rows={5}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none font-bold focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="submit" 
                  disabled={actionLoading}
                  className="flex-1 py-4 bg-slate-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-slate-200 flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all disabled:opacity-50"
                >
                  {actionLoading ? <FaCircleNotch className="animate-spin" /> : <FaSave />}
                  Update Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}