import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Send, Menu, User, Circle, MoreVertical, Star, Trash2, Mail, MailOpen, ChevronDown, Paperclip, X, Video, Reply, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { useUpdateLastSeen } from "@/hooks/useUpdateLastSeen";

interface Message {
  id: string;
  from_user: string;
  to_user: string;
  body: string;
  created_at: string;
  reply_to?: string | null;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }> | null;
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

interface Conversation {
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  jobId: string | null;
  jobTitle: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isStarred: boolean;
}

const MessagesNew = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { status: myStatus } = useUserPreferences();
  useUpdateLastSeen();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [otherUserName, setOtherUserName] = useState("");
  const [otherUserRole, setOtherUserRole] = useState<string | null>(null);
  const [otherUserAvatar, setOtherUserAvatar] = useState<string | null>(null);
  const [otherUserStatus, setOtherUserStatus] = useState<string>("");
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [statusIndicator, setStatusIndicator] = useState<{ color: string; text: string } | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "starred">("all");
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<{ jobId: string; userId: string } | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; body: string; senderName: string } | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [scheduleTime, setScheduleTime] = useState<string>("10:00");
  const [schedulePopoverOpen, setSchedulePopoverOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const jobId = searchParams.get("job");
  const otherUserId = searchParams.get("with");
  const validJobId = jobId && jobId !== "null" ? jobId : null;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load conversations
  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadConversations();

    const channel = supabase
      .channel("messages-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        loadConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (!user || !otherUserId) return;
    
    loadMessages();
    loadConversationDetails();
    markMessagesAsRead();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages-${validJobId || 'direct'}-${otherUserId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "messages",
        filter: validJobId ? `job_id=eq.${validJobId}` : `job_id=is.null`
      }, (payload) => {
        const newMessage = payload.new as Message;
        if (
          (newMessage.from_user === user.id && newMessage.to_user === otherUserId) ||
          (newMessage.from_user === otherUserId && newMessage.to_user === user.id)
        ) {
          loadMessages();
          if (newMessage.to_user === user.id) {
            markMessagesAsRead();
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, otherUserId, validJobId]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      const { data: messages } = await supabase
        .from("messages")
        .select(`
          *,
          job:jobs(id, title),
          from_profile:profiles!messages_from_user_fkey(id, name, avatar_url),
          to_profile:profiles!messages_to_user_fkey(id, name, avatar_url)
        `)
        .or(`from_user.eq.${user.id},to_user.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (!messages) return;

      const { data: starredConvs } = await supabase
        .from("starred_conversations")
        .select("job_id, other_user_id")
        .eq("user_id", user.id);

      const starredSet = new Set(
        starredConvs?.map((s) => `${s.job_id || 'null'}-${s.other_user_id}`) || []
      );

      const convMap = new Map<string, Conversation>();
      
      messages.forEach((msg: any) => {
        const isFromMe = msg.from_user === user.id;
        const otherId = isFromMe ? msg.to_user : msg.from_user;
        const otherProfile = isFromMe ? msg.to_profile : msg.from_profile;
        const key = `${msg.job_id || 'null'}-${otherId}`;

        if (!convMap.has(key)) {
          convMap.set(key, {
            otherUserId: otherId,
            otherUserName: otherProfile?.name || "Unknown",
            otherUserAvatar: otherProfile?.avatar_url || null,
            jobId: msg.job_id,
            jobTitle: msg.job?.title || "Direct Message",
            lastMessage: msg.body,
            lastMessageTime: msg.created_at,
            unreadCount: 0,
            isStarred: starredSet.has(key),
          });
        }
      });

      // Count unread messages for each conversation
      for (const [key, conv] of convMap.entries()) {
        let query = supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("from_user", conv.otherUserId)
          .eq("to_user", user.id)
          .eq("is_read", false);

        if (conv.jobId) {
          query = query.eq("job_id", conv.jobId);
        } else {
          query = query.is("job_id", null);
        }

        const { count } = await query;
        convMap.set(key, { ...conv, unreadCount: count || 0 });
      }

      setConversations(Array.from(convMap.values()));
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  const loadMessages = async () => {
    if (!user || !otherUserId) return;

    try {
      let query = supabase
        .from("messages")
        .select(`
          *,
          from_profile:profiles!messages_from_user_fkey(name, avatar_url)
        `);

      if (validJobId) {
        query = query.eq("job_id", validJobId);
      } else {
        query = query.is("job_id", null);
      }

      const { data, error } = await query
        .or(`and(from_user.eq.${user.id},to_user.eq.${otherUserId}),and(from_user.eq.${otherUserId},to_user.eq.${user.id})`)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch replied messages
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
    }
  };

  const markMessagesAsRead = async () => {
    if (!otherUserId || !user) return;

    try {
      let query = supabase.from("messages").update({ is_read: true });

      if (validJobId) {
        query = query.eq("job_id", validJobId);
      } else {
        query = query.is("job_id", null);
      }

      await query.eq("from_user", otherUserId).eq("to_user", user.id).eq("is_read", false);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const loadConversationDetails = async () => {
    if (!otherUserId) return;

    try {
      const { data: profileData } = await supabase.rpc('get_public_profile', {
        profile_id: otherUserId
      });

      const { data: prefsData } = await supabase
        .from("profiles")
        .select("show_status, status, role")
        .eq("id", otherUserId)
        .single();

      const profile = profileData && profileData.length > 0 ? profileData[0] : null;

      setOtherUserName(profile?.name || "Unknown User");
      setOtherUserRole(prefsData?.role || null);
      setOtherUserAvatar(profile?.avatar_url || null);
      const userStatus = prefsData?.status || 'online';
      setOtherUserStatus(userStatus);

      // Format status
      if (!prefsData?.show_status) {
        setStatusIndicator(null);
        setLastSeen("Active recently");
      } else if (profile?.last_seen) {
        const lastSeenDate = new Date(profile.last_seen);
        const now = new Date();
        const diffMs = now.getTime() - lastSeenDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 2) {
          if (userStatus === 'away') {
            setStatusIndicator({ color: "text-yellow-500", text: "Away" });
            setLastSeen(null);
          } else {
            setStatusIndicator({ color: "text-green-500", text: "Online" });
            setLastSeen(null);
          }
        } else if (diffMins < 60) {
          setStatusIndicator(null);
          setLastSeen(`Last seen ${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`);
        } else if (diffMins < 1440) {
          const hours = Math.floor(diffMins / 60);
          setStatusIndicator(null);
          setLastSeen(`Last seen ${hours} hour${hours !== 1 ? 's' : ''} ago`);
        } else {
          setStatusIndicator(null);
          setLastSeen("Active recently");
        }
      } else {
        setStatusIndicator(null);
        setLastSeen("Active recently");
      }

      if (validJobId) {
        const { data: jobData } = await supabase
          .from("jobs")
          .select("title")
          .eq("id", validJobId)
          .single();

        if (jobData) {
          setJobTitle(jobData.title);
        }
      }
    } catch (error) {
      console.error("Error loading conversation details:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !otherUserId || !messageText.trim()) return;

    try {
      // Upload files if any
      const attachments: Array<{ name: string; url: string; type: string; size: number }> = [];
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const { error: uploadError, data } = await supabase.storage
            .from('profile-images')
            .upload(fileName, file);

          if (uploadError) {
            toast({
              title: "Error",
              description: `Failed to upload ${file.name}`,
              variant: "destructive",
            });
            throw uploadError;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('profile-images')
            .getPublicUrl(fileName);

          attachments.push({
            name: file.name,
            url: publicUrl,
            type: file.type,
            size: file.size,
          });
        }
      }

      const { error } = await supabase.from("messages").insert({
        job_id: validJobId,
        from_user: user.id,
        to_user: otherUserId,
        body: messageText,
        attachments: attachments.length > 0 ? attachments : null,
        reply_to: replyingTo?.id || null,
      } as any);

      if (error) throw error;

      // Create notification
      try {
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();

        const senderName = senderProfile?.name || 'Someone';

        await supabase.from('notifications').insert({
          user_id: otherUserId,
          type: 'new_message',
          title: `New message from ${senderName}`,
          message: messageText.length > 100 ? messageText.substring(0, 100) + '...' : messageText,
          payload: {
            job_id: validJobId,
            from_user: user.id,
          },
        } as any);
      } catch (notifErr) {
        console.error('Error creating notification:', notifErr);
      }

      setMessageText("");
      setReplyingTo(null);
      setSelectedFiles([]);
      loadMessages();
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleStarConversation = async (jobId: string | null, userId: string, currentlyStarred: boolean) => {
    if (!user) return;

    try {
      if (currentlyStarred) {
        let query = supabase
          .from("starred_conversations")
          .delete()
          .eq("user_id", user.id)
          .eq("other_user_id", userId);

        if (jobId) {
          query = query.eq("job_id", jobId);
        } else {
          query = query.is("job_id", null);
        }

        await query;
      } else {
        await supabase.from("starred_conversations").insert({
          user_id: user.id,
          job_id: jobId,
          other_user_id: userId,
        } as any);
      }

      loadConversations();
    } catch (error) {
      console.error("Error toggling star:", error);
    }
  };

  const handleMarkAsRead = async (jobId: string | null, userId: string) => {
    if (!user) return;

    try {
      let query = supabase.from("messages").update({ is_read: true });

      if (jobId) {
        query = query.eq("job_id", jobId);
      } else {
        query = query.is("job_id", null);
      }

      await query.eq("from_user", userId).eq("to_user", user.id);
      loadConversations();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleMarkAsUnread = async (jobId: string | null, userId: string) => {
    if (!user) return;

    try {
      let query = supabase.from("messages").update({ is_read: false });

      if (jobId) {
        query = query.eq("job_id", jobId);
      } else {
        query = query.is("job_id", null);
      }

      await query.eq("from_user", userId).eq("to_user", user.id);
      loadConversations();
    } catch (error) {
      console.error("Error marking as unread:", error);
    }
  };

  const handleDeleteConversation = async () => {
    if (!user || !conversationToDelete) return;

    try {
      let query = supabase.from("messages").delete();

      if (conversationToDelete.jobId && conversationToDelete.jobId !== 'null') {
        query = query.eq("job_id", conversationToDelete.jobId);
      } else {
        query = query.is("job_id", null);
      }

      await query.or(
        `and(from_user.eq.${user.id},to_user.eq.${conversationToDelete.userId}),and(from_user.eq.${conversationToDelete.userId},to_user.eq.${user.id})`
      );

      toast({
        title: "Success",
        description: "Conversation deleted",
      });

      setDeleteDialogOpen(false);
      setConversationToDelete(null);
      
      if (otherUserId === conversationToDelete.userId) {
        navigate("/messages-new");
      }

      loadConversations();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((files) => files.filter((_, i) => i !== index));
  };

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    if (diffMins < 2880) return "Yesterday";
    return date.toLocaleDateString();
  };

  const filteredConversations = conversations.filter((conv) => {
    if (filter === "unread") return conv.unreadCount > 0;
    if (filter === "starred") return conv.isStarred;
    return true;
  });

  return (
    <>
      <div className="h-screen flex">
        {/* Sidebar */}
        <div className={cn(
          "border-r bg-background transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64"
        )}>
          <div className="p-4 border-b flex items-center justify-between">
            {!sidebarCollapsed && <h2 className="font-semibold">Conversations</h2>}
            <Button variant="ghost" size="icon" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
              <ChevronDown className={cn("h-4 w-4 transition-transform", sidebarCollapsed && "rotate-180")} />
            </Button>
          </div>

          {!sidebarCollapsed && (
            <div className="p-2 border-b flex gap-1">
              <Button
                variant={filter === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("all")}
                className="flex-1"
              >
                All
              </Button>
              <Button
                variant={filter === "unread" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("unread")}
                className="flex-1"
              >
                Unread
              </Button>
              <Button
                variant={filter === "starred" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("starred")}
                className="flex-1"
              >
                <Star className="h-4 w-4" />
              </Button>
            </div>
          )}

          <ScrollArea className="h-[calc(100vh-128px)]">
            <TooltipProvider>
              {filteredConversations.map((conv) => (
                <div
                  key={`${conv.jobId}-${conv.otherUserId}`}
                  className={cn(
                    "relative group",
                    !sidebarCollapsed && otherUserId === conv.otherUserId && "bg-accent"
                  )}
                >
                  {sidebarCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => navigate(`/messages-new?job=${conv.jobId || 'null'}&with=${conv.otherUserId}`)}
                          className={cn(
                            "w-full p-2 rounded-lg hover:bg-accent transition-colors flex items-center justify-center",
                            otherUserId === conv.otherUserId && "bg-accent"
                          )}
                        >
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={conv.otherUserAvatar || undefined} />
                              <AvatarFallback>
                                {conv.otherUserName.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {conv.unreadCount > 0 && (
                              <div className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full border-2 border-background" />
                            )}
                          </div>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p className="font-semibold">{conv.otherUserName}</p>
                        <p className="text-xs text-muted-foreground">{conv.jobTitle}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <>
                      <button
                        onClick={() => navigate(`/messages-new?job=${conv.jobId || 'null'}&with=${conv.otherUserId}`)}
                        className="relative z-0 w-full p-3 pr-12 text-left hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <div className="relative">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={conv.otherUserAvatar || undefined} />
                              <AvatarFallback>
                                {conv.otherUserName.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {conv.unreadCount > 0 && (
                              <div className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-destructive rounded-full border-2 border-background" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 pr-16">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className={cn("text-sm truncate flex-1", conv.unreadCount > 0 ? "font-semibold" : "font-medium")}>
                                {conv.otherUserName}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground mb-0.5 truncate">{conv.jobTitle}</p>
                            <p className={cn("text-xs truncate", conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground")}>
                              {conv.lastMessage}
                            </p>
                          </div>
                        </div>
                      </button>

                      <span className={cn(
                        "absolute top-3 text-[10px] text-muted-foreground whitespace-nowrap transition-all duration-200 z-10",
                        openMenuKey === `${conv.jobId}-${conv.otherUserId}` ? "right-12" : "group-hover:right-12 right-3"
                      )}>
                        {formatRelativeTime(conv.lastMessageTime)}
                      </span>

                      <div className={cn(
                        "absolute top-2 right-2 transition-opacity z-20",
                        openMenuKey === `${conv.jobId}-${conv.otherUserId}`
                          ? "opacity-100 pointer-events-auto"
                          : "opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
                      )}>
                        <DropdownMenu
                          open={openMenuKey === `${conv.jobId}-${conv.otherUserId}`}
                          onOpenChange={(open) => setOpenMenuKey(open ? `${conv.jobId}-${conv.otherUserId}` : null)}
                        >
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 bg-background/90 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="z-50">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              if (conv.unreadCount > 0) {
                                handleMarkAsRead(conv.jobId, conv.otherUserId);
                              } else {
                                handleMarkAsUnread(conv.jobId, conv.otherUserId);
                              }
                              setOpenMenuKey(null);
                            }}>
                              {conv.unreadCount > 0 ? (
                                <><MailOpen className="h-4 w-4 mr-2" />Mark as read</>
                              ) : (
                                <><Mail className="h-4 w-4 mr-2" />Mark as unread</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleStarConversation(conv.jobId, conv.otherUserId, conv.isStarred);
                              setOpenMenuKey(null);
                            }}>
                              <Star className={cn("h-4 w-4 mr-2", conv.isStarred && "fill-current")} />
                              {conv.isStarred ? "Unstar" : "Star"}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={(e) => {
                              e.stopPropagation();
                              setConversationToDelete({ jobId: conv.jobId || 'null', userId: conv.otherUserId });
                              setDeleteDialogOpen(true);
                              setOpenMenuKey(null);
                            }}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </TooltipProvider>
          </ScrollArea>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {otherUserId ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-gradient-to-r from-[hsl(var(--accent-pink))]/10 via-[hsl(var(--accent-mint))]/10 to-[hsl(var(--accent-lilac))]/10 flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                  <Menu className="h-5 w-5" />
                </Button>

                <Link
                  to={otherUserRole === "headhunter" ? `/profile/headhunter/${otherUserId}` : `/profile/employer/${otherUserId}`}
                  className="flex items-center gap-3 flex-1 hover:opacity-80 transition"
                >
                  <div className="relative">
                    {otherUserAvatar ? (
                      <img src={otherUserAvatar} alt={otherUserName} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] flex items-center justify-center">
                        <User className="h-5 w-5" />
                      </div>
                    )}
                    {statusIndicator && (
                      <Circle className={`absolute bottom-0 right-0 h-3 w-3 fill-current ${statusIndicator.color} border-2 border-background rounded-full`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-base">{otherUserName}</h2>
                      {otherUserRole && (
                        <Badge variant="outline" className="text-xs capitalize">{otherUserRole}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{jobTitle || "Direct Message"}</p>
                    {statusIndicator ? (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className={statusIndicator.color}>●</span>
                        <span className={statusIndicator.color}>{statusIndicator.text}</span>
                      </div>
                    ) : lastSeen ? (
                      <p className="text-xs text-muted-foreground">{lastSeen}</p>
                    ) : null}
                  </div>
                </Link>

                <Popover open={schedulePopoverOpen} onOpenChange={setSchedulePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="default" className="h-10 px-4 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 hover:opacity-90 shadow-lg flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      <span className="text-sm font-semibold">Schedule Call</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <div className="p-4 space-y-4">
                      <div className="space-y-2">
                        <Label>Select Date</Label>
                        <Calendar mode="single" selected={scheduleDate} onSelect={setScheduleDate} disabled={(date) => date < new Date()} initialFocus className={cn("pointer-events-auto")} />
                      </div>
                      <div className="space-y-2">
                        <Label>Select Time</Label>
                        <Select value={scheduleTime} onValueChange={setScheduleTime}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => {
                              const hour = i.toString().padStart(2, '0');
                              return [
                                <SelectItem key={`${hour}:00`} value={`${hour}:00`}>{`${hour}:00`}</SelectItem>,
                                <SelectItem key={`${hour}:30`} value={`${hour}:30`}>{`${hour}:30`}</SelectItem>
                              ];
                            }).flat()}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={() => {
                        if (scheduleDate) {
                          const scheduledTime = `${format(scheduleDate, 'PPP')} at ${scheduleTime}`;
                          setMessageText(`📅 Video call scheduled for ${scheduledTime}`);
                          setSchedulePopoverOpen(false);
                        }
                      }} className="w-full">
                        Confirm Schedule
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isFromMe = msg.from_user === user?.id;
                    return (
                      <div key={msg.id} className={cn("flex gap-2 group", isFromMe ? "justify-end" : "justify-start")}>
                        {!isFromMe && (
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={msg.from_profile?.avatar_url || undefined} />
                            <AvatarFallback>{msg.from_profile?.name?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
                          </Avatar>
                        )}
                        <div className={cn("rounded-lg px-4 py-2 max-w-[70%] relative", isFromMe ? "bg-primary text-primary-foreground" : "bg-muted")}>
                          {msg.replied_message && (
                            <div className="text-xs opacity-70 mb-2 p-2 bg-background/10 rounded border-l-2 border-foreground/20">
                              <p className="font-semibold">{msg.replied_message.from_profile?.name}</p>
                              <p className="truncate">{msg.replied_message.body}</p>
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {msg.attachments.map((file, idx) => (
                                <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs opacity-80 hover:opacity-100 transition">
                                  <Paperclip className="h-3 w-3" />
                                  <span className="truncate">{file.name}</span>
                                </a>
                              ))}
                            </div>
                          )}
                          <p className="text-xs opacity-70 mt-1">{new Date(msg.created_at).toLocaleTimeString()}</p>
                          <Button variant="ghost" size="icon" className="absolute -top-2 right-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition" onClick={() => setReplyingTo({ id: msg.id, body: msg.body, senderName: isFromMe ? "You" : (msg.from_profile?.name || "User") })}>
                            <Reply className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t">
                {replyingTo && (
                  <div className="mb-2 p-2 bg-muted rounded-lg flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold">Replying to {replyingTo.senderName}</p>
                      <p className="text-xs text-muted-foreground truncate">{replyingTo.body}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReplyingTo(null)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                {selectedFiles.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-1 bg-muted rounded px-2 py-1 text-xs">
                        <Paperclip className="h-3 w-3" />
                        <span className="truncate max-w-[150px]">{file.name}</span>
                        <Button variant="ghost" size="icon" className="h-4 w-4 ml-1" onClick={() => removeFile(idx)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
                  <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <Textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Type a message..." className="min-h-[60px]" onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }} />
                  <Button onClick={handleSendMessage} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone and will remove all messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConversation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MessagesNew;
