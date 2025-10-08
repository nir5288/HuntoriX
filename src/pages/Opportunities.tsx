import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { OpportunityCard } from '@/components/OpportunityCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { supabase } from '@/integrations/supabase/client';
import { Filter, Search, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { ApplyModal } from '@/components/ApplyModal';
import { OpportunitiesFilters } from '@/components/OpportunitiesFilters';
import { Switch } from '@/components/ui/switch';
import { SearchAutocomplete } from '@/components/SearchAutocomplete';
import { Badge } from '@/components/ui/badge';
import { PromotionalBanner } from '@/components/PromotionalBanner';
type Job = {
  id: string;
  title: string;
  description: string;
  industry: string | null;
  location: string | null;
  employment_type: string | null;
  seniority: string | null;
  skills_must: string[] | null;
  skills_nice: string[] | null;
  budget_currency: string | null;
  budget_min: number | null;
  budget_max: number | null;
  status: string | null;
  created_by: string;
  created_at: string;
};
const PAGE_SIZE = 12;
const industries = ['Software/Tech', 'Biotech/Healthcare', 'Finance/Fintech', 'Energy/Cleantech', 'Public/Non-profit'];
const seniorities = ['junior', 'mid', 'senior', 'lead', 'exec'];
const employmentTypes = ['full_time', 'contract', 'temp'];
const currencies = ['ILS', 'USD', 'EUR', 'GBP', 'INR'];
const Opportunities = () => {
  const {
    user,
    profile
  } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Initialize from URL params
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  // Search (debounced) - initialize from URL
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Apply flow
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedJobTitle, setSelectedJobTitle] = useState<string>('');

  // Filters (raw) - initialize from URL
  const [filterIndustry, setFilterIndustry] = useState<string[]>(searchParams.get('industries')?.split(',').filter(Boolean) || []);
  const [filterLocation, setFilterLocation] = useState(searchParams.get('location') || '');
  const [filterSalaryMin, setFilterSalaryMin] = useState(searchParams.get('salaryMin') || '');
  const [filterSalaryMax, setFilterSalaryMax] = useState(searchParams.get('salaryMax') || '');
  const [filterCurrency, setFilterCurrency] = useState(searchParams.get('currency') || 'ILS');
  const [filterSalaryPeriod, setFilterSalaryPeriod] = useState(searchParams.get('salaryPeriod') || 'monthly');
  const [filterSeniority, setFilterSeniority] = useState(searchParams.get('seniority') || 'all');
  const [filterEmploymentType, setFilterEmploymentType] = useState(searchParams.get('employmentType') || 'all');
  const [filterPosted, setFilterPosted] = useState(searchParams.get('posted') || 'all');
  const [filterExclusive, setFilterExclusive] = useState(searchParams.get('exclusive') === 'true');

  // Check if user has Huntorix subscription
  const [hasHuntorix, setHasHuntorix] = useState(false);

  // Sort and applied filters - initialize from localStorage first
  const [sortBy, setSortBy] = useState<'recent' | 'relevance'>('recent');
  const [showAppliedJobs, setShowAppliedJobs] = useState(() => {
    const saved = localStorage.getItem('showAppliedJobs');
    return saved === null ? true : saved === 'true';
  });
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Debounced mirrors (to avoid re-fetching on every keystroke)
  const [debouncedLocation, setDebouncedLocation] = useState('');
  const [debouncedSalaryMin, setDebouncedSalaryMin] = useState('');
  const [debouncedSalaryMax, setDebouncedSalaryMax] = useState('');

  // Active filter chips from autocomplete
  const [activeFilterChips, setActiveFilterChips] = useState<Array<{
    type: string;
    value: string;
    label: string;
  }>>([]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Debounce location
  useEffect(() => {
    const t = setTimeout(() => setDebouncedLocation(filterLocation.trim()), 300);
    return () => clearTimeout(t);
  }, [filterLocation]);

  // Debounce salary min/max
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSalaryMin(filterSalaryMin), 300);
    return () => clearTimeout(t);
  }, [filterSalaryMin]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSalaryMax(filterSalaryMax), 300);
    return () => clearTimeout(t);
  }, [filterSalaryMax]);

  // Load user preferences and check Huntorix subscription
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) {
        setPreferencesLoaded(true);
        return;
      }
      const {
        data,
        error
      } = await supabase.from('profiles').select('sort_preference, show_applied_jobs').eq('id', user.id).single();
      if (error) {
        console.error('Error loading preferences:', error);
        setPreferencesLoaded(true);
        return;
      }
      if (data) {
        // Use URL params if present, otherwise use saved preferences from DB, fallback to localStorage
        const urlSort = searchParams.get('sort');
        const urlShowApplied = searchParams.get('showApplied');
        setSortBy(urlSort as any || data.sort_preference || 'recent');
        if (urlShowApplied) {
          const showApplied = urlShowApplied === 'true';
          setShowAppliedJobs(showApplied);
          localStorage.setItem('showAppliedJobs', showApplied.toString());
        } else if (data.show_applied_jobs !== null) {
          setShowAppliedJobs(data.show_applied_jobs);
          localStorage.setItem('showAppliedJobs', data.show_applied_jobs.toString());
        }
      }

      // Check if user has Huntorix subscription
      if (profile?.role === 'headhunter') {
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('plan_id, subscription_plans(name)')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();
        
        if (subscription?.subscription_plans?.name === 'Huntorix') {
          setHasHuntorix(true);
        }
      }

      setPreferencesLoaded(true);
    };
    loadPreferences();
  }, [user, profile]);

  // Fetch applied jobs for current user
  useEffect(() => {
    const fetchAppliedJobs = async () => {
      if (!user || profile?.role !== 'headhunter') {
        setAppliedJobIds(new Set());
        return;
      }
      const {
        data,
        error
      } = await supabase.from('applications').select('job_id').eq('headhunter_id', user.id);
      if (error) {
        console.error('Error fetching applied jobs:', error);
        return;
      }
      setAppliedJobIds(new Set(data.map(app => app.job_id)));
    };
    fetchAppliedJobs();
  }, [user, profile]);

  // Fetch page with count
  const fetchPage = useCallback(async (page: number, isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    try {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Use backend function for robust search (title, industry, skills)
      const now = new Date();
      let postedCutoff: string | null = null;
      if (filterPosted !== 'all') {
        const cutoff = new Date(now);
        if (filterPosted === '24h') cutoff.setDate(now.getDate() - 1);
        if (filterPosted === '7d') cutoff.setDate(now.getDate() - 7);
        if (filterPosted === '30d') cutoff.setDate(now.getDate() - 30);
        postedCutoff = cutoff.toISOString();
      }
      const excludeIds = !showAppliedJobs && user && profile?.role === 'headhunter' && appliedJobIds.size > 0 ? Array.from(appliedJobIds) : null;
      const useCurrency = Boolean((debouncedSalaryMin || debouncedSalaryMax) && filterCurrency);
      const {
        data,
        error
      } = await supabase.rpc('search_jobs', {
        p_query: debouncedQuery || null,
        p_status: ['open', 'shortlisted', 'awarded'],
        p_visibility: 'public',
        p_industries: filterIndustry.length > 0 ? filterIndustry : null,
        p_seniority: filterSeniority !== 'all' ? filterSeniority : null,
        p_employment_type: filterEmploymentType !== 'all' ? filterEmploymentType : null,
        p_location: debouncedLocation || null,
        p_budget_currency: useCurrency ? filterCurrency : null,
        p_budget_min: debouncedSalaryMin ? Number(debouncedSalaryMin) : null,
        p_budget_max: debouncedSalaryMax ? Number(debouncedSalaryMax) : null,
        p_posted_cutoff: postedCutoff,
        p_exclude_job_ids: excludeIds,
        p_is_exclusive: filterExclusive && hasHuntorix ? true : null,
        p_sort: sortBy,
        p_limit: PAGE_SIZE,
        p_offset: from
      });
      if (error) throw error;
      const mapped = (data || []).map((row: any) => row.job_data as Job);
      setJobs(mapped);
      setTotalCount(data && data[0] ? Number(data[0].total_count) : 0);

      // Update URL params (don't include in dependency to avoid loops)
      const params = new URLSearchParams();
      params.set('page', page.toString());
      if (searchQuery) params.set('q', searchQuery);
      if (filterIndustry.length > 0) params.set('industries', filterIndustry.join(','));
      if (filterLocation) params.set('location', filterLocation);
      if (filterSalaryMin) params.set('salaryMin', filterSalaryMin);
      if (filterSalaryMax) params.set('salaryMax', filterSalaryMax);
      if (filterCurrency !== 'ILS') params.set('currency', filterCurrency);
      if (filterSalaryPeriod !== 'yearly') params.set('salaryPeriod', filterSalaryPeriod);
      if (filterSeniority !== 'all') params.set('seniority', filterSeniority);
      if (filterEmploymentType !== 'all') params.set('employmentType', filterEmploymentType);
      if (filterPosted !== 'all') params.set('posted', filterPosted);
      if (filterExclusive) params.set('exclusive', 'true');
      if (sortBy !== 'recent') params.set('sort', sortBy);
      if (showAppliedJobs) params.set('showApplied', 'true');
      setSearchParams(params, {
        replace: true
      });
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setJobs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery, filterIndustry, filterLocation, filterSalaryMin, filterSalaryMax, filterCurrency, filterSeniority, filterEmploymentType, filterPosted, filterExclusive, debouncedQuery, debouncedLocation, debouncedSalaryMin, debouncedSalaryMax, sortBy, showAppliedJobs, appliedJobIds, user, profile, hasHuntorix, setSearchParams]);

  // Initial load and page changes - use page from URL (wait for preferences to load)
  useEffect(() => {
    if (preferencesLoaded && appliedJobIds !== undefined) {
      fetchPage(currentPage, true);
    }
  }, [preferencesLoaded, currentPage]);

  // On filter/search change (deps use *debounced* values) - reset to page 1
  useEffect(() => {
    if (!preferencesLoaded) return;
    fetchPage(1, false);
  }, [
    filterIndustry,
    filterSeniority,
    filterEmploymentType,
    filterPosted,
    filterExclusive,
    filterCurrency,
    debouncedLocation,
    debouncedSalaryMin,
    debouncedSalaryMax,
    debouncedQuery,
    sortBy,
    showAppliedJobs,
  ]);

  // Realtime: throttle bursts
  useEffect(() => {
    let pending = false;
    const channel = supabase.channel('jobs-changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'jobs'
    }, () => {
      if (!pending) {
        pending = true;
        setTimeout(() => {
          fetchPage(currentPage); // re-fetch current page
          pending = false;
        }, 300);
      }
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPage, currentPage]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Client-side filter for skills (case-insensitive partial match)
  const filteredJobs = useMemo(() => {
    if (!debouncedQuery) return jobs;
    const query = debouncedQuery.toLowerCase();
    return jobs.filter(job => {
      // Already matched by DB query (title/industry), so include those
      const titleMatch = job.title?.toLowerCase().includes(query);
      const industryMatch = job.industry?.toLowerCase().includes(query);

      // Check skills arrays for partial match
      const skillsMatch = [...(job.skills_must || []), ...(job.skills_nice || [])].some(skill => skill.toLowerCase().includes(query));
      return titleMatch || industryMatch || skillsMatch;
    });
  }, [jobs, debouncedQuery]);

  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const resetFilters = async () => {
    setFilterIndustry([]);
    setFilterLocation('');
    setFilterSalaryMin('');
    setFilterSalaryMax('');
    setFilterCurrency('ILS');
    setFilterSalaryPeriod('yearly');
    setFilterSeniority('all');
    setFilterEmploymentType('all');
    setFilterPosted('all');
    setFilterExclusive(false);
    setSearchQuery('');
    setSortBy('recent');
    setShowAppliedJobs(true);
    setActiveFilterChips([]);
    localStorage.setItem('showAppliedJobs', 'true');

    // Save to database if user is logged in
    if (user) {
      await supabase.from('profiles').update({
        show_applied_jobs: true,
        sort_preference: 'recent'
      }).eq('id', user.id);
    }
    setSearchParams({}, {
      replace: true
    });
  };
  const handleApply = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    setSelectedJobId(jobId);
    setSelectedJobTitle(job?.title || '');
    setApplyModalOpen(true);
  };
  const handleApplyClose = (applied?: boolean) => {
    setApplyModalOpen(false);
    // If successfully applied, update local state immediately
    if (applied && selectedJobId) {
      setAppliedJobIds(prev => new Set([...prev, selectedJobId]));
    }
  };
  const handleIndustryClick = (industry: string) => {
    setFilterIndustry(prev => prev.includes(industry) ? prev.filter(i => i !== industry) : [...prev, industry]);
  };
  const handleSkillClick = (skill: string) => {
    setSearchQuery(skill);
  };

  // Save sort preference
  const handleSortChange = async (value: 'recent' | 'relevance') => {
    setSortBy(value);
    if (user) {
      await supabase.from('profiles').update({
        sort_preference: value
      }).eq('id', user.id);
    }
  };

  // Save show applied preference
  const handleShowAppliedChange = async (checked: boolean) => {
    setShowAppliedJobs(checked);
    localStorage.setItem('showAppliedJobs', checked.toString());
    if (user) {
      await supabase.from('profiles').update({
        show_applied_jobs: checked
      }).eq('id', user.id);
    }
  };

  // Handle filter additions from autocomplete
  const handleFilterAdd = (type: 'skill' | 'location' | 'seniority' | 'industry' | 'remote', value: string) => {
    if (type === 'skill') {
      // Add skill to search query
      setSearchQuery(value);
      setActiveFilterChips(prev => [...prev, {
        type: 'skill',
        value,
        label: value
      }]);
    } else if (type === 'location') {
      setFilterLocation(value);
      setActiveFilterChips(prev => [...prev, {
        type: 'location',
        value,
        label: value
      }]);
    } else if (type === 'seniority') {
      setFilterSeniority(value);
      setActiveFilterChips(prev => [...prev, {
        type: 'seniority',
        value,
        label: value
      }]);
    } else if (type === 'industry') {
      if (!filterIndustry.includes(value)) {
        setFilterIndustry(prev => [...prev, value]);
        setActiveFilterChips(prev => [...prev, {
          type: 'industry',
          value,
          label: value
        }]);
      }
    } else if (type === 'remote') {
      setFilterLocation('remote');
      setActiveFilterChips(prev => [...prev, {
        type: 'remote',
        value: 'remote',
        label: 'Remote'
      }]);
    }
  };
  const removeFilterChip = (index: number) => {
    const chip = activeFilterChips[index];
    if (chip.type === 'skill') {
      setSearchQuery('');
    } else if (chip.type === 'location' || chip.type === 'remote') {
      setFilterLocation('');
    } else if (chip.type === 'seniority') {
      setFilterSeniority('all');
    } else if (chip.type === 'industry') {
      setFilterIndustry(prev => prev.filter(i => i !== chip.value));
    }
    setActiveFilterChips(prev => prev.filter((_, i) => i !== index));
  };

  // Filters extracted into <OpportunitiesFilters /> component to prevent remounting and focus loss.

  return <div className="min-h-screen bg-gradient-to-b from-background via-[hsl(var(--surface))] to-background contain-layout contain-paint">
      <Header />
      <PromotionalBanner location="opportunities_top" />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          

          {/* Search + Mobile Filters */}
          <div className="flex gap-4 items-center justify-center">
            <div className="w-full max-w-[50%]">
              <SearchAutocomplete value={searchQuery} onChange={setSearchQuery} onFilterAdd={handleFilterAdd} placeholder="Search jobs, skills, companies..." />
              
              {/* Active filter chips */}
              {activeFilterChips.length > 0 && <div className="flex flex-wrap gap-2 mt-3">
                  {activeFilterChips.map((chip, idx) => <Badge key={idx} variant="secondary" className="pl-3 pr-1 py-1 flex items-center gap-1">
                      {chip.label}
                      <Button variant="ghost" size="sm" className="h-4 w-4 p-0 hover:bg-transparent" onClick={() => removeFilterChip(idx)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>)}
                </div>}
            </div>


            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="md:hidden">
                  <Filter className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <OpportunitiesFilters industries={industries} seniorities={seniorities} employmentTypes={employmentTypes} currencies={currencies} filterIndustry={filterIndustry} setFilterIndustry={setFilterIndustry} filterLocation={filterLocation} setFilterLocation={setFilterLocation} filterSalaryMin={filterSalaryMin} setFilterSalaryMin={setFilterSalaryMin} filterSalaryMax={filterSalaryMax} setFilterSalaryMax={setFilterSalaryMax} filterCurrency={filterCurrency} setFilterCurrency={setFilterCurrency} filterSalaryPeriod={filterSalaryPeriod} setFilterSalaryPeriod={setFilterSalaryPeriod} filterSeniority={filterSeniority} setFilterSeniority={setFilterSeniority} filterEmploymentType={filterEmploymentType} setFilterEmploymentType={setFilterEmploymentType} filterPosted={filterPosted} setFilterPosted={setFilterPosted} filterExclusive={filterExclusive} setFilterExclusive={setFilterExclusive} hasHuntorix={hasHuntorix} resetFilters={resetFilters} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex gap-8 items-start">
          {/* Desktop Filters */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="mt-9 bg-card rounded-2xl border p-6">
              <h3 className="font-semibold mb-4">Filters</h3>

              {/* Sort by filter */}
              <div className="flex items-center gap-2 mb-4 whitespace-nowrap">
                <Label className="text-sm font-medium shrink-0">Sort by:</Label>
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="relevance">Relevance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {user && profile?.role === 'headhunter' && (
                <div className="flex items-center gap-2 mb-6">
                  <Switch id="show-applied" checked={showAppliedJobs} onCheckedChange={handleShowAppliedChange} />
                  <Label htmlFor="show-applied" className="text-sm font-medium cursor-pointer">
                    Show applied jobs
                  </Label>
                </div>
              )}
              
            <OpportunitiesFilters industries={industries} seniorities={seniorities} employmentTypes={employmentTypes} currencies={currencies} filterIndustry={filterIndustry} setFilterIndustry={setFilterIndustry} filterLocation={filterLocation} setFilterLocation={setFilterLocation} filterSalaryMin={filterSalaryMin} setFilterSalaryMin={setFilterSalaryMin} filterSalaryMax={filterSalaryMax} setFilterSalaryMax={setFilterSalaryMax} filterCurrency={filterCurrency} setFilterCurrency={setFilterCurrency} filterSalaryPeriod={filterSalaryPeriod} setFilterSalaryPeriod={setFilterSalaryPeriod} filterSeniority={filterSeniority} setFilterSeniority={setFilterSeniority} filterEmploymentType={filterEmploymentType} setFilterEmploymentType={setFilterEmploymentType} filterPosted={filterPosted} setFilterPosted={setFilterPosted} filterExclusive={filterExclusive} setFilterExclusive={setFilterExclusive} hasHuntorix={hasHuntorix} resetFilters={resetFilters} />
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1">
            {/* Job count */}
            <div className="mb-4 flex justify-end">
              <p className="text-sm text-muted-foreground">
                {totalCount} {totalCount === 1 ? 'job' : 'jobs'} found
              </p>
            </div>

            {loading ? <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                {[...Array(6)].map((_, i) => <div key={i} className="h-80 bg-card rounded-2xl animate-pulse" />)}
              </div> : filteredJobs.length === 0 && !isRefreshing ? <div className="bg-gradient-to-br from-[hsl(var(--accent-pink))]/10 via-[hsl(var(--accent-mint))]/10 to-[hsl(var(--accent-lilac))]/10 rounded-2xl p-12 text-center">
                <h3 className="text-2xl font-semibold mb-2">No opportunities match your filters</h3>
                <p className="text-muted-foreground mb-6">Try adjusting your search criteria</p>
                <Button onClick={resetFilters} variant="outline">
                  Reset Filters
                </Button>
              </div> : <>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredJobs.map(job => <OpportunityCard key={job.id} job={job} currentUser={user} currentUserRole={profile?.role} onApply={handleApply} onIndustryClick={handleIndustryClick} onSkillClick={handleSkillClick} />)}
                </div>

                {/* Pagination */}
                <div className="flex justify-center items-center mt-8 gap-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious onClick={() => currentPage > 1 && fetchPage(currentPage - 1)} className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
                      </PaginationItem>
                      
                      <PaginationItem>
                        <span className="text-sm font-medium px-4">
                          {currentPage}/{totalPages}
                        </span>
                      </PaginationItem>
                      
                      <PaginationItem>
                        <PaginationNext onClick={() => currentPage < totalPages && fetchPage(currentPage + 1)} className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </>}
          </div>
        </div>
      </div>

      {selectedJobId && <ApplyModal open={applyModalOpen} onOpenChange={open => {
      if (!open) {
        handleApplyClose();
      } else {
        setApplyModalOpen(true);
      }
    }} onSuccess={() => handleApplyClose(true)} jobId={selectedJobId} jobTitle={selectedJobTitle} headhunterId={user?.id || ''} />}
    </div>;
};
export default Opportunities;