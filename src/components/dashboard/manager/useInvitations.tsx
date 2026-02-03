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

  // 1. DATA LOADER
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

  // 3. THE "UPWORK" SEND LOGIC
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
      // Step A: Create the Invitation
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

      // Step B: Send the initial "Handshake" message automatically
      // This ensures the chat room is ready immediately for the Manager to click "Message"
      await supabase.from('messages').insert({
        project_id: jobId,
        sender_id: currentUserId,
        content: `Hi ${seeker.full_name}! I've invited you to collaborate on this project. Let's discuss the details here.`
      });

      setSentInvitations(prev => {
        const filtered = prev.filter(inv => 
          !(inv.project_id === jobId && inv.seeker_id === seeker.id)
        );
        return [data, ...filtered];
      });

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
  // Use this function in your UI for the "Message Seeker" button
  const goToMessage = (projectId: string, onNavigate: (tab: string) => void) => {
    // 1. Set the URL param so MessagingView knows which chat to open
    const newUrl = `${window.location.pathname}?tab=messages&projectId=${projectId}`;
    window.history.pushState({}, '', newUrl);
    
    // 2. Switch the active tab
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
    goToMessage, // Export the bridge function
    isSubmitting, 
    fetchInvitations 
  };
}