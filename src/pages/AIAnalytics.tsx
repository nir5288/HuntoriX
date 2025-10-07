import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useNavigate } from "react-router-dom";
import { MessageSquare, ThumbsUp, Eye, EyeOff, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AnalyticsData {
  totalConversations: number;
  totalMessages: number;
  totalLikes: number;
  totalOpened: number;
  totalHidden: number;
  likeRate: number;
  topQuestions: Array<{ content: string; count: number }>;
  likedResponses: Array<{ question: string; response: string; likes: number }>;
}

export default function AIAnalytics() {
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
      toast({
        title: "Access Denied",
        description: "You don't have permission to view this page.",
        variant: "destructive"
      });
    }
  }, [isAdmin, adminLoading, navigate, toast]);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchAnalytics = async () => {
      try {
        // Get total conversations
        const { count: conversationsCount } = await supabase
          .from('ai_conversations')
          .select('*', { count: 'exact', head: true });

        // Get total messages
        const { count: messagesCount } = await supabase
          .from('ai_messages')
          .select('*', { count: 'exact', head: true });

        // Get total likes
        const { count: likesCount } = await supabase
          .from('ai_messages')
          .select('*', { count: 'exact', head: true })
          .eq('liked', true);

        // Get opened events
        const { count: openedCount } = await supabase
          .from('ai_assistant_events')
          .select('*', { count: 'exact', head: true })
          .eq('event_type', 'opened');

        // Get hidden events
        const { count: hiddenCount } = await supabase
          .from('ai_assistant_events')
          .select('*', { count: 'exact', head: true })
          .eq('event_type', 'hidden');

        // Get top questions (group by similar user messages)
        const { data: userMessages } = await supabase
          .from('ai_messages')
          .select('content')
          .eq('role', 'user')
          .order('created_at', { ascending: false })
          .limit(100);

        // Get liked responses with their questions
        const { data: likedMessages } = await supabase
          .from('ai_messages')
          .select('id, content, conversation_id, created_at')
          .eq('role', 'assistant')
          .eq('liked', true)
          .order('created_at', { ascending: false })
          .limit(20);

        // For each liked response, get the preceding user question
        const likedWithQuestions = await Promise.all(
          (likedMessages || []).map(async (msg) => {
            const { data: previousMessages } = await supabase
              .from('ai_messages')
              .select('content')
              .eq('conversation_id', msg.conversation_id)
              .eq('role', 'user')
              .lt('created_at', msg.created_at)
              .order('created_at', { ascending: false })
              .limit(1);

            return {
              question: previousMessages?.[0]?.content || 'Unknown question',
              response: msg.content,
              likes: 1
            };
          })
        );

        // Count frequency of user messages
        const questionCounts: { [key: string]: number } = {};
        userMessages?.forEach(msg => {
          const normalized = msg.content.toLowerCase().trim();
          questionCounts[normalized] = (questionCounts[normalized] || 0) + 1;
        });

        const topQuestions = Object.entries(questionCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([content, count]) => ({ content, count }));

        const likeRate = messagesCount && messagesCount > 0
          ? ((likesCount || 0) / messagesCount) * 100
          : 0;

        setAnalytics({
          totalConversations: conversationsCount || 0,
          totalMessages: messagesCount || 0,
          totalLikes: likesCount || 0,
          totalOpened: openedCount || 0,
          totalHidden: hiddenCount || 0,
          likeRate,
          topQuestions,
          likedResponses: likedWithQuestions
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
        toast({
          title: "Error",
          description: "Failed to load analytics data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [isAdmin, toast]);

  if (adminLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading analytics...</div>
      </div>
    );
  }

  if (!isAdmin || !analytics) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">AI Assistant Analytics</h1>
        <p className="text-muted-foreground">
          Track usage, engagement, and feedback for Huntorix AI
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalConversations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalMessages}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Liked Responses</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalLikes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.likeRate.toFixed(1)}% like rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Times Opened</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalOpened}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Times Hidden</CardTitle>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalHidden}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="questions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="questions">Top Questions</TabsTrigger>
          <TabsTrigger value="liked">Liked Responses</TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Most Asked Questions</CardTitle>
              <CardDescription>
                Questions users are asking most frequently
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {analytics.topQuestions.map((question, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-4 border border-border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{question.content}</p>
                      </div>
                      <Badge variant="secondary" className="ml-4">
                        {question.count}x
                      </Badge>
                    </div>
                  ))}
                  {analytics.topQuestions.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No questions recorded yet
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="liked" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Liked Responses</CardTitle>
              <CardDescription>
                AI responses that users found helpful
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-6">
                  {analytics.likedResponses.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 border border-border rounded-lg space-y-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            Question
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.question}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="default" className="text-xs">
                            AI Response
                          </Badge>
                          <ThumbsUp className="h-3 w-3 text-primary" />
                        </div>
                        <p className="text-sm">
                          {item.response.length > 300
                            ? item.response.substring(0, 300) + "..."
                            : item.response}
                        </p>
                      </div>
                    </div>
                  ))}
                  {analytics.likedResponses.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No liked responses yet
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
