import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Pencil, Check, X, Paperclip } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  from_user: string;
  to_user: string;
  body: string;
  created_at: string;
  edited_at?: string | null;
  attachments?: any[];
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
  const { toast } = useToast();
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const canEditMessage = (message: Message) => {
    const isFromMe = message.from_user === currentUserId;
    const messageTime = new Date(message.created_at).getTime();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    return isFromMe && (now - messageTime < fiveMinutes);
  };

  const handleDownloadAttachment = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editText.trim()) return;

    try {
      const { error } = await supabase
        .from("messages")
        .update({ 
          body: editText.trim(),
          edited_at: new Date().toISOString()
        })
        .eq("id", messageId);

      if (error) throw error;

      setEditingMessageId(null);
      setEditText("");
    } catch (error) {
      console.error("Error editing message:", error);
      toast({
        title: "Error",
        description: "Failed to edit message",
        variant: "destructive",
      });
    }
  };

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
          const isEditing = editingMessageId === message.id;
          
          return (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 group",
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
                  "max-w-[70%] rounded-lg px-4 py-2 relative",
                  isFromMe
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => handleEditMessage(message.id)}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => {
                        setEditingMessageId(null);
                        setEditText("");
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm break-words">{message.body}</p>
                    
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.attachments.map((file: any, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => handleDownloadAttachment(file.url, file.name)}
                            className={cn(
                              "flex items-center gap-2 text-xs hover:underline cursor-pointer",
                              isFromMe ? "text-primary-foreground" : "text-foreground"
                            )}
                          >
                            <Paperclip className="h-3 w-3" />
                            <span>{file.name}</span>
                            <span className="text-[10px] opacity-70">
                              ({(file.size / 1024).toFixed(1)}KB)
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mt-1">
                      <p
                        className={cn(
                          "text-xs",
                          isFromMe ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}
                      >
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        {message.edited_at && " (edited)"}
                      </p>
                      
                      {canEditMessage(message) && !isEditing && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            setEditingMessageId(message.id);
                            setEditText(message.body);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};
