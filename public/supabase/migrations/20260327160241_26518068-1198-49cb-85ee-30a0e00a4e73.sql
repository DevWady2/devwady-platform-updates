
-- Recommendation notification trigger (academy_recommendations → active)
CREATE OR REPLACE FUNCTION public.notify_on_recommendation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  instructor_name TEXT;
BEGIN
  IF NEW.status = 'active'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status)
  THEN
    SELECT COALESCE(p.full_name, 'An instructor')
      INTO instructor_name
      FROM public.profiles p
     WHERE p.user_id = NEW.recommended_by;

    instructor_name := COALESCE(instructor_name, 'An instructor');

    PERFORM public.create_notification(
      NEW.student_user_id,
      'recommendation_received',
      instructor_name || ' recommended you',
      CASE WHEN instructor_name = 'An instructor' THEN 'قام مدرّب بالتوصية بك' ELSE instructor_name || ' أوصى بك' END,
      COALESCE(NEW.strength_summary, NEW.evidence_summary, 'You received a new instructor recommendation.'),
      COALESCE(NEW.strength_summary, NEW.evidence_summary, 'لقد تلقّيت توصية جديدة من مدرّب.'),
      '/academy/portal/talent-profile',
      jsonb_build_object(
        'recommendation_id', NEW.id,
        'recommended_by', NEW.recommended_by,
        'course_id', NEW.course_id,
        'cohort_id', NEW.cohort_id,
        'recommendation_type', NEW.recommendation_type,
        'source', 'academy_talent_bridge'
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if present, then recreate
DROP TRIGGER IF EXISTS trg_recommendation_notification ON public.academy_recommendations;

CREATE TRIGGER trg_recommendation_notification
  AFTER INSERT OR UPDATE ON public.academy_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_recommendation();
