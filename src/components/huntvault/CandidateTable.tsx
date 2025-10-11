import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Candidate, ColumnConfig } from "./types";
import { fixedColumns } from "./constants";
import { SortableTableHead } from "./SortableTableHead";
import { CandidateTableRow } from "./CandidateTableRow";
import { Pagination } from "./Pagination";

interface CandidateTableProps {
  candidates: Candidate[];
  columns: ColumnConfig[];
  visibleColumns: ColumnConfig[];
  rowsPerPage: string;
  onDragEnd: (event: DragEndEvent) => void;
  onRowsPerPageChange: (value: string) => void;
  onSelectCandidate: (candidate: Candidate) => void;
}

export function CandidateTable({
  candidates,
  visibleColumns,
  rowsPerPage,
  onDragEnd,
  onRowsPerPageChange,
  onSelectCandidate,
}: CandidateTableProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead className="w-12 sticky left-0 bg-card z-10">
                    <input type="checkbox" className="rounded" />
                  </TableHead>
                  {fixedColumns.map((column) => (
                    <TableHead 
                      key={column.id} 
                      className={`min-w-[200px] ${
                        column.id === 'candidate' 
                          ? 'sticky left-12 bg-card z-10 border-r border-border/40' 
                          : ''
                      }`}
                    >
                      {column.label}
                    </TableHead>
                  ))}
                  <SortableContext
                    items={visibleColumns.map((col) => col.id)}
                    strategy={horizontalListSortingStrategy}
                  >
                    {visibleColumns.map((column) => (
                      <SortableTableHead key={column.id} column={column} />
                    ))}
                  </SortableContext>
                  <TableHead className="text-right min-w-[120px] sticky right-0 bg-card border-l border-border/40">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((candidate) => (
                  <CandidateTableRow
                    key={candidate.id}
                    candidate={candidate}
                    visibleColumns={visibleColumns}
                    onSelect={onSelectCandidate}
                  />
                ))}
              </TableBody>
            </Table>
          </DndContext>
        </div>

        <Pagination 
          rowsPerPage={rowsPerPage} 
          onRowsPerPageChange={onRowsPerPageChange} 
        />
      </CardContent>
    </Card>
  );
}
