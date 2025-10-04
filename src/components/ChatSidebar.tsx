import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X, MessageSquare, ChevronDown, Trash2, Circle, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
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
}

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatSidebar = ({ isOpen, onClose }: ChatSidebarProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { open: sidebarOpen } = useSidebar();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "archived">("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<{ jobId: string; userId: string } | null>(null);

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

      const conversationMap = new Map<string, Conversation>();

      messages.forEach((msg: any) => {
        const isFromMe = msg.from_user === user.id;
        const otherUserId = isFromMe ? msg.to_user : msg.from_user;
        const otherProfile = isFromMe ? msg.to_profile : msg.from_profile;
        const key = `${msg.job_id}-${otherUserId}`;

        if (!conversationMap.has(key)) {
          conversationMap.set(key, {
            otherUserId,
            otherUserName: otherProfile?.name || "Unknown User",
            otherUserAvatar: otherProfile?.avatar_url || null,
            jobId: msg.job_id,
            jobTitle: msg.job?.title || "Unknown Job",
            lastMessage: msg.body,
            lastMessageTime: msg.created_at,
            unreadCount: 0,
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

  const handleConversationClick = (jobId: string | null, userId: string) => {
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

  const handleMarkAsUnread = async (jobId: string | null, otherUserId: string) => {
    if (!currentUserId) return;

    try {
      // Mark all messages from the other user as unread
      let query = supabase
        .from("messages")
        .update({ is_read: false });
      
      // Handle null jobId properly
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

  const filteredConversations = conversations.filter(conv => {
    if (filter === "unread") {
      return conv.unreadCount > 0;
    }
    // For now, we don't have archived conversations, so show all for "all" and "archived"
    return true;
  });

  return (
    <div
      className={cn(
        "fixed top-16 bottom-0 z-40 w-80 bg-background border-r transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
      style={{
        left: sidebarOpen ? 'var(--sidebar-width, 16rem)' : 'var(--sidebar-width-icon, 3.5rem)'
      }}
    >
      <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-[hsl(var(--accent-pink))]/20 via-[hsl(var(--accent-mint))]/20 to-[hsl(var(--accent-lilac))]/20">
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
            <DropdownMenuItem onClick={() => setFilter("archived")}>
              Archived
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-65px)]">
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No conversations yet
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No {filter !== "all" && filter} conversations
          </div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map((conv) => (
              <div
                key={`${conv.jobId}-${conv.otherUserId}`}
                className={cn(
                  "relative group",
                  activeJobId === conv.jobId && activeUserId === conv.otherUserId && "bg-accent"
                )}
              >
                <button
                  onClick={() => handleConversationClick(conv.jobId, conv.otherUserId)}
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className={cn(
                          "text-sm truncate",
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
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsUnread(conv.jobId, conv.otherUserId);
                    }}
                    title="Mark as unread"
                  >
                    <CircleDot className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConversationToDelete({ jobId: conv.jobId, userId: conv.otherUserId });
                      setDeleteDialogOpen(true);
                    }}
                    title="Delete conversation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
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
