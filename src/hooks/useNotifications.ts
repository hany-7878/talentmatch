import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

/* ================= TYPES & CONSTANTS ================= */
export type UserRole = 'manager' | 'seeker';

const TABLE = {
  INVITATIONS: 'invitations',
  APPLICATIONS: 'applications',
  MESSAGES: 'messages',
} as const;

export function useNotifications(userId: string | undefined, role: UserRole) {
  const [counts, setCounts] = useState({
    invitations: 0,
    applications: 0,
    messages: 0,
  });
  const [error, setError] = useState<string | null>(null);

  const fetchRef = useRef<() => Promise<void>>();
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Derived state prevents sync bugs between individual counts and the total
  const total = useMemo(() => 
    counts.invitations + counts.applications + counts.messages, 
  [counts]);

  /* ================= DATA FETCHING ================= */
  const fetchAllCounts = useCallback(async () => {
    if (!userId || userId === '') return;

    const isManager = role === 'manager';

    try {
      const results = await Promise.allSettled([
        // 1. Invitations
        supabase.from(TABLE.INVITATIONS)
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending')
          .eq(isManager ? 'manager_id' : 'seeker_id', userId),

        // 2. Applications (Manager sees pending incoming, Seeker sees their own)
        isManager 
          ? supabase.from(TABLE.APPLICATIONS)
              .select('id, projects!inner(manager_id)', { count: 'exact', head: true })
              .eq('projects.manager_id', userId)
              .eq('status', 'pending')
          : supabase.from(TABLE.APPLICATIONS)
              .select('id', { count: 'exact', head: true })
              .eq('user_id', userId),

        // 3. Messages (Direct receiver_id query - NO MORE 400 ERROR)
        supabase.from(TABLE.MESSAGES)
          .select('id', { count: 'exact', head: true })
          .eq('is_read', false)
          .eq('receiver_id', userId)
      ]);

      const extracted = results.map(res => {
        if (res.status === 'fulfilled' && !res.value.error) return res.value.count || 0;
        return 0;
      });

      setCounts({
        invitations: extracted[0],
        applications: extracted[1],
        messages: extracted[2],
      });
      setError(null);
    } catch (err) {
      setError("Failed to sync notifications");
    }
  }, [userId, role]);

  fetchRef.current = fetchAllCounts;

  /* ================= REALTIME & DEBOUNCING ================= */
  const debouncedRefresh = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchRef.current?.();
    }, 300);
  }, []);

  useEffect(() => {
    if (!userId) return;

    fetchAllCounts();

    const isManager = role === 'manager';
    const channel = supabase.channel(`notifs:${userId}`);

    // Incremental Logic for Messages (Updates state without a network fetch)
    channel.on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: TABLE.MESSAGES, 
      filter: `receiver_id=eq.${userId}` 
    }, (payload) => {
      if (payload.eventType === 'INSERT' && !payload.new.is_read) {
        setCounts(prev => ({ ...prev, messages: prev.messages + 1 }));
      } else if (payload.eventType === 'UPDATE' && payload.new.is_read && !payload.old.is_read) {
        setCounts(prev => ({ ...prev, messages: Math.max(0, prev.messages - 1) }));
      } else {
        debouncedRefresh();
      }
    });

    // Role-specific table listeners (Invitations/Applications)
    channel.on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: isManager ? TABLE.APPLICATIONS : TABLE.INVITATIONS 
    }, debouncedRefresh);

    channel.subscribe();

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      supabase.removeChannel(channel);
    };
  }, [userId, role, debouncedRefresh, fetchAllCounts]);

  /* ================= OPTIMISTIC ACTIONS ================= */
  const markMessagesRead = useCallback(async () => {
    if (!userId || counts.messages === 0) return;

    const previousMessages = counts.messages;
    
    // OPTIMISTIC: Clear the UI immediately
    setCounts(prev => ({ ...prev, messages: 0 }));

    const { error } = await supabase
      .from(TABLE.MESSAGES)
      .update({ is_read: true })
      .eq('receiver_id', userId)
      .eq('is_read', false);
    
    if (error) {
      // ROLLBACK: If DB fails, restore previous count
      setCounts(prev => ({ ...prev, messages: previousMessages }));
      setError("Could not mark messages as read");
    }
  }, [userId, counts.messages]);

  return { 
    ...counts, 
    total, 
    error,
    refresh: fetchAllCounts,
    markMessagesRead 
  };
}