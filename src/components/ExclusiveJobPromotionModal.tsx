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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-[hsl(var(--luxury-gold))] via-[hsl(var(--luxury-rose-gold))] to-[hsl(var(--luxury-purple))] flex items-center justify-center shadow-lg">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl sm:text-2xl">Make Your Job Exclusive on Huntorix</DialogTitle>
              <Badge className="mt-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0">Currently Free</Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-4">
          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="flex gap-3 p-3 sm:p-4 rounded-lg border bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold mb-1 text-sm sm:text-base">Top Headhunters Notified</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Priority access to our most experienced and successful headhunters
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-3 sm:p-4 rounded-lg border bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-md">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold mb-1 text-sm sm:text-base">Increased Visibility</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Featured placement and priority ranking in search results
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-3 sm:p-4 rounded-lg border bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-md">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold mb-1 text-sm sm:text-base">Higher Commitment</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Headhunters work harder knowing they won't compete with other platforms
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-3 sm:p-4 rounded-lg border bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shrink-0 shadow-md">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold mb-1 text-sm sm:text-base">Faster Results</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  More headhunters competing means quicker candidate delivery
                </p>
              </div>
            </div>
          </div>

          {/* Terms Notice */}
          <div className="flex gap-3 p-3 sm:p-4 rounded-lg border border-amber-500/50 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs sm:text-sm">
              <p className="font-semibold text-foreground">Exclusive Terms & Conditions</p>
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
        <div className="flex flex-col gap-2 sm:gap-3">
          <Button
            onClick={onActivate}
            className="w-full bg-gradient-to-r from-[hsl(var(--luxury-gold))] via-[hsl(var(--luxury-rose-gold))] to-[hsl(var(--luxury-purple))] hover:opacity-90 text-white shadow-lg"
            size="default"
          >
            <Zap className="h-4 w-4 mr-2" />
            Activate Exclusive Status
          </Button>
          <div className="flex gap-2 sm:gap-3">
            <Button
              onClick={onNotNow}
              variant="outline"
              size="default"
              className="flex-1"
            >
              Not Now
            </Button>
            <Button
              onClick={onDontShowAgain}
              variant="ghost"
              size="default"
              className="flex-1 text-muted-foreground hover:text-foreground"
            >
              Don't Show Again
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
