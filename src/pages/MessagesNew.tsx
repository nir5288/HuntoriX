import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Send, Menu, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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

interface Conversation {
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  jobId: string | null;
  jobTitle: string;
  lastMessage: string;
  lastMessageTime: string;
}

const MessagesNew = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [otherUserName, setOtherUserName] = useState("");
  const [otherUserAvatar, setOtherUserAvatar] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState("");

  const jobId = searchParams.get("job");
  const otherUserId = searchParams.get("with");
  const validJobId = jobId && jobId !== "null" ? jobId : null;

  // Load conversations
  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadConversations();
  }, [user, navigate]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (!user || !otherUserId) return;
    
    loadMessages();
    loadConversationDetails();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages-${validJobId || 'direct'}-${otherUserId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "messages",
        filter: validJobId ? `job_id=eq.${validJobId}` : `job_id=is.null`
      }, () => {
        loadMessages();
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
          });
        }
      });

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
      setMessages(data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const loadConversationDetails = async () => {
    if (!otherUserId) return;

    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", otherUserId)
        .single();

      if (profileData) {
        setOtherUserName(profileData.name || "Unknown User");
        setOtherUserAvatar(profileData.avatar_url || null);
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
      const { error } = await supabase.from("messages").insert({
        job_id: validJobId,
        from_user: user.id,
        to_user: otherUserId,
        body: messageText,
      } as any);

      if (error) throw error;

      setMessageText("");
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

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className={cn(
        "border-r bg-background transition-all duration-300",
        sidebarOpen ? "w-64" : "w-0 overflow-hidden"
      )}>
        <div className="p-4 border-b">
          <h2 className="font-semibold">Conversations</h2>
        </div>
        <ScrollArea className="h-[calc(100vh-64px)]">
          {conversations.map((conv) => (
            <button
              key={`${conv.jobId}-${conv.otherUserId}`}
              onClick={() => navigate(`/messages-new?job=${conv.jobId || 'null'}&with=${conv.otherUserId}`)}
              className={cn(
                "w-full p-3 text-left hover:bg-accent transition-colors border-b",
                otherUserId === conv.otherUserId && "bg-accent"
              )}
            >
              <div className="flex items-start gap-2">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={conv.otherUserAvatar || undefined} />
                  <AvatarFallback>
                    {conv.otherUserName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{conv.otherUserName}</p>
                  <p className="text-xs text-muted-foreground truncate">{conv.jobTitle}</p>
                  <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                </div>
              </div>
            </button>
          ))}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {otherUserId ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                {otherUserAvatar ? (
                  <img src={otherUserAvatar} alt={otherUserName} className="h-10 w-10 rounded-full" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <h2 className="font-semibold">{otherUserName}</h2>
                  <p className="text-xs text-muted-foreground">{jobTitle || "Direct Message"}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isFromMe = msg.from_user === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-2",
                        isFromMe ? "justify-end" : "justify-start"
                      )}
                    >
                      {!isFromMe && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={msg.from_profile?.avatar_url || undefined} />
                          <AvatarFallback>
                            {msg.from_profile?.name?.substring(0, 2).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          "rounded-lg px-4 py-2 max-w-[70%]",
                          isFromMe
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <p className="text-sm">{msg.body}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="min-h-[60px]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
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
  );
};

export default MessagesNew;
