import { FaTimes, FaRocket, FaSpinner } from 'react-icons/fa';

interface PostJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  newJob: any;
  setNewJob: (job: any) => void;
  isSubmitting: boolean;
}

export default function PostJobModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  newJob, 
  setNewJob, 
  isSubmitting 
}: PostJobModalProps) {
  
  // If the modal isn't supposed to be open, render nothing
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-md" 
        onClick={onClose} 
      />
      
      {/* Modal Content */}
      <form 
        onSubmit={onSubmit} 
        className="relative bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black text-gray-900">Create Project</h3>
            <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mt-1">
              Database Schema: Projects Table
            </p>
          </div>
          <button title='btton' 
            type="button" 
            onClick={onClose} 
            className="text-gray-400 hover:text-rose-500 transition-colors"
          >
            <FaTimes size={24}/>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-8 space-y-6 overflow-y-auto">
          
          {/* Row 1: Title & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Project Title</label>
              <input 
                required 
                value={newJob.title} 
                onChange={e => setNewJob({...newJob, title: e.target.value})} 
                className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none" 
                placeholder="e.g. Cloud Infrastructure Migration"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Category</label>
              <select title='newJob'
                value={newJob.category} 
                onChange={e => setNewJob({...newJob, category: e.target.value})} 
                className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-gray-700 outline-none"
              >
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Cybersecurity">Cybersecurity</option>
              </select>
            </div>
          </div>

          {/* Row 2: Budget, Location, & Deadline */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Budget</label>
              <input 
                value={newJob.budget} 
                onChange={e => setNewJob({...newJob, budget: e.target.value})} 
                className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold outline-none" 
                placeholder="$5k - $10k" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Location Type</label>
              <select title='newJob location'
                value={newJob.location_type} 
                onChange={e => setNewJob({...newJob, location_type: e.target.value})} 
                className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold outline-none"
              >
                <option value="remote">Remote</option>
                <option value="onsite">On-site</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Deadline</label>
              <input 
  title='newJob input'
  type="date"
  required
  min={new Date().toISOString().split("T")[0]} 
  value={newJob.deadline} 
  onChange={e => setNewJob({...newJob, deadline: e.target.value})} 
  className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-gray-700 outline-none" 
/>
            </div>
          </div>

         
          {/* Requirements & Description */}
<div className="space-y-2">
  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">
    Technical Requirements (Comma Separated)
  </label>
  <input 
    required 
    value={newJob.requirements} 
    onChange={e => setNewJob({...newJob, requirements: e.target.value})} 
    className="w-full p-4 bg-indigo-50/50 text-indigo-700 rounded-2xl border-none font-bold outline-none" 
    placeholder="React, AWS, Python (Use commas)"  
  />
</div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Mission Description</label>
            <textarea 
              required 
              value={newJob.description} 
              onChange={e => setNewJob({...newJob, description: e.target.value})} 
              className="w-full p-4 bg-gray-50 rounded-2xl border-none font-medium h-32 outline-none resize-none" 
              placeholder="Outline the project goals..." 
            />
          </div>

          {/* Priority Toggle */}
          <div className="flex items-center justify-between p-6 bg-amber-50 rounded-[2rem] border border-amber-100">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                <FaRocket />
              </div>
              <div>
                <p className="text-sm font-black text-amber-900">Priority Project</p>
                <p className="text-[9px] text-amber-600 font-bold uppercase">Mark for immediate attention</p>
              </div>
            </div>
            <input title='priority' 
              type="checkbox" 
              checked={newJob.is_priority} 
              onChange={e => setNewJob({...newJob, is_priority: e.target.checked})} 
              className="w-6 h-6 rounded accent-amber-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-8 bg-white border-t border-gray-100">
          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full bg-gray-900 text-white py-5 rounded-[1.5rem] font-black hover:bg-indigo-600 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isSubmitting ? (
              <><FaSpinner className="animate-spin" /> Synchronizing...</>
            ) : (
              <>Commit to Database</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}