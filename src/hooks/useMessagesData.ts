import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  from_user: string;
  to_user: string;
  body: string;
  created_at: string;
  reply_to?: string | null;
  replied_message?: {
    body: string;
    from_profile?: {
      name: string;
    };
  };
  from_profile?: {
    name: string;
    avatar_url: string | null;
  };
}

interface UseMessagesDataProps {
  userId: string | undefined;
  otherUserId: string | null;
  jobId: string | null;
}

export const useMessagesData = ({ userId, otherUserId, jobId }: UseMessagesDataProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadMessages = async (silent: boolean = false) => {
    if (!otherUserId || !userId) return;
    if (!silent && messages.length === 0) setLoading(true);
    
    try {
      let query = supabase.from("messages").select(`
          *,
          from_profile:profiles!messages_from_user_fkey(name, avatar_url)
        `);

      // Filter by job_id if present
      if (jobId) {
        query = query.eq("job_id", jobId);
      } else {
        query = query.is("job_id", null);
      }
      
      const { data, error } = await query
        .or(`and(from_user.eq.${userId},to_user.eq.${otherUserId}),and(from_user.eq.${otherUserId},to_user.eq.${userId})`)
        .order("created_at", { ascending: true });
      
      if (error) throw error;

      // Fetch replied messages separately
      const messagesWithReplies = await Promise.all(
        (data || []).map(async (msg: any) => {
          if (msg.reply_to) {
            const { data: repliedMsg } = await supabase
              .from("messages")
              .select("body, from_profile:profiles!messages_from_user_fkey(name)")
              .eq("id", msg.reply_to)
              .single();
            return { ...msg, replied_message: repliedMsg };
          }
          return msg;
        })
      );
      
      setMessages(messagesWithReplies);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      if (!silent && messages.length === 0) setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    if (!otherUserId || !userId) return;
    
    try {
      let query = supabase
        .from("messages")
        .update({ is_read: true });
      
      if (jobId) {
        query = query.eq("job_id", jobId);
      } else {
        query = query.is("job_id", null);
      }
      
      await query
        .eq("from_user", otherUserId)
        .eq("to_user", userId)
        .eq("is_read", false);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // Set up realtime subscription
  useEffect(() => {
    if (!userId || !otherUserId) return;

    loadMessages();
    markMessagesAsRead();

    const channel = supabase
      .channel(`messages-${jobId || 'direct'}-${otherUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: jobId ? `job_id=eq.${jobId}` : `job_id=is.null`
        },
        (payload) => {
          const newMessage = payload.new as any;
          if (
            (newMessage.from_user === userId && newMessage.to_user === otherUserId) ||
            (newMessage.from_user === otherUserId && newMessage.to_user === userId)
          ) {
            loadMessages(true);
            
            // Mark as read if I'm the recipient
            if (newMessage.to_user === userId) {
              markMessagesAsRead();
            }

            // Check if this is an accepted instant video call invitation
            if (
              newMessage.attachments &&
              typeof newMessage.attachments === 'object' &&
              newMessage.attachments.type === 'video_call_invitation' &&
              newMessage.attachments.status === 'accepted' &&
              newMessage.attachments.callType === 'instant'
            ) {
              // Signal to open video call
              return { shouldOpenVideoCall: true };
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId, otherUserId, userId]);

  return {
    messages,
    loading,
    loadMessages,
    markMessagesAsRead
  };
};
