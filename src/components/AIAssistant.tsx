import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import aiAvatar from "@/assets/huntorix-ai-avatar.jpg";

interface Message {
  role: "user" | "assistant";
  content: string;
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

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

  const streamChat = async (userMessage: string) => {
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: newMessages }),
        }
      );

      if (!response.ok || !response.body) {
        throw new Error("Failed to start stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantMessage = "";

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
                  content: assistantMessage
                };
                return newMessages;
              });
            }
          } catch {
            continue;
          }
        }
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

  const handleDismiss = async () => {
    if (!user?.id) return;
    
    setIsOpen(false);
    
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
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-6 bottom-6 h-12 px-4 rounded-full shadow-lg hover:shadow-xl z-[9999] bg-gradient-to-r from-primary via-primary-glow to-primary transition-all duration-300 flex items-center gap-2.5 group border border-white/20"
      >
        {isOpen ? (
          <>
            <X className="h-4 w-4 text-white" />
            <span className="text-white font-medium text-xs tracking-wide">Close</span>
          </>
        ) : (
          <>
            <div className="relative">
              <MessageCircle className="h-4 w-4 text-white" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <span className="text-white font-medium text-xs tracking-wide">HuntoriX AI</span>
          </>
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed left-6 bottom-24 w-96 h-[500px] bg-background border border-border rounded-lg shadow-2xl z-[9999] flex flex-col">
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
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="bg-gradient-to-r from-primary to-accent-purple"
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
