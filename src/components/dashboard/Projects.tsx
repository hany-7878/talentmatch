import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FaTrashAlt, FaEdit, FaSearch, FaBriefcase } from 'react-icons/fa';

export default function Projects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('manager_id', user.id)
      .order('created_at', { ascending: false });

    if (!error) setProjects(data);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase
      .from('projects')
      .update({ status })
      .eq('id', id);

    if (!error) {
      setProjects(projects.map(p => p.id === id ? { ...p, status } : p));
    }
  }

  async function deleteProject(id: string) {
    if (!window.confirm("Permanent delete? All applications for this job will be lost.")) return;
    
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (!error) setProjects(projects.filter(p => p.id !== id));
  }

  if (loading) return <div className="p-10 animate-pulse text-gray-400">Loading your listings...</div>;

  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
          <FaBriefcase className="text-indigo-500" /> Project Inventory
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] uppercase font-black text-gray-400 tracking-widest bg-gray-50/30">
              <th className="px-8 py-4">Job Details</th>
              <th className="px-8 py-4 text-center">Current Status</th>
              <th className="px-8 py-4 text-center">Budget</th>
              <th className="px-8 py-4 text-right">Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {projects.map((project) => (
              <tr key={project.id} className="hover:bg-indigo-50/10 transition-colors group">
                <td className="px-8 py-5">
                  <p className="font-bold text-gray-800">{project.title}</p>
                  <p className="text-[10px] text-indigo-400 font-bold uppercase">{project.category}</p>
                </td>
                <td className="px-8 py-5 text-center">
                  <select 
                    title="Change Status"
                    value={project.status}
                    onChange={(e) => updateStatus(project.id, e.target.value)}
                    className="text-[10px] font-black uppercase bg-gray-100 px-3 py-1 rounded-full outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="open">Open</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="closed">Closed</option>
                  </select>
                </td>
                <td className="px-8 py-5 text-center font-mono font-bold text-gray-600">
                  {project.budget}
                </td>
                <td className="px-8 py-5 text-right">
                  <button title='delete'
                   onClick={() => deleteProject(project.id)} className="p-2 text-gray-300 hover:text-rose-500 transition-colors">
                    <FaTrashAlt />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}