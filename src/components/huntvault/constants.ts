import { User, FileText, Building2 } from "lucide-react";
import { Candidate, ColumnConfig, StatData } from "./types";

export const mockCandidates: Candidate[] = [
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

export const statsData: StatData[] = [
  { label: "Total Candidates", value: 247, icon: User, gradient: "from-accent-mint to-accent-lilac" },
  { label: "Active", value: 89, icon: User, gradient: "from-accent-lilac to-accent-pink" },
  { label: "In Process", value: 42, icon: FileText, gradient: "from-accent-pink to-accent-mint" },
  { label: "Placed", value: 116, icon: Building2, gradient: "from-accent-mint to-accent-lilac" },
];

export const industries = ["All", "Tech", "Finance", "Healthcare", "Marketing"];
export const locations = ["All", "San Francisco", "New York", "London", "Remote"];
export const seniorities = ["All", "Junior", "Mid", "Senior", "Lead"];
export const statuses = ["All", "Active", "Pending", "Rejected", "Placed"];

export const fixedColumns: ColumnConfig[] = [
  { id: "candidate", label: "Candidate", visible: true },
  { id: "location", label: "Location", visible: true },
];

export const defaultColumns: ColumnConfig[] = [
  { id: "age", label: "Age", visible: true },
  { id: "gender", label: "Gender", visible: true },
  { id: "industry", label: "Industry", visible: true },
  { id: "skills", label: "Skills", visible: true },
  { id: "progress", label: "Progress", visible: true },
  { id: "status", label: "Status", visible: true },
  { id: "lastUpdated", label: "Last Updated", visible: true },
];
