import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import toast from 'react-hot-toast';

interface SeekerInvitation {
  id: string;
  project_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  // Nested data from joins
  projects: {
    id: string;
    title: string;
    description: string;
    manager_id: string;
    profiles: {
      full_name: string;
      company_name?: string;
      avatar_url?: string;
    };
  };
}

export function useSeekerInvitations(seekerId: string | undefined) {
  const [invitations, setInvitations] = useState<SeekerInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Invitations where the seeker is the recipient
  const fetchMyInvitations = useCallback(async () => {
    if (!seekerId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        projects:project_id (
          id, title, description, manager_id,
          profiles:manager_id (full_name, avatar_url)
        )
      `)
      .eq('seeker_id', seekerId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Failed to load invitations");
    } else {
      setInvitations(data || []);
    }
    setLoading(false);
  }, [seekerId]);

  // 2. Real-time listener: Refresh list when manager invites or withdraws
  useEffect(() => {
    if (!seekerId) return;

    fetchMyInvitations();

    const channel = supabase
      .channel(`seeker_invites_${seekerId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'invitations',
        filter: `seeker_id=eq.${seekerId}` 
      }, () => {
        fetchMyInvitations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [seekerId, fetchMyInvitations]);

  // 3. The Core Action: Accept or Decline
  const respondToInvitation = async (invitationId: string, status: 'accepted' | 'declined') => {
    const loadingToast = toast.loading(`Processing your ${status}...`);

    try {
      const { error } = await supabase
        .from('invitations')
        .update({ status })
        .eq('id', invitationId);

      if (error) throw error;

      // Optimistic Update: Update local state immediately for a fast UI feel
      setInvitations(prev => 
        prev.map(inv => inv.id === invitationId ? { ...inv, status } : inv)
      );

      toast.success(status === 'accepted' ? 'Invitation Accepted!' : 'Declined', { id: loadingToast });
      return true;
    } catch (err) {
      toast.error("Failed to update status", { id: loadingToast });
      return false;
    }
  };

  return {
    invitations,
    loading,
    respondToInvitation,
    refresh: fetchMyInvitations
  };
}