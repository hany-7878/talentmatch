import { FaMapMarkerAlt, FaDollarSign, FaClock, FaArrowLeft, FaBolt, FaEdit, FaUsers } from 'react-icons/fa';

interface JobDetailProps {
  job: any;
  userRole: 'MANAGER' | 'SEEKER';
  onBack: () => void;
  // Actions are optional depending on role
  onApply?: (jobId: string) => void; 
  onEdit?: (job: any) => void;
}

export default function JobDetailView({ job, userRole, onBack, onApply, onEdit }: JobDetailProps) {
  const isManager = userRole === 'MANAGER';

  return (
    <div className="animate-in fade-in slide-in-from-right duration-300 bg-white min-h-screen">
      {/* Universal Sticky Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 font-bold transition-all">
            <FaArrowLeft /> Exit Detail
          </button>
          
          <div className="flex gap-3">
            {isManager ? (
              <button 
                onClick={() => onEdit?.(job)}
                className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center gap-2"
              >
                <FaEdit /> Edit Post
              </button>
            ) : (
              <button 
                onClick={() => onApply?.(job.id)}
                className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                <FaBolt /> Quick Apply
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: The Content */}
        <div className="lg:col-span-8 space-y-8">
          <div>
            <h1 className="text-5xl font-black text-gray-900 mb-6 tracking-tight leading-tight">
              {job.title}
            </h1>
            <div className="flex flex-wrap gap-3">
              <span className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-bold text-sm flex items-center gap-2">
                <FaMapMarkerAlt /> {job.location_type || job.location}
              </span>
              <span className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg font-bold text-sm flex items-center gap-2">
                <FaDollarSign /> {job.budget}
              </span>
              <span className="px-4 py-2 bg-amber-50 text-amber-700 rounded-lg font-bold text-sm flex items-center gap-2">
                <FaClock /> Full-time
              </span>
            </div>
          </div>

          <div className="prose prose-lg max-w-none">
            <h3 className="text-2xl font-bold text-gray-900">Description</h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line text-lg">
              {job.description}
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mt-10 mb-4">Core Requirements</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {job.requirements?.map((req: string, i: number) => (
                <div key={i} className="flex items-start gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="mt-1.5 w-2 h-2 bg-indigo-500 rounded-full shrink-0" />
                  <span className="text-gray-700 font-medium">{req}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {isManager ? (
            <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-white/20 p-3 rounded-2xl">
                  <FaUsers size={24} />
                </div>
                <h3 className="font-bold text-xl">Applicant Flow</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-indigo-100 font-medium uppercase text-xs tracking-widest">
                  <span>Current Applicants</span>
                  <span>Goal: 50</span>
                </div>
                <div className="text-4xl font-black">24</div>
                <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden">
                  <div className="bg-white h-full w-[48%]" />
                </div>
                <button className="w-full bg-white text-indigo-600 font-black py-4 rounded-2xl hover:bg-indigo-50 transition-all mt-4">
                  Review All Candidates
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white">
              <h3 className="font-bold text-xl mb-4">Ready to contribute?</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Apply now and our hiring managers will review your profile and match score within 48 hours.
              </p>
              <button 
                onClick={() => onApply?.(job.id)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg"
              >
                Submit Application
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}