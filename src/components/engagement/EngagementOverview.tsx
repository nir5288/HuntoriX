import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Target, DollarSign, Users, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface EngagementOverviewProps {
  engagement: any;
  isEmployer: boolean;
  onUpdate: () => void;
}

export function EngagementOverview({ engagement, isEmployer, onUpdate }: EngagementOverviewProps) {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [submissionCount, setSubmissionCount] = useState(0);

  useEffect(() => {
    loadMilestones();
    loadSubmissionCount();
  }, [engagement.id]);

  const loadMilestones = async () => {
    const { data } = await supabase
      .from("milestones")
      .select("*")
      .eq("engagement_id", engagement.id)
      .order("due_at", { ascending: true });

    if (data) setMilestones(data);
  };

  const loadSubmissionCount = async () => {
    const { count } = await supabase
      .from("submissions")
      .select("*", { count: "exact", head: true })
      .eq("engagement_id", engagement.id);

    setSubmissionCount(count || 0);
  };

  const handleConfirmSOW = async () => {
    const field = isEmployer ? "sow_confirmed_employer" : "sow_confirmed_headhunter";
    
    const { error } = await supabase
      .from("engagements")
      .update({ [field]: true })
      .eq("id", engagement.id);

    if (error) {
      toast.error("Failed to confirm SOW");
      return;
    }

    toast.success("SOW confirmed");
    onUpdate();
  };

  const daysUntilDue = engagement.due_at 
    ? Math.ceil((new Date(engagement.due_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const submissionProgress = (submissionCount / engagement.candidate_cap) * 100;

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      {engagement.status === "Proposed" && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Statement of Work Confirmation Needed</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Please review and confirm the terms below to activate this engagement.
                </p>
                {!engagement[isEmployer ? "sow_confirmed_employer" : "sow_confirmed_headhunter"] && (
                  <Button onClick={handleConfirmSOW}>
                    Confirm SOW
                  </Button>
                )}
                {engagement[isEmployer ? "sow_confirmed_employer" : "sow_confirmed_headhunter"] && (
                  <Badge variant="default">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    You confirmed
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">SLA Timeline</p>
                <p className="text-2xl font-bold">
                  {daysUntilDue ? `${daysUntilDue}d` : `${engagement.sla_days}d`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Candidates</p>
                <p className="text-2xl font-bold">{submissionCount}/{engagement.candidate_cap}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fee</p>
                <p className="text-2xl font-bold">
                  {engagement.fee_model === "Percent" 
                    ? `${engagement.fee_amount}%` 
                    : `$${engagement.fee_amount}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-lg font-semibold">{engagement.status}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Candidate Submission Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Candidate Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{submissionCount} submitted</span>
              <span>{engagement.candidate_cap - submissionCount} remaining</span>
            </div>
            <Progress value={submissionProgress} />
            {submissionCount >= engagement.candidate_cap && (
              <p className="text-sm text-warning flex items-center gap-2 mt-2">
                <AlertCircle className="h-4 w-4" />
                Candidate cap reached. Request an extension to submit more.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle>Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {milestones.length === 0 ? (
              <p className="text-sm text-muted-foreground">No milestones set yet</p>
            ) : (
              milestones.map((milestone) => (
                <div key={milestone.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {milestone.completed_at ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">{milestone.type}</p>
                      <p className="text-sm text-muted-foreground">
                        Due {formatDistanceToNow(new Date(milestone.due_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <Badge variant={milestone.completed_at ? "default" : "secondary"}>
                    {milestone.completed_at ? "Completed" : "Pending"}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* SOW Details */}
      <Card>
        <CardHeader>
          <CardTitle>Statement of Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Fee Model</p>
            <p className="font-medium">{engagement.fee_model}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Fee Amount</p>
            <p className="font-medium">
              {engagement.fee_model === "Percent" 
                ? `${engagement.fee_amount}% of annual salary` 
                : `$${engagement.fee_amount}`}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Candidate Cap</p>
            <p className="font-medium">{engagement.candidate_cap} candidates maximum</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">First Shortlist SLA</p>
            <p className="font-medium">{engagement.sla_days} business days</p>
          </div>
          {engagement.deposit_required && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Deposit</p>
              <p className="font-medium">${engagement.deposit_amount} (refundable)</p>
            </div>
          )}
          {engagement.notes && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Additional Notes</p>
              <p className="text-sm">{engagement.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
