import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient'; 
import { 
  FaEdit, FaTrashAlt, FaMapMarkerAlt, 
  FaTimes, FaSave, FaBriefcase, FaCircleNotch, FaEye, FaLock, FaBolt 
} from 'react-icons/fa';

interface Job {
  id: string;
  title: string;
  location_type: string; 
  status: string;
  description: string;
  budget?: string;
  requirements?: string[] | string; // Handled as array in DB, sometimes string in UI
  category?: string;
}

interface JobManagementProps {
  onSelectJob?: (job: Job) => void;
}

export default function JobManagement({ onSelectJob }: JobManagementProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('manager_id', user.id)
      .order('created_at', { ascending: false });

    if (!error) setJobs(data || []);
    setLoading(false);
  };

  const toggleJobStatus = async (jobId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'open' ? 'closed' : 'open';
    const { error } = await supabase
      .from('projects')
      .update({ status: newStatus })
      .eq('id', jobId);

    if (!error) {
      setJobs(jobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;
    setActionLoading(true);

    // Ensure requirements is an array for the database
    const requirementsArray = typeof editingJob.requirements === 'string' 
      ? (editingJob.requirements as string).split(',').map(r => r.trim())
      : editingJob.requirements;

    const { error } = await supabase
      .from('projects')
      .update({
        title: editingJob.title,
        location_type: editingJob.location_type,
        status: editingJob.status,
        description: editingJob.description,
        budget: editingJob.budget,
        requirements: requirementsArray,
        category: editingJob.category
      })
      .eq('id', editingJob.id);

    if (!error) {
      // Re-fetch to ensure local state is perfectly synced with DB
      await fetchJobs();
      setEditingJob(null);
    }
    setActionLoading(false);
  };

  const handleDeleteInternal = async (id: string) => {
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      return;
    }

    setActionLoading(true);
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (!error) {
      setJobs(jobs.filter(j => j.id !== id));
      setDeleteConfirmId(null);
    }
    setActionLoading(false);
  };

  if (loading) return (
    <div className="flex justify-center p-20">
      <FaCircleNotch className="animate-spin text-indigo-600 text-3xl" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Job Inventory</h2>
          <p className="text-gray-500 text-sm">Managing {jobs.length} listings.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {jobs.length === 0 ? (
          <div className="text-center p-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-bold">No jobs posted yet.</p>
          </div>
        ) : (
          jobs.map((job) => (
            <div key={job.id} 
              className="group bg-white border border-gray-100 p-6 rounded-3xl shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex gap-4 items-center flex-1">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                  <FaBriefcase />
                </div>
                
                <div className="flex-1 cursor-pointer" onClick={() => onSelectJob?.(job)}>
                  <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-indigo-600 transition-colors">
                    {job.title}
                  </h3>
                  <div className="flex gap-4 mt-2">
                    <span className="flex items-center gap-1 text-xs text-gray-400 font-medium uppercase tracking-wider">
                      <FaMapMarkerAlt /> {job.location_type}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-indigo-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      <FaEye /> View Detail & Applicants
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={() => toggleJobStatus(job.id, job.status)}
                  className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full transition-all border ${
                    job.status === 'open' 
                      ? 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100' 
                      : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100'
                  }`}
                >
                  {job.status === 'open' ? <><FaBolt className="inline mr-1" /> Active</> : <><FaLock className="inline mr-1" /> Closed</>}
                </button>
                
                <div className="flex items-center gap-1 border-l pl-4 border-gray-100">
                  <button 
                    onClick={() => setEditingJob({...job, requirements: Array.isArray(job.requirements) ? job.requirements.join(', ') : job.requirements})} 
                    className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                  >
                    <FaEdit size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeleteInternal(job.id)} 
                    className={`p-3 rounded-2xl transition-all font-bold text-xs ${
                      deleteConfirmId === job.id 
                        ? "bg-rose-600 text-white animate-pulse px-4" 
                        : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                    }`}
                  >
                    {deleteConfirmId === job.id ? "Confirm?" : <FaTrashAlt size={18} />}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {editingJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => !actionLoading && setEditingJob(null)} />
          <div className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl relative z-10 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 bg-white z-10">
              <h3 className="font-black text-gray-900 text-xl">Update Opportunity</h3>
              <button onClick={() => setEditingJob(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Job Title</label>
                  <input 
                    type="text" 
                    value={editingJob.title}
                    onChange={(e) => setEditingJob({...editingJob, title: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Budget Range</label>
                  <input 
                    type="text" 
                    value={editingJob.budget || ''}
                    onChange={(e) => setEditingJob({...editingJob, budget: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. $50/hr"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Work Mode</label>
                  <select 
                    value={editingJob.location_type}
                    onChange={(e) => setEditingJob({...editingJob, location_type: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold"
                  >
                    <option value="remote">Remote</option>
                    <option value="on-site">On-Site</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Requirements (comma separated)</label>
                  <input 
                    type="text" 
                    value={editingJob.requirements}
                    onChange={(e) => setEditingJob({...editingJob, requirements: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Description</label>
                  <textarea 
                    value={editingJob.description}
                    onChange={(e) => setEditingJob({...editingJob, description: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-6 flex gap-3 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setEditingJob(null)} className="flex-1 py-3.5 font-bold text-gray-400">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading}
                  className="flex-1 py-3.5 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all"
                >
                  {actionLoading ? <FaCircleNotch className="animate-spin" /> : <FaSave />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}