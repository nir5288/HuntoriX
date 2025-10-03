import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { MessageThread } from "@/components/MessageThread";
import { MessageInput } from "@/components/MessageInput";
import { supabase } from "@/integrations/supabase/client";

interface EngagementMessagesProps {
  engagementId: string;
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
}

export function EngagementMessages({
  engagementId,
  currentUserId,
  otherUserId,
  otherUserName,
}: EngagementMessagesProps) {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    loadMessages();
    markMessagesAsRead();

    const channel = supabase
      .channel(`engagement-messages-${engagementId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `engagement_id=eq.${engagementId}`,
        },
        () => {
          loadMessages();
          markMessagesAsRead();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [engagementId]);

  const loadMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*, from_profile:from_user(name, avatar_url)")
      .eq("engagement_id", engagementId)
      .order("created_at", { ascending: true });

    if (data) setMessages(data);
  };

  const markMessagesAsRead = async () => {
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("engagement_id", engagementId)
      .eq("to_user", currentUserId)
      .eq("is_read", false);
  };

  const handleSendMessage = async (body: string) => {
    const { error } = await supabase.from("messages").insert({
      from_user: currentUserId,
      to_user: otherUserId,
      engagement_id: engagementId,
      body,
    });

    if (error) {
      console.error("Error sending message:", error);
      return;
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <MessageThread
          messages={messages}
          currentUserId={currentUserId}
          loading={false}
        />
      </div>
      <div className="border-t">
        <MessageInput
          onSend={handleSendMessage}
        />
      </div>
    </Card>
  );
}
