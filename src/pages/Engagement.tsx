import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, Users, FileText, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { EngagementOverview } from "@/components/engagement/EngagementOverview";
import { EngagementSubmissions } from "@/components/engagement/EngagementSubmissions";
import { EngagementMessages } from "@/components/engagement/EngagementMessages";
import { EngagementFiles } from "@/components/engagement/EngagementFiles";

export default function Engagement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [engagement, setEngagement] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadEngagement();
    loadCurrentUser();
  }, [id]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setCurrentUser(profile);
  };

  const loadEngagement = async () => {
    try {
      const { data, error } = await supabase
        .from("engagements")
        .select(`
          *,
          job:jobs(*),
          employer:employer_id(name, email, avatar_url, company_name),
          headhunter:headhunter_id(name, email, avatar_url)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setEngagement(data);
    } catch (error: any) {
      console.error("Error loading engagement:", error);
      toast.error("Failed to load engagement");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!engagement) {
    return null;
  }

  const isEmployer = currentUser?.id === engagement.employer_id;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 mt-20">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{engagement.job.title}</h1>
              <p className="text-muted-foreground">
                {isEmployer ? "Headhunter: " : "Employer: "}
                <span className="font-medium">
                  {isEmployer ? engagement.headhunter.name : engagement.employer.name}
                </span>
              </p>
            </div>
            <Badge variant={engagement.status === "Active" ? "default" : "secondary"}>
              {engagement.status}
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="submissions" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Submissions
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Files
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <EngagementOverview 
              engagement={engagement} 
              isEmployer={isEmployer}
              onUpdate={loadEngagement}
            />
          </TabsContent>

          <TabsContent value="submissions">
            <EngagementSubmissions 
              engagementId={engagement.id} 
              isEmployer={isEmployer}
              candidateCap={engagement.candidate_cap}
            />
          </TabsContent>

          <TabsContent value="messages">
            <EngagementMessages 
              engagementId={engagement.id}
              currentUserId={currentUser?.id}
              otherUserId={isEmployer ? engagement.headhunter_id : engagement.employer_id}
              otherUserName={isEmployer ? engagement.headhunter.name : engagement.employer.name}
            />
          </TabsContent>

          <TabsContent value="files">
            <EngagementFiles engagementId={engagement.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
