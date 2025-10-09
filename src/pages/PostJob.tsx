import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Sparkles, Upload, FileText, X, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { JobTitleAutocomplete } from '@/components/JobTitleAutocomplete';
import { ExclusiveJobPromotionModal } from '@/components/ExclusiveJobPromotionModal';
import { cn } from '@/lib/utils';

const jobTitles = [
  'Software Engineer', 'Backend Engineer', 'Frontend Engineer', 'Full-Stack Engineer',
  'DevOps Engineer', 'Data Scientist', 'Data Engineer', 'Product Manager',
  'QA Engineer', 'Mobile Developer', 'SRE', 'Algorithm Engineer',
  'Cybersecurity Engineer', 'Project Manager', 'Finance Manager', 'Sales Manager',
  'Marketing Manager', 'Customer Success Manager', 'HR BP', 'Office Manager',
  'Lab Tech', 'Research Scientist', 'Regulatory Affairs', 'Clinical PM',
  'Mechanical Engineer', 'Electrical Engineer', 'Civil Engineer', 'Other'
];

const industries = [
  'Software/Tech', 'Biotech/Healthcare', 'Finance/Fintech', 
  'Energy/Cleantech', 'AI / Data Science', 'Cybersecurity',
  'Semiconductors / Hardware', 'Telecom / Networking',
  'Public/Non-profit', 'Other'
];

const currencies = ['ILS', 'USD', 'EUR', 'GBP', 'INR'];

const formSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  custom_title: z.string().optional(),
  industry: z.string().min(1, 'Industry is required'),
  seniority: z.enum(['junior', 'mid_level', 'senior', 'lead_principal', 'manager_director', 'vp_c_level'], {
    required_error: 'Seniority is required'
  }),
  employment_type: z.enum(['full_time', 'contract', 'temp'], {
    required_error: 'Employment type is required'
  }),
  location_type: z.string().default('remote'),
  location: z.string().min(1, 'Work location is required'),
  budget_currency: z.string().default('ILS'),
  budget_min: z.string().optional(),
  budget_max: z.string().optional(),
  description: z.string().min(10, 'Description is required (min 10 characters)'),
}).refine((data) => {
  if (data.budget_min && data.budget_max) {
    return Number(data.budget_max) >= Number(data.budget_min);
  }
  return true;
}, {
  message: 'Maximum salary must be greater than or equal to minimum',
  path: ['budget_max']
});

