import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnConfig } from "./types";

interface ColumnCustomizationProps {
  columns: ColumnConfig[];
  onToggleColumn: (columnId: string) => void;
}

export function ColumnCustomization({ columns, onToggleColumn }: ColumnCustomizationProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="rounded-xl">
          <Settings2 className="h-4 w-4 mr-2" />
          Customize Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 rounded-xl" align="end">
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Show/Hide Columns</h4>
          <p className="text-xs text-muted-foreground">Candidate & Location are always visible</p>
          <div className="space-y-3">
            {columns.map((column) => (
              <div key={column.id} className="flex items-center space-x-2">
                <Checkbox
                  id={column.id}
                  checked={column.visible}
                  onCheckedChange={() => onToggleColumn(column.id)}
                />
                <label
                  htmlFor={column.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {column.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
