
-- 1. freelancer_portfolio table
CREATE TABLE public.freelancer_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  category TEXT,
  technologies TEXT[] DEFAULT '{}',
  thumbnail_url TEXT,
  images TEXT[] DEFAULT '{}',
  project_url TEXT,
  github_url TEXT,
  client_name TEXT,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_freelancer_portfolio_user ON public.freelancer_portfolio(user_id);

-- 2. freelancer_reviews table
CREATE TABLE public.freelancer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hire_request_id UUID REFERENCES public.hire_requests(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL,
  title TEXT,
  review TEXT,
  skills_demonstrated TEXT[] DEFAULT '{}',
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hire_request_id, reviewer_user_id)
);
CREATE INDEX idx_freelancer_reviews_user ON public.freelancer_reviews(freelancer_user_id);

-- Rating validation trigger for freelancer_reviews
CREATE OR REPLACE FUNCTION public.validate_freelancer_review_rating()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_freelancer_review_rating BEFORE INSERT OR UPDATE ON public.freelancer_reviews
  FOR EACH ROW EXECUTE FUNCTION public.validate_freelancer_review_rating();

-- 3. company_reviews table
CREATE TABLE public.company_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hire_request_id UUID REFERENCES public.hire_requests(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL,
  title TEXT,
  review TEXT,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hire_request_id, reviewer_user_id)
);
CREATE INDEX idx_company_reviews_user ON public.company_reviews(company_user_id);

-- Rating validation trigger for company_reviews
CREATE OR REPLACE FUNCTION public.validate_company_review_rating()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_company_review_rating BEFORE INSERT OR UPDATE ON public.company_reviews
  FOR EACH ROW EXECUTE FUNCTION public.validate_company_review_rating();

-- 4. Extend hire_requests
ALTER TABLE public.hire_requests
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS budget_range TEXT,
  ADD COLUMN IF NOT EXISTS duration TEXT,
  ADD COLUMN IF NOT EXISTS requirements TEXT,
  ADD COLUMN IF NOT EXISTS freelancer_response TEXT,
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_reviewed_by_company BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_reviewed_by_freelancer BOOLEAN DEFAULT false;

-- 5. company_team_members table
CREATE TABLE public.company_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES auth.users(id),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_user_id, member_user_id)
);

-- 6. Extend company_profiles
ALTER TABLE public.company_profiles
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS tagline_ar TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS total_hires INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2) DEFAULT 0;

-- 7. RLS policies
ALTER TABLE public.freelancer_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freelancer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Portfolio public read" ON public.freelancer_portfolio FOR SELECT TO public USING (true);
CREATE POLICY "Users manage own portfolio" ON public.freelancer_portfolio FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage portfolios" ON public.freelancer_portfolio FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Approved reviews public" ON public.freelancer_reviews FOR SELECT TO public USING (is_approved = true);
CREATE POLICY "Companies write reviews" ON public.freelancer_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = reviewer_user_id);
CREATE POLICY "Admins manage reviews" ON public.freelancer_reviews FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Approved company reviews public" ON public.company_reviews FOR SELECT TO public USING (is_approved = true);
CREATE POLICY "Freelancers write reviews" ON public.company_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = reviewer_user_id);
CREATE POLICY "Admins manage company reviews" ON public.company_reviews FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Company sees own team" ON public.company_team_members FOR SELECT TO authenticated
  USING (auth.uid() = company_user_id OR auth.uid() = member_user_id);
CREATE POLICY "Company manages team" ON public.company_team_members FOR ALL TO authenticated USING (auth.uid() = company_user_id);
CREATE POLICY "Admins manage teams" ON public.company_team_members FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 8. Notification triggers
CREATE OR REPLACE FUNCTION public.notify_company_hire_response()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE freelancer_name TEXT;
BEGIN
  IF OLD.status = 'pending' AND NEW.status IN ('accepted', 'rejected') THEN
    SELECT p.full_name INTO freelancer_name FROM public.profiles p
    WHERE p.id = NEW.freelancer_profile_id;
    PERFORM public.create_notification(
      NEW.company_id,
      CASE WHEN NEW.status = 'accepted' THEN 'hire_accepted' ELSE 'hire_rejected' END,
      COALESCE(freelancer_name, 'A freelancer') ||
        CASE WHEN NEW.status = 'accepted' THEN ' accepted your hire request'
        ELSE ' declined your hire request' END,
      COALESCE(freelancer_name, 'مستقل') ||
        CASE WHEN NEW.status = 'accepted' THEN ' قبل عرض التوظيف'
        ELSE ' رفض عرض التوظيف' END,
      COALESCE(NEW.freelancer_response, ''), NULL,
      '/company/hires',
      jsonb_build_object('hire_request_id', NEW.id, 'status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_hire_response AFTER UPDATE ON public.hire_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_company_hire_response();

CREATE OR REPLACE FUNCTION public.notify_hire_completed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE freelancer_uid UUID; freelancer_name TEXT; company_name TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed' THEN
    SELECT p.user_id, p.full_name INTO freelancer_uid, freelancer_name
    FROM public.profiles p WHERE p.id = NEW.freelancer_profile_id;
    SELECT cp.company_name INTO company_name
    FROM public.company_profiles cp WHERE cp.user_id = NEW.company_id;

    IF freelancer_uid IS NOT NULL THEN
      PERFORM public.create_notification(
        freelancer_uid, 'hire_completed',
        'Your engagement with ' || COALESCE(company_name, 'a company') || ' is complete',
        'تم إتمام عملك مع ' || COALESCE(company_name, 'شركة'),
        'Please leave a review', 'يرجى ترك تقييم',
        '/profile/hires',
        jsonb_build_object('hire_request_id', NEW.id, 'review_type', 'company')
      );
    END IF;
    PERFORM public.create_notification(
      NEW.company_id, 'hire_completed',
      'Engagement with ' || COALESCE(freelancer_name, 'freelancer') || ' is complete',
      'تم إتمام العمل مع ' || COALESCE(freelancer_name, 'مستقل'),
      'Please leave a review', 'يرجى ترك تقييم',
      '/company/hires',
      jsonb_build_object('hire_request_id', NEW.id, 'review_type', 'freelancer')
    );
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_hire_completed AFTER UPDATE ON public.hire_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_hire_completed();

-- 9. Storage bucket for portfolio images
INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio', 'portfolio', true)
ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Portfolio images public" ON storage.objects FOR SELECT TO public USING (bucket_id = 'portfolio');
CREATE POLICY "Users upload own portfolio" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'portfolio' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own portfolio" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'portfolio' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 10. Updated_at trigger
CREATE TRIGGER update_freelancer_portfolio_updated_at BEFORE UPDATE ON public.freelancer_portfolio FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
