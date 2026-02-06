import { useEffect, useState } from 'react';
import { format, isToday, isYesterday } from 'date-fns';

interface Props {
  groupedMessages: Record<string, any[]>;
  currentUserId: string | undefined;
  partnerTyping: boolean;
  onReact: (messageId: string, emoji: string) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
}

export default function MessageContainer({ 
  groupedMessages, 
  currentUserId, 
  partnerTyping, 
  onReact,
  containerRef, 
  scrollRef,    
  onScroll     
}: Props) {
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const internalHandleScroll = () => {
    onScroll();
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldAutoScroll(isAtBottom);
  };

  useEffect(() => {
    if (shouldAutoScroll) {
      // Behavior 'auto' is often more reliable on mobile to prevent "jitter"
      scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [groupedMessages, partnerTyping, shouldAutoScroll, scrollRef]);

  return (
    <div 
      ref={containerRef} 
      onScroll={internalHandleScroll}
      /* RESPONSIVE FIX: 
         - Changed flex-1 to flex-[1_1_0%] to ensure it grows/shrinks correctly.
         - overscroll-behavior-y: contain prevents the whole page from bouncing on iOS.
      */
      className="flex-[1_1_0%] overflow-y-auto overscroll-contain px-3 md:px-8 py-4 md:py-6 space-y-6 md:space-y-8 custom-scrollbar bg-slate-950/20"
    >
      <div className="max-w-5xl mx-auto space-y-8 md:space-y-10">
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            <DateSeparator date={date} />
            
            <div className="space-y-4 md:space-y-6">
              {msgs.map((m: any) => {
                const isOwn = m.sender_id === currentUserId;
                const reactions = Array.isArray(m.reactions) ? m.reactions : [];
                
                return (
                  <div 
                    key={m.id} 
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${m.isOptimistic ? 'opacity-50' : 'opacity-100'} transition-opacity`}
                  >
                    {/* RESPONSIVE FIX: max-w increased for mobile screens to use more horizontal space */}
                    <div className={`max-w-[90%] sm:max-w-[80%] md:max-w-[70%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                      <div 
                        className={`group relative text-[13px] px-3.5 py-2.5 md:px-4 md:py-3 rounded-2xl shadow-sm transition-all ${
                          isOwn 
                            ? 'bg-indigo-600 text-white rounded-br-none' 
                            : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/50'
                        }`}
                      >
                        {m.file_url && (
                          <div className="mb-2 rounded-lg overflow-hidden border border-white/10 bg-black/20">
                            {m.file_type?.startsWith('image/') ? (
                              <img src={m.file_url} alt="attachment" className="max-h-60 md:max-h-72 w-full object-contain bg-slate-900" />
                            ) : (
                              <a href={m.file_url} target="_blank" rel="noreferrer" className="p-3 md:p-4 flex items-center gap-3 text-[11px] hover:bg-white/5 transition-colors">
                                <span className="opacity-50">📎</span>
                                <span className="underline truncate">Download Attachment</span>
                              </a>
                            )}
                          </div>
                        )}
                        
                        <p className="leading-relaxed break-words">{m.content}</p>

                        {!m.isOptimistic && (
                          /* RESPONSIVE FIX: 
                             On mobile, buttons are visible by default or slightly larger hit areas 
                          */
                          <button
                            onClick={() => onReact(m.id, '🔥')}
                            className={`absolute -top-2 ${isOwn ? '-left-6 md:-left-8' : '-right-6 md:-right-8'} 
                              opacity-0 group-hover:opacity-100 transition-all bg-slate-800 border border-slate-700 
                              p-1.5 rounded-full text-[10px] shadow-xl z-10 active:scale-125`}
                          >
                            🔥
                          </button>
                        )}
                      </div>

                      {reactions.length > 0 && (
                        <div className={`flex flex-wrap gap-1 mt-1.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          {reactions.map((r: any, i: number) => (
                            <span 
                              key={i} 
                              className={`px-2 py-0.5 rounded-full text-[10px] border ${
                                r.user_id === currentUserId 
                                  ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' 
                                  : 'bg-slate-800 border-slate-700 text-slate-400'
                              }`}
                            >
                              {r.emoji}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <span className="text-[8px] text-slate-600 font-bold uppercase mt-1 tracking-wider px-1">
                        {format(new Date(m.created_at || new Date()), 'p')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {partnerTyping && (
        <div className="flex items-center gap-3 px-2 py-4 opacity-60 max-w-5xl mx-auto">
          <div className="flex gap-1">
            <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" />
            <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
            <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
          <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-500">System Syncing...</span>
        </div>
      )}

      {/* Spacing at bottom to ensure last message isn't hugging the input box */}
      <div ref={scrollRef} className="h-4 w-full shrink-0" />
    </div>
  );
}

function DateSeparator({ date }: { date: string }) {
  let label = date;
  try {
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      label = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'MMMM d, yyyy');
    }
  } catch (e) { label = date; }
  
  return (
    <div className="flex items-center gap-4 my-6 md:my-10 opacity-40">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-700" />
      <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 whitespace-nowrap">{label}</span>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-700" />
    </div>
  );
}