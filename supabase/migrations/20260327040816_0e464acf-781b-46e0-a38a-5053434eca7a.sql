
-- ══════════════════════════════════════════════════════════════
-- Tighten Academy Talent Bridge RLS
-- Drop old permissive policies, add relationship-scoped ones
-- ══════════════════════════════════════════════════════════════

-- ── Helper functions (SECURITY DEFINER) ──────────────────────

-- Check if instructor has a legitimate academy relationship to a student
-- via course enrollment or cohort membership on a course they own.
CREATE OR REPLACE FUNCTION public.can_instructor_access_student_talent(
  _instructor_id uuid, _student_user_id uuid
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    -- Student enrolled in a course owned by this instructor
    SELECT 1
    FROM public.course_enrollments ce
    JOIN public.training_courses tc ON tc.id = ce.course_id
    WHERE ce.user_id = _student_user_id
      AND ce.status = 'active'
      AND tc.instructor_id = _instructor_id
  )
  OR EXISTS (
    -- Student is a member of a cohort tied to a course owned by this instructor
    SELECT 1
    FROM public.cohort_memberships cm
    JOIN public.course_cohorts cc ON cc.id = cm.cohort_id
    JOIN public.training_courses tc ON tc.id = cc.course_id
    WHERE cm.user_id = _student_user_id
      AND cm.membership_status = 'active'
      AND tc.instructor_id = _instructor_id
  )
$$;

-- Check if instructor can recommend a student, enforcing course/cohort ownership
CREATE OR REPLACE FUNCTION public.can_instructor_recommend_student(
  _instructor_id uuid, _student_user_id uuid,
  _course_id uuid, _cohort_id uuid
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT
    CASE
      -- If course_id provided, instructor must own that course AND student enrolled in it
      WHEN _course_id IS NOT NULL AND _cohort_id IS NULL THEN
        EXISTS (
          SELECT 1 FROM public.training_courses tc
          WHERE tc.id = _course_id AND tc.instructor_id = _instructor_id
        )
        AND EXISTS (
          SELECT 1 FROM public.course_enrollments ce
          WHERE ce.course_id = _course_id AND ce.user_id = _student_user_id AND ce.status = 'active'
        )
      -- If cohort_id provided, instructor must own the parent course AND student is a member
      WHEN _cohort_id IS NOT NULL THEN
        EXISTS (
          SELECT 1 FROM public.course_cohorts cc
          JOIN public.training_courses tc ON tc.id = cc.course_id
          WHERE cc.id = _cohort_id AND tc.instructor_id = _instructor_id
        )
        AND EXISTS (
          SELECT 1 FROM public.cohort_memberships cm
          WHERE cm.cohort_id = _cohort_id AND cm.user_id = _student_user_id AND cm.membership_status = 'active'
        )
      -- If both null, fall back to general relationship check
      ELSE
        public.can_instructor_access_student_talent(_instructor_id, _student_user_id)
    END
$$;

-- Check if a student's talent profile allows nomination
CREATE OR REPLACE FUNCTION public.student_allows_nomination(_student_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.academy_talent_profiles
    WHERE user_id = _student_user_id
      AND allow_nomination = true
      AND visibility_state != 'private'
  )
$$;


-- ══════════════════════════════════════════════════════════════
-- Drop old policies
-- ══════════════════════════════════════════════════════════════

-- academy_talent_profiles
DROP POLICY IF EXISTS "Students manage own talent profile" ON public.academy_talent_profiles;
DROP POLICY IF EXISTS "Admins manage all talent profiles" ON public.academy_talent_profiles;
DROP POLICY IF EXISTS "Instructors view nomination-eligible profiles" ON public.academy_talent_profiles;

-- academy_recommendations
DROP POLICY IF EXISTS "Students read own recommendations" ON public.academy_recommendations;
DROP POLICY IF EXISTS "Recommenders manage own recommendations" ON public.academy_recommendations;
DROP POLICY IF EXISTS "Admins manage all recommendations" ON public.academy_recommendations;

-- academy_nominations
DROP POLICY IF EXISTS "Students read own nominations" ON public.academy_nominations;
DROP POLICY IF EXISTS "Nominators manage own nominations" ON public.academy_nominations;
DROP POLICY IF EXISTS "Admins manage all nominations" ON public.academy_nominations;


-- ══════════════════════════════════════════════════════════════
-- New policies — academy_talent_profiles
-- ══════════════════════════════════════════════════════════════

CREATE POLICY "atp_student_manage_own"
  ON public.academy_talent_profiles FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "atp_admin_manage_all"
  ON public.academy_talent_profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Instructors can only READ profiles of students they teach, who opted in
CREATE POLICY "atp_instructor_read_related"
  ON public.academy_talent_profiles FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'instructor')
    AND allow_nomination = true
    AND visibility_state != 'private'
    AND public.can_instructor_access_student_talent(auth.uid(), user_id)
  );


