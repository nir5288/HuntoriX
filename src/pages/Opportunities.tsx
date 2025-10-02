import { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from '@/components/Header';
import { OpportunityCard } from '@/components/OpportunityCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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

const PAGE_SIZE = 24;

const industries = ['Software/Tech', 'Biotech/Healthcare', 'Finance/Fintech', 'Energy/Cleantech', 'Public/Non-profit'];
const seniorities = ['junior', 'mid', 'senior', 'lead', 'exec'];
const employmentTypes = ['full_time', 'contract', 'temp'];
const currencies = ['ILS', 'USD', 'EUR', 'GBP', 'INR'];

const Opportunities = () => {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Search (debounced)
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Apply flow
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedJobTitle, setSelectedJobTitle] = useState<string>('');

  // Filters (raw)
  const [filterIndustry, setFilterIndustry] = useState<string[]>([]);
  const [filterLocation, setFilterLocation] = useState('');
  const [filterSalaryMin, setFilterSalaryMin] = useState('');
  const [filterSalaryMax, setFilterSalaryMax] = useState('');
  const [filterCurrency, setFilterCurrency] = useState('ILS');
  const [filterSeniority, setFilterSeniority] = useState('all');
  const [filterEmploymentType, setFilterEmploymentType] = useState('all');
  const [filterPosted, setFilterPosted] = useState('all');

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
      .select('*')
      .in('status', ['open', 'shortlisted', 'awarded'])
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

  // Fetch first page (or refreshed) set
  const fetchFirstPage = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    
    try {
      const q = buildBaseQuery();
      const { data, error } = await q.range(0, PAGE_SIZE - 1);
      if (error) throw error;
      setJobs(data || []);
      setHasMore((data?.length || 0) === PAGE_SIZE);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setJobs([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [buildBaseQuery]);

  // Load another page (append)
  const fetchNextPage = useCallback(async () => {
    if (!hasMore || pageLoading) return;
    setPageLoading(true);
    try {
      const from = jobs.length;
      const to = from + PAGE_SIZE - 1;
      const q = buildBaseQuery();
      const { data, error } = await q.range(from, to);
      if (error) throw error;
      const newItems = data || [];
      setJobs(prev => [...prev, ...newItems]);
      if (newItems.length < PAGE_SIZE) setHasMore(false);
    } catch (err) {
      console.error('Error fetching next page:', err);
    } finally {
      setPageLoading(false);
    }
  }, [jobs.length, hasMore, pageLoading, buildBaseQuery]);

  // Initial load
  useEffect(() => {
    fetchFirstPage(true);
  }, []);

  // On filter/search change (deps use *debounced* values)
  useEffect(() => {
    if (!loading) {
      fetchFirstPage(false);
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
            fetchFirstPage(); // re-fetch with current debounced filters
            pending = false;
          }, 300);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchFirstPage]);

  // Optional client-side fuzzy skill filter as a secondary pass
  const filteredJobs = useMemo(() => jobs, [jobs]);

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
  };

  const handleApply = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    setSelectedJobId(jobId);
    setSelectedJobTitle(job?.title || '');
    setApplyModalOpen(true);
  };

  const handleApplyClose = () => {
    setApplyModalOpen(false);
    // Refresh to reflect any application-side effects
    fetchFirstPage();
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
                    />
                  ))}
                </div>

                {/* Pagination - reserved space to prevent layout shift */}
                <div className="flex justify-center mt-8 h-12">
                  {hasMore && debouncedQuery === '' ? (
                    <Button onClick={fetchNextPage} disabled={pageLoading || isRefreshing}>
                      {pageLoading ? 'Loading...' : 'Load more'}
                    </Button>
                  ) : null}
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
