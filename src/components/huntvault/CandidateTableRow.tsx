import { Eye, Edit, Trash2, MapPin } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Candidate, ColumnConfig } from "./types";
import { getStatusColor, getInitials } from "./utils";
import { fixedColumns } from "./constants";

interface CandidateTableRowProps {
  candidate: Candidate;
  visibleColumns: ColumnConfig[];
  onSelect: (candidate: Candidate) => void;
}

export function CandidateTableRow({ candidate, visibleColumns, onSelect }: CandidateTableRowProps) {
  return (
    <TableRow
      className="hover:bg-muted/50 border-border/40 cursor-pointer transition-colors"
      onClick={() => onSelect(candidate)}
    >
      <TableCell className="sticky left-0 bg-card z-10">
        <input
          type="checkbox"
          className="rounded"
          onClick={(e) => e.stopPropagation()}
        />
      </TableCell>
      {fixedColumns.map((column) => {
        switch (column.id) {
          case "candidate":
            return (
              <TableCell key={column.id} className="min-w-[200px] sticky left-12 bg-card z-10 border-r border-border/40">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={candidate.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-accent-mint to-accent-lilac text-white">
                      {getInitials(candidate.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{candidate.name}</span>
                </div>
              </TableCell>
            );
          case "location":
            return (
              <TableCell key={column.id} className="min-w-[200px]">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {candidate.location}
                </div>
              </TableCell>
            );
          default:
            return null;
        }
      })}
      {visibleColumns.map((column) => {
        switch (column.id) {
          case "age":
            return (
              <TableCell key={column.id} className="min-w-[100px]">
                <span className="text-muted-foreground">{candidate.age || "N/A"}</span>
              </TableCell>
            );
          case "gender":
            return (
              <TableCell key={column.id} className="min-w-[120px]">
                <Badge variant="secondary" className="rounded-full">
                  {candidate.gender || "N/A"}
                </Badge>
              </TableCell>
            );
          case "industry":
            return (
              <TableCell key={column.id} className="min-w-[150px]">
                <Badge variant="secondary" className="rounded-full">
                  {candidate.industry}
                </Badge>
              </TableCell>
            );
          case "skills":
            return (
              <TableCell key={column.id} className="min-w-[200px]">
                <div className="flex gap-1 flex-wrap">
                  {candidate.tags.slice(0, 2).map((tag, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="rounded-full text-xs"
                      style={{
                        borderColor: `hsl(var(--accent-${
                          idx === 0 ? "mint" : "lilac"
                        }))`,
                        color: `hsl(var(--accent-${idx === 0 ? "mint" : "lilac"}))`,
                      }}
                    >
                      {tag}
                    </Badge>
                  ))}
                  {candidate.tags.length > 2 && (
                    <Badge variant="outline" className="rounded-full text-xs">
                      +{candidate.tags.length - 2}
                    </Badge>
                  )}
                </div>
              </TableCell>
            );
          case "progress":
            return (
              <TableCell key={column.id} className="min-w-[150px]">
                <div className="flex items-center gap-2">
                  <Progress
                    value={candidate.progress}
                    className="h-2 flex-1"
                  />
                  <span className="text-sm text-muted-foreground">
                    {candidate.progress}%
                  </span>
                </div>
              </TableCell>
            );
          case "status":
            return (
              <TableCell key={column.id} className="min-w-[120px]">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${getStatusColor(
                      candidate.status
                    )}`}
                  />
                  <span className="capitalize">{candidate.status}</span>
                </div>
              </TableCell>
            );
          case "lastUpdated":
            return (
              <TableCell key={column.id} className="text-muted-foreground min-w-[140px]">
                {candidate.lastUpdated}
              </TableCell>
            );
          default:
            return null;
        }
      })}
      <TableCell className="text-right min-w-[120px] sticky right-0 bg-card border-l border-border/40">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(candidate);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
            onClick={(e) => e.stopPropagation()}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
