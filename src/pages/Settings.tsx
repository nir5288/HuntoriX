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
      primary: "220 100% 11%",
      accentPink: "337 90% 91%",
      accentMint: "150 90% 88%",
      accentLilac: "252 100% 95%",
    },
  },
  {
    id: "klarna",
    name: "Klarna Pink",
    colors: {
      primary: "340 82% 52%",
      accentPink: "340 82% 52%",
      accentMint: "160 60% 65%",
      accentLilac: "260 60% 75%",
    },
  },
  {
    id: "ocean",
    name: "Ocean Blue",
    colors: {
      primary: "210 100% 50%",
      accentPink: "190 85% 55%",
      accentMint: "175 65% 60%",
      accentLilac: "220 70% 65%",
    },
  },
  {
    id: "sunset",
    name: "Sunset Orange",
    colors: {
      primary: "25 95% 53%",
      accentPink: "15 90% 60%",
      accentMint: "40 80% 60%",
      accentLilac: "35 85% 65%",
    },
  },
  {
    id: "forest",
    name: "Forest Green",
    colors: {
      primary: "140 65% 42%",
      accentPink: "160 60% 50%",
      accentMint: "155 70% 55%",
      accentLilac: "145 65% 60%",
    },
  },
  {
    id: "royal",
    name: "Royal Purple",
    colors: {
      primary: "270 70% 55%",
      accentPink: "290 75% 60%",
      accentMint: "250 65% 65%",
      accentLilac: "280 70% 70%",
    },
  },
  {
    id: "cherry",
    name: "Cherry Red",
    colors: {
      primary: "355 85% 50%",
      accentPink: "350 90% 55%",
      accentMint: "10 80% 60%",
      accentLilac: "340 75% 65%",
    },
  },
  {
    id: "sunshine",
    name: "Sunshine Yellow",
    colors: {
      primary: "45 100% 51%",
      accentPink: "50 95% 60%",
      accentMint: "55 90% 65%",
      accentLilac: "40 85% 60%",
    },
  },
  {
    id: "lavender",
    name: "Lavender Dream",
    colors: {
      primary: "280 60% 65%",
      accentPink: "300 65% 70%",
      accentMint: "270 55% 70%",
      accentLilac: "290 60% 75%",
    },
  },
  {
    id: "mint",
    name: "Fresh Mint",
    colors: {
      primary: "165 60% 55%",
      accentPink: "175 65% 60%",
      accentMint: "170 70% 65%",
      accentLilac: "160 60% 70%",
    },
  },
  {
    id: "midnight",
    name: "Midnight Blue",
    colors: {
      primary: "230 70% 45%",
      accentPink: "240 65% 50%",
      accentMint: "220 60% 55%",
      accentLilac: "235 65% 60%",
    },
  },
  {
    id: "champagne",
    name: "Champagne Gold",
    colors: {
      primary: "45 65% 75%",
      accentPink: "35 55% 85%",
      accentMint: "50 60% 88%",
      accentLilac: "40 50% 82%",
    },
  },
  {
    id: "silver",
    name: "Silver Mist",
    colors: {
      primary: "200 100% 70%",
      accentPink: "210 100% 82%",
      accentMint: "190 100% 85%",
      accentLilac: "205 100% 88%",
    },
  },
  {
    id: "rosegold",
    name: "Rose Gold",
    colors: {
      primary: "15 100% 75%",
      accentPink: "350 100% 85%",
      accentMint: "25 100% 82%",
      accentLilac: "10 100% 88%",
    },
  },
  {
    id: "pearl",
    name: "Pearl White",
    colors: {
      primary: "30 18% 88%",
      accentPink: "340 15% 92%",
      accentMint: "160 12% 90%",
      accentLilac: "260 14% 93%",
    },
  },
  {
    id: "platinum",
    name: "Platinum",
    colors: {
      primary: "210 25% 78%",
      accentPink: "195 22% 85%",
      accentMint: "180 20% 87%",
      accentLilac: "220 23% 89%",
    },
  },
  {
    id: "ivory",
    name: "Ivory Silk",
    colors: {
      primary: "40 35% 85%",
      accentPink: "30 28% 88%",
      accentMint: "50 32% 90%",
      accentLilac: "35 30% 92%",
    },
  },
  {
    id: "crystal",
    name: "Crystal Blue",
    colors: {
      primary: "195 45% 80%",
      accentPink: "185 38% 85%",
      accentMint: "175 40% 87%",
      accentLilac: "205 42% 89%",
    },
  },
  {
    id: "blush",
    name: "Blush Elegance",
    colors: {
      primary: "350 40% 82%",
      accentPink: "340 35% 88%",
      accentMint: "20 30% 85%",
      accentLilac: "330 33% 90%",
    },
  },
  {
    id: "sage",
    name: "Sage Luxury",
    colors: {
      primary: "155 30% 75%",
      accentPink: "145 25% 82%",
      accentMint: "165 28% 85%",
      accentLilac: "150 26% 88%",
    },
  },
  {
    id: "frost",
    name: "Lavender Frost",
    colors: {
      primary: "270 35% 82%",
      accentPink: "280 30% 87%",
      accentMint: "260 28% 85%",
      accentLilac: "275 32% 90%",
    },
  },
];

const Settings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { showStatus, setShowStatus } = useUserPreferences();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localShowStatus, setLocalShowStatus] = useState(showStatus);
  const [selectedPalette, setSelectedPalette] = useState<string>(() => {
    return localStorage.getItem("color-palette") || "default";
  });

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
  const [languages, setLanguages] = useState<string[]>([]);
  const [languageInput, setLanguageInput] = useState("");
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
    }
  }, [user, profile]);

  useEffect(() => {
    setLocalShowStatus(showStatus);
  }, [showStatus]);

  const loadProfileData = () => {
    if (!profile) return;

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
      setLanguages(profile.languages || []);
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
        updates.languages = languages;
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

  const addLanguage = () => {
    if (languageInput.trim() && !languages.includes(languageInput.trim())) {
      setLanguages([...languages, languageInput.trim()]);
      setLanguageInput("");
    }
  };

  const removeLanguage = (language: string) => {
    setLanguages(languages.filter((l) => l !== language));
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
                <div className="flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addSkill()}
                    placeholder="Enter skill and press Enter"
                  />
                  <Button type="button" onClick={addSkill}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="gap-1">
                      {skill}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeSkill(skill)}
                      />
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-[hsl(var(--accent-mint))]/20 bg-gradient-to-br from-background to-[hsl(var(--surface))]">
              <CardHeader>
                <CardTitle className="text-2xl bg-gradient-to-r from-[hsl(var(--accent-pink))] via-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] bg-clip-text text-transparent">Languages</CardTitle>
                <CardDescription>Languages you speak</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={languageInput}
                    onChange={(e) => setLanguageInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addLanguage()}
                    placeholder="Enter language and press Enter"
                  />
                  <Button type="button" onClick={addLanguage}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {languages.map((language) => (
                    <Badge key={language} variant="secondary" className="gap-1">
                      {language}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeLanguage(language)}
                      />
                    </Badge>
                  ))}
                </div>
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
