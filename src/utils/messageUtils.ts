import { supabase } from '@/integrations/supabase/client';

/**
 * Upload files to storage and return attachment metadata
 */
export const uploadMessageAttachments = async (
  files: File[],
  userId: string
): Promise<Array<{ name: string; url: string; type: string; size: number }>> => {
  const attachments: Array<{ name: string; url: string; type: string; size: number }> = [];
  
  for (const file of files) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error: uploadError, data } = await supabase.storage
      .from('profile-images')
      .upload(fileName, file);
    
    if (uploadError) {
      throw new Error(`Failed to upload ${file.name}`);
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('profile-images')
      .getPublicUrl(fileName);
    
    attachments.push({
      name: file.name,
      url: publicUrl,
      type: file.type,
      size: file.size
    });
  }
  
  return attachments;
};

/**
 * Create a notification for a new message
 */
export const createMessageNotification = async (
  recipientId: string,
  senderId: string,
  messageText: string,
  jobId: string | null
) => {
  try {
    // Fetch sender's profile to get their name
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', senderId)
      .single();
    
    const senderName = senderProfile?.name || 'Someone';
    
    await supabase.from('notifications').insert({
      user_id: recipientId,
      type: 'new_message',
      title: `New message from ${senderName}`,
      message: messageText.length > 100 
        ? messageText.substring(0, 100) + '...' 
        : messageText,
      payload: {
        job_id: jobId,
        from_user: senderId
      }
    } as any);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};
