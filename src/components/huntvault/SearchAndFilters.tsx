import { useMemo, useState, useEffect } from "react";
import {
  Archive,
  Upload,
  Search,
  Filter,
  RefreshCw,
  Save,
  Eye,
  Edit,
  Trash2,
  X,
  FileText,
  Building2,
  MapPin,
  User,
  Settings2,
  GripVertical,
  Download,
  Share2,
  LayoutGrid,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Star,
  Sparkles,
  Mail,
  Phone,
  Tag,
} from "lucide-react";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";

type Status = "active" | "pending" | "rejected" | "placed";

interface Candidate {
  id: string;
  name: string;
  avatar?: string;
  location: string;
  industry: string;
  tags: string[];
  progress: number;
  status: Status;
  lastUpdated: string;
  age?: number;
  gender?: string;
  email?: string;
  phone?: string;
  starred?: boolean;
}

const mockCandidates: Candidate[] = [
  {
    id: "1",
    name: "Sarah Chen",
    avatar: undefined,
    location: "San Francisco, CA",
    industry: "Tech",
    tags: ["React", "TypeScript", "Node.js"],
    progress: 75,
    status: "active",
    lastUpdated: "2 hours ago",
    age: 32,
    gender: "Female",
    email: "sarah.chen@example.com",
    phone: "+1 415 555 0199",
    starred: true,
  },
  {
    id: "2",
    name: "Michael Rodriguez",
    location: "New York, NY",
    industry: "Finance",
    tags: ["Python", "Data Science", "ML"],
    progress: 45,
    status: "pending",
    lastUpdated: "1 day ago",
    age: 28,
    gender: "Male",
    email: "m.rodriguez@example.com",
    phone: "+1 646 555 0144",
  },
  {
    id: "3",
    name: "Emily Watson",
    location: "London, UK",
    industry: "Healthcare",
    tags: ["Product Management", "Agile", "Strategy"],
    progress: 90,
    status: "placed",
    lastUpdated: "3 days ago",
    age: 35,
    gender: "Female",
    email: "emily.w@example.com",
    phone: "+44 20 7123 4567",
  },
];

const statsData = [
  { label: "Total Candidates", value: 247, icon: User, gradient: "from-accent-mint to-accent-lilac" },
  { label: "Active", value: 89, icon: User, gradient: "from-accent-lilac to-accent-pink" },
  { label: "In Process", value: 42, icon: FileText, gradient: "from-accent-pink to-accent-mint" },
  { label: "Placed", value: 116, icon: Building2, gradient: "from-accent-mint to-accent-lilac" },
];

const industries = ["All", "Tech", "Finance", "Healthcare", "Marketing"];
const locations = ["All", "San Francisco", "New York", "London", "Remote"];
const seniorities = ["All", "Junior", "Mid", "Senior", "Lead"];
const statuses = ["All", "Active", "Pending", "Rejected", "Placed"] as const;

interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
}

const fixedColumns: ColumnConfig[] = [
  { id: "candidate", label: "Candidate", visible: true },
  { id: "location", label: "Location", visible: true },
];

const defaultColumns: ColumnConfig[] = [
  { id: "age", label: "Age", visible: true },
  { id: "gender", label: "Gender", visible: true },
  { id: "industry", label: "Industry", visible: true },
  { id: "skills", label: "Skills", visible: true },
  { id: "progress", label: "Progress", visible: true },
  { id: "status", label: "Status", visible: true },
  { id: "lastUpdated", label: "Last Updated", visible: true },
];

interface SortableHeaderProps {
  column: ColumnConfig;
}

function SortableTableHead({ column }: SortableHeaderProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  } as React.CSSProperties;

  return (
    <TableHead ref={setNodeRef} style={style} className="relative min-w-[150px] bg-card">
      <div className="flex items-center gap-2">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <span>{column.label}</span>
      </div>
    </TableHead>
  );
}

