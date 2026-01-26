import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ManagerView from '../components/dashboard/ManagerView';
import SeekerView from '../components/dashboard/SeekerView';
import Sidebar from '../components/dashboard/Sidebar';
import ProfileSettings from '../components/dashboard/ProfileSettings';
import { FaSignOutAlt } from 'react-icons/fa';

export default function Dashboard() {
  const { profile, logout, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'profile'>('overview');

  // 1. Single source of truth for redirection
  useEffect(() => {
    // Only redirect if we are SURE loading is finished AND no user exists
    if (!isLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // 2. Loading State (Keep this simple)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-blue-600 font-medium">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  // 3. Fallback for the "Race Condition" 
  // If we have a user but the profile row is still being fetched/created
  if (!profile && user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Syncing profile data...</p>
        </div>
      </div>
    );
  }

  // If absolutely no user/profile, don't render anything (useEffect will handle redirect)
  if (!profile) return null;

  const roleRaw = (profile.role || 'seeker').toLowerCase();
  const currentRole = roleRaw === 'manager' ? 'manager' : 'seeker';
  const firstLetter = (profile.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        role={currentRole} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div className="truncate pr-4">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
              {activeTab === 'profile' 
                ? 'Account Settings' 
                : (currentRole === 'manager' ? 'Hiring Control Center' : 'Candidate Portal')}
            </h1>
            <p className="text-[10px] sm:text-xs text-gray-500 italic flex items-center gap-1">
              Logged in as <span className="font-semibold text-blue-600 uppercase tracking-wider">{currentRole}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-gray-800 leading-none">
                {profile.full_name || 'User'}
              </p>
              <button 
                onClick={handleLogout}
                className="text-[11px] text-red-500 hover:text-red-700 font-bold transition-colors uppercase tracking-tight flex items-center gap-1 ml-auto mt-1"
              >
                Sign Out <FaSignOutAlt size={10} />
              </button>
            </div>
            
            <button 
              onClick={() => setActiveTab('profile')}
              className={`relative w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden shadow-md transition-all active:scale-95 group ${
                activeTab === 'profile' ? 'ring-2 ring-indigo-500 ring-offset-2' : 'hover:shadow-lg'
              }`}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : null}
              <div className={`absolute inset-0 flex items-center justify-center text-white font-bold text-lg bg-gradient-to-tr from-blue-600 to-indigo-500 ${profile.avatar_url ? '-z-10' : 'z-0'}`}>
                {firstLetter}
              </div>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'profile' ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <ProfileSettings />
              </div>
            ) : (
              <div className="animate-in fade-in duration-500">
                {currentRole === 'manager' ? <ManagerView /> : <SeekerView />}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}