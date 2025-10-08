import { useState, useEffect, useRef, useCallback } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Briefcase, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type JobTitleOption = {
  type: 'title' | 'recent';
  value: string;
  category?: string;
};

type JobTitleAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

// Comprehensive job titles organized by category
const JOB_TITLES_DATA: JobTitleOption[] = [
  // Engineering - Software
  { type: 'title', value: 'Software Engineer', category: 'Engineering' },
  { type: 'title', value: 'Backend Engineer', category: 'Engineering' },
  { type: 'title', value: 'Frontend Engineer', category: 'Engineering' },
  { type: 'title', value: 'Full-Stack Engineer', category: 'Engineering' },
  { type: 'title', value: 'DevOps Engineer', category: 'Engineering' },
  { type: 'title', value: 'SRE', category: 'Engineering' },
  { type: 'title', value: 'Mobile Developer', category: 'Engineering' },
  { type: 'title', value: 'iOS Developer', category: 'Engineering' },
  { type: 'title', value: 'Android Developer', category: 'Engineering' },
  { type: 'title', value: 'QA Engineer', category: 'Engineering' },
  { type: 'title', value: 'Algorithm Engineer', category: 'Engineering' },
  { type: 'title', value: 'Cybersecurity Engineer', category: 'Engineering' },
  { type: 'title', value: 'Cloud Engineer', category: 'Engineering' },
  { type: 'title', value: 'Platform Engineer', category: 'Engineering' },
  { type: 'title', value: 'Security Engineer', category: 'Engineering' },
  { type: 'title', value: 'Systems Engineer', category: 'Engineering' },
  { type: 'title', value: 'Network Engineer', category: 'Engineering' },
  { type: 'title', value: 'Embedded Engineer', category: 'Engineering' },
  { type: 'title', value: 'Firmware Engineer', category: 'Engineering' },
  { type: 'title', value: 'Machine Learning Engineer', category: 'Engineering' },
  { type: 'title', value: 'AI Engineer', category: 'Engineering' },
  
  // Engineering - Hardware/Traditional
  { type: 'title', value: 'Mechanical Engineer', category: 'Engineering' },
  { type: 'title', value: 'Electrical Engineer', category: 'Engineering' },
  { type: 'title', value: 'Civil Engineer', category: 'Engineering' },
  { type: 'title', value: 'Chemical Engineer', category: 'Engineering' },
  { type: 'title', value: 'Industrial Engineer', category: 'Engineering' },
  { type: 'title', value: 'Aerospace Engineer', category: 'Engineering' },
  { type: 'title', value: 'Biomedical Engineer', category: 'Engineering' },
  
  // Data & Analytics
  { type: 'title', value: 'Data Scientist', category: 'Data & Analytics' },
  { type: 'title', value: 'Data Engineer', category: 'Data & Analytics' },
  { type: 'title', value: 'Data Analyst', category: 'Data & Analytics' },
  { type: 'title', value: 'Business Intelligence Analyst', category: 'Data & Analytics' },
  { type: 'title', value: 'Analytics Engineer', category: 'Data & Analytics' },
  
  // Product
  { type: 'title', value: 'Product Manager', category: 'Product' },
  { type: 'title', value: 'Senior Product Manager', category: 'Product' },
  { type: 'title', value: 'Product Owner', category: 'Product' },
  { type: 'title', value: 'Technical Product Manager', category: 'Product' },
  { type: 'title', value: 'Product Designer', category: 'Product' },
  { type: 'title', value: 'Product Analyst', category: 'Product' },
  
  // Design
  { type: 'title', value: 'UX Designer', category: 'Design' },
  { type: 'title', value: 'UI Designer', category: 'Design' },
  { type: 'title', value: 'UI/UX Designer', category: 'Design' },
  { type: 'title', value: 'Graphic Designer', category: 'Design' },
  { type: 'title', value: 'Visual Designer', category: 'Design' },
  { type: 'title', value: 'Interaction Designer', category: 'Design' },
  
  // Management
  { type: 'title', value: 'Project Manager', category: 'Management' },
  { type: 'title', value: 'Program Manager', category: 'Management' },
  { type: 'title', value: 'Engineering Manager', category: 'Management' },
  { type: 'title', value: 'Technical Lead', category: 'Management' },
  { type: 'title', value: 'Team Lead', category: 'Management' },
  
  // Sales & Marketing
  { type: 'title', value: 'Sales Manager', category: 'Sales & Marketing' },
  { type: 'title', value: 'Marketing Manager', category: 'Sales & Marketing' },
  { type: 'title', value: 'Account Executive', category: 'Sales & Marketing' },
  { type: 'title', value: 'Business Development Manager', category: 'Sales & Marketing' },
  { type: 'title', value: 'Sales Engineer', category: 'Sales & Marketing' },
  { type: 'title', value: 'Digital Marketing Manager', category: 'Sales & Marketing' },
  { type: 'title', value: 'Content Marketing Manager', category: 'Sales & Marketing' },
  { type: 'title', value: 'Growth Manager', category: 'Sales & Marketing' },
  
  // Customer Success
  { type: 'title', value: 'Customer Success Manager', category: 'Customer Success' },
  { type: 'title', value: 'Customer Support Engineer', category: 'Customer Success' },
  { type: 'title', value: 'Technical Support Engineer', category: 'Customer Success' },
  { type: 'title', value: 'Account Manager', category: 'Customer Success' },
  
  // Finance
  { type: 'title', value: 'Finance Manager', category: 'Finance' },
  { type: 'title', value: 'Financial Analyst', category: 'Finance' },
  { type: 'title', value: 'Accountant', category: 'Finance' },
  { type: 'title', value: 'Controller', category: 'Finance' },
  { type: 'title', value: 'CFO', category: 'Finance' },
  
  // HR
  { type: 'title', value: 'HR BP', category: 'HR' },
  { type: 'title', value: 'HR Manager', category: 'HR' },
  { type: 'title', value: 'Recruiter', category: 'HR' },
  { type: 'title', value: 'Technical Recruiter', category: 'HR' },
  { type: 'title', value: 'Talent Acquisition Manager', category: 'HR' },
  { type: 'title', value: 'People Operations Manager', category: 'HR' },
  
  // Operations
  { type: 'title', value: 'Office Manager', category: 'Operations' },
  { type: 'title', value: 'Operations Manager', category: 'Operations' },
  { type: 'title', value: 'Supply Chain Manager', category: 'Operations' },
  { type: 'title', value: 'Logistics Manager', category: 'Operations' },
  
  // Research & Science
  { type: 'title', value: 'Research Scientist', category: 'Research & Science' },
  { type: 'title', value: 'Lab Tech', category: 'Research & Science' },
  { type: 'title', value: 'Lab Technician', category: 'Research & Science' },
  { type: 'title', value: 'Clinical Researcher', category: 'Research & Science' },
  { type: 'title', value: 'Bioinformatician', category: 'Research & Science' },
  
  // Healthcare & Regulatory
  { type: 'title', value: 'Regulatory Affairs', category: 'Healthcare & Regulatory' },
  { type: 'title', value: 'Clinical PM', category: 'Healthcare & Regulatory' },
  { type: 'title', value: 'Medical Device Engineer', category: 'Healthcare & Regulatory' },
  { type: 'title', value: 'Quality Assurance Manager', category: 'Healthcare & Regulatory' },
  
  // Other
  { type: 'title', value: 'Other', category: 'Other' },
];

