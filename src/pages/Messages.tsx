/**
 * Messages Page
 * 
 * Provides a real-time messaging interface between users, with support for:
 * - Text messages with file attachments
 * - Message replies and threads
 * - Video call invitations (instant and scheduled)
 * - User presence and status indicators
 * - Desktop and mobile responsive layouts
 * 
 * Architecture:
 * - useMessagesData: Handles message loading and real-time updates
 * - useConversationDetails: Manages user profile and status information
 * - useVideoCallActions: Handles video call scheduling and instant calls
 * - ConversationHeader: Displays user info and video call controls
 * - MessageThread: Renders the conversation messages
 * - MessageInput: Handles message composition and file uploads
 */

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ChatSidebar } from "@/components/ChatSidebar";
import { MessageThread } from "@/components/MessageThread";
import { MessageInput } from "@/components/MessageInput";
import { VideoCall } from "@/components/VideoCall";
import { useToast } from "@/hooks/use-toast";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { useUpdateLastSeen } from "@/hooks/useUpdateLastSeen";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

// Custom hooks
import { useMessagesData } from "@/hooks/useMessagesData";
import { useConversationDetails } from "@/hooks/useConversationDetails";
import { useVideoCallActions } from "@/hooks/useVideoCallActions";

// Components
import { ConversationHeader } from "@/components/messages/ConversationHeader";
import { EmptyConversationState } from "@/components/messages/EmptyConversationState";

