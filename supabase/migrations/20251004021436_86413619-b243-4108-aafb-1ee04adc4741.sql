-- Function to expose save counts for headhunters to all users without leaking PII
CREATE OR REPLACE FUNCTION public.get_saved_counts_for_headhunters(headhunter_ids uuid[])
RETURNS TABLE(headhunter_id uuid, saves_count integer)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sh.headhunter_id, COUNT(*)::int AS saves_count
  FROM public.saved_headhunters sh
  WHERE sh.headhunter_id = ANY (headhunter_ids)
  GROUP BY sh.headhunter_id;
$$;