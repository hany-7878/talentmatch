import { FaHashtag, FaCog, FaCheckDouble, FaTimes } from 'react-icons/fa';
import type { ChatSidebarProps } from '../../types';

export default function ChatSidebar({ 
  chats, 
  activeChatId, 
  onSelect, 
  profile, 
  onMarkAllRead, 
  isOpen,  
  onClose
}: ChatSidebarProps) {
  const isManager = profile?.role?.toLowerCase() === 'manager';

  return (
    <>
      {/* 1. MOBILE BACKDROP 
          Dims the background and allows 'click-to-close' functionality.
      */}
      <div 
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* 2. SIDEBAR ASIDE
          Uses translate-x for 60fps animations. 
          Width is fixed (w-72 or w-80) to prevent text reflow during transition.
      */}
      <aside className={`
        /* Mobile: Floating Overlay */
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 
        transition-transform duration-300 ease-in-out flex flex-col
        
        /* Desktop: Standard Column */
        md:relative md:translate-x-0 md:bg-slate-900/40 md:backdrop-blur-sm md:z-0
        
        /* Toggle Logic */
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-slate-800/30">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
              Channels
            </span>
            <span className="text-[9px] text-indigo-400 font-bold mt-1">
              {chats.filter(c => (c.unread_count ?? 0) > 0).length} Unread
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={onMarkAllRead}
              className="p-2 text-slate-600 hover:text-indigo-400 transition-all"
              title="Mark all as read"
            >
              <FaCheckDouble size={14} />
            </button>
            {/* Mobile-only Close Button */}
            <button onClick={onClose} className="p-2 text-slate-500 md:hidden">
              <FaTimes size={14} />
            </button>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {chats.map((chat) => {
            const compositeKey = `${chat.project_id}-${chat.seeker_id}`;
            const isActive = activeChatId === compositeKey;
            const hasUnread = (chat.unread_count ?? 0) > 0;

            const partner = isManager ? chat.seeker_profiles : chat.projects.profiles;
            const partnerName = partner?.full_name || 'Anonymous';
            const avatarUrl = partner?.avatar_url;

            const getStatusRing = () => {
              if (!isManager) return 'border-transparent';
              if (chat.status === 'accepted') return 'border-emerald-500/50';
              if (chat.status === 'declined') return 'border-rose-500/50';
              return 'border-amber-500/50';
            };

            return (
              <button
                key={compositeKey}
                onClick={() => {
                  onSelect(chat);
                  if (window.innerWidth < 768) onClose(); // Auto-close on mobile
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <div className="relative flex-shrink-0">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      className={`w-10 h-10 rounded-lg object-cover border-2 transition-all ${
                        isActive ? 'border-white/40' : `border-transparent ${getStatusRing()}`
                      }`}
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-[11px] font-black border transition-all ${
                      isActive ? 'bg-white/20 border-white/30' : `bg-slate-800 border-2 ${getStatusRing()}`
                    }`}>
                      {partnerName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {hasUnread && !isActive && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 border-2 border-slate-900 rounded-full animate-pulse" />
                  )}
                </div>
                
                <div className="flex flex-col items-start flex-1 min-w-0 text-left">
                  <span className={`truncate text-[13px] w-full ${isActive ? 'font-bold' : 'font-medium'}`}>
                    {partnerName}
                  </span>
                  <span className={`text-[10px] truncate uppercase tracking-tight mt-0.5 font-bold ${isActive ? 'text-indigo-100/70' : 'text-slate-500'}`}>
                    {chat.projects.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/50 bg-slate-950/40">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all group cursor-pointer">
            <div className="relative">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-9 h-9 rounded-lg object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-black uppercase">
                  {profile?.full_name?.charAt(0)}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-slate-200 truncate">{profile?.full_name}</p>
              <p className="text-[9px] text-slate-500 font-medium uppercase tracking-tighter">{profile?.role}</p>
            </div>
            <FaCog size={14} className="text-slate-600 group-hover:text-slate-300" />
          </div>
        </div>
      </aside>
    </>
  );
}