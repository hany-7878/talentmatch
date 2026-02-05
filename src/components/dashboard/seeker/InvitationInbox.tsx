import { useSeekerInvitations } from '../../../hooks/useSeekerInvitations';
import { useAuth } from '../../../context/AuthContext';
import { FaCheck, FaTimes, FaInbox, FaUserCircle } from 'react-icons/fa';
import { useState } from 'react';

export default function InvitationInbox() {
  const { user } = useAuth();
  const { invitations, loading, respondToInvitation } = useSeekerInvitations(user?.id);
  
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = async (id: string, status: 'accepted' | 'declined') => {
    setProcessingId(id);
    await respondToInvitation(id, status);
    setProcessingId(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-gray-400 font-medium animate-pulse uppercase tracking-widest text-xs">Syncing Handshakes...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-10">
        <h2 className="text-4xl font-black text-gray-900 tracking-tight">Handshakes</h2>
        <p className="text-gray-500 font-medium">Manage your project invitations and partnerships.</p>
      </header>
      
      {invitations.length === 0 ? (
        <div className="bg-slate-50 rounded-[3rem] p-16 text-center border-2 border-dashed border-slate-200">
          <div className="bg-white w-20 h-20 rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-6">
            <FaInbox className="text-slate-200 text-3xl" />
          </div>
          <h3 className="text-xl font-black text-gray-800">Your inbox is quiet</h3>
          <p className="text-gray-500 font-medium max-w-xs mx-auto mt-2">
            Once managers find your profile and send an invite, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {invitations.map((inv) => {
          
            const project = inv.projects;
            if (!project) return null;

            return (
              <div 
                key={inv.id} 
                className={`group bg-white border-2 rounded-[2.5rem] p-8 transition-all duration-300 ${
                  inv.status === 'pending' 
                    ? 'border-gray-100 hover:border-indigo-200 hover:shadow-2xl shadow-indigo-100/20' 
                    : 'opacity-60 border-transparent bg-gray-50/50'
                }`}
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex gap-4 items-center">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                      {project.profiles?.avatar_url ? (
                        <img src={project.profiles.avatar_url} className="w-full h-full rounded-2xl object-cover" alt="Manager" />
                      ) : (
                        <FaUserCircle className="text-3xl" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          inv.status === 'pending' ? 'bg-amber-400 animate-pulse' :
                          inv.status === 'accepted' ? 'bg-emerald-400' : 'bg-gray-300'
                        }`} />
                        <h4 className="font-black text-2xl text-gray-900 tracking-tight">
                          {project.title}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">
                        From <span className="text-indigo-600">{project.profiles?.full_name || 'Anonymous Manager'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto">
                    {inv.status === 'pending' ? (
                      <>
                        <button 
                          disabled={processingId === inv.id}
                          onClick={() => handleAction(inv.id, 'declined')}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-rose-600 transition-colors disabled:opacity-50"
                        >
                          <FaTimes /> Decline
                        </button>
                        <button 
                          disabled={processingId === inv.id}
                          onClick={() => handleAction(inv.id, 'accepted')}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-10 py-4 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:bg-gray-400"
                        >
                          {processingId === inv.id ? 'Updating...' : <><FaCheck /> Accept</>}
                        </button>
                      </>
                    ) : (
                      <div className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                        inv.status === 'accepted' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}>
                        {inv.status === 'accepted' ? <FaCheck /> : <FaTimes />}
                        {inv.status}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}