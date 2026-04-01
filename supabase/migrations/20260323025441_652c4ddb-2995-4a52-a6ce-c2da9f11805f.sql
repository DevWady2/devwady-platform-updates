
CREATE OR REPLACE FUNCTION public.notify_client_session_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed' THEN
    IF NEW.user_id IS NOT NULL THEN
      PERFORM public.create_notification(
        NEW.user_id, 'booking_completed',
        'How was your session?', 'كيف كانت جلستك؟',
        'Please rate your experience', 'يرجى تقييم تجربتك',
        '/profile/bookings',
        jsonb_build_object('booking_id', NEW.id)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_session_completed
  AFTER UPDATE ON public.consulting_bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_client_session_complete();
