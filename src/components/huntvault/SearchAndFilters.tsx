import { Search, Filter, RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterState } from "./types";
import { industries, locations, seniorities, statuses } from "./constants";

interface SearchAndFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  actionButtons: React.ReactNode;
}

export function SearchAndFilters({ filters, onFilterChange, actionButtons }: SearchAndFiltersProps) {
  return (
    <Card className="mb-6 border-border/40 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, skill, or tag…"
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              className="pl-10 h-12 rounded-xl border-border/40 bg-background/50"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => onFilterChange({ showFilters: !filters.showFilters })}
            className="rounded-xl h-12"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {filters.showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-background/50 border border-border/40">
            <div>
              <label className="text-sm font-medium mb-2 block">Industry</label>
              <Select 
                value={filters.selectedIndustry} 
                onValueChange={(value) => onFilterChange({ selectedIndustry: value })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((ind) => (
                    <SelectItem key={ind} value={ind}>
                      {ind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Location</label>
              <Select 
                value={filters.selectedLocation} 
                onValueChange={(value) => onFilterChange({ selectedLocation: value })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Seniority</label>
              <Select 
                value={filters.selectedSeniority} 
                onValueChange={(value) => onFilterChange({ selectedSeniority: value })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {seniorities.map((sen) => (
                    <SelectItem key={sen} value={sen}>
                      {sen}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select 
                value={filters.selectedStatus} 
                onValueChange={(value) => onFilterChange({ selectedStatus: value })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((stat) => (
                    <SelectItem key={stat} value={stat}>
                      {stat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="rounded-xl">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Filters
            </Button>
            <Button variant="ghost" size="sm" className="rounded-xl">
              <Save className="h-4 w-4 mr-2" />
              Save View
            </Button>
          </div>
          <div className="flex gap-2">
            {actionButtons}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
