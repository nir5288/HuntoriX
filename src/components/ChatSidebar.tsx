import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X, MessageSquare, ChevronDown, Trash2, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Conversation {
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  jobId: string;
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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "archived">("all");

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
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = (jobId: string, userId: string) => {
    navigate(`/messages?job=${jobId}&with=${userId}`);
  };

  const handleDeleteConversation = async (jobId: string, userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!currentUserId) return;
    
    if (!confirm('Are you sure you want to delete this conversation?')) return;
    
    try {
      await supabase
        .from('messages')
        .delete()
        .eq('job_id', jobId)
        .or(`and(from_user.eq.${currentUserId},to_user.eq.${userId}),and(from_user.eq.${userId},to_user.eq.${currentUserId})`);
      
      await loadConversations();
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-80 bg-background border-r transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-[hsl(var(--accent-pink))]/20 via-[hsl(var(--accent-mint))]/20 to-[hsl(var(--accent-lilac))]/20">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5" />
          <h2 className="font-semibold">Messages</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
                <Filter className="h-3 w-3" />
                <span className="capitalize">{filter === "all" ? "All" : filter}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setFilter("all")}>
                All Messages
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("unread")}>
                Unread
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("archived")}>
                Archived
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-65px)]">
        {loading ? (
          <div className="p-3 text-center text-muted-foreground text-sm">
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-3 text-center text-muted-foreground text-sm">
            No conversations yet
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map((conv) => (
              <div
                key={`${conv.jobId}-${conv.otherUserId}`}
                className={cn(
                  "group relative hover:bg-accent transition-colors",
                  activeJobId === conv.jobId && activeUserId === conv.otherUserId && "bg-accent"
                )}
              >
                <button
                  onClick={() => handleConversationClick(conv.jobId, conv.otherUserId)}
                  className="w-full p-2.5 text-left"
                >
                  <div className="flex items-start gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={conv.otherUserAvatar || undefined} />
                      <AvatarFallback className="text-xs">
                        {conv.otherUserName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="font-medium text-xs truncate">
                          {conv.otherUserName}
                        </p>
                        {conv.unreadCount > 0 && (
                          <Badge variant="default" className="ml-2 h-4 text-[10px] px-1.5">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-0.5 truncate">
                        {conv.jobTitle}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.lastMessage}
                      </p>
                    </div>
                  </div>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleDeleteConversation(conv.jobId, conv.otherUserId, e)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
