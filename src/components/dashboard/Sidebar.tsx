import { 
  FaThLarge, FaBriefcase, FaUsers,  
  FaSearch, FaCog, FaMoon, FaSun, FaBars, FaTimes, FaUserCircle 
} from 'react-icons/fa';
import { useState } from 'react';

interface SidebarProps {
  role: 'manager' | 'seeker';
  activeTab: 'overview' | 'profile';
  onTabChange: (tab: 'overview' | 'profile') => void;
} 


export default function Sidebar({ role, activeTab, onTabChange }: SidebarProps) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isOpen, setIsOpen] = useState(false); // Mobile toggle state

  const managerLinks = [
    { name: 'Overview', icon: <FaThLarge />, tab: 'overview' as const },
    { name: 'My Jobs', icon: <FaBriefcase />, tab: 'overview' as const }, // For now, these stay in overview
    { name: 'Applicants', icon: <FaUsers />, tab: 'overview' as const },
  ];

  const seekerLinks = [
    { name: 'Overview', icon: <FaThLarge />, tab: 'overview' as const },
    { name: 'Find Jobs', icon: <FaSearch />, tab: 'overview' as const },
    { name: 'Applications', icon: <FaBriefcase />, tab: 'overview' as const },
  ];

  const links = role === 'manager' ? managerLinks : seekerLinks;

  return (
    <>
      {/* 1. Hamburger Button (Mobile) */}
      <button 
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-md shadow-lg"
        aria-label="Open Menu"
        title="Open Navigation"
      >
        <FaBars />
      </button>

      {/* 2. Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 3. Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:relative lg:translate-x-0
      `}>
        
        {/* Brand Section */}
        <div className="p-6 flex justify-between items-center">
          <div className="text-2xl font-bold text-white flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-xs">TM</div>
            <span className="tracking-tight">TalentMatch</span>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            className="lg:hidden text-slate-400 hover:text-white"
            aria-label="Close Menu"
            title="Close Navigation"
          >
            <FaTimes size={20} />
          </button>
        </div>
        
        {/* Main Navigation */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4 px-2">Main Menu</p>
          
          {links.map((link) => (
            <button 
              key={link.name} 
              onClick={() => {
                onTabChange(link.tab);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${
                activeTab === link.tab && link.name === 'Overview'
                  ? 'bg-blue-600/10 text-blue-400' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className={`transition-colors ${activeTab === link.tab && link.name === 'Overview' ? 'text-blue-400' : 'text-slate-400 group-hover:text-blue-400'}`}>
                {link.icon}
              </span>
              <span className="font-medium text-sm">{link.name}</span>
            </button>
          ))}

          <div className="pt-4 mt-4 border-t border-slate-800">
            <button 
              onClick={() => { onTabChange('profile'); setIsOpen(false); }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${
                activeTab === 'profile' ? 'bg-blue-600/10 text-blue-400' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className={`transition-colors ${activeTab === 'profile' ? 'text-blue-400' : 'text-slate-400 group-hover:text-blue-400'}`}>
                <FaUserCircle />
              </span>
              <span className="font-medium text-sm">My Profile</span>
            </button>
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="p-4 mt-auto border-t border-slate-800 space-y-1">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-full flex items-center gap-3 p-3 hover:bg-slate-800 hover:text-white rounded-xl transition-all text-sm font-medium"
            aria-label="Toggle Dark Mode"
            title="Toggle Dark Mode"
          >
            {isDarkMode ? <FaSun className="text-yellow-500" /> : <FaMoon className="text-blue-400" />}
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button className="w-full flex items-center gap-3 p-3 hover:bg-slate-800 hover:text-white rounded-xl transition-all group">
            <span className="text-slate-400 group-hover:text-blue-400"><FaCog /></span>
            <span className="font-medium text-sm">Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
}