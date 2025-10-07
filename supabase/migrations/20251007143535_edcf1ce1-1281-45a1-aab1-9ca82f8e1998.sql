-- Add is_exclusive parameter to search_jobs function
CREATE OR REPLACE FUNCTION public.search_jobs(
  p_query text DEFAULT NULL::text,
  p_status text[] DEFAULT ARRAY['open'::text, 'shortlisted'::text, 'awarded'::text],
  p_visibility text DEFAULT 'public'::text,
  p_industries text[] DEFAULT NULL::text[],
  p_seniority text DEFAULT NULL::text,
  p_employment_type text DEFAULT NULL::text,
  p_location text DEFAULT NULL::text,
  p_budget_currency text DEFAULT NULL::text,
  p_budget_min numeric DEFAULT NULL::numeric,
  p_budget_max numeric DEFAULT NULL::numeric,
  p_posted_cutoff timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_exclude_job_ids uuid[] DEFAULT NULL::uuid[],
  p_is_exclusive boolean DEFAULT NULL::boolean,
  p_sort text DEFAULT 'recent'::text,
  p_limit integer DEFAULT 12,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(job_data jsonb, total_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
      AND (p_is_exclusive IS NULL OR j.is_exclusive = p_is_exclusive)
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
$function$;