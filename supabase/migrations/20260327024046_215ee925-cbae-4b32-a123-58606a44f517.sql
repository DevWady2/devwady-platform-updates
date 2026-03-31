
-- ============================================================
-- Submission & Review Schema for Structured Learning
-- ============================================================

-- 1) assessment_attempts
CREATE TABLE public.assessment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.course_assessments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  cohort_id uuid REFERENCES public.course_cohorts(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'in_progress',
  score numeric,
  started_at timestamptz DEFAULT now(),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid,
  feedback text,
  metadata jsonb DEFAULT '{}'::jsonb,
  attempt_number integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_assessment_attempts_assessment ON public.assessment_attempts(assessment_id);
CREATE INDEX idx_assessment_attempts_user ON public.assessment_attempts(user_id);
CREATE INDEX idx_assessment_attempts_cohort ON public.assessment_attempts(cohort_id);

CREATE OR REPLACE FUNCTION public.validate_attempt_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = 'public' AS $$
BEGIN
  IF NEW.status NOT IN ('in_progress', 'submitted', 'passed', 'failed', 'reviewed') THEN
    RAISE EXCEPTION 'attempt status must be in_progress, submitted, passed, failed, or reviewed';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_attempt_status BEFORE INSERT OR UPDATE ON public.assessment_attempts
  FOR EACH ROW EXECUTE FUNCTION public.validate_attempt_status();

ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all attempts" ON public.assessment_attempts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors manage attempts for own courses" ON public.assessment_attempts
  FOR ALL TO authenticated
  USING (assessment_id IN (
    SELECT ca.id FROM public.course_assessments ca
    JOIN public.training_courses tc ON tc.id = ca.course_id
    WHERE tc.instructor_id = auth.uid()
  ))
  WITH CHECK (assessment_id IN (
    SELECT ca.id FROM public.course_assessments ca
    JOIN public.training_courses tc ON tc.id = ca.course_id
    WHERE tc.instructor_id = auth.uid()
  ));

CREATE POLICY "Students manage own attempts" ON public.assessment_attempts
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 2) project_submissions
CREATE TABLE public.project_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.course_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  cohort_id uuid REFERENCES public.course_cohorts(id) ON DELETE SET NULL,
  submission_status text NOT NULL DEFAULT 'draft',
  submission_text text,
  submission_url text,
  attachment_url text,
  submitted_at timestamptz,
  last_updated_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);

CREATE INDEX idx_project_submissions_project ON public.project_submissions(project_id);
CREATE INDEX idx_project_submissions_user ON public.project_submissions(user_id);
CREATE INDEX idx_project_submissions_cohort ON public.project_submissions(cohort_id);

CREATE OR REPLACE FUNCTION public.validate_submission_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = 'public' AS $$
BEGIN
  IF NEW.submission_status NOT IN ('draft', 'submitted', 'revision_requested', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'submission_status must be draft, submitted, revision_requested, approved, or rejected';
  END IF;
  NEW.last_updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_submission_status BEFORE INSERT OR UPDATE ON public.project_submissions
  FOR EACH ROW EXECUTE FUNCTION public.validate_submission_status();

ALTER TABLE public.project_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all submissions" ON public.project_submissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors manage submissions for own courses" ON public.project_submissions
  FOR ALL TO authenticated
  USING (project_id IN (
    SELECT cp.id FROM public.course_projects cp
    JOIN public.training_courses tc ON tc.id = cp.course_id
    WHERE tc.instructor_id = auth.uid()
  ))
  WITH CHECK (project_id IN (
    SELECT cp.id FROM public.course_projects cp
    JOIN public.training_courses tc ON tc.id = cp.course_id
    WHERE tc.instructor_id = auth.uid()
  ));

CREATE POLICY "Students manage own submissions" ON public.project_submissions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3) project_reviews
CREATE TABLE public.project_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.project_submissions(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL,
  review_status text NOT NULL DEFAULT 'pending',
  score numeric,
  feedback text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_reviews_submission ON public.project_reviews(submission_id);
CREATE INDEX idx_project_reviews_reviewer ON public.project_reviews(reviewer_id);

CREATE OR REPLACE FUNCTION public.validate_review_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = 'public' AS $$
BEGIN
  IF NEW.review_status NOT IN ('pending', 'approved', 'revision_requested', 'rejected') THEN
    RAISE EXCEPTION 'review_status must be pending, approved, revision_requested, or rejected';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_review_status BEFORE INSERT OR UPDATE ON public.project_reviews
  FOR EACH ROW EXECUTE FUNCTION public.validate_review_status();

ALTER TABLE public.project_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all reviews" ON public.project_reviews
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors manage reviews for own courses" ON public.project_reviews
  FOR ALL TO authenticated
  USING (submission_id IN (
    SELECT ps.id FROM public.project_submissions ps
    JOIN public.course_projects cp ON cp.id = ps.project_id
    JOIN public.training_courses tc ON tc.id = cp.course_id
    WHERE tc.instructor_id = auth.uid()
  ))
  WITH CHECK (submission_id IN (
    SELECT ps.id FROM public.project_submissions ps
    JOIN public.course_projects cp ON cp.id = ps.project_id
    JOIN public.training_courses tc ON tc.id = cp.course_id
    WHERE tc.instructor_id = auth.uid()
  ));

CREATE POLICY "Students view reviews on own submissions" ON public.project_reviews
  FOR SELECT TO authenticated
  USING (submission_id IN (
    SELECT id FROM public.project_submissions WHERE user_id = auth.uid()
  ));
