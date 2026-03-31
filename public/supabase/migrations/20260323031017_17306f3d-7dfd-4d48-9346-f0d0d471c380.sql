
INSERT INTO storage.buckets (id, name, public) VALUES ('course-content', 'course-content', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Enrolled students can view course content" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'course-content'
    AND EXISTS (
      SELECT 1 FROM public.course_enrollments ce
      JOIN public.training_courses tc ON tc.id = ce.course_id
      WHERE ce.user_id = auth.uid() AND ce.status = 'active'
      AND (storage.foldername(name))[1] = tc.id::text
    )
  );

CREATE POLICY "Instructors upload own course content" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'course-content'
    AND EXISTS (
      SELECT 1 FROM public.training_courses tc
      WHERE tc.instructor_id = auth.uid()
      AND (storage.foldername(name))[1] = tc.id::text
    )
  );

CREATE POLICY "Admins manage course content" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'course-content' AND public.has_role(auth.uid(), 'admin'));