// Utility
const getStatusColor = (status: Status) => {
  switch (status) {
    case "active":
      return "bg-green-500";
    case "pending":
      return "bg-blue-500";
    case "rejected":
      return "bg-red-500";
    case "placed":
      return "bg-purple-500";
    default:
      return "bg-gray-500";
  }
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

// ---- Main Component ----
export default function HuntVault() {
  // Filters/state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [selectedSeniority, setSelectedSeniority] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [showFilters, setShowFilters] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [columns, setColumns] = useState<ColumnConfig[]>(defaultColumns);
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [denseMode, setDenseMode] = useState(false);
  const [aiAssist, setAiAssist] = useState(true);
  const [view, setView] = useState("Default");
  const [bulkApplyOpen, setBulkApplyOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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
    setColumns((cols) => cols.map((col) => (col.id === columnId ? { ...col, visible: !col.visible } : col)));
  };

  const visibleColumns = columns.filter((c) => c.visible);

  // Derived rows (basic client-side filtering for demo)
  const rows = useMemo(() => {
    return mockCandidates.filter((c) => {
      const matchesQuery =
        searchQuery.length === 0 ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        c.industry.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesIndustry = selectedIndustry === "All" || c.industry === selectedIndustry;
      const matchesLocation =
        selectedLocation === "All" || c.location.toLowerCase().includes(selectedLocation.toLowerCase());
      const matchesStatus = selectedStatus === "All" || c.status === selectedStatus.toLowerCase();
      return matchesQuery && matchesIndustry && matchesLocation && matchesStatus;
    });
  }, [searchQuery, selectedIndustry, selectedLocation, selectedStatus]);

  const allSelected = rows.length > 0 && rows.every((r) => selectedRows[r.id]);
  const someSelected = rows.some((r) => selectedRows[r.id]) && !allSelected;

  const toggleAll = (checked: boolean) => {
    const update: Record<string, boolean> = {};
    rows.forEach((r) => (update[r.id] = checked));
    setSelectedRows(update);
  };

  // Keyboard shortcuts (demo)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setShortcutsOpen(true);
      }
      if (e.key.toLowerCase() === "b" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setBulkApplyOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-b from-background to-background/60">
        {/* Header */}
        <div className="sticky top-0 z-40 border-b border-border/40 bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-accent-mint via-accent-lilac to-accent-pink shadow">
                  <Archive className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-accent-mint via-accent-lilac to-accent-pink bg-clip-text text-transparent">
                    HuntVault
                  </h1>
                  <p className="text-xs text-muted-foreground hidden md:block">
                    Manage your sourced candidates — upload, tag, and track your talent pool.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" className="rounded-xl" onClick={() => setShortcutsOpen(true)}>
                      <LayoutGrid className="h-4 w-4 mr-2" />
                      Shortcuts
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Open keyboard shortcuts (Ctrl/Cmd + K)</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" className="rounded-xl" onClick={() => setAiAssist((v) => !v)}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      AI assist {aiAssist ? "On" : "Off"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Toggle AI suggestions (tagging, dedupe, ranking)</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="container mx-auto px-6 py-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statsData.map((stat, idx) => (
              <Card
                key={idx}
                className="group hover:scale-[1.02] transition-all duration-300 hover:shadow-lg border-border/40 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                      <stat.icon className="h-5 w-5 text-white" />
                    </div>
                    <Badge variant="outline" className="rounded-full">
                      Week
                    </Badge>
                  </div>
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Search + Actions */}
          <Card className="mb-6 border-border/40 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col lg:flex-row gap-4 items-stretch">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, skill, tag, or company…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 rounded-xl border-border/40 bg-background/50"
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="rounded-xl h-12">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="rounded-xl h-12">
                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                        View: {view}
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 rounded-xl" align="end">
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Saved views</h4>
                        <div className="flex flex-col gap-2">
                          {["Default", "Tech Only", "Placed", "My Stars"].map((v) => (
                            <Button
                              key={v}
                              variant={view === v ? "default" : "secondary"}
                              size="sm"
                              className="justify-start rounded-lg"
                              onClick={() => setView(v)}
                            >
                              {v}
                            </Button>
                          ))}
                        </div>
                        <Separator />
                        <Button variant="ghost" size="sm" className="rounded-lg w-full justify-start">
                          <Save className="h-4 w-4 mr-2" />
                          Save current as view
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="rounded-xl h-12 bg-gradient-to-r from-accent-mint via-accent-lilac to-accent-pink hover:opacity-90">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Resume
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-2xl max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Upload Resumes</DialogTitle>
                        <DialogDescription>
                          Drag and drop files or click to browse. Supports PDF and DOCX formats.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="border-2 border-dashed border-border/40 rounded-xl p-12 text-center hover:border-accent-mint transition-colors cursor-pointer">
                        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                        <p className="text-xs text-muted-foreground mt-2">PDF, DOCX up to 10MB</p>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          <Checkbox id="dedupe" defaultChecked />
                          <label htmlFor="dedupe" className="text-sm">
                            Auto-dedupe (AI)
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch id="parse" defaultChecked />
                          <label htmlFor="parse" className="text-sm">
                            Parse skills
                          </label>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Quick filters */}
              <div className="flex flex-wrap gap-2">
                {["React", "Python", "PM", "Remote", "Placed"].map((q) => (
                  <Badge
                    key={q}
                    variant="secondary"
                    className="rounded-full cursor-pointer"
                    onClick={() => setSearchQuery(q)}
                  >
                    #{q}
                  </Badge>
                ))}
              </div>

              {/* Collapsible filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 rounded-xl bg-background/50 border border-border/40">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Industry</label>
                    <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="All" />
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
                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="All" />
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
                    <Select value={selectedSeniority} onValueChange={setSelectedSeniority}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="All" />
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
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="All" />
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
                  <div>
                    <label className="text-sm font-medium mb-2 block">Density</label>
                    <Select
                      value={denseMode ? "compact" : "comfortable"}
                      onValueChange={(v) => setDenseMode(v === "compact")}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="comfortable">Comfortable</SelectItem>
                        <SelectItem value="compact">Compact</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2 lg:col-span-5 flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedIndustry("All");
                          setSelectedLocation("All");
                          setSelectedSeniority("All");
                          setSelectedStatus("All");
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset Filters
                      </Button>
                      <Button variant="ghost" size="sm" className="rounded-xl">
                        <Save className="h-4 w-4 mr-2" />
                        Save View
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Sparkles className="h-4 w-4" />
                      {aiAssist ? "AI suggestions enabled" : "AI suggestions disabled"}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bulk actions bar */}
          {someSelected || allSelected ? (
            <div className="sticky top-[64px] z-30 mb-4">
              <Card className="border-accent-mint/40 bg-accent/10">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <strong>{Object.values(selectedRows).filter(Boolean).length}</strong>
                    selected
                    <Separator orientation="vertical" className="mx-3 h-6" />
                    <Button size="sm" className="rounded-lg" onClick={() => setBulkApplyOpen(true)}>
                      Bulk Apply
                    </Button>
                    <Button size="sm" variant="secondary" className="rounded-lg">
                      <Tag className="h-4 w-4 mr-2" />
                      Tag
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-lg">
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" className="rounded-lg" onClick={() => setSelectedRows({})}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {/* Table */}
          <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <Table className={denseMode ? "[&_td]:py-2 [&_th]:py-2" : ""}>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-border/40">
                        <TableHead className="w-12 sticky left-0 bg-card z-10">
                          <Checkbox
                            checked={allSelected}
                            onCheckedChange={(v) => toggleAll(Boolean(v))}
                            aria-checked={someSelected ? "mixed" : allSelected}
                          />
                        </TableHead>
                        {fixedColumns.map((column) => (
                          <TableHead
                            key={column.id}
                            className={`min-w-[200px] ${column.id === "candidate" ? "sticky left-12 bg-card z-10 border-r border-border/40" : ""}`}
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
                        <TableHead className="text-right min-w-[160px] sticky right-0 bg-card border-l border-border/40">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {rows.map((candidate) => (
                        <TableRow
                          key={candidate.id}
                          className="hover:bg-muted/40 border-border/40 transition-colors"
                          onClick={() => setSelectedCandidate(candidate)}
                        >
                          <TableCell className="sticky left-0 bg-card z-10">
                            <Checkbox
                              checked={!!selectedRows[candidate.id]}
                              onCheckedChange={(v) =>
                                setSelectedRows((prev) => ({ ...prev, [candidate.id]: Boolean(v) }))
                              }
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>

                          {/* Candidate */}
                          <TableCell className="min-w-[220px] sticky left-12 bg-card z-10 border-r border-border/40">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={candidate.avatar} />
                                <AvatarFallback className="bg-gradient-to-br from-accent-mint to-accent-lilac text-white">
                                  {getInitials(candidate.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{candidate.name}</span>
                                  {candidate.starred ? (
                                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                  ) : null}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {candidate.email || "unknown"}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {candidate.phone || "N/A"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          {/* Location */}
                          <TableCell className="min-w-[200px]">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              {candidate.location}
                            </div>
                          </TableCell>

                          {/* Dynamic columns */}
                          {visibleColumns.map((column) => {
                            switch (column.id) {
                              case "age":
                                return (
                                  <TableCell key={column.id} className="min-w-[100px]">
                                    <span className="text-muted-foreground">{candidate.age ?? "N/A"}</span>
                                  </TableCell>
                                );
                              case "gender":
                                return (
                                  <TableCell key={column.id} className="min-w-[120px]">
                                    <Badge variant="secondary" className="rounded-full">
                                      {candidate.gender ?? "N/A"}
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
                                  <TableCell key={column.id} className="min-w-[220px]">
                                    <div className="flex gap-1 flex-wrap">
                                      {candidate.tags.slice(0, 2).map((tag, idx) => (
                                        <Badge
                                          key={idx}
                                          variant="outline"
                                          className="rounded-full text-xs"
                                          style={{
                                            borderColor: `hsl(var(--accent-${idx === 0 ? "mint" : "lilac"}))`,
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
                                      <Progress value={candidate.progress} className="h-2 flex-1" />
                                      <span className="text-sm text-muted-foreground">{candidate.progress}%</span>
                                    </div>
                                  </TableCell>
                                );
                              case "status":
                                return (
                                  <TableCell key={column.id} className="min-w-[140px]">
                                    <div className="flex items-center gap-2">
                                      <div className={`h-2 w-2 rounded-full ${getStatusColor(candidate.status)}`} />
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

                          {/* Row actions */}
                          <TableCell className="text-right min-w-[160px] sticky right-0 bg-card border-l border-border/40">
                            <div className="flex items-center justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedCandidate(candidate);
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Quick view</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Share2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Share profile</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </DndContext>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t border-border/40">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rows per page:</span>
                  <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
                    <SelectTrigger className="w-[90px] h-8 rounded-lg">
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
            </CardContent>
          </Card>
        </div>

        {/* Candidate Drawer */}
        <Dialog open={!!selectedCandidate} onOpenChange={() => setSelectedCandidate(null)}>
          <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
            {selectedCandidate && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedCandidate.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-accent-mint to-accent-lilac text-white text-xl">
                        {getInitials(selectedCandidate.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <DialogTitle className="text-2xl">{selectedCandidate.name}</DialogTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {selectedCandidate.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {selectedCandidate.industry}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedCandidate(null)}
                      className="rounded-lg"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </DialogHeader>

                <Tabs defaultValue="overview" className="mt-6">
                  <TabsList className="grid w-full grid-cols-4 rounded-xl">
                    <TabsTrigger value="overview" className="rounded-lg">
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="resume" className="rounded-lg">
                      Resume
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="rounded-lg">
                      Activity
                    </TabsTrigger>
                    <TabsTrigger value="compliance" className="rounded-lg">
                      Compliance
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4 mt-6">
                    <div>
                      <h3 className="font-semibold mb-2">Skills</h3>
                      <div className="flex gap-2 flex-wrap">
                        {selectedCandidate.tags.map((tag, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="rounded-full"
                            style={{
                              borderColor: `hsl(var(--accent-${idx % 2 === 0 ? "mint" : "lilac"}))`,
                              color: `hsl(var(--accent-${idx % 2 === 0 ? "mint" : "lilac"}))`,
                            }}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold mb-2">Status</h3>
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${getStatusColor(selectedCandidate.status)}`} />
                          <span className="capitalize">{selectedCandidate.status}</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Progress</h3>
                        <Progress value={selectedCandidate.progress} className="h-3" />
                        <span className="text-sm text-muted-foreground mt-1">
                          {selectedCandidate.progress}% complete
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {selectedCandidate.email || "unknown"}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {selectedCandidate.phone || "N/A"}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Notes</h3>
                        <Textarea
                          placeholder="Add notes about this candidate..."
                          className="rounded-xl min-h-[100px]"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="resume" className="mt-6">
                    <div className="border-2 border-dashed border-border/40 rounded-xl p-12 text-center">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No resume uploaded yet</p>
                      <Button className="mt-4 rounded-xl">Upload Resume</Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="activity" className="mt-6">
                    <div className="space-y-4 text-sm text-muted-foreground">No activity recorded yet</div>
                  </TabsContent>

                  <TabsContent value="compliance" className="mt-6">
                    <div className="space-y-4 text-sm text-muted-foreground">No compliance data available</div>
                  </TabsContent>
                </Tabs>

                <div className="flex flex-wrap gap-2 mt-6">
                  <Button className="flex-1 rounded-xl bg-gradient-to-r from-accent-mint via-accent-lilac to-accent-pink hover:opacity-90">
                    Attach to Job
                  </Button>
                  <Button variant="outline" className="flex-1 rounded-xl">
                    Share
                  </Button>
                  <Button variant="outline" className="rounded-xl text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Bulk Apply Flow (stub) */}
        <Dialog open={bulkApplyOpen} onOpenChange={setBulkApplyOpen}>
          <DialogContent className="rounded-2xl max-w-xl">
            <DialogHeader>
              <DialogTitle>Bulk Apply to Job</DialogTitle>
              <DialogDescription>Select a job, add a short note, and we'll queue the applications.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Job</label>
                <Select>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Choose a job…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="job-1">Senior React Engineer — Fintech</SelectItem>
                    <SelectItem value="job-2">Backend Engineer — Healthcare</SelectItem>
                    <SelectItem value="job-3">Product Manager — E‑commerce</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Message (optional)</label>
                <Textarea placeholder="Short personalized message…" className="rounded-xl" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => setBulkApplyOpen(false)}>
                Cancel
              </Button>
              <Button className="rounded-xl">
                Queue {Object.values(selectedRows).filter(Boolean).length} Applications
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Shortcuts */}
        <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
          <DialogContent className="rounded-2xl max-w-lg">
            <DialogHeader>
              <DialogTitle>Keyboard Shortcuts</DialogTitle>
              <DialogDescription>Handy commands to move faster.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between p-2 rounded-lg border">
                <span>Open shortcuts</span>
                <kbd className="px-2 py-1 rounded bg-muted border">Ctrl/Cmd + K</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg border">
                <span>Open bulk apply</span>
                <kbd className="px-2 py-1 rounded bg-muted border">Ctrl/Cmd + B</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg border">
                <span>Toggle filters</span>
                <kbd className="px-2 py-1 rounded bg-muted border">Click Filters</kbd>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
