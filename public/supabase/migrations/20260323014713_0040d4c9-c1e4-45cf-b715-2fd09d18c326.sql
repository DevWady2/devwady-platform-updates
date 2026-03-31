-- 1. Extend app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'expert';

-- 2. Add user_id to consulting_experts
ALTER TABLE public.consulting_experts
  ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Add new columns to consulting_bookings
ALTER TABLE public.consulting_bookings
  ADD COLUMN IF NOT EXISTS meeting_url TEXT,
  ADD COLUMN IF NOT EXISTS expert_notes TEXT,
  ADD COLUMN IF NOT EXISTS rating INTEGER,
  ADD COLUMN IF NOT EXISTS review TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Add rating validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_booking_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.rating IS NOT NULL AND (NEW.rating < 1 OR NEW.rating > 5) THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_booking_rating_trigger
  BEFORE INSERT OR UPDATE ON public.consulting_bookings
  FOR EACH ROW EXECUTE FUNCTION public.validate_booking_rating();

-- 4. RLS policies for expert self-service
CREATE POLICY "Experts view own record" ON public.consulting_experts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Experts update own profile" ON public.consulting_experts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Experts manage own availability" ON public.expert_availability
  FOR ALL TO authenticated
  USING (expert_id IN (SELECT id FROM public.consulting_experts WHERE user_id = auth.uid()));

CREATE POLICY "Experts view own bookings" ON public.consulting_bookings
  FOR SELECT TO authenticated
  USING (expert_id IN (SELECT id FROM public.consulting_experts WHERE user_id = auth.uid()));

CREATE POLICY "Experts update own bookings" ON public.consulting_bookings
  FOR UPDATE TO authenticated
  USING (expert_id IN (SELECT id FROM public.consulting_experts WHERE user_id = auth.uid()))
  WITH CHECK (expert_id IN (SELECT id FROM public.consulting_experts WHERE user_id = auth.uid()));

-- 5. Notify expert on new booking
CREATE OR REPLACE FUNCTION public.notify_expert_new_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expert_uid UUID;
  client_name TEXT;
BEGIN
  SELECT user_id INTO expert_uid FROM public.consulting_experts WHERE id = NEW.expert_id;
  client_name := COALESCE(NEW.guest_name, 'A client');

  IF expert_uid IS NOT NULL THEN
    PERFORM public.create_notification(
      expert_uid,
      'booking_new',
      client_name || ' booked a session with you',
      client_name || ' حجز جلسة معك',
      NEW.booking_date || ' at ' || NEW.start_time,
      NEW.booking_date || ' الساعة ' || NEW.start_time,
      '/expert/bookings',
      jsonb_build_object('booking_id', NEW.id, 'booking_date', NEW.booking_date)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_expert_booking_created
  AFTER INSERT ON public.consulting_bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_expert_new_booking();

-- 6. Notify client when booking confirmed
CREATE OR REPLACE FUNCTION public.notify_client_booking_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expert_name_val TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'confirmed' AND NEW.user_id IS NOT NULL THEN
    SELECT name INTO expert_name_val FROM public.consulting_experts WHERE id = NEW.expert_id;
    PERFORM public.create_notification(
      NEW.user_id,
      'booking_confirmed',
      'Session confirmed with ' || COALESCE(expert_name_val, 'your expert'),
      'تم تأكيد الجلسة مع ' || COALESCE(expert_name_val, 'خبيرك'),
      'Your session on ' || NEW.booking_date || ' is confirmed. Check for the meeting link.',
      'جلستك في ' || NEW.booking_date || ' مؤكدة. تحقق من رابط الاجتماع.',
      '/profile/bookings',
      jsonb_build_object('booking_id', NEW.id, 'meeting_url', NEW.meeting_url)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_booking_confirmed
  AFTER UPDATE ON public.consulting_bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_client_booking_confirmed();