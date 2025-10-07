import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

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
  return (
    <div className="space-y-6">
      {/* Industry */}
      <div>
        <Label>Industry</Label>
        <div className="mt-2 space-y-2">
          {industries.map((industry) => {
            const checked = filterIndustry.includes(industry);
            return (
              <label key={industry} className="flex items-center gap-2 cursor-pointer">
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
                  className="rounded border-border"
                />
                <span className="text-sm">{industry}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Location */}
      <div>
        <Label htmlFor="filter-location">Location</Label>
        <Input
          id="filter-location"
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
          placeholder="City or country"
          className="mt-2"
          autoComplete="off"
        />
      </div>

      {/* Salary Range */}
      <div>
        <Label>Salary Range</Label>
        <div className="mt-2 space-y-2">
          <Select value={filterCurrency} onValueChange={setFilterCurrency}>
            <SelectTrigger>
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
          <div className="flex gap-2">
            <Input
              type="number"
              value={filterSalaryMin}
              onChange={(e) => setFilterSalaryMin(e.target.value)}
              placeholder="Min"
              inputMode="numeric"
              autoComplete="off"
            />
            <Input
              type="number"
              value={filterSalaryMax}
              onChange={(e) => setFilterSalaryMax(e.target.value)}
              placeholder="Max"
              inputMode="numeric"
              autoComplete="off"
            />
          </div>
        </div>
      </div>

      {/* Seniority */}
      <div>
        <Label htmlFor="filter-seniority">Seniority</Label>
        <Select value={filterSeniority} onValueChange={setFilterSeniority}>
          <SelectTrigger id="filter-seniority" className="mt-2">
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
      <div>
        <Label htmlFor="filter-employment">Employment Type</Label>
        <Select value={filterEmploymentType} onValueChange={setFilterEmploymentType}>
          <SelectTrigger id="filter-employment" className="mt-2">
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
      <div>
        <Label htmlFor="filter-posted">Posted</Label>
        <Select value={filterPosted} onValueChange={setFilterPosted}>
          <SelectTrigger id="filter-posted" className="mt-2">
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

      {/* Exclusive Jobs - Only for Huntorix subscribers */}
      {hasHuntorix && (
        <div className="flex items-center justify-between">
          <Label htmlFor="filter-exclusive" className="cursor-pointer">
            Huntorix Exclusive
          </Label>
          <Switch
            id="filter-exclusive"
            checked={filterExclusive}
            onCheckedChange={setFilterExclusive}
          />
        </div>
      )}

      <Button variant="outline" onClick={resetFilters} className="w-full">
        Reset Filters
      </Button>
    </div>
  );
};
