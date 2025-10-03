import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';

interface EditHistoryEntry {
  id: string;
  edited_at: string;
  edited_by: string;
  changes: {
    field: string;
    old_value: any;
    new_value: any;
  }[];
  editor_name?: string;
}

interface JobEditHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: EditHistoryEntry[];
  jobTitle: string;
}

export function JobEditHistory({ open, onOpenChange, history, jobTitle }: JobEditHistoryProps) {
  const formatFieldName = (field: string) => {
    return field
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined || value === '') return 'Not set';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Edit History - {jobTitle}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No edit history available
            </div>
          ) : (
            <div className="space-y-6">
              {history.map((entry, index) => (
                <div 
                  key={entry.id} 
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[hsl(var(--accent-pink))]" />
                      <span className="font-semibold">
                        {format(new Date(entry.edited_at), 'PPp')}
                      </span>
                    </div>
                    <Badge variant="outline">
                      Edit #{history.length - index}
                    </Badge>
                  </div>

                  {entry.editor_name && (
                    <p className="text-sm text-muted-foreground">
                      Edited by {entry.editor_name}
                    </p>
                  )}

                  <div className="space-y-2">
                    {entry.changes.map((change, changeIndex) => (
                      <div 
                        key={changeIndex}
                        className="bg-muted/50 rounded p-3 space-y-2"
                      >
                        <div className="font-medium text-sm">
                          {formatFieldName(change.field)}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Before:</div>
                            <div className="text-destructive line-through">
                              {formatValue(change.old_value)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">After:</div>
                            <div className="text-[hsl(var(--success))]">
                              {formatValue(change.new_value)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
