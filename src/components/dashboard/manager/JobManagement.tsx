import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient'; 
import { 
  FaEdit, FaTrashAlt, FaMapMarkerAlt, 
  FaTimes, FaSave, FaBriefcase, FaCircleNotch, FaEye 
} from 'react-icons/fa';

interface Job {
  id: string;
  title: string;
  location_type: string; 
  status: string;
  description: string;
  budget?: string;
  requirements?: string[]; // Added to match Detail View needs
}

// Add onSelectJob to the props interface
interface JobManagementProps {
  onSelectJob?: (job: Job) => void;
}

export default function JobManagement({ onSelectJob }: JobManagementProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

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

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;
    setActionLoading(true);

    const { error } = await supabase
      .from('projects')
      .update({
        title: editingJob.title,
        location_type: editingJob.location_type,
        status: editingJob.status,
        description: editingJob.description
      })
      .eq('id', editingJob.id);

    if (!error) {
      setJobs(jobs.map(j => j.id === editingJob.id ? editingJob : j));
      setEditingJob(null);
    }
    setActionLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this posting?")) return;
    
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (!error) {
      setJobs(jobs.filter(j => j.id !== id));
    }
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
          <p className="text-gray-500 text-sm">Managing {jobs.length} active listings.</p>
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
              className="group bg-white border border-gray-100 p-6 rounded-3xl shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-default"
            >
              <div className="flex gap-4 items-center">
                {/* Visual Icon */}
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <FaBriefcase />
                </div>
                
                {/* Title & Info - Clickable to open Detail */}
                <div 
                  className="cursor-pointer" 
                  onClick={() => onSelectJob?.(job)} 
                >
                  <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-indigo-600 transition-colors">
                    {job.title}
                  </h3>
                  <div className="flex gap-4 mt-2">
                    <span className="flex items-center gap-1 text-xs text-gray-400 font-medium uppercase tracking-wider">
                      <FaMapMarkerAlt /> {job.location_type}
                    </span>
                    <span className="hidden group-hover:flex items-center gap-1 text-xs text-indigo-500 font-bold animate-in fade-in slide-in-from-left-2">
                      <FaEye /> View Detail
                    </span>
                  </div>
                </div>
              </div>

              {/* Status & Actions */}
              <div className="flex items-center gap-6">
                <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${
                  job.status === 'open' || job.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {job.status}
                </span>
                
                <div className="flex items-center gap-2 border-l pl-6 border-gray-100">
                  <button 
                    title="Edit Post"
                    onClick={() => setEditingJob(job)} 
                    className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                  >
                    <FaEdit size={18} />
                  </button>
                  <button 
                    title="Delete Post"
                    onClick={() => handleDelete(job.id)} 
                    className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                  >
                    <FaTrashAlt size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal remains identical to your previous code */}
      {editingJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !actionLoading && setEditingJob(null)} />
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl relative z-10 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-black text-gray-900 leading-none text-xl">Quick Edit</h3>
              <button onClick={() => setEditingJob(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Position Title</label>
                <input 
                  type="text" 
                  value={editingJob.title}
                  onChange={(e) => setEditingJob({...editingJob, title: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Work Mode</label>
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
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Status</label>
                  <select 
                    value={editingJob.status}
                    onChange={(e) => setEditingJob({...editingJob, status: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold"
                  >
                    <option value="open">Active</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                <button type="button" onClick={() => setEditingJob(null)} className="flex-1 py-3.5 font-bold text-gray-400">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading}
                  className="flex-1 py-3.5 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2"
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