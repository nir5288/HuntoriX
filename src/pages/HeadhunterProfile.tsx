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
import { toast as sonnerToast } from "sonner";
import { 
  User, 
  MapPin, 
  Briefcase, 
  Star, 
  Clock, 
  Award,
  MessageSquare,
  ArrowLeft,
  Camera,
  Upload,
  Heart
} from "lucide-react";

interface HeadhunterProfile {
  id: string;
  name: string;
  email?: string;
  avatar_url: string | null;
  cover_image_url: string | null;
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
  const { user } = useAuth();
  const [profile, setProfile] = useState<HeadhunterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = user?.id === id;

  useEffect(() => {
    loadProfile();
    if (user && id && user.id !== id) {
      checkIfSaved();
    }
  }, [id, user]);

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

  const checkIfSaved = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('saved_headhunters')
        .select('id')
        .eq('user_id', user.id)
        .eq('headhunter_id', id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setIsSaved(true);
        setSavedId(data.id);
      }
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const handleToggleSave = async () => {
    if (!user || !id) {
      sonnerToast.error('Please log in to save headhunters');
      return;
    }

    try {
      if (isSaved && savedId) {
        // Unsave
        const { error } = await supabase
          .from('saved_headhunters')
          .delete()
          .eq('id', savedId);

        if (error) throw error;

        setIsSaved(false);
        setSavedId(null);
        sonnerToast.success('Headhunter removed from saved list');
      } else {
        // Save
        const { data, error } = await supabase
          .from('saved_headhunters')
          .insert({
            user_id: user.id,
            headhunter_id: id,
          })
          .select()
          .single();

        if (error) throw error;

        setIsSaved(true);
        setSavedId(data.id);
        sonnerToast.success('Headhunter added to your saved list');
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      sonnerToast.error('Failed to update saved status');
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
        description: `${type === 'avatar' ? 'Profile photo' : 'Cover image'} updated successfully`,
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
                alt="Profile cover"
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
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))]">
                    {profile.name?.[0]?.toUpperCase() || "H"}
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

                {!isOwnProfile && (
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      onClick={() => navigate(`/messages?with=${profile.id}`)}
                      className="bg-gradient-to-r from-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] hover:opacity-90"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleToggleSave}
                      className={isSaved ? "text-[hsl(var(--accent-pink))]" : ""}
                    >
                      <Heart className={`h-4 w-4 mr-2 ${isSaved ? 'fill-current' : ''}`} />
                      {isSaved ? 'Saved' : 'Save'}
                    </Button>
                  </div>
                )}
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
              {profile.expertise && profile.expertise.length > 0 ? (
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

              {profile.industries && profile.industries.length > 0 && (
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
        {profile.portfolio_links && profile.portfolio_links.length > 0 && (
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
