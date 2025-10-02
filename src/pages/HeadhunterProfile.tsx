import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  MapPin, 
  Briefcase, 
  Star, 
  Clock, 
  Award,
  MessageSquare,
  ArrowLeft
} from "lucide-react";

interface HeadhunterProfile {
  id: string;
  name: string;
  email?: string;
  avatar_url: string | null;
  bio: string | null;
  industries: string[];
  expertise: string[];
  hourly_rate: number | null;
  placement_fee_percent: number | null;
  rating_avg: number;
  success_rate: number;
  avg_time_to_fill_days: number;
  portfolio_links: string[];
  verified: boolean;
  skills: string[];
  languages: string[];
  regions: string[];
  availability: boolean;
  years_experience: number | null;
  placements_count: number;
  response_time_hours: number | null;
}

const HeadhunterProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<HeadhunterProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .rpc('get_public_profile', { profile_id: id });

      if (error) throw error;
      
      // get_public_profile returns an array, get first item
      const profileData = data && data.length > 0 ? data[0] : null;
      
      if (!profileData || profileData.role !== 'headhunter') {
        throw new Error('Profile not found');
      }
      
      setProfile(profileData as any);
    } catch (error) {
      console.error("Error loading profile:", error);
      toast({
        title: "Error",
        description: "Failed to load headhunter profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-[hsl(var(--surface))] to-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-[hsl(var(--surface))] to-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Headhunter not found</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-[hsl(var(--surface))] to-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Header Section */}
        <Card className="mb-6 border-2">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))]">
                  {profile.name?.[0]?.toUpperCase() || "H"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{profile.name}</h1>
                  {profile.verified && (
                    <Badge className="bg-gradient-to-r from-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))]">
                      <Award className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-[hsl(var(--accent-mint))] text-[hsl(var(--accent-mint))]" />
                    <span>{profile.rating_avg.toFixed(1)} rating</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    <span>{profile.success_rate}% success rate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Avg {profile.avg_time_to_fill_days} days to fill</span>
                  </div>
                </div>

                <p className="text-muted-foreground mb-4">{profile.bio || "No bio provided"}</p>

                <Button
                  variant="default"
                  onClick={() => navigate(`/messages?with=${profile.id}`)}
                  className="bg-gradient-to-r from-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] hover:opacity-90"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{profile.placements_count || 0}</p>
              <p className="text-sm text-muted-foreground">Successful Placements</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{profile.years_experience || 0}</p>
              <p className="text-sm text-muted-foreground">Years Experience</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {profile.response_time_hours ? `${profile.response_time_hours}h` : "N/A"}
              </p>
              <p className="text-sm text-muted-foreground">Avg Response Time</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Expertise & Industries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Expertise
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.expertise.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.expertise.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No expertise listed</p>
              )}

              {profile.industries.length > 0 && (
                <>
                  <h4 className="font-semibold mt-4 mb-2">Industries</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.industries.map((industry) => (
                      <Badge key={industry} variant="outline">
                        {industry}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.hourly_rate && (
                <div>
                  <p className="text-sm text-muted-foreground">Hourly Rate</p>
                  <p className="text-2xl font-bold">${profile.hourly_rate}/hr</p>
                </div>
              )}
              {profile.placement_fee_percent && (
                <div>
                  <p className="text-sm text-muted-foreground">Placement Fee</p>
                  <p className="text-2xl font-bold">{profile.placement_fee_percent}%</p>
                </div>
              )}
              {!profile.hourly_rate && !profile.placement_fee_percent && (
                <p className="text-sm text-muted-foreground">No pricing information available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Skills & Tools */}
        {profile.skills && profile.skills.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Skills & Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <Badge key={skill} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Languages & Regions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {profile.languages && profile.languages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Languages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.languages.map((lang) => (
                    <Badge key={lang} variant="secondary">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {profile.regions && profile.regions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Active Regions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.regions.map((region) => (
                    <Badge key={region} variant="secondary">
                      {region}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Portfolio Links */}
        {profile.portfolio_links.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Portfolio & Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {profile.portfolio_links.map((link, index) => (
                  <a
                    key={index}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-primary hover:underline"
                  >
                    {link}
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HeadhunterProfile;
