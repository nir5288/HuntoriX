import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Globe, CheckCircle2, TrendingUp, Users, MapPin } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function GlobalHiring() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [motivation, setMotivation] = useState("");

  // Check if user has already applied
  const { data: application, isLoading } = useQuery({
    queryKey: ["global-hiring-application", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      
      const { data, error } = await supabase
        .from("global_hiring_applications")
        .select("*")
        .eq("headhunter_id", profile.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("global_hiring_applications")
        .insert({
          headhunter_id: profile.id,
          motivation,
          status: "pending",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted!",
        description: "We'll review your application and get back to you soon.",
      });
      queryClient.invalidateQueries({ queryKey: ["global-hiring-application"] });
      setMotivation("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const handleApply = () => {
    if (!motivation.trim()) {
      toast({
        title: "Motivation Required",
        description: "Please tell us why you want to join Global Hiring.",
        variant: "destructive",
      });
      return;
    }
    applyMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  const isApproved = application?.status === "approved";
  const isPending = application?.status === "pending";
  const isRejected = application?.status === "rejected";

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Globe className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Global Hiring</h1>
          <Badge variant="secondary">Beta</Badge>
        </div>
        <p className="text-muted-foreground text-lg">
          Connect companies worldwide with top talent across borders
        </p>
      </div>

      {isApproved && (
        <Card className="mb-6 border-green-500/20 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">You're approved for Global Hiring!</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              You can now access and apply to global hiring opportunities.
            </p>
          </CardContent>
        </Card>
      )}

      {isPending && (
        <Card className="mb-6 border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">Application Under Review</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              We're reviewing your application. You'll be notified once a decision is made.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <Globe className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Global Reach</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Connect companies with talent across continents and time zones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <TrendingUp className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Premium Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Access high-value international placements with competitive fees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Users className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Diverse Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Work with companies from different cultures and industries
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>How Global Hiring Works</CardTitle>
          <CardDescription>
            A streamlined process for international recruitment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
              1
            </div>
            <div>
              <h4 className="font-semibold mb-1">Apply for Access</h4>
              <p className="text-sm text-muted-foreground">
                Submit your application to join the Global Hiring program (one-time only)
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
              2
            </div>
            <div>
              <h4 className="font-semibold mb-1">Get Approved</h4>
              <p className="text-sm text-muted-foreground">
                Our team reviews your experience and expertise in international recruitment
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
              3
            </div>
            <div>
              <h4 className="font-semibold mb-1">Access Global Jobs</h4>
              <p className="text-sm text-muted-foreground">
                Browse and apply to international hiring opportunities from companies worldwide
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
              4
            </div>
            <div>
              <h4 className="font-semibold mb-1">Place Talent Globally</h4>
              <p className="text-sm text-muted-foreground">
                Match top talent with companies across borders and earn competitive fees
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {!application && (
        <Card>
          <CardHeader>
            <CardTitle>Apply for Global Hiring Access</CardTitle>
            <CardDescription>
              Tell us about your experience and why you want to work on global opportunities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Why do you want to join Global Hiring? *
              </label>
              <Textarea
                placeholder="Share your experience with international recruitment, language skills, understanding of different markets, etc."
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>

            <Button
              onClick={handleApply}
              disabled={applyMutation.isPending || !motivation.trim()}
              className="w-full"
              size="lg"
            >
              {applyMutation.isPending ? "Submitting..." : "Submit Application"}
            </Button>
          </CardContent>
        </Card>
      )}

      {isRejected && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Your previous application was not approved. You may apply again in the future.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
