import { useState } from "react";
import { Archive } from "lucide-react";
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Button } from "@/components/ui/button";
import { StatsCards } from "@/components/huntvault/StatsCards";
import { SearchAndFilters } from "@/components/huntvault/SearchAndFilters";
import { ColumnCustomization } from "@/components/huntvault/ColumnCustomization";
import { UploadModal } from "@/components/huntvault/UploadModal";
import { CandidateTable } from "@/components/huntvault/CandidateTable";
import { CandidateDetailsDialog } from "@/components/huntvault/CandidateDetailsDialog";
import { Candidate, ColumnConfig, FilterState } from "@/components/huntvault/types";
import { statsData, mockCandidates, defaultColumns } from "@/components/huntvault/constants";

export default function HuntVault() {
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: "",
    selectedIndustry: "All",
    selectedLocation: "All",
    selectedSeniority: "All",
    selectedStatus: "All",
    showFilters: true,
  });
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [columns, setColumns] = useState<ColumnConfig[]>(defaultColumns);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setColumns((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleColumnVisibility = (columnId: string) => {
    setColumns((cols) =>
      cols.map((col) =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const visibleColumns = columns.filter((col) => col.visible);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-accent-mint via-accent-lilac to-accent-pink">
              <Archive className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-accent-mint via-accent-lilac to-accent-pink bg-clip-text text-transparent">
              HuntVault
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Manage your sourced candidates — upload, tag, and track your talent pool.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Stats Cards */}
        <StatsCards stats={statsData} />

        {/* Search and Filters */}
        <SearchAndFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          actionButtons={
            <>
              <ColumnCustomization
                columns={columns}
                onToggleColumn={toggleColumnVisibility}
              />
              <UploadModal
                open={uploadModalOpen}
                onOpenChange={setUploadModalOpen}
              />
              <Button variant="outline" className="rounded-xl">
                Bulk Apply to Job
              </Button>
            </>
          }
        />

        {/* Candidates Table */}
        <CandidateTable
          candidates={mockCandidates}
          columns={columns}
          visibleColumns={visibleColumns}
          rowsPerPage={rowsPerPage}
          onDragEnd={handleDragEnd}
          onRowsPerPageChange={setRowsPerPage}
          onSelectCandidate={setSelectedCandidate}
        />
      </div>

      {/* Candidate Details Dialog */}
      <CandidateDetailsDialog
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
      />
    </div>
  );
}
