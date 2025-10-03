import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X, MessageSquare, ChevronDown } from "lucide-react";
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

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-80 bg-background border-r transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-[hsl(var(--accent-pink))]/20 via-[hsl(var(--accent-mint))]/20 to-[hsl(var(--accent-lilac))]/20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 hover:opacity-80 transition">
              <MessageSquare className="h-5 w-5" />
              <h2 className="font-semibold capitalize">{filter === "all" ? "All Messages" : filter}</h2>
              <ChevronDown className="h-4 w-4" />
            </button>
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
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-73px)]">
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No conversations yet
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map((conv) => (
              <button
                key={`${conv.jobId}-${conv.otherUserId}`}
                onClick={() => handleConversationClick(conv.jobId, conv.otherUserId)}
                className={cn(
                  "w-full p-4 text-left hover:bg-accent transition-colors",
                  activeJobId === conv.jobId && activeUserId === conv.otherUserId && "bg-accent"
                )}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={conv.otherUserAvatar || undefined} />
                    <AvatarFallback>
                      {conv.otherUserName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm truncate">
                        {conv.otherUserName}
                      </p>
                      {conv.unreadCount > 0 && (
                        <Badge variant="default" className="ml-2">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1 truncate">
                      {conv.jobTitle}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.lastMessage}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
