import { 
  FaThLarge, FaBriefcase, FaUsers,   
  FaSearch, FaCog, FaBars, FaTimes, FaUserCircle, FaRocket
} from 'react-icons/fa';
import { useState } from 'react';

interface SidebarProps {
  role: 'manager' | 'seeker';
  activeTab: string; 
  onTabChange: (tab: string) => void;
}

export default function Sidebar({ role, activeTab, onTabChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const managerLinks = [
    { name: 'Dashboard', icon: <FaThLarge />, tab: 'pipeline' },
    { name: 'Active Projects', icon: <FaBriefcase />, tab: 'management' },
    { name: 'Talent Pool', icon: <FaUsers />, tab: 'discovery' },
  ];

  const seekerLinks = [
    { name: 'Discovery', icon: <FaThLarge />, tab: 'discovery' },
    { name: 'Job Board', icon: <FaSearch />, tab: 'pipeline' },
    { name: 'My Applications', icon: <FaRocket />, tab: 'applications' },
  ];

  const links = role === 'manager' ? managerLinks : seekerLinks;

  return (
    <>
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="lg:hidden fixed top-6 left-6 z-[60] p-3 bg-indigo-600 text-white rounded-2xl shadow-xl"
        >
          <FaBars size={18} />
        </button>
      )}

      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 z-[70] lg:hidden backdrop-blur-md"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-[80] w-72 bg-slate-950 text-slate-400 flex flex-col h-screen 
        border-r border-slate-800/50 transition-all duration-500
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:relative lg:translate-x-0
      `}>
        
        <div className="p-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-700 rounded-2xl flex items-center justify-center text-white font-black italic shadow-lg shadow-indigo-500/20">
                TM
              </div>
              <div className="flex flex-col">
                <span className="text-white font-black text-lg tracking-tight">TalentMatch</span>
                <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">{role} Suite</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-500 hover:text-white">
              <FaTimes size={18} />
            </button>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto mt-4 custom-scrollbar">
          <p className="text-[10px] uppercase tracking-widest text-slate-600 font-black mb-4 px-4">Workspace</p>
          
          {links.map((link) => (
            <button 
              key={link.name} 
              onClick={() => { onTabChange(link.tab); setIsOpen(false); }}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group relative ${
                activeTab === link.tab ? 'bg-indigo-600/10 text-white' : 'hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              {activeTab === link.tab && (
                <div className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full" />
              )}
              <span className={`text-lg transition-transform duration-300 group-hover:scale-110 ${activeTab === link.tab ? 'text-indigo-500' : 'text-slate-500 group-hover:text-indigo-400'}`}>
                {link.icon}
              </span>
              <span className="font-bold text-sm tracking-wide">{link.name}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 bg-slate-950/50 border-t border-slate-800/50">
          <button 
            onClick={() => { onTabChange('profile'); setIsOpen(false); }}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group mb-2 ${
              activeTab === 'profile' ? 'bg-indigo-600/10 text-white' : 'hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            <FaUserCircle className={`text-lg ${activeTab === 'profile' ? 'text-indigo-500' : 'text-slate-500 group-hover:text-indigo-400'}`} />
            <span className="font-bold text-sm">My Profile</span>
          </button>

          <button 
            onClick={() => { onTabChange('settings'); setIsOpen(false); }}
            className={`w-full flex items-center gap-4 px-4 py-3 transition-all group rounded-2xl ${activeTab === 'settings' ? 'text-indigo-400 bg-indigo-500/5' : 'text-slate-500 hover:text-indigo-400'}`}
          >
            <FaCog className={activeTab === 'settings' ? 'rotate-90 text-indigo-400' : 'group-hover:rotate-90'} />
            <span className="font-bold text-[10px] uppercase tracking-widest">Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
}