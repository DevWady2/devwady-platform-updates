
ALTER TABLE public.consulting_bookings ADD COLUMN IF NOT EXISTS admin_notes text;

-- Allow public to select bookings by guest_email for order tracking
CREATE POLICY "Public can track bookings by email"
ON public.consulting_bookings
FOR SELECT
TO public
USING (guest_email IS NOT NULL);
