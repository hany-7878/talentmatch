import { FaHashtag, FaCog, FaCheckDouble } from 'react-icons/fa';

/* ================= TYPES ================= */

interface ChatRoom {
  project_id: string;
  seeker_id: string;
  unread_count?: number;
  status: string; // 'pending' | 'accepted' | 'declined'
  seeker_profiles?: {
    full_name: string;
    avatar_url: string | null;
  };
  projects: {
    id: string;
    title: string;
    profiles: {
      full_name: string;
      avatar_url: string | null;
    };
  };
}

interface UserProfile {
  full_name: string;
  role?: string;
  avatar_url?: string;
}

interface ChatSidebarProps {
  chats: ChatRoom[];
  activeChatId?: string; 
  onSelect: (chat: ChatRoom) => void;
  profile?: UserProfile;
  onMarkAllRead: () => void;
}

export default function ChatSidebar({ 
  chats, 
  activeChatId, 
  onSelect, 
  profile, 
  onMarkAllRead 
}: ChatSidebarProps) {
  const isManager = profile?.role?.toLowerCase() === 'manager';

  return (
    <aside className="w-72 border-r border-slate-800 bg-slate-900/40 flex flex-col backdrop-blur-sm shrink-0">
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            Channels
          </span>
          <span className="text-[9px] text-indigo-400 font-bold mt-1">
            {chats.filter(c => (c.unread_count ?? 0) > 0).length} Unread
          </span>
        </div>
        <button 
          onClick={onMarkAllRead}
          className="p-2 text-slate-600 hover:text-indigo-400 transition-all hover:scale-110"
          title="Mark all as read"
        >
          <FaCheckDouble size={14} />
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 px-3 py-1 space-y-1 overflow-y-auto custom-scrollbar">
        {chats.map((chat) => {
          const compositeKey = `${chat.project_id}-${chat.seeker_id}`;
          const isActive = activeChatId === compositeKey;
          const hasUnread = (chat.unread_count ?? 0) > 0;

          // Determine Partner Info
          const partner = isManager ? chat.seeker_profiles : chat.projects.profiles;
          const partnerName = partner?.full_name || 'Anonymous';
          const avatarUrl = partner?.avatar_url;

          // Status-based ring colors for Managers
          const getStatusRing = () => {
            if (!isManager) return 'border-transparent';
            if (chat.status === 'accepted') return 'border-emerald-500/50';
            if (chat.status === 'declined') return 'border-rose-500/50';
            return 'border-amber-500/50'; // pending
          };

          return (
            <button
              key={compositeKey}
              onClick={() => onSelect(chat)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-[0_4px_20px_rgba(79,70,229,0.3)]' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              {/* Profile Picture / Avatar */}
              <div className="relative flex-shrink-0">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt={partnerName}
                    className={`w-10 h-10 rounded-lg object-cover border-2 transition-all ${
                      isActive ? 'border-white/40 scale-105' : `border-transparent ${getStatusRing()}`
                    }`}
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-[11px] font-black border transition-all ${
                    isActive 
                      ? 'bg-white/20 border-white/30' 
                      : `bg-slate-800 border-2 ${getStatusRing()}`
                  }`}>
                    {partnerName.charAt(0).toUpperCase()}
                  </div>
                )}
                
                {/* Unread indicator dot */}
                {hasUnread && !isActive && (
                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-500 border-2 border-slate-900 rounded-full shadow-lg animate-pulse" />
                )}
              </div>
              
              <div className="flex flex-col items-start flex-1 min-w-0">
                <span className={`truncate text-[13px] w-full text-left leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {partnerName}
                </span>
                <span className={`text-[10px] truncate uppercase tracking-tight mt-0.5 font-bold ${isActive ? 'text-indigo-100/70' : 'text-slate-500'}`}>
                  {chat.projects.title}
                </span>
              </div>

              {/* Status indicator for active chat */}
              {isActive && (
                <div className="w-1.5 h-4 bg-white/40 rounded-full" />
              )}
            </button>
          );
        })}

        {chats.length === 0 && (
          <div className="px-3 py-10 text-center opacity-20">
            <FaHashtag size={24} className="mx-auto mb-2" />
            <p className="text-[10px] uppercase font-bold tracking-widest">Inbox Empty</p>
          </div>
        )}
      </div>

      {/* Footer User Profile */}
      <div className="p-3 border-t border-slate-800/30 bg-slate-950/40 backdrop-blur-md">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all group cursor-pointer">
          <div className="relative">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} className="w-9 h-9 rounded-lg object-cover" alt="me" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-black">
                {profile?.full_name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-slate-200 truncate">{profile?.full_name}</p>
            <p className="text-[9px] text-slate-500 font-medium uppercase tracking-tighter mt-0.5">
              {profile?.role}
            </p>
          </div>

          <FaCog size={14} className="text-slate-600 group-hover:text-slate-300 transition-colors" />
        </div>
      </div>
    </aside>
  );
}