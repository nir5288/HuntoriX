import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, TrendingUp, Users, Zap, AlertCircle } from "lucide-react";

interface ExclusiveJobPromotionModalProps {
  open: boolean;
  onActivate: () => void;
  onNotNow: () => void;
  onDontShowAgain: () => void;
}

export function ExclusiveJobPromotionModal({
  open,
  onActivate,
  onNotNow,
  onDontShowAgain,
}: ExclusiveJobPromotionModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onNotNow()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Make Your Job Exclusive on Huntorix</DialogTitle>
              <Badge variant="secondary" className="mt-1">Currently Free</Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-3 p-4 rounded-lg border bg-card">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Top Headhunters Notified</h4>
                <p className="text-sm text-muted-foreground">
                  Priority access to our most experienced and successful headhunters
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-4 rounded-lg border bg-card">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Increased Visibility</h4>
                <p className="text-sm text-muted-foreground">
                  Featured placement and priority ranking in search results
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-4 rounded-lg border bg-card">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Higher Commitment</h4>
                <p className="text-sm text-muted-foreground">
                  Headhunters work harder knowing they won't compete with other platforms
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-4 rounded-lg border bg-card">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Faster Results</h4>
                <p className="text-sm text-muted-foreground">
                  More headhunters competing means quicker candidate delivery
                </p>
              </div>
            </div>
          </div>

          {/* Terms Notice */}
          <div className="flex gap-3 p-4 rounded-lg border border-amber-500/50 bg-amber-500/10">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <p className="font-medium text-foreground">Exclusive Terms & Conditions</p>
              <p className="text-muted-foreground">
                By activating this feature, you agree that this job posting will be{" "}
                <span className="font-semibold text-foreground">exclusive to Huntorix</span> and cannot be 
                posted on other platforms. This commitment is{" "}
                <span className="font-semibold text-foreground">binding for a minimum of 14 days</span> and 
                cannot be undone during this period.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onActivate}
            className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            size="lg"
          >
            <Zap className="h-4 w-4 mr-2" />
            Activate Exclusive Status
          </Button>
          <div className="flex gap-3">
            <Button
              onClick={onNotNow}
              variant="outline"
              size="lg"
            >
              Not Now
            </Button>
            <Button
              onClick={onDontShowAgain}
              variant="ghost"
              size="lg"
              className="text-muted-foreground"
            >
              Don't Show Again
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
