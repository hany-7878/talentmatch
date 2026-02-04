import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useChatRoom(projectId: string | undefined, userId: string | undefined) {
  const [messages, setMessages] = useState<any[]>([]);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const sendTyping = useCallback((isTyping: boolean) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId, typing: isTyping }
    });
  }, [userId]);

  useEffect(() => {
    if (!projectId) return;

    // Fetch initial messages with reactions joined
    const fetchInitial = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*, reactions:message_reactions(user_id, emoji)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };

    fetchInitial();

    const channel = supabase.channel(`room:${projectId}`)
      .on('postgres_changes', { 
        event: '*', schema: 'public', table: 'messages', filter: `project_id=eq.${projectId}` 
      }, async (payload) => {
        if (payload.eventType === 'INSERT') {
          // Re-fetch or manually append with empty reactions
          setMessages(prev => [...prev, { ...payload.new, reactions: [] }]);
        }
      })
      .on('postgres_changes', { 
        event: '*', schema: 'public', table: 'message_reactions' 
      }, () => {
        // Simple strategy: Re-sync reactions on change
        // Advanced: Match the reaction payload to specific message
        fetchInitial(); 
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== userId) setPartnerTyping(payload.typing);
      })
      .subscribe();

    channelRef.current = channel;
    return () => { channel.unsubscribe(); };
  }, [projectId, userId]);

  return { messages, setMessages, partnerTyping, sendTyping };
}