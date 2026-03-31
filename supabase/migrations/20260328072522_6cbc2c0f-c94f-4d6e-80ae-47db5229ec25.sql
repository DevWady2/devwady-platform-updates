
-- Course Questions table: minimal Q&A for instructor website layer
CREATE TABLE public.course_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  asked_by UUID NOT NULL,
  question_text TEXT NOT NULL,
  answer_text TEXT,
  answered_by UUID,
  answered_at TIMESTAMPTZ,
  is_visible_to_class BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for instructor lookups
CREATE INDEX idx_course_questions_course ON public.course_questions(course_id);
CREATE INDEX idx_course_questions_asked_by ON public.course_questions(asked_by);

-- Enable RLS
ALTER TABLE public.course_questions ENABLE ROW LEVEL SECURITY;

-- Policy: Instructors can view questions on their own courses
CREATE POLICY "Instructors view own course questions"
  ON public.course_questions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.training_courses tc
      WHERE tc.id = course_questions.course_id
        AND tc.instructor_id = auth.uid()
    )
  );

-- Policy: Enrolled students can view questions that are visible to class, plus their own
CREATE POLICY "Students view own or visible questions"
  ON public.course_questions FOR SELECT TO authenticated
  USING (
    asked_by = auth.uid()
    OR (
      is_visible_to_class = true
      AND EXISTS (
        SELECT 1 FROM public.course_enrollments ce
        WHERE ce.course_id = course_questions.course_id
          AND ce.user_id = auth.uid()
          AND ce.status = 'active'
      )
    )
  );

-- Policy: Enrolled students can insert questions on courses they are enrolled in
CREATE POLICY "Students ask questions"
  ON public.course_questions FOR INSERT TO authenticated
  WITH CHECK (
    asked_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.course_enrollments ce
      WHERE ce.course_id = course_questions.course_id
        AND ce.user_id = auth.uid()
        AND ce.status = 'active'
    )
  );

-- Policy: Instructors can update (answer, toggle visibility) questions on their own courses
CREATE POLICY "Instructors update own course questions"
  ON public.course_questions FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.training_courses tc
      WHERE tc.id = course_questions.course_id
        AND tc.instructor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.training_courses tc
      WHERE tc.id = course_questions.course_id
        AND tc.instructor_id = auth.uid()
    )
  );

-- Policy: Admin full access
CREATE POLICY "Admin full access to course questions"
  ON public.course_questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-update updated_at
CREATE TRIGGER update_course_questions_updated_at
  BEFORE UPDATE ON public.course_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
