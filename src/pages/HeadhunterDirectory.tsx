import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InviteToJobModal } from "@/components/InviteToJobModal";
import { 
  Search, 
  Star, 
  MapPin, 
  Briefcase, 
  TrendingUp,
  Filter,
  UserPlus
} from "lucide-react";

interface Headhunter {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  expertise: string[];
  industries: string[];
  rating_avg: number;
  success_rate: number;
  placement_fee_percent: number | null;
  hourly_rate: number | null;
  regions: string[];
  languages: string[];
  availability: boolean;
  verified: boolean;
  response_time_hours: number | null;
}

const HeadhunterDirectory = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [headhunters, setHeadhunters] = useState<Headhunter[]>([]);
  const [filteredHeadhunters, setFilteredHeadhunters] = useState<Headhunter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("rating");
  const [filterIndustry, setFilterIndustry] = useState<string>("all");
  const [filterAvailability, setFilterAvailability] = useState<string>("all");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedHeadhunter, setSelectedHeadhunter] = useState<Headhunter | null>(null);

  useEffect(() => {
    loadHeadhunters();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [headhunters, searchTerm, sortBy, filterIndustry, filterAvailability]);

  const loadHeadhunters = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_public_profiles');

      if (error) throw error;
      
      // Filter for headhunters and non-suspended users client-side
      const filteredData = (data || []).filter(
        (profile: any) => profile.role === 'headhunter' && profile.status !== 'suspended'
      );
      
      setHeadhunters(filteredData as any);
    } catch (error) {
      console.error("Error loading headhunters:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...headhunters];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (h) =>
          h.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          h.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          h.expertise?.some((e) => e.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Industry filter
    if (filterIndustry !== "all") {
      filtered = filtered.filter((h) =>
        h.industries?.includes(filterIndustry)
      );
    }

    // Availability filter
    if (filterAvailability === "available") {
      filtered = filtered.filter((h) => h.availability === true);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.rating_avg || 0) - (a.rating_avg || 0);
        case "success_rate":
          return (b.success_rate || 0) - (a.success_rate || 0);
        case "response_time":
          return (a.response_time_hours || 999) - (b.response_time_hours || 999);
        default:
          return 0;
      }
    });

    setFilteredHeadhunters(filtered);
  };

  const handleInviteClick = (headhunter: Headhunter) => {
    if (!user || profile?.role !== "employer") {
      navigate("/auth");
      return;
    }
    setSelectedHeadhunter(headhunter);
    setInviteModalOpen(true);
  };

  const allIndustries = Array.from(
    new Set(headhunters.flatMap((h) => h.industries || []))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-[hsl(var(--surface))] to-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Loading headhunters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-[hsl(var(--surface))] to-background">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] bg-clip-text text-transparent">
            Find a Headhunter
          </h1>
          <p className="text-muted-foreground">
            Browse and connect with experienced recruitment professionals
          </p>
        </div>

        {/* Search & Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, skills, expertise..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={filterIndustry} onValueChange={setFilterIndustry}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  {allIndustries.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterAvailability} onValueChange={setFilterAvailability}>
                <SelectTrigger>
                  <SelectValue placeholder="Availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="available">Available Now</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rating</SelectItem>
                  <SelectItem value="success_rate">Success Rate</SelectItem>
                  <SelectItem value="response_time">Fastest Response</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <p className="text-muted-foreground mb-4">
          {filteredHeadhunters.length} headhunter{filteredHeadhunters.length !== 1 ? "s" : ""} found
        </p>

        {/* Headhunters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHeadhunters.map((headhunter) => (
            <Card
              key={headhunter.id}
              className="hover:shadow-lg transition-all cursor-pointer flex flex-col"
            >
              <CardContent className="p-6 flex flex-col h-full">
                <div
                  className="mb-4 flex-grow"
                  onClick={() => navigate(`/profile/headhunter/${headhunter.id}`)}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={headhunter.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] text-xl">
                        {headhunter.name?.[0]?.toUpperCase() || "H"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{headhunter.name}</h3>
                        {headhunter.verified && (
                          <Badge className="bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))]">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">
                          {headhunter.rating_avg?.toFixed(1) || "N/A"}
                        </span>
                        {headhunter.availability && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Available
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {headhunter.bio || "No bio provided"}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-3 text-sm">
                    {headhunter.success_rate > 0 && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span>{headhunter.success_rate}% success</span>
                      </div>
                    )}
                    {headhunter.response_time_hours && (
                      <div className="text-muted-foreground">
                        ~{headhunter.response_time_hours}h response
                      </div>
                    )}
                  </div>

                  {/* Expertise */}
                  {headhunter.expertise && headhunter.expertise.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {headhunter.expertise.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {headhunter.expertise.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{headhunter.expertise.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Regions */}
                  {headhunter.regions && headhunter.regions.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{headhunter.regions.join(", ")}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t mt-auto">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate(`/profile/headhunter/${headhunter.id}`)}
                  >
                    View Profile
                  </Button>
                  {profile?.role === "employer" && (
                    <Button
                      className="flex-1 bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))]"
                      onClick={() => handleInviteClick(headhunter)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredHeadhunters.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No headhunters found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {selectedHeadhunter && user && (
        <InviteToJobModal
          open={inviteModalOpen}
          onOpenChange={setInviteModalOpen}
          headhunterId={selectedHeadhunter.id}
          headhunterName={selectedHeadhunter.name}
          employerId={user.id}
        />
      )}
    </div>
  );
};

export default HeadhunterDirectory;
