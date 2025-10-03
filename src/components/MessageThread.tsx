import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Pencil, Check, X, Paperclip, Reply } from "lucide-react";
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
  reply_to?: string | null;
  from_profile?: {
    name: string;
    avatar_url: string | null;
  };
  replied_message?: {
    id: string;
    body: string;
    from_profile?: {
      name: string;
    };
  };
}

interface MessageThreadProps {
  messages: Message[];
  currentUserId: string;
  currentUserProfile: any;
  loading: boolean;
  onReply?: (message: Message) => void;
}

const formatName = (fullName: string | undefined) => {
  if (!fullName) return "User";
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) return parts[0];
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${firstName} ${lastInitial}`;
};

export const MessageThread = ({ messages, currentUserId, currentUserProfile, loading, onReply }: MessageThreadProps) => {
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
            <div key={message.id} className="flex gap-3 items-start group">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage 
                  src={isFromMe ? currentUserProfile?.avatar_url : message.from_profile?.avatar_url || undefined} 
                />
                <AvatarFallback>
                  {isFromMe 
                    ? currentUserProfile?.name?.substring(0, 2).toUpperCase() || "ME"
                    : message.from_profile?.name?.substring(0, 2).toUpperCase() || "U"
                  }
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-4 mb-1">
                  <span className="font-semibold text-sm">
                    {isFromMe ? "Me" : formatName(message.from_profile?.name)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(message.created_at), "d MMM yyyy, HH:mm")}
                    </span>
                    {onReply && !isEditing && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onReply(message)}
                      >
                        <Reply className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="bg-muted rounded-lg px-4 py-2 relative group-hover:bg-muted/80 transition-colors">
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
                      {message.replied_message && (
                        <div className="mb-2 pl-2 border-l-2 border-primary/50 bg-background/50 rounded p-2">
                          <p className="text-xs font-semibold text-muted-foreground">
                            Replying to {message.replied_message.from_profile?.name || "User"}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {message.replied_message.body}
                          </p>
                        </div>
                      )}
                      <p className="text-sm break-words">{message.body}</p>
                      
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {message.attachments.map((file: any, idx: number) => (
                            <button
                              key={idx}
                              onClick={() => handleDownloadAttachment(file.url, file.name)}
                              className="flex items-center gap-2 text-xs hover:underline cursor-pointer"
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
                      
                      {message.edited_at && (
                        <p className="text-xs text-muted-foreground mt-1">(edited)</p>
                      )}
                      
                      {canEditMessage(message) && !isEditing && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2"
                          onClick={() => {
                            setEditingMessageId(message.id);
                            setEditText(message.body);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};
