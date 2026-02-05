import { useEffect, useCallback, useRef, useState, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { useDashboardTabs, DASHBOARD_TABS } from '../hooks/useDashboardTabs';
import type { UserRole } from '../types/index';

import Sidebar from '../components/dashboard/Common/Sidebar';
import { LoadingState, FinalizingState } from './DashboardStates';
import { FaArrowUp, FaBars } from 'react-icons/fa';
import Toast from '../components/ui/Toast';

// Lazy Loaded Views
const ManagerView = lazy(() => import('../components/dashboard/manager/ManagerView'));
const SeekerView = lazy(() => import('../components/dashboard/seeker/SeekerView'));
const MessagingView = lazy(() => import('../components/messaging/MessagingView'));
const ProfileSettings = lazy(() => import('../components/dashboard/Common/ProfileSettings'));
const GeneralSettings = lazy(() => import('../components/dashboard/Common/GeneralSettings'));
const SeekerApplications = lazy(() => import('../components/dashboard/seeker/SeekerApplications'));


const BREADCRUMB_MAP: Record<string, string> = {
  [DASHBOARD_TABS.PIPELINE]: 'Manager Hub',
  [DASHBOARD_TABS.DISCOVERY]: 'Marketplace',
  [DASHBOARD_TABS.MESSAGES]: 'Communication Center',
  [DASHBOARD_TABS.PROFILE]: 'Account Profile',
  [DASHBOARD_TABS.SETTINGS]: 'System Settings',
  [DASHBOARD_TABS.APPLICATIONS]: 'My Applications',
  // Manual keys for sub-views
  management: 'Project Inventory',
  invites: 'Talent Outreach'
};

export default function Dashboard() {
  const { profile, logout, isLoading, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const currentRole = (profile?.role?.toLowerCase() as UserRole) || 'seeker';
const isManager = currentRole === 'manager';
  
  const { activeTab, setActiveTab } = useDashboardTabs(profile?.role);
  const notifs = useNotifications(user?.id || '', currentRole);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
 
  // LOGIC PRESERVED: Overscroll Behavior
  useEffect(() => {
    document.body.style.overscrollBehaviorY = 'contain';
    return () => { document.body.style.overscrollBehaviorY = 'auto'; };
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  setToast({ message, type });
  setTimeout(() => setToast(null), 4000);
};
 
const handleActionRefresh = () => {
  notifs.refresh();
  showToast("Dashboard Updated", "success");
};
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    window.requestAnimationFrame(() => {
      setShowScrollTop(scrollTop > 400);
    });
  }, []);

  // LOGIC PRESERVED: Auth Guard
  useEffect(() => {
    if (!isLoading && !user) navigate('/auth', { replace: true });
  }, [user, isLoading, navigate]);

  // LOGIC PRESERVED: Notification Marking
  useEffect(() => {
    if (activeTab === DASHBOARD_TABS.MESSAGES && notifs.messages > 0) {
      notifs.markMessagesRead?.();
      notifs.refresh(); 
    }
  }, [activeTab, notifs.messages]);

  // LOGIC PRESERVED: Message Redirect
  const handleMessageRedirect = useCallback((projectId: string, recipientId: string) => {
    setActiveTab(DASHBOARD_TABS.MESSAGES);
    navigate(`?tab=${DASHBOARD_TABS.MESSAGES}&projectId=${projectId}&recipientId=${recipientId}`);
  }, [navigate, setActiveTab]);

  if (isLoading) return <LoadingState />;
  if (user && !profile) return <FinalizingState onRefresh={refreshProfile} />;
  if (!profile) return null;

  return (
    /* UPGRADE: Use h-dvh and overscroll-contain for that "Locked App" feel */
    <div className="flex h-dvh w-full bg-slate-50 overflow-hidden font-sans selection:bg-indigo-100 overscroll-contain">
      
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        role={currentRole}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab as any);
          setIsSidebarOpen(false);
        }}
        applicationCount={isManager ? notifs.applications : notifs.invitations}
        messageCount={notifs.messages}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 relative h-full">
        {/* UPGRADE: Sticky Header with p-safe-top to avoid mobile notches */}
        <header className="h-20 sm:h-24 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 sm:px-8 flex justify-between items-center sticky top-0 z-40 pt-safe-top">
          <div className="flex items-center gap-4 sm:gap-6">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              aria-label="Open Navigation Menu"
              title="Open Menu"
              className="p-3 lg:hidden rounded-2xl bg-slate-50 text-slate-600 active:scale-90 transition-all shadow-sm"
            >
              <FaBars size={18} />
            </button>
            
            <div className="flex flex-col">
              <nav className="flex items-center gap-2 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
                <span className="hidden sm:inline">Workspace</span>
                <span className="hidden sm:inline text-slate-200">/</span>
                <span className="text-indigo-600">{BREADCRUMB_MAP[activeTab] || 'Dashboard'}</span>
              </nav>

              <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-none truncate max-w-[150px] sm:max-w-none">
                {BREADCRUMB_MAP[activeTab] || 'Dashboard'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="flex flex-col items-end">
              <p className="hidden sm:block text-xs font-black text-slate-900 leading-none mb-1 uppercase tracking-tighter">
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
              aria-label="View Profile Settings"
              title="Profile"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl ring-2 ring-slate-100 shadow-sm overflow-hidden active:scale-90 transition-all hover:ring-indigo-200"
            >
              <img 
                src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.full_name}&background=6366f1&color=fff`} 
                className="w-full h-full object-cover" 
                alt="Your Avatar" 
              />
            </button>
          </div>
        </header>

        {/* VIEWPORT CONTENT */}
        <div className="flex-1 relative overflow-hidden bg-slate-50/50">
          <Suspense fallback={<LoadingState />}>
            {/* UPGRADE: Added no-scrollbar and p-safe-bottom for iOS/PWA bottom bars */}
            <div 
               ref={scrollRef} 
               onScroll={handleScroll} 
               className="h-full overflow-y-auto scrolling-touch no-scrollbar pb-safe-bottom"
            >
              <div className="p-4 sm:p-8 max-w-[1600px] mx-auto min-h-full">
                {/* UPGRADE: Slightly increased slide-in duration for more "app-like" smoothness */}
                <div className="animate-in fade-in slide-in-from-bottom-3 duration-700 ease-out">
                  
                  {activeTab === DASHBOARD_TABS.MESSAGES && <MessagingView />}
               {activeTab === DASHBOARD_TABS.PROFILE && <ProfileSettings />}
               {activeTab === DASHBOARD_TABS.SETTINGS && <GeneralSettings />}
                  
                  {/* LOGIC PRESERVED: Role-based rendering */}
                  {currentRole === 'manager' && [
                    DASHBOARD_TABS.PIPELINE, 
                    DASHBOARD_TABS.DISCOVERY, 
                    'management', 
                    'invites'
                  ].includes(activeTab) && (
                    <ManagerView 
                      initialView={activeTab} 
                      onNavigateToMessages={handleMessageRedirect} 
                      onTabChange={setActiveTab}
                      onActionComplete={handleActionRefresh}
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

              {/* LOGIC PRESERVED: Scroll to top with upgrade safe area margin */}
              {showScrollTop && (
                <button
                title='scroll'
                  onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="fixed bottom-8 right-8 p-4 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-indigo-600 transition-all z-50 active:scale-90 m-safe-bottom"
                >
                  <FaArrowUp size={14} />
                </button>
              )}
            </div>
          </Suspense>
        </div>
        {toast && (
  <div className="fixed top-24 left-1/2 -translate-x-1/2 sm:left-auto sm:right-8 sm:translate-x-0 z-[100] px-4 w-full sm:w-auto">
    <Toast 
      message={toast.message} 
      type={toast.type} 
      onClose={() => setToast(null)} 
    />
  </div>
)}
      </main>
    </div>
  );
}