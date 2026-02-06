import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { FaHashtag, FaArrowDown, FaBars } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { format, isToday, isYesterday } from 'date-fns';
import { RealtimeChannel } from '@supabase/supabase-js';
import type { Database } from '../../types/supabase';
import type { 
  ChatRoom, 
  Message, 
} from '../../types';

// Modular components
import ChatSidebar from './ChatSidebar';
import ChatHeader from './ChatHeader';
import MessageContainer from './MessageContainer';
import MessageInput from './MessageInput';

type DBMessage = Database['public']['Tables']['messages']['Row'];

interface MessagingViewProps {
  onRefreshNotifs?: () => void; 
}

const NOTIFY_SOUND = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');

export default function MessagingView({ onRefreshNotifs }: MessagingViewProps) {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const autoSelectedProjectId = searchParams.get('projectId');
  const recipientId = searchParams.get('recipientId');
  interface UIMessage extends Omit<DBMessage, 'reactions'> {
  isOptimistic?: boolean;
  // Define reactions strictly instead of using 'Json'
  reactions: Array<{
    user_id: string;
    emoji: string;
    full_name: string;
  }> | null;
}
  
  const refreshRef = useRef(onRefreshNotifs);
  useEffect(() => {
    refreshRef.current = onRefreshNotifs;
  }, [onRefreshNotifs]);

  const triggerRefresh = useCallback(() => {
    refreshRef.current?.();
  }, []);

  /* ================= 2. STATE & REFS ================= */
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [activeChat, setActiveChat] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [partnerTyping, setPartnerTyping] = useState(false);
  
  const [showJumpButton, setShowJumpButton] = useState(false);
  const [hasNewUnseen, setHasNewUnseen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roomChannelRef = useRef<RealtimeChannel | null>(null);
  const isFloatingRef = useRef(false);

  /* ================= 3. HELPERS ================= */
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    scrollRef.current?.scrollIntoView({ behavior });
    setShowJumpButton(false);
    setHasNewUnseen(false);
  }, []);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isFloating = scrollHeight - scrollTop - clientHeight > 150;
    
    isFloatingRef.current = isFloating;
    setShowJumpButton(isFloating);
    if (!isFloating) setHasNewUnseen(false);
  };

  const markAsRead = async (projectId: string) => {
    if (!profile?.id) return;
    const now = new Date().toISOString();
    const isManager = profile.role?.toLowerCase() === 'manager';

    await supabase
      .from('invitations')
      .update({ last_read_at: now })
      .eq('project_id', projectId)
      .eq(isManager ? 'manager_id' : 'seeker_id', profile.id);

    setChats(prev => prev.map(c => 
      c.project_id === projectId ? { ...c, last_read_at: now, unread_count: 0 } : c
    ));

    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('project_id', projectId)
      .neq('sender_id', profile.id)
      .eq('is_read', false);

    triggerRefresh();
  };

  const markAllAsRead = async () => {
    if (!profile?.id) return;
    const now = new Date().toISOString();
    const isManager = profile.role?.toLowerCase() === 'manager';

    try {
      await supabase
        .from('invitations')
        .update({ last_read_at: now })
        .in('status', ['accepted', 'pending'])
        .eq(isManager ? 'manager_id' : 'seeker_id', profile.id);

      setChats(prev => prev.map(c => ({ ...c, unread_count: 0, last_read_at: now })));
      triggerRefresh();
      toast.success("Inbox cleared");
    } catch (err) {
      toast.error("Failed to clear notifications");
    }
  };

  const triggerNotification = useCallback((msg: Message) => {
    if (msg.sender_id === profile?.id) return;
    NOTIFY_SOUND.play().catch(() => {});

    if (document.visibilityState !== 'visible' && Notification.permission === 'granted') {
      new Notification(`New Message`, { body: msg.content });
    }
  }, [profile?.id]);

  /* ================= 4. DATA LOADING ================= */
  const loadChats = useCallback(async () => {
    if (!profile?.id) return;
    const isManager = profile.role?.toLowerCase() === 'manager';

    const { data: invitations, error } = await supabase
      .from('invitations')
      .select(`
        project_id, 
        status, 
        last_read_at,
        seeker_id,
        manager_id,
        seeker_profiles:seeker_id ( full_name, avatar_url ),
        projects:project_id (
          id, title, manager_id,
          profiles:projects_manager_id_fkey ( full_name, avatar_url )
        )
      `)
      .in('status', ['accepted', 'pending'])
      .eq(isManager ? 'manager_id' : 'seeker_id', profile.id);

    if (error) return;

    if (invitations) {
      const chatsWithUnreads = await Promise.all(invitations.map(async (chat: any) => {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', chat.project_id)
          .neq('sender_id', profile.id)
          .gt('created_at', chat.last_read_at || '1970-01-01');

        return { ...chat, unread_count: count || 0 };
      }));

      setChats(() => {
        const uniqueMap = new Map();
        chatsWithUnreads.forEach((item: any) => {
          const compositeKey = `${item.project_id}-${item.seeker_id}`;
          uniqueMap.set(compositeKey, item);
        });
        
        const final = Array.from(uniqueMap.values()) as ChatRoom[];

        if (autoSelectedProjectId && !activeChat) {
          const target = final.find(c => 
            c.project_id === autoSelectedProjectId && 
            (!recipientId || c.seeker_id === recipientId)
          );
          if (target) setActiveChat(target);
        } else if (!activeChat && final.length > 0) {
          setActiveChat(final[0]);
        }
        return final;
      });
    }
    setLoading(false);
  }, [profile?.id, autoSelectedProjectId, activeChat, recipientId]);

  /* ================= 5. EFFECTS ================= */
  useEffect(() => {
    if (activeChat && (searchParams.get('projectId') || searchParams.get('recipientId'))) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [activeChat, searchParams]);

  useEffect(() => {
    if (Notification.permission === 'default') Notification.requestPermission();
    loadChats();

    const globalMsgChannel = supabase.channel('global-msg-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, payload => {
        const newMessage = payload.new as Message;
        triggerRefresh();

        if (payload.eventType === 'INSERT' && newMessage.sender_id !== profile?.id) {
          triggerNotification(newMessage);
          setChats(prev => prev.map(chat => {
            if (chat.project_id === newMessage.project_id && activeChat?.project_id !== chat.project_id) {
              return { ...chat, unread_count: (chat.unread_count || 0) + 1 };
            }
            return chat;
          }));
        }
      })
      .subscribe();

    const inviteChannel = supabase.channel('invitation-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invitations' }, () => {
        loadChats();
        triggerRefresh();
      })
      .subscribe();

    return () => { 
      globalMsgChannel.unsubscribe();
      inviteChannel.unsubscribe(); 
    };
    // triggerRefresh is stable, so this dependency array will never change size/order
  }, [loadChats, profile?.id, activeChat?.project_id, triggerNotification, triggerRefresh]);

  useEffect(() => {
    if (!activeChat) return;

    const fetchMessages = async () => {
  // 1. Add this Guard Clause
  if (!activeChat?.project_id) return; 

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('project_id', activeChat.project_id) // Now TS knows this is a string!
    .order('created_at', { ascending: true })
    .limit(100);
  
  if (!error && data) {
    setMessages(data as unknown as UIMessage[]);
    setTimeout(() => scrollToBottom('auto'), 50);
  }
};

    fetchMessages();
    markAsRead(activeChat.project_id ?? '');

    const roomChannel = supabase.channel(`room:${activeChat.project_id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'messages', 
        filter: `project_id=eq.${activeChat.project_id}` 
      }, payload => {
       if (payload.eventType === 'INSERT') {
  const newMessage = payload.new as unknown as UIMessage; // Cast here!
  setMessages(prev => {
    if (prev.some(m => m.id === newMessage.id)) return prev;
    return [...prev, newMessage];
  });
}

if (payload.eventType === 'UPDATE') {
  const updatedMsg = payload.new as unknown as UIMessage; // Cast here too!
  setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
}
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== profile?.id) setPartnerTyping(payload.typing);
      })
      .subscribe();

    roomChannelRef.current = roomChannel;
    return () => { roomChannel.unsubscribe(); roomChannelRef.current = null; };
  }, [activeChat?.project_id, profile?.id, scrollToBottom, triggerRefresh]);

  /* ================= 6. DYNAMIC LOGIC ================= */
  const activeChatPartnerName = useMemo(() => {
    if (!activeChat) return '';
    const isManager = profile?.role?.toLowerCase() === 'manager';
    return isManager 
      ? activeChat.seeker_profiles?.full_name || 'Candidate'
      : activeChat.projects?.profiles?.full_name || 'Project Manager';
  }, [activeChat, profile]);

  const groupedMessages = useMemo(() => {
  const groups: Record<string, UIMessage[]> = {};
    messages.forEach(msg => {
      const date = new Date(msg.created_at ?? new Date().toISOString());
      let label = format(date, 'MMMM d, yyyy');
      if (isToday(date)) label = 'Today';
      else if (isYesterday(date)) label = 'Yesterday';
      if (!groups[label]) groups[label] = [];
      groups[label].push(msg);
    });
    return groups;
  }, [messages]);

  /* ================= 7. HANDLERS ================= */
  const handleUpdateStatus = async (newStatus: 'accepted' | 'declined') => {
  // Add project_id to the check here
  if (!activeChat?.project_id || !profile) return;

  const { error } = await supabase
    .from('invitations')
    .update({ status: newStatus })
    .eq('project_id', activeChat.project_id) // TypeScript now knows this is a string
    .eq(profile.role?.toLowerCase() === 'manager' ? 'manager_id' : 'seeker_id', profile.id);

  if (error) {
    toast.error(error.message);
  } else {
    toast.success(`Project ${newStatus}!`);
    loadChats(); 
    triggerRefresh();
  }
};

  const handleReact = async (messageId: string, emoji: string) => {
    if (!profile) return;
    const targetMsg = messages.find((m) => m.id === messageId);
    if (!targetMsg) return;

    const currentReactions = Array.isArray(targetMsg.reactions) ? targetMsg.reactions : [];
    const existingIndex = currentReactions.findIndex(r => r.user_id === profile.id && r.emoji === emoji);
    const finalReactions = existingIndex > -1 
      ? currentReactions.filter((_, i) => i !== existingIndex)
      : [...currentReactions, { user_id: profile.id, emoji, full_name: profile.full_name }];

    setMessages(prev => prev.map(m => 
  m.id === messageId 
    ? ({ ...m, reactions: finalReactions } as UIMessage) // Explicit cast here
    : m
));
    await supabase.from('messages').update({ reactions: finalReactions }).eq('id', messageId);
  };

  const handleSend = async (file?: File | null) => {
  if (!profile || !activeChat || (!text.trim() && !file)) return;
  const tempId = crypto.randomUUID();
    const optimisticMsg: UIMessage = {
    id: tempId,
    project_id: activeChat.project_id,
    sender_id: profile.id,
    content: text,
    created_at: new Date().toISOString(),
    file_url: null,
    file_type: null,
    is_read: false,
    reactions: [], // Match your interface
    isOptimistic: true, // This now works!
    receiver_id: null // Add missing fields if necessary
  };

  setMessages(prev => [...prev, optimisticMsg]);
    setText('');
    setIsSending(true);

    try {
      let fileUrl = null, fileType = null;
      if (file) {
        const filePath = `${activeChat.project_id}/${tempId}-${file.name}`;
        await supabase.storage.from('chat-attachments').upload(filePath, file);
        fileUrl = supabase.storage.from('chat-attachments').getPublicUrl(filePath).data.publicUrl;
        fileType = file.type;
      }

      const { error } = await supabase.from('messages').insert({
        project_id: activeChat.project_id,
        sender_id: profile.id,
        content: optimisticMsg.content,
        file_url: fileUrl,
        file_type: fileType,
        reactions: []
      });

      if (error) throw error;
      setMessages(prev => prev.filter(m => m.id !== tempId));
      markAsRead(activeChat.project_id ?? '');
    } catch (error: any) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast.error(error.message || "Failed to send");
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = (value: string) => {
    setText(value);
    if (!roomChannelRef.current || !profile) return;
    if (!typingTimeoutRef.current) {
        roomChannelRef.current.send({
            type: 'broadcast', event: 'typing', payload: { userId: profile.id, typing: true }
        });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      roomChannelRef.current?.send({
        type: 'broadcast', event: 'typing', payload: { userId: profile.id, typing: false }
      });
      typingTimeoutRef.current = null;
    }, 2000);
  };

  /* ================= 8. RENDER ================= */
  if (loading && chats.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-dvh max-h-dvh bg-slate-950 overflow-hidden relative">
     <ChatSidebar 
  chats={chats} 
  activeChatId={activeChat ? `${activeChat.project_id}-${activeChat.seeker_id}` : undefined} 
  onSelect={(chat) => {
    setActiveChat(chat);
    setIsSidebarOpen(false);
  }}
  /* --- FIX START --- */
  profile={profile ? {
    full_name: profile.full_name ?? 'User',
    avatar_url: profile.avatar_url ?? null,
    role: profile.role ?? 'SEEKER'
  } : undefined} 
  /* --- FIX END --- */
  onMarkAllRead={markAllAsRead}
  isOpen={isSidebarOpen}    
  onClose={() => setIsSidebarOpen(false)}
/>

      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 border-l border-slate-800/50 overflow-hidden relative">
        <div className="  md:hidden flex items-center p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            title="Send Message" 
            aria-label="Send Message"
            className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
          >
            <FaBars size={20} />
          </button>
          {!activeChat && (
            <span className="ml-4 text-xs font-bold uppercase tracking-widest text-slate-400">
              Messages
            </span>
          )}
        </div>

        {activeChat ? (
          <>
            <ChatHeader 
              title={activeChat.projects?.title ?? 'Untitled Project'}
             partnerName={activeChatPartnerName ?? 'User'}
               status={activeChat.status ?? 'pending'}
              role={profile?.role}
              onUpdateStatus={handleUpdateStatus}
            />

            <MessageContainer 
              groupedMessages={groupedMessages}
              currentUserId={profile?.id}
              partnerTyping={partnerTyping}
              containerRef={containerRef}
              scrollRef={scrollRef}
              onScroll={handleScroll}
              onReact={handleReact}
            />

            {showJumpButton && (
              <button 
                onClick={() => scrollToBottom()}
                className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-5 py-2.5 rounded-full shadow-[0_10px_30px_rgba(79,70,229,0.4)] z-30 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all animate-in slide-in-from-bottom-4"
              >
                <FaArrowDown size={10} /> 
                {hasNewUnseen ? 'New Messages' : 'Jump to Bottom'}
              </button>
            )}

            <MessageInput
              text={text}
              setText={setText}
              onSend={handleSend}
              onTyping={handleTyping}
              isSending={isSending}
            />
          </>
        ) : (
          <div className="m-auto text-center px-6">
            <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-800 shadow-xl">
                <FaHashtag size={32} className="text-slate-700" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">
              Select a project to begin
            </p>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="mt-8 md:hidden text-indigo-400 text-xs font-bold py-2 px-4 border border-indigo-400/30 rounded-full"
            >
              Open Contacts
            </button>
          </div>
        )}
      </main>
    </div>
  );
}