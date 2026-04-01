
-- 1. Extend app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'student';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'instructor';

-- 2. Extend training_courses (price_usd and is_free already exist)
ALTER TABLE public.training_courses
  ADD COLUMN IF NOT EXISTS instructor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_devwady_course BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS course_type TEXT DEFAULT 'recorded',
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS preview_video_url TEXT,
  ADD COLUMN IF NOT EXISTS max_students INTEGER,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS revenue_share_pct NUMERIC(4,2) DEFAULT 70.00,
  ADD COLUMN IF NOT EXISTS total_duration_hours NUMERIC(5,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'ar';

-- 3. course_lessons table
CREATE TABLE public.course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.course_modules(id) ON DELETE SET NULL,
  title_en TEXT NOT NULL,
  title_ar TEXT,
  description_en TEXT,
  description_ar TEXT,
  content_type TEXT NOT NULL DEFAULT 'video',
  video_url TEXT,
  video_duration_seconds INTEGER,
  text_content TEXT,
  text_content_ar TEXT,
  attachment_urls TEXT[] DEFAULT '{}',
  is_preview BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. course_enrollments table
CREATE TABLE public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active',
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  certificate_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id, user_id)
);

-- 5. lesson_progress table
CREATE TABLE public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  progress_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(enrollment_id, lesson_id)
);

-- 6. course_reviews table (using validation trigger instead of CHECK)
CREATE TABLE public.course_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  review TEXT,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id, user_id)
);

-- Validation trigger for course_reviews rating
CREATE OR REPLACE FUNCTION public.validate_course_review_rating()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_course_review_rating_trigger
  BEFORE INSERT OR UPDATE ON public.course_reviews
  FOR EACH ROW EXECUTE FUNCTION public.validate_course_review_rating();

-- 7. instructor_applications table
CREATE TABLE public.instructor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  expertise_areas TEXT[] DEFAULT '{}',
  bio TEXT,
  portfolio_url TEXT,
  linkedin_url TEXT,
  sample_content_url TEXT,
  course_proposal TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 8. Indexes
CREATE INDEX idx_course_lessons_course ON public.course_lessons(course_id);
CREATE INDEX idx_course_lessons_module ON public.course_lessons(module_id);
CREATE INDEX idx_course_enrollments_user ON public.course_enrollments(user_id);
CREATE INDEX idx_course_enrollments_course ON public.course_enrollments(course_id);
CREATE INDEX idx_lesson_progress_enrollment ON public.lesson_progress(enrollment_id);
CREATE INDEX idx_lesson_progress_user ON public.lesson_progress(user_id);

-- 9. Enable RLS
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_applications ENABLE ROW LEVEL SECURITY;

-- 10. RLS: course_lessons
CREATE POLICY "Preview lessons public" ON public.course_lessons
  FOR SELECT TO public USING (is_preview = true AND is_published = true);
CREATE POLICY "Enrolled students view lessons" ON public.course_lessons
  FOR SELECT TO authenticated
  USING (course_id IN (SELECT course_id FROM public.course_enrollments WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "Instructors manage own course lessons" ON public.course_lessons
  FOR ALL TO authenticated
  USING (course_id IN (SELECT id FROM public.training_courses WHERE instructor_id = auth.uid()));
CREATE POLICY "Admins manage all lessons" ON public.course_lessons
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 11. RLS: course_enrollments
CREATE POLICY "Students view own enrollments" ON public.course_enrollments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Students can enroll" ON public.course_enrollments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Instructors view course enrollments" ON public.course_enrollments
  FOR SELECT TO authenticated
  USING (course_id IN (SELECT id FROM public.training_courses WHERE instructor_id = auth.uid()));
CREATE POLICY "Admins manage enrollments" ON public.course_enrollments
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 12. RLS: lesson_progress
CREATE POLICY "Students manage own progress" ON public.lesson_progress
  FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all progress" ON public.lesson_progress
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 13. RLS: course_reviews
CREATE POLICY "Approved reviews public" ON public.course_reviews
  FOR SELECT TO public USING (is_approved = true);
CREATE POLICY "Students write own review" ON public.course_reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Students update own review" ON public.course_reviews
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage reviews" ON public.course_reviews
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 14. RLS: instructor_applications
CREATE POLICY "Users view own application" ON public.instructor_applications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users submit application" ON public.instructor_applications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage applications" ON public.instructor_applications
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 15. Updated_at trigger for course_lessons
CREATE TRIGGER update_course_lessons_updated_at
  BEFORE UPDATE ON public.course_lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 16. Notification trigger for new enrollment
CREATE OR REPLACE FUNCTION public.notify_instructor_enrollment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  course RECORD; student_name TEXT;
BEGIN
  SELECT tc.title_en, tc.instructor_id INTO course FROM public.training_courses tc WHERE tc.id = NEW.course_id;
  SELECT p.full_name INTO student_name FROM public.profiles p WHERE p.user_id = NEW.user_id;
  IF course.instructor_id IS NOT NULL THEN
    PERFORM public.create_notification(
      course.instructor_id, 'enrollment',
      COALESCE(student_name, 'A student') || ' enrolled in ' || course.title_en,
      COALESCE(student_name, 'طالب') || ' سجل في ' || course.title_en,
      NULL, NULL, '/instructor/students',
      jsonb_build_object('course_id', NEW.course_id, 'student_user_id', NEW.user_id)
    );
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_new_enrollment AFTER INSERT ON public.course_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.notify_instructor_enrollment();
