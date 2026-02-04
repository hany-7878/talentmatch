import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import type { Message } from '../types';

export function useChatRoom(projectId?: string, userId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!projectId) return;
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as Message[]);
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !userId) return;

    fetchMessages();

    const channel = supabase.channel(`project:${projectId}`, {
      config: { broadcast: { self: false } }
    });

    channel
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for ALL changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'messages',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as Message;
            setMessages((prev) => {
              // If we already have this ID (from our optimistic update), 
              // replace it with the real one to clear 'isOptimistic' flag.
              const exists = prev.find((m) => m.id === newMessage.id);
              if (exists) {
                return prev.map((m) => (m.id === newMessage.id ? newMessage : m));
              }
              return [...prev, newMessage];
            });
          }

          if (payload.eventType === 'UPDATE') {
            const updatedMessage = payload.new as Message;
            setMessages((prev) => 
              prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
            );
          }

          if (payload.eventType === 'DELETE') {
            setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
          }
        }
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        setPartnerTyping(payload.typing);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [projectId, userId, fetchMessages]);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId, typing: isTyping },
      });
    }
  }, [userId]);

  return {
    messages,
    setMessages,
    partnerTyping,
    sendTyping
  };
}