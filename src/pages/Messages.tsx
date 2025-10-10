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
import { VideoCall } from "@/components/VideoCall";
import { useToast } from "@/hooks/use-toast";
import { Menu, ArrowLeft, User, Circle, Video, CalendarIcon, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { useUpdateLastSeen } from "@/hooks/useUpdateLastSeen";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
interface Message {
  id: string;
  from_user: string;
  to_user: string;
  body: string;
  created_at: string;
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
const Messages = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    user,
    profile
  } = useAuth();
  const {
    toast
  } = useToast();
  const {
    status: myStatus
  } = useUserPreferences();
  useUpdateLastSeen(); // Update last_seen timestamp
  const isMobile = useIsMobile();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatSidebarCollapsed, setChatSidebarCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [otherUserName, setOtherUserName] = useState("");
  const [otherUserRole, setOtherUserRole] = useState<string | null>(null);
  const [otherUserAvatar, setOtherUserAvatar] = useState<string | null>(null);
  const [otherUserStatus, setOtherUserStatus] = useState<string>("");
  const [otherUserShowStatus, setOtherUserShowStatus] = useState<boolean>(true);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [statusIndicator, setStatusIndicator] = useState<{
    color: string;
    text: string;
  } | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    body: string;
    senderName: string;
  } | null>(null);
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [scheduleTime, setScheduleTime] = useState<string>("10:00");
  const [schedulePopoverOpen, setSchedulePopoverOpen] = useState(false);
  const jobId = searchParams.get("job");
  const otherUserId = searchParams.get("with");

  // Handle "null" string from URL
  const validJobId = jobId && jobId !== "null" ? jobId : null;

  // Auto-open last conversation on initial load (desktop only)
  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    // If no conversation selected and on desktop, load the most recent one
    if (!otherUserId && !isMobile) {
      const loadLastConversation = async () => {
        try {
          const { data: messages } = await supabase
            .from("messages")
            .select("job_id, from_user, to_user")
            .or(`from_user.eq.${user.id},to_user.eq.${user.id}`)
            .order("created_at", { ascending: false })
            .limit(1);

          if (messages && messages.length > 0) {
            const lastMsg = messages[0];
            const lastOtherUserId = lastMsg.from_user === user.id ? lastMsg.to_user : lastMsg.from_user;
            navigate(`/messages?job=${lastMsg.job_id || 'null'}&with=${lastOtherUserId}`, { replace: true });
          }
        } catch (error) {
          console.error("Error loading last conversation:", error);
        }
      };
      loadLastConversation();
    }
  }, [user, otherUserId, navigate, isMobile]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (otherUserId) {
      loadMessages();
      loadConversationDetails();
      markMessagesAsRead();
      const channel = supabase.channel(`messages-${validJobId || 'direct'}-${otherUserId}`).on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "messages",
        filter: validJobId ? `job_id=eq.${validJobId}` : `job_id=is.null`
      }, payload => {
        const newMessage = payload.new as Message;
        if (newMessage.from_user === user.id && newMessage.to_user === otherUserId || newMessage.from_user === otherUserId && newMessage.to_user === user.id) {
          loadMessages(true);
          // Mark as read if I'm the recipient
          if (newMessage.to_user === user.id) {
            markMessagesAsRead();
          }
        }
      }).subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [validJobId, otherUserId, user]);
  const loadMessages = async (silent: boolean = false) => {
    if (!otherUserId || !user) return;
    if (!silent && messages.length === 0) setLoading(true);
    try {
      let query = supabase.from("messages").select(`
          *,
          from_profile:profiles!messages_from_user_fkey(name, avatar_url)
        `);

      // Filter by job_id if present
      if (validJobId) {
        query = query.eq("job_id", validJobId);
      } else {
        query = query.is("job_id", null);
      }
      const {
        data,
        error
      } = await query.or(`and(from_user.eq.${user.id},to_user.eq.${otherUserId}),and(from_user.eq.${otherUserId},to_user.eq.${user.id})`).order("created_at", {
        ascending: true
      });
      if (error) throw error;

      // Fetch replied messages separately
      const messagesWithReplies = await Promise.all((data || []).map(async (msg: any) => {
        if (msg.reply_to) {
          const {
            data: repliedMsg
          } = await supabase.from("messages").select("body, from_profile:profiles!messages_from_user_fkey(name)").eq("id", msg.reply_to).single();
          return {
            ...msg,
            replied_message: repliedMsg
          };
        }
        return msg;
      }));
      setMessages(messagesWithReplies);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      if (!silent && messages.length === 0) setLoading(false);
    }
  };
  const markMessagesAsRead = async () => {
    if (!otherUserId || !user) return;
    try {
      let query = supabase.from("messages").update({
        is_read: true
      });
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
      // Fetch profile data including status
      const {
        data: profileData
      } = await supabase.rpc('get_public_profile', {
        profile_id: otherUserId
      });
      const {
        data: prefsData
      } = await supabase.from("profiles").select("show_status, status").eq("id", otherUserId).single();
      let jobPromise = null;
      if (validJobId) {
        jobPromise = supabase.from("jobs").select("title").eq("id", validJobId).single();
      }
      const jobResult = await (jobPromise || Promise.resolve({
        data: null
      }));
      const job = jobResult?.data;

      // get_public_profile returns an array, get first item
      const profile = profileData && profileData.length > 0 ? profileData[0] : null;
      setOtherUserName(profile?.name || "Unknown User");
      setOtherUserRole(profile?.role || null);
      setOtherUserAvatar(profile?.avatar_url || null);
      setOtherUserShowStatus(prefsData?.show_status ?? true);
      const userStatus = prefsData?.status || 'online';
      setOtherUserStatus(userStatus);

      // Format status and last seen
      if (!prefsData?.show_status) {
        setStatusIndicator(null);
        setLastSeen("Active recently");
      } else if (profile?.last_seen) {
        const lastSeenDate = new Date(profile.last_seen);
        const now = new Date();
        const diffMs = now.getTime() - lastSeenDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        // Check if they're currently active (within 2 minutes)
        if (diffMins < 2) {
          // Check their status preference from database
          if (userStatus === 'away') {
            setStatusIndicator({
              color: "text-yellow-500",
              text: "Away"
            });
            setLastSeen(null);
          } else {
            setStatusIndicator({
              color: "text-green-500",
              text: "Online"
            });
            setLastSeen(null);
          }
        } else if (diffMins < 60) {
          setStatusIndicator(null);
          setLastSeen(`Last seen ${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`);
        } else if (diffMins < 1440) {
          const hours = Math.floor(diffMins / 60);
          setStatusIndicator(null);
          setLastSeen(`Last seen ${hours} hour${hours !== 1 ? 's' : ''} ago`);
        } else if (diffMins < 2880) {
          setStatusIndicator(null);
          setLastSeen("Last seen yesterday");
        } else {
          setStatusIndicator(null);
          const dateStr = lastSeenDate.toLocaleDateString();
          setLastSeen(`Last seen on ${dateStr}`);
        }
      } else {
        setStatusIndicator(null);
        setLastSeen("Active recently");
      }
      setJobTitle(job?.title || "Unknown Job");
    } catch (error) {
      console.error("Error loading conversation details:", error);
    }
  };
  const handleSendMessage = async (messageText: string, files: File[], replyToId?: string) => {
    if (!user || !otherUserId) return;

    // Upload files to storage if any
    const attachments: Array<{
      name: string;
      url: string;
      type: string;
      size: number;
    }> = [];
    if (files.length > 0) {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const {
          error: uploadError,
          data
        } = await supabase.storage.from('profile-images').upload(fileName, file);
        if (uploadError) {
          toast({
            title: "Error",
            description: `Failed to upload ${file.name}`,
            variant: "destructive"
          });
          throw uploadError;
        }
        const {
          data: {
            publicUrl
          }
        } = supabase.storage.from('profile-images').getPublicUrl(fileName);
        attachments.push({
          name: file.name,
          url: publicUrl,
          type: file.type,
          size: file.size
        });
      }
    }
    const {
      error
    } = await supabase.from("messages").insert({
      job_id: validJobId,
      from_user: user.id,
      to_user: otherUserId,
      body: messageText,
      attachments: attachments.length > 0 ? attachments : null,
      reply_to: replyToId || null
    } as any);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
      throw error;
    }

    // Create notification for receiver
    try {
      // Fetch sender's profile to get their name
      const {
        data: senderProfile
      } = await supabase.from('profiles').select('name').eq('id', user.id).single();
      const senderName = senderProfile?.name || 'Someone';
      await supabase.from('notifications').insert({
        user_id: otherUserId,
        type: 'new_message',
        title: `New message from ${senderName}`,
        message: messageText.length > 100 ? messageText.substring(0, 100) + '...' : messageText,
        payload: {
          job_id: validJobId,
          from_user: user.id
        }
      } as any);
    } catch (notifErr) {
      console.error('Error creating notification:', notifErr);
    }
    loadMessages(true);
  };
  return <div className="h-screen flex">
      {/* Show sidebar on desktop OR on mobile when no conversation is selected */}
      {(!isMobile || !otherUserId) && (
        <ChatSidebar
          isOpen={true} 
          onClose={() => {}}
          isCollapsed={false}
          onToggleCollapse={() => {}}
        />
      )}

      {/* Show message area on desktop OR on mobile when conversation is selected */}
      {(!isMobile || otherUserId) && (
        <div className={cn(
          "flex flex-col min-w-0",
          isMobile ? "fixed inset-0 w-full h-full" : "flex-1 max-w-[65%]"
        )}>
          <div className="h-full flex flex-col overflow-hidden">
              {otherUserId ? <>
                   {/* Fixed Header */}
                   <div className={cn(
                     "h-[72px] shrink-0 border-b bg-gradient-to-r from-[hsl(var(--accent-pink))]/10 via-[hsl(var(--accent-mint))]/10 to-[hsl(var(--accent-lilac))]/10 flex items-center gap-3 px-4",
                     isMobile && "bg-background"
                   )}>
                  {/* Back button on mobile */}
                  {isMobile && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => navigate('/messages')}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  )}
                
                  
                  <Link to={otherUserRole === "headhunter" ? `/profile/headhunter/${otherUserId}` : `/profile/employer/${otherUserId}`} className="flex items-center gap-3 flex-1 hover:opacity-80 transition">
                    <div className="relative">
                      {otherUserAvatar ? <img src={otherUserAvatar} alt={otherUserName} className="h-10 w-10 rounded-full object-cover" /> : <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] flex items-center justify-center">
                          <User className="h-5 w-5" />
                        </div>}
                      {statusIndicator && <Circle className={`absolute bottom-0 right-0 h-3 w-3 fill-current ${statusIndicator.color} border-2 border-background rounded-full`} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-base">{otherUserName}</h2>
                        {otherUserRole && <Badge variant="outline" className="text-xs capitalize">
                            {otherUserRole}
                          </Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{jobTitle}</p>
                       {statusIndicator ? <div className="flex items-center gap-1.5 text-xs">
                          <span className={statusIndicator.color}>●</span>
                          <span className={statusIndicator.color}>{statusIndicator.text}</span>
                        </div> : lastSeen ? <p className="text-xs text-muted-foreground">{lastSeen}</p> : null}
                    </div>
                  </Link>
                  
                  <Popover open={schedulePopoverOpen} onOpenChange={setSchedulePopoverOpen}>
                    <PopoverTrigger asChild>
                      {isMobile ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 hover:opacity-90"
                          title="Schedule video call"
                        >
                          <Video className="h-5 w-5 text-white" />
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          className="h-10 px-4 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 hover:opacity-90 shadow-lg flex items-center gap-2"
                          title="Schedule a video call"
                        >
                          <Video className="h-4 w-4" />
                          <span className="text-sm font-semibold">Schedule a video call</span>
                        </Button>
                      )}
                    </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <div className="p-4 space-y-4">
                      <div className="space-y-2">
                        <Label>Select Date</Label>
                        <Calendar
                          mode="single"
                          selected={scheduleDate}
                          onSelect={setScheduleDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className={cn("pointer-events-auto")}
                        />
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
                      <Button
                        className="w-full"
                        onClick={() => {
                          if (scheduleDate) {
                            toast({
                              title: "Video call scheduled",
                              description: `Scheduled for ${format(scheduleDate, "PPP")} at ${scheduleTime}`,
                            });
                            setSchedulePopoverOpen(false);
                          } else {
                            toast({
                              title: "Please select a date",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        Confirm Schedule
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                </div>

              {/* Scrolling Message Thread */}
              <div className="flex-1 overflow-hidden min-h-0">
                <MessageThread messages={messages} currentUserId={user?.id || ""} currentUserProfile={profile} loading={loading} onEdited={loadMessages} onReply={message => {
              const isFromMe = message.from_user === user.id;
              setReplyingTo({
                id: message.id,
                body: message.body,
                senderName: isFromMe ? "yourself" : message.from_profile?.name || "User"
              });
            }} />
              </div>

              {/* Fixed Input */}
              <div className={cn(
                "shrink-0",
                isMobile && "bg-background border-t"
              )}>
                <MessageInput
                  onSend={handleSendMessage} 
                  disabled={!user || !otherUserId} 
                  replyingTo={replyingTo} 
                  onCancelReply={() => setReplyingTo(null)}
                  onInputClick={markMessagesAsRead}
                />
              </div>
            </> : !isMobile && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
        
      {otherUserId && (
          <VideoCall
            isOpen={isVideoCallOpen}
            onClose={() => setIsVideoCallOpen(false)}
            otherUserId={otherUserId}
            otherUserName={otherUserName}
            otherUserAvatar={otherUserAvatar}
            currentUserId={user?.id || ""}
            roomId={`${validJobId || 'direct'}-${[user?.id, otherUserId].sort().join('-')}`}
          />
        )}
      </div>;
};
export default Messages;