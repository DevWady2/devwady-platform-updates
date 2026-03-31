
-- ══════════════════════════════════════════════════════════════
-- Academy Talent Bridge — Foundational Schema
-- Additive migration: 3 new tables, RLS, indexes
-- ══════════════════════════════════════════════════════════════

-- 1) academy_talent_profiles
CREATE TABLE public.academy_talent_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  headline text,
  summary text,
  primary_track text,
  specialization_tags text[],
  portfolio_url text,
  github_url text,
  linkedin_url text,
  cv_url text,
  availability_status text,
  visibility_state text NOT NULL DEFAULT 'private',
  allow_nomination boolean NOT NULL DEFAULT false,
  allow_opportunity_matching boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_talent_profiles_user_id ON public.academy_talent_profiles(user_id);
CREATE INDEX idx_talent_profiles_visibility ON public.academy_talent_profiles(visibility_state);

-- 2) academy_recommendations
CREATE TABLE public.academy_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id uuid NOT NULL,
  course_id uuid REFERENCES public.training_courses(id) ON DELETE SET NULL,
  cohort_id uuid REFERENCES public.course_cohorts(id) ON DELETE SET NULL,
  recommended_by uuid NOT NULL,
  recommendation_type text NOT NULL DEFAULT 'instructor_recommendation',
  strength_summary text,
  evidence_summary text,
  readiness_snapshot jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_recommendations_student ON public.academy_recommendations(student_user_id);
CREATE INDEX idx_recommendations_recommender ON public.academy_recommendations(recommended_by);
CREATE INDEX idx_recommendations_course ON public.academy_recommendations(course_id);

-- 3) academy_nominations
CREATE TABLE public.academy_nominations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id uuid NOT NULL,
  recommendation_id uuid REFERENCES public.academy_recommendations(id) ON DELETE SET NULL,
  course_id uuid REFERENCES public.training_courses(id) ON DELETE SET NULL,
  cohort_id uuid REFERENCES public.course_cohorts(id) ON DELETE SET NULL,
  nominated_by uuid NOT NULL,
  nomination_scope text NOT NULL DEFAULT 'general_opportunity',
  linked_job_id uuid,
  target_company_name text,
  nomination_reason text,
  evidence_summary text,
  status text NOT NULL DEFAULT 'draft',
  submitted_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_nominations_student ON public.academy_nominations(student_user_id);
CREATE INDEX idx_nominations_nominator ON public.academy_nominations(nominated_by);
CREATE INDEX idx_nominations_status ON public.academy_nominations(status);

-- ── Validation triggers ──────────────────────────────────────

CREATE OR REPLACE FUNCTION public.validate_visibility_state()
  RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.visibility_state NOT IN ('private', 'academy_only', 'opportunity_ready') THEN
    RAISE EXCEPTION 'visibility_state must be private, academy_only, or opportunity_ready';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_validate_visibility_state
  BEFORE INSERT OR UPDATE ON public.academy_talent_profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_visibility_state();

CREATE OR REPLACE FUNCTION public.validate_recommendation_type()
  RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.recommendation_type NOT IN (
    'instructor_recommendation', 'bootcamp_recommendation',
    'project_based_recommendation', 'readiness_based_recommendation'
  ) THEN
    RAISE EXCEPTION 'Invalid recommendation_type';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_validate_recommendation_type
  BEFORE INSERT OR UPDATE ON public.academy_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.validate_recommendation_type();

CREATE OR REPLACE FUNCTION public.validate_nomination_scope()
  RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.nomination_scope NOT IN (
    'general_opportunity', 'role_specific', 'company_specific', 'internal_pool'
  ) THEN
    RAISE EXCEPTION 'Invalid nomination_scope';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_validate_nomination_scope
  BEFORE INSERT OR UPDATE ON public.academy_nominations
  FOR EACH ROW EXECUTE FUNCTION public.validate_nomination_scope();

CREATE OR REPLACE FUNCTION public.validate_nomination_status()
  RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status NOT IN ('draft', 'submitted', 'accepted', 'declined', 'withdrawn', 'archived') THEN
    RAISE EXCEPTION 'Invalid nomination status';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_validate_nomination_status
  BEFORE INSERT OR UPDATE ON public.academy_nominations
  FOR EACH ROW EXECUTE FUNCTION public.validate_nomination_status();

-- updated_at triggers
CREATE TRIGGER trg_talent_profiles_updated_at
  BEFORE UPDATE ON public.academy_talent_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_recommendations_updated_at
  BEFORE UPDATE ON public.academy_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_nominations_updated_at
  BEFORE UPDATE ON public.academy_nominations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── RLS ──────────────────────────────────────────────────────

ALTER TABLE public.academy_talent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_nominations ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is instructor for a given course
CREATE OR REPLACE FUNCTION public.is_course_instructor(_user_id uuid, _course_id uuid)
  RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.training_courses
    WHERE id = _course_id AND instructor_id = _user_id
  )
$$;

-- ── academy_talent_profiles policies ─────────────────────────

CREATE POLICY "Students manage own talent profile"
  ON public.academy_talent_profiles FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all talent profiles"
  ON public.academy_talent_profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors view nomination-eligible profiles"
  ON public.academy_talent_profiles FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'instructor')
    AND allow_nomination = true
    AND visibility_state != 'private'
  );

-- ── academy_recommendations policies ─────────────────────────

CREATE POLICY "Students read own recommendations"
  ON public.academy_recommendations FOR SELECT TO authenticated
  USING (student_user_id = auth.uid());

CREATE POLICY "Recommenders manage own recommendations"
  ON public.academy_recommendations FOR ALL TO authenticated
  USING (recommended_by = auth.uid())
  WITH CHECK (recommended_by = auth.uid());

CREATE POLICY "Admins manage all recommendations"
  ON public.academy_recommendations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ── academy_nominations policies ─────────────────────────────

CREATE POLICY "Students read own nominations"
  ON public.academy_nominations FOR SELECT TO authenticated
  USING (student_user_id = auth.uid());

CREATE POLICY "Nominators manage own nominations"
  ON public.academy_nominations FOR ALL TO authenticated
  USING (nominated_by = auth.uid())
  WITH CHECK (nominated_by = auth.uid());

CREATE POLICY "Admins manage all nominations"
  ON public.academy_nominations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
