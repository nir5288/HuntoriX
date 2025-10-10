import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { Pencil, Check, X, Paperclip, Reply } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface Message {
  id: string;
  from_user: string;
  to_user: string;
  body: string;
  created_at: string;
  edited_at?: string | null;
  attachments?: any[];
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

interface MessageThreadProps {
  messages: Message[];
  currentUserId: string;
  currentUserProfile: any;
  loading: boolean;
  onReply: (message: Message) => void;
  onEdited?: () => void;
}

const formatName = (fullName: string | undefined) => {
  if (!fullName) return "User";
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) return parts[0];
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${firstName} ${lastInitial}`;
};

const formatDateSeparator = (date: Date) => {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "d MMMM yyyy");
};

export const MessageThread = ({ messages, currentUserId, currentUserProfile, loading, onReply, onEdited }: MessageThreadProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
      onEdited?.();
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
    <ScrollArea className="h-full p-4" ref={scrollRef}>
      <TooltipProvider delayDuration={0}>
        <div className="space-y-2">
        {messages.map((message, index) => {
          const isFromMe = message.from_user === currentUserId;
          const isEditing = editingMessageId === message.id;
          const messageDate = new Date(message.created_at);
          
          // Check if we need to show a date separator
          const prevMessage = index > 0 ? messages[index - 1] : null;
          const showDateSeparator = !prevMessage || !isSameDay(new Date(prevMessage.created_at), messageDate);
          
          return (
            <div key={message.id} className="w-full">
              {/* Date Separator */}
              {showDateSeparator && (
                <div className="flex items-center justify-center w-full my-3">
                  <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                    {formatDateSeparator(messageDate)}
                  </div>
                </div>
              )}
              
              {/* Message */}
              {isMobile ? (
                // Mobile WhatsApp-style layout
                <div className={cn(
                  "flex w-full mb-2",
                  isFromMe ? "justify-end" : "justify-start"
                )}>
                  <div className={cn(
                    "max-w-[75%] rounded-lg px-3 py-2",
                    isFromMe 
                      ? "bg-gradient-to-r from-[hsl(var(--accent-mint))]/20 to-[hsl(var(--accent-lilac))]/20"
                      : "bg-muted"
                  )}>
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
                          <div className="mb-2 pl-2 border-l-2 border-primary/50 text-xs text-muted-foreground">
                            <p className="font-semibold">
                              {message.replied_message.from_profile?.name ? formatName(message.replied_message.from_profile.name) : "User"}
                            </p>
                            <p className="truncate">{message.replied_message.body}</p>
                          </div>
                        )}
                        <p className="text-sm break-words mb-1">{message.body}</p>
                        
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-1 mb-1">
                            {message.attachments.map((file: any, idx: number) => (
                              <button
                                key={idx}
                                onClick={() => handleDownloadAttachment(file.url, file.name)}
                                className="flex items-center gap-2 text-xs hover:underline cursor-pointer"
                              >
                                <Paperclip className="h-3 w-3" />
                                <span className="truncate">{file.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-end gap-2">
                          {message.edited_at && (
                            <span className="text-[10px] text-muted-foreground">(edited)</span>
                          )}
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {format(messageDate, "HH:mm")}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                // Desktop layout
                <div className="flex gap-3 items-start group mb-3">
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
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(messageDate, "d MMM yyyy, HH:mm")}
                      </span>
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
                            <div className="mb-2 pl-3 border-l-2 border-primary/50 text-xs text-muted-foreground">
                              <p className="font-semibold">
                                Replying to {message.replied_message.from_profile?.name ? formatName(message.replied_message.from_profile.name) : "User"}
                              </p>
                              <p className="truncate">{message.replied_message.body}</p>
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
                          
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Tooltip delayDuration={0} disableHoverableContent>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => onReply(message)}
                                >
                                  <Reply className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Reply to message</TooltipContent>
                            </Tooltip>
                            {canEditMessage(message) && !isEditing && (
                              <Tooltip delayDuration={0} disableHoverableContent>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={() => {
                                      setEditingMessageId(message.id);
                                      setEditText(message.body);
                                    }}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit message (within 5 minutes)</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
        </div>
      </TooltipProvider>
    </ScrollArea>
  );
};
