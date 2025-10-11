import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface UseVideoCallActionsProps {
  userId: string | undefined;
  otherUserId: string | null;
  jobId: string | null;
  onMessagesReload: () => void;
}

export const useVideoCallActions = ({ 
  userId, 
  otherUserId, 
  jobId, 
  onMessagesReload 
}: UseVideoCallActionsProps) => {
  const { toast } = useToast();
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [scheduleTime, setScheduleTime] = useState<string>("10:00");
  const [schedulePopoverOpen, setSchedulePopoverOpen] = useState(false);
  const [videoCallMenuOpen, setVideoCallMenuOpen] = useState(false);

  const handleScheduleCall = async () => {
    if (!scheduleDate || !userId || !otherUserId) return;

    const scheduledDateTime = `${format(scheduleDate, "PPP")} at ${scheduleTime}`;
    
    const callInvitation = {
      type: 'video_call_invitation',
      callType: 'scheduled',
      scheduledDateTime,
      scheduledDate: scheduleDate.toISOString(),
      scheduledTime: scheduleTime,
      status: 'pending'
    };

    await supabase.from("messages").insert({
      job_id: jobId,
      from_user: userId,
      to_user: otherUserId,
      body: `📞 Video call invitation for ${scheduledDateTime}`,
      attachments: callInvitation
    } as any);

    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single();
    
    const senderName = senderProfile?.name || 'Someone';
    
    await supabase.from('notifications').insert({
      user_id: otherUserId,
      type: 'video_call_invitation',
      title: `Video call invitation from ${senderName}`,
      message: `Scheduled for ${scheduledDateTime}`,
      payload: {
        job_id: jobId,
        from_user: userId,
        callType: 'scheduled'
      }
    } as any);

    setSchedulePopoverOpen(false);
    setVideoCallMenuOpen(false);
    toast({
      title: "Invitation sent",
      description: `Video call scheduled for ${scheduledDateTime}`,
    });
    onMessagesReload();
  };

  const handleInstantCall = async () => {
    if (!userId || !otherUserId) return;

    const callInvitation = {
      type: 'video_call_invitation',
      callType: 'instant',
      status: 'pending'
    };

    await supabase.from("messages").insert({
      job_id: jobId,
      from_user: userId,
      to_user: otherUserId,
      body: `📞 Instant video call request`,
      attachments: callInvitation
    } as any);

    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single();
    
    const senderName = senderProfile?.name || 'Someone';
    
    await supabase.from('notifications').insert({
      user_id: otherUserId,
      type: 'video_call_invitation',
      title: `Video call request from ${senderName}`,
      message: `Wants to start an instant video call`,
      payload: {
        job_id: jobId,
        from_user: userId,
        callType: 'instant'
      }
    } as any);

    setVideoCallMenuOpen(false);
    toast({
      title: "Call request sent",
      description: "Waiting for response...",
    });
    onMessagesReload();
  };

  const handleCallResponse = async (
    messageId: string, 
    response: 'accept' | 'decline' | 'suggest', 
    suggestedDate?: Date, 
    suggestedTime?: string
  ) => {
    if (!userId || !otherUserId) return;

    // Update the original invitation message
    const { data: originalMsg } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (!originalMsg) return;

    const originalInvitation = originalMsg.attachments as any;
    
    if (response === 'accept') {
      // Update invitation status
      await supabase
        .from('messages')
        .update({
          attachments: { ...originalInvitation, status: 'accepted' }
        })
        .eq('id', messageId);

      // Return whether to open video call
      const shouldOpenVideoCall = originalInvitation.callType === 'instant';

      toast({
        title: "Call accepted",
        description: originalInvitation.callType === 'instant' 
          ? "Starting video call..." 
          : "The scheduled call has been confirmed",
      });

      onMessagesReload();
      return { shouldOpenVideoCall };
    } else if (response === 'decline') {
      await supabase
        .from('messages')
        .update({
          attachments: { ...originalInvitation, status: 'declined' }
        })
        .eq('id', messageId);

      toast({
        title: "Call declined",
      });
    } else if (response === 'suggest' && suggestedDate && suggestedTime) {
      const scheduledDateTime = `${format(suggestedDate, "PPP")} at ${suggestedTime}`;
      
      // Send a new invitation with the suggested time
      const newInvitation = {
        type: 'video_call_invitation',
        callType: 'scheduled',
        scheduledDateTime,
        scheduledDate: suggestedDate.toISOString(),
        scheduledTime: suggestedTime,
        status: 'pending',
        isCounterProposal: true
      };

      await supabase.from("messages").insert({
        job_id: jobId,
        from_user: userId,
        to_user: otherUserId,
        body: `📞 Suggested new time: ${scheduledDateTime}`,
        attachments: newInvitation
      } as any);

      // Update original invitation
      await supabase
        .from('messages')
        .update({
          attachments: { ...originalInvitation, status: 'counter_proposed' }
        })
        .eq('id', messageId);

      toast({
        title: "New time suggested",
        description: scheduledDateTime,
      });
    }

    onMessagesReload();
    return { shouldOpenVideoCall: false };
  };

  return {
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
  };
};