// Utils
import { uploadMessageAttachments, createMessageNotification } from "@/utils/messageUtils";

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
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { status: myStatus } = useUserPreferences();
  useUpdateLastSeen(); // Update last_seen timestamp
  const isMobile = useIsMobile();
  const { open: mainSidebarOpen } = useSidebar();

  // URL parameters
  const jobId = searchParams.get("job");
  const otherUserId = searchParams.get("with");
  
  // Handle "null" string from URL
  const validJobId = jobId && jobId !== "null" ? jobId : null;

  // UI state
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    body: string;
    senderName: string;
  } | null>(null);
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);

  // Custom hooks for data and actions
  const { messages, loading, loadMessages, markMessagesAsRead } = useMessagesData({
    userId: user?.id,
    otherUserId,
    jobId: validJobId
  });

  const {
    otherUserName,
    otherUserRole,
    otherUserAvatar,
    lastSeen,
    statusIndicator,
    jobTitle
  } = useConversationDetails({
    otherUserId,
    jobId: validJobId
  });

  const {
    scheduleDate,
    setScheduleDate,
    scheduleTime,
    setScheduleTime,
    schedulePopoverOpen,
    setSchedulePopoverOpen,
    videoCallMenuOpen,
    setVideoCallMenuOpen,
    handleScheduleCall,
    handleInstantCall,
    handleCallResponse
  } = useVideoCallActions({
    userId: user?.id,
    otherUserId,
    jobId: validJobId,
    onMessagesReload: () => loadMessages(true)
  });

  /**
   * Auto-open last conversation on initial load (desktop only)
   * On mobile, user must explicitly select a conversation
   */
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
            const lastOtherUserId = 
              lastMsg.from_user === user.id ? lastMsg.to_user : lastMsg.from_user;
            navigate(
              `/messages?job=${lastMsg.job_id || 'null'}&with=${lastOtherUserId}`,
              { replace: true }
            );
          }
        } catch (error) {
          console.error("Error loading last conversation:", error);
        }
      };
      loadLastConversation();
    }
  }, [user, otherUserId, navigate, isMobile]);

  /**
   * Handle sending a new message with optional file attachments and reply
   */
  const handleSendMessage = async (
    messageText: string, 
    files: File[], 
    replyToId?: string
  ) => {
    if (!user || !otherUserId) return;

    try {
      // Upload files to storage if any
      const attachments = files.length > 0 
        ? await uploadMessageAttachments(files, user.id)
        : [];

      // Insert message into database
      const { error } = await supabase.from("messages").insert({
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
      await createMessageNotification(
        otherUserId,
        user.id,
        messageText,
        validJobId
      );

      loadMessages(true);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive"
      });
    }
  };

  /**
   * Wrapper for handleCallResponse that also opens video call if needed
   */
  const handleCallResponseWithVideoOpen = async (
    messageId: string,
    response: 'accept' | 'decline' | 'suggest',
    suggestedDate?: Date,
    suggestedTime?: string
  ) => {
    const result = await handleCallResponse(
      messageId,
      response,
      suggestedDate,
      suggestedTime
    );
    
    if (result?.shouldOpenVideoCall) {
      setIsVideoCallOpen(true);
    }
  };

  return (
    <div className="h-screen flex">
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
      {(!isMobile || otherUserId) && otherUserId && (
        <div
          className={cn(
            "h-full flex flex-col overflow-hidden",
            isMobile ? "fixed inset-0 w-full h-full z-10 bg-background" : "flex-1 max-w-[65%]"
          )}
        >
          {/* Fixed Header */}
          <ConversationHeader
                  isMobile={isMobile}
                  otherUserId={otherUserId}
                  otherUserName={otherUserName}
                  otherUserRole={otherUserRole}
                  otherUserAvatar={otherUserAvatar}
                  statusIndicator={statusIndicator}
                  lastSeen={lastSeen}
                  jobTitle={jobTitle}
                  videoCallMenuOpen={videoCallMenuOpen}
                  setVideoCallMenuOpen={setVideoCallMenuOpen}
                  schedulePopoverOpen={schedulePopoverOpen}
                  setSchedulePopoverOpen={setSchedulePopoverOpen}
                  scheduleDate={scheduleDate}
                  setScheduleDate={setScheduleDate}
                  scheduleTime={scheduleTime}
                  setScheduleTime={setScheduleTime}
                  onScheduleCall={handleScheduleCall}
                  onInstantCall={handleInstantCall}
                  onBack={() => navigate('/messages', { replace: true })}
                />

                {/* Scrolling Message Thread */}
                <div className="flex-1 overflow-hidden min-h-0">
                  <MessageThread
                    messages={messages}
                    currentUserId={user?.id || ""}
                    currentUserProfile={profile}
                    loading={loading}
                    onEdited={loadMessages}
                    onReply={(message) => {
                      const isFromMe = message.from_user === user.id;
                      setReplyingTo({
                        id: message.id,
                        body: message.body,
                        senderName: isFromMe
                          ? "yourself"
                          : message.from_profile?.name || "User"
                      });
                    }}
                    onCallResponse={handleCallResponseWithVideoOpen}
                  />
                </div>

                {/* Fixed Input */}
                <div
                  className={cn(
                    "shrink-0",
                    isMobile && "bg-background border-t"
                  )}
                >
                  <MessageInput
                    onSend={handleSendMessage}
                    disabled={!user || !otherUserId}
                    replyingTo={replyingTo}
                    onCancelReply={() => setReplyingTo(null)}
                    onInputClick={markMessagesAsRead}
                  />
                </div>
        </div>
      )}

      {/* Empty state for desktop when no conversation selected */}
      {!isMobile && !otherUserId && (
        <div className="flex-1 max-w-[65%]">
          <EmptyConversationState />
        </div>
      )}

      {/* Video Call Dialog */}
      {otherUserId && (
        <VideoCall
          isOpen={isVideoCallOpen}
          onClose={() => setIsVideoCallOpen(false)}
          otherUserId={otherUserId}
          otherUserName={otherUserName}
          otherUserAvatar={otherUserAvatar}
          currentUserId={user?.id || ""}
          currentUserName={profile?.name || "User"}
          roomId={`${validJobId || 'direct'}-${[user?.id, otherUserId].sort().join('-')}`}
          jobId={validJobId}
        />
      )}
    </div>
  );
};

export default Messages;
