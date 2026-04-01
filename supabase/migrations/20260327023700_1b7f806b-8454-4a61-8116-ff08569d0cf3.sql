
-- ============================================================
-- Delivery Operations: Cohorts, Sessions, Attendance
-- ============================================================

-- 1) course_cohorts
CREATE TABLE public.course_cohorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  code text,
  description text,
  status text NOT NULL DEFAULT 'draft',
  start_date date,
  end_date date,
  capacity integer,
  enrollment_open boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_course_cohorts_course ON public.course_cohorts(course_id);
CREATE INDEX idx_course_cohorts_status ON public.course_cohorts(status);

-- Validate cohort status
CREATE OR REPLACE FUNCTION public.validate_cohort_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = 'public' AS $$
BEGIN
  IF NEW.status NOT IN ('draft', 'active', 'completed', 'cancelled') THEN
    RAISE EXCEPTION 'cohort status must be draft, active, completed, or cancelled';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_cohort_status BEFORE INSERT OR UPDATE ON public.course_cohorts
  FOR EACH ROW EXECUTE FUNCTION public.validate_cohort_status();

CREATE TRIGGER trg_course_cohorts_updated BEFORE UPDATE ON public.course_cohorts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.course_cohorts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all cohorts" ON public.course_cohorts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors manage own course cohorts" ON public.course_cohorts
  FOR ALL TO authenticated
  USING (course_id IN (SELECT id FROM public.training_courses WHERE instructor_id = auth.uid()))
  WITH CHECK (course_id IN (SELECT id FROM public.training_courses WHERE instructor_id = auth.uid()));

CREATE POLICY "Enrolled students view active cohorts" ON public.course_cohorts
  FOR SELECT TO authenticated
  USING (status IN ('active', 'completed') AND course_id IN (
    SELECT course_id FROM public.course_enrollments WHERE user_id = auth.uid() AND status = 'active'
  ));

-- 2) cohort_memberships
CREATE TABLE public.cohort_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid NOT NULL REFERENCES public.course_cohorts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  membership_status text NOT NULL DEFAULT 'active',
  joined_at timestamptz NOT NULL DEFAULT now(),
  completion_state text,
  UNIQUE (cohort_id, user_id)
);

CREATE INDEX idx_cohort_memberships_cohort ON public.cohort_memberships(cohort_id);
CREATE INDEX idx_cohort_memberships_user ON public.cohort_memberships(user_id);

ALTER TABLE public.cohort_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all memberships" ON public.cohort_memberships
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors manage memberships for own courses" ON public.cohort_memberships
  FOR ALL TO authenticated
  USING (cohort_id IN (
    SELECT cc.id FROM public.course_cohorts cc
    JOIN public.training_courses tc ON tc.id = cc.course_id
    WHERE tc.instructor_id = auth.uid()
  ))
  WITH CHECK (cohort_id IN (
    SELECT cc.id FROM public.course_cohorts cc
    JOIN public.training_courses tc ON tc.id = cc.course_id
    WHERE tc.instructor_id = auth.uid()
  ));

CREATE POLICY "Students view own memberships" ON public.cohort_memberships
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 3) course_sessions
CREATE TABLE public.course_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  cohort_id uuid REFERENCES public.course_cohorts(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  session_type text NOT NULL DEFAULT 'live_class',
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  timezone text DEFAULT 'UTC',
  meeting_url text,
  attendance_required boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_course_sessions_course ON public.course_sessions(course_id);
CREATE INDEX idx_course_sessions_cohort ON public.course_sessions(cohort_id);
CREATE INDEX idx_course_sessions_start ON public.course_sessions(start_at);

-- Validate session type
CREATE OR REPLACE FUNCTION public.validate_session_type()
RETURNS trigger LANGUAGE plpgsql SET search_path = 'public' AS $$
BEGIN
  IF NEW.session_type NOT IN ('live_class', 'office_hours', 'review', 'demo', 'workshop', 'other') THEN
    RAISE EXCEPTION 'session_type must be live_class, office_hours, review, demo, workshop, or other';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_session_type BEFORE INSERT OR UPDATE ON public.course_sessions
  FOR EACH ROW EXECUTE FUNCTION public.validate_session_type();

CREATE TRIGGER trg_course_sessions_updated BEFORE UPDATE ON public.course_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.course_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all sessions" ON public.course_sessions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors manage own course sessions" ON public.course_sessions
  FOR ALL TO authenticated
  USING (course_id IN (SELECT id FROM public.training_courses WHERE instructor_id = auth.uid()))
  WITH CHECK (course_id IN (SELECT id FROM public.training_courses WHERE instructor_id = auth.uid()));

CREATE POLICY "Enrolled students view published sessions" ON public.course_sessions
  FOR SELECT TO authenticated
  USING (is_published = true AND course_id IN (
    SELECT course_id FROM public.course_enrollments WHERE user_id = auth.uid() AND status = 'active'
  ));

-- 4) session_attendance
CREATE TABLE public.session_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.course_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  attendance_status text NOT NULL DEFAULT 'pending',
  marked_by uuid,
  marked_at timestamptz,
  notes text,
  UNIQUE (session_id, user_id)
);

CREATE INDEX idx_session_attendance_session ON public.session_attendance(session_id);
CREATE INDEX idx_session_attendance_user ON public.session_attendance(user_id);

ALTER TABLE public.session_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all attendance" ON public.session_attendance
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors manage attendance for own course sessions" ON public.session_attendance
  FOR ALL TO authenticated
  USING (session_id IN (
    SELECT cs.id FROM public.course_sessions cs
    JOIN public.training_courses tc ON tc.id = cs.course_id
    WHERE tc.instructor_id = auth.uid()
  ))
  WITH CHECK (session_id IN (
    SELECT cs.id FROM public.course_sessions cs
    JOIN public.training_courses tc ON tc.id = cs.course_id
    WHERE tc.instructor_id = auth.uid()
  ));

CREATE POLICY "Students view own attendance" ON public.session_attendance
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
