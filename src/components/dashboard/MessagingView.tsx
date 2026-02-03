import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { 
  FaPaperPlane, FaHashtag, FaInfoCircle, 
  FaCheckDouble, FaArrowDown 
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { format, isToday, isYesterday } from 'date-fns';

/* ================= TYPES ================= */

interface Message {
  id: string;
  project_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  isOptimistic?: boolean;
}

interface ChatRoom {
  project_id: string;
  status: 'pending' | 'accepted' | 'declined';
  last_read_at: string;
  projects: {
    id: string;
    title: string;
    manager_id: string;
    profiles: {
      full_name: string;
      avatar_url: string | null;
    };
  };
}

const NOTIFY_SOUND = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');

export default function MessagingView() {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const autoSelectedProjectId = searchParams.get('projectId');

  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [activeChat, setActiveChat] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [partnerTyping, setPartnerTyping] = useState(false);
  
  const [showJumpBotton, setShowJumpButton] = useState(false);
  const [hasNewUnseen, setHasNewUnseen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ================= 1. HELPERS ================= */

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    scrollRef.current?.scrollIntoView({ behavior });
    setShowJumpButton(false);
    setHasNewUnseen(false);
  }, []);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isFloating = scrollHeight - scrollTop - clientHeight > 150;
    setShowJumpButton(isFloating);
    if (!isFloating) setHasNewUnseen(false);
  };

  const markAsRead = async (projectId: string) => {
    if (!profile?.id) return;
    const now = new Date().toISOString();

    // 1. Update invitations (for legacy tracking)
    await supabase
      .from('invitations')
      .update({ last_read_at: now })
      .eq('project_id', projectId)
      .match(profile.role === 'manager' ? { manager_id: profile.id } : { seeker_id: profile.id });

    // 2. Update messages (for the useNotifications badge count)
    // Marks messages as read that weren't sent by the current user
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('project_id', projectId)
      .neq('sender_id', profile.id)
      .eq('is_read', false);
    
    setChats(prev => prev.map(c => c.project_id === projectId ? { ...c, last_read_at: now } : c));
  };

  const triggerNotification = useCallback((msg: any) => {
    if (msg.sender_id === profile?.id) return;
    NOTIFY_SOUND.play().catch(() => {});

    if (document.visibilityState !== 'visible' && Notification.permission === 'granted') {
      new Notification(`New Message: ${activeChat?.projects.title || 'Project Chat'}`, {
        body: msg.content,
      });
    }

    if (activeChat?.project_id !== msg.project_id) {
        toast(`New message in ${activeChat?.projects.title}`, { icon: '💬' });
    }
  }, [profile?.id, activeChat]);

  /* ================= 2. DATA LOADING ================= */

  const loadChats = useCallback(async () => {
    if (!profile?.id) return;
    const isManager = profile.role?.toLowerCase() === 'manager';

    const { data } = await supabase
      .from('invitations')
      .select(`
        project_id, status, last_read_at,
        projects!project_id (
          id, title, manager_id,
          profiles!projects_manager_id_fkey ( full_name, avatar_url )
        )
      `)
      .in('status', ['accepted', 'pending'])
      .eq(isManager ? 'manager_id' : 'seeker_id', profile.id);

    if (data) {
      // FIX: Filter duplicates by project_id to prevent "Encountered two children with the same key"
      const uniqueData = data.filter((v, i, a) => 
        a.findIndex(t => t.project_id === v.project_id) === i
      );

      const formatted = uniqueData as unknown as ChatRoom[];
      setChats(formatted);
      if (autoSelectedProjectId) {
        const target = formatted.find(c => c.project_id === autoSelectedProjectId);
        if (target) setActiveChat(target);
      } else if (!activeChat && formatted.length > 0) {
        setActiveChat(formatted[0]);
      }
    }
    setLoading(false);
  }, [profile?.id, autoSelectedProjectId, activeChat]);

  /* ================= 3. REALTIME & SYNC ================= */

  useEffect(() => {
    if (Notification.permission === 'default') Notification.requestPermission();
  }, []);

  useEffect(() => {
    loadChats();
    const inviteChannel = supabase.channel('invitation-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invitations' }, loadChats)
      .subscribe();
    return () => { inviteChannel.unsubscribe(); };
  }, [loadChats]);

  useEffect(() => {
    if (!activeChat) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('project_id', activeChat.project_id)
        .order('created_at', { ascending: true });
      if (data) {
        setMessages(data as Message[]);
        setTimeout(() => scrollToBottom('auto'), 50);
      }
    };

    fetchMessages();
    markAsRead(activeChat.project_id);

    const handleSync = () => {
      if (document.visibilityState === 'visible') {
        fetchMessages();
        markAsRead(activeChat.project_id);
      }
    };

    window.addEventListener('focus', handleSync);
    document.addEventListener('visibilitychange', handleSync);

    const roomChannel = supabase.channel(`room:${activeChat.project_id}`)
      .on('postgres_changes', { 
        event: 'INSERT', schema: 'public', table: 'messages', 
        filter: `project_id=eq.${activeChat.project_id}` 
      }, payload => {
        const newMessage = payload.new as Message;
        triggerNotification(newMessage);

        setMessages(prev => {
          const exists = prev.some(m => 
            m.id === newMessage.id || 
            (m.isOptimistic && m.content === newMessage.content && m.sender_id === newMessage.sender_id)
          );
          
          if (exists) {
            return prev.map(m => 
              (m.isOptimistic && m.content === newMessage.content) ? newMessage : m
            );
          }
          
          if (showJumpBotton) setHasNewUnseen(true);
          return [...prev, newMessage];
        });
        
        setPartnerTyping(false);
        if (!showJumpBotton) {
            markAsRead(activeChat.project_id);
            setTimeout(scrollToBottom, 50);
        }
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== profile?.id) setPartnerTyping(payload.typing);
      })
      .subscribe();

    return () => { 
      roomChannel.unsubscribe(); 
      window.removeEventListener('focus', handleSync);
      document.removeEventListener('visibilitychange', handleSync);
    };
  }, [activeChat?.project_id, profile?.id, showJumpBotton, triggerNotification, scrollToBottom]);

  /* ================= 4. HANDLERS ================= */

  const handleUpdateStatus = async (newStatus: 'accepted' | 'declined') => {
    if (!activeChat || !profile) return;
    const { error } = await supabase
      .from('invitations')
      .update({ status: newStatus })
      .eq('project_id', activeChat.project_id)
      .eq('seeker_id', profile.id);

    if (error) toast.error(`Error: ${error.message}`);
    else {
        toast.success(`Project ${newStatus}!`);
        loadChats(); 
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeChat || !profile) return;

    const content = text;
    const tempId = `optimistic-${crypto.randomUUID()}`;
    
    setMessages(prev => [...prev, {
      id: tempId, project_id: activeChat.project_id, sender_id: profile.id,
      content, created_at: new Date().toISOString(), isOptimistic: true
    }]);
    
    setText('');
    setIsSending(true);
    scrollToBottom();

    const { error } = await supabase.from('messages').insert({
      project_id: activeChat.project_id, 
      sender_id: profile.id, 
      content,
      is_read: false // Explicitly set to false for the recipient
    });

    if (error) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setText(content);
      toast.error('Failed to send');
    }
    setIsSending(false);
  };

  const handleTyping = (value: string) => {
    setText(value);
    if (!activeChat || !profile) return;
    supabase.channel(`room:${activeChat.project_id}`).send({
      type: 'broadcast', event: 'typing', payload: { userId: profile.id, typing: true }
    });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      supabase.channel(`room:${activeChat.project_id}`).send({
        type: 'broadcast', event: 'typing', payload: { userId: profile.id, typing: false }
      });
    }, 1500);
  };

  const groupedMessages = useMemo(() => {
    const groups: Record<string, Message[]> = {};
    messages.forEach(msg => {
      const date = new Date(msg.created_at);
      let label = format(date, 'MMMM d, yyyy');
      if (isToday(date)) label = 'Today';
      else if (isYesterday(date)) label = 'Yesterday';
      if (!groups[label]) groups[label] = [];
      groups[label].push(msg);
    });
    return groups;
  }, [messages]);

  if (loading && chats.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-950">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
      <aside className="w-64 border-r border-slate-800 bg-slate-900/40 flex flex-col">
        <div className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Channels</div>
        <div className="flex-1 px-3 space-y-1 overflow-y-auto">
          {chats.map((chat, idx) => (
            <button
              // FIX: Use composite key with index to ensure uniqueness
              key={`chat-${chat.project_id}-${idx}`}
              onClick={() => setActiveChat(chat)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition group ${
                activeChat?.project_id === chat.project_id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <FaHashtag size={12} className="opacity-30" />
              <span className="truncate text-sm font-bold flex-1 text-left">{chat.projects.title}</span>
              {chat.project_id !== activeChat?.project_id && (
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative bg-slate-950">
        {activeChat ? (
          <>
            {activeChat.status === 'pending' && profile?.role === 'seeker' && (
              <div className="bg-indigo-600 px-6 py-2.5 flex items-center justify-between z-10 shadow-xl animate-in slide-in-from-top duration-300">
                <div className="flex items-center gap-2 text-white">
                  <FaInfoCircle size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Pending Invitation</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleUpdateStatus('accepted')} className="bg-white text-indigo-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase hover:scale-105 transition">Accept</button>
                  <button onClick={() => handleUpdateStatus('declined')} className="bg-indigo-700 text-indigo-200 px-3 py-1 rounded-lg text-[9px] font-black uppercase hover:bg-indigo-800 transition">Decline</button>
                </div>
              </div>
            )}

            <header className="px-8 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/10">
              <div>
                <h3 className="text-white font-bold leading-none">#{activeChat.projects.title.toLowerCase().replace(/\s+/g, '-')}</h3>
                <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mt-1">Collab: {activeChat.projects.profiles.full_name}</p>
              </div>
            </header>

            <div 
              ref={containerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-8 py-6 space-y-8 custom-scrollbar relative"
            >
              {Object.entries(groupedMessages).map(([date, msgs]) => (
                <div key={`group-${date}`}>
                  <div className="flex items-center gap-4 my-6">
                    <div className="h-px flex-1 bg-slate-800/50" />
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">{date}</span>
                    <div className="h-px flex-1 bg-slate-800/50" />
                  </div>
                  <div className="space-y-6">
                    {msgs.map((m, idx) => (
                      <div key={`msg-${m.id}-${idx}`} className={`flex ${m.sender_id === profile?.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] ${m.sender_id === profile?.id ? 'text-right' : 'text-left'}`}>
                          <div className={`inline-block px-4 py-3 rounded-2xl text-[13px] leading-relaxed ${
                            m.sender_id === profile?.id ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/30'
                          } ${m.isOptimistic ? 'opacity-40 animate-pulse' : ''}`}>
                            {m.content}
                          </div>
                          <div className="flex items-center gap-1 mt-1.5 justify-end opacity-30">
                            <span className="text-[9px] font-bold uppercase text-slate-500">{format(new Date(m.created_at), 'p')}</span>
                            {m.sender_id === profile?.id && !m.isOptimistic && <FaCheckDouble size={8} className="text-indigo-400" />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {partnerTyping && (
                <div className="flex items-center gap-2 text-[9px] font-black text-indigo-500 uppercase tracking-widest animate-pulse">
                  <div className="flex gap-1"><div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" /><div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" /></div>
                  Collaborator Typing
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            {showJumpBotton && (
                <button 
                  onClick={() => scrollToBottom()}
                  className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all animate-in fade-in slide-in-from-bottom-4"
                >
                    <FaArrowDown size={10} /> 
                    {hasNewUnseen ? 'New Messages Below' : 'Jump to Latest'}
                </button>
            )}

            <form onSubmit={handleSend} className="p-6 pt-0 bg-slate-950">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 focus-within:ring-1 ring-indigo-500/50 transition-all">
                <textarea
                  value={text}
                  onChange={e => {
                    handleTyping(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  rows={1}
                  placeholder="Collaborate..."
                  className="w-full bg-transparent resize-none border-none px-4 py-3 text-sm text-white focus:ring-0 placeholder-slate-700 max-h-40 custom-scrollbar"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                />
                <div className="flex justify-end p-1">
                  <button type="submit" disabled={!text.trim() || isSending} className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-600/20">
                    <FaPaperPlane size={12} />
                  </button>
                </div>
              </div>
            </form>
          </>
        ) : (
          <div className="m-auto text-center opacity-20">
            <FaHashtag size={48} className="mx-auto mb-4 text-slate-700" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Select Channel</p>
          </div>
        )}
      </main>
    </div>
  );
}