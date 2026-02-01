import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import toast from 'react-hot-toast';

interface Seeker { id: string; full_name: string; avatar_url?: string; }
interface Invitation {
  id: string; project_id: string; seeker_id: string; manager_id?: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string; profiles?: any; projects?: any;
}

export function useInvitations(managerId: string | undefined) {
  const [sentInvitations, setSentInvitations] = useState<Invitation[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    
    if (!error) setSentInvitations(data || []);
  }, [managerId]);

  useEffect(() => {
    if (!managerId) return;

    const channel = supabase
      .channel(`manager_invites_${managerId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'invitations',
        filter: `manager_id=eq.${managerId}` // Only listen to YOUR invites
      }, () => {
        fetchInvitations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [managerId, fetchInvitations]);

 const sendInvitation = async (jobId: string, seeker: Seeker) => {
  // Use a fresh check of the session to ensure managerId isn't stale
  const { data: { session } } = await supabase.auth.getSession();
  const currentUserId = session?.user?.id || managerId;

  if (!currentUserId) {
    toast.error("Session expired. Please refresh.");
    return false;
  }

  setIsSubmitting(true);
  const loadingToast = toast.loading(`Pitching ${seeker.full_name}...`);

  try {
    const { data, error } = await supabase
      .from('invitations')
      .upsert(
        { 
          project_id: jobId, 
          seeker_id: seeker.id, 
          manager_id: currentUserId, // Use the verified ID
          status: 'pending' 
        }, 
        { onConflict: 'project_id,seeker_id' }
      )
      .select(`*, profiles:seeker_id (*), projects:project_id (*)`)
      .single();

    if (error) throw error;


    setSentInvitations(prev => {
      const filtered = prev.filter(inv => 
        !(inv.project_id === jobId && inv.seeker_id === seeker.id)
      );
      return [data, ...filtered];
    });

    toast.success('Invitation Live!', { id: loadingToast });
    return true;
  } catch (err: any) {
    console.error("Full Error:", err); // Look at your console for the real reason
    toast.error(err.message || "Transmission failed", { id: loadingToast });
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