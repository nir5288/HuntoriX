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
import { Filter, Search } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { ApplyModal } from '@/components/ApplyModal';
import { OpportunitiesFilters } from '@/components/OpportunitiesFilters';
import { Switch } from '@/components/ui/switch';

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
  const { user, profile } = useAuth();
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
  const [filterIndustry, setFilterIndustry] = useState<string[]>(
    searchParams.get('industries')?.split(',').filter(Boolean) || []
  );
  const [filterLocation, setFilterLocation] = useState(searchParams.get('location') || '');
  const [filterSalaryMin, setFilterSalaryMin] = useState(searchParams.get('salaryMin') || '');
  const [filterSalaryMax, setFilterSalaryMax] = useState(searchParams.get('salaryMax') || '');
  const [filterCurrency, setFilterCurrency] = useState(searchParams.get('currency') || 'ILS');
  const [filterSeniority, setFilterSeniority] = useState(searchParams.get('seniority') || 'all');
  const [filterEmploymentType, setFilterEmploymentType] = useState(searchParams.get('employmentType') || 'all');
  const [filterPosted, setFilterPosted] = useState(searchParams.get('posted') || 'all');
  
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

  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) {
        setPreferencesLoaded(true);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('sort_preference, show_applied_jobs')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading preferences:', error);
        setPreferencesLoaded(true);
        return;
      }

      if (data) {
        // Use URL params if present, otherwise use saved preferences from DB, fallback to localStorage
        const urlSort = searchParams.get('sort');
        const urlShowApplied = searchParams.get('showApplied');
        
        setSortBy((urlSort as any) || data.sort_preference || 'recent');
        if (urlShowApplied) {
          const showApplied = urlShowApplied === 'true';
          setShowAppliedJobs(showApplied);
          localStorage.setItem('showAppliedJobs', showApplied.toString());
        } else if (data.show_applied_jobs !== null) {
          setShowAppliedJobs(data.show_applied_jobs);
          localStorage.setItem('showAppliedJobs', data.show_applied_jobs.toString());
        }
      }
      
      setPreferencesLoaded(true);
    };

    loadPreferences();
  }, [user]);

  // Fetch applied jobs for current user
  useEffect(() => {
    const fetchAppliedJobs = async () => {
      if (!user || profile?.role !== 'headhunter') {
        setAppliedJobIds(new Set());
        return;
      }
      
      const { data, error } = await supabase
        .from('applications')
        .select('job_id')
        .eq('headhunter_id', user.id);
      
      if (error) {
        console.error('Error fetching applied jobs:', error);
        return;
      }
      
      setAppliedJobIds(new Set(data.map(app => app.job_id)));
    };
    
    fetchAppliedJobs();
  }, [user, profile]);

  // Build base query with *debounced* filters
  const buildBaseQuery = useCallback(() => {
    let q = supabase
      .from('jobs')
      .select('*', { count: 'exact' })
      .in('status', ['open', 'shortlisted', 'awarded'])
      .eq('visibility', 'public');
    
    // Filter out applied jobs at database level if needed
    if (!showAppliedJobs && user && profile?.role === 'headhunter' && appliedJobIds.size > 0) {
      q = q.not('id', 'in', `(${Array.from(appliedJobIds).join(',')})`);
    }
    
    // Sort order
    if (sortBy === 'recent') {
      q = q.order('created_at', { ascending: false });
    } else {
      // For relevance, still order by created_at but we can enhance this later
      q = q.order('created_at', { ascending: false });
    }

    // Industry
    if (filterIndustry.length > 0) {
      q = q.in('industry', filterIndustry);
    }

    // Seniority
    if (filterSeniority !== 'all') {
      q = q.eq('seniority', filterSeniority as any);
    }

    // Employment type
    if (filterEmploymentType !== 'all') {
      q = q.eq('employment_type', filterEmploymentType as any);
    }

    // Location (partial, debounced)
    if (debouncedLocation) {
      q = q.ilike('location', `%${debouncedLocation}%`);
    }

    // Salary range + currency (overlap logic, debounced)
    if ((debouncedSalaryMin || debouncedSalaryMax) && filterCurrency) {
      const min = Number(debouncedSalaryMin) || 0;
      const max = Number(debouncedSalaryMax) || Number.MAX_SAFE_INTEGER;
      // Overlap: job_max >= min AND job_min <= max
      q = q
        .eq('budget_currency', filterCurrency)
        .gte('budget_max', min)
        .lte('budget_min', max);
    }

    // Posted window
    if (filterPosted !== 'all') {
      const now = new Date();
      const cutoff = new Date(now);
      if (filterPosted === '24h') cutoff.setDate(now.getDate() - 1);
      if (filterPosted === '7d') cutoff.setDate(now.getDate() - 7);
      if (filterPosted === '30d') cutoff.setDate(now.getDate() - 30);
      q = q.gte('created_at', cutoff.toISOString());
    }

    // Search on title/industry (DB query only - array search done client-side)
    if (debouncedQuery) {
      q = q.or(`title.ilike.%${debouncedQuery}%,industry.ilike.%${debouncedQuery}%`);
    }

    return q;
  }, [
    filterIndustry,
    filterSeniority,
    filterEmploymentType,
    filterPosted,
    filterCurrency,
    debouncedLocation,
    debouncedSalaryMin,
    debouncedSalaryMax,
    debouncedQuery,
    sortBy,
    showAppliedJobs,
    appliedJobIds,
    user,
    profile
  ]);

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

      const excludeIds = (!showAppliedJobs && user && profile?.role === 'headhunter' && appliedJobIds.size > 0)
        ? Array.from(appliedJobIds)
        : null;

      const useCurrency = Boolean((debouncedSalaryMin || debouncedSalaryMax) && filterCurrency);

      const { data, error } = await supabase.rpc('search_jobs', {
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
        p_sort: sortBy,
        p_limit: PAGE_SIZE,
        p_offset: from,
      });

      if (error) throw error;

      const mapped = (data || []).map((row: any) => row.job_data as Job);
      setJobs(mapped);
      setTotalCount((data && data[0]) ? Number(data[0].total_count) : 0);
      
      // Update URL params
      const params = new URLSearchParams();
      params.set('page', page.toString());
      if (searchQuery) params.set('q', searchQuery);
      if (filterIndustry.length > 0) params.set('industries', filterIndustry.join(','));
      if (filterLocation) params.set('location', filterLocation);
      if (filterSalaryMin) params.set('salaryMin', filterSalaryMin);
      if (filterSalaryMax) params.set('salaryMax', filterSalaryMax);
      if (filterCurrency !== 'ILS') params.set('currency', filterCurrency);
      if (filterSeniority !== 'all') params.set('seniority', filterSeniority);
      if (filterEmploymentType !== 'all') params.set('employmentType', filterEmploymentType);
      if (filterPosted !== 'all') params.set('posted', filterPosted);
      if (sortBy !== 'recent') params.set('sort', sortBy);
      if (showAppliedJobs) params.set('showApplied', 'true');
      setSearchParams(params, { replace: true });
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setJobs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [buildBaseQuery, searchQuery, filterIndustry, filterLocation, filterSalaryMin, filterSalaryMax, filterCurrency, filterSeniority, filterEmploymentType, filterPosted, setSearchParams]);

  // Initial load - use page from URL (wait for preferences to load)
  useEffect(() => {
    if (preferencesLoaded && appliedJobIds !== undefined) {
      fetchPage(currentPage, true);
    }
  }, [preferencesLoaded, appliedJobIds]);

  // On filter/search change (deps use *debounced* values) - reset to page 1
  useEffect(() => {
    if (!loading && preferencesLoaded) {
      fetchPage(1, false);
    }
  }, [
    filterIndustry,
    filterSeniority,
    filterEmploymentType,
    filterPosted,
    filterCurrency,
    debouncedLocation,
    debouncedSalaryMin,
    debouncedSalaryMax,
    debouncedQuery,
    sortBy,
    showAppliedJobs
  ]);

  // Realtime: throttle bursts
  useEffect(() => {
    let pending = false;
    const channel = supabase
      .channel('jobs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
        if (!pending) {
          pending = true;
          setTimeout(() => {
            fetchPage(currentPage); // re-fetch current page
            pending = false;
          }, 300);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPage, currentPage]);

  // Client-side filter for skills (case-insensitive partial match)
  const filteredJobs = useMemo(() => {
    if (!debouncedQuery) return jobs;
    
    const query = debouncedQuery.toLowerCase();
    return jobs.filter(job => {
      // Already matched by DB query (title/industry), so include those
      const titleMatch = job.title?.toLowerCase().includes(query);
      const industryMatch = job.industry?.toLowerCase().includes(query);
      
      // Check skills arrays for partial match
      const skillsMatch = [
        ...(job.skills_must || []),
        ...(job.skills_nice || [])
      ].some(skill => skill.toLowerCase().includes(query));
      
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
    setFilterSeniority('all');
    setFilterEmploymentType('all');
    setFilterPosted('all');
    setSearchQuery('');
    setSortBy('recent');
    setShowAppliedJobs(true);
    localStorage.setItem('showAppliedJobs', 'true');
    
    // Save to database if user is logged in
    if (user) {
      await supabase
        .from('profiles')
        .update({ show_applied_jobs: true, sort_preference: 'recent' })
        .eq('id', user.id);
    }
    
    setSearchParams({}, { replace: true });
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
    setFilterIndustry(prev => 
      prev.includes(industry) ? prev.filter(i => i !== industry) : [...prev, industry]
    );
  };

  const handleSkillClick = (skill: string) => {
    setSearchQuery(skill);
  };

  // Save sort preference
  const handleSortChange = async (value: 'recent' | 'relevance') => {
    setSortBy(value);
    
    if (user) {
      await supabase
        .from('profiles')
        .update({ sort_preference: value })
        .eq('id', user.id);
    }
  };

  // Save show applied preference
  const handleShowAppliedChange = async (checked: boolean) => {
    setShowAppliedJobs(checked);
    localStorage.setItem('showAppliedJobs', checked.toString());
    
    if (user) {
      await supabase
        .from('profiles')
        .update({ show_applied_jobs: checked })
        .eq('id', user.id);
    }
  };

  // Filters extracted into <OpportunitiesFilters /> component to prevent remounting and focus loss.


  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-[hsl(var(--surface))] to-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[hsl(var(--accent-pink))] via-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] bg-clip-text text-transparent">
            Browse Opportunities
          </h1>

          {/* Search + Mobile Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, skills, or industry..."
                className="pl-10"
              />
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
                  <OpportunitiesFilters
                    industries={industries}
                    seniorities={seniorities}
                    employmentTypes={employmentTypes}
                    currencies={currencies}
                    filterIndustry={filterIndustry}
                    setFilterIndustry={setFilterIndustry}
                    filterLocation={filterLocation}
                    setFilterLocation={setFilterLocation}
                    filterSalaryMin={filterSalaryMin}
                    setFilterSalaryMin={setFilterSalaryMin}
                    filterSalaryMax={filterSalaryMax}
                    setFilterSalaryMax={setFilterSalaryMax}
                    filterCurrency={filterCurrency}
                    setFilterCurrency={setFilterCurrency}
                    filterSeniority={filterSeniority}
                    setFilterSeniority={setFilterSeniority}
                    filterEmploymentType={filterEmploymentType}
                    setFilterEmploymentType={setFilterEmploymentType}
                    filterPosted={filterPosted}
                    setFilterPosted={setFilterPosted}
                    resetFilters={resetFilters}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Sort and Applied Jobs Filter */}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Sort by:</Label>
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
              <div className="flex items-center gap-2">
                <Switch
                  id="show-applied"
                  checked={showAppliedJobs}
                  onCheckedChange={handleShowAppliedChange}
                />
                <Label htmlFor="show-applied" className="text-sm font-medium cursor-pointer">
                  Show applied jobs
                </Label>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filters */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-8 bg-card rounded-2xl border p-6">
              <h3 className="font-semibold mb-4">Filters</h3>
              <OpportunitiesFilters
                industries={industries}
                seniorities={seniorities}
                employmentTypes={employmentTypes}
                currencies={currencies}
                filterIndustry={filterIndustry}
                setFilterIndustry={setFilterIndustry}
                filterLocation={filterLocation}
                setFilterLocation={setFilterLocation}
                filterSalaryMin={filterSalaryMin}
                setFilterSalaryMin={setFilterSalaryMin}
                filterSalaryMax={filterSalaryMax}
                setFilterSalaryMax={setFilterSalaryMax}
                filterCurrency={filterCurrency}
                setFilterCurrency={setFilterCurrency}
                filterSeniority={filterSeniority}
                setFilterSeniority={setFilterSeniority}
                filterEmploymentType={filterEmploymentType}
                setFilterEmploymentType={setFilterEmploymentType}
                filterPosted={filterPosted}
                setFilterPosted={setFilterPosted}
                resetFilters={resetFilters}
              />
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-80 bg-card rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : filteredJobs.length === 0 && !isRefreshing ? (
              <div className="bg-gradient-to-br from-[hsl(var(--accent-pink))]/10 via-[hsl(var(--accent-mint))]/10 to-[hsl(var(--accent-lilac))]/10 rounded-2xl p-12 text-center">
                <h3 className="text-2xl font-semibold mb-2">No opportunities match your filters</h3>
                <p className="text-muted-foreground mb-6">Try adjusting your search criteria</p>
                <Button onClick={resetFilters} variant="outline">
                  Reset Filters
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredJobs.map(job => (
                    <OpportunityCard
                      key={job.id}
                      job={job}
                      currentUser={user}
                      currentUserRole={profile?.role}
                      onApply={handleApply}
                      onIndustryClick={handleIndustryClick}
                      onSkillClick={handleSkillClick}
                    />
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex justify-center items-center mt-8 gap-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => currentPage > 1 && fetchPage(currentPage - 1)}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      <PaginationItem>
                        <span className="text-sm font-medium px-4">
                          {currentPage}/{totalPages}
                        </span>
                      </PaginationItem>
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => currentPage < totalPages && fetchPage(currentPage + 1)}
                          className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {selectedJobId && (
        <ApplyModal
          open={applyModalOpen}
          onOpenChange={(open) => {
            if (!open) {
              handleApplyClose();
            } else {
              setApplyModalOpen(true);
            }
          }}
          onSuccess={() => handleApplyClose(true)}
          jobId={selectedJobId}
          jobTitle={selectedJobTitle}
          headhunterId={user?.id || ''}
        />
      )}
    </div>
  );
};

export default Opportunities;
