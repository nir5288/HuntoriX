import { useState } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { X } from 'lucide-react';
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

interface PostJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function PostJobModal({ open, onOpenChange, userId }: PostJobModalProps) {
  const navigate = useNavigate();
  const [skillsMust, setSkillsMust] = useState<string[]>([]);
  const [skillsNice, setSkillsNice] = useState<string[]>([]);
  const [skillMustInput, setSkillMustInput] = useState('');
  const [skillNiceInput, setSkillNiceInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  const { register, handleSubmit, watch, setValue, formState: { errors, isValid } } = useForm({
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
      description: ''
    }
  });

  const selectedTitle = watch('title');
  const locationType = watch('location_type');
  const description = watch('description');
  const industry = watch('industry');

  // Check if all required fields are filled
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

      const { data: newJob, error } = await supabase
        .from('jobs')
        .insert({
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
          created_by: userId,
          visibility: isPublic ? 'public' : 'private',
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Job posted successfully');
      onOpenChange(false);
      
      // Navigate to job detail page
      navigate(`/jobs/${newJob.id}`);
      
      // Refresh will happen on navigation
      window.location.reload();

    } catch (error) {
      console.error('Error creating job:', error);
      toast.error('Failed to create job');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post a Job</DialogTitle>
          <DialogDescription>Fill in the details to post a new job opening</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* A. Basics */}
          <div className="space-y-4">
            <h3 className="font-semibold">Basics</h3>
            
            <div className="space-y-2">
              <Label htmlFor="title">Job Title <span className="text-destructive">• Required</span></Label>
              <Select onValueChange={(value) => setValue('title', value)}>
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
              <Select onValueChange={(value) => setValue('industry', value)}>
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
                <Select onValueChange={(value) => setValue('seniority', value as any)} defaultValue="mid">
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
                <Select onValueChange={(value) => setValue('employment_type', value as any)} defaultValue="full_time">
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
          </div>

          {/* B. Location */}
          <div className="space-y-4">
            <h3 className="font-semibold">Location</h3>
            
            <div className="space-y-2">
              <Label>Location Type</Label>
              <RadioGroup defaultValue="remote" onValueChange={(value) => setValue('location_type', value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="on_site" id="on_site" />
                  <Label htmlFor="on_site">On-site</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hybrid" id="hybrid" />
                  <Label htmlFor="hybrid">Hybrid</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="remote" id="remote" />
                  <Label htmlFor="remote">Remote</Label>
                </div>
              </RadioGroup>
            </div>

            {locationType !== 'remote' && (
              <div className="space-y-2">
                <Label htmlFor="location">Location <span className="text-destructive">• Required</span></Label>
                <Select onValueChange={(value) => setValue('location', value)}>
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
            <h3 className="font-semibold">Compensation (Optional)</h3>
            
            <div className="space-y-2">
              <Label htmlFor="budget_currency">Currency</Label>
              <Select onValueChange={(value) => setValue('budget_currency', value)} defaultValue="ILS">
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
                <Label htmlFor="budget_min">Salary Min</Label>
                <Input {...register('budget_min')} type="number" min="0" placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget_max">Salary Max</Label>
                <Input {...register('budget_max')} type="number" min="0" placeholder="0" />
                {errors.budget_max && <p className="text-sm text-destructive">{errors.budget_max.message}</p>}
              </div>
            </div>
          </div>

          {/* D. Description & Skills */}
          <div className="space-y-4">
            <h3 className="font-semibold">Description & Skills</h3>
            
            <div className="space-y-2">
              <Label htmlFor="description">Role Description <span className="text-destructive">• Required</span></Label>
              <Textarea {...register('description')} rows={5} placeholder="Describe the role, responsibilities, and requirements..." />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Must-Have Skills <span className="text-destructive">• Required</span></Label>
              <div className="flex gap-2">
                <Input 
                  value={skillMustInput}
                  onChange={(e) => setSkillMustInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkillMust())}
                  placeholder="Type skill and press Enter"
                />
                <Button type="button" onClick={addSkillMust} variant="secondary">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {skillsMust.map(skill => (
                  <Badge key={skill} variant="secondary" className="gap-1">
                    {skill}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkillMust(skill)} />
                  </Badge>
                ))}
              </div>
              {skillsMust.length === 0 && (
                <p className="text-sm text-muted-foreground">Add at least one must-have skill</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Nice-to-Have Skills (Optional)</Label>
              <div className="flex gap-2">
                <Input 
                  value={skillNiceInput}
                  onChange={(e) => setSkillNiceInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkillNice())}
                  placeholder="Type skill and press Enter"
                />
                <Button type="button" onClick={addSkillNice} variant="secondary">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {skillsNice.map(skill => (
                  <Badge key={skill} variant="outline" className="gap-1">
                    {skill}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkillNice(skill)} />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Visibility */}
          <div className="space-y-4">
            <h3 className="font-semibold">Visibility</h3>
            
            <div className="flex items-start space-x-3 rounded-lg border p-4 bg-gradient-to-br from-[hsl(var(--accent-mint))]/5 to-[hsl(var(--accent-lilac))]/5">
              <Checkbox 
                id="visibility" 
                checked={isPublic}
                onCheckedChange={(checked) => setIsPublic(checked as boolean)}
              />
              <div className="space-y-1 leading-none">
                <Label 
                  htmlFor="visibility"
                  className="text-sm font-medium cursor-pointer"
                >
                  Make this job public
                </Label>
                <p className="text-sm text-muted-foreground">
                  {isPublic 
                    ? "This job will appear in the opportunities page and headhunters can apply to it" 
                    : "This job will be private and won't appear in the opportunities page"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !isFormValid} 
              className={`bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] transition-opacity ${
                isFormValid ? 'opacity-100' : 'opacity-50'
              }`}
            >
              {isSubmitting ? 'Creating...' : 'Create Job'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
