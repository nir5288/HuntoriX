import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  MapPin, 
  Briefcase, 
  MessageSquare,
  ArrowLeft,
  Award,
  Target,
  Users,
  Star,
  Mail,
  Phone,
  Camera,
  Upload
} from "lucide-react";

interface TeamMember {
  name: string;
  role: string;
  email?: string;
  phone?: string;
}

interface EmployerProfile {
  id: string;
  name: string;
  email?: string;
  avatar_url: string | null;
  cover_image_url: string | null;
  company_name: string | null;
  bio: string | null;
  company_mission: string | null;
  company_sector: string | null;
  company_hq: string | null;
  industries: string[];
  verified: boolean;
  company_size: string | null;
  company_culture: string | null;
  contact_person?: string | null;
  contact_phone?: string | null;
  team_members: TeamMember[] | null;
  rating_avg: number | null;
}

interface Job {
  id: string;
  title: string;
  location: string | null;
  employment_type: string;
  status: string;
  created_at: string;
}

const EmployerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = user?.id === id;

  // Show loading screen
  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-[hsl(var(--surface))] to-background">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadProfile();
    loadJobs();
  }, [id]);

  const loadProfile = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .rpc('get_public_profile', { profile_id: id });

      if (error) throw error;
      
      // get_public_profile returns an array, get first item
      const profileData = data && data.length > 0 ? data[0] : null;
      
      if (!profileData || profileData.role !== 'employer') {
        throw new Error('Profile not found');
      }
      
      setProfile({
        ...profileData,
        team_members: null
      } as any);
    } catch (error) {
      console.error("Error loading profile:", error);
      toast({
        title: "Error",
        description: "Failed to load employer profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title, location, employment_type, status, created_at")
        .eq("created_by", id)
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error("Error loading jobs:", error);
    }
  };

  const handleImageUpload = async (file: File, type: 'avatar' | 'cover') => {
    if (!user || !id) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);

      const updateField = type === 'avatar' ? 'avatar_url' : 'cover_image_url';
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [updateField]: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Reload profile
      await loadProfile();

      toast({
        title: "Success",
        description: `${type === 'avatar' ? 'Logo' : 'Cover image'} updated successfully`,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCoverClick = () => {
    if (isOwnProfile && coverInputRef.current) {
      coverInputRef.current.click();
    }
  };

  const handleAvatarClick = () => {
    if (isOwnProfile && avatarInputRef.current) {
      avatarInputRef.current.click();
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file, 'cover');
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file, 'avatar');
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
          <p className="text-muted-foreground">Employer not found</p>
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

        {/* Hidden file inputs */}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          onChange={handleCoverChange}
          className="hidden"
        />
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />

        {/* Cover Image */}
        <div 
          className={`mb-6 rounded-lg overflow-hidden relative group ${isOwnProfile ? 'cursor-pointer' : ''}`}
          onClick={handleCoverClick}
        >
          {profile.cover_image_url ? (
            <>
              <img
                src={profile.cover_image_url}
                alt="Company cover"
                className="w-full h-64 object-cover"
              />
              {isOwnProfile && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="text-white text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm font-medium">Click to upload cover image</p>
                  </div>
                </div>
              )}
            </>
          ) : isOwnProfile ? (
            <div className="w-full h-64 bg-muted flex items-center justify-center border-2 border-dashed border-border hover:border-primary transition-colors">
              <div className="text-center text-muted-foreground">
                <Upload className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm font-medium">Click to upload cover image</p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Header Section */}
        <Card className="mb-6 border-2">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div 
                className={`relative group ${isOwnProfile ? 'cursor-pointer' : ''}`}
                onClick={handleAvatarClick}
              >
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))]">
                    {profile.company_name?.[0]?.toUpperCase() || "C"}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{profile.company_name || profile.name}</h1>
                  {profile.verified && (
                    <Badge className="bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))]">
                      <Award className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  {profile.rating_avg !== null && profile.rating_avg > 0 && (
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 fill-[hsl(var(--accent-gold))] text-[hsl(var(--accent-gold))]" />
                      <span className="font-medium">{profile.rating_avg.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 mb-4">
                  {profile.company_sector && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {profile.company_sector}
                    </p>
                  )}
                  {profile.company_hq && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {profile.company_hq}
                    </p>
                  )}
                </div>

                <p className="text-muted-foreground mb-4">{profile.bio || "No company description provided"}</p>

                {!isOwnProfile && (
                  <Button
                    variant="default"
                    onClick={() => navigate(`/messages?with=${profile.id}`)}
                    className="bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] hover:opacity-90"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mission Statement */}
        {profile.company_mission && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{profile.company_mission}</p>
            </CardContent>
          </Card>
        )}

        {/* Company Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {profile.company_size && (
            <Card>
              <CardHeader>
                <CardTitle>Company Size</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{profile.company_size}</p>
              </CardContent>
            </Card>
          )}

          {profile.contact_person && (
            <Card>
              <CardHeader>
                <CardTitle>Contact Person</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{profile.contact_person}</p>
                {profile.contact_phone && (
                  <p className="text-sm text-muted-foreground mt-1">{profile.contact_phone}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Company Culture */}
        {profile.company_culture && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Company Culture</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{profile.company_culture}</p>
            </CardContent>
          </Card>
        )}

        {/* Industries */}
        {profile.industries && profile.industries.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Industries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.industries.map((industry) => (
                  <Badge key={industry} variant="secondary">
                    {industry}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Job Postings */}
        {jobs.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Active Job Openings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{job.title}</h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {job.location}
                            </span>
                          )}
                          <Badge variant="outline" className="capitalize">
                            {job.employment_type.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                      <Badge 
                        variant={job.status === "open" ? "default" : "secondary"}
                        className="capitalize"
                      >
                        {job.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Members */}
        {profile.team_members && profile.team_members.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team & HR Contacts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.team_members.map((member, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-semibold">{member.name}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{member.role}</p>
                    {member.email && (
                      <p className="text-sm flex items-center gap-1 text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </p>
                    )}
                    {member.phone && (
                      <p className="text-sm flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {member.phone}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EmployerProfile;
