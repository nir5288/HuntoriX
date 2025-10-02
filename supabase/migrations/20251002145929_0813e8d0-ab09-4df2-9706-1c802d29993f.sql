-- Add job_invitation to notification_type enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'job_invitation';