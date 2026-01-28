import { useSeekerInvitations } from './useSeekerInvitations';
import { useAuth } from '../../../context/AuthContext';
import { FaCheck, FaTimes, FaInbox } from 'react-icons/fa';

export default function InvitationInbox() {
  const { user } = useAuth();
  const { invitations, loading, respondToInvitation } = useSeekerInvitations(user?.id);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-gray-400 font-medium animate-pulse">Syncing your opportunities...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 animate-in fade-in duration-700">
      <header className="mb-10">
        <h2 className="text-4xl font-black text-gray-900 tracking-tight">Handshakes</h2>
        <p className="text-gray-500 font-medium">Manage your project invitations and partnerships.</p>
      </header>
      
      {invitations.length === 0 ? (
        <div className="bg-slate-50 rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-200">
          <div className="bg-white w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
            <FaInbox className="text-slate-300 text-2xl" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Your inbox is quiet</h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">
            Once managers find your profile and send an invite, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {invitations.map((inv) => (
            <div 
              key={inv.id} 
              className={`group bg-white border-2 rounded-[2rem] p-6 transition-all duration-300 ${
                inv.status === 'pending' ? 'border-gray-100 hover:border-indigo-100 shadow-md' : 'opacity-75 border-transparent bg-gray-50'
              }`}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      inv.status === 'pending' ? 'bg-amber-400 animate-pulse' :
                      inv.status === 'accepted' ? 'bg-emerald-400' : 'bg-gray-300'
                    }`} />
                    <h4 className="font-black text-xl text-gray-900 tracking-tight">
                      {inv.projects.title}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-500 font-bold flex items-center gap-2">
                    By <span className="text-indigo-600">{inv.projects.profiles.full_name}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {inv.status === 'pending' ? (
                    <>
                      <button 
                        onClick={() => respondToInvitation(inv.id, 'declined')}
                        className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-rose-600 transition-colors"
                      >
                        <FaTimes /> Decline
                      </button>
                      <button 
                        onClick={() => respondToInvitation(inv.id, 'accepted')}
                        className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                      >
                        <FaCheck /> Accept Invitation
                      </button>
                    </>
                  ) : (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
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
          ))}
        </div>
      )}
    </div>
  );
}