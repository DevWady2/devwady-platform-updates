-- 1. Instructors can view their own courses (any status)
CREATE POLICY "Instructors view own courses"
  ON public.training_courses FOR SELECT TO authenticated
  USING (instructor_id = auth.uid());

-- 2. Instructors can create courses assigned to themselves
CREATE POLICY "Instructors insert own courses"
  ON public.training_courses FOR INSERT TO authenticated
  WITH CHECK (instructor_id = auth.uid());

-- 3. Instructors can update their own courses
CREATE POLICY "Instructors update own courses"
  ON public.training_courses FOR UPDATE TO authenticated
  USING (instructor_id = auth.uid())
  WITH CHECK (instructor_id = auth.uid());