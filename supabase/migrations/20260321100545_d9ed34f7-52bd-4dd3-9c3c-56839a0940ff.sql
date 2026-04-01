
-- Add company_id to job_listings so companies can post their own jobs
ALTER TABLE public.job_listings ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.company_profiles(id) ON DELETE SET NULL;

-- Create hire_requests table for companies to contact freelancers
CREATE TABLE public.hire_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  freelancer_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_listing_id uuid REFERENCES public.job_listings(id) ON DELETE SET NULL,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS for hire_requests
ALTER TABLE public.hire_requests ENABLE ROW LEVEL SECURITY;

-- Companies can view their own hire requests
CREATE POLICY "Companies can view own hire requests"
  ON public.hire_requests FOR SELECT
  TO authenticated
  USING (
    company_id IN (SELECT id FROM public.company_profiles WHERE user_id = auth.uid())
  );

-- Companies can insert hire requests for their own company
CREATE POLICY "Companies can create hire requests"
  ON public.hire_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (SELECT id FROM public.company_profiles WHERE user_id = auth.uid())
  );

-- Companies can update their own hire requests
CREATE POLICY "Companies can update own hire requests"
  ON public.hire_requests FOR UPDATE
  TO authenticated
  USING (
    company_id IN (SELECT id FROM public.company_profiles WHERE user_id = auth.uid())
  );

-- Freelancers can view hire requests sent to them
CREATE POLICY "Freelancers can view requests to them"
  ON public.hire_requests FOR SELECT
  TO authenticated
  USING (
    freelancer_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Admins can manage all hire requests
CREATE POLICY "Admins can manage hire requests"
  ON public.hire_requests FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow companies to manage their own job listings
CREATE POLICY "Companies can manage own jobs"
  ON public.job_listings FOR ALL
  TO authenticated
  USING (
    company_id IN (SELECT id FROM public.company_profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    company_id IN (SELECT id FROM public.company_profiles WHERE user_id = auth.uid())
  );

-- Updated_at trigger for hire_requests
CREATE TRIGGER update_hire_requests_updated_at
  BEFORE UPDATE ON public.hire_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
