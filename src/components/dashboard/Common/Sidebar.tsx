import { 
  FaThLarge, FaBriefcase, FaUsers,   
  FaCog, FaTimes, FaUserCircle, FaRocket, FaPaperPlane, FaComments
} from 'react-icons/fa';
import { useMemo, useEffect } from 'react';

interface SidebarProps {
  isOpen: boolean;       
  onClose: () => void;    
  role: 'manager' | 'seeker';
  activeTab: string; 
  onTabChange: (tab: string) => void;
  applicationCount?: number;
  messageCount?: number;
}

export default function Sidebar({ 
  isOpen,                 
  onClose,                
  role, 
  activeTab, 
  onTabChange, 
  applicationCount = 0,
  messageCount = 0 
}: SidebarProps) {

  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const links = useMemo(() => {
    const formatBadge = (count: number) => (count > 99 ? '99+' : count);

    const messageLink = { 
      name: 'Messages', 
      icon: <FaComments />, 
      tab: 'messages',
      badge: messageCount > 0 ? formatBadge(messageCount) : null,
      isAlert: messageCount > 0 
    };

    if (role === 'manager') {
      return [
        { name: 'Dashboard', icon: <FaThLarge />, tab: 'pipeline' },
        { name: 'Active Projects', icon: <FaBriefcase />, tab: 'management' },
        { 
          name: 'Applicants', 
          icon: <FaUsers />, 
          tab: 'discovery',
          badge: applicationCount > 0 ? formatBadge(applicationCount) : null,
          isAlert: applicationCount > 0 
        },
        { name: 'Outreach', icon: <FaPaperPlane />, tab: 'invites' }, 
        messageLink,
      ];
    }

    return [
      { name: 'Explore Jobs', icon: <FaThLarge />, tab: 'discovery' }, 
      { 
        name: 'Applications', 
        icon: <FaRocket />, 
        tab: 'applications',
        badge: applicationCount > 0 ? formatBadge(applicationCount) : null,
        isAlert: applicationCount > 0
      },
      messageLink,
    ];
  }, [role, applicationCount, messageCount]);

  const handleTabClick = (tab: string) => {
    onTabChange(tab);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 z-[70] lg:hidden backdrop-blur-md animate-in fade-in duration-300"
          onClick={onClose} 
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-[80]
          w-72
          bg-slate-950 text-slate-400
          flex flex-col
          h-dvh overflow-hidden
          border-r border-slate-800/50
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0
        `}
      >
        {/* Brand Header */}
        <div className="p-3 lg:px-8 border-b border-slate-800/50 shrink-0 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-700 p-0.5 shadow-xl shadow-indigo-500/20">
                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center overflow-hidden">
                  <img 
                    src="/talentMatch.png" 
                    alt="TalentMatch Logo" 
                    className="w-full h-full object-cover transform scale-110"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML =
                        '<span class="text-white font-black italic">TM</span>';
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-white font-black text-xl tracking-tighter leading-none">
                  TalentMatch
                </span>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                    {role || 'Portal'}
                  </span>
                </div>
              </div>
            </div>

            <button 
              title="Close Sidebar" 
              onClick={onClose} 
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
            >
              <FaTimes size={18} />
            </button>
          </div>
        </div>

        {/* Navigation */}
       <nav className="flex-[0.7_1_0%] md:flex-1 px-4 space-y-1.5 overflow-y-auto overscroll-contain mt-4 custom-scrollbar">
          <p className="text-[10px] uppercase tracking-widest text-slate-600 font-black mb-4 px-4">
            Workspace
          </p>

          {links.map((link) => (
            <button 
              key={link.tab} 
              onClick={() => handleTabClick(link.tab)}
              className={`w-full flex items-center justify-between px-4 py-3 sm:py-3.5 rounded-2xl transition-all group relative ${
                activeTab === link.tab
                  ? 'bg-indigo-600/10 text-white'
                  : 'hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-4">
                {activeTab === link.tab && (
                  <div className="absolute left-0 w-1.5 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                )}
                <span className={`text-lg transition-transform duration-300 group-hover:scale-110 ${
                  activeTab === link.tab
                    ? 'text-indigo-500'
                    : 'text-slate-500 group-hover:text-indigo-400'
                }`}>
                  {link.icon}
                </span>
                <span className="font-bold text-sm tracking-wide">
                  {link.name}
                </span>
              </div>

              {link.badge && (
                <span className={`bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg min-w-[20px] text-center ring-2 ring-slate-950 shadow-lg ${
                  link.isAlert ? 'animate-pulse shadow-[0_0_12px_rgba(79,70,229,0.4)]' : ''
                }`}>
                  {link.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 p-4 pb-safe pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] bg-slate-950/50 border-t border-slate-800/50">
          <button 
            onClick={() => handleTabClick('profile')}
            className={`w-full flex items-center gap-4 px-4 py-3 sm:py-3.5 rounded-2xl transition-all group mb-2 ${
              activeTab === 'profile'
                ? 'bg-indigo-600/10 text-white'
                : 'hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            <FaUserCircle className={`text-lg ${
              activeTab === 'profile' ? 'text-indigo-500' : 'text-slate-500'
            }`} />
            <span className="font-bold text-sm">My Profile</span>
          </button>

          <button 
            onClick={() => handleTabClick('settings')}
            className={`w-full flex items-center gap-4 px-4 py-3 transition-all group rounded-2xl ${
              activeTab === 'settings'
                ? 'text-indigo-400 bg-indigo-500/5'
                : 'text-slate-500 hover:text-indigo-400'
            }`}
          >
            <FaCog className={`transition-all duration-500 ${
              activeTab === 'settings'
                ? 'rotate-90 text-indigo-400'
                : 'group-hover:rotate-90'
            }`} />
            <span className="font-bold text-[10px] uppercase tracking-widest">
              Settings
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