export default function PostJob() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [skillsMust, setSkillsMust] = useState<string[]>([]);
  const [skillsNice, setSkillsNice] = useState<string[]>([]);
  const [skillMustInput, setSkillMustInput] = useState('');
  const [skillNiceInput, setSkillNiceInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [isParsing, setIsParsing] = useState(false);
  const [isExclusive, setIsExclusive] = useState(false);
  const [showExclusivePromotion, setShowExclusivePromotion] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<z.infer<typeof formSchema> | null>(null);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      custom_title: '',
      industry: '',
      seniority: undefined as any,
      employment_type: undefined as any,
      location_type: 'remote',
      location: '',
      budget_currency: 'ILS',
      budget_min: '',
      budget_max: '',
      description: ''
    }
  });

  const selectedTitle = watch('title');
  const locationType = watch('location_type');

  const addSkillMust = () => {
    if (skillMustInput.trim() && !skillsMust.includes(skillMustInput.trim())) {
      setSkillsMust([...skillsMust, skillMustInput.trim()]);
      setSkillMustInput('');
    }
  };

  const removeSkillMust = (skill: string) => {
    setSkillsMust(skillsMust.filter(s => s !== skill));
  };

  const addSkillNice = () => {
    if (skillNiceInput.trim() && !skillsNice.includes(skillNiceInput.trim())) {
      setSkillsNice([...skillsNice, skillNiceInput.trim()]);
      setSkillNiceInput('');
    }
  };

  const removeSkillNice = (skill: string) => {
    setSkillsNice(skillsNice.filter(s => s !== skill));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF, DOCX, or TXT file');
      return;
    }

    setIsParsing(true);

    try {
      let jobDescriptionText = '';

      if (file.type === 'text/plain') {
        jobDescriptionText = await file.text();
      } else {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            const base64Data = result.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const { data: parseData, error: parseError } = await supabase.functions.invoke('parse-document', {
          body: { 
            fileData: base64,
            fileName: file.name,
            mimeType: file.type
          }
        });

        if (parseError) throw parseError;
        jobDescriptionText = parseData.text;
      }

      const { data, error } = await supabase.functions.invoke('parse-job-description', {
        body: { jobDescription: jobDescriptionText }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      const jobInfo = data.jobInfo;

      if (jobInfo.title) {
        const normalized = jobInfo.title.trim();
        if (jobTitles.includes(normalized)) {
          setValue('title', normalized);
        } else {
          setValue('title', 'Other');
          setValue('custom_title', normalized);
        }
      }
      if (jobInfo.industry) setValue('industry', jobInfo.industry);
      if (jobInfo.seniority) setValue('seniority', jobInfo.seniority as any);
      if (jobInfo.employment_type) setValue('employment_type', jobInfo.employment_type);
      if (jobInfo.location_type) setValue('location_type', jobInfo.location_type);
      if (jobInfo.location) setValue('location', jobInfo.location);
      if (jobInfo.budget_currency) setValue('budget_currency', jobInfo.budget_currency);
      if (jobInfo.budget_min) setValue('budget_min', jobInfo.budget_min.toString());
      if (jobInfo.budget_max) setValue('budget_max', jobInfo.budget_max.toString());
      if (jobInfo.description) setValue('description', jobInfo.description);
      if (jobInfo.skills_must?.length > 0) setSkillsMust(jobInfo.skills_must);
      if (jobInfo.skills_nice?.length > 0) setSkillsNice(jobInfo.skills_nice);

      toast.success('Job description parsed successfully!');

    } catch (error) {
      console.error('Error parsing job description:', error);
      toast.error('Failed to parse job description. Please fill in manually.');
    } finally {
      setIsParsing(false);
      event.target.value = '';
    }
  };

  const canProceedToStep2 = watch('title') && watch('industry') && watch('seniority') && watch('employment_type') && watch('location');

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (skillsMust.length === 0) {
      toast.error('Please add at least one required skill');
      setStep(2);
      return;
    }

    if (!isExclusive && !isPublic) {
      setPendingSubmitData(data);
      setShowExclusivePromotion(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const finalTitle = data.title === 'Other' ? data.custom_title : data.title;

      const { data: job, error } = await supabase
        .from('jobs')
        .insert({
          title: finalTitle,
          industry: data.industry,
          seniority: data.seniority,
          employment_type: data.employment_type,
          location: data.location,
          budget_currency: data.budget_currency,
          budget_min: data.budget_min ? Number(data.budget_min) : null,
          budget_max: data.budget_max ? Number(data.budget_max) : null,
          description: data.description,
          skills_must: skillsMust,
          skills_nice: skillsNice,
          created_by: userId,
          visibility: isPublic ? 'public' : 'private',
          status: 'pending_review',
          is_exclusive: isExclusive
        } as any)
        .select()
        .single();

      if (error) throw error;

      toast.success('Job posted successfully! Pending admin approval.');
      navigate('/my-jobs');
    } catch (error) {
      console.error('Error posting job:', error);
      toast.error('Failed to post job. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with Progress */}
      <div className="border-b bg-card px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-semibold mb-3">Post a New Job</h1>
          <div className="flex items-center gap-2">
            <div className={cn("flex items-center gap-2 flex-1")}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {step > 1 ? <Check className="h-4 w-4" /> : "1"}
              </div>
              <span className="text-sm font-medium">Job Details</span>
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className={cn("flex items-center gap-2 flex-1")}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                2
              </div>
              <span className="text-sm font-medium">Description & Skills</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto space-y-6">
          {/* AI Quick Fill */}
          <Card className="p-3 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-medium text-sm">AI Quick Fill</h3>
            </div>
            <div className="flex gap-2">
              <Label htmlFor="file-upload" className="inline-flex items-center gap-2 px-3 py-2 rounded-md transition-all flex-1 justify-center h-9 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer text-xs font-medium">
                <Upload className="h-3 w-3" />
                Upload File
                <Input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileUpload}
                  disabled={isParsing}
                  className="hidden"
                />
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="inline-flex items-center gap-2 flex-1 h-9 text-xs"
                disabled={isParsing}
              >
                <FileText className="h-3 w-3" />
                Paste Text
              </Button>
            </div>
            {isParsing && (
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Parsing job description...
              </div>
            )}
          </Card>

          {/* Step 1: Job Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-xs font-medium">Job Title *</Label>
                  <JobTitleAutocomplete
                    value={selectedTitle || ''}
                    onChange={(value) => setValue('title', value)}
                  />
                  {selectedTitle === 'Other' && (
                    <Input
                      {...register('custom_title')}
                      placeholder="Enter custom job title"
                      className="mt-2 h-9 text-sm"
                    />
                  )}
                  {errors.title && <p className="text-xs text-destructive mt-1">{String(errors.title.message)}</p>}
                </div>

                <div>
                  <Label className="text-xs font-medium">Industry *</Label>
                  <Select onValueChange={(value) => setValue('industry', value)} value={watch('industry')}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((ind) => (
                        <SelectItem key={ind} value={ind} className="text-sm">{ind}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.industry && <p className="text-xs text-destructive mt-1">{String(errors.industry.message)}</p>}
                </div>

                <div>
                  <Label className="text-xs font-medium">Location Type *</Label>
                  <RadioGroup onValueChange={(value) => setValue('location_type', value)} value={locationType} className="flex gap-3 mt-2">
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="remote" id="remote" className="h-4 w-4" />
                      <Label htmlFor="remote" className="cursor-pointer text-sm">Remote</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="hybrid" id="hybrid" className="h-4 w-4" />
                      <Label htmlFor="hybrid" className="cursor-pointer text-sm">Hybrid</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="on_site" id="on_site" className="h-4 w-4" />
                      <Label htmlFor="on_site" className="cursor-pointer text-sm">On-Site</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="col-span-2">
                  <Label className="text-xs font-medium">Work Location *</Label>
                  <LocationAutocomplete
                    value={watch('location') || ''}
                    onChange={(value) => setValue('location', value)}
                  />
                  {errors.location && <p className="text-xs text-destructive mt-1">{String(errors.location.message)}</p>}
                </div>

                <div className="col-span-2">
                  <Label className="text-xs font-medium mb-2 block">Seniority *</Label>
                  <RadioGroup onValueChange={(value) => setValue('seniority', value as any)} value={watch('seniority')} className="grid grid-cols-3 gap-2">
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="junior" id="junior" className="h-4 w-4" />
                      <Label htmlFor="junior" className="cursor-pointer text-sm">Junior</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="mid_level" id="mid_level" className="h-4 w-4" />
                      <Label htmlFor="mid_level" className="cursor-pointer text-sm">Mid-Level</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="senior" id="senior" className="h-4 w-4" />
                      <Label htmlFor="senior" className="cursor-pointer text-sm">Senior</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="lead_principal" id="lead_principal" className="h-4 w-4" />
                      <Label htmlFor="lead_principal" className="cursor-pointer text-sm">Lead/Principal</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="manager_director" id="manager_director" className="h-4 w-4" />
                      <Label htmlFor="manager_director" className="cursor-pointer text-sm">Manager/Director</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="vp_c_level" id="vp_c_level" className="h-4 w-4" />
                      <Label htmlFor="vp_c_level" className="cursor-pointer text-sm">VP/C-Level</Label>
                    </div>
                  </RadioGroup>
                  {errors.seniority && <p className="text-xs text-destructive mt-1">{String(errors.seniority.message)}</p>}
                </div>

                <div className="col-span-2">
                  <Label className="text-xs font-medium mb-2 block">Employment Type *</Label>
                  <RadioGroup onValueChange={(value) => setValue('employment_type', value as any)} value={watch('employment_type')} className="flex gap-4">
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="full_time" id="full_time" className="h-4 w-4" />
                      <Label htmlFor="full_time" className="cursor-pointer text-sm">Full-Time</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="contract" id="contract" className="h-4 w-4" />
                      <Label htmlFor="contract" className="cursor-pointer text-sm">Contract</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="temp" id="temp" className="h-4 w-4" />
                      <Label htmlFor="temp" className="cursor-pointer text-sm">Temporary</Label>
                    </div>
                  </RadioGroup>
                  {errors.employment_type && <p className="text-xs text-destructive mt-1">{String(errors.employment_type.message)}</p>}
                </div>

                <div className="col-span-2">
                  <Label className="text-xs font-medium">Salary Range (Optional)</Label>
                  <div className="grid grid-cols-7 gap-2 mt-2">
                    <div className="col-span-2">
                      <Select onValueChange={(value) => setValue('budget_currency', value)} value={watch('budget_currency')}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((curr) => (
                            <SelectItem key={curr} value={curr} className="text-sm">{curr}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      {...register('budget_min')}
                      type="number"
                      placeholder="Min"
                      className="h-9 text-sm col-span-2"
                    />
                    <span className="flex items-center justify-center text-sm text-muted-foreground">to</span>
                    <Input
                      {...register('budget_max')}
                      type="number"
                      placeholder="Max"
                      className="h-9 text-sm col-span-2"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Description & Skills */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium">Job Description *</Label>
                <Textarea
                  {...register('description')}
                  placeholder="Describe the role, responsibilities, and requirements..."
                  className="min-h-[120px] text-sm mt-2"
                />
                {errors.description && <p className="text-xs text-destructive mt-1">{String(errors.description.message)}</p>}
              </div>

              <div>
                <Label className="text-xs font-medium">Required Skills *</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={skillMustInput}
                    onChange={(e) => setSkillMustInput(e.target.value)}
                    placeholder="e.g., React, Python"
                    className="h-9 text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkillMust())}
                  />
                  <Button type="button" onClick={addSkillMust} size="sm" className="h-9">Add</Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {skillsMust.map((skill) => (
                    <Badge key={skill} variant="secondary" className="gap-1 text-xs px-2 py-0.5">
                      {skill}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkillMust(skill)} />
                    </Badge>
                  ))}
                </div>
                {skillsMust.length === 0 && <p className="text-xs text-muted-foreground mt-1">At least one skill required</p>}
              </div>

              <div>
                <Label className="text-xs font-medium">Nice-to-Have Skills</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={skillNiceInput}
                    onChange={(e) => setSkillNiceInput(e.target.value)}
                    placeholder="e.g., Docker, AWS"
                    className="h-9 text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkillNice())}
                  />
                  <Button type="button" onClick={addSkillNice} size="sm" className="h-9">Add</Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {skillsNice.map((skill) => (
                    <Badge key={skill} variant="outline" className="gap-1 text-xs px-2 py-0.5">
                      {skill}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkillNice(skill)} />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_public"
                    checked={isPublic}
                    onCheckedChange={(checked) => setIsPublic(!!checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="is_public" className="cursor-pointer text-sm">
                    Make this job public
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_exclusive"
                    checked={isExclusive}
                    onCheckedChange={(checked) => setIsExclusive(!!checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="is_exclusive" className="cursor-pointer text-sm">
                    Exclusive job (premium feature)
                  </Label>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Footer Actions */}
      <div className="border-t bg-card px-6 py-3">
        <div className="max-w-4xl mx-auto flex justify-between gap-3">
          {step === 1 ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/my-jobs')}
                className="h-9"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => setStep(2)}
                disabled={!canProceedToStep2}
                className="h-9"
              >
                Next Step
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="h-9"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                onClick={handleSubmit(onSubmit)}
                className="h-9"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Post Job
              </Button>
            </>
          )}
        </div>
      </div>

      <ExclusiveJobPromotionModal
        open={showExclusivePromotion}
        onActivate={() => {
          setIsExclusive(true);
          setShowExclusivePromotion(false);
          if (pendingSubmitData) {
            handleSubmit(onSubmit)();
          }
        }}
        onNotNow={() => {
          setShowExclusivePromotion(false);
          setPendingSubmitData(null);
        }}
        onDontShowAgain={() => {
          setShowExclusivePromotion(false);
          setPendingSubmitData(null);
          localStorage.setItem('hideExclusivePromotion', 'true');
        }}
      />
    </div>
  );
}