-- ══════════════════════════════════════════════════════════════
-- New policies — academy_recommendations
-- ══════════════════════════════════════════════════════════════

CREATE POLICY "ar_student_read_own"
  ON public.academy_recommendations FOR SELECT TO authenticated
  USING (student_user_id = auth.uid());

CREATE POLICY "ar_admin_manage_all"
  ON public.academy_recommendations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Instructors can SELECT recommendations they created, scoped by relationship
CREATE POLICY "ar_instructor_read_own"
  ON public.academy_recommendations FOR SELECT TO authenticated
  USING (
    recommended_by = auth.uid()
    AND public.can_instructor_recommend_student(auth.uid(), student_user_id, course_id, cohort_id)
  );

-- Instructors can INSERT recommendations only for related students
CREATE POLICY "ar_instructor_insert"
  ON public.academy_recommendations FOR INSERT TO authenticated
  WITH CHECK (
    recommended_by = auth.uid()
    AND public.can_instructor_recommend_student(auth.uid(), student_user_id, course_id, cohort_id)
  );

-- Instructors can UPDATE their own recommendations (status, content)
CREATE POLICY "ar_instructor_update"
  ON public.academy_recommendations FOR UPDATE TO authenticated
  USING (
    recommended_by = auth.uid()
    AND public.can_instructor_recommend_student(auth.uid(), student_user_id, course_id, cohort_id)
  )
  WITH CHECK (
    recommended_by = auth.uid()
  );


-- ══════════════════════════════════════════════════════════════
-- New policies — academy_nominations
-- ══════════════════════════════════════════════════════════════

CREATE POLICY "an_student_read_own"
  ON public.academy_nominations FOR SELECT TO authenticated
  USING (student_user_id = auth.uid());

CREATE POLICY "an_admin_manage_all"
  ON public.academy_nominations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Instructors can SELECT their own nominations, scoped by relationship
CREATE POLICY "an_instructor_read_own"
  ON public.academy_nominations FOR SELECT TO authenticated
  USING (
    nominated_by = auth.uid()
    AND public.can_instructor_access_student_talent(auth.uid(), student_user_id)
  );

-- Instructors can INSERT nominations only for related, opted-in students
CREATE POLICY "an_instructor_insert"
  ON public.academy_nominations FOR INSERT TO authenticated
  WITH CHECK (
    nominated_by = auth.uid()
    AND public.can_instructor_access_student_talent(auth.uid(), student_user_id)
    AND public.student_allows_nomination(student_user_id)
  );

-- Instructors can UPDATE their own nominations
CREATE POLICY "an_instructor_update"
  ON public.academy_nominations FOR UPDATE TO authenticated
  USING (
    nominated_by = auth.uid()
    AND public.can_instructor_access_student_talent(auth.uid(), student_user_id)
  )
  WITH CHECK (
    nominated_by = auth.uid()
  );
