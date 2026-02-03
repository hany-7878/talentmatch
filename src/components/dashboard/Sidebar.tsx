 import { 
  FaThLarge, FaBriefcase, FaUsers,   
  FaCog, FaBars, FaTimes, FaUserCircle, FaRocket, FaPaperPlane, FaComments
} from 'react-icons/fa';
import { useState, useMemo } from 'react';

interface SidebarProps {
  role: 'manager' | 'seeker';
  activeTab: string; 
  onTabChange: (tab: string) => void;
  applicationCount?: number;
  messageCount?: number;
}

export default function Sidebar({ 
  role, 
  activeTab, 
  onTabChange, 
  applicationCount = 0,
  messageCount = 0 
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const links = useMemo(() => {
    // Senior Logic: Helper to format badges so they don't break UI layout
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
          name: 'Applicants', // Changed label for manager side
          icon: <FaUsers />, 
          tab: 'discovery',
          badge: applicationCount > 0 ? formatBadge(applicationCount) : null,
          isAlert: false 
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
        isAlert: false
      },
      messageLink,
    ];
  }, [role, applicationCount, messageCount]);

  const handleTabClick = (tab: string) => {
    onTabChange(tab);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Toggle Trigger */}
      <button 
        title='Open Menu'
        onClick={() => setIsOpen(true)}
        className={`lg:hidden fixed top-6 left-6 z-[60] p-3 bg-indigo-600 text-white rounded-2xl shadow-xl transition-all active:scale-90 ${
          isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <FaBars size={18} />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 z-[70] lg:hidden backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-[80] w-72 bg-slate-950 text-slate-400 flex flex-col h-screen 
        border-r border-slate-800/50 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:relative lg:translate-x-0
      `}>
        
        {/* Brand Header */}
        <div className="p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-700 rounded-2xl flex items-center justify-center text-white font-black italic shadow-lg">
                TM
              </div>
              <div className="flex flex-col">
                <span className="text-white font-black text-lg tracking-tight">TalentMatch</span>
                <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">{role}</span>
              </div>
            </div>
            <button title='close' onClick={() => setIsOpen(false)} className="lg:hidden text-slate-500 hover:text-white p-2">
              <FaTimes size={18} />
            </button>
          </div>
        </div>
        
        {/* Main Navigation */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto mt-4 custom-scrollbar">
          <p className="text-[10px] uppercase tracking-widest text-slate-600 font-black mb-4 px-4">Workspace</p>
          
          {links.map((link) => (
            <button 
              key={link.tab} 
              onClick={() => handleTabClick(link.tab)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group relative ${
                activeTab === link.tab ? 'bg-indigo-600/10 text-white' : 'hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-4">
                {activeTab === link.tab && (
                  <div className="absolute left-0 w-1.5 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                )}
                <span className={`text-lg transition-transform duration-300 group-hover:scale-110 ${
                  activeTab === link.tab ? 'text-indigo-500' : 'text-slate-500 group-hover:text-indigo-400'
                }`}>
                  {link.icon}
                </span>
                <span className="font-bold text-sm tracking-wide">{link.name}</span>
              </div>

              {link.badge && (
                <div className="flex items-center gap-2">
                  <span className={`
                    bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg min-w-[20px] text-center
                    ring-2 ring-slate-950 shadow-lg
                    ${link.isAlert ? 'animate-pulse' : ''}
                  `}>
                    {link.badge}
                  </span>
                </div>
              )}
            </button>
          ))}
        </nav>

        {/* User Footer */}
        <div className="p-4 bg-slate-950/50 border-t border-slate-800/50">
          <button 
            onClick={() => handleTabClick('profile')}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group mb-2 ${
              activeTab === 'profile' ? 'bg-indigo-600/10 text-white' : 'hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            <FaUserCircle className={`text-lg ${activeTab === 'profile' ? 'text-indigo-500' : 'text-slate-500'}`} />
            <span className="font-bold text-sm">My Profile</span>
          </button>

          <button 
            onClick={() => handleTabClick('settings')}
            className={`w-full flex items-center gap-4 px-4 py-3 transition-all group rounded-2xl ${
              activeTab === 'settings' ? 'text-indigo-400 bg-indigo-500/5' : 'text-slate-500 hover:text-indigo-400'
            }`}
          >
            <FaCog className={`transition-all duration-500 ${activeTab === 'settings' ? 'rotate-90 text-indigo-400' : 'group-hover:rotate-90'}`} />
            <span className="font-bold text-[10px] uppercase tracking-widest">Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
}