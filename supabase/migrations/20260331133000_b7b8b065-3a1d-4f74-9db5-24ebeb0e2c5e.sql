-- First-wave single-account policy/helper cleanup
-- Canonical-first business identity checks for academy, consulting, and talent flows.
-- Compatibility-first: keeps public.has_role(...), public.user_roles, and admin bridges intact.

-- Shared helper: prefer canonical account_type / capabilities, bridge to legacy role only
-- when canonical account_type has not been resolved on public.profiles yet.
CREATE OR REPLACE FUNCTION public.has_canonical_business_access(
  _user_id UUID,
  _account_type TEXT,
  _legacy_role public.app_role DEFAULT NULL,
  _capabilities TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH profile_identity AS (
    SELECT
      lower(COALESCE(p.account_type, '')) AS account_type,
      ARRAY(
        SELECT lower(value)
        FROM unnest(COALESCE(p.capabilities, ARRAY[]::TEXT[])) AS value
      ) AS capabilities
    FROM public.profiles p
    WHERE p.user_id = _user_id
  ),
  requested_capabilities AS (
    SELECT ARRAY(
      SELECT lower(value)
      FROM unnest(COALESCE(_capabilities, ARRAY[]::TEXT[])) AS value
    ) AS capabilities
  )
  SELECT
    EXISTS (
      SELECT 1
      FROM profile_identity pi
      CROSS JOIN requested_capabilities rc
      WHERE (
        COALESCE(_account_type, '') <> ''
        AND pi.account_type = lower(_account_type)
      )
      OR EXISTS (
        SELECT 1
        FROM unnest(pi.capabilities) AS capability
        WHERE capability = ANY(rc.capabilities)
      )
    )
    OR (
      _legacy_role IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.user_id = _user_id
          AND COALESCE(p.account_type, '') <> ''
      )
      AND public.has_role(_user_id, _legacy_role)
    );
$$;

COMMENT ON FUNCTION public.has_canonical_business_access(UUID, TEXT, public.app_role, TEXT[]) IS
  'Canonical-first business identity helper. Falls back to legacy has_role only while profiles.account_type is unresolved.';

-- Talent / hiring policies
DROP POLICY IF EXISTS "Companies can manage own job postings" ON public.job_postings;
CREATE POLICY "Companies can manage own job postings"
  ON public.job_postings FOR ALL TO authenticated
  USING (
    auth.uid() = company_user_id
    AND public.has_canonical_business_access(
      auth.uid(),
      'company',
      'company'::public.app_role,
      ARRAY['post_jobs', 'manage_team']::TEXT[]
    )
  )
  WITH CHECK (
    auth.uid() = company_user_id
    AND public.has_canonical_business_access(
      auth.uid(),
      'company',
      'company'::public.app_role,
      ARRAY['post_jobs', 'manage_team']::TEXT[]
    )
  );

DROP POLICY IF EXISTS "Individuals can apply to jobs" ON public.job_applications;
DROP POLICY IF EXISTS "Freelancers can apply to jobs" ON public.job_applications;
CREATE POLICY "Freelancers can apply to jobs"
  ON public.job_applications FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = applicant_user_id
    AND public.has_canonical_business_access(
      auth.uid(),
      'freelancer',
      'individual'::public.app_role,
      ARRAY['apply_jobs']::TEXT[]
    )
  );

