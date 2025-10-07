import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Clock, ArrowLeft, ExternalLink, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Job {
  id: string;
  title: string;
  industry: string;
  location: string;
  created_at: string;
  updated_at: string;
  status: string;
  seniority: string;
  employment_type: string;
  budget_min: number;
  budget_max: number;
  budget_currency: string;
  is_exclusive: boolean;
  profiles: {
    name: string;
    email: string;
    company_name: string;
  };
}

export default function AdminJobApprovals() {
  const { user } = useAuth();
  const { isAdmin, isLoading: isLoadingAdmin } = useIsAdmin();
  const [pendingJobs, setPendingJobs] = useState<Job[]>([]);
  const [approvedJobs, setApprovedJobs] = useState<Job[]>([]);
  const [rejectedJobs, setRejectedJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoadingAdmin && !isAdmin) {
      navigate("/");
      return;
    }

    if (isAdmin) {
      fetchJobs();
      
      // Set up realtime subscription
      const channel = supabase
        .channel('job-approvals-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'jobs'
          },
          () => {
            fetchJobs();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAdmin, isLoadingAdmin, navigate]);

  const fetchJobs = async () => {
    try {
      // Fetch pending jobs
      const { data: pending, error: pendingError } = await supabase
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

      if (pendingError) throw pendingError;
      setPendingJobs(pending || []);

      // Fetch approved jobs (last 50)
      const { data: approved, error: approvedError } = await supabase
        .from("jobs")
        .select(`
          *,
          profiles (
            name,
            email,
            company_name
          )
        `)
        .eq("status", "open")
        .order("updated_at", { ascending: false })
        .limit(50);

      if (approvedError) throw approvedError;
      setApprovedJobs(approved || []);

      // Fetch rejected jobs (last 50)
      const { data: rejected, error: rejectedError } = await supabase
        .from("jobs")
        .select(`
          *,
          profiles (
            name,
            email,
            company_name
          )
        `)
        .eq("status", "closed")
        .order("updated_at", { ascending: false })
        .limit(50);

      if (rejectedError) throw rejectedError;
      setRejectedJobs(rejected || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast({
        title: "Error",
        description: "Failed to load jobs",
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
        .update({ status: "open", updated_at: new Date().toISOString() })
        .eq("id", jobId);

      if (error) throw error;

      toast({
        title: "Job Approved",
        description: "The job has been approved and is now live",
      });

      fetchJobs();
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
        .update({ status: "closed", updated_at: new Date().toISOString() })
        .eq("id", jobId);

      if (error) throw error;

      toast({
        title: "Job Rejected",
        description: "The job has been rejected",
      });

      fetchJobs();
    } catch (error) {
      console.error("Error rejecting job:", error);
      toast({
        title: "Error",
        description: "Failed to reject job",
        variant: "destructive",
      });
    }
  };

  const renderJobRow = (job: Job, showActions: boolean = true) => (
    <TableRow key={job.id} className="hover:bg-muted/50">
      <TableCell className="font-medium max-w-[200px]">
        <div className="flex flex-col gap-1">
          <span className="truncate">{job.title}</span>
          {job.is_exclusive && (
            <Badge className="w-fit bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 text-white text-[9px] px-1.5 py-0 h-4 border-0">
              Exclusive
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
        {job.profiles?.company_name || job.profiles?.name}
      </TableCell>
      <TableCell className="text-xs">
        <Badge variant="outline" className="text-[10px]">{job.industry}</Badge>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {job.location || 'Remote'}
      </TableCell>
      <TableCell className="text-xs capitalize">{job.seniority}</TableCell>
      <TableCell className="text-xs">
        {job.budget_currency} {job.budget_min?.toLocaleString()}-{job.budget_max?.toLocaleString()}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {format(new Date(job.created_at), "MMM d, h:mm a")}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {showActions ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleApprove(job.id)}
                className="h-7 w-7 p-0 text-[hsl(var(--accent-mint))] hover:bg-[hsl(var(--accent-mint))]/10"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleReject(job.id)}
                className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Badge variant={job.status === 'open' ? 'default' : 'secondary'} className="text-[10px]">
              {job.status === 'open' ? 'Approved' : 'Rejected'}
            </Badge>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/jobs/${job.id}`)}
            className="h-7 w-7 p-0"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

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
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/settings')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Settings
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[hsl(var(--accent-pink))] via-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] bg-clip-text text-transparent">
            Job Approval Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Review, approve, and manage job postings
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="pending" className="relative">
              <Clock className="h-4 w-4 mr-2" />
              Pending
              {pendingJobs.length > 0 && (
                <Badge className="ml-2 h-5 w-5 flex items-center justify-center rounded-full bg-[hsl(var(--accent-pink))] p-0">
                  {pendingJobs.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">
              <CheckCircle className="h-4 w-4 mr-2" />
              Approved
            </TabsTrigger>
            <TabsTrigger value="rejected">
              <XCircle className="h-4 w-4 mr-2" />
              Rejected
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {pendingJobs.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-card">
                <CheckCircle className="h-12 w-12 text-[hsl(var(--accent-mint))] mx-auto mb-4" />
                <p className="text-muted-foreground">No jobs pending review</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden bg-card">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[200px]">Job Title</TableHead>
                      <TableHead className="w-[150px]">Company</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Seniority</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingJobs.map((job) => renderJobRow(job, true))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-6">
            {approvedJobs.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-card">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No approved jobs yet</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden bg-card">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[200px]">Job Title</TableHead>
                      <TableHead className="w-[150px]">Company</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Seniority</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Approved</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedJobs.map((job) => renderJobRow(job, false))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="mt-6">
            {rejectedJobs.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-card">
                <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No rejected jobs</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden bg-card">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[200px]">Job Title</TableHead>
                      <TableHead className="w-[150px]">Company</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Seniority</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Rejected</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rejectedJobs.map((job) => renderJobRow(job, false))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
