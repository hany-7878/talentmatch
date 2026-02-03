import { useEffect, useCallback, useRef, useState, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { useDashboardTabs, DASHBOARD_TABS } from '../hooks/useDashboardTabs';

import Sidebar from '../components/dashboard/Sidebar';
import { LoadingState, FinalizingState } from './DashboardStates';
import { FaArrowUp, FaBars } from 'react-icons/fa';

// Lazy Loaded Views
const ManagerView = lazy(() => import('../components/dashboard/manager/ManagerView'));
const SeekerView = lazy(() => import('../components/dashboard/seeker/SeekerView'));
const MessagingView = lazy(() => import('../components/dashboard/MessagingView'));
const ProfileSettings = lazy(() => import('../components/dashboard/ProfileSettings'));
const GeneralSettings = lazy(() => import('../components/dashboard/GeneralSettings'));
const SeekerApplications = lazy(() => import('../components/dashboard/seeker/SeekerApplications'));

const TAB_LABELS: Record<string, string> = {
  [DASHBOARD_TABS.PIPELINE]: 'Manager Hub',
  [DASHBOARD_TABS.DISCOVERY]: 'Marketplace',
  [DASHBOARD_TABS.MESSAGES]: 'Messages',
  [DASHBOARD_TABS.PROFILE]: 'Profile Settings',
  [DASHBOARD_TABS.SETTINGS]: 'General Settings',
  [DASHBOARD_TABS.APPLICATIONS]: 'My Applications',
  // Management and Invites usually share the Manager Hub header or have their own
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

  /* ================= PERFORMANCE: DEBOUNCED SCROLL ================= */
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    window.requestAnimationFrame(() => {
      setShowScrollTop(scrollTop > 400);
    });
  }, []);

  /* ================= AUTH & NOTIFS ================= */
  useEffect(() => {
    if (!isLoading && !user) navigate('/auth', { replace: true });
  }, [user, isLoading, navigate]);

  // Clean up notifications when viewing messages
  useEffect(() => {
    if (activeTab === DASHBOARD_TABS.MESSAGES && notifs.messages > 0) {
      notifs.markMessagesRead?.();
    }
  }, [activeTab, notifs.messages, notifs.markMessagesRead]);

  const handleMessageRedirect = useCallback((projectId: string) => {
    // setActiveTab updates URL via hook logic
    setActiveTab(DASHBOARD_TABS.MESSAGES);
    // Use navigate to append the specific projectId param
    navigate(`?tab=${DASHBOARD_TABS.MESSAGES}&projectId=${projectId}`);
  }, [navigate, setActiveTab]);

  if (isLoading) return <LoadingState />;
  if (user && !profile) return <FinalizingState onRefresh={refreshProfile} />;
  if (!profile) return null;

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <Sidebar
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
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 sm:px-8 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="p-2.5 lg:hidden rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all active:scale-95"
            >
              <FaBars size={20} />
            </button>
            <div className="flex flex-col">
              <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase leading-none">
                {TAB_LABELS[activeTab] || 'Dashboard'}
              </h1>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                {currentRole} Access
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-xs font-black text-slate-900 leading-none mb-1">{profile.full_name}</p>
              <button 
                onClick={logout} 
                className="text-[9px] text-slate-400 font-black uppercase hover:text-red-500 transition-colors tracking-[0.2em]"
              >
                Sign Out
              </button>
            </div>
            
            <button 
              onClick={() => setActiveTab(DASHBOARD_TABS.PROFILE)} 
              className="relative group w-11 h-11 rounded-2xl ring-2 ring-slate-100 shadow-sm overflow-hidden hover:ring-indigo-500 transition-all active:scale-95"
            >
              <img 
                src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.full_name}&background=6366f1&color=fff`} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
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
               className="h-full overflow-y-auto scroll-smooth custom-scrollbar"
            >
              <div className="p-4 sm:p-8 max-w-[1600px] mx-auto min-h-full">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                  
                  {/* SHARED VIEWS */}
                  {activeTab === DASHBOARD_TABS.MESSAGES && <MessagingView />}
                  {activeTab === DASHBOARD_TABS.PROFILE && <ProfileSettings />}
                  {activeTab === DASHBOARD_TABS.SETTINGS && <GeneralSettings />}
                  
                  {/* MANAGER ROUTING: Handles Pipeline, Management, Discovery (Applicants), and Invites */}
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
                    />
                  )}
                  
                  {/* SEEKER ROUTING */}
                  {currentRole === 'seeker' && (
                    <>
                      {activeTab === DASHBOARD_TABS.DISCOVERY && (
                        <SeekerView onApplicationSent={() => notifs.refresh()} />
                      )}
                      {activeTab === DASHBOARD_TABS.APPLICATIONS && (
                        <SeekerApplications />
                      )}
                    </>
                  )}

                </div>
              </div>

              {showScrollTop && (
                <button
                  onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="fixed bottom-10 right-10 p-4 bg-slate-900 text-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:bg-indigo-600 transition-all z-50 animate-in zoom-in spin-in-90 duration-300 active:scale-90"
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