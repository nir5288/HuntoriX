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

  // Build base query with *debounced* filters
  const buildBaseQuery = useCallback(() => {
    let q = supabase
      .from('jobs')
      .select('*', { count: 'exact' })
      .in('status', ['open', 'shortlisted', 'awarded'])
      .eq('visibility', 'public')
      .order('created_at', { ascending: false });

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

    // Lightweight OR on title/industry (DB)
    if (debouncedQuery) {
      q = q.or(`title.ilike.%${debouncedQuery}%,industry.ilike.%${debouncedQuery}%`);
      // If you add pg_trgm/full-text in DB, swap for proper text search.
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
    debouncedQuery
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
      
      const q = buildBaseQuery();
      const { data, error, count } = await q.range(from, to);
      if (error) throw error;
      
      setJobs(data || []);
      setTotalCount(count || 0);
      
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

  // Initial load - use page from URL
  useEffect(() => {
    fetchPage(currentPage, true);
  }, []);

  // On filter/search change (deps use *debounced* values) - reset to page 1
  useEffect(() => {
    if (!loading) {
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
    debouncedQuery
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

  // Optional client-side fuzzy skill filter as a secondary pass
  const filteredJobs = useMemo(() => jobs, [jobs]);
  
  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const resetFilters = () => {
    setFilterIndustry([]);
    setFilterLocation('');
    setFilterSalaryMin('');
    setFilterSalaryMax('');
    setFilterCurrency('ILS');
    setFilterSeniority('all');
    setFilterEmploymentType('all');
    setFilterPosted('all');
    setSearchQuery('');
    setSearchParams({}, { replace: true });
  };

  const handleApply = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    setSelectedJobId(jobId);
    setSelectedJobTitle(job?.title || '');
    setApplyModalOpen(true);
  };

  const handleApplyClose = () => {
    setApplyModalOpen(false);
    // Real-time updates will handle state changes automatically
  };

  const handleIndustryClick = (industry: string) => {
    setFilterIndustry(prev => 
      prev.includes(industry) ? prev.filter(i => i !== industry) : [...prev, industry]
    );
  };

  const handleSkillClick = (skill: string) => {
    setSearchQuery(skill);
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
          jobId={selectedJobId}
          jobTitle={selectedJobTitle}
          headhunterId={user?.id || ''}
        />
      )}
    </div>
  );
};

export default Opportunities;