DROP POLICY IF EXISTS "Companies can view applications to their jobs" ON public.job_applications;
CREATE POLICY "Companies can view applications to their jobs"
  ON public.job_applications FOR SELECT TO authenticated
  USING (
    public.has_canonical_business_access(
      auth.uid(),
      'company',
      'company'::public.app_role,
      ARRAY['post_jobs', 'manage_team']::TEXT[]
    )
    AND job_id IN (
      SELECT id
      FROM public.job_postings
      WHERE company_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Companies can update application status" ON public.job_applications;
CREATE POLICY "Companies can update application status"
  ON public.job_applications FOR UPDATE TO authenticated
  USING (
    public.has_canonical_business_access(
      auth.uid(),
      'company',
      'company'::public.app_role,
      ARRAY['post_jobs', 'manage_team']::TEXT[]
    )
    AND job_id IN (
      SELECT id
      FROM public.job_postings
      WHERE company_user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_canonical_business_access(
      auth.uid(),
      'company',
      'company'::public.app_role,
      ARRAY['post_jobs', 'manage_team']::TEXT[]
    )
    AND job_id IN (
      SELECT id
      FROM public.job_postings
      WHERE company_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Companies can insert shortlists" ON public.freelancer_shortlists;
CREATE POLICY "Companies can insert shortlists"
  ON public.freelancer_shortlists FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = company_user_id
    AND public.has_canonical_business_access(
      auth.uid(),
      'company',
      'company'::public.app_role,
      ARRAY['post_jobs', 'manage_team']::TEXT[]
    )
  );

DROP POLICY IF EXISTS "Companies can delete own shortlists" ON public.freelancer_shortlists;
CREATE POLICY "Companies can delete own shortlists"
  ON public.freelancer_shortlists FOR DELETE TO authenticated
  USING (
    auth.uid() = company_user_id
    AND public.has_canonical_business_access(
      auth.uid(),
      'company',
      'company'::public.app_role,
      ARRAY['post_jobs', 'manage_team']::TEXT[]
    )
  );

DROP POLICY IF EXISTS "Companies can view own shortlists" ON public.freelancer_shortlists;
CREATE POLICY "Companies can view own shortlists"
  ON public.freelancer_shortlists FOR SELECT TO authenticated
  USING (
    auth.uid() = company_user_id
    AND public.has_canonical_business_access(
      auth.uid(),
      'company',
      'company'::public.app_role,
      ARRAY['post_jobs', 'manage_team']::TEXT[]
    )
  );

DROP POLICY IF EXISTS "Freelancers can see they were shortlisted" ON public.freelancer_shortlists;
CREATE POLICY "Freelancers can see they were shortlisted"
  ON public.freelancer_shortlists FOR SELECT TO authenticated
  USING (
    auth.uid() = freelancer_user_id
    AND public.has_canonical_business_access(
      auth.uid(),
      'freelancer',
      'individual'::public.app_role,
      ARRAY['receive_hires']::TEXT[]
    )
  );

DROP POLICY IF EXISTS "Companies can view own hire requests" ON public.hire_requests;
CREATE POLICY "Companies can view own hire requests"
  ON public.hire_requests FOR SELECT TO authenticated
  USING (
    public.has_canonical_business_access(
      auth.uid(),
      'company',
      'company'::public.app_role,
      ARRAY['post_jobs', 'manage_team']::TEXT[]
    )
    AND company_id IN (
      SELECT id
      FROM public.company_profiles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Companies can create hire requests" ON public.hire_requests;
CREATE POLICY "Companies can create hire requests"
  ON public.hire_requests FOR INSERT TO authenticated
  WITH CHECK (
    public.has_canonical_business_access(
      auth.uid(),
      'company',
      'company'::public.app_role,
      ARRAY['post_jobs', 'manage_team']::TEXT[]
    )
    AND company_id IN (
      SELECT id
      FROM public.company_profiles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Companies can update own hire requests" ON public.hire_requests;
CREATE POLICY "Companies can update own hire requests"
  ON public.hire_requests FOR UPDATE TO authenticated
  USING (
    public.has_canonical_business_access(
      auth.uid(),
      'company',
      'company'::public.app_role,
      ARRAY['post_jobs', 'manage_team']::TEXT[]
    )
    AND company_id IN (
      SELECT id
      FROM public.company_profiles
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_canonical_business_access(
      auth.uid(),
      'company',
      'company'::public.app_role,
      ARRAY['post_jobs', 'manage_team']::TEXT[]
    )
    AND company_id IN (
      SELECT id
      FROM public.company_profiles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Freelancers can view requests to them" ON public.hire_requests;
CREATE POLICY "Freelancers can view requests to them"
  ON public.hire_requests FOR SELECT TO authenticated
  USING (
    public.has_canonical_business_access(
      auth.uid(),
      'freelancer',
      'individual'::public.app_role,
      ARRAY['receive_hires']::TEXT[]
    )
    AND freelancer_profile_id IN (
      SELECT id
      FROM public.profiles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Companies can manage own jobs" ON public.job_listings;
CREATE POLICY "Companies can manage own jobs"
  ON public.job_listings FOR ALL TO authenticated
  USING (
    public.has_canonical_business_access(
      auth.uid(),
      'company',
      'company'::public.app_role,
      ARRAY['post_jobs', 'manage_team']::TEXT[]
    )
    AND company_id IN (
      SELECT id
      FROM public.company_profiles
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_canonical_business_access(
      auth.uid(),
      'company',
      'company'::public.app_role,
      ARRAY['post_jobs', 'manage_team']::TEXT[]
    )
    AND company_id IN (
      SELECT id
      FROM public.company_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Academy / training instructor policies
DROP POLICY IF EXISTS "atp_instructor_read_related" ON public.academy_talent_profiles;
CREATE POLICY "atp_instructor_read_related"
  ON public.academy_talent_profiles FOR SELECT TO authenticated
  USING (
    public.has_canonical_business_access(
      auth.uid(),
      'instructor',
      'instructor'::public.app_role,
      ARRAY['create_courses']::TEXT[]
    )
    AND allow_nomination = true
    AND visibility_state <> 'private'
    AND public.can_instructor_access_student_talent(auth.uid(), user_id)
  );

DROP POLICY IF EXISTS "ar_instructor_read_own" ON public.academy_recommendations;
CREATE POLICY "ar_instructor_read_own"
  ON public.academy_recommendations FOR SELECT TO authenticated
  USING (
    recommended_by = auth.uid()
    AND public.has_canonical_business_access(
      auth.uid(),
      'instructor',
      'instructor'::public.app_role,
      ARRAY['create_courses']::TEXT[]
    )
    AND public.can_instructor_recommend_student(auth.uid(), student_user_id, course_id, cohort_id)
  );

DROP POLICY IF EXISTS "ar_instructor_insert" ON public.academy_recommendations;
CREATE POLICY "ar_instructor_insert"
  ON public.academy_recommendations FOR INSERT TO authenticated
  WITH CHECK (
    recommended_by = auth.uid()
    AND public.has_canonical_business_access(
      auth.uid(),
      'instructor',
      'instructor'::public.app_role,
      ARRAY['create_courses']::TEXT[]
    )
    AND public.can_instructor_recommend_student(auth.uid(), student_user_id, course_id, cohort_id)
  );

DROP POLICY IF EXISTS "ar_instructor_update" ON public.academy_recommendations;
CREATE POLICY "ar_instructor_update"
  ON public.academy_recommendations FOR UPDATE TO authenticated
  USING (
    recommended_by = auth.uid()
    AND public.has_canonical_business_access(
      auth.uid(),
      'instructor',
      'instructor'::public.app_role,
      ARRAY['create_courses']::TEXT[]
    )
    AND public.can_instructor_recommend_student(auth.uid(), student_user_id, course_id, cohort_id)
  )
  WITH CHECK (
    recommended_by = auth.uid()
    AND public.has_canonical_business_access(
      auth.uid(),
      'instructor',
      'instructor'::public.app_role,
      ARRAY['create_courses']::TEXT[]
    )
  );

DROP POLICY IF EXISTS "an_instructor_read_own" ON public.academy_nominations;
CREATE POLICY "an_instructor_read_own"
  ON public.academy_nominations FOR SELECT TO authenticated
  USING (
    nominated_by = auth.uid()
    AND public.has_canonical_business_access(
      auth.uid(),
      'instructor',
      'instructor'::public.app_role,
      ARRAY['create_courses']::TEXT[]
    )
    AND public.can_instructor_access_student_talent(auth.uid(), student_user_id)
  );

DROP POLICY IF EXISTS "an_instructor_insert" ON public.academy_nominations;
CREATE POLICY "an_instructor_insert"
  ON public.academy_nominations FOR INSERT TO authenticated
  WITH CHECK (
    nominated_by = auth.uid()
    AND public.has_canonical_business_access(
      auth.uid(),
      'instructor',
      'instructor'::public.app_role,
      ARRAY['create_courses']::TEXT[]
    )
    AND public.can_instructor_access_student_talent(auth.uid(), student_user_id)
    AND public.student_allows_nomination(student_user_id)
  );

DROP POLICY IF EXISTS "an_instructor_update" ON public.academy_nominations;
CREATE POLICY "an_instructor_update"
  ON public.academy_nominations FOR UPDATE TO authenticated
  USING (
    nominated_by = auth.uid()
    AND public.has_canonical_business_access(
      auth.uid(),
      'instructor',
      'instructor'::public.app_role,
      ARRAY['create_courses']::TEXT[]
    )
    AND public.can_instructor_access_student_talent(auth.uid(), student_user_id)
  )
  WITH CHECK (
    nominated_by = auth.uid()
    AND public.has_canonical_business_access(
      auth.uid(),
      'instructor',
      'instructor'::public.app_role,
      ARRAY['create_courses']::TEXT[]
    )
  );

-- Consulting expert self-service policies
DROP POLICY IF EXISTS "Experts view own record" ON public.consulting_experts;
CREATE POLICY "Experts view own record" ON public.consulting_experts
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    AND public.has_canonical_business_access(
      auth.uid(),
      'expert',
      'expert'::public.app_role,
      ARRAY['give_consultations']::TEXT[]
    )
  );

DROP POLICY IF EXISTS "Experts update own profile" ON public.consulting_experts;
CREATE POLICY "Experts update own profile" ON public.consulting_experts
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    AND public.has_canonical_business_access(
      auth.uid(),
      'expert',
      'expert'::public.app_role,
      ARRAY['give_consultations']::TEXT[]
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND public.has_canonical_business_access(
      auth.uid(),
      'expert',
      'expert'::public.app_role,
      ARRAY['give_consultations']::TEXT[]
    )
  );

DROP POLICY IF EXISTS "Experts manage own availability" ON public.expert_availability;
CREATE POLICY "Experts manage own availability" ON public.expert_availability
  FOR ALL TO authenticated
  USING (
    public.has_canonical_business_access(
      auth.uid(),
      'expert',
      'expert'::public.app_role,
      ARRAY['give_consultations']::TEXT[]
    )
    AND expert_id IN (
      SELECT id
      FROM public.consulting_experts
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_canonical_business_access(
      auth.uid(),
      'expert',
      'expert'::public.app_role,
      ARRAY['give_consultations']::TEXT[]
    )
    AND expert_id IN (
      SELECT id
      FROM public.consulting_experts
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Experts view own bookings" ON public.consulting_bookings;
CREATE POLICY "Experts view own bookings" ON public.consulting_bookings
  FOR SELECT TO authenticated
  USING (
    public.has_canonical_business_access(
      auth.uid(),
      'expert',
      'expert'::public.app_role,
      ARRAY['give_consultations']::TEXT[]
    )
    AND expert_id IN (
      SELECT id
      FROM public.consulting_experts
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Experts update own bookings" ON public.consulting_bookings;
CREATE POLICY "Experts update own bookings" ON public.consulting_bookings
  FOR UPDATE TO authenticated
  USING (
    public.has_canonical_business_access(
      auth.uid(),
      'expert',
      'expert'::public.app_role,
      ARRAY['give_consultations']::TEXT[]
    )
    AND expert_id IN (
      SELECT id
      FROM public.consulting_experts
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_canonical_business_access(
      auth.uid(),
      'expert',
      'expert'::public.app_role,
      ARRAY['give_consultations']::TEXT[]
    )
    AND expert_id IN (
      SELECT id
      FROM public.consulting_experts
      WHERE user_id = auth.uid()
    )
  );
