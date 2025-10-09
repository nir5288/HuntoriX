import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRequireAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface HoldHistory {
  id: string;
  job_id: string;
  reason: string;
  created_by: string;
  created_at: string;
  resolved_at: string | null;
  job: {
    title: string;
    job_id_number: number;
    status: string;
  };
  profile: {
    name: string;
    email: string;
  };
}

export default function AdminHoldReasons() {
  const { user, loading: authLoading } = useRequireAuth("admin");
  const [loading, setLoading] = useState(true);
  const [currentHolds, setCurrentHolds] = useState<HoldHistory[]>([]);
  const [historicalHolds, setHistoricalHolds] = useState<HoldHistory[]>([]);

  useEffect(() => {
    if (user) {
      fetchHoldReasons();
    }
  }, [user]);

  const fetchHoldReasons = async () => {
    try {
      setLoading(true);

      // Fetch all hold history with job and profile data
      const { data: historyData, error: historyError } = await supabase
        .from("job_hold_history")
        .select(`
          *,
          job:jobs(title, job_id_number, status),
          profile:profiles!job_hold_history_created_by_fkey(name, email)
        `)
        .order("created_at", { ascending: false });

      if (historyError) throw historyError;

      // Also fetch all jobs currently on hold (in case some don't have history entries)
      const { data: onHoldJobs, error: jobsError } = await supabase
        .from("jobs")
        .select(`
          id,
          title,
          job_id_number,
          status,
          created_by,
          updated_at
        `)
        .eq("status", "on_hold");

      if (jobsError) throw jobsError;

      // Create a set of job IDs that have history entries
      const jobIdsWithHistory = new Set(historyData?.map(h => h.job_id) || []);

      // For jobs on hold without history, create placeholder entries
      const jobsWithoutHistory = onHoldJobs?.filter(job => !jobIdsWithHistory.has(job.id)) || [];
      
      const placeholderHistory: HoldHistory[] = await Promise.all(
        jobsWithoutHistory.map(async (job) => {
          // Fetch creator profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("name, email")
            .eq("id", job.created_by)
            .single();

          return {
            id: `placeholder-${job.id}`,
            job_id: job.id,
            reason: "No reason recorded (job was put on hold before tracking was implemented)",
            created_by: job.created_by,
            created_at: job.updated_at,
            resolved_at: null,
            job: {
              title: job.title,
              job_id_number: job.job_id_number,
              status: job.status,
            },
            profile: profile || { name: "Unknown", email: "" },
          };
        })
      );

      // Combine history data with placeholder entries
      const allData = [...(historyData as HoldHistory[] || []), ...placeholderHistory];

      // Separate current holds (not resolved) from historical ones
      const current = allData.filter(h => !h.resolved_at && h.job?.status === "on_hold");
      const historical = allData.filter(h => h.resolved_at || h.job?.status !== "on_hold");

      setCurrentHolds(current);
      setHistoricalHolds(historical);
    } catch (error) {
      console.error("Error fetching hold reasons:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  const HoldCard = ({ hold }: { hold: HoldHistory }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">
              {hold.job?.title || "Unknown Job"}
            </CardTitle>
            <CardDescription>
              Job #{hold.job?.job_id_number} • Put on hold by {hold.profile?.name || "Unknown"}
            </CardDescription>
          </div>
          <Badge variant={hold.resolved_at ? "secondary" : "destructive"}>
            {hold.resolved_at ? "Resolved" : "Active"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">Reason:</p>
          <p className="text-sm text-muted-foreground">{hold.reason}</p>
        </div>
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <span>Put on hold: {format(new Date(hold.created_at), "PPP 'at' p")}</span>
          {hold.resolved_at && (
            <span>Resolved: {format(new Date(hold.resolved_at), "PPP 'at' p")}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Job Hold Reasons</h1>
          <p className="text-muted-foreground">
            View all jobs currently on hold and historical hold records
          </p>
        </div>

        <Tabs defaultValue="current" className="space-y-6">
          <TabsList>
            <TabsTrigger value="current">
              Current Holds ({currentHolds.length})
            </TabsTrigger>
            <TabsTrigger value="historical">
              Historical ({historicalHolds.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            {currentHolds.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No jobs are currently on hold
                </CardContent>
              </Card>
            ) : (
              currentHolds.map(hold => <HoldCard key={hold.id} hold={hold} />)
            )}
          </TabsContent>

          <TabsContent value="historical" className="space-y-4">
            {historicalHolds.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No historical hold records found
                </CardContent>
              </Card>
            ) : (
              historicalHolds.map(hold => <HoldCard key={hold.id} hold={hold} />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
