import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Clock, ArrowLeft, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface PendingJob {
  id: string;
  title: string;
  industry: string;
  location: string;
  created_at: string;
  created_by: string;
  auto_approve_at: string;
  description: string;
  budget_min: number;
  budget_max: number;
  budget_currency: string;
  seniority: string;
  employment_type: string;
  profiles: {
    name: string;
    email: string;
    company_name: string;
  };
}

export default function AdminJobApprovals() {
  const { user } = useAuth();
  const { isAdmin, isLoading: isLoadingAdmin } = useIsAdmin();
  const [jobs, setJobs] = useState<PendingJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoadingAdmin && !isAdmin) {
      navigate("/");
      return;
    }

    if (isAdmin) {
      fetchPendingJobs();
    }
  }, [isAdmin, isLoadingAdmin, navigate]);

  const fetchPendingJobs = async () => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select(`
          *,
          profiles (
            name,
            email,
            company_name
          )
        `)
        .eq("status", "pending_review")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error("Error fetching pending jobs:", error);
      toast({
        title: "Error",
        description: "Failed to load pending jobs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from("jobs")
        .update({ status: "open" })
        .eq("id", jobId);

      if (error) throw error;

      toast({
        title: "Job Approved",
        description: "The job has been approved and is now live",
      });

      fetchPendingJobs();
    } catch (error) {
      console.error("Error approving job:", error);
      toast({
        title: "Error",
        description: "Failed to approve job",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from("jobs")
        .update({ status: "closed" })
        .eq("id", jobId);

      if (error) throw error;

      toast({
        title: "Job Rejected",
        description: "The job has been rejected",
      });

      fetchPendingJobs();
    } catch (error) {
      console.error("Error rejecting job:", error);
      toast({
        title: "Error",
        description: "Failed to reject job",
        variant: "destructive",
      });
    }
  };

  if (isLoadingAdmin || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-[hsl(var(--surface))] to-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-[hsl(var(--surface))] to-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[hsl(var(--accent-pink))] via-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] bg-clip-text text-transparent">
            Job Approval Queue
          </h1>
          <p className="text-muted-foreground mt-2">
            Review and approve pending job postings • {jobs.length} pending
          </p>
        </div>

        {jobs.length === 0 ? (
          <Card className="border-[hsl(var(--accent-mint))]/20">
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 text-[hsl(var(--accent-mint))] mx-auto mb-4" />
              <p className="text-muted-foreground">No jobs pending review</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <Card key={job.id} className="border-[hsl(var(--accent-pink))]/20 hover:border-[hsl(var(--accent-pink))]/40 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg mb-1">{job.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {job.profiles?.company_name || job.profiles?.name} • {job.industry}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="flex-shrink-0">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Location</span>
                      <span className="font-medium">{job.location || 'Remote'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Seniority</span>
                      <span className="font-medium capitalize">{job.seniority}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Type</span>
                      <span className="font-medium">{job.employment_type?.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Budget</span>
                      <span className="font-medium">
                        {job.budget_currency} {job.budget_min?.toLocaleString()}-{job.budget_max?.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <div>
                      <span className="font-medium">Submitted:</span> {format(new Date(job.created_at), "MMM d, h:mm a")}
                    </div>
                    <div>
                      <span className="font-medium">Auto-approve:</span> {format(new Date(job.auto_approve_at), "MMM d, h:mm a")}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleApprove(job.id)}
                      size="sm"
                      className="flex-1 bg-gradient-to-r from-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] hover:opacity-90"
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleReject(job.id)}
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1.5" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      variant="outline"
                      size="sm"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
