import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface OnHoldReasonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}

const reasons = [
  "Budget constraints",
  "Waiting for approvals",
  "Candidate pool needs expansion",
  "Internal restructuring",
  "Seasonal pause",
  "Position requirements under review",
  "Other"
];

export function OnHoldReasonModal({ open, onOpenChange, onConfirm }: OnHoldReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>(reasons[0]);

  const handleConfirm = () => {
    onConfirm(selectedReason);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Put Job On Hold</DialogTitle>
          <DialogDescription>
            Please select a reason for putting this job on hold.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
            <div className="space-y-3">
              {reasons.map((reason) => (
                <div key={reason} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason} id={reason} />
                  <Label htmlFor={reason} className="cursor-pointer font-normal">
                    {reason}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
