-- Drop the old function and create a simpler one that returns jobs table type
DROP FUNCTION IF EXISTS public.search_jobs;

CREATE OR REPLACE FUNCTION public.search_jobs(
  p_query text DEFAULT NULL,
  p_status text[] DEFAULT ARRAY['open','shortlisted','awarded'],
  p_visibility text DEFAULT 'public',
  p_industries text[] DEFAULT NULL,
  p_seniority text DEFAULT NULL,
  p_employment_type text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_budget_currency text DEFAULT NULL,
  p_budget_min numeric DEFAULT NULL,
  p_budget_max numeric DEFAULT NULL,
  p_posted_cutoff timestamptz DEFAULT NULL,
  p_exclude_job_ids uuid[] DEFAULT NULL,
  p_sort text DEFAULT 'recent',
  p_limit int DEFAULT 12,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  job_data jsonb,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH base AS (
    SELECT j.*
    FROM public.jobs j
    WHERE j.visibility = p_visibility
      AND j.status = ANY (p_status)
      AND (p_exclude_job_ids IS NULL OR NOT (j.id = ANY (p_exclude_job_ids)))
      AND (p_industries IS NULL OR j.industry = ANY(p_industries))
      AND (p_seniority IS NULL OR j.seniority = p_seniority)
      AND (p_employment_type IS NULL OR j.employment_type = p_employment_type)
      AND (p_location IS NULL OR j.location ILIKE '%' || p_location || '%')
      AND (
        (p_budget_currency IS NULL) OR
        (j.budget_currency = p_budget_currency AND
         (p_budget_min IS NULL OR j.budget_max >= p_budget_min) AND
         (p_budget_max IS NULL OR j.budget_min <= p_budget_max)
        )
      )
      AND (p_posted_cutoff IS NULL OR j.created_at >= p_posted_cutoff)
      AND (
        p_query IS NULL OR p_query = '' OR
        j.title ILIKE '%' || p_query || '%' OR
        j.industry ILIKE '%' || p_query || '%' OR
        EXISTS (
          SELECT 1 FROM unnest(COALESCE(j.skills_must, ARRAY[]::text[])) s
          WHERE s ILIKE '%' || p_query || '%'
        ) OR
        EXISTS (
          SELECT 1 FROM unnest(COALESCE(j.skills_nice, ARRAY[]::text[])) s
          WHERE s ILIKE '%' || p_query || '%'
        )
      )
  ),
  counted AS (
    SELECT b.*, COUNT(*) OVER() AS cnt
    FROM base b
    ORDER BY CASE WHEN p_sort = 'recent' THEN b.created_at END DESC,
             b.created_at DESC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT 
    to_jsonb(c.*) - 'cnt' AS job_data,
    c.cnt AS total_count
  FROM counted c;
END;
$$;