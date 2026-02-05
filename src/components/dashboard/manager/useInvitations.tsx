import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import toast from 'react-hot-toast';

interface Seeker { id: string; full_name: string; avatar_url?: string; }
interface Invitation {
  id: string; 
  project_id: string; 
  seeker_id: string; 
  manager_id?: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string; 
  profiles?: any; 
  projects?: any;
}

export function useInvitations(managerId: string | undefined) {
  const [sentInvitations, setSentInvitations] = useState<Invitation[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. DATA LOADER (Fixed Type Narrowing)
  const fetchInvitations = useCallback(async () => {
    if (!managerId) return;
    
    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        profiles:seeker_id (id, full_name, email, avatar_url), 
        projects:project_id!inner (id, title, manager_id)
      `)
      .eq('manager_id', managerId) 
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      // Map and provide fallbacks to satisfy the Invitation interface
      const sanitized = data.map((inv: any) => ({
  ...inv,
  project_id: inv.project_id ?? '',
  seeker_id: inv.seeker_id ?? '',
  // Tell TS this string is definitely one of our allowed statuses
  status: (inv.status as 'pending' | 'accepted' | 'declined') || 'pending',
})) as Invitation[];
      
      setSentInvitations(sanitized);
    }
  }, [managerId]);

  // 2. REALTIME SYNC
  useEffect(() => {
    if (!managerId) return;
    fetchInvitations();

    const channel = supabase
      .channel(`manager_invites_${managerId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'invitations',
        filter: `manager_id=eq.${managerId}` 
      }, () => fetchInvitations())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [managerId, fetchInvitations]);

  // 3. SEND INVITATION
  const sendInvitation = async (jobId: string, seeker: Seeker) => {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id || managerId;

    if (!currentUserId) {
      toast.error("Session expired. Please refresh.");
      return false;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading(`Inviting ${seeker.full_name}...`);

    try {
      const { data, error } = await supabase
        .from('invitations')
        .upsert(
          { 
            project_id: jobId, 
            seeker_id: seeker.id, 
            manager_id: currentUserId,
            status: 'pending' 
          }, 
          { onConflict: 'project_id,seeker_id' }
        )
        .select(`*, profiles:seeker_id (*), projects:project_id (*)`)
        .single();

      if (error) throw error;

      await supabase.from('messages').insert({
        project_id: jobId,
        sender_id: currentUserId,
        content: `Hi ${seeker.full_name}! I've invited you to collaborate on this project.`
      });

      if (data) {
  const sanitizedInv: Invitation = {
    ...data,
    project_id: data.project_id ?? '',
    seeker_id: data.seeker_id ?? '',
    // Convert null to undefined to satisfy the interface manager_id?: string
    manager_id: data.manager_id ?? undefined, 
    status: (data.status as 'pending' | 'accepted' | 'declined') || 'pending',
    created_at: data.created_at
  };

  setSentInvitations(prev => {
    const filtered = prev.filter(inv => inv.id !== sanitizedInv.id);
    return [sanitizedInv, ...filtered];
  });
}

      toast.success('Invitation Sent!', { id: loadingToast });
      return true;
    } catch (err: any) {
      toast.error(err.message || "Transmission failed", { id: loadingToast });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. THE NAVIGATION BRIDGE
  const goToMessage = (projectId: string, onNavigate: (tab: string) => void) => {
    const newUrl = `${window.location.pathname}?tab=messages&projectId=${projectId}`;
    window.history.pushState({}, '', newUrl);
    onNavigate('messages');
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
    goToMessage, 
    isSubmitting, 
    fetchInvitations 
  };
} 