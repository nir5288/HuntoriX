import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

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
  'Energy/Cleantech', 'Public/Non-profit'
];

const locations = [
  'Tel Aviv', 'Jerusalem', 'Haifa', 'Herzliya', 'Ramat Gan', 'Be\'er Sheva',
  'London', 'Berlin', 'New York', 'San Francisco', 'Bangalore'
];

const currencies = ['ILS', 'USD', 'EUR', 'GBP', 'INR'];

const formSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  custom_title: z.string().optional(),
  industry: z.string().min(1, 'Industry is required'),
  seniority: z.enum(['junior', 'mid', 'senior', 'lead', 'exec'], {
    required_error: 'Seniority is required'
  }),
  employment_type: z.enum(['full_time', 'contract', 'temp'], {
    required_error: 'Employment type is required'
  }),
  location_type: z.string().default('remote'),
  location: z.string().optional(),
  budget_currency: z.string().default('ILS'),
  budget_min: z.string().optional(),
  budget_max: z.string().optional(),
  description: z.string().min(10, 'Description is required (min 10 characters)'),
  status: z.enum(['open', 'closed', 'on_hold']).default('open'),
}).refine((data) => {
  if (data.location_type !== 'remote' && !data.location) {
    return false;
  }
  return true;
}, {
  message: 'Location is required for on-site or hybrid positions',
  path: ['location']
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

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isValid } } = useForm({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      custom_title: '',
      industry: '',
      seniority: 'mid' as const,
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

  // Initialize form with job data
  useEffect(() => {
    if (job && open) {
      const isCustomTitle = !jobTitles.includes(job.title);
      const titleValue = isCustomTitle ? 'Other' : job.title;
      
      reset({
        title: titleValue,
        custom_title: isCustomTitle ? job.title : '',
        industry: job.industry || '',
        seniority: job.seniority || 'mid',
        employment_type: job.employment_type || 'full_time',
        location_type: job.location ? 'onsite' : 'remote',
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

  const isFormValid = isValid && skillsMust.length > 0;

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

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (skillsMust.length === 0) {
      toast.error('Please add at least one must-have skill');
      return;
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
        location: data.location_type === 'remote' ? '' : data.location,
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

    } catch (error) {
      console.error('Error updating job:', error);
      toast.error('Failed to update job');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Job</DialogTitle>
          <DialogDescription>Update job details</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* A. Basics */}
          <div className="space-y-4">
            <h3 className="font-semibold">Basics</h3>
            
            <div className="space-y-2">
              <Label htmlFor="title">Job Title <span className="text-destructive">• Required</span></Label>
              <Select onValueChange={(value) => setValue('title', value)} value={selectedTitle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job title" />
                </SelectTrigger>
                <SelectContent>
                  {jobTitles.map(title => (
                    <SelectItem key={title} value={title}>{title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            {selectedTitle === 'Other' && (
              <div className="space-y-2">
                <Label htmlFor="custom_title">Custom Job Title</Label>
                <Input {...register('custom_title')} placeholder="Enter job title" />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="industry">Industry <span className="text-destructive">• Required</span></Label>
              <Select onValueChange={(value) => setValue('industry', value)} value={watch('industry')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map(ind => (
                    <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.industry && <p className="text-sm text-destructive">{errors.industry.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seniority">Seniority <span className="text-destructive">• Required</span></Label>
                <Select onValueChange={(value) => setValue('seniority', value as any)} value={watch('seniority')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="junior">Junior</SelectItem>
                    <SelectItem value="mid">Mid</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="exec">Executive</SelectItem>
                  </SelectContent>
                </Select>
                {errors.seniority && <p className="text-sm text-destructive">{errors.seniority.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="employment_type">Employment Type <span className="text-destructive">• Required</span></Label>
                <Select onValueChange={(value) => setValue('employment_type', value as any)} value={watch('employment_type')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="temp">Temporary</SelectItem>
                  </SelectContent>
                </Select>
                {errors.employment_type && <p className="text-sm text-destructive">{errors.employment_type.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Job Status</Label>
              <Select onValueChange={(value) => setValue('status', value as any)} value={jobStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* B. Location */}
          <div className="space-y-4">
            <h3 className="font-semibold">Location & Work Model</h3>
            
            <RadioGroup value={locationType} onValueChange={(value) => setValue('location_type', value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="remote" id="remote" />
                <Label htmlFor="remote">Fully Remote</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hybrid" id="hybrid" />
                <Label htmlFor="hybrid">Hybrid</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="onsite" id="onsite" />
                <Label htmlFor="onsite">On-site</Label>
              </div>
            </RadioGroup>

            {locationType !== 'remote' && (
              <div className="space-y-2">
                <Label htmlFor="location">Location <span className="text-destructive">• Required</span></Label>
                <Select onValueChange={(value) => setValue('location', value)} value={watch('location')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(loc => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
              </div>
            )}
          </div>

          {/* C. Compensation */}
          <div className="space-y-4">
            <h3 className="font-semibold">Compensation Range</h3>
            
            <div className="space-y-2">
              <Label htmlFor="budget_currency">Currency</Label>
              <Select onValueChange={(value) => setValue('budget_currency', value)} value={watch('budget_currency')}>
                <SelectTrigger>
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
                <Label htmlFor="budget_min">Minimum (Monthly)</Label>
                <Input 
                  type="number" 
                  {...register('budget_min')} 
                  placeholder="e.g., 20000" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget_max">Maximum (Monthly)</Label>
                <Input 
                  type="number" 
                  {...register('budget_max')} 
                  placeholder="e.g., 30000" 
                />
                {errors.budget_max && <p className="text-sm text-destructive">{errors.budget_max.message}</p>}
              </div>
            </div>
          </div>

          {/* D. Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Job Description <span className="text-destructive">• Required</span></Label>
            <Textarea 
              {...register('description')} 
              placeholder="Describe the role, responsibilities, and ideal candidate..." 
              rows={6}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          {/* E. Skills */}
          <div className="space-y-4">
            <h3 className="font-semibold">Skills</h3>
            
            <div className="space-y-2">
              <Label>Must-Have Skills <span className="text-destructive">• Required (at least 1)</span></Label>
              <div className="flex gap-2">
                <Input 
                  value={skillMustInput}
                  onChange={(e) => setSkillMustInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkillMust())}
                  placeholder="e.g., Python, React, SQL"
                />
                <Button type="button" onClick={addSkillMust}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skillsMust.map(skill => (
                  <Badge key={skill} variant="secondary" className="gap-1">
                    {skill}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkillMust(skill)} />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nice-to-Have Skills</Label>
              <div className="flex gap-2">
                <Input 
                  value={skillNiceInput}
                  onChange={(e) => setSkillNiceInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkillNice())}
                  placeholder="e.g., Docker, AWS"
                />
                <Button type="button" onClick={addSkillNice}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skillsNice.map(skill => (
                  <Badge key={skill} variant="outline" className="gap-1">
                    {skill}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkillNice(skill)} />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Exclusive Toggle */}
          <div className="relative flex items-center gap-3 p-3 rounded-lg border bg-gradient-to-r from-purple-50/50 via-blue-50/50 to-cyan-50/50 dark:from-purple-950/20 dark:via-blue-950/20 dark:to-cyan-950/20">
            <button
              type="button"
              onClick={() => {
                setIsExclusive(!isExclusive);
                setShowExclusiveInfo(!showExclusiveInfo);
              }}
              className="relative w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 group"
            >
              {isExclusive ? (
                <>
                  {/* Animated gradient ring */}
                  <div 
                    className="absolute inset-0 rounded-full opacity-100 group-hover:opacity-100 transition-opacity"
                    style={{
                      background: 'conic-gradient(from 0deg, #06b6d4, #8b5cf6, #ec4899, #06b6d4)',
                      animation: 'spin 10s linear infinite'
                    }}
                  />
                  {/* Pulse effect on click */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 opacity-0 group-active:opacity-60 group-active:scale-150 transition-all duration-200" />
                  {/* Dark center circle */}
                  <div className="absolute inset-[2px] rounded-full bg-background" />
                </>
              ) : (
                <>
                  {/* Default soft ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-muted-foreground/30 group-hover:border-muted-foreground/50 transition-colors opacity-100 group-disabled:opacity-40" />
                  {/* Dark center */}
                  <div className="absolute inset-[2px] rounded-full bg-background" />
                </>
              )}
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowExclusiveInfo(!showExclusiveInfo);
                }}
                className={`text-sm font-medium underline decoration-dotted underline-offset-4 transition-all duration-300 hover:decoration-solid ${
                  isExclusive 
                    ? 'bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent font-semibold' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Mark as Exclusive on Huntorix
              </button>
              <Badge className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 text-white text-[10px] px-1.5 py-0 h-4 border-0">
                Premium
              </Badge>
              {showExclusiveInfo && (
                <div className="absolute left-10 top-full mt-2 p-3 bg-popover border rounded-lg text-sm text-popover-foreground z-50 max-w-xs">
                  <p>Mark this job as exclusive to HuntoriX. Exclusive jobs get priority placement and are only available through our platform.</p>
                  <button 
                    onClick={() => setShowExclusiveInfo(false)}
                    className="mt-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* F. Visibility */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isPublic" 
                checked={isPublic} 
                onCheckedChange={(checked) => setIsPublic(checked as boolean)}
              />
              <Label htmlFor="isPublic" className="cursor-pointer">
                Make this job publicly visible
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              {isPublic 
                ? 'This job will appear in public job listings'
                : 'This job will be private and only visible via direct links'}
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isFormValid || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
