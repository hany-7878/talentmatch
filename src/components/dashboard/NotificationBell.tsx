import { useState, useCallback, memo, useRef, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../context/AuthContext';
import { FaBell } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const role = profile?.role?.toLowerCase() === 'manager' ? 'manager' : 'seeker';
  const { total, messages, invitations, applications, refresh } = useNotifications(user?.id, role);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const handleRowClick = useCallback((path: string) => {
    setIsOpen(false);
    navigate(path);
  }, [navigate]);

  return (
    <div className="relative" ref={containerRef}>
      {/* TRIGGER BUTTON */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`${total} notifications`}
        className={`p-2.5 rounded-xl transition-all duration-300 active:scale-90 relative ${
          isOpen ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'
        }`}
      >
        <FaBell size={20} />
        
        {total > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 pointer-events-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white text-[9px] font-black text-white items-center justify-center">
              {total > 9 ? '9+' : total}
            </span>
          </span>
        )}
      </button>

      {/* DROPDOWN MENU */}
      <div 
        role="menu"
        aria-hidden={!isOpen}
        className={`absolute top-full right-0 mt-3 w-72 bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl border border-slate-100 py-3 transition-all duration-300 z-50 origin-top-right ${
          isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
        }`}
      >
        <div className="px-4 pb-2 border-b border-slate-50 mb-2 flex justify-between items-center">
          <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Notifications</h4>
          <button 
            onClick={() => refresh()} 
            className="text-[10px] text-indigo-500 font-bold hover:underline"
          >
            Refresh
          </button>
        </div>
        
        <div className="max-h-80 overflow-y-auto custom-scrollbar">
          <NotificationRow 
            label="Messages" 
            count={messages} 
            color="bg-indigo-500" 
            onClick={() => handleRowClick('?tab=messages')}
          />
          
          {role === 'manager' ? (
            <NotificationRow 
              label="Pending Applications" 
              count={applications} 
              color="bg-orange-500" 
              onClick={() => handleRowClick('?tab=pipeline')}
            />
          ) : (
            <NotificationRow 
              label="New Invitations" 
              count={invitations} 
              color="bg-emerald-500" 
              onClick={() => handleRowClick('?tab=applications')}
            />
          )}
          
          {total === 0 && (
            <div className="px-4 py-8 text-center text-slate-400 text-xs italic">
              All caught up! ✨
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= MEMOIZED ROW COMPONENT ================= */
const NotificationRow = memo(({ label, count, color, onClick }: { 
  label: string; 
  count: number; 
  color: string;
  onClick: () => void;
}) => {
  if (count === 0) return null;

  return (
    <div 
      role="menuitem"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="px-4 py-3 hover:bg-slate-50 transition-all flex justify-between items-center cursor-pointer group/row border-l-2 border-transparent hover:border-indigo-500"
    >
      <div className="flex items-center gap-3">
        <div className={`w-2.5 h-2.5 rounded-full ${color} group-hover/row:scale-110 transition-transform shadow-sm`} />
        <span className="text-xs font-bold text-slate-700">{label}</span>
      </div>
      <span className="text-[10px] font-black bg-slate-100 px-2.5 py-1 rounded-lg text-slate-600 group-hover/row:bg-white group-hover/row:shadow-sm transition-all">
        {count}
      </span>
    </div>
  );
});

NotificationRow.displayName = 'NotificationRow';