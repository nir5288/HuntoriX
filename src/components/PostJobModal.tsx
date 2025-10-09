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
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { X, Loader2, Info, Sparkles, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { JobTitleAutocomplete } from '@/components/JobTitleAutocomplete';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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

const locations = [
  'Tel Aviv', 'Jerusalem', 'Haifa', 'Herzliya', 'Ramat Gan', 'Be\'er Sheva',
  'London', 'Berlin', 'New York', 'San Francisco', 'Bangalore'
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
  const [showExclusiveInfo, setShowExclusiveInfo] = useState(false);
  const [salaryPeriod, setSalaryPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [compensationOpen, setCompensationOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isValid } } = useForm({
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
  const location = watch('location');
  const budgetMin = watch('budget_min');
  const budgetMax = watch('budget_max');

  // Check if all required fields are filled - calculate manually for better reactivity
  const isFormValid = Boolean(
    (selectedTitle === 'Other' ? watch('custom_title')?.trim() : selectedTitle) &&
    industry &&
    seniorityVal &&
    employmentTypeVal &&
    location?.trim() &&
    description?.trim() &&
    description?.length >= 10 &&
    skillsMust.length > 0 &&
    (!budgetMin || !budgetMax || Number(budgetMax) >= Number(budgetMin))
  );

  // Auto-expand skills section when AI fills skills
  useEffect(() => {
    if (autoFilledFields.has('skills_must') || autoFilledFields.has('skills_nice')) {
      setSkillsOpen(true);
    }
  }, [autoFilledFields]);

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
      const detectSeniority = (text: string): 'junior' | 'mid_level' | 'senior' | 'lead_principal' | 'manager_director' | 'vp_c_level' | undefined => {
        const t = text.toLowerCase();
        if (/(vp|vice president|cto|cfo|ceo|chief|c-level)/.test(t)) return 'vp_c_level';
        if (/(director|head of|manager|management)/.test(t)) return 'manager_director';
        if (/(principal|lead|tech lead|team lead|staff)/.test(t)) return 'lead_principal';
        if (/(senior|sr\.?|5\+\s*years|6\+\s*years|7\+\s*years|8\+\s*years|9\+\s*years|10\+\s*years)/.test(t)) return 'senior';
        if (/(junior|jr\.?|0-2\s*years|1-2\s*years|entry|entry-level)/.test(t)) return 'junior';
        if (/(mid|mid-level|3-5\s*years|intermediate)/.test(t)) return 'mid_level';
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
      // If title says Senior or 5+ years but field is mid_level/junior, override to senior
      {
        const current = watch('seniority') as any;
        if ((jobInfo.title?.toLowerCase().includes('senior') || /5\+\s*years/i.test(combinedText)) && (current === 'mid_level' || current === 'junior')) {
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

  const scrollToField = (fieldName: string) => {
    const wrapper = document.querySelector(`[data-field="${fieldName}"]`) as HTMLElement | null;
    const element = wrapper || (document.querySelector(`[name="${fieldName}"]`) as HTMLElement | null) ||
                    (document.getElementById(fieldName) as HTMLElement | null);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const focusTarget = (wrapper || element).querySelector<HTMLElement>(
        'input, textarea, [role="combobox"], [contenteditable="true"], button, select'
      );
      focusTarget?.focus({ preventScroll: true });
      element.classList.add('ring-2', 'ring-destructive', 'ring-offset-2');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-destructive', 'ring-offset-2');
      }, 2000);
    }
  };

  const handleClear = () => {
    reset();
    setSkillsMust([]);
    setSkillsNice([]);
    setSkillMustInput('');
    setSkillNiceInput('');
    setIsPublic(true);
    setAutoFilledFields(new Set());
    setIsExclusive(false);
    setSalaryPeriod('monthly');
    setFieldErrors({});
    toast.success('Form cleared');
  };

  const clearFieldError = (fieldName: string) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const onInvalid = (formErrors: any) => {
    const newErrors: Record<string, string> = {};
    if (formErrors?.title) newErrors.title = String(formErrors.title.message || 'Job title is required');
    if (formErrors?.industry) newErrors.industry = String(formErrors.industry.message || 'Industry is required');
    if (formErrors?.seniority) newErrors.seniority = String(formErrors.seniority.message || 'Seniority level is required');
    if (formErrors?.employment_type) newErrors.employment_type = String(formErrors.employment_type.message || 'Employment type is required');
    if (formErrors?.location) newErrors.location = String(formErrors.location.message || 'Work location is required');
    if (formErrors?.description) newErrors.description = String(formErrors.description.message || 'Job description is required (minimum 10 characters)');

    if (skillsMust.length === 0) {
      newErrors.skills_must = 'At least one required skill must be added';
      setSkillsOpen(true);
    }

    setFieldErrors(newErrors);

    const order = ['title','industry','seniority','employment_type','location','description','skills_must'];
    const firstKey = order.find(k => newErrors[k]);
    if (firstKey) {
      scrollToField(firstKey);
    }

    const count = Object.keys(newErrors).length;
    if (count > 0) {
      toast.error(count === 1 ? `Please complete ${firstKey?.replace('_',' ')}` : `Please complete the required fields (${count} missing). Jumped to the first.`);
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const errors: Record<string, string> = {};

    // Validate all required fields and collect errors
    if (!data.title) {
      errors.title = 'Job title is required';
    }

    if (!data.industry) {
      errors.industry = 'Industry is required';
    }

    if (!data.seniority) {
      errors.seniority = 'Seniority level is required';
    }

    if (!data.employment_type) {
      errors.employment_type = 'Employment type is required';
    }

    if (!data.location || data.location.trim().length === 0) {
      errors.location = 'Work location is required';
    }

    if (!data.description || data.description.length < 10) {
      errors.description = 'Job description is required (minimum 10 characters)';
    }

    if (skillsMust.length === 0) {
      errors.skills_must = 'At least one required skill must be added';
      setSkillsOpen(true);
    }

    // If there are errors, show them and stop
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      scrollToField(firstErrorField);
      
      // Show toast with error count
      toast.error(`Please complete the required fields (${Object.keys(errors).length} missing)`, {
        description: 'Check the highlighted fields below'
      });
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
        } as any])
        .select()
        .single();

      if (error) {
        console.error('Error creating job:', error);
        throw error;
      }

      toast('Job Submitted for Review', {
        description: 'Your job has been submitted and will be reviewed within 1 hour'
      });
      onOpenChange(false);
      
      // Reload to refresh the dashboard data
      window.location.reload();

    } catch (error) {
      console.error('Error creating job - Full error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        error: error,
        userId: userId,
        formData: data
      });
      toast('Failed to create job', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0" hideCloseButton>
        <div className="overflow-y-auto flex-1 px-6 pt-6">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl">Post a Job</DialogTitle>
              <DialogDescription>Fill in the details to post a new job opening</DialogDescription>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClear} 
              size="sm"
              className="h-9 text-xs border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 dark:border-destructive/50 dark:text-destructive dark:hover:bg-destructive/20 flex-shrink-0"
            >
              Clear Form
            </Button>
          </div>
        </DialogHeader>

        <form id="post-job-form" onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-5 pb-6 mt-6">
          {/* AI Quick Fill */}
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800/30 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">AI Quick Fill</h3>
                  <p className="text-xs text-muted-foreground">
                    Upload a file or paste your job description and let AI automatically fill in the form fields.
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Input
                    id="ai-upload"
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isParsing}
                  />
                  <Label 
                    htmlFor="ai-upload"
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition-all flex-1 justify-center",
                      "bg-primary text-primary-foreground hover:bg-primary/90",
                      "text-xs font-medium",
                      isParsing && "opacity-50 pointer-events-none"
                    )}
                  >
                    {isParsing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Upload File
                      </>
                    )}
                  </Label>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    disabled={isParsing}
                    onClick={() => {
                      const container = document.getElementById('paste-jd-container');
                      if (container) {
                        container.classList.toggle('hidden');
                        if (!container.classList.contains('hidden')) {
                          const textarea = document.getElementById('paste-jd-textarea') as HTMLTextAreaElement;
                          textarea?.focus();
                        }
                      }
                    }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Paste Text
                  </Button>
                </div>
                
                <div className="hidden" id="paste-jd-container">
                  <Textarea
                    id="paste-jd-textarea"
                    placeholder="Paste your job description here..."
                    rows={6}
                    className="text-xs resize-none"
                    disabled={isParsing}
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      size="sm"
                      className="text-xs"
                      disabled={isParsing}
                      onClick={async () => {
                        const textarea = document.getElementById('paste-jd-textarea') as HTMLTextAreaElement;
                        const text = textarea?.value?.trim();
                        
                        if (!text) {
                          toast.error('Please paste some text first');
                          return;
                        }
                        
                        setIsParsing(true);
                        const filledFields = new Set<string>();
                        
                        try {
                          const { data, error } = await supabase.functions.invoke('parse-job-description', {
                            body: { jobDescription: text }
                          });

                          if (error) throw error;
                          if (!data.success) throw new Error(data.error);

                          const jobInfo = data.jobInfo;
                          const combinedText = `${jobInfo.title ?? ''} ${jobInfo.description ?? ''} ${text}`;

                          // Helper: infer seniority from text
                          const detectSeniority = (text: string): 'junior' | 'mid_level' | 'senior' | 'lead_principal' | 'manager_director' | 'vp_c_level' | undefined => {
                            const t = text.toLowerCase();
                            if (/(vp|vice president|cto|cfo|ceo|chief|c-level)/.test(t)) return 'vp_c_level';
                            if (/(director|head of|manager|management)/.test(t)) return 'manager_director';
                            if (/(principal|lead|tech lead|team lead|staff)/.test(t)) return 'lead_principal';
                            if (/(senior|sr\.?|5\+\s*years|6\+\s*years|7\+\s*years|8\+\s*years|9\+\s*years|10\+\s*years)/.test(t)) return 'senior';
                            if (/(junior|jr\.?|0-2\s*years|1-2\s*years|entry|entry-level)/.test(t)) return 'junior';
                            if (/(mid|mid-level|3-5\s*years|intermediate)/.test(t)) return 'mid_level';
                            return undefined;
                          };

                          // Auto-fill logic (reusing from handleFileUpload)
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

                          setAutoFilledFields(filledFields);
                          toast.success('Parsed and auto-filled key fields. Please review before posting.');
                          
                          // Hide the textarea after successful parse
                          const container = document.getElementById('paste-jd-container');
                          container?.classList.add('hidden');
                          textarea.value = '';
                        } catch (error) {
                          console.error('Error parsing job description:', error);
                          toast.error('Failed to parse job description. Please try again or fill in manually.');
                        } finally {
                          setIsParsing(false);
                        }
                      }}
                    >
                      {isParsing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Parse & Fill
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        const container = document.getElementById('paste-jd-container');
                        const textarea = document.getElementById('paste-jd-textarea') as HTMLTextAreaElement;
                        container?.classList.add('hidden');
                        if (textarea) textarea.value = '';
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Exclusive Toggle */}
          <div className="relative flex items-center gap-2 p-2 rounded-lg border bg-gradient-to-r from-purple-50/50 via-blue-50/50 to-cyan-50/50 dark:from-purple-950/20 dark:via-blue-950/20 dark:to-cyan-950/20 shadow-sm">
            <button
              type="button"
              onClick={() => {
                if (!isExclusive) {
                  toast('Marking as Exclusive', {
                    description: 'This job will be locked as exclusive for 14 days once posted. You cannot unmark it during this period.'
                  });
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
                  className={cn(
                    autoFilledFields.has('title') && 'bg-yellow-50 dark:bg-yellow-950/20',
                    fieldErrors.title && 'border-destructive ring-2 ring-destructive/20'
                  )}
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
                  <SelectTrigger className={cn(
                    "h-11",
                    autoFilledFields.has('industry') && 'bg-yellow-50 dark:bg-yellow-950/20',
                    fieldErrors.industry && 'border-destructive ring-2 ring-destructive/20'
                  )}>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2.5" data-field="seniority">
                  <Label htmlFor="seniority" className="text-sm font-medium">Seniority Level <span className="text-destructive">*</span></Label>
                  <Select 
                    onValueChange={(value) => {
                      setValue('seniority', value as any);
                      clearFieldError('seniority');
                    }} 
                    value={seniorityVal || ''}
                  >
                    <SelectTrigger className={cn(
                      "h-11",
                      autoFilledFields.has('seniority') && 'bg-yellow-50 dark:bg-yellow-950/20',
                      fieldErrors.seniority && 'border-destructive ring-2 ring-destructive/20'
                    )}>
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
                    <SelectTrigger className={cn(
                      "h-11",
                      autoFilledFields.has('employment_type') && 'bg-yellow-50 dark:bg-yellow-950/20',
                      fieldErrors.employment_type && 'border-destructive ring-2 ring-destructive/20'
                    )}>
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
                  className={cn("grid grid-cols-3 gap-3", autoFilledFields.has('location_type') && 'bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg')}
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
                  className={cn(
                    autoFilledFields.has('location') && 'bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-0.5',
                    fieldErrors.location && 'border-destructive ring-2 ring-destructive/20'
                  )}
                />
                {fieldErrors.location && <p className="text-sm text-destructive">{fieldErrors.location}</p>}
                <p className="text-xs text-muted-foreground">
                  Select a city (e.g., "Tel Aviv, Israel") or country (e.g., "Israel")
                </p>
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="budget_currency" className="text-sm font-medium">Currency</Label>
                      <Select onValueChange={(value) => setValue('budget_currency', value)} defaultValue="ILS">
                        <SelectTrigger className={cn("h-10", autoFilledFields.has('budget_currency') && 'bg-yellow-50 dark:bg-yellow-950/20')}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map(curr => (
                            <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="salary_period" className="text-sm font-medium">Period</Label>
                      <Select value={salaryPeriod} onValueChange={(value: 'monthly' | 'yearly') => {
                        const budgetMin = watch('budget_min');
                        const budgetMax = watch('budget_max');
                        
                        if (value === 'yearly' && salaryPeriod === 'monthly') {
                          if (budgetMin) setValue('budget_min', (parseInt(budgetMin) * 12).toString());
                          if (budgetMax) setValue('budget_max', (parseInt(budgetMax) * 12).toString());
                        } else if (value === 'monthly' && salaryPeriod === 'yearly') {
                          if (budgetMin) setValue('budget_min', Math.round(parseInt(budgetMin) / 12).toString());
                          if (budgetMax) setValue('budget_max', Math.round(parseInt(budgetMax) / 12).toString());
                        }
                        
                        setSalaryPeriod(value);
                      }}>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold">
                        {watch('budget_min') 
                          ? `${parseInt(watch('budget_min')).toLocaleString()} ${watch('budget_currency') || 'ILS'}` 
                          : `${(salaryPeriod === 'monthly' ? 5000 : 60000).toLocaleString()} ${watch('budget_currency') || 'ILS'}`
                        }
                      </span>
                      <span className="font-semibold">
                        {watch('budget_max') 
                          ? `${parseInt(watch('budget_max')).toLocaleString()} ${watch('budget_currency') || 'ILS'}` 
                          : `${(salaryPeriod === 'monthly' ? 150000 : 1800000).toLocaleString()}+ ${watch('budget_currency') || 'ILS'}`
                        }
                      </span>
                    </div>
                    <Slider 
                      min={salaryPeriod === 'monthly' ? 5000 : 60000}
                      max={salaryPeriod === 'monthly' ? 150000 : 1800000}
                      step={salaryPeriod === 'monthly' ? 1000 : 10000}
                      value={[
                        watch('budget_min') 
                          ? parseInt(watch('budget_min')) 
                          : salaryPeriod === 'monthly' ? 5000 : 60000,
                        watch('budget_max') 
                          ? parseInt(watch('budget_max')) 
                          : salaryPeriod === 'monthly' ? 150000 : 1800000
                      ]}
                      onValueChange={(values) => {
                        const min = salaryPeriod === 'monthly' ? 5000 : 60000;
                        const max = salaryPeriod === 'monthly' ? 150000 : 1800000;
                        setValue('budget_min', values[0] > min ? values[0].toString() : '');
                        setValue('budget_max', values[1] < max ? values[1].toString() : '');
                      }}
                      className="cursor-pointer"
                    />
                  </div>
                  {errors.budget_max && <p className="text-sm text-destructive">{errors.budget_max.message}</p>}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Description */}
          <Card className="p-6 bg-gradient-to-br from-muted/40 to-muted/20 border-2 shadow-sm">
            <h3 className="font-semibold text-base mb-5">Job Description</h3>
            
            <div className="space-y-2.5" data-field="description">
              <Label htmlFor="description" className="text-sm font-medium">Role Overview <span className="text-destructive">*</span></Label>
              <Textarea 
                {...register('description')} 
                rows={6} 
                placeholder="Describe the role, key responsibilities, requirements, and what makes this opportunity exciting..."
                className={cn(
                  "text-sm resize-none",
                  autoFilledFields.has('description') && 'bg-yellow-50 dark:bg-yellow-950/20',
                  fieldErrors.description && 'border-destructive ring-2 ring-destructive/20'
                )}
                onChange={(e) => {
                  register('description').onChange(e);
                  clearFieldError('description');
                }}
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
                        onClick={() => {
                          addSkillMust();
                          clearFieldError('skills_must');
                        }} 
                        variant="secondary" 
                        size="lg" 
                        className="h-11 px-6"
                      >
                        Add
                      </Button>
                    </div>
                    <div className={cn(
                      "flex flex-wrap gap-2 min-h-[60px] p-3 rounded-lg border-2",
                      autoFilledFields.has('skills_must') && 'bg-yellow-50 dark:bg-yellow-950/20',
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
                    <div className={cn("flex flex-wrap gap-2 min-h-[60px] p-3 rounded-lg border-2", autoFilledFields.has('skills_nice') && 'bg-yellow-50 dark:bg-yellow-950/20')}>
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
        <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 dark:from-slate-900 dark:to-blue-950/20 border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-700 dark:text-blue-300 flex-shrink-0" />
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              Jobs will be reviewed in under 1 hour
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              size="default"
              className="h-10 px-6 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              form="post-job-form"
              variant={isFormValid ? "hero" : "default"}
              size="default"
              disabled={isSubmitting}
              className={cn(
                "h-10 px-6 transition-all duration-300 font-semibold",
                isFormValid && 'shadow-md shadow-primary/20',
                !isFormValid && 'opacity-50'
              )}
            >
              {isSubmitting ? 'Submitting...' : 'Submit for Review'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
