import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, Loader2, ChevronDown, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { JobTitleAutocomplete } from '@/components/JobTitleAutocomplete';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RichJobDescriptionEditor } from '@/components/RichJobDescriptionEditor';

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
  status: z.enum(['open', 'closed', 'on_hold']).default('open'),
}).refine((data) => {
  if (data.budget_min && data.budget_max) {
    return Number(data.budget_max) >= Number(data.budget_min);
  }
  return true;
}, {
  message: 'Maximum salary must be greater than or equal to minimum',
  path: ['budget_max']
});

interface EditJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: any;
  onSuccess: () => void;
}

export function EditJobModal({ open, onOpenChange, job, onSuccess }: EditJobModalProps) {
  const [skillsMust, setSkillsMust] = useState<string[]>([]);
  const [skillsNice, setSkillsNice] = useState<string[]>([]);
  const [skillMustInput, setSkillMustInput] = useState('');
  const [skillNiceInput, setSkillNiceInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [isExclusive, setIsExclusive] = useState(false);
  const [showExclusiveInfo, setShowExclusiveInfo] = useState(false);
  const [compensationOpen, setCompensationOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      custom_title: '',
      industry: '',
      seniority: 'mid_level' as const,
      employment_type: 'full_time' as const,
      location_type: 'remote',
      location: '',
      budget_currency: 'ILS',
      budget_min: '',
      budget_max: '',
      description: '',
      status: 'open' as const,
    }
  });

  const selectedTitle = watch('title');
  const locationType = watch('location_type');
  const jobStatus = watch('status');
  const industry = watch('industry');
  const seniorityVal = watch('seniority');
  const employmentTypeVal = watch('employment_type');
  const location = watch('location');
  const description = watch('description');

  const isFormValid = Boolean(
    (selectedTitle === 'Other' ? watch('custom_title')?.trim() : selectedTitle) &&
    industry &&
    seniorityVal &&
    employmentTypeVal &&
    location?.trim() &&
    description?.trim() &&
    description?.length >= 10 &&
    skillsMust.length > 0
  );

  // Initialize form with job data
  useEffect(() => {
    if (job && open) {
      const isCustomTitle = !jobTitles.includes(job.title);
      const titleValue = isCustomTitle ? 'Other' : job.title;
      
      reset({
        title: titleValue,
        custom_title: isCustomTitle ? job.title : '',
        industry: job.industry || '',
        seniority: job.seniority || 'mid_level',
        employment_type: job.employment_type || 'full_time',
        location_type: job.location ? (job.location.toLowerCase().includes('remote') ? 'remote' : 'on_site') : 'remote',
        location: job.location || '',
        budget_currency: job.budget_currency || 'ILS',
        budget_min: job.budget_min?.toString() || '',
        budget_max: job.budget_max?.toString() || '',
        description: job.description || '',
        status: job.status || 'open',
      });
      
      setSkillsMust(job.skills_must || []);
      setSkillsNice(job.skills_nice || []);
      setIsPublic(job.visibility === 'public');
      setIsExclusive(job.is_exclusive || false);
    }
  }, [job, open, reset]);

  const clearFieldError = (fieldName: string) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const addSkillMust = () => {
    if (skillMustInput.trim() && !skillsMust.includes(skillMustInput.trim())) {
      setSkillsMust([...skillsMust, skillMustInput.trim()]);
      setSkillMustInput('');
      clearFieldError('skills_must');
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

  const handleClear = () => {
    reset();
    setSkillsMust([]);
    setSkillsNice([]);
    setSkillMustInput('');
    setSkillNiceInput('');
    setIsPublic(true);
    setIsExclusive(false);
    setFieldErrors({});
    toast.success('Form cleared');
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (skillsMust.length === 0) {
      setFieldErrors({ skills_must: 'At least one required skill must be added' });
      setSkillsOpen(true);
      toast.error('Please add at least one must-have skill');
      return;
    }

    // Prevent unmarking exclusive before allowed date
    if (job?.is_exclusive && !isExclusive) {
      const exclusiveUntilRaw = (job as any).exclusive_until;
      if (exclusiveUntilRaw) {
        const exclusiveUntil = new Date(exclusiveUntilRaw);
        const now = new Date();
        if (now < exclusiveUntil) {
          const formattedDate = exclusiveUntil.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
          toast.error(`Cannot unmark exclusive until ${formattedDate}.`);
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      const finalTitle = data.title === 'Other' ? data.custom_title : data.title;
      
      // Track changes
      const changes: Array<{field: string; old_value: any; new_value: any}> = [];
      
      const newData = {
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
        visibility: isPublic ? 'public' : 'private',
        status: data.status,
        is_exclusive: isExclusive,
      };

      // Compare and track changes
      Object.entries(newData).forEach(([key, newValue]) => {
        const oldValue = job[key];
        
        // Special handling for arrays
        if (Array.isArray(oldValue) && Array.isArray(newValue)) {
          if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changes.push({ field: key, old_value: oldValue, new_value: newValue });
          }
        } else if (oldValue !== newValue) {
          changes.push({ field: key, old_value: oldValue, new_value: newValue });
        }
      });

      // Only proceed if there are changes
      if (changes.length === 0) {
        toast.info('No changes detected');
        onOpenChange(false);
        return;
      }

      // Update the job
      const { error } = await supabase
        .from('jobs')
        .update(newData)
        .eq('id', job.id);

      if (error) throw error;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Save edit history
        const { error: historyError } = await supabase
          .from('job_edit_history')
          .insert({
            job_id: job.id,
            edited_by: user.id,
            changes: changes,
          });

        if (historyError) {
          console.error('Error saving edit history:', historyError);
        }
      }

      toast.success('Job updated successfully');
      onOpenChange(false);
      onSuccess();

    } catch (error: any) {
      console.error('Error updating job:', error);
      const msg = error?.message || 'Failed to update job';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0" hideCloseButton>
        <div className="overflow-y-auto flex-1 px-6 pt-6">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-start items-stretch justify-between gap-3 sm:gap-4">
              <div className="flex-1">
                <DialogTitle className="text-xl sm:text-2xl">Edit Job</DialogTitle>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClear} 
                size="sm"
                className="h-9 text-xs border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 dark:border-destructive/50 dark:text-destructive dark:hover:bg-destructive/20 w-full sm:w-auto sm:flex-shrink-0"
              >
                Clear Form
              </Button>
            </div>
          </DialogHeader>

          <form id="edit-job-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5 pb-6 mt-6">
            {/* Exclusive Toggle */}
            <div className="relative flex items-center gap-3 p-3 rounded-lg border bg-gradient-to-r from-purple-50/50 via-blue-50/50 to-cyan-50/50 dark:from-purple-950/20 dark:via-blue-950/20 dark:to-cyan-950/20">
              <button
                type="button"
                onClick={() => {
                  if (isExclusive && job.exclusive_until) {
                    const exclusiveUntil = new Date(job.exclusive_until);
                    const now = new Date();
                    if (now < exclusiveUntil) {
                      const formattedDate = exclusiveUntil.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      });
                      toast.error(`Cannot unmark exclusive status until ${formattedDate}. This job must remain exclusive for the 14-day minimum commitment period.`);
                      return;
                    }
                  }
                  setIsExclusive(!isExclusive);
                }}
                className="relative w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 group flex-shrink-0"
              >
                {isExclusive ? (
                  <>
                    <div 
                      className="absolute inset-0 rounded-full opacity-100 group-hover:opacity-100 transition-opacity"
                      style={{
                        background: 'conic-gradient(from 0deg, #06b6d4, #8b5cf6, #ec4899, #06b6d4)',
                        animation: 'spin 10s linear infinite'
                      }}
                    />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 opacity-0 group-active:opacity-60 group-active:scale-150 transition-all duration-200" />
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 rounded-full border-2 border-muted-foreground/30 group-hover:border-muted-foreground/50 transition-colors opacity-100 group-disabled:opacity-40" />
                    <div className="absolute inset-[2px] rounded-full bg-background" />
                  </>
                )}
              </button>
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowExclusiveInfo(!showExclusiveInfo);
                    }}
                    className={`text-sm font-medium underline decoration-dotted underline-offset-2 transition-all duration-300 hover:decoration-solid ${
                      isExclusive 
                        ? 'bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent font-semibold' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Exclusive on Huntorix
                  </button>
                  <Badge className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 text-white text-[10px] px-1.5 py-0 h-4 border-0 leading-none">
                    Premium
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground/90">
                  14-day minimum commitment once published
                </span>
              </div>
              {showExclusiveInfo && (
                <div className="absolute left-0 top-full mt-2 p-2.5 bg-popover border rounded-lg shadow-lg text-xs text-popover-foreground z-[100] max-w-xs">
                  <p>Mark this job as exclusive to HuntoriX. Exclusive jobs get priority placement and are only available through our platform.</p>
                  <button 
                    onClick={() => setShowExclusiveInfo(false)}
                    className="mt-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

            {/* Basics */}
            <Card className="p-6 bg-gradient-to-br from-muted/40 to-muted/20 border-2 shadow-sm">
              <h3 className="font-semibold text-base mb-5">Job Basics</h3>
              
              <div className="space-y-4">
                <div className="space-y-2.5" data-field="title">
                  <Label htmlFor="title" className="text-sm font-medium">Job Title <span className="text-destructive">*</span></Label>
                  <JobTitleAutocomplete
                    value={selectedTitle}
                    onChange={(value) => {
                      setValue('title', value);
                      clearFieldError('title');
                    }}
                    placeholder="Search job title..."
                    className={cn(fieldErrors.title && 'border-destructive ring-2 ring-destructive/20')}
                  />
                  {fieldErrors.title && <p className="text-sm text-destructive">{fieldErrors.title}</p>}
                </div>

                {selectedTitle === 'Other' && (
                  <div className="space-y-2.5">
                    <Label className="text-sm font-medium">Custom Title</Label>
                    <Input {...register('custom_title')} placeholder="Enter custom job title" className="h-11" />
                  </div>
                )}

                <div className="space-y-2.5" data-field="industry">
                  <Label htmlFor="industry" className="text-sm font-medium">Industry <span className="text-destructive">*</span></Label>
                  <Select 
                    onValueChange={(value) => {
                      setValue('industry', value);
                      clearFieldError('industry');
                    }} 
                    value={industry || ''}
                  >
                    <SelectTrigger className={cn("h-11", fieldErrors.industry && 'border-destructive ring-2 ring-destructive/20')}>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map(ind => (
                        <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.industry && <p className="text-sm text-destructive">{fieldErrors.industry}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2.5" data-field="seniority">
                    <Label htmlFor="seniority" className="text-sm font-medium">Seniority Level <span className="text-destructive">*</span></Label>
                    <Select 
                      onValueChange={(value) => {
                        setValue('seniority', value as any);
                        clearFieldError('seniority');
                      }} 
                      value={seniorityVal || ''}
                    >
                      <SelectTrigger className={cn("h-11", fieldErrors.seniority && 'border-destructive ring-2 ring-destructive/20')}>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="junior">Junior</SelectItem>
                        <SelectItem value="mid_level">Mid-Level</SelectItem>
                        <SelectItem value="senior">Senior</SelectItem>
                        <SelectItem value="lead_principal">Lead / Principal</SelectItem>
                        <SelectItem value="manager_director">Manager / Director</SelectItem>
                        <SelectItem value="vp_c_level">VP / C-Level</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldErrors.seniority && <p className="text-sm text-destructive">{fieldErrors.seniority}</p>}
                  </div>

                  <div className="space-y-2.5" data-field="employment_type">
                    <Label htmlFor="employment_type" className="text-sm font-medium">Employment Type <span className="text-destructive">*</span></Label>
                    <Select 
                      onValueChange={(value) => {
                        setValue('employment_type', value as any);
                        clearFieldError('employment_type');
                      }} 
                      value={employmentTypeVal || ''}
                    >
                      <SelectTrigger className={cn("h-11", fieldErrors.employment_type && 'border-destructive ring-2 ring-destructive/20')}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">Full-Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="temp">Temporary</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldErrors.employment_type && <p className="text-sm text-destructive">{fieldErrors.employment_type}</p>}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label className="text-sm font-medium">Work Location</Label>
                  <RadioGroup
                    value={locationType || 'remote'}
                    onValueChange={(value) => setValue('location_type', value)}
                    className="grid grid-cols-3 gap-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="on_site" id="on_site" />
                      <Label htmlFor="on_site" className="text-sm cursor-pointer font-normal">On-site</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="hybrid" id="hybrid" />
                      <Label htmlFor="hybrid" className="text-sm cursor-pointer font-normal">Hybrid</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="remote" id="remote" />
                      <Label htmlFor="remote" className="text-sm cursor-pointer font-normal">Remote</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2.5" data-field="location">
                  <Label htmlFor="location" className="text-sm font-medium">Work Location <span className="text-destructive">*</span></Label>
                  <LocationAutocomplete
                    value={watch('location') || ''}
                    onChange={(value) => {
                      setValue('location', value);
                      clearFieldError('location');
                    }}
                    placeholder="Search city or country..."
                    className={cn(fieldErrors.location && 'border-destructive ring-2 ring-destructive/20')}
                  />
                  {fieldErrors.location && <p className="text-sm text-destructive">{fieldErrors.location}</p>}
                  <p className="text-xs text-muted-foreground">
                    Select a city (e.g., "Tel Aviv, Israel") or country (e.g., "Israel")
                  </p>
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="status" className="text-sm font-medium">Job Status</Label>
                  <Select onValueChange={(value) => setValue('status', value as any)} value={jobStatus}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Compensation */}
            <Collapsible open={compensationOpen} onOpenChange={setCompensationOpen}>
              <Card className="p-5 bg-gradient-to-br from-muted/40 to-muted/20 border-2 shadow-sm">
                <CollapsibleTrigger className="w-full flex items-center justify-between group">
                  <h3 className="font-semibold text-base">Compensation Range</h3>
                  <ChevronDown className={cn(
                    "h-5 w-5 transition-transform duration-200 text-muted-foreground group-hover:text-foreground",
                    compensationOpen && "transform rotate-180"
                  )} />
                </CollapsibleTrigger>
                
                <CollapsibleContent className="pt-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="budget_currency" className="text-sm font-medium">Currency</Label>
                      <Select onValueChange={(value) => setValue('budget_currency', value)} value={watch('budget_currency')}>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map(curr => (
                            <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="budget_min" className="text-sm font-medium">Minimum (Monthly)</Label>
                        <Input 
                          type="number" 
                          {...register('budget_min')} 
                          placeholder="e.g., 20000" 
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="budget_max" className="text-sm font-medium">Maximum (Monthly)</Label>
                        <Input 
                          type="number" 
                          {...register('budget_max')} 
                          placeholder="e.g., 30000" 
                          className="h-10"
                        />
                        {errors.budget_max && <p className="text-sm text-destructive">{errors.budget_max.message}</p>}
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Description */}
            <Card className="p-6 bg-gradient-to-br from-muted/40 to-muted/20 border-2 shadow-sm">
              <h3 className="font-semibold text-base mb-5">Job Description</h3>
              
              <div className="space-y-2.5" data-field="description">
                <Label htmlFor="description" className="text-sm font-medium">Role Overview <span className="text-destructive">*</span></Label>
                <RichJobDescriptionEditor
                  value={watch('description') || ''}
                  onChange={(value) => {
                    setValue('description', value);
                    clearFieldError('description');
                  }}
                  error={!!fieldErrors.description}
                />
                {fieldErrors.description && <p className="text-sm text-destructive">{fieldErrors.description}</p>}
              </div>
            </Card>

            {/* Skills */}
            <Collapsible open={skillsOpen} onOpenChange={setSkillsOpen}>
              <Card className="p-6 bg-gradient-to-br from-muted/40 to-muted/20 border-2 shadow-sm" id="skills-must" data-field="skills_must">
                <CollapsibleTrigger className="w-full flex items-center justify-between group">
                  <h3 className="font-semibold text-base">Required Skills</h3>
                  <ChevronDown className={cn(
                    "h-5 w-5 transition-transform duration-200 text-muted-foreground group-hover:text-foreground",
                    skillsOpen && "transform rotate-180"
                  )} />
                </CollapsibleTrigger>
                
                <CollapsibleContent className="pt-5">
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Must-Have Skills <span className="text-destructive">*</span></Label>
                      <div className="flex gap-2">
                        <Input 
                          value={skillMustInput}
                          onChange={(e) => setSkillMustInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkillMust())}
                          placeholder="Type a skill and press Enter"
                          className="h-11"
                        />
                        <Button 
                          type="button" 
                          onClick={addSkillMust} 
                          variant="secondary" 
                          size="lg" 
                          className="h-11 px-6"
                        >
                          Add
                        </Button>
                      </div>
                      <div className={cn(
                        "flex flex-wrap gap-2 min-h-[60px] p-3 rounded-lg border-2",
                        fieldErrors.skills_must && 'border-destructive ring-2 ring-destructive/20'
                      )}>
                        {skillsMust.map(skill => (
                          <Badge key={skill} variant="secondary" className="gap-1.5 text-sm h-8 px-3">
                            {skill}
                            <X className="h-3.5 w-3.5 cursor-pointer hover:text-destructive" onClick={() => removeSkillMust(skill)} />
                          </Badge>
                        ))}
                        {skillsMust.length === 0 && (
                          <span className="text-sm text-muted-foreground">Add at least one required skill</span>
                        )}
                      </div>
                      {fieldErrors.skills_must && <p className="text-sm text-destructive">{fieldErrors.skills_must}</p>}
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Nice-to-Have Skills</Label>
                      <div className="flex gap-2">
                        <Input 
                          value={skillNiceInput}
                          onChange={(e) => setSkillNiceInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkillNice())}
                          placeholder="Type a skill and press Enter"
                          className="h-11"
                        />
                        <Button type="button" onClick={addSkillNice} variant="secondary" size="lg" className="h-11 px-6">
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 min-h-[60px] p-3 rounded-lg border-2">
                        {skillsNice.map(skill => (
                          <Badge key={skill} variant="outline" className="gap-1.5 text-sm h-8 px-3">
                            {skill}
                            <X className="h-3.5 w-3.5 cursor-pointer hover:text-destructive" onClick={() => removeSkillNice(skill)} />
                          </Badge>
                        ))}
                        {skillsNice.length === 0 && (
                          <span className="text-sm text-muted-foreground">Optional skills that would be beneficial</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Visibility */}
            <Card className="p-5 bg-gradient-to-br from-muted/50 to-muted/30 border-2 shadow-sm">
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="visibility" 
                  checked={isPublic}
                  onCheckedChange={(checked) => setIsPublic(checked as boolean)}
                  className="h-5 w-5"
                />
                <div>
                  <Label 
                    htmlFor="visibility"
                    className="text-sm font-semibold cursor-pointer block"
                  >
                    Make Job Public
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isPublic ? "Visible to all candidates" : "Only visible to invited candidates"}
                  </p>
                </div>
              </div>
            </Card>
          </form>
        </div>

        {/* Sticky Footer */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 dark:from-slate-900 dark:to-blue-950/20 border-t border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center items-stretch justify-between gap-3 sm:gap-4 flex-shrink-0">
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-700 dark:text-blue-300 flex-shrink-0" />
            <p className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100">
              Changes will be saved immediately
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              size="default"
              className="h-10 px-4 sm:px-6 flex-1 sm:flex-initial border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              form="edit-job-form"
              variant={isFormValid ? "hero" : "default"}
              size="default"
              disabled={isSubmitting}
              className={cn(
                "h-10 px-4 sm:px-6 flex-1 sm:flex-initial transition-all duration-300 font-semibold",
                isFormValid && 'shadow-md shadow-primary/20',
                !isFormValid && 'opacity-50'
              )}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
