-- Fix consulting_bookings: enforce ownership on user_id
DROP POLICY "Anyone can create bookings" ON public.consulting_bookings;

CREATE POLICY "Public can create guest bookings" ON public.consulting_bookings
  FOR INSERT TO public
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Authenticated can create own bookings" ON public.consulting_bookings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Fix contact_submissions: restrict to only insertable fields (no admin_notes/status spoofing)
DROP POLICY "Anyone can submit contact form" ON public.contact_submissions;

CREATE POLICY "Anyone can submit contact form" ON public.contact_submissions
  FOR INSERT TO public
  WITH CHECK (
    status = 'new'
    AND admin_notes IS NULL
  );