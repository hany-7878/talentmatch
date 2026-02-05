import { useState, useCallback, memo, useRef, useEffect } from 'react';
// FIX: Use 'import type' for VerbatimModuleSyntax error
import { useNotifications, type UserRole } from '../../../hooks/useNotifications';
import { useAuth } from '../../../context/AuthContext';
import { FaBell } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

export default function NotificationBell() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const role: UserRole = profile?.role?.toLowerCase() === 'manager' ? 'manager' : 'seeker';
  
  // Destructuring will now work because useNotifications return type is explicitly an object
  const { total, messages, invitations, applications, refresh, markMessagesRead } = useNotifications(user?.id, role);

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

  const handleRowClick = useCallback(async (tabName: string, isMessageRow: boolean) => {
    setIsOpen(false);
    if (isMessageRow) await markMessagesRead();
    navigate(`${location.pathname}?tab=${tabName}`);
  }, [navigate, location.pathname, markMessagesRead]);

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen ? "true" : "false"} // FIX: Ensure string value for ARIA
        aria-haspopup="menu"
        aria-label={`${total} notifications`}
        className={`p-2.5 rounded-xl transition-all relative ${
          isOpen ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'
        }`}
      >
        <FaBell size={20} />
        {total > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 border-2 border-white text-[9px] font-black text-white items-center justify-center">
              {total > 9 ? '9+' : total}
            </span>
          </span>
        )}
      </button>

      {/* ARIA FIX: Menu structure */}
      <div 
        role="menu"
        aria-hidden={!isOpen}
        className={`absolute top-full right-0 mt-3 w-72 bg-white shadow-2xl rounded-2xl border border-slate-100 py-3 transition-all z-50 ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {/* Header is not a menuitem, so wrap it or remove role requirements from children */}
        <div className="px-4 pb-2 border-b border-slate-50 mb-2 flex justify-between items-center" role="none">
          <h4 className="text-[10px] font-black text-slate-400 uppercase">Activity Center</h4>
          <button 
            onClick={(e) => { e.stopPropagation(); refresh(); }} 
            className="text-[10px] text-indigo-500 font-bold uppercase"
          >
            Refresh
          </button>
        </div>
        
        <div role="none">
          <NotificationRow label="Messages" count={messages} color="bg-indigo-500" onClick={() => handleRowClick('messages', true)} />
          {role === 'manager' ? (
            <NotificationRow label="Applications" count={applications} color="bg-orange-500" onClick={() => handleRowClick('pipeline', false)} />
          ) : (
            <NotificationRow label="Invitations" count={invitations} color="bg-emerald-500" onClick={() => handleRowClick('invites', false)} />
          )}
        </div>
      </div>
    </div>
  );
}

const NotificationRow = memo(({ label, count, color, onClick }: { label: string; count: number; color: string; onClick: () => void; }) => {
  if (count === 0) return null;
  return (
    <div 
      role="menuitem" 
      tabIndex={0} 
      onClick={onClick} 
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="px-4 py-3 hover:bg-slate-50 flex justify-between items-center cursor-pointer border-l-4 border-transparent hover:border-indigo-500"
    >
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-xs font-bold text-slate-700">{label}</span>
      </div>
      <span className="text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded-md text-slate-500">{count}</span>
    </div>
  );
});