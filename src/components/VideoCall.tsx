import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Monitor, MonitorOff, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { playCallSound } from "@/utils/callSounds";

interface VideoCallProps {
  isOpen: boolean;
  onClose: () => void;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  currentUserId: string;
  currentUserName: string;
  roomId: string;
  jobId?: string | null;
}

export const VideoCall = ({
  isOpen,
  onClose,
  otherUserId,
  otherUserName,
  otherUserAvatar,
  currentUserId,
  currentUserName,
  roomId,
}: VideoCallProps) => {
  const { toast } = useToast();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callStatus, setCallStatus] = useState<"connecting" | "connected" | "ended" | "permission-denied">("connecting");
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    initializeCall();

    return () => {
      cleanup();
    };
  }, [isOpen]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const initializeCall = async () => {
    try {
      let stream: MediaStream | null = null;
      
      // Try to get both video and audio first
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setHasCamera(true);
        setIsVideoEnabled(true);
      } catch (videoError: any) {
        console.log("Failed to get video, trying audio only:", videoError);
        
        // If video fails, try audio only
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          setHasCamera(false);
          setIsVideoEnabled(false);
          
          toast({
            title: "Audio-only mode",
            description: "No camera detected. Continuing with audio only.",
          });
        } catch (audioError: any) {
          // If audio also fails, throw error
          throw audioError;
        }
      }

      if (!stream) {
        throw new Error("Failed to get media stream");
      }

      setLocalStream(stream);
      setCallStatus("connecting");
      setPermissionError(null);

      // Create peer connection
      const configuration = {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      };
      const pc = new RTCPeerConnection(configuration);
      peerConnectionRef.current = pc;

      // Add local stream tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        setCallStatus("connected");

        // Ensure we only start once (on first track)
        if (!startedRef.current) {
          startedRef.current = true;
          playCallSound('accept');
          
          // Start duration timer once
          if (!durationIntervalRef.current) {
            durationIntervalRef.current = setInterval(() => {
              setCallDuration(prev => prev + 1);
            }, 1000);
          }
        }
      };

      // Set up signaling channel
      const channel = supabase.channel(`video-call-${roomId}`);
      channelRef.current = channel;

      channel
        .on("broadcast", { event: "offer" }, async ({ payload }) => {
          if (payload.to === currentUserId) {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            channel.send({
              type: "broadcast",
              event: "answer",
              payload: {
                answer: answer,
                to: otherUserId,
                from: currentUserId,
              },
            });
          }
        })
        .on("broadcast", { event: "answer" }, async ({ payload }) => {
          if (payload.to === currentUserId) {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
          }
        })
        .on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
          if (payload.to === currentUserId && payload.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          }
        })
        .on("broadcast", { event: "call-ended" }, ({ payload }) => {
          if (payload.to === currentUserId) {
            playCallSound('end');
            handleEndCall();
          }
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            // Create and send offer if we're the initiator (lower user ID goes first)
            if (currentUserId < otherUserId) {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              
              channel.send({
                type: "broadcast",
                event: "offer",
                payload: {
                  offer: offer,
                  to: otherUserId,
                  from: currentUserId,
                },
              });
            }
          }
        });

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          channel.send({
            type: "broadcast",
            event: "ice-candidate",
            payload: {
              candidate: event.candidate,
              to: otherUserId,
              from: currentUserId,
            },
          });
        }
      };
    } catch (error: any) {
      console.error("Error initializing call:", error);
      setCallStatus("permission-denied");
      
      let errorMessage = "Failed to access microphone.";
      let errorDetails = "";

      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        errorMessage = "Microphone access denied";
        errorDetails = "Please allow access to your microphone in your browser settings, then try again.";
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        errorMessage = "No microphone found";
        errorDetails = "Please connect a microphone to your device.";
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        errorMessage = "Microphone is already in use";
        errorDetails = "Please close other applications using your microphone and try again.";
      } else if (error.name === "OverconstrainedError") {
        errorMessage = "Microphone constraints not satisfied";
        errorDetails = "Your device may not support the required audio settings.";
      } else if (error.name === "TypeError") {
        errorMessage = "Browser does not support audio calls";
        errorDetails = "Please use a modern browser like Chrome, Firefox, or Safari.";
      }

      setPermissionError(errorDetails);
      
      toast({
        title: errorMessage,
        description: errorDetails,
        variant: "destructive",
        duration: 6000,
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleVideo = () => {
    if (!hasCamera) {
      toast({
        title: "No camera available",
        description: "Your device doesn't have a camera connected.",
      });
      return;
    }
    
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current
          ?.getSenders()
          .find((s) => s.track?.kind === "video");
        
        if (sender) {
          sender.replaceTrack(screenTrack);
        }

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } else {
        const videoTrack = localStream?.getVideoTracks()[0];
        const sender = peerConnectionRef.current
          ?.getSenders()
          .find((s) => s.track?.kind === "video");
        
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
        
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error("Error toggling screen share:", error);
      toast({
        title: "Error",
        description: "Failed to share screen",
        variant: "destructive",
      });
    }
  };

  const handleEndCall = async () => {
    playCallSound('end');
    setCallStatus("ended");
    cleanup();
    onClose();
  };

  const endCall = async () => {
    // Notify other user
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "call-ended",
        payload: {
          to: otherUserId,
          from: currentUserId,
        },
      });
    }
    await handleEndCall();
  };

  const cleanup = () => {
    console.log("Starting cleanup...");
    
    // Reset start guard
    startedRef.current = false;
    // Stop all local tracks aggressively - critical for mobile
    if (localStream) {
      const tracks = localStream.getTracks();
      console.log('Stopping local tracks:', tracks.length);
      tracks.forEach((track) => {
        if (track.readyState === 'live') {
          track.stop();
          track.enabled = false;
          // Force remove from stream
          localStream.removeTrack(track);
          console.log('Stopped and removed local track:', track.kind, track.label);
        }
      });
    }
    
    // Stop all remote tracks
    if (remoteStream) {
      const tracks = remoteStream.getTracks();
      console.log('Stopping remote tracks:', tracks.length);
      tracks.forEach((track) => {
        if (track.readyState === 'live') {
          track.stop();
          track.enabled = false;
          remoteStream.removeTrack(track);
          console.log('Stopped and removed remote track:', track.kind);
        }
      });
    }

    // Clear and pause video elements - critical for mobile browsers
    if (localVideoRef.current) {
      const video = localVideoRef.current;
      video.pause();
      video.srcObject = null;
      video.load();
      // Force remove all source references
      video.removeAttribute('src');
      console.log('Local video cleared');
    }
    if (remoteVideoRef.current) {
      const video = remoteVideoRef.current;
      video.pause();
      video.srcObject = null;
      video.load();
      video.removeAttribute('src');
      console.log('Remote video cleared');
    }

    // Clear duration timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    // Close peer connection and remove all tracks
    if (peerConnectionRef.current) {
      const senders = peerConnectionRef.current.getSenders();
      console.log('Removing peer connection senders:', senders.length);
      senders.forEach(sender => {
        if (sender.track) {
          sender.track.stop();
          sender.track.enabled = false;
        }
        try {
          peerConnectionRef.current?.removeTrack(sender);
        } catch (e) {
          console.log('Could not remove track from peer:', e);
        }
      });
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Unsubscribe from channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Reset all state
    setLocalStream(null);
    setRemoteStream(null);
    setCallDuration(0);
    setIsVideoEnabled(true);
    setIsAudioEnabled(true);
    setIsScreenSharing(false);
    setCallStatus("connecting");
    
    console.log("Cleanup complete - all media tracks stopped");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        endCall();
      }
    }}>
      <DialogContent className="max-w-full w-full h-full md:max-w-[95vw] md:h-[95vh] p-0 border-0" hideCloseButton aria-describedby="video-call-description">
        <DialogTitle className="sr-only">Video call with {otherUserName}</DialogTitle>
        <span id="video-call-description" className="sr-only">
          Video call with {otherUserName}
        </span>
        <div className="h-full flex flex-col bg-black rounded-lg overflow-hidden">
          {/* Remote video (main) */}
          <div className="flex-1 relative min-h-0">
            {callStatus === "permission-denied" ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-900/20 to-gray-900 p-8">
                <div className="bg-red-500/10 border-2 border-red-500/30 rounded-lg p-6 max-w-md">
                  <div className="flex items-center justify-center mb-4">
                    <div className="h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center">
                      <VideoOff className="h-8 w-8 text-red-500" />
                    </div>
                  </div>
                  <h3 className="text-white text-xl font-semibold text-center mb-2">
                    Permission Required
                  </h3>
                  <p className="text-gray-300 text-center mb-4">
                    {permissionError}
                  </p>
                  <div className="space-y-2 text-sm text-gray-400">
                    <p className="font-semibold text-white">To enable camera and microphone:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Click the camera icon in your browser's address bar</li>
                      <li>Select "Allow" for camera and microphone</li>
                      <li>Click the "Retry" button below</li>
                    </ol>
                  </div>
                  <div className="flex gap-2 mt-6">
                    <Button
                      onClick={initializeCall}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Retry
                    </Button>
                    <Button
                      onClick={endCall}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ) : remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain bg-black"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                <Avatar className="h-32 w-32 mb-4">
                  <AvatarImage src={otherUserAvatar || undefined} />
                  <AvatarFallback className="text-4xl">
                    {otherUserName[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="text-white text-xl font-medium">{otherUserName}</p>
                <p className="text-gray-400 mt-2">
                  {callStatus === "connecting" ? "Connecting..." : "Waiting for response..."}
                </p>
              </div>
            )}

            {/* Local video (picture-in-picture) */}
            <div className="absolute bottom-24 right-4 md:bottom-4 w-32 h-24 md:w-48 md:h-36 bg-gray-900 rounded-lg overflow-hidden border-2 border-white/20 shadow-2xl z-10">
              {localStream && isVideoEnabled && hasCamera ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-700">
                  <VideoOff className="h-6 w-6 md:h-8 md:w-8 text-white/50 mb-1" />
                  {!hasCamera && (
                    <p className="text-[10px] md:text-xs text-white/70 text-center px-2">Audio only</p>
                  )}
                </div>
              )}
            </div>

            {/* Status and info bar */}
            {callStatus === "connected" && (
              <div className="absolute top-2 md:top-4 left-2 md:left-4 right-2 md:right-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-0 z-10">
                <div className="bg-black/70 backdrop-blur-md px-3 py-2 rounded-lg text-white text-xs md:text-sm font-medium flex items-center gap-2 md:gap-3 shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" />
                    <span className="hidden md:inline">Connected</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-300">
                    <Clock className="h-3 w-3" />
                    <span>{formatDuration(callDuration)}</span>
                  </div>
                </div>
                <div className="bg-black/70 backdrop-blur-md px-3 py-2 rounded-lg text-white text-xs md:text-sm font-medium shadow-lg">
                  {otherUserName}
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-3 md:p-6 bg-gradient-to-t from-black via-black/95 to-transparent border-t border-white/5">
            <div className="flex items-center justify-center gap-2 md:gap-4">
              <Button
                variant={isVideoEnabled ? "default" : "destructive"}
                size="icon"
                onClick={toggleVideo}
                className="h-12 w-12 md:h-14 md:w-14 rounded-full shadow-lg hover:scale-105 transition-transform"
                disabled={!hasCamera}
                title={!hasCamera ? "No camera available" : isVideoEnabled ? "Turn off camera" : "Turn on camera"}
              >
                {isVideoEnabled && hasCamera ? (
                  <Video className="h-5 w-5 md:h-6 md:w-6" />
                ) : (
                  <VideoOff className="h-5 w-5 md:h-6 md:w-6" />
                )}
              </Button>

              <Button
                variant={isAudioEnabled ? "default" : "destructive"}
                size="icon"
                onClick={toggleAudio}
                className="h-12 w-12 md:h-14 md:w-14 rounded-full shadow-lg hover:scale-105 transition-transform"
                title={isAudioEnabled ? "Mute" : "Unmute"}
              >
                {isAudioEnabled ? (
                  <Mic className="h-5 w-5 md:h-6 md:w-6" />
                ) : (
                  <MicOff className="h-5 w-5 md:h-6 md:w-6" />
                )}
              </Button>

              <Button
                variant={isScreenSharing ? "default" : "secondary"}
                size="icon"
                onClick={toggleScreenShare}
                className="h-12 w-12 md:h-14 md:w-14 rounded-full shadow-lg hover:scale-105 transition-transform"
                title={isScreenSharing ? "Stop sharing" : "Share screen"}
              >
                {isScreenSharing ? (
                  <MonitorOff className="h-5 w-5 md:h-6 md:w-6" />
                ) : (
                  <Monitor className="h-5 w-5 md:h-6 md:w-6" />
                )}
              </Button>

              <Button
                variant="destructive"
                size="icon"
                onClick={endCall}
                className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-red-500 hover:bg-red-600 shadow-lg hover:scale-105 transition-transform"
                title="End call"
              >
                <PhoneOff className="h-5 w-5 md:h-6 md:w-6" />
              </Button>
            </div>
          </div>
        </div>

        <style>{`
          .mirror {
            transform: scaleX(-1);
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
};
