-- Add is_exclusive field to jobs table
ALTER TABLE jobs ADD COLUMN is_exclusive BOOLEAN NOT NULL DEFAULT false;

-- Add comment to document the field
COMMENT ON COLUMN jobs.is_exclusive IS 'Indicates if job is marked as exclusive to HuntoriX platform';