import { supabase } from '../lib/supabaseClient';

export interface UploadResult {
  publicUrl: string;
  type: string;
}

export const chatService = {
  async uploadFile(
    projectId: string, 
    file: File, 
    onProgress: (pct: number) => void
  ): Promise<UploadResult> {
    if (file.size > 10 * 1024 * 1024) throw new Error("File exceeds 10MB limit");

    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${projectId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;
    
    onProgress(100);

    const { data } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(filePath);

    if (!data?.publicUrl) throw new Error("Could not generate public URL");

    return { 
      publicUrl: data.publicUrl, 
      type: file.type 
    };
  },

  async toggleReaction(messageId: string, emoji: string, userId: string) {
    const { data: existing, error: fetchError } = await supabase
      .from('message_reactions')
      .select('id')
      .match({ message_id: messageId, user_id: userId, emoji })
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existing) {
      return await supabase
        .from('message_reactions')
        .delete()
        .eq('id', existing.id);
    } else {
      return await supabase
        .from('message_reactions')
        .insert({ 
          message_id: messageId, 
          emoji, 
          user_id: userId 
        });
    }
  }
};