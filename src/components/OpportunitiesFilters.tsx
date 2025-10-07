import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Briefcase, 
  Clock, 
  Star,
  ChevronDown,
  RotateCcw
} from 'lucide-react';

interface OpportunitiesFiltersProps {
  industries: string[];
  seniorities: string[];
  employmentTypes: string[];
  currencies: string[];

  filterIndustry: string[];
  setFilterIndustry: React.Dispatch<React.SetStateAction<string[]>>;

  filterLocation: string;
  setFilterLocation: React.Dispatch<React.SetStateAction<string>>;

  filterSalaryMin: string;
  setFilterSalaryMin: React.Dispatch<React.SetStateAction<string>>;

  filterSalaryMax: string;
  setFilterSalaryMax: React.Dispatch<React.SetStateAction<string>>;

  filterCurrency: string;
  setFilterCurrency: (value: string) => void;

  filterSalaryPeriod: string;
  setFilterSalaryPeriod: (value: string) => void;

  filterSeniority: string;
  setFilterSeniority: (value: string) => void;

  filterEmploymentType: string;
  setFilterEmploymentType: (value: string) => void;

  filterPosted: string;
  setFilterPosted: (value: string) => void;

  filterExclusive: boolean;
  setFilterExclusive: (value: boolean) => void;

  hasHuntorix: boolean;

  resetFilters: () => void;
}

export const OpportunitiesFilters: React.FC<OpportunitiesFiltersProps> = ({
  industries,
  seniorities,
  employmentTypes,
  currencies,
  filterIndustry,
  setFilterIndustry,
  filterLocation,
  setFilterLocation,
  filterSalaryMin,
  setFilterSalaryMin,
  filterSalaryMax,
  setFilterSalaryMax,
  filterCurrency,
  setFilterCurrency,
  filterSalaryPeriod,
  setFilterSalaryPeriod,
  filterSeniority,
  setFilterSeniority,
  filterEmploymentType,
  setFilterEmploymentType,
  filterPosted,
  setFilterPosted,
  filterExclusive,
  setFilterExclusive,
  hasHuntorix,
  resetFilters,
}) => {
  const [industryOpen, setIndustryOpen] = React.useState(true);
  const [advancedOpen, setAdvancedOpen] = React.useState(false);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b">
        <h3 className="font-semibold text-lg">
          Filters
        </h3>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={resetFilters}
          className="h-9 px-3"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset All
        </Button>
      </div>

      {/* Huntorix Exclusive - Compact premium feature */}
      {hasHuntorix && (
        <div className="p-2.5 rounded-lg bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Star className="h-3.5 w-3.5 text-primary fill-primary" />
              <Label htmlFor="filter-exclusive" className="cursor-pointer font-medium text-xs">
                Exclusive Jobs
              </Label>
            </div>
            <Switch
              id="filter-exclusive"
              checked={filterExclusive}
              onCheckedChange={setFilterExclusive}
            />
          </div>
          <p className="text-[10px] text-primary/70 ml-5 mt-0.5 font-medium">
            Premium filter
          </p>
        </div>
      )}

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="filter-location" className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          Location
        </Label>
        <Input
          id="filter-location"
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
          placeholder="City, country, or remote"
          className="h-9"
          autoComplete="off"
        />
      </div>

      {/* Industry - Collapsible */}
      <Collapsible open={industryOpen} onOpenChange={setIndustryOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:text-foreground transition-colors">
            <div className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Industry
              {filterIndustry.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({filterIndustry.length} selected)
                </span>
              )}
            </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${industryOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          {industries.map((industry) => {
            const checked = filterIndustry.includes(industry);
            return (
              <label 
                key={industry} 
                className="flex items-center gap-2 cursor-pointer py-1.5 px-2 rounded-md hover:bg-accent/50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFilterIndustry((prev) => [...prev, industry]);
                    } else {
                      setFilterIndustry((prev) => prev.filter((i) => i !== industry));
                    }
                  }}
                  className="rounded border-border w-4 h-4"
                />
                <span className="text-sm">{industry}</span>
              </label>
            );
          })}
        </CollapsibleContent>
      </Collapsible>

      {/* Salary Range */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          Salary Range
        </Label>
        
        <div className="grid grid-cols-2 gap-2">
          <Select value={filterCurrency} onValueChange={setFilterCurrency}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((curr) => (
                <SelectItem key={curr} value={curr}>
                  {curr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filterSalaryPeriod} onValueChange={setFilterSalaryPeriod}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-3 pt-1">
          <div className="flex justify-between text-sm">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Minimum</span>
              <span className="font-medium">
                {filterSalaryMin ? `${filterCurrency} ${parseInt(filterSalaryMin).toLocaleString()}` : `${filterCurrency} 0`}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-muted-foreground">Maximum</span>
              <span className="font-medium">
                {filterSalaryMax ? `${filterCurrency} ${parseInt(filterSalaryMax).toLocaleString()}` : `${filterCurrency} 500K+`}
              </span>
            </div>
          </div>
          <Slider
            min={0}
            max={500000}
            step={5000}
            value={[
              filterSalaryMin ? parseInt(filterSalaryMin) : 0,
              filterSalaryMax ? parseInt(filterSalaryMax) : 500000
            ]}
            onValueChange={(values) => {
              setFilterSalaryMin(values[0] > 0 ? values[0].toString() : '');
              setFilterSalaryMax(values[1] < 500000 ? values[1].toString() : '');
            }}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{filterCurrency} 0</span>
            <span>{filterCurrency} 500,000+</span>
          </div>
        </div>
      </div>

      {/* Advanced Filters - Collapsible */}
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:text-foreground transition-colors">
          <Label className="text-sm font-medium cursor-pointer">
            Advanced Filters
          </Label>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-4">
          {/* Seniority */}
          <div className="space-y-2">
            <Label htmlFor="filter-seniority" className="flex items-center gap-2 text-sm font-medium">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              Seniority Level
            </Label>
            <Select value={filterSeniority} onValueChange={setFilterSeniority}>
              <SelectTrigger id="filter-seniority" className="h-9">
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                {seniorities.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Employment Type */}
          <div className="space-y-2">
            <Label htmlFor="filter-employment" className="flex items-center gap-2 text-sm font-medium">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              Employment Type
            </Label>
            <Select value={filterEmploymentType} onValueChange={setFilterEmploymentType}>
              <SelectTrigger id="filter-employment" className="h-9">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {employmentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === 'full_time' ? 'Full-time' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Posted Date */}
          <div className="space-y-2">
            <Label htmlFor="filter-posted" className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Date Posted
            </Label>
            <Select value={filterPosted} onValueChange={setFilterPosted}>
              <SelectTrigger id="filter-posted" className="h-9">
                <SelectValue placeholder="Any time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any time</SelectItem>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
