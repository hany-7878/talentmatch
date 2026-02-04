import { useEffect, useCallback, useRef, useState, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { useDashboardTabs, DASHBOARD_TABS } from '../hooks/useDashboardTabs';

import Sidebar from '../components/dashboard/Common/Sidebar';
import { LoadingState, FinalizingState } from './DashboardStates';
import { FaArrowUp, FaBars } from 'react-icons/fa';

// Lazy Loaded Views
const ManagerView = lazy(() => import('../components/dashboard/manager/ManagerView'));
const SeekerView = lazy(() => import('../components/dashboard/seeker/SeekerView'));
const MessagingView = lazy(() => import('../components/messaging/MessagingView'));
const ProfileSettings = lazy(() => import('../components/dashboard/Common/ProfileSettings'));
const GeneralSettings = lazy(() => import('../components/dashboard/Common/GeneralSettings'));
const SeekerApplications = lazy(() => import('../components/dashboard/seeker/SeekerApplications'));

const TAB_LABELS: Record<string, string> = {
  [DASHBOARD_TABS.PIPELINE]: 'Manager Hub',
  [DASHBOARD_TABS.DISCOVERY]: 'Marketplace',
  [DASHBOARD_TABS.MESSAGES]: 'Messages',
  [DASHBOARD_TABS.PROFILE]: 'Profile Settings',
  [DASHBOARD_TABS.SETTINGS]: 'General Settings',
  [DASHBOARD_TABS.APPLICATIONS]: 'My Applications',
  management: 'Project Management',
  invites: 'Outreach & Invites'
};

export default function Dashboard() {
  const { profile, logout, isLoading, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const currentRole = profile?.role?.toLowerCase() === 'manager' ? 'manager' : 'seeker';
  
  const { activeTab, setActiveTab } = useDashboardTabs(profile?.role);
  const notifs = useNotifications(user?.id || '', currentRole);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

 
  useEffect(() => {
    document.body.style.overscrollBehaviorY = 'contain';
    return () => { document.body.style.overscrollBehaviorY = 'auto'; };
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    window.requestAnimationFrame(() => {
      setShowScrollTop(scrollTop > 400);
    });
  }, []);

  
  useEffect(() => {
    if (!isLoading && !user) navigate('/auth', { replace: true });
  }, [user, isLoading, navigate]);

  
  useEffect(() => {
    if (activeTab === DASHBOARD_TABS.MESSAGES && notifs.messages > 0) {
      notifs.markMessagesRead?.();
    }
  }, [activeTab, notifs.messages, notifs.markMessagesRead]);

  const handleMessageRedirect = useCallback((projectId: string, recipientId: string) => {
  setActiveTab(DASHBOARD_TABS.MESSAGES);
  navigate(`?tab=${DASHBOARD_TABS.MESSAGES}&projectId=${projectId}&recipientId=${recipientId}`);
}, [navigate, setActiveTab]);

  if (isLoading) return <LoadingState />;
  if (user && !profile) return <FinalizingState onRefresh={refreshProfile} />;
  if (!profile) return null;

  return (
    <div className="flex h-[100dvh] w-full bg-slate-50 overflow-hidden font-sans selection:bg-indigo-100">
      
      {/* SIDEBAR */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        role={currentRole}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab as any);
          setIsSidebarOpen(false);
        }}
        applicationCount={currentRole === 'manager' ? notifs.applications : notifs.invitations}
        messageCount={notifs.messages}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 relative h-full">
        {/* HEADER */}
        <header className="h-20 sm:h-24 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 sm:px-8 flex justify-between items-center sticky top-0 z-40 pt-[env(safe-area-inset-top)]">
          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="p-3 lg:hidden rounded-2xl bg-slate-50 text-slate-600 active:scale-95 transition-all shadow-sm"
            >
              <FaBars size={18} />
            </button>
            <div className="flex flex-col">
              <h1 className="text-sm sm:text-lg font-black text-slate-900 tracking-tight uppercase leading-tight truncate max-w-[110px] sm:max-w-none">
                {TAB_LABELS[activeTab] || 'Dashboard'}
              </h1>
              <span className="text-[8px] sm:text-[10px] text-indigo-600 font-bold uppercase tracking-widest">
                {currentRole} Access
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            {/* User Info & Restored Sign Out */}
            <div className="flex flex-col items-end">
              <p className="hidden sm:block text-xs font-black text-slate-900 leading-none mb-1">
                {profile.full_name}
              </p>
              <button 
                onClick={logout} 
                className="text-[10px] sm:text-[9px] text-slate-400 font-black uppercase hover:text-red-500 active:scale-95 transition-all tracking-widest bg-slate-100 sm:bg-transparent px-2 py-1 sm:p-0 rounded-lg"
              >
                Sign Out
              </button>
            </div>
            
            <button 
              onClick={() => setActiveTab(DASHBOARD_TABS.PROFILE)} 
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl ring-2 ring-slate-100 shadow-sm overflow-hidden active:scale-90 transition-all"
            >
              <img 
                src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.full_name}&background=6366f1&color=fff`} 
                className="w-full h-full object-cover" 
                alt="Profile" 
              />
            </button>
          </div>
        </header>

        {/* VIEWPORT CONTENT */}
        <div className="flex-1 relative overflow-hidden bg-slate-50/50">
          <Suspense fallback={<LoadingState />}>
            <div 
               ref={scrollRef} 
               onScroll={handleScroll} 
               className="h-full overflow-y-auto scroll-smooth custom-scrollbar pb-[env(safe-area-inset-bottom)]"
            >
              <div className="p-4 sm:p-8 max-w-[1600px] mx-auto min-h-full">
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  
                  {/* Shared Views */}
                  {activeTab === DASHBOARD_TABS.MESSAGES && <MessagingView />}
                  {activeTab === DASHBOARD_TABS.PROFILE && <ProfileSettings />}
                  {activeTab === DASHBOARD_TABS.SETTINGS && <GeneralSettings />}
                  
                  {/* Manager Specific Routing */}
                  {currentRole === 'manager' && [
                    DASHBOARD_TABS.PIPELINE, 
                    DASHBOARD_TABS.DISCOVERY, 
                    'management', 
                    'invites'
                  ].includes(activeTab) && (
                    <ManagerView 
                      initialView={activeTab} 
                      onNavigateToMessages={(projId, recipId) => handleMessageRedirect(projId, recipId)} 
                      onTabChange={setActiveTab} 
                    />
                  )}
                  
                 
                  {currentRole === 'seeker' && (
                    <>
                      {activeTab === DASHBOARD_TABS.DISCOVERY && (
  <SeekerView 
    onApplicationSent={() => notifs.refresh()} 
    onNavigateToMessages={handleMessageRedirect} 
  />

                      )}
                      {activeTab === DASHBOARD_TABS.APPLICATIONS && (
                        <SeekerApplications />
                      )}
                    </>
                  )}

                </div>
              </div>

              {/* Scroll to Top - Only on desktop or large lists */}
              {showScrollTop && (
                <button
                  onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="fixed bottom-8 right-8 p-4 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-indigo-600 transition-all z-50 active:scale-90"
                >
                  <FaArrowUp size={14} />
                </button>
              )}
            </div>
          </Suspense>
        </div>
      </main>
    </div>
  );
}