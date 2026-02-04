import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { FaCheckDouble, FaFileDownload } from 'react-icons/fa';

const EMOJIS = ['👍', '🔥', '❤️', '🚀', '✅'];

export default function MessageItem({ msg, isOwn, currentUserId, onReact }: any) {
  const [isHovered, setIsHovered] = useState(false);

  // 1. Performance: Memoize reaction grouping to prevent lag in long chats
  const reactionGroups = useMemo(() => {
    if (!msg.reactions) return {};
    return msg.reactions.reduce((acc: any, curr: any) => {
      if (!acc[curr.emoji]) acc[curr.emoji] = { count: 0, me: false };
      acc[curr.emoji].count += 1;
      if (curr.user_id === currentUserId) acc[curr.emoji].me = true;
      return acc;
    }, {});
  }, [msg.reactions, currentUserId]);

  return (
    <div 
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group relative mb-4 px-2 md:px-4`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`max-w-[85%] md:max-w-[75%] relative flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        
        {/* 2. Reaction Picker UX: High-end animation & Mobile-safe */}
        {/* Hidden on mobile touch, revealed by group-hover on desktop */}
        <div className={`absolute -top-11 ${isOwn ? 'right-0' : 'left-0'} flex gap-1 bg-slate-900 border border-slate-700/50 p-1 rounded-xl shadow-2xl transition-all duration-300 z-30 scale-95 origin-bottom ${
          isHovered ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}>
          {EMOJIS.map((e, i) => (
            <button 
              key={e} 
              onClick={() => onReact(msg.id, e)} 
              style={{ transitionDelay: `${i * 30}ms` }} // Staggered pop-in effect
              className="hover:scale-130 hover:bg-slate-800 p-2 rounded-lg transition-all active:scale-90"
            >
              <span className="drop-shadow-sm text-sm md:text-base">{e}</span>
            </button>
          ))}
        </div>

        {/* 3. Message Bubble with Mobile Polish */}
        <div className={`inline-block px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-md transition-all duration-200 ${
          isOwn 
            ? 'bg-indigo-600 text-white rounded-br-none' 
            : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/50'
        } ${isHovered ? 'shadow-lg brightness-110' : ''}`}>
          
          {msg.file_url && (
            <div className="mb-2 rounded-lg overflow-hidden border border-white/10 bg-black/20">
              {msg.file_type?.startsWith('image') ? (
                <img 
                  src={msg.file_url} 
                  loading="lazy" // Performance for long chats
                  alt="attachment" 
                  className="max-h-64 w-full object-cover hover:scale-105 transition duration-500 cursor-zoom-in" 
                />
              ) : (
                <a href={msg.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 text-[10px] font-black uppercase tracking-widest text-indigo-300 hover:bg-white/5 transition">
                  <FaFileDownload size={14} /> Download File
                </a>
              )}
            </div>
          )}
          
          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        </div>

        {/* 4. Reaction Badges: Visual feedback for 'Me' */}
        {Object.entries(reactionGroups).length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {Object.entries(reactionGroups).map(([emoji, data]: any) => (
              <button
                key={emoji}
                onClick={() => onReact(msg.id, emoji)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] border transition-all active:scale-90 ${
                  data.me 
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' 
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                <span>{emoji}</span>
                <span className="font-bold opacity-80">{data.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* 5. Metadata: Quieter but clear */}
        <div className={`flex items-center gap-2 mt-1.5 opacity-40 text-[9px] font-bold tracking-tight ${isOwn ? 'flex-row' : 'flex-row-reverse'}`}>
          <span className="uppercase">{format(new Date(msg.created_at), 'p')}</span>
          {isMe && (
            <FaCheckDouble 
              size={9} 
              className={msg.is_read ? 'text-indigo-400' : 'text-slate-500'} 
            />
          )}
        </div>
      </div>
    </div>
  );
}