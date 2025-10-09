import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface OnHoldReasonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}

const reasons = [
  "Budget constraints",
  "Waiting for approvals",
  "Position no longer urgent",
  "Restructuring in progress",
  "Candidate pipeline issue",
  "Other"
];

export function OnHoldReasonModal({ open, onOpenChange, onConfirm }: OnHoldReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");

  const handleConfirm = () => {
    if (selectedReason) {
      onConfirm(selectedReason);
      setSelectedReason("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Why is this job on hold?</DialogTitle>
          <DialogDescription>
            Select a reason for putting this job on hold
          </DialogDescription>
        </DialogHeader>
        <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
          {reasons.map((reason) => (
            <div key={reason} className="flex items-center space-x-2">
              <RadioGroupItem value={reason} id={reason} />
              <Label htmlFor={reason} className="cursor-pointer">
                {reason}
              </Label>
            </div>
          ))}
        </RadioGroup>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedReason}>
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
