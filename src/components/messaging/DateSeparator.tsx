import type { MessageContainerProps} from '../../types'; 
import DateSeparator from './DateSeparator';


export default function MessageContainer({
  groupedMessages,
  currentUserId,
  partnerTyping,
  containerRef,
  scrollRef,
  onScroll,
}: MessageContainerProps) {
  return (
    <div 
      ref={containerRef}
      onScroll={onScroll}
      className="flex-1 overflow-y-auto px-8 py-4 custom-scrollbar bg-slate-950/20"
    >
      {Object.entries(groupedMessages).map(([dateLabel, msgs]) => (
        <div key={dateLabel}>
          {/*  Date Separator Component */}
          <DateSeparator date={msgs[0].created_at} />

          <div className="space-y-6">
            {msgs.map((msg) => {
              const isMe = msg.sender_id === currentUserId;
              return (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${msg.isOptimistic ? 'opacity-50' : 'opacity-100'} transition-opacity`}
                >
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                    isMe 
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-500/10' 
                      : 'bg-slate-800 text-slate-200 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-[8px] text-slate-600 font-bold uppercase mt-1 tracking-tight">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Partner Typing Indicator */}
      {partnerTyping && (
        <div className="flex items-center gap-2 text-slate-500 mt-4 animate-pulse">
          <div className="flex gap-1">
            <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" />
            <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]" />
            <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Partner is typing</span>
        </div>
      )}
      <div ref={scrollRef} className="h-2" />
    </div>
  );
}