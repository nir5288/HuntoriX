import { useState, useEffect, useRef, useCallback } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, TrendingUp, Clock, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

type SearchSuggestion = {
  type: 'title' | 'skill' | 'company' | 'location' | 'collection';
  value: string;
  count?: number;
  chips?: string[];
};

type SearchAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  onFilterAdd?: (type: 'skill' | 'location' | 'seniority' | 'industry' | 'remote', value: string) => void;
  placeholder?: string;
};

const TRENDING_TITLES = ['Data Scientist', 'Backend Engineer', 'Product Manager', 'Frontend Developer'];
const TRENDING_SKILLS = ['Python', 'React', 'TypeScript', 'AWS', 'SQL'];
const TRENDING_LOCATIONS = ['Tel Aviv', 'Remote', 'Herzliya', 'Jerusalem'];
const QUICK_CHIPS = {
  'Remote': { type: 'remote' as const, value: 'remote' },
  'Senior': { type: 'seniority' as const, value: 'senior' },
  'Fintech': { type: 'industry' as const, value: 'Finance/Fintech' },
};

export function SearchAutocomplete({ value, onChange, onFilterAdd, placeholder }: SearchAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [originalQuery, setOriginalQuery] = useState('');
  const [previewValue, setPreviewValue] = useState('');

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent searches');
      }
    }
  }, []);

  // Save to recent searches
  const addToRecentSearches = useCallback((query: string) => {
    if (!query.trim()) return;
    
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  }, [recentSearches]);

  // Delete a recent search
  const deleteRecentSearch = useCallback((searchToDelete: string) => {
    const updated = recentSearches.filter(s => s !== searchToDelete);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  }, [recentSearches]);

  // Fetch suggestions based on query
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (value.length === 0) {
        setSuggestions([]);
        setSelectedIndex(-1);
        return;
      }

      const query = value.toLowerCase();
      const newSuggestions: SearchSuggestion[] = [];

      try {
        // Fetch job titles
        const { data: titleData } = await supabase
          .from('jobs')
          .select('title')
          .ilike('title', `%${query}%`)
          .eq('status', 'open')
          .limit(5);

        if (titleData) {
          const uniqueTitles = Array.from(new Set(titleData.map(j => j.title)));
          uniqueTitles.forEach(title => {
            newSuggestions.push({ type: 'title', value: title });
          });
        }

        // Fetch skills (from skills_must and skills_nice arrays)
        const { data: skillData } = await supabase
          .from('jobs')
          .select('skills_must, skills_nice')
          .eq('status', 'open');

        if (skillData) {
          const allSkills = new Set<string>();
          skillData.forEach(job => {
            [...(job.skills_must || []), ...(job.skills_nice || [])].forEach(skill => {
              if (skill.toLowerCase().includes(query)) {
                allSkills.add(skill);
              }
            });
          });
          Array.from(allSkills).slice(0, 5).forEach(skill => {
            newSuggestions.push({ type: 'skill', value: skill });
          });
        }

        // Fetch companies
        const { data: companyData } = await supabase
          .from('jobs')
          .select('company_name')
          .ilike('company_name', `%${query}%`)
          .eq('status', 'open')
          .not('company_name', 'is', null)
          .limit(5);

        if (companyData) {
          const uniqueCompanies = Array.from(new Set(companyData.map(j => j.company_name).filter(Boolean)));
          uniqueCompanies.forEach(company => {
            newSuggestions.push({ type: 'company', value: company as string });
          });
        }

        // Fetch locations
        const { data: locationData } = await supabase
          .from('jobs')
          .select('location')
          .ilike('location', `%${query}%`)
          .eq('status', 'open')
          .not('location', 'is', null)
          .limit(5);

        if (locationData) {
          const uniqueLocations = Array.from(new Set(locationData.map(j => j.location).filter(Boolean)));
          uniqueLocations.forEach(location => {
            newSuggestions.push({ type: 'location', value: location as string });
          });
        }

        setSuggestions(newSuggestions);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    };

    if (value.length >= 1) {
      const timeout = setTimeout(fetchSuggestions, 150);
      return () => clearTimeout(timeout);
    } else {
      setSuggestions([]);
      setSelectedIndex(-1);
    }
  }, [value]);

  const handleSelect = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'skill') {
      onFilterAdd?.('skill', suggestion.value);
      onChange('');
    } else if (suggestion.type === 'location') {
      onFilterAdd?.('location', suggestion.value);
      onChange('');
    } else {
      onChange(suggestion.value);
      addToRecentSearches(suggestion.value);
    }
    setOpen(false);
  };

  const handleSearch = () => {
    if (value.trim()) {
      addToRecentSearches(value);
      // Trigger search (parent handles this via onChange)
    }
    setOpen(false);
  };

  const handleChipClick = (chipKey: string) => {
    const chip = QUICK_CHIPS[chipKey as keyof typeof QUICK_CHIPS];
    if (chip) {
      onFilterAdd?.(chip.type, chip.value);
    }
  };

  // Group suggestions by type
  const groupedSuggestions = {
    titles: suggestions.filter(s => s.type === 'title'),
    skills: suggestions.filter(s => s.type === 'skill'),
    companies: suggestions.filter(s => s.type === 'company'),
    locations: suggestions.filter(s => s.type === 'location'),
  };

  const hasAnySuggestions = Object.values(groupedSuggestions).some(arr => arr.length > 0);
  const showEmpty = value.length > 0 && !hasAnySuggestions;
  const showTrending = value.length === 0;

  // Flatten all items for keyboard navigation
  const allItems = [
    ...(showTrending ? recentSearches.map(s => ({ type: 'recent' as const, value: s })) : []),
    ...groupedSuggestions.titles,
    ...groupedSuggestions.skills,
    ...groupedSuggestions.companies,
    ...groupedSuggestions.locations,
  ];

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      // Store original query on first arrow down
      if (selectedIndex === -1) {
        setOriginalQuery(value);
      }
      setSelectedIndex(prev => {
        const newIndex = prev < allItems.length - 1 ? prev + 1 : prev;
        // Preview the selected item without triggering parent onChange
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
          setOpen(false);
        } else {
          handleSelect(selectedItem);
        }
      } else {
        handleSearch();
      }
      setPreviewValue('');
      setOriginalQuery('');
    } else if (e.key === 'Escape') {
      setOpen(false);
      setSelectedIndex(-1);
      setPreviewValue('');
      setOriginalQuery('');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <div
          className="relative"
          role="combobox"
          aria-expanded={open}
          onMouseDown={(e) => {
            // Prevent Radix from toggling the popover on press
            e.preventDefault();
            if (!open) setOpen(true);
            // Ensure input gets focus after preventing default
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
          onClick={(e) => {
            // Prevent the click from toggling the trigger closed
            e.preventDefault();
            if (!open) setOpen(true);
            inputRef.current?.focus();
          }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder || "Search jobs, skills, companies..."}
            value={previewValue || value}
            onChange={(e) => {
              onChange(e.target.value);
              setSelectedIndex(-1);
              setPreviewValue('');
              setOriginalQuery('');
              if (!open) setOpen(true);
            }}
            onFocus={() => {
              setOpen(true);
              setSelectedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[600px] p-0" 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command className="rounded-lg border-none shadow-lg">
          <CommandList className="max-h-[400px]">
            {showTrending && recentSearches.length > 0 && (
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
                      setOpen(false);
                    }}
                    className={cn(
                      "flex items-center justify-between group",
                      selectedIndex === idx
                        ? "bg-accent data-[selected=true]:bg-accent"
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

            {showEmpty && (
              <CommandEmpty>No results found.</CommandEmpty>
            )}

            {groupedSuggestions.titles.length > 0 && (
              <CommandGroup heading="Job Titles">
                {groupedSuggestions.titles.map((suggestion, idx) => {
                  const globalIdx = (showTrending ? recentSearches.length : 0) + idx;
                  return (
                    <CommandItem
                      key={`title-${idx}`}
                      value={suggestion.value}
                      onSelect={() => handleSelect(suggestion)}
                      onMouseEnter={() => {
                        setHoveredItem(`title-${idx}`);
                        setSelectedIndex(globalIdx);
                      }}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={cn(
                        "flex items-center justify-between",
                        selectedIndex === globalIdx
                          ? "bg-accent data-[selected=true]:bg-accent"
                          : "data-[selected=true]:bg-transparent data-[selected=true]:text-foreground"
                      )}
                    >
                      <span>{suggestion.value}</span>
                      {hoveredItem === `title-${idx}` && (
                        <div className="flex gap-1">
                          {Object.keys(QUICK_CHIPS).map((chip) => (
                            <Badge
                              key={chip}
                              variant="secondary"
                              className="cursor-pointer text-xs hover:bg-accent"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleChipClick(chip);
                              }}
                            >
                              {chip}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {groupedSuggestions.skills.length > 0 && (
              <CommandGroup heading="Skills">
                {groupedSuggestions.skills.map((suggestion, idx) => {
                  const globalIdx = (showTrending ? recentSearches.length : 0) + groupedSuggestions.titles.length + idx;
                  return (
                    <CommandItem
                      key={`skill-${idx}`}
                      value={suggestion.value}
                      onSelect={() => handleSelect(suggestion)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                       className={cn(
                         "flex items-center gap-2",
                         selectedIndex === globalIdx
                           ? "bg-accent data-[selected=true]:bg-accent"
                           : "data-[selected=true]:bg-transparent data-[selected=true]:text-foreground"
                       )}
                    >
                      <Badge variant="outline" className="text-xs">Skill</Badge>
                      <span>{suggestion.value}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {groupedSuggestions.companies.length > 0 && (
              <CommandGroup heading="Companies">
                {groupedSuggestions.companies.map((suggestion, idx) => {
                  const globalIdx = (showTrending ? recentSearches.length : 0) + groupedSuggestions.titles.length + groupedSuggestions.skills.length + idx;
                  return (
                    <CommandItem
                      key={`company-${idx}`}
                      value={suggestion.value}
                      onSelect={() => handleSelect(suggestion)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                       className={cn(
                         "relative",
                         selectedIndex === globalIdx
                           ? "bg-accent data-[selected=true]:bg-accent"
                           : "data-[selected=true]:bg-transparent data-[selected=true]:text-foreground"
                       )}
                    >
                      {suggestion.value}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {groupedSuggestions.locations.length > 0 && (
              <CommandGroup heading="Locations">
                {groupedSuggestions.locations.map((suggestion, idx) => {
                  const globalIdx = (showTrending ? recentSearches.length : 0) + groupedSuggestions.titles.length + groupedSuggestions.skills.length + groupedSuggestions.companies.length + idx;
                  return (
                    <CommandItem
                      key={`location-${idx}`}
                      value={suggestion.value}
                      onSelect={() => handleSelect(suggestion)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                       className={cn(
                         "flex items-center gap-2",
                         selectedIndex === globalIdx
                           ? "bg-accent data-[selected=true]:bg-accent"
                           : "data-[selected=true]:bg-transparent data-[selected=true]:text-foreground"
                       )}
                    >
                      <Badge variant="outline" className="text-xs">Location</Badge>
                      <span>{suggestion.value}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {value.length > 0 && hasAnySuggestions && (
              <CommandGroup>
                <CommandItem
                  onSelect={handleSearch}
                  className="border-t bg-muted/50 text-center font-medium"
                >
                  Press Enter to search all results for "{value}"
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
