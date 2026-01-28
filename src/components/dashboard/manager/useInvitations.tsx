import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import toast from 'react-hot-toast';

// 1. WHY: Interfaces provide "Autocomplete" and catch errors before you save
interface Seeker {
  id: string;
  full_name: string;
  avatar_url?: string;
}

interface Invitation {
  id: string;
  project_id: string;
  seeker_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  profiles?: any;
  projects?: any;
}

export function useInvitations(managerId: string | undefined) {
  const [sentInvitations, setSentInvitations] = useState<Invitation[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. WHY: useCallback prevents the "Infinite Loop" crash in useEffect
  const fetchInvitations = useCallback(async () => {
    if (!managerId) return;
    
    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        profiles:seeker_id (id, full_name, email, avatar_url), 
        projects:project_id!inner (id, title, manager_id)
      `)
      .eq('projects.manager_id', managerId)
      .order('created_at', { ascending: false });
    
    if (!error) setSentInvitations(data || []);
  }, [managerId]);

  // 3. WHY: Real-time keeps the manager's screen "live"
  useEffect(() => {
    if (!managerId) return;

    const channel = supabase
      .channel(`manager_invites_${managerId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'invitations' 
      }, () => {
        fetchInvitations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [managerId, fetchInvitations]);

  const sendInvitation = async (jobId: string, seeker: Seeker) => {
    setIsSubmitting(true);
    // WHY: In .tsx, you could return a <div> here for the toast if you wanted!
    const loadingToast = toast.loading(`Sending pitch to ${seeker.full_name}...`);

    try {
      const { data, error } = await supabase
        .from('invitations')
        .insert([{ project_id: jobId, seeker_id: seeker.id, status: 'pending' }])
        .select(`*, profiles:seeker_id (*), projects:project_id (*)`)
        .single();

      if (error) throw error;

      setSentInvitations(prev => [data, ...prev]);
      toast.success('Invitation Live!', { id: loadingToast });
      return true;
    } catch (err: any) {
      const msg = err.code === '23505' ? "Already invited" : "Transmission failed";
      toast.error(msg, { id: loadingToast });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const withdrawInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase.from('invitations').delete().eq('id', invitationId);
      if (error) throw error;
      setSentInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      toast.success('Withdrawn');
    } catch (err: any) {
      toast.error("Action failed");
    }
  };

  return { 
    sentInvitations, 
    sendInvitation, 
    withdrawInvitation, 
    isSubmitting, 
    fetchInvitations 
  };
}