export function JobTitleAutocomplete({ value, onChange, placeholder, className }: JobTitleAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTitles, setFilteredTitles] = useState<JobTitleOption[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [triggerWidth, setTriggerWidth] = useState<number>(0);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [previewValue, setPreviewValue] = useState('');
  const [originalQuery, setOriginalQuery] = useState('');
  const [showCustomMessage, setShowCustomMessage] = useState(false);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentJobTitleSearches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent job title searches');
      }
    }
  }, []);

  // Save to recent searches
  const addToRecentSearches = useCallback((query: string) => {
    if (!query.trim()) return;
    
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentJobTitleSearches', JSON.stringify(updated));
  }, [recentSearches]);

  // Delete a recent search
  const deleteRecentSearch = useCallback((searchToDelete: string) => {
    const updated = recentSearches.filter(s => s !== searchToDelete);
    setRecentSearches(updated);
    localStorage.setItem('recentJobTitleSearches', JSON.stringify(updated));
  }, [recentSearches]);

  // Filter job titles based on search query
  useEffect(() => {
    if (searchQuery.length === 0) {
      setFilteredTitles(JOB_TITLES_DATA.slice(0, 20)); // Show first 20 by default
    } else {
      const query = searchQuery.toLowerCase().trim();
      
      // Filter matching titles
      const filtered = JOB_TITLES_DATA.filter(title =>
        title.value.toLowerCase().includes(query) ||
        title.category?.toLowerCase().includes(query)
      );
      
      // Sort by relevance
      const sorted = filtered.sort((a, b) => {
        const aValue = a.value.toLowerCase();
        const bValue = b.value.toLowerCase();
        
        // Exact match
        if (aValue === query && bValue !== query) return -1;
        if (aValue !== query && bValue === query) return 1;
        
        // Starts with priority
        const aStarts = aValue.startsWith(query);
        const bStarts = bValue.startsWith(query);
        
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        
        // Alphabetical fallback
        return aValue.localeCompare(bValue);
      });
      
      setFilteredTitles(sorted);
    }
  }, [searchQuery]);

  // Update search query when value changes from outside
  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  // Measure trigger width for popover
  useEffect(() => {
    if (triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth);
    }
  }, [open]);

  const handleSelect = (title: JobTitleOption) => {
    onChange(title.value);
    setSearchQuery(title.value);
    addToRecentSearches(title.value);
    setOpen(false);
    setSelectedIndex(-1);
    setPreviewValue('');
    setOriginalQuery('');
  };

  const showRecentSearches = searchQuery.length === 0;

  // Flatten all items for keyboard navigation
  const allItems = [
    ...(showRecentSearches ? recentSearches.map(s => ({ type: 'recent' as const, value: s })) : []),
    ...filteredTitles,
  ];

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      // Store original query on first arrow down
      if (selectedIndex === -1) {
        setOriginalQuery(searchQuery);
      }
      setSelectedIndex(prev => {
        const newIndex = prev < allItems.length - 1 ? prev + 1 : prev;
        // Preview the selected item
        if (newIndex >= 0 && newIndex < allItems.length) {
          setPreviewValue(allItems[newIndex].value);
        }
        return newIndex;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => {
        const newIndex = prev > -1 ? prev - 1 : -1;
        // Restore original query when going back to -1
        if (newIndex === -1) {
          setPreviewValue('');
        } else if (newIndex >= 0 && newIndex < allItems.length) {
          setPreviewValue(allItems[newIndex].value);
        }
        return newIndex;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < allItems.length) {
        const selectedItem = allItems[selectedIndex];
        if (selectedItem.type === 'recent') {
          onChange(selectedItem.value);
          setSearchQuery(selectedItem.value);
          addToRecentSearches(selectedItem.value);
          setOpen(false);
        } else {
          handleSelect(selectedItem as JobTitleOption);
        }
      } else if (searchQuery.trim()) {
        // Custom title entry - no selection from list
        onChange(searchQuery.trim());
        addToRecentSearches(searchQuery.trim());
        setOpen(false);
        setShowCustomMessage(true);
        setTimeout(() => setShowCustomMessage(false), 3000);
      }
      setPreviewValue('');
      setOriginalQuery('');
      setSelectedIndex(-1);
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setOpen(false);
      setSelectedIndex(-1);
      setPreviewValue('');
      setOriginalQuery('');
    }
  };

  // Group by categories
  const groupedTitles: Record<string, JobTitleOption[]> = {};
  filteredTitles.forEach(title => {
    const category = title.category || 'Other';
    if (!groupedTitles[category]) {
      groupedTitles[category] = [];
    }
    groupedTitles[category].push(title);
  });

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <div
            ref={triggerRef}
            className={cn("relative", className)}
            role="combobox"
            aria-expanded={open}
          onMouseDown={(e) => {
            const target = e.target as HTMLElement;
            const clickedInput = !!target.closest('input');
            if (!open && !clickedInput) {
              e.preventDefault();
              setOpen(true);
              setSelectedIndex(-1);
              setPreviewValue('');
              requestAnimationFrame(() => inputRef.current?.focus());
            }
          }}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            const clickedInput = !!target.closest('input');
            if (!open && !clickedInput) {
              e.preventDefault();
              setOpen(true);
              inputRef.current?.focus();
            }
          }}
        >
          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder || "Search job title..."}
            value={previewValue || searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onChange(e.target.value);
              setSelectedIndex(-1);
              setPreviewValue('');
              setOriginalQuery('');
              if (!open) setOpen(true);
            }}
            onMouseDown={(e) => {
              if (open) {
                e.stopPropagation();
              }
            }}
            onClick={(e) => {
              if (open) {
                e.stopPropagation();
              }
            }}
            onFocus={() => {
              setOpen(true);
              setSelectedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            className="flex h-11 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0 z-[100]" 
        style={{ width: triggerWidth > 0 ? `${triggerWidth}px` : 'auto' }}
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command className="rounded-lg border-none shadow-lg bg-popover">
          <CommandList 
            className="max-h-[400px] overflow-y-auto overscroll-contain"
            onWheel={(e) => e.stopPropagation()}
          >
            {showRecentSearches && recentSearches.length > 0 && (
              <CommandGroup heading={
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Recent Searches
                </div>
              }>
                {recentSearches.map((search, idx) => (
                  <CommandItem
                    key={`recent-${idx}`}
                    value={search}
                    onSelect={() => {
                      onChange(search);
                      setSearchQuery(search);
                      addToRecentSearches(search);
                      setOpen(false);
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onMouseLeave={() => setSelectedIndex(-1)}
                    className={cn(
                      "flex items-center justify-between group",
                      selectedIndex === idx
                        ? "bg-gray-100 dark:bg-gray-800 data-[selected=true]:bg-gray-100 dark:data-[selected=true]:bg-gray-800"
                        : "data-[selected=true]:bg-transparent data-[selected=true]:text-foreground"
                    )}
                  >
                    <span>{search}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRecentSearch(search);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {!showRecentSearches && filteredTitles.length === 0 && (
              <CommandEmpty>No job titles found.</CommandEmpty>
            )}

            {!showRecentSearches && Object.keys(groupedTitles).map((category) => {
              const startIdx = (showRecentSearches ? recentSearches.length : 0) + filteredTitles.findIndex(t => t.category === category);
              return (
                <CommandGroup key={category} heading={category}>
                  {groupedTitles[category].map((title, idx) => {
                    const globalIdx = startIdx + idx;
                    return (
                      <CommandItem
                        key={`${title.value}-${idx}`}
                        value={title.value}
                        onSelect={() => handleSelect(title)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        onMouseLeave={() => setSelectedIndex(-1)}
                        className={cn(
                          "flex items-center gap-2",
                          selectedIndex === globalIdx
                            ? "bg-gray-100 dark:bg-gray-800 data-[selected=true]:bg-gray-100 dark:data-[selected=true]:bg-gray-800"
                            : "data-[selected=true]:bg-transparent data-[selected=true]:text-foreground"
                        )}
                      >
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span>{title.value}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
      </Popover>
      {showCustomMessage && (
        <p className="text-xs text-muted-foreground mt-1.5 animate-in fade-in slide-in-from-top-1">
          Custom title saved
        </p>
      )}
    </div>
  );
}
