// lib/chatUtils.ts
import { supabase } from './supabaseClient';

export const uploadChatFile = async (projectId: string, file: File) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `${projectId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('chat-attachments')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('chat-attachments')
    .getPublicUrl(filePath);

  return { publicUrl, fileName: file.name, type: file.type };
};