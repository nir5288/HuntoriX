-- Create engagement status enum
CREATE TYPE public.engagement_status AS ENUM (
  'Proposed',
  'Active',
  'ShortlistDue',
  'Interviewing',
  'Offer',
  'Completed',
  'Closed',
  'Cancelled'
);

-- Create submission status enum
CREATE TYPE public.submission_status AS ENUM (
  'New',
  'Shortlisted',
  'Client-Interview',
  'Rejected',
  'Offer',
  'Hired'
);

-- Create milestone type enum
CREATE TYPE public.milestone_type AS ENUM (
  'Kickoff',
  'Shortlist',
  'Interview',
  'Offer',
  'Hire'
);

-- Create payment type enum
CREATE TYPE public.payment_type AS ENUM (
  'Deposit',
  'Success'
);

-- Create payment status enum
CREATE TYPE public.payment_status AS ENUM (
  'Pending',
  'Authorized',
  'Captured',
  'Refunded'
);

-- Create engagements table
CREATE TABLE public.engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  employer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  headhunter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status engagement_status NOT NULL DEFAULT 'Proposed',
  fee_model TEXT NOT NULL DEFAULT 'Percent',
  fee_amount NUMERIC NOT NULL,
  deposit_required BOOLEAN NOT NULL DEFAULT false,
  deposit_amount NUMERIC DEFAULT 0,
  candidate_cap INTEGER NOT NULL DEFAULT 5,
  start_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  due_at TIMESTAMP WITH TIME ZONE,
  sla_days INTEGER NOT NULL DEFAULT 3,
  notes TEXT,
  sow_confirmed_employer BOOLEAN DEFAULT false,
  sow_confirmed_headhunter BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(job_id, headhunter_id)
);

-- Create milestones table
CREATE TABLE public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
  type milestone_type NOT NULL,
  due_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create submissions table (candidates)
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT,
  candidate_phone TEXT,
  status submission_status NOT NULL DEFAULT 'New',
  cv_url TEXT,
  salary_expectation TEXT,
  notice_period TEXT,
  right_to_work BOOLEAN DEFAULT true,
  notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
  type payment_type NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status payment_status NOT NULL DEFAULT 'Pending',
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add engagement_id to messages table
ALTER TABLE public.messages ADD COLUMN engagement_id UUID REFERENCES public.engagements(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for engagements
CREATE POLICY "Engagements viewable by involved parties"
ON public.engagements FOR SELECT
USING (auth.uid() = employer_id OR auth.uid() = headhunter_id);

CREATE POLICY "Employers can create engagements"
ON public.engagements FOR INSERT
WITH CHECK (auth.uid() = employer_id);

CREATE POLICY "Involved parties can update engagements"
ON public.engagements FOR UPDATE
USING (auth.uid() = employer_id OR auth.uid() = headhunter_id);

-- RLS Policies for milestones
CREATE POLICY "Milestones viewable by engagement parties"
ON public.milestones FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.engagements
    WHERE engagements.id = milestones.engagement_id
    AND (engagements.employer_id = auth.uid() OR engagements.headhunter_id = auth.uid())
  )
);

CREATE POLICY "System can insert milestones"
ON public.milestones FOR INSERT
WITH CHECK (true);

CREATE POLICY "Engagement parties can update milestones"
ON public.milestones FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.engagements
    WHERE engagements.id = milestones.engagement_id
    AND (engagements.employer_id = auth.uid() OR engagements.headhunter_id = auth.uid())
  )
);

-- RLS Policies for submissions
CREATE POLICY "Submissions viewable by engagement parties"
ON public.submissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.engagements
    WHERE engagements.id = submissions.engagement_id
    AND (engagements.employer_id = auth.uid() OR engagements.headhunter_id = auth.uid())
  )
);

CREATE POLICY "Headhunters can create submissions"
ON public.submissions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.engagements
    WHERE engagements.id = engagement_id
    AND engagements.headhunter_id = auth.uid()
  )
);

CREATE POLICY "Engagement parties can update submissions"
ON public.submissions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.engagements
    WHERE engagements.id = submissions.engagement_id
    AND (engagements.employer_id = auth.uid() OR engagements.headhunter_id = auth.uid())
  )
);

-- RLS Policies for payments
CREATE POLICY "Payments viewable by engagement parties"
ON public.payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.engagements
    WHERE engagements.id = payments.engagement_id
    AND (engagements.employer_id = auth.uid() OR engagements.headhunter_id = auth.uid())
  )
);

CREATE POLICY "System can insert payments"
ON public.payments FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update payments"
ON public.payments FOR UPDATE
USING (true);

-- Create trigger for engagements updated_at
CREATE TRIGGER update_engagements_updated_at
BEFORE UPDATE ON public.engagements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for submissions updated_at
CREATE TRIGGER update_submissions_updated_at
BEFORE UPDATE ON public.submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for payments updated_at
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_engagements_job_id ON public.engagements(job_id);
CREATE INDEX idx_engagements_employer_id ON public.engagements(employer_id);
CREATE INDEX idx_engagements_headhunter_id ON public.engagements(headhunter_id);
CREATE INDEX idx_engagements_status ON public.engagements(status);
CREATE INDEX idx_milestones_engagement_id ON public.milestones(engagement_id);
CREATE INDEX idx_submissions_engagement_id ON public.submissions(engagement_id);
CREATE INDEX idx_submissions_status ON public.submissions(status);
CREATE INDEX idx_payments_engagement_id ON public.payments(engagement_id);
CREATE INDEX idx_messages_engagement_id ON public.messages(engagement_id);