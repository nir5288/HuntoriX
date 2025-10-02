import { useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  from_user: string;
  to_user: string;
  body: string;
  created_at: string;
  from_profile?: {
    name: string;
    avatar_url: string | null;
  };
}

interface MessageThreadProps {
  messages: Message[];
  currentUserId: string;
  loading: boolean;
}

export const MessageThread = ({ messages, currentUserId, loading }: MessageThreadProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Loading messages...
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        No messages yet. Start the conversation!
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
      <div className="space-y-4">
        {messages.map((message) => {
          const isFromMe = message.from_user === currentUserId;
          
          return (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                isFromMe ? "flex-row-reverse" : "flex-row"
              )}
            >
              {!isFromMe && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={message.from_profile?.avatar_url || undefined} />
                  <AvatarFallback>
                    {message.from_profile?.name?.substring(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div
                className={cn(
                  "max-w-[70%] rounded-lg px-4 py-2",
                  isFromMe
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <p className="text-sm break-words">{message.body}</p>
                <p
                  className={cn(
                    "text-xs mt-1",
                    isFromMe ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}
                >
                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};
