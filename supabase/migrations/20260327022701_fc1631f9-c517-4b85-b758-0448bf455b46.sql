
-- ═══ course_milestones ═══
CREATE TABLE public.course_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  title_en text NOT NULL,
  title_ar text,
  description_en text,
  description_ar text,
  sort_order integer NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_course_milestones_course ON public.course_milestones(course_id);

ALTER TABLE public.course_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all milestones" ON public.course_milestones FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors manage own course milestones" ON public.course_milestones FOR ALL TO authenticated
  USING (course_id IN (SELECT id FROM public.training_courses WHERE instructor_id = auth.uid()))
  WITH CHECK (course_id IN (SELECT id FROM public.training_courses WHERE instructor_id = auth.uid()));

CREATE POLICY "Enrolled students view published milestones" ON public.course_milestones FOR SELECT TO authenticated
  USING (is_published = true AND course_id IN (
    SELECT course_id FROM public.course_enrollments WHERE user_id = auth.uid() AND status = 'active'
  ));

-- ═══ course_assessments ═══
CREATE TABLE public.course_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  module_id uuid REFERENCES public.course_modules(id) ON DELETE SET NULL,
  title_en text NOT NULL,
  title_ar text,
  description_en text,
  description_ar text,
  assessment_type text NOT NULL DEFAULT 'quiz',
  instructions text,
  instructions_ar text,
  passing_score integer,
  max_attempts integer,
  sort_order integer NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_course_assessments_course ON public.course_assessments(course_id);
CREATE INDEX idx_course_assessments_module ON public.course_assessments(module_id);

ALTER TABLE public.course_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all assessments" ON public.course_assessments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors manage own course assessments" ON public.course_assessments FOR ALL TO authenticated
  USING (course_id IN (SELECT id FROM public.training_courses WHERE instructor_id = auth.uid()))
  WITH CHECK (course_id IN (SELECT id FROM public.training_courses WHERE instructor_id = auth.uid()));

CREATE POLICY "Enrolled students view published assessments" ON public.course_assessments FOR SELECT TO authenticated
  USING (is_published = true AND course_id IN (
    SELECT course_id FROM public.course_enrollments WHERE user_id = auth.uid() AND status = 'active'
  ));

-- Validation trigger for assessment_type
CREATE OR REPLACE FUNCTION public.validate_assessment_type()
  RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.assessment_type NOT IN ('quiz', 'manual', 'external') THEN
    RAISE EXCEPTION 'assessment_type must be quiz, manual, or external';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_assessment_type
  BEFORE INSERT OR UPDATE ON public.course_assessments
  FOR EACH ROW EXECUTE FUNCTION public.validate_assessment_type();

-- ═══ course_projects ═══
CREATE TABLE public.course_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  title_en text NOT NULL,
  title_ar text,
  description_en text,
  description_ar text,
  instructions text,
  instructions_ar text,
  submission_type text NOT NULL DEFAULT 'url',
  sort_order integer NOT NULL DEFAULT 0,
  is_capstone boolean NOT NULL DEFAULT false,
  is_required boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_course_projects_course ON public.course_projects(course_id);

ALTER TABLE public.course_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all projects" ON public.course_projects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors manage own course projects" ON public.course_projects FOR ALL TO authenticated
  USING (course_id IN (SELECT id FROM public.training_courses WHERE instructor_id = auth.uid()))
  WITH CHECK (course_id IN (SELECT id FROM public.training_courses WHERE instructor_id = auth.uid()));

CREATE POLICY "Enrolled students view published projects" ON public.course_projects FOR SELECT TO authenticated
  USING (is_published = true AND course_id IN (
    SELECT course_id FROM public.course_enrollments WHERE user_id = auth.uid() AND status = 'active'
  ));

-- Validation trigger for submission_type
CREATE OR REPLACE FUNCTION public.validate_submission_type()
  RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.submission_type NOT IN ('text', 'url', 'file', 'external') THEN
    RAISE EXCEPTION 'submission_type must be text, url, file, or external';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_submission_type
  BEFORE INSERT OR UPDATE ON public.course_projects
  FOR EACH ROW EXECUTE FUNCTION public.validate_submission_type();

-- updated_at triggers for all three tables
CREATE TRIGGER set_updated_at_milestones BEFORE UPDATE ON public.course_milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_assessments BEFORE UPDATE ON public.course_assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_projects BEFORE UPDATE ON public.course_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
