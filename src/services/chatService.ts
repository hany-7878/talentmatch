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

  // Replace your toggleReaction in chatService.ts with this:
async toggleReaction(messageId: string, emoji: string, userId: string, fullName: string | null) {
  // 1. Fetch current reactions from the 'messages' table (which TS knows exists)
  const { data: message, error: fetchError } = await supabase
    .from('messages')
    .select('reactions')
    .eq('id', messageId)
    .single();

  if (fetchError) throw fetchError;

  const currentReactions = Array.isArray(message.reactions) ? (message.reactions as any[]) : [];
  
  const existingIndex = currentReactions.findIndex(
    (r) => r.user_id === userId && r.emoji === emoji
  );

  let updatedReactions;
  if (existingIndex > -1) {
    updatedReactions = currentReactions.filter((_, i) => i !== existingIndex);
  } else {
    updatedReactions = [...currentReactions, { user_id: userId, emoji, full_name: fullName }];
  }

  // 2. Update the JSON column in the 'messages' table
  const { error: updateError } = await supabase
    .from('messages')
    .update({ reactions: updatedReactions })
    .eq('id', messageId);

  if (updateError) throw updateError;

  return updatedReactions;
}}