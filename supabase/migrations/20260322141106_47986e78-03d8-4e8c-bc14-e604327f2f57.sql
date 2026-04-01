
-- 1. job_postings
CREATE TABLE public.job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  title_ar text,
  type text NOT NULL DEFAULT 'full-time',
  location text,
  location_ar text,
  description text,
  description_ar text,
  requirements text[] DEFAULT '{}',
  salary_range text,
  tags text[] DEFAULT '{}',
  is_urgent boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. job_applications
CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  applicant_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cover_note text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id, applicant_user_id)
);

-- 3. freelancer_shortlists
CREATE TABLE public.freelancer_shortlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  freelancer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_user_id, freelancer_user_id)
);

-- 4. profile_views
CREATE TABLE public.profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freelancer_shortlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- ========== job_postings policies ==========
CREATE POLICY "Active jobs viewable by everyone"
  ON public.job_postings FOR SELECT TO public
  USING (is_active = true);

CREATE POLICY "Companies can manage own job postings"
  ON public.job_postings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'company') AND auth.uid() = company_user_id)
  WITH CHECK (public.has_role(auth.uid(), 'company') AND auth.uid() = company_user_id);

CREATE POLICY "Admins can manage all job postings"
  ON public.job_postings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ========== job_applications policies ==========
CREATE POLICY "Individuals can apply to jobs"
  ON public.job_applications FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'individual') AND auth.uid() = applicant_user_id);

CREATE POLICY "Applicants can view own applications"
  ON public.job_applications FOR SELECT TO authenticated
  USING (auth.uid() = applicant_user_id);

CREATE POLICY "Companies can view applications to their jobs"
  ON public.job_applications FOR SELECT TO authenticated
  USING (job_id IN (SELECT id FROM public.job_postings WHERE company_user_id = auth.uid()));

CREATE POLICY "Companies can update application status"
  ON public.job_applications FOR UPDATE TO authenticated
  USING (job_id IN (SELECT id FROM public.job_postings WHERE company_user_id = auth.uid()));

CREATE POLICY "Admins can manage all applications"
  ON public.job_applications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ========== freelancer_shortlists policies ==========
CREATE POLICY "Companies can insert shortlists"
  ON public.freelancer_shortlists FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'company') AND auth.uid() = company_user_id);

CREATE POLICY "Companies can delete own shortlists"
  ON public.freelancer_shortlists FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'company') AND auth.uid() = company_user_id);

CREATE POLICY "Companies can view own shortlists"
  ON public.freelancer_shortlists FOR SELECT TO authenticated
  USING (auth.uid() = company_user_id);

CREATE POLICY "Freelancers can see they were shortlisted"
  ON public.freelancer_shortlists FOR SELECT TO authenticated
  USING (auth.uid() = freelancer_user_id);

CREATE POLICY "Admins can manage all shortlists"
  ON public.freelancer_shortlists FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ========== profile_views policies ==========
CREATE POLICY "Authenticated can insert profile views"
  ON public.profile_views FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can see views on own profile"
  ON public.profile_views FOR SELECT TO authenticated
  USING (auth.uid() = profile_user_id);

CREATE POLICY "Admins can manage all profile views"
  ON public.profile_views FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ========== updated_at triggers ==========
CREATE TRIGGER update_job_postings_updated_at
  BEFORE UPDATE ON public.job_postings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
