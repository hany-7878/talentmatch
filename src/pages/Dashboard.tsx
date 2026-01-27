import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import ManagerView from '../components/dashboard/manager/ManagerView';
import SeekerView from '../components/dashboard/seeker/SeekerView';
import SeekerApplications from '../components/dashboard/seeker/SeekerApplications'; // Added this import
import Sidebar from '../components/dashboard/Sidebar';
import ProfileSettings from '../components/dashboard/ProfileSettings';
import GeneralSettings from '../components/dashboard/GeneralSettings';
import { FaSignOutAlt, FaSync } from 'react-icons/fa';

export default function Dashboard() {
  const { profile, logout, isLoading, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<string>('pipeline'); 
  const [isSyncing, setIsSyncing] = useState(false);
  const [appCount, setAppCount] = useState(0);

  // Memoized fetch function so it can be passed down if needed
  const fetchAppCount = useCallback(async () => {
    if (user && profile?.role === 'SEEKER') {
      const { count, error } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (!error) setAppCount(count || 0);
    }
  }, [user, profile]);

  useEffect(() => {
    fetchAppCount();
  }, [fetchAppCount]);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, isLoading, navigate]);

  // Default redirect for Seekers
  useEffect(() => {
    if (profile && activeTab === 'pipeline' && profile.role === 'SEEKER') {
      setActiveTab('discovery');
    }
  }, [profile, activeTab]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleManualRefresh = async () => {
    if (!user) return;
    setIsSyncing(true);
    await refreshProfile(); 
    setIsSyncing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-indigo-600 font-medium">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  if (user && !profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 text-center">
        <div className="max-w-sm p-6 bg-white rounded-2xl shadow-xl border border-gray-100 mx-auto">
          <div className={`w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4 ${isSyncing ? 'animate-spin' : ''}`}></div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Finalizing Profile</h3>
          <button 
            onClick={handleManualRefresh}
            className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-600 text-white rounded-lg font-bold"
          >
            <FaSync className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Checking...' : 'Refresh Status'}
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const currentRole = (profile.role || 'seeker').toLowerCase() === 'manager' ? 'manager' : 'seeker';
  const firstLetter = (profile.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        role={currentRole} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        applicationCount={appCount} 
      />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div className="truncate pr-4">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
              {activeTab === 'profile' ? 'Account Settings' : 
               activeTab === 'settings' ? 'General Settings' : 
               activeTab === 'applications' ? 'My Applications' :
               (currentRole === 'manager' ? 'Hiring Control Center' : 'Job Marketplace')}
            </h1>
            <div className="flex items-center gap-2">
               <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded uppercase tracking-wider">
                 {currentRole}
               </span>
               <span className="text-[10px] text-gray-500 truncate max-w-[150px] font-medium">{user?.email}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-gray-800 leading-none">{profile.full_name || 'User'}</p>
              <button onClick={handleLogout} className="text-[11px] text-red-500 hover:text-red-700 font-bold uppercase flex items-center gap-1 ml-auto mt-1">
                Sign Out <FaSignOutAlt size={10} />
              </button>
            </div>
            
            <button 
              onClick={() => setActiveTab('profile')}
              className={`relative w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden shadow-md transition-all ${
                activeTab === 'profile' ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
              }`}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg bg-gradient-to-tr from-blue-600 to-indigo-500">
                  {firstLetter}
                </div>
              )}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {/* Logic to switch between Profile, Settings, and Role-based Views */}
            {activeTab === 'profile' ? (
              <ProfileSettings />
            ) : activeTab === 'settings' ? (
              <GeneralSettings />
            ) : (
              currentRole === 'manager' ? (
                <ManagerView initialView={activeTab as any} /> 
              ) : (
                /* Seeker Sub-views */
                activeTab === 'applications' ? (
                  <SeekerApplications />
                ) : (
                  <SeekerView onApplicationSent={fetchAppCount} />
                )
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
}