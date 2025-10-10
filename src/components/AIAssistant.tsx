import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, ThumbsUp, Mic, MicOff, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import aiAvatar from "@/assets/huntorix-ai-avatar.jpg";

interface Message {
  role: "user" | "assistant";
  content: string;
  id?: string;
  liked?: boolean;
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "👋 Hi! I'm Huntorix AI, your guide to Huntorix. How can I help you navigate the platform today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: 24, y: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMicPressed, setIsMicPressed] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [language, setLanguage] = useState<'en' | 'he'>('en');
  const audioChunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // Fetch user's AI assistant preference from database
  const { data: profile } = useQuery({
    queryKey: ['profile-ai-preference', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('show_ai_assistant')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle drag for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setHasMoved(false);
    // Calculate from bottom of screen since we use bottom positioning
    const buttonBottom = window.innerHeight - touch.clientY;
    setDragStart({
      x: touch.clientX - position.x,
      y: buttonBottom - position.y
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || !isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    
    // Calculate positions
    const newX = touch.clientX - dragStart.x;
    const buttonBottom = window.innerHeight - touch.clientY;
    const newY = buttonBottom - dragStart.y;
    
    // Mark as moved if dragged more than 5px
    if (Math.abs(newX - position.x) > 5 || Math.abs(newY - position.y) > 5) {
      setHasMoved(true);
    }
    
    // Keep button within viewport bounds
    const buttonSize = 56; // h-14 w-14
    const maxX = window.innerWidth - buttonSize - 24;
    const maxY = window.innerHeight - buttonSize - 24;
    
    setPosition({
      x: Math.max(24, Math.min(newX, maxX)),
      y: Math.max(24, Math.min(newY, maxY))
    });
  };

  const handleTouchEnd = () => {
    if (!isMobile) return;
    setIsDragging(false);
  };

  const handleButtonClick = () => {
    // Only toggle if not dragging
    if (hasMoved) {
      setHasMoved(false);
      return;
    }
    const newOpenState = !isOpen;
    setIsOpen(newOpenState);
    if (newOpenState) {
      trackEvent('opened');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processVoiceInput(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      toast({
        title: "Recording",
        description: "Speak now...",
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecordingAndSend = async () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      // Stop recording
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
      
      // Wait a bit for the recording to process and input to be populated
      setTimeout(() => {
        if (input.trim()) {
          handleSend();
        }
      }, 1000);
    }
  };

  const handleMicPress = () => {
    if (!isRecording) {
      setIsMicPressed(true);
      startRecording();
    }
  };

  const handleMicRelease = () => {
    if (isRecording) {
      setIsMicPressed(false);
      stopRecordingAndSend();
    }
  };

  const processVoiceInput = async (audioBlob: Blob) => {
    try {
      setIsLoading(true);
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        // Send to voice-to-text edge function
        const { data, error } = await supabase.functions.invoke('voice-to-text', {
          body: { audio: base64Audio }
        });
        
        if (error) throw error;
        
        if (data.text) {
          setInput(data.text);
        }
        
        setIsLoading(false);
      };
    } catch (error) {
      console.error('Error processing voice:', error);
      toast({
        title: "Error",
        description: "Failed to process voice input",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  // Create conversation when component mounts or opens
  useEffect(() => {
    const createConversation = async () => {
      if (!user?.id || conversationId) return;
      
      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({ user_id: user.id })
        .select('id')
        .single();
      
      if (!error && data) {
        setConversationId(data.id);
      }
    };
    
    if (isOpen && user?.id) {
      createConversation();
    }
  }, [isOpen, user?.id, conversationId]);

  // Track open/hide events
  const trackEvent = async (eventType: 'opened' | 'hidden') => {
    if (!user?.id) return;
    
    await supabase
      .from('ai_assistant_events')
      .insert({
        user_id: user.id,
        event_type: eventType
      });
  };

  const saveMessage = async (role: "user" | "assistant", content: string) => {
    if (!conversationId || !user?.id) return null;
    
    const { data, error } = await supabase
      .from('ai_messages')
      .insert({
        conversation_id: conversationId,
        role,
        content
      })
      .select('id')
      .single();
    
    return error ? null : data?.id;
  };

  const streamChat = async (userMessage: string) => {
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    // Save user message
    const userMessageId = await saveMessage("user", userMessage);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            messages: newMessages,
            language: language 
          }),
        }
      );

      if (!response.ok || !response.body) {
        throw new Error("Failed to start stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantMessage = "";
      let assistantMessageId: string | null = null;

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantMessage += content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: assistantMessage,
                  id: assistantMessageId || undefined
                };
                return newMessages;
              });
            }
          } catch {
            continue;
          }
        }
      }

      // Save complete assistant message
      if (assistantMessage) {
        assistantMessageId = await saveMessage("assistant", assistantMessage);
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            id: assistantMessageId || undefined
          };
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    setInput("");
    await streamChat(userMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLike = async (messageId: string, currentLiked?: boolean) => {
    if (!messageId) return;
    
    const newLikedState = currentLiked ? null : true;
    
    const { error } = await supabase
      .from('ai_messages')
      .update({ liked: newLikedState })
      .eq('id', messageId);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to save feedback",
        variant: "destructive"
      });
      return;
    }
    
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, liked: newLikedState || undefined } : msg
    ));
    
    if (newLikedState) {
      toast({
        title: "Thanks for your feedback!",
        description: "This helps Huntorix AI learn and improve.",
      });
    }
  };

  const handleDismiss = async () => {
    if (!user?.id) return;
    
    setIsOpen(false);
    await trackEvent('hidden');
    
    const { error } = await supabase
      .from('profiles')
      .update({ show_ai_assistant: false })
      .eq('id', user.id);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to hide AI assistant",
        variant: "destructive"
      });
      return;
    }
    
    queryClient.invalidateQueries({ queryKey: ['profile-ai-preference', user.id] });
    
    toast({
      title: "AI Assistant Hidden",
      description: "You can re-enable it from your Settings page.",
    });
  };

  // Don't show if user preference is to hide it (default is true/show)
  if (profile?.show_ai_assistant === false) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <Button
        ref={buttonRef}
        onClick={handleButtonClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={isMobile ? {
          left: `${position.x}px`,
          bottom: `${position.y}px`,
          top: 'auto',
          right: 'auto',
          cursor: isDragging ? 'grabbing' : 'grab'
        } : undefined}
        className={cn(
          "fixed shadow-lg hover:shadow-xl z-[9999] bg-gradient-to-r from-primary via-primary-glow to-primary transition-shadow duration-300 border border-white/20",
          isMobile 
            ? "h-14 w-14 rounded-full p-0 flex items-center justify-center touch-none active:scale-95"
            : "left-6 bottom-6 h-12 px-4 rounded-full flex items-center gap-2.5 group"
        )}
      >
        {isOpen ? (
          isMobile ? (
            <X className="h-5 w-5 text-white" />
          ) : (
            <>
              <X className="h-4 w-4 text-white" />
              <span className="text-white font-medium text-xs tracking-wide">Close</span>
            </>
          )
        ) : (
          isMobile ? (
            <div className="relative">
              <MessageCircle className="h-5 w-5 text-white" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          ) : (
            <>
              <div className="relative">
                <MessageCircle className="h-4 w-4 text-white" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <span className="text-white font-medium text-xs tracking-wide">HuntoriX AI</span>
            </>
          )
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div 
          className={cn(
            "fixed bg-background border border-border rounded-lg shadow-2xl z-[9999] flex flex-col",
            isMobile 
              ? "inset-x-4 bottom-24 top-24 w-auto h-auto"
              : "left-6 bottom-24 w-96 h-[500px]"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border border-primary/20">
                <AvatarImage src={aiAvatar} alt="Huntorix AI" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary-glow text-white font-semibold text-xs">
                  AI
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-sm text-foreground">Huntorix AI</h3>
                <p className="text-xs text-muted-foreground">Your intelligent assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <ChevronDown className="h-3 w-3" />
                    <span className="text-lg">{language === 'en' ? '🇺🇸' : '🇮🇱'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32 bg-background border shadow-lg z-[10000]">
                  <DropdownMenuItem
                    onClick={() => {
                      setLanguage('en');
                      toast({
                        title: "Language changed to English",
                        description: "I will now speak English"
                      });
                    }}
                    className="flex flex-col items-center gap-1 py-3 cursor-pointer"
                  >
                    <span className="text-2xl">🇺🇸</span>
                    <span className="text-xs font-medium">EN</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setLanguage('he');
                      toast({
                        title: "שפה שונתה לעברית",
                        description: "עכשיו אני אדבר עברית"
                      });
                    }}
                    className="flex flex-col items-center gap-1 py-3 cursor-pointer"
                  >
                    <span className="text-2xl">🇮🇱</span>
                    <span className="text-xs font-medium">HE</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Minimize chat"
              >
                <span className="text-lg font-bold">−</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Hide AI Assistant permanently"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8 border border-primary/20">
                      <AvatarImage src={aiAvatar} alt="Huntorix AI" />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary-glow text-white text-xs">
                        AI
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex flex-col gap-1">
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === "assistant" && message.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(message.id!, message.liked)}
                        className={`h-6 w-6 p-0 ${message.liked ? 'text-primary' : 'text-muted-foreground'}`}
                        title={message.liked ? "Unlike this response" : "Like this response"}
                      >
                        <ThumbsUp className={`h-3 w-3 ${message.liked ? 'fill-current' : ''}`} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 border border-primary/20">
                    <AvatarImage src={aiAvatar} alt="Huntorix AI" />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary-glow text-white text-xs">
                      AI
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Button
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleMicPress();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleMicRelease();
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleMicPress();
                }}
                onMouseUp={(e) => {
                  e.preventDefault();
                  handleMicRelease();
                }}
                onMouseLeave={() => {
                  if (isRecording) {
                    handleMicRelease();
                  }
                }}
                disabled={isLoading}
                size="icon"
                variant={isRecording ? "destructive" : "outline"}
                className={cn(
                  "shrink-0 select-none transition-all duration-300",
                  isRecording && "animate-pulse",
                  isMicPressed && "scale-150"
                )}
                title={isRecording ? "Recording... Release to send" : "Hold to record voice message"}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                disabled={isLoading || isRecording}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading || isRecording}
                size="icon"
                className="bg-gradient-to-r from-primary to-accent-purple shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
