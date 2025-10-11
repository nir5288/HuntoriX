import { useState } from "react";
import { Archive, Upload, Search, Filter, RefreshCw, Save, Eye, Edit, Trash2, X, FileText, Building2, MapPin, User, Settings2, GripVertical } from "lucide-react";
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface Candidate {
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
const statuses = ["All", "Active", "Pending", "Rejected", "Placed"];

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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className="relative"
    >
      <div className="flex items-center gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <span>{column.label}</span>
      </div>
    </TableHead>
  );
}

export default function HuntVault() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [selectedSeniority, setSelectedSeniority] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [showFilters, setShowFilters] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [columns, setColumns] = useState<ColumnConfig[]>(defaultColumns);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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
    setColumns((cols) =>
      cols.map((col) =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const visibleColumns = columns.filter((col) => col.visible);

  const getStatusColor = (status: string) => {
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

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

      {/* Stats Cards */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsData.map((stat, index) => (
            <Card
              key={index}
              className="group hover:scale-105 transition-all duration-300 hover:shadow-lg border-border/40 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filters */}
        <Card className="mb-6 border-border/40 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search by name, skill, or tag…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-border/40 bg-background/50"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="rounded-xl h-12"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-background/50 border border-border/40">
                <div>
                  <label className="text-sm font-medium mb-2 block">Industry</label>
                  <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
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
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
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
                  <Select value={selectedSeniority} onValueChange={setSelectedSeniority}>
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
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
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
                              onCheckedChange={() => toggleColumnVisibility(column.id)}
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
                <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-xl bg-gradient-to-r from-accent-mint via-accent-lilac to-accent-pink hover:opacity-90">
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
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        PDF, DOCX up to 10MB
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" className="rounded-xl">
                  Bulk Apply to Job
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Candidates Table */}
        <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/40">
                      <TableHead className="w-12">
                        <input type="checkbox" className="rounded" />
                      </TableHead>
                      {fixedColumns.map((column) => (
                        <TableHead key={column.id}>{column.label}</TableHead>
                      ))}
                      <SortableContext
                        items={visibleColumns.map((col) => col.id)}
                        strategy={horizontalListSortingStrategy}
                      >
                        {visibleColumns.map((column) => (
                          <SortableTableHead key={column.id} column={column} />
                        ))}
                      </SortableContext>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockCandidates.map((candidate) => (
                      <TableRow
                        key={candidate.id}
                        className="hover:bg-muted/50 border-border/40 cursor-pointer transition-colors"
                        onClick={() => setSelectedCandidate(candidate)}
                      >
                        <TableCell>
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
                                <TableCell key={column.id}>
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
                                <TableCell key={column.id}>
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
                                <TableCell key={column.id}>
                                  <span className="text-muted-foreground">{candidate.age || "N/A"}</span>
                                </TableCell>
                              );
                            case "gender":
                              return (
                                <TableCell key={column.id}>
                                  <Badge variant="secondary" className="rounded-full">
                                    {candidate.gender || "N/A"}
                                  </Badge>
                                </TableCell>
                              );
                            case "industry":
                              return (
                                <TableCell key={column.id}>
                                  <Badge variant="secondary" className="rounded-full">
                                    {candidate.industry}
                                  </Badge>
                                </TableCell>
                              );
                            case "skills":
                              return (
                                <TableCell key={column.id}>
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
                                <TableCell key={column.id}>
                                  <div className="flex items-center gap-2 min-w-[120px]">
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
                                <TableCell key={column.id}>
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
                                <TableCell key={column.id} className="text-muted-foreground">
                                  {candidate.lastUpdated}
                                </TableCell>
                              );
                            default:
                              return null;
                          }
                        })}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
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
          </CardContent>
        </Card>
      </div>

      {/* Candidate Details Drawer */}
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
                            borderColor: `hsl(var(--accent-${
                              idx % 2 === 0 ? "mint" : "lilac"
                            }))`,
                            color: `hsl(var(--accent-${idx % 2 === 0 ? "mint" : "lilac"}))`,
                          }}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Status</h3>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-3 w-3 rounded-full ${getStatusColor(
                          selectedCandidate.status
                        )}`}
                      />
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
                  <div>
                    <h3 className="font-semibold mb-2">Notes</h3>
                    <Textarea
                      placeholder="Add notes about this candidate..."
                      className="rounded-xl min-h-[100px]"
                    />
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
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      No activity recorded yet
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="compliance" className="mt-6">
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      No compliance data available
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 mt-6">
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
    </div>
  );
}
