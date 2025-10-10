import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Header } from "@/components/Header";

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
  profiles: {
    name: string;
    email: string;
    company_name: string;
  };
}

export default function JobReviewAdmin() {
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

  // Set up realtime subscription for job updates
  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel('admin-jobs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: 'status=eq.pending_review'
        },
        (payload) => {
          console.log('Admin job change:', payload);
          
          if (payload.eventType === 'INSERT') {
            // Fetch the complete job data with profile info
            fetchPendingJobs();
          } else if (payload.eventType === 'UPDATE') {
            // Remove job from list if no longer pending_review
            if (payload.new.status !== 'pending_review') {
              setJobs(prevJobs => prevJobs.filter(job => job.id !== payload.new.id));
            }
          } else if (payload.eventType === 'DELETE') {
            setJobs(prevJobs => prevJobs.filter(job => job.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

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
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 mt-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Job Review Queue</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve pending job postings
          </p>
        </div>

        {jobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No jobs pending review</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle>{job.title}</CardTitle>
                      <CardDescription>
                        {job.profiles?.company_name || job.profiles?.name} • {job.location}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending Review
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Industry:</span>{" "}
                      <span className="font-medium">{job.industry}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Budget:</span>{" "}
                      <span className="font-medium">
                        {job.budget_currency} {job.budget_min?.toLocaleString()} - {job.budget_max?.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Submitted:</span>{" "}
                      <span className="font-medium">
                        {format(new Date(job.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Auto-approve:</span>{" "}
                      <span className="font-medium">
                        {format(new Date(job.auto_approve_at), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {job.description}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(job.id)}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleReject(job.id)}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      variant="outline"
                    >
                      View Details
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
