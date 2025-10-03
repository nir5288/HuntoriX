import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatSidebar } from "@/components/ChatSidebar";
import { MessageThread } from "@/components/MessageThread";
import { MessageInput } from "@/components/MessageInput";
import { Header } from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { Menu, ArrowLeft, User } from "lucide-react";
import { Link } from "react-router-dom";

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

const Messages = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [otherUserName, setOtherUserName] = useState("");
  const [otherUserRole, setOtherUserRole] = useState<string | null>(null);
  const [otherUserAvatar, setOtherUserAvatar] = useState<string | null>(null);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState("");

  const jobId = searchParams.get("job");
  const otherUserId = searchParams.get("with");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (jobId && otherUserId) {
      loadMessages();
      loadConversationDetails();
      markMessagesAsRead();

      const channel = supabase
        .channel(`messages-${jobId}-${otherUserId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `job_id=eq.${jobId}`,
          },
          (payload) => {
            const newMessage = payload.new as Message;
            if (
              (newMessage.from_user === user.id && newMessage.to_user === otherUserId) ||
              (newMessage.from_user === otherUserId && newMessage.to_user === user.id)
            ) {
              loadMessages();
              // Mark as read if I'm the recipient
              if (newMessage.to_user === user.id) {
                markMessagesAsRead();
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [jobId, otherUserId, user]);

  const loadMessages = async () => {
    if (!jobId || !otherUserId || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          from_profile:profiles!messages_from_user_fkey(name, avatar_url)
        `)
        .eq("job_id", jobId)
        .or(`and(from_user.eq.${user.id},to_user.eq.${otherUserId}),and(from_user.eq.${otherUserId},to_user.eq.${user.id})`)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    if (!jobId || !otherUserId || !user) return;

    try {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("job_id", jobId)
        .eq("from_user", otherUserId)
        .eq("to_user", user.id)
        .eq("is_read", false);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const loadConversationDetails = async () => {
    if (!jobId || !otherUserId) return;

    try {
      const [{ data: profileData }, { data: job }] = await Promise.all([
        supabase.rpc('get_public_profile', { profile_id: otherUserId }),
        supabase.from("jobs").select("title").eq("id", jobId).single(),
      ]);
      
      // get_public_profile returns an array, get first item
      const profile = profileData && profileData.length > 0 ? profileData[0] : null;

      setOtherUserName(profile?.name || "Unknown User");
      setOtherUserRole(profile?.role || null);
      setOtherUserAvatar(profile?.avatar_url || null);
      
      // Format last seen
      if (profile?.last_seen) {
        const lastSeenDate = new Date(profile.last_seen);
        const now = new Date();
        const diffMs = now.getTime() - lastSeenDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 5) {
          setLastSeen("Online");
        } else if (diffMins < 60) {
          setLastSeen(`Last seen ${diffMins}m ago`);
        } else if (diffMins < 1440) {
          const hours = Math.floor(diffMins / 60);
          setLastSeen(`Last seen ${hours}h ago`);
        } else {
          const days = Math.floor(diffMins / 1440);
          setLastSeen(`Last seen ${days}d ago`);
        }
      } else {
        setLastSeen("Offline");
      }
      
      setJobTitle(job?.title || "Unknown Job");
    } catch (error) {
      console.error("Error loading conversation details:", error);
    }
  };

  const handleSendMessage = async (messageText: string) => {
    if (!user || !jobId || !otherUserId) return;

    const { error } = await supabase.from("messages").insert({
      job_id: jobId,
      from_user: user.id,
      to_user: otherUserId,
      body: messageText,
    } as any);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      throw error;
    }

    // Create notification for receiver
    try {
      // Fetch sender's profile to get their name
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      const senderName = senderProfile?.name || 'Someone';

      await supabase
        .from('notifications')
        .insert({
          user_id: otherUserId,
          type: 'new_message',
          title: `New message from ${senderName}`,
          message: messageText.length > 100 ? messageText.substring(0, 100) + '...' : messageText,
          payload: { 
            job_id: jobId,
            from_user: user.id,
          },
        } as any);
    } catch (notifErr) {
      console.error('Error creating notification:', notifErr);
    }

    loadMessages();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-[hsl(var(--surface))] to-background">
      <Header />
      <ChatSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? "ml-80" : "ml-0"
        }`}
      >
        <div className="h-[calc(100vh-64px)] flex flex-col">
          {jobId && otherUserId ? (
            <>
              <div className="p-4 border-b bg-gradient-to-r from-[hsl(var(--accent-pink))]/10 via-[hsl(var(--accent-mint))]/10 to-[hsl(var(--accent-lilac))]/10 flex items-center gap-3">
                {!sidebarOpen && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft className="h-5 w-5" />
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
                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-[hsl(var(--accent-mint))] border-2 border-background rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-base">{otherUserName}</h2>
                      {otherUserRole && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {otherUserRole}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{jobTitle}</p>
                    {lastSeen && (
                      <p className="text-xs text-[hsl(var(--accent-mint))]">{lastSeen}</p>
                    )}
                  </div>
                </Link>
              </div>

              <MessageThread
                messages={messages}
                currentUserId={user?.id || ""}
                loading={loading}
              />

              <MessageInput
                onSend={handleSendMessage}
                disabled={!user || !jobId || !otherUserId}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
              {!sidebarOpen && (
                <Button
                  variant="outline"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-4 w-4 mr-2" />
                  Open Conversations
                </Button>
              )}
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
