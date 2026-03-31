
-- Recommendation notification trigger
-- Fires only when status transitions to 'active' (INSERT or actual status change)
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

CREATE TRIGGER trg_recommendation_notification
  AFTER INSERT OR UPDATE ON public.academy_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_recommendation();

-- Nomination notification trigger
-- Fires only when status transitions to 'submitted' (INSERT or actual status change)
CREATE OR REPLACE FUNCTION public.notify_on_nomination()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  instructor_name TEXT;
BEGIN
  IF NEW.status = 'submitted'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status)
  THEN
    SELECT COALESCE(p.full_name, 'An instructor')
      INTO instructor_name
      FROM public.profiles p
     WHERE p.user_id = NEW.nominated_by;

    instructor_name := COALESCE(instructor_name, 'An instructor');

    PERFORM public.create_notification(
      NEW.student_user_id,
      'nomination_received',
      instructor_name || ' nominated you for an opportunity',
      CASE WHEN instructor_name = 'An instructor' THEN 'قام مدرّب بترشيحك لفرصة' ELSE instructor_name || ' رشّحك لفرصة' END,
      COALESCE(NEW.nomination_reason, NEW.evidence_summary, 'You received a new nomination.'),
      COALESCE(NEW.nomination_reason, NEW.evidence_summary, 'لقد تلقّيت ترشيحًا جديدًا.'),
      '/academy/portal/talent-profile',
      jsonb_build_object(
        'nomination_id', NEW.id,
        'nominated_by', NEW.nominated_by,
        'course_id', NEW.course_id,
        'cohort_id', NEW.cohort_id,
        'linked_job_id', NEW.linked_job_id,
        'nomination_scope', NEW.nomination_scope,
        'target_company_name', NEW.target_company_name,
        'source', 'academy_talent_bridge'
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_nomination_notification
  AFTER INSERT OR UPDATE ON public.academy_nominations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_nomination();
