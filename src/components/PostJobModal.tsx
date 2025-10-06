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
import { X, Upload, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';

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
  const [isParsing, setIsParsing] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  const [isExclusive, setIsExclusive] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors, isValid } } = useForm({
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
  const description = watch('description');
  const industry = watch('industry');
  const seniorityVal = watch('seniority');
  const employmentTypeVal = watch('employment_type');

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF, DOCX, or TXT file');
      return;
    }

    setIsParsing(true);
    const filledFields = new Set<string>();

    try {
      let jobDescriptionText = '';

      if (file.type === 'text/plain') {
        jobDescriptionText = await file.text();
      } else {
        // For PDF and DOCX files, convert to base64 and send to backend
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            // Extract base64 part after the comma
            const base64Data = result.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Send base64 file to backend for parsing
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

      // Removed duplicate parse call; using jobDescriptionText from above

      const { data, error } = await supabase.functions.invoke('parse-job-description', {
        body: { jobDescription: jobDescriptionText }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      const jobInfo = data.jobInfo;
      const combinedText = `${jobInfo.title ?? ''} ${jobInfo.description ?? ''} ${jobDescriptionText}`;

      // Helper: infer seniority from text
      const detectSeniority = (text: string): 'junior' | 'mid' | 'senior' | 'lead' | 'exec' | undefined => {
        const t = text.toLowerCase();
        if (/(lead|tech lead|team lead)/.test(t)) return 'lead';
        if (/(executive director|vp|cto|chief|executive)/.test(t)) return 'exec';
        if (/(senior|sr\.?|5\+\s*years|6\+\s*years|7\+\s*years|8\+\s*years|9\+\s*years|10\+\s*years)/.test(t)) return 'senior';
        if (/(junior|jr\.?|0-2\s*years|1-2\s*years)/.test(t)) return 'junior';
        if (/(mid|3-5\s*years)/.test(t)) return 'mid';
        return undefined;
      };

      // Helper: derive title from natural language
      const deriveTitle = (text: string): string | undefined => {
        const t = text.replace(/\s+/g, ' ');
        const patterns = [
          /looking for an?\s+([A-Z][A-Za-z0-9/ .+\-]+?)(?=\s+(?:to|for|in|at)|[.,\n])/i,
          /we['’]re\s+(?:looking|seeking|hiring)\s+for\s+an?\s+([A-Z][A-Za-z0-9/ .+\-]+?)(?=\s+(?:to|for|in|at)|[.,\n])/i,
          /we['’]re\s+(?:looking|seeking|hiring)\s+an?\s+([A-Z][A-Za-z0-9/ .+\-]+?)(?=\s+(?:to|for|in|at)|[.,\n])/i,
          /join\s+our[^.\n]*\s+as\s+an?\s+([A-Z][A-Za-z0-9/ .+\-]+?)(?=\s+(?:to|for|in|at)|[.,\n])/i,
        ];
        for (const re of patterns) {
          const m = t.match(re);
          if (m?.[1]) {
            let title = m[1].trim();
            title = title.replace(/^(talented|experienced|passionate|skilled|seasoned)\s+/i, '').trim();
            return title;
          }
        }
        return undefined;
      };

      // Helper: detect employment type
      const detectEmployment = (text: string): 'full_time' | 'contract' | 'temp' | undefined => {
        const t = text.toLowerCase();
        if (/(full[- ]?time)/.test(t)) return 'full_time';
        if (/(part[- ]?time|temporary)/.test(t)) return 'temp';
        if (/(contract|contractor)/.test(t)) return 'contract';
        return undefined;
      };

      // Helper: derive location/type
      const deriveLocation = (text: string): { type?: 'on_site' | 'hybrid' | 'remote'; city?: string } => {
        const out: { type?: 'on_site' | 'hybrid' | 'remote'; city?: string } = {};
        if (/hybrid/i.test(text)) out.type = 'hybrid';
        else if (/on[- ]?site/i.test(text)) out.type = 'on_site';
        else if (/remote/i.test(text)) out.type = 'remote';
        const officeMatch = text.match(/from our ([A-Za-z][A-Za-z ]{1,40}) office/i);
        if (officeMatch?.[1]) out.city = officeMatch[1].trim();
        if (!out.city) {
          for (const city of locations) {
            if (new RegExp(`\\b${city}\\b`, 'i').test(text)) { out.city = city; break; }
          }
        }
        return out;
      };
      // Auto-fill fields
      if (jobInfo.title) {
        const normalized = jobInfo.title.trim();
        if (jobTitles.includes(normalized)) {
          setValue('title', normalized);
          filledFields.add('title');
        } else {
          setValue('title', 'Other');
          setValue('custom_title', normalized);
          filledFields.add('title');
          filledFields.add('custom_title');
        }
      }
      if (jobInfo.industry) {
        setValue('industry', jobInfo.industry);
        filledFields.add('industry');
      }
      if (jobInfo.seniority) {
        setValue('seniority', jobInfo.seniority as any);
        filledFields.add('seniority');
      } else {
        const inferred = detectSeniority(combinedText);
        if (inferred) {
          setValue('seniority', inferred as any);
          filledFields.add('seniority');
        }
      }
      // If title says Senior or 5+ years but field is mid/junior, override to senior
      {
        const current = watch('seniority') as any;
        if ((jobInfo.title?.toLowerCase().includes('senior') || /5\+\s*years/i.test(combinedText)) && (current === 'mid' || current === 'junior')) {
          setValue('seniority', 'senior' as any);
          filledFields.add('seniority');
        }
      }
      if (jobInfo.employment_type) {
        setValue('employment_type', jobInfo.employment_type);
        filledFields.add('employment_type');
      }
      if (jobInfo.location_type) {
        setValue('location_type', jobInfo.location_type);
        filledFields.add('location_type');
      }
      if (jobInfo.location) {
        setValue('location', jobInfo.location);
        filledFields.add('location');
      }
      if (jobInfo.budget_currency) {
        setValue('budget_currency', jobInfo.budget_currency);
        filledFields.add('budget_currency');
      }
      if (jobInfo.budget_min) {
        setValue('budget_min', jobInfo.budget_min.toString());
        filledFields.add('budget_min');
      }
      if (jobInfo.budget_max) {
        setValue('budget_max', jobInfo.budget_max.toString());
        filledFields.add('budget_max');
      }
      if (jobInfo.description) {
        setValue('description', jobInfo.description);
        filledFields.add('description');
      }
      if (jobInfo.skills_must?.length > 0) {
        setSkillsMust(jobInfo.skills_must);
        filledFields.add('skills_must');
      }
      if (jobInfo.skills_nice?.length > 0) {
        setSkillsNice(jobInfo.skills_nice);
        filledFields.add('skills_nice');
      }

      // Fallbacks when AI misses fields
      if (!watch('title')) {
        const t = deriveTitle(jobDescriptionText);
        if (t) {
          if (jobTitles.includes(t)) {
            setValue('title', t);
          } else {
            setValue('title', 'Other');
            setValue('custom_title', t);
          }
          filledFields.add('title');
          filledFields.add('custom_title');
        }
      }

      if (!watch('seniority')) {
        const inferred = detectSeniority(jobDescriptionText);
        if (inferred) {
          setValue('seniority', inferred as any);
          filledFields.add('seniority');
        }
      }

      if (!watch('employment_type')) {
        const et = detectEmployment(jobDescriptionText);
        if (et) {
          setValue('employment_type', et as any);
          filledFields.add('employment_type');
        }
      }

      if (!watch('location_type')) {
        const loc = deriveLocation(jobDescriptionText);
        if (loc.type) { setValue('location_type', loc.type); filledFields.add('location_type'); }
        if (loc.city) { setValue('location', loc.city); filledFields.add('location'); }
      }

      if (!watch('industry')) {
        if (/(cybersecurity|software|cloud|saas)/i.test(jobDescriptionText)) {
          setValue('industry', 'Software/Tech');
          filledFields.add('industry');
        }
      }

      if (!watch('description')) {
        const sentences = jobDescriptionText.replace(/\s+/g, ' ').split(/(?<=\.)\s+/).slice(0, 2).join(' ');
        if (sentences.length >= 10) {
          setValue('description', sentences);
          filledFields.add('description');
        }
      }

      setAutoFilledFields(filledFields);
      toast.success('Parsed and auto-filled key fields. Please review before posting.');

    } catch (error) {
      console.error('Error parsing job description:', error);
      toast.error('Failed to parse job description. Please fill in manually.');
    } finally {
      setIsParsing(false);
      event.target.value = ''; // Reset file input
    }
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
        .insert([{
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
        } as any])
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
          {/* Upload Job Description */}
          <Card className="p-4 border-2 border-dashed border-[hsl(var(--accent-mint))] bg-gradient-to-br from-[hsl(var(--accent-mint))]/5 to-[hsl(var(--accent-lilac))]/5">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-[hsl(var(--accent-pink))]" />
                <h3 className="font-semibold">Upload Job Description (Optional)</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Upload a PDF, DOCX, or TXT file and let AI auto-fill the form for you
              </p>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileUpload}
                  disabled={isParsing}
                  className="cursor-pointer"
                />
                {isParsing && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Parsing job description...</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Exclusive Toggle */}
          <div className="flex items-center gap-3 -mt-3">
            <button
              type="button"
              onClick={() => setIsExclusive(!isExclusive)}
              className="relative flex items-center justify-center w-7 h-7 rounded-full transition-all duration-300 hover:scale-110 group"
            >
              {/* Outer glow effect */}
              {isExclusive && (
                <>
                  <div className="absolute inset-0 rounded-full bg-purple-500/40 blur-md animate-pulse" />
                  <div className="absolute inset-0 rounded-full bg-cyan-400/40 blur-md animate-pulse" style={{ animationDelay: '0.5s' }} />
                </>
              )}
              
              {/* Main dot */}
              <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
                isExclusive 
                  ? 'bg-gradient-to-br from-purple-500 via-blue-400 to-cyan-400 shadow-lg shadow-purple-500/50' 
                  : 'bg-muted-foreground/30'
              }`}>
                {isExclusive && (
                  <>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-400 via-purple-500 to-blue-500 opacity-0 animate-pulse" />
                    <div className="absolute inset-1 rounded-full bg-gradient-to-br from-purple-400/50 via-transparent to-cyan-400/50 animate-[spin_4s_linear_infinite]" />
                  </>
                )}
              </div>
            </button>
            <span className={`text-sm font-medium transition-all duration-300 ${
              isExclusive 
                ? 'bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent font-semibold' 
                : 'text-muted-foreground'
            }`}>
              Exclusive on HuntoriX
            </span>
          </div>

          {/* A. Basics */}
          <div className="space-y-4">
            <h3 className="font-semibold">Basics</h3>
            
            <div className="space-y-2">
              <Label htmlFor="title">Job Title <span className="text-destructive">• Required</span></Label>
              <Select onValueChange={(value) => setValue('title', value)} value={selectedTitle}>
                <SelectTrigger className={autoFilledFields.has('title') ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}>
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
              <Select onValueChange={(value) => setValue('industry', value)} value={industry}>
                <SelectTrigger className={autoFilledFields.has('industry') ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}>
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
                <Select onValueChange={(value) => setValue('seniority', value as any)} value={seniorityVal || undefined}>
                  <SelectTrigger className={autoFilledFields.has('seniority') ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}>
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
                {errors.seniority?.message && <p className="text-sm text-destructive">{String(errors.seniority.message)}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="employment_type">Employment Type <span className="text-destructive">• Required</span></Label>
                <Select onValueChange={(value) => setValue('employment_type', value as any)} value={employmentTypeVal || undefined}>
                  <SelectTrigger className={autoFilledFields.has('employment_type') ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="temp">Temporary</SelectItem>
                  </SelectContent>
                </Select>
                {errors.employment_type?.message && <p className="text-sm text-destructive">{String(errors.employment_type.message)}</p>}
              </div>
            </div>
          </div>

          {/* B. Location */}
          <div className="space-y-4">
            <h3 className="font-semibold">Location</h3>
            
            <div className="space-y-2">
              <Label>Location Type</Label>
              <RadioGroup
                value={locationType || 'remote'}
                onValueChange={(value) => setValue('location_type', value)}
                className={autoFilledFields.has('location_type') ? 'bg-yellow-50 dark:bg-yellow-950/20 p-2 rounded' : ''}
              >
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
                  <SelectTrigger className={autoFilledFields.has('location') ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}>
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
                <SelectTrigger className={autoFilledFields.has('budget_currency') ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}>
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
                <Input 
                  {...register('budget_min')} 
                  type="number" 
                  min="0" 
                  placeholder="0"
                  className={autoFilledFields.has('budget_min') ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget_max">Salary Max</Label>
                <Input 
                  {...register('budget_max')} 
                  type="number" 
                  min="0" 
                  placeholder="0"
                  className={autoFilledFields.has('budget_max') ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}
                />
                {errors.budget_max && <p className="text-sm text-destructive">{errors.budget_max.message}</p>}
              </div>
            </div>
          </div>

          {/* D. Description & Skills */}
          <div className="space-y-4">
            <h3 className="font-semibold">Description & Skills</h3>
            
            <div className="space-y-2">
              <Label htmlFor="description">Role Description <span className="text-destructive">• Required</span></Label>
              <Textarea 
                {...register('description')} 
                rows={5} 
                placeholder="Describe the role, responsibilities, and requirements..."
                className={autoFilledFields.has('description') ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}
              />
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
              <div className={`flex flex-wrap gap-2 mt-2 p-2 rounded ${autoFilledFields.has('skills_must') ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}`}>
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
              <div className={`flex flex-wrap gap-2 mt-2 p-2 rounded ${autoFilledFields.has('skills_nice') ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}`}>
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
