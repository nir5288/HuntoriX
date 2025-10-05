import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Search, MapPin, Briefcase, DollarSign, Star, Sparkles } from "lucide-react";

const MOCK_CANDIDATES = [
  {
    id: 1,
    name: "Alex Morgan",
    role: "Senior Frontend Developer",
    avatar: "/placeholder.svg",
    skills: ["React", "TypeScript", "Next.js", "Tailwind"],
    location: "Tel Aviv",
    experience: "5 years",
    salary: "$80k-$100k",
    status: "Available",
    sharedBy: "Sarah Chen",
    aiMatch: true,
  },
  {
    id: 2,
    name: "Jordan Lee",
    role: "Backend Engineer",
    avatar: "/placeholder.svg",
    skills: ["Node.js", "Python", "PostgreSQL", "AWS"],
    location: "Remote",
    experience: "4 years",
    salary: "$70k-$90k",
    status: "Interviewing",
    sharedBy: "Michael Rodriguez",
    aiMatch: false,
  },
  {
    id: 3,
    name: "Sam Patel",
    role: "Full Stack Developer",
    avatar: "/placeholder.svg",
    skills: ["React", "Node.js", "MongoDB", "Docker"],
    location: "Herzliya",
    experience: "3 years",
    salary: "$60k-$80k",
    status: "Available",
    sharedBy: "Emma Thompson",
    aiMatch: true,
  },
  {
    id: 4,
    name: "Casey Rivera",
    role: "DevOps Engineer",
    avatar: "/placeholder.svg",
    skills: ["Kubernetes", "AWS", "Terraform", "CI/CD"],
    location: "Jerusalem",
    experience: "6 years",
    salary: "$90k-$110k",
    status: "Available",
    sharedBy: "David Kim",
    aiMatch: false,
  },
  {
    id: 5,
    name: "Morgan Chen",
    role: "Product Manager",
    avatar: "/placeholder.svg",
    skills: ["Agile", "Analytics", "Roadmapping", "UX"],
    location: "Tel Aviv",
    experience: "7 years",
    salary: "$95k-$120k",
    status: "Hired",
    sharedBy: "Lisa Wang",
    aiMatch: false,
  },
  {
    id: 6,
    name: "Taylor Kim",
    role: "Data Scientist",
    avatar: "/placeholder.svg",
    skills: ["Python", "ML", "TensorFlow", "SQL"],
    location: "Remote",
    experience: "4 years",
    salary: "$85k-$105k",
    status: "Available",
    sharedBy: "James Foster",
    aiMatch: true,
  },
];

export default function HuntBase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAiMatches, setShowAiMatches] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);

  const filteredCandidates = MOCK_CANDIDATES.filter((candidate) => {
    const matchesSearch =
      searchQuery === "" ||
      candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.skills.some((skill) => skill.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesAi = !showAiMatches || candidate.aiMatch;

    const matchesSkills =
      selectedSkills.length === 0 ||
      selectedSkills.some((skill) => candidate.skills.includes(skill));

    const matchesStatus =
      selectedStatus.length === 0 || selectedStatus.includes(candidate.status);

    return matchesSearch && matchesAi && matchesSkills && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
      case "Interviewing":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20";
      case "Hired":
        return "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20";
      default:
        return "";
    }
  };

  const allSkills = Array.from(new Set(MOCK_CANDIDATES.flatMap((c) => c.skills)));
  const allStatuses = Array.from(new Set(MOCK_CANDIDATES.map((c) => c.status)));

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            HuntBase
          </h1>
          <p className="text-xl text-muted-foreground">
            Discover top talent from our verified candidate pool
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, role, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Checkbox
              id="ai-matches"
              checked={showAiMatches}
              onCheckedChange={(checked) => setShowAiMatches(checked as boolean)}
            />
            <label htmlFor="ai-matches" className="text-sm flex items-center gap-2 cursor-pointer">
              <Sparkles className="h-4 w-4 text-primary" />
              Show AI Matches for My Jobs
            </label>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filter Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h3 className="font-semibold mb-4">Filters</h3>

              <div className="space-y-6">
                {/* Skills Filter */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Skills</h4>
                  <div className="space-y-2">
                    {allSkills.slice(0, 8).map((skill) => (
                      <div key={skill} className="flex items-center gap-2">
                        <Checkbox
                          id={`skill-${skill}`}
                          checked={selectedSkills.includes(skill)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSkills([...selectedSkills, skill]);
                            } else {
                              setSelectedSkills(selectedSkills.filter((s) => s !== skill));
                            }
                          }}
                        />
                        <label htmlFor={`skill-${skill}`} className="text-sm cursor-pointer">
                          {skill}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Status Filter */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Availability</h4>
                  <div className="space-y-2">
                    {allStatuses.map((status) => (
                      <div key={status} className="flex items-center gap-2">
                        <Checkbox
                          id={`status-${status}`}
                          checked={selectedStatus.includes(status)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedStatus([...selectedStatus, status]);
                            } else {
                              setSelectedStatus(selectedStatus.filter((s) => s !== status));
                            }
                          }}
                        />
                        <label htmlFor={`status-${status}`} className="text-sm cursor-pointer">
                          {status}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSelectedSkills([]);
                    setSelectedStatus([]);
                    setShowAiMatches(false);
                  }}
                >
                  Clear All
                </Button>
              </div>
            </Card>
          </div>

          {/* Candidate Cards */}
          <div className="lg:col-span-3">
            <div className="mb-4 text-sm text-muted-foreground">
              {filteredCandidates.length} candidates found
            </div>
            <div className="grid gap-6">
              {filteredCandidates.map((candidate) => (
                <Card key={candidate.id} className="p-6 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={candidate.avatar} />
                      <AvatarFallback>
                        {candidate.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            {candidate.name}
                            {candidate.aiMatch && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground">{candidate.role}</p>
                        </div>
                        <Badge className={getStatusColor(candidate.status)} variant="outline">
                          {candidate.status}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {candidate.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {candidate.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {candidate.experience}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {candidate.salary}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Shared by{" "}
                          <span className="font-medium text-foreground">{candidate.sharedBy}</span>
                        </p>
                        <Button size="sm">View Full Profile</Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
