import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaginationProps {
  rowsPerPage: string;
  onRowsPerPageChange: (value: string) => void;
}

export function Pagination({ rowsPerPage, onRowsPerPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-between p-4 border-t border-border/40">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Rows per page:</span>
        <Select value={rowsPerPage} onValueChange={onRowsPerPageChange}>
          <SelectTrigger className="w-[70px] h-8 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="rounded-lg">
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg bg-gradient-to-r from-accent-mint/10 to-accent-lilac/10"
        >
          1
        </Button>
        <Button variant="outline" size="sm" className="rounded-lg">
          2
        </Button>
        <Button variant="outline" size="sm" className="rounded-lg">
          3
        </Button>
        <Button variant="outline" size="sm" className="rounded-lg">
          Next
        </Button>
      </div>
    </div>
  );
}
