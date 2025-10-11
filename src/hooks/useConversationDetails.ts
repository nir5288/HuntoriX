import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { calculateStatusIndicator, formatLastSeen } from '@/utils/statusUtils';

interface StatusIndicator {
  color: string;
  text: string;
}

interface UseConversationDetailsProps {
  otherUserId: string | null;
  jobId: string | null;
}

export const useConversationDetails = ({ otherUserId, jobId }: UseConversationDetailsProps) => {
  const [otherUserName, setOtherUserName] = useState("");
  const [otherUserRole, setOtherUserRole] = useState<string | null>(null);
  const [otherUserAvatar, setOtherUserAvatar] = useState<string | null>(null);
  const [otherUserStatus, setOtherUserStatus] = useState<string>("");
  const [otherUserShowStatus, setOtherUserShowStatus] = useState<boolean>(true);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [statusIndicator, setStatusIndicator] = useState<StatusIndicator | null>(null);
  const [jobTitle, setJobTitle] = useState("");

  const loadConversationDetails = async () => {
    if (!otherUserId) return;
    
    try {
      // Fetch profile data including status
      const { data: profileData } = await supabase.rpc('get_public_profile', {
        profile_id: otherUserId
      });
      
      const { data: prefsData } = await supabase
        .from("profiles")
        .select("show_status, status")
        .eq("id", otherUserId)
        .single();

      let jobPromise = null;
      if (jobId) {
        jobPromise = supabase
          .from("jobs")
          .select("title")
          .eq("id", jobId)
          .single();
      }
      
      const jobResult = await (jobPromise || Promise.resolve({ data: null }));
      const job = jobResult?.data;

      // get_public_profile returns an array, get first item
      const profile = profileData && profileData.length > 0 ? profileData[0] : null;
      
      setOtherUserName(profile?.name || "Unknown User");
      setOtherUserRole(profile?.role || null);
      setOtherUserAvatar(profile?.avatar_url || null);
      setOtherUserShowStatus(prefsData?.show_status ?? true);
      
      const userStatus = prefsData?.status || 'online';
      setOtherUserStatus(userStatus);

      // Calculate status and last seen
      const { statusIndicator: indicator, lastSeenText } = calculateStatusIndicator(
        prefsData?.show_status ?? true,
        profile?.last_seen,
        userStatus
      );
      
      setStatusIndicator(indicator);
      setLastSeen(lastSeenText);
      setJobTitle(job?.title || "Unknown Job");
    } catch (error) {
      console.error("Error loading conversation details:", error);
    }
  };

  useEffect(() => {
    loadConversationDetails();
  }, [otherUserId, jobId]);

  return {
    otherUserName,
    otherUserRole,
    otherUserAvatar,
    otherUserStatus,
    otherUserShowStatus,
    lastSeen,
    statusIndicator,
    jobTitle,
    loadConversationDetails
  };
};
