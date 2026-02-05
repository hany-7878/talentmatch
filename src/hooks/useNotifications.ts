import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

export type UserRole = 'manager' | 'seeker';

const TABLE = {
  INVITATIONS: 'invitations',
  APPLICATIONS: 'applications',
  MESSAGES: 'messages',
} as const;

export function useNotifications(userId: string | undefined, role: UserRole) {
  const [counts, setCounts] = useState({ invitations: 0, applications: 0, messages: 0 });
  const [error, setError] = useState<string | null>(null);
  
  // Ref helps prevent stale closures in the subscription callback
  const fetchAllCounts = useCallback(async () => {
    if (!userId) return;
    
    try {
      const isManager = role === 'manager';
      
      const [invRes, appRes, msgRes] = await Promise.all([
        // 1. Pending Invitations (sent to seeker or from manager)
        supabase.from(TABLE.INVITATIONS)
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending')
          .eq(isManager ? 'manager_id' : 'seeker_id', userId),
        
        // 2. Pending Applications (Managers see new, Seekers see updates)
        isManager 
          ? supabase.from(TABLE.APPLICATIONS)
              .select('id, projects!inner(manager_id)', { count: 'exact', head: true })
              .eq('projects.manager_id', userId)
              .eq('status', 'pending')
          : supabase.from(TABLE.APPLICATIONS)
              .select('id', { count: 'exact', head: true })
              .eq('user_id', userId)
              .neq('status', 'pending'),

        // 3. Unread Messages (where I am NOT the sender)
        supabase.from(TABLE.MESSAGES)
          .select('id', { count: 'exact', head: true })
          .eq('is_read', false)
          .neq('sender_id', userId) // Logic: If I didn't send it and it's unread, it's a notification for me
          .eq('receiver_id', userId) // Added back for strictness, ensure this column exists!
      ]);

      setCounts({
        invitations: invRes.count || 0,
        applications: appRes.count || 0,
        messages: msgRes.count || 0,
      });
    } catch (err) {
      console.error("Notification Sync Error:", err);
      setError("Sync failed");
    }
  }, [userId, role]);

  useEffect(() => {
    if (!userId) return;

    fetchAllCounts();

    // Listen for any changes on these tables. 
    // We fetch fresh counts whenever a relevant change happens.
    const channel = supabase.channel(`notifs_${userId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: TABLE.MESSAGES 
      }, () => fetchAllCounts())
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: TABLE.APPLICATIONS 
      }, () => fetchAllCounts())
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: TABLE.INVITATIONS 
      }, () => fetchAllCounts())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchAllCounts]);

  const markMessagesRead = useCallback(async () => {
    if (!userId) return;
    
    // Optimistic UI update
    setCounts(prev => ({ ...prev, messages: 0 }));

    const { error } = await supabase
      .from(TABLE.MESSAGES)
      .update({ is_read: true })
      .eq('receiver_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error("Failed to mark messages as read:", error);
      fetchAllCounts(); // Revert on failure
    }
  }, [userId, fetchAllCounts]);

  const total = useMemo(() => 
    counts.invitations + counts.applications + counts.messages, 
  [counts]);

  return {
    ...counts,
    total,
    error,
    refresh: fetchAllCounts,
    markMessagesRead
  };
}