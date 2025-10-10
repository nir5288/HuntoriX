import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, Save, Loader2, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { Palette } from "lucide-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";

interface TeamMember {
  name: string;
  role: string;
  email?: string;
  phone?: string;
}

interface ColorPalette {
  id: string;
  name: string;
  colors: {
    primary: string;
    accentPink: string;
    accentMint: string;
    accentLilac: string;
  };
}

const colorPalettes: ColorPalette[] = [
  {
    id: "default",
    name: "Original",
    colors: {
      primary: "220 27% 11%",
      accentPink: "337 76% 91%",
      accentMint: "150 48% 88%",
      accentLilac: "252 100% 95%",
    },
  },
  {
    id: "vibrant",
    name: "Vibrant Mix",
    colors: {
      primary: "200 85% 45%",
      accentPink: "340 90% 60%",
      accentMint: "160 75% 55%",
      accentLilac: "270 85% 65%",
    },
  },
  {
    id: "sunset",
    name: "Sunset Glow",
    colors: {
      primary: "15 88% 48%",
      accentPink: "350 92% 58%",
      accentMint: "45 80% 60%",
      accentLilac: "280 75% 68%",
    },
  },
  {
    id: "tropical",
    name: "Tropical Paradise",
    colors: {
      primary: "180 82% 42%",
      accentPink: "320 85% 62%",
      accentMint: "155 88% 50%",
      accentLilac: "250 80% 70%",
    },
  },
  {
    id: "electric",
    name: "Electric Pop",
    colors: {
      primary: "280 90% 55%",
      accentPink: "330 88% 65%",
      accentMint: "170 85% 58%",
      accentLilac: "260 92% 68%",
    },
  },
  {
    id: "coral",
    name: "Coral Reef",
    colors: {
      primary: "10 85% 50%",
      accentPink: "345 90% 62%",
      accentMint: "165 80% 55%",
      accentLilac: "290 78% 70%",
    },
  },
  {
    id: "neon",
    name: "Neon Lights",
    colors: {
      primary: "300 95% 52%",
      accentPink: "335 92% 60%",
      accentMint: "145 88% 52%",
      accentLilac: "265 90% 65%",
    },
  },
  {
    id: "azure",
    name: "Azure Dreams",
    colors: {
      primary: "210 88% 48%",
      accentPink: "325 85% 63%",
      accentMint: "175 82% 56%",
      accentLilac: "245 87% 68%",
    },
  },
  {
    id: "berry",
    name: "Berry Blast",
    colors: {
      primary: "340 90% 48%",
      accentPink: "355 88% 60%",
      accentMint: "140 85% 52%",
      accentLilac: "275 82% 66%",
    },
  },
  {
    id: "aurora",
    name: "Aurora Borealis",
    colors: {
      primary: "190 85% 45%",
      accentPink: "310 88% 62%",
      accentMint: "150 90% 54%",
      accentLilac: "255 85% 70%",
    },
  },
  {
    id: "spectrum",
    name: "Full Spectrum",
    colors: {
      primary: "240 88% 50%",
      accentPink: "0 90% 58%",
      accentMint: "120 85% 55%",
      accentLilac: "280 87% 68%",
    },
  },
];

const Settings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { showStatus, setShowStatus } = useUserPreferences();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localShowStatus, setLocalShowStatus] = useState(showStatus);
  const [showAiAssistant, setShowAiAssistant] = useState(true);
  const [aiPrefInitialized, setAiPrefInitialized] = useState(false);
  const [selectedPalette, setSelectedPalette] = useState<string>(() => {
    return localStorage.getItem("color-palette") || "default";
  });
  const [credits, setCredits] = useState<{
    total: number;
    used: number;
    remaining: number;
    planName: string;
  } | null>(null);

  // Subscribe to AI assistant preference so the toggle updates live
  const { data: aiPref } = useQuery({
    queryKey: ['profile-ai-preference', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('show_ai_assistant')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  useEffect(() => {
    if (aiPref) {
      setShowAiAssistant(aiPref.show_ai_assistant !== false);
    }
  }, [aiPref]);

  // Employer fields
  const [companyName, setCompanyName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [bio, setBio] = useState("");
  const [companyMission, setCompanyMission] = useState("");
  const [companySector, setCompanySector] = useState("");
  const [companyHq, setCompanyHq] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [companyCulture, setCompanyCulture] = useState("");
  const [industries, setIndustries] = useState<string[]>([]);
  const [industryInput, setIndustryInput] = useState("");

  // Headhunter fields
  const [name, setName] = useState("");
  const [expertise, setExpertise] = useState<string[]>([]);
  const [expertiseInput, setExpertiseInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [regions, setRegions] = useState<string[]>([]);
  const [regionInput, setRegionInput] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [responseTimeHours, setResponseTimeHours] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [placementFeePercent, setPlacementFeePercent] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (profile) {
      loadProfileData();
      // Fetch the latest AI assistant preference from database
      fetchAiAssistantPreference();
      // Fetch credits for headhunters
      if (profile.role === 'headhunter') {
        fetchCredits();
      }
    }
  }, [user, profile]);

  const fetchCredits = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('get_user_credits', {
        p_user_id: user.id,
      });

      if (error) throw error;
      
      if (data && data.length > 0) {
        const creditData = data[0];
        
        // Get plan name
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('subscription_plans(name)')
          .eq('user_id', user.id)
          .single();
        
        setCredits({
          total: creditData.total_credits,
          used: creditData.credits_used,
          remaining: creditData.credits_remaining,
          planName: subscription?.subscription_plans?.name || 'Free',
        });
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  useEffect(() => {
    setLocalShowStatus(showStatus);
  }, [showStatus]);

  const fetchAiAssistantPreference = async () => {
    if (!user?.id) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('show_ai_assistant')
      .eq('id', user.id)
      .single();
    
    if (!error && data) {
      setShowAiAssistant(data.show_ai_assistant !== false);
    }
  };

  const loadProfileData = () => {
    if (!profile) return;

    // Load AI assistant preference once (default to true if not set)
    if (!aiPrefInitialized) {
      setShowAiAssistant(profile.show_ai_assistant !== false);
      setAiPrefInitialized(true);
    }

    if (profile.role === "employer") {
      setCompanyName(profile.company_name || "");
      setAvatarUrl(profile.avatar_url || "");
      setCoverImageUrl(profile.cover_image_url || "");
      setBio(profile.bio || "");
      setCompanyMission(profile.company_mission || "");
      setCompanySector(profile.company_sector || "");
      setCompanyHq(profile.company_hq || "");
      setCompanySize(profile.company_size || "");
      setCompanyCulture(profile.company_culture || "");
      setIndustries(profile.industries || []);
    } else if (profile.role === "headhunter") {
      setName(profile.name || "");
      setAvatarUrl(profile.avatar_url || "");
      setBio(profile.bio || "");
      setExpertise(profile.expertise || []);
      setSkills(profile.skills || []);
      setRegions(profile.regions || []);
      setIndustries(profile.industries || []);
      setYearsExperience(profile.years_experience?.toString() || "");
      setResponseTimeHours(profile.response_time_hours?.toString() || "");
      setHourlyRate(profile.hourly_rate?.toString() || "");
      setPlacementFeePercent(profile.placement_fee_percent?.toString() || "");
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const updates: any = {
        id: user.id,
        show_status: localShowStatus,
        show_ai_assistant: showAiAssistant,
      };

      if (profile?.role === "employer") {
        updates.company_name = companyName;
        updates.avatar_url = avatarUrl;
        updates.cover_image_url = coverImageUrl;
        updates.bio = bio;
        updates.company_mission = companyMission;
        updates.company_sector = companySector;
        updates.company_hq = companyHq;
        updates.company_size = companySize;
        updates.company_culture = companyCulture;
        updates.industries = industries;
      } else if (profile?.role === "headhunter") {
        updates.name = name;
        updates.avatar_url = avatarUrl;
        updates.bio = bio;
        updates.expertise = expertise;
        updates.skills = skills;
        updates.regions = regions;
        updates.industries = industries;
        updates.years_experience = yearsExperience ? parseInt(yearsExperience) : null;
        updates.response_time_hours = responseTimeHours ? parseInt(responseTimeHours) : null;
        updates.hourly_rate = hourlyRate ? parseFloat(hourlyRate) : null;
        updates.placement_fee_percent = placementFeePercent ? parseFloat(placementFeePercent) : null;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;

      // Update context
      setShowStatus(localShowStatus);

      // Invalidate AI assistant query to show/hide button immediately
      queryClient.invalidateQueries({ queryKey: ['profile-ai-preference', user.id] });

      await refreshProfile();

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      // Navigate to profile
      if (profile?.role === "employer") {
        navigate(`/profile/employer/${user.id}`);
      } else {
        navigate(`/profile/headhunter/${user.id}`);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addIndustry = () => {
    if (industryInput.trim() && !industries.includes(industryInput.trim())) {
      setIndustries([...industries, industryInput.trim()]);
      setIndustryInput("");
    }
  };

  const removeIndustry = (industry: string) => {
    setIndustries(industries.filter((i) => i !== industry));
  };

  const addExpertise = () => {
    if (expertiseInput.trim() && !expertise.includes(expertiseInput.trim())) {
      setExpertise([...expertise, expertiseInput.trim()]);
      setExpertiseInput("");
    }
  };

  const removeExpertise = (item: string) => {
    setExpertise(expertise.filter((e) => e !== item));
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const addRegion = () => {
    if (regionInput.trim() && !regions.includes(regionInput.trim())) {
      setRegions([...regions, regionInput.trim()]);
      setRegionInput("");
    }
  };

  const removeRegion = (region: string) => {
    setRegions(regions.filter((r) => r !== region));
  };

  const applyColorPalette = (paletteId: string) => {
    const palette = colorPalettes.find((p) => p.id === paletteId);
    if (!palette) return;

    const root = document.documentElement;
    root.style.setProperty("--primary", palette.colors.primary);
    root.style.setProperty("--accent-pink", palette.colors.accentPink);
    root.style.setProperty("--accent-mint", palette.colors.accentMint);
    root.style.setProperty("--accent-lilac", palette.colors.accentLilac);

    localStorage.setItem("color-palette", paletteId);
    setSelectedPalette(paletteId);

    toast({
      title: "Color Palette Updated",
      description: `Applied ${palette.name} color palette`,
    });
  };

  useEffect(() => {
    // Apply saved palette on load
    const savedPalette = localStorage.getItem("color-palette") || "default";
    const palette = colorPalettes.find((p) => p.id === savedPalette);
    if (palette) {
      const root = document.documentElement;
      root.style.setProperty("--primary", palette.colors.primary);
      root.style.setProperty("--accent-pink", palette.colors.accentPink);
      root.style.setProperty("--accent-mint", palette.colors.accentMint);
      root.style.setProperty("--accent-lilac", palette.colors.accentLilac);
    }
  }, []);


  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-[hsl(var(--surface))] to-background">
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-[hsl(var(--surface))] to-background">
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

        {profile.role === "employer" ? (
          // Employer Settings
          <div className="space-y-6">
            <Card className="border-[hsl(var(--accent-mint))]/20 bg-gradient-to-br from-background to-[hsl(var(--surface))]">
              <CardHeader>
                <CardTitle className="text-2xl bg-gradient-to-r from-[hsl(var(--accent-pink))] via-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] bg-clip-text text-transparent">Company Information</CardTitle>
                <CardDescription>Update your company details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter company name"
                  />
                </div>

                <div>
                  <Label htmlFor="avatarUrl">Company Logo URL</Label>
                  <Input
                    id="avatarUrl"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div>
                  <Label htmlFor="coverImageUrl">Cover Image URL</Label>
                  <Input
                    id="coverImageUrl"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="https://example.com/cover.jpg"
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Company Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Brief description of your company"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="companyMission">Mission Statement</Label>
                  <Textarea
                    id="companyMission"
                    value={companyMission}
                    onChange={(e) => setCompanyMission(e.target.value)}
                    placeholder="What is your company's mission?"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companySector">Sector</Label>
                    <Input
                      id="companySector"
                      value={companySector}
                      onChange={(e) => setCompanySector(e.target.value)}
                      placeholder="e.g., Technology, Healthcare"
                    />
                  </div>

                  <div>
                    <Label htmlFor="companyHq">Headquarters</Label>
                    <Input
                      id="companyHq"
                      value={companyHq}
                      onChange={(e) => setCompanyHq(e.target.value)}
                      placeholder="e.g., New York, USA"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="companySize">Company Size</Label>
                  <Input
                    id="companySize"
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                    placeholder="e.g., 50-200 employees"
                  />
                </div>

                <div>
                  <Label htmlFor="companyCulture">Company Culture</Label>
                  <Textarea
                    id="companyCulture"
                    value={companyCulture}
                    onChange={(e) => setCompanyCulture(e.target.value)}
                    placeholder="Describe your company culture"
                    rows={3}
                  />
                </div>

              </CardContent>
            </Card>

            <Card className="border-[hsl(var(--accent-lilac))]/20 bg-gradient-to-br from-background to-[hsl(var(--surface))]">
              <CardHeader>
                <CardTitle className="text-2xl bg-gradient-to-r from-[hsl(var(--accent-pink))] via-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] bg-clip-text text-transparent">Industries</CardTitle>
                <CardDescription>Add industries you hire for</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={industryInput}
                    onChange={(e) => setIndustryInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addIndustry()}
                    placeholder="Enter industry and press Enter"
                  />
                  <Button type="button" onClick={addIndustry}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {industries.map((industry) => (
                    <Badge key={industry} variant="secondary" className="gap-1">
                      {industry}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeIndustry(industry)}
                      />
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>
        ) : (
          // Headhunter Settings
          <div className="space-y-6">
            {credits && (
              <Card className="border-[hsl(var(--accent-lilac))]/20 bg-gradient-to-br from-[hsl(var(--accent-lilac))]/5 to-[hsl(var(--accent-pink))]/5">
                <CardHeader>
                  <CardTitle className="text-2xl bg-gradient-to-r from-[hsl(var(--accent-pink))] via-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] bg-clip-text text-transparent">Subscription & Credits</CardTitle>
                  <CardDescription>Your current plan and application credits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-background/50 border border-[hsl(var(--accent-mint))]/20">
                      <div className="text-sm text-muted-foreground mb-1">Current Plan</div>
                      <div className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] bg-clip-text text-transparent">
                        {credits.planName}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-background/50 border border-[hsl(var(--accent-pink))]/20">
                      <div className="text-sm text-muted-foreground mb-1">Application Credits</div>
                      <div className="text-2xl font-bold text-foreground">
                        {credits.remaining} / {credits.total}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {credits.used} used this month
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/plans')}
                    className="w-full"
                  >
                    Manage Subscription
                  </Button>
                </CardContent>
              </Card>
            )}
            
            <Card className="border-[hsl(var(--accent-mint))]/20 bg-gradient-to-br from-background to-[hsl(var(--surface))]">
              <CardHeader>
                <CardTitle className="text-2xl bg-gradient-to-r from-[hsl(var(--accent-pink))] via-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] bg-clip-text text-transparent">Personal Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <Label htmlFor="avatarUrl">Avatar URL</Label>
                  <Input
                    id="avatarUrl"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Brief introduction about yourself"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="yearsExperience">Years of Experience</Label>
                    <Input
                      id="yearsExperience"
                      type="number"
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                      placeholder="5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="responseTimeHours">Response Time (hours)</Label>
                    <Input
                      id="responseTimeHours"
                      type="number"
                      value={responseTimeHours}
                      onChange={(e) => setResponseTimeHours(e.target.value)}
                      placeholder="24"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      placeholder="100"
                    />
                  </div>

                  <div>
                    <Label htmlFor="placementFeePercent">Placement Fee (%)</Label>
                    <Input
                      id="placementFeePercent"
                      type="number"
                      value={placementFeePercent}
                      onChange={(e) => setPlacementFeePercent(e.target.value)}
                      placeholder="20"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[hsl(var(--accent-lilac))]/20 bg-gradient-to-br from-background to-[hsl(var(--surface))]">
              <CardHeader>
                <CardTitle className="text-2xl bg-gradient-to-r from-[hsl(var(--accent-pink))] via-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] bg-clip-text text-transparent">Expertise</CardTitle>
                <CardDescription>Add your areas of expertise</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={expertiseInput}
                    onChange={(e) => setExpertiseInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addExpertise()}
                    placeholder="Enter expertise and press Enter"
                  />
                  <Button type="button" onClick={addExpertise}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {expertise.map((item) => (
                    <Badge key={item} variant="secondary" className="gap-1">
                      {item}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeExpertise(item)}
                      />
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-[hsl(var(--accent-pink))]/20 bg-gradient-to-br from-background to-[hsl(var(--surface))]">
              <CardHeader>
                <CardTitle className="text-2xl bg-gradient-to-r from-[hsl(var(--accent-pink))] via-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] bg-clip-text text-transparent">Skills</CardTitle>
                <CardDescription>Add your recruiting skills</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
...
              </CardContent>
            </Card>

            <Card className="border-[hsl(var(--accent-lilac))]/20 bg-gradient-to-br from-background to-[hsl(var(--surface))]">
              <CardHeader>
                <CardTitle className="text-2xl bg-gradient-to-r from-[hsl(var(--accent-pink))] via-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] bg-clip-text text-transparent">Regions</CardTitle>
                <CardDescription>Regions where you work</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={regionInput}
                    onChange={(e) => setRegionInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addRegion()}
                    placeholder="Enter region and press Enter"
                  />
                  <Button type="button" onClick={addRegion}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {regions.map((region) => (
                    <Badge key={region} variant="secondary" className="gap-1">
                      {region}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeRegion(region)}
                      />
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-[hsl(var(--accent-pink))]/20 bg-gradient-to-br from-background to-[hsl(var(--surface))]">
              <CardHeader>
                <CardTitle className="text-2xl bg-gradient-to-r from-[hsl(var(--accent-pink))] via-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] bg-clip-text text-transparent">Industries</CardTitle>
                <CardDescription>Industries you focus on</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={industryInput}
                    onChange={(e) => setIndustryInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addIndustry()}
                    placeholder="Enter industry and press Enter"
                  />
                  <Button type="button" onClick={addIndustry}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {industries.map((industry) => (
                    <Badge key={industry} variant="secondary" className="gap-1">
                      {industry}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeIndustry(industry)}
                      />
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="border-[hsl(var(--accent-mint))]/20 bg-gradient-to-br from-background to-[hsl(var(--surface))] mt-6">
          <CardHeader>
            <CardTitle className="text-2xl bg-gradient-to-r from-[hsl(var(--accent-pink))] via-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] bg-clip-text text-transparent flex items-center gap-2">
              <Palette className="h-6 w-6" />
              Color Palette
            </CardTitle>
            <CardDescription>Choose your preferred color scheme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {colorPalettes.map((palette) => (
                <button
                  key={palette.id}
                  onClick={() => applyColorPalette(palette.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                    selectedPalette === palette.id
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10"
                      : "border-border hover:border-[hsl(var(--primary))]/50"
                  }`}
                >
                  <div className="flex gap-1">
                    <div
                      className="w-6 h-6 rounded-full border border-border"
                      style={{ backgroundColor: `hsl(${palette.colors.accentPink})` }}
                    />
                    <div
                      className="w-6 h-6 rounded-full border border-border"
                      style={{ backgroundColor: `hsl(${palette.colors.accentMint})` }}
                    />
                    <div
                      className="w-6 h-6 rounded-full border border-border"
                      style={{ backgroundColor: `hsl(${palette.colors.accentLilac})` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-center">{palette.name}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[hsl(var(--accent-pink))]/20 bg-gradient-to-br from-background to-[hsl(var(--surface))] mt-6">
          <CardHeader>
            <CardTitle className="text-2xl bg-gradient-to-r from-[hsl(var(--accent-pink))] via-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] bg-clip-text text-transparent">Privacy Settings</CardTitle>
            <CardDescription>Control your visibility and privacy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-status">Show Online Status</Label>
                <p className="text-sm text-muted-foreground">
                  Let others see when you're online or away in messages
                </p>
              </div>
              <Switch
                id="show-status"
                checked={localShowStatus}
                onCheckedChange={setLocalShowStatus}
              />
            </div>
            
            <div className="flex items-center justify-between border-t pt-4">
              <div className="space-y-0.5">
                <Label htmlFor="show-ai-assistant">Show AI Assistant</Label>
                <p className="text-sm text-muted-foreground">
                  Display the Huntorix AI navigation assistant button
                </p>
              </div>
              <Switch
                id="show-ai-assistant"
                checked={showAiAssistant}
                onCheckedChange={async (checked) => {
                  setShowAiAssistant(checked);
                  
                  // Immediately update database and hide/show AI assistant
                  if (user?.id) {
                    const { error } = await supabase
                      .from('profiles')
                      .update({ show_ai_assistant: checked })
                      .eq('id', user.id);
                    
                    if (error) {
                      toast({
                        title: "Error",
                        description: "Failed to update AI assistant preference",
                        variant: "destructive"
                      });
                      setShowAiAssistant(!checked); // Revert on error
                    } else {
                      // Invalidate query to trigger AI assistant to hide/show
                      queryClient.invalidateQueries({ queryKey: ['profile-ai-preference', user.id] });
                      toast({
                        title: checked ? "AI Assistant Enabled" : "AI Assistant Hidden",
                        description: checked 
                          ? "The AI assistant is now visible" 
                          : "The AI assistant has been hidden",
                      });
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="bg-gradient-to-r from-[hsl(var(--accent-pink))] via-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] hover:opacity-90 transition-opacity"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
