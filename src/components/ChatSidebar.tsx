import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MessageSquare, ChevronDown, Trash2, Mail, MailOpen, Star, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
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

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const ChatSidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }: ChatSidebarProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { open: sidebarOpen } = useSidebar();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "starred">("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<{ jobId: string; userId: string } | null>(null);
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);

  const activeJobId = searchParams.get("job");
  const activeUserId = searchParams.get("with");

  useEffect(() => {
    loadConversations();
    
    const channel = supabase
      .channel("messages-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setCurrentUserId(user.id);

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

      // Load starred conversations
      const { data: starredData } = await supabase
        .from("starred_conversations")
        .select("*")
        .eq("user_id", user.id);

      const starredSet = new Set(
        starredData?.map((s) => `${s.job_id || 'null'}-${s.other_user_id}`) || []
      );

      const conversationMap = new Map<string, Conversation>();

      // Helper function to format name
      const formatName = (fullName: string) => {
        const parts = fullName.trim().split(' ');
        if (parts.length === 1) return fullName;
        const firstName = parts[0];
        const lastNameInitial = parts[parts.length - 1][0];
        return `${firstName} ${lastNameInitial}.`;
      };

      messages.forEach((msg: any) => {
        const isFromMe = msg.from_user === user.id;
        const otherUserId = isFromMe ? msg.to_user : msg.from_user;
        const otherProfile = isFromMe ? msg.to_profile : msg.from_profile;
        const key = `${msg.job_id}-${otherUserId}`;

        if (!conversationMap.has(key)) {
          conversationMap.set(key, {
            otherUserId,
            otherUserName: otherProfile?.name ? formatName(otherProfile.name) : "Unknown User",
            otherUserAvatar: otherProfile?.avatar_url || null,
            jobId: msg.job_id,
            jobTitle: msg.job?.title || "Unknown Job",
            lastMessage: msg.body,
            lastMessageTime: msg.created_at,
            unreadCount: 0,
            isStarred: starredSet.has(`${msg.job_id || 'null'}-${otherUserId}`),
          });
        }
        
        // Count unread messages where user is the recipient
        if (!isFromMe && !msg.is_read) {
          const conv = conversationMap.get(key);
          if (conv) {
            conv.unreadCount++;
          }
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = async (jobId: string | null, userId: string, hasUnread: boolean) => {
    // Mark as read when clicking if there are unread messages
    if (hasUnread) {
      await handleMarkAsRead(jobId, userId);
    }
    navigate(`/messages?job=${jobId || 'null'}&with=${userId}`);
  };

  const handleDeleteConversation = async () => {
    if (!conversationToDelete || !currentUserId) return;

    try {
      const { error } = await supabase.rpc('delete_conversation', {
        p_job_id: conversationToDelete.jobId,
        p_user1_id: currentUserId,
        p_user2_id: conversationToDelete.userId,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Conversation deleted",
      });

      loadConversations();
      
      // If we're viewing the deleted conversation, navigate away
      if (activeJobId === conversationToDelete.jobId && activeUserId === conversationToDelete.userId) {
        navigate('/messages');
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    }
  };

  const handleMarkAsRead = async (jobId: string | null, otherUserId: string) => {
    if (!currentUserId) return;

    try {
      let query = supabase
        .from("messages")
        .update({ is_read: true });
      
      if (jobId && jobId !== "null") {
        query = query.eq("job_id", jobId);
      } else {
        query = query.is("job_id", null);
      }
      
      const { error } = await query
        .eq("from_user", otherUserId)
        .eq("to_user", currentUserId);

      if (error) throw error;

      loadConversations();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleMarkAsUnread = async (jobId: string | null, otherUserId: string) => {
    if (!currentUserId) return;

    try {
      let query = supabase
        .from("messages")
        .update({ is_read: false });
      
      if (jobId && jobId !== "null") {
        query = query.eq("job_id", jobId);
      } else {
        query = query.is("job_id", null);
      }
      
      const { error } = await query
        .eq("from_user", otherUserId)
        .eq("to_user", currentUserId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Marked as unread",
      });

      loadConversations();
    } catch (error) {
      console.error("Error marking as unread:", error);
      toast({
        title: "Error",
        description: "Failed to mark as unread",
        variant: "destructive",
      });
    }
  };

  const handleToggleStar = async (e: React.MouseEvent, jobId: string | null, otherUserId: string) => {
    e.stopPropagation();
    if (!currentUserId) return;

    try {
      const conv = conversations.find(c => c.jobId === jobId && c.otherUserId === otherUserId);
      if (!conv) return;

      // Optimistically update UI immediately
      setConversations(conversations.map(c => 
        c.jobId === jobId && c.otherUserId === otherUserId
          ? { ...c, isStarred: !c.isStarred }
          : c
      ));

      if (conv.isStarred) {
        // Unstar - handle null job_id properly
        let query = supabase
          .from("starred_conversations")
          .delete()
          .eq("user_id", currentUserId)
          .eq("other_user_id", otherUserId);
        
        if (jobId) {
          query = query.eq("job_id", jobId);
        } else {
          query = query.is("job_id", null);
        }
        
        const { error } = await query;
        if (error) throw error;
      } else {
        // Star
        const { error } = await supabase
          .from("starred_conversations")
          .insert({
            user_id: currentUserId,
            job_id: jobId,
            other_user_id: otherUserId,
          });
        if (error) throw error;
      }
    } catch (error) {
      console.error("Error toggling star:", error);
      // Revert optimistic update on error
      loadConversations();
      toast({
        title: "Error",
        description: "Failed to update star status",
        variant: "destructive",
      });
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (filter === "unread") {
      return conv.unreadCount > 0;
    }
    if (filter === "starred") {
      return conv.isStarred;
    }
    return true;
  });

  const formatRelativeTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h`;
      
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d`;
      
      const diffWeeks = Math.floor(diffDays / 7);
      if (diffWeeks < 4) return `${diffWeeks}w`;
      
      const diffMonths = Math.floor(diffDays / 30);
      return `${diffMonths}mo`;
    } catch {
      return '';
    }
  };

  return (
    <div
      className={cn(
        "fixed top-16 bottom-0 bg-background border-r transition-all duration-300 ease-in-out",
        isOpen ? "translate-x-0 z-30" : "-translate-x-full -z-10 pointer-events-none",
        isCollapsed ? "w-16" : "w-56"
      )}
      style={{
        left: sidebarOpen ? 'var(--sidebar-width, 16rem)' : 'var(--sidebar-width-icon, 3.5rem)'
      }}
    >
      <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-[hsl(var(--accent-pink))]/20 via-[hsl(var(--accent-mint))]/20 to-[hsl(var(--accent-lilac))]/20">
        {!isCollapsed && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 hover:opacity-80 transition text-sm">
                <span className="text-xs font-medium text-muted-foreground capitalize">
                  {filter === "all" ? "All messages" : filter}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setFilter("all")}>
                All messages
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("unread")}>
                Unread
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("starred")}>
                Starred
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggleCollapse}
          className="ml-auto"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-65px)]">
        <TooltipProvider delayDuration={200}>
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              {!isCollapsed && "Loading conversations..."}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {!isCollapsed && "No conversations yet"}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {!isCollapsed && `No ${filter !== "all" && filter} conversations`}
            </div>
          ) : (
            <div className={cn(isCollapsed ? "space-y-2 p-2" : "divide-y")}>
              {filteredConversations.map((conv) => (
                <div
                  key={`${conv.jobId}-${conv.otherUserId}`}
                  className={cn(
                    "relative group",
                    !isCollapsed && activeJobId === conv.jobId && activeUserId === conv.otherUserId && "bg-accent"
                  )}
                >
                  {isCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleConversationClick(conv.jobId, conv.otherUserId, conv.unreadCount > 0)}
                          className={cn(
                            "w-full p-2 rounded-lg hover:bg-accent transition-colors flex items-center justify-center",
                            activeJobId === conv.jobId && activeUserId === conv.otherUserId && "bg-accent"
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
                              <div className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full border-2 border-background flex items-center justify-center">
                                <span className="text-[10px] font-bold text-white">{conv.unreadCount > 9 ? '9+' : conv.unreadCount}</span>
                              </div>
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
                        onClick={() => handleConversationClick(conv.jobId, conv.otherUserId, conv.unreadCount > 0)}
                        className="w-full p-3 text-left hover:bg-accent transition-colors"
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
                              <p className={cn(
                                "text-sm truncate flex-1",
                                conv.unreadCount > 0 ? "font-semibold" : "font-medium"
                              )}>
                                {conv.otherUserName}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground mb-0.5 truncate">
                              {conv.jobTitle}
                            </p>
                            <p className={cn(
                              "text-xs truncate",
                              conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                            )}>
                              {conv.lastMessage}
                            </p>
                          </div>
                        </div>
                      </button>
                      
                      {/* Timestamp - always visible, moves left on hover or when menu open */}
                      <span className={cn(
                        "absolute top-3 text-[10px] text-muted-foreground whitespace-nowrap transition-all duration-200 z-10",
                        (openMenuKey === `${conv.jobId}-${conv.otherUserId}`) ? "right-12" : "group-hover:right-12 right-3"
                      )}>
                        {formatRelativeTime(conv.lastMessageTime)}
                      </span>

                      {/* 3-dot menu - appears on hover or when open in top right */}
                      <div className={cn(
                        "absolute top-2 right-2 transition-opacity z-20",
                        openMenuKey === `${conv.jobId}-${conv.otherUserId}` ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      )}>
                        <DropdownMenu
                          open={openMenuKey === `${conv.jobId}-${conv.otherUserId}`}
                          onOpenChange={(open) => {
                            setOpenMenuKey(open ? `${conv.jobId}-${conv.otherUserId}` : null);
                          }}
                        >
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 bg-background/90 backdrop-blur-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="z-50">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                if (conv.unreadCount > 0) {
                                  handleMarkAsRead(conv.jobId, conv.otherUserId);
                                } else {
                                  handleMarkAsUnread(conv.jobId, conv.otherUserId);
                                }
                                setOpenMenuKey(null);
                              }}
                            >
                              {conv.unreadCount > 0 ? (
                                <>
                                  <MailOpen className="h-4 w-4 mr-2" />
                                  Mark as read
                                </>
                              ) : (
                                <>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Mark as unread
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setConversationToDelete({ jobId: conv.jobId, userId: conv.otherUserId });
                                setDeleteDialogOpen(true);
                                setOpenMenuKey(null);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete conversation
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Star button - appears on hover at bottom right */}
                      <div className="absolute bottom-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => handleToggleStar(e, conv.jobId, conv.otherUserId)}
                          title={conv.isStarred ? "Unstar" : "Star"}
                        >
                          <Star className={cn(
                            "h-3.5 w-3.5",
                            conv.isStarred && "fill-yellow-500 text-yellow-500"
                          )} />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </TooltipProvider>
      </ScrollArea>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConversation}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
