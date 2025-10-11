export interface Candidate {
  id: string;
  name: string;
  avatar?: string;
  location: string;
  industry: string;
  tags: string[];
  progress: number;
  status: "active" | "pending" | "rejected" | "placed";
  lastUpdated: string;
  age?: number;
  gender?: string;
}

export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
}

export interface StatData {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
}

export interface FilterState {
  searchQuery: string;
  selectedIndustry: string;
  selectedLocation: string;
  selectedSeniority: string;
  selectedStatus: string;
  showFilters: boolean;
}
