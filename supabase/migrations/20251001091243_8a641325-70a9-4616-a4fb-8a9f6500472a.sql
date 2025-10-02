-- Create enum types
CREATE TYPE public.app_role AS ENUM ('employer', 'headhunter', 'admin');
CREATE TYPE public.employment_type AS ENUM ('full_time', 'contract', 'temp');
CREATE TYPE public.seniority_level AS ENUM ('junior', 'mid', 'senior', 'lead', 'exec');
CREATE TYPE public.pricing_model AS ENUM ('percent_fee', 'flat', 'hourly');
CREATE TYPE public.job_status AS ENUM ('open', 'shortlisted', 'awarded', 'closed', 'on_hold');
CREATE TYPE public.job_visibility AS ENUM ('public', 'invite_only');
CREATE TYPE public.application_status AS ENUM ('submitted', 'shortlisted', 'rejected', 'withdrawn', 'selected');
CREATE TYPE public.user_status AS ENUM ('active', 'suspended', 'pending');
CREATE TYPE public.notification_type AS ENUM ('new_message', 'new_application', 'status_change', 'admin_notice');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    company_name TEXT,
    bio TEXT,
    industries TEXT[] DEFAULT '{}',
    expertise TEXT[] DEFAULT '{}',
    success_rate NUMERIC(5,2) DEFAULT 0 CHECK (success_rate >= 0 AND success_rate <= 100),
    avg_time_to_fill_days INTEGER DEFAULT 0,
    rating_avg NUMERIC(3,2) DEFAULT 0 CHECK (rating_avg >= 0 AND rating_avg <= 5),
    pricing_model pricing_model,
    placement_fee_percent NUMERIC(5,2),
    hourly_rate NUMERIC(10,2),
    portfolio_links TEXT[] DEFAULT '{}',
    verified BOOLEAN DEFAULT false,
    status user_status DEFAULT 'pending',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create jobs table
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT,
    employment_type employment_type DEFAULT 'full_time',
    seniority seniority_level DEFAULT 'mid',
    industry TEXT,
    skills_must TEXT[] DEFAULT '{}',
    skills_nice TEXT[] DEFAULT '{}',
    budget_currency TEXT DEFAULT 'ILS',
    budget_min NUMERIC(10,2),
    budget_max NUMERIC(10,2),
    fee_model pricing_model DEFAULT 'percent_fee',
    fee_value NUMERIC(10,2),
    candidate_quota INTEGER DEFAULT 3,
    sla_days INTEGER DEFAULT 7,
    visibility job_visibility DEFAULT 'public',
    status job_status DEFAULT 'open',
    selected_headhunter UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create applications table
CREATE TABLE public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
    headhunter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    cover_note TEXT,
    proposed_fee_model pricing_model,
    proposed_fee_value NUMERIC(10,2),
    eta_days INTEGER,
    status application_status DEFAULT 'submitted',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(job_id, headhunter_id)
);

-- Create messages table
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
    from_user UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    to_user UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    body TEXT NOT NULL,
    attachments TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create reviews table
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    about_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    by_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type notification_type NOT NULL,
    payload JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- RLS Policies for jobs
CREATE POLICY "Public jobs are viewable by everyone" 
ON public.jobs FOR SELECT 
USING (visibility = 'public' OR created_by = auth.uid());

CREATE POLICY "Employers can create jobs" 
ON public.jobs FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'employer'
    )
);

CREATE POLICY "Employers can update their own jobs" 
ON public.jobs FOR UPDATE 
USING (created_by = auth.uid());

CREATE POLICY "Employers can delete their own jobs" 
ON public.jobs FOR DELETE 
USING (created_by = auth.uid());

-- RLS Policies for applications
CREATE POLICY "Job owners and applicants can view applications" 
ON public.applications FOR SELECT 
USING (
    headhunter_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public.jobs 
        WHERE id = job_id AND created_by = auth.uid()
    )
);

CREATE POLICY "Headhunters can create applications" 
ON public.applications FOR INSERT 
WITH CHECK (
    headhunter_id = auth.uid() AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'headhunter'
    )
);

CREATE POLICY "Headhunters can update their own applications" 
ON public.applications FOR UPDATE 
USING (headhunter_id = auth.uid());

CREATE POLICY "Job owners can update application status" 
ON public.applications FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.jobs 
        WHERE id = job_id AND created_by = auth.uid()
    )
);

-- RLS Policies for messages
CREATE POLICY "Participants can view messages" 
ON public.messages FOR SELECT 
USING (from_user = auth.uid() OR to_user = auth.uid());

CREATE POLICY "Users can send messages" 
ON public.messages FOR INSERT 
WITH CHECK (from_user = auth.uid());

-- RLS Policies for reviews
CREATE POLICY "Reviews are viewable by everyone" 
ON public.reviews FOR SELECT 
USING (true);

CREATE POLICY "Users can create reviews" 
ON public.reviews FOR INSERT 
WITH CHECK (by_user_id = auth.uid());

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (user_id = auth.uid());

-- Create function to handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, status)
    VALUES (
        new.id, 
        new.email,
        COALESCE(new.raw_user_meta_data->>'role', 'headhunter')::app_role,
        'pending'
    );
    RETURN new;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for messages
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;