-- One-time idempotent backfill: create missing notifications for
-- academy_recommendations (active) and academy_nominations (submitted)
-- that were inserted before the notification triggers were deployed.
-- Uses public.create_notification() to match trigger behavior exactly.

-- Block 1: Recommendation backfill
DO $$
DECLARE
  rec RECORD;
  instr_name TEXT;
  counter INT := 0;
BEGIN
  FOR rec IN
    SELECT r.*
    FROM public.academy_recommendations r
    WHERE r.status = 'active'
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.type = 'recommendation_received'
          AND n.user_id = r.student_user_id
          AND n.metadata->>'recommendation_id' = r.id::text
      )
  LOOP
    SELECT COALESCE(p.full_name, 'An instructor')
      INTO instr_name
      FROM public.profiles p
     WHERE p.user_id = rec.recommended_by;

    instr_name := COALESCE(instr_name, 'An instructor');

    PERFORM public.create_notification(
      rec.student_user_id,
      'recommendation_received',
      instr_name || ' recommended you',
      CASE WHEN instr_name = 'An instructor'
           THEN 'قام مدرّب بالتوصية بك'
           ELSE instr_name || ' أوصى بك' END,
      COALESCE(rec.strength_summary, rec.evidence_summary,
               'You received a new instructor recommendation.'),
      COALESCE(rec.strength_summary, rec.evidence_summary,
               'لقد تلقّيت توصية جديدة من مدرّب.'),
      '/academy/portal/talent-profile',
      jsonb_build_object(
        'recommendation_id', rec.id,
        'recommended_by', rec.recommended_by,
        'course_id', rec.course_id,
        'cohort_id', rec.cohort_id,
        'recommendation_type', rec.recommendation_type,
        'source', 'academy_talent_bridge'
      )
    );
    counter := counter + 1;
  END LOOP;
  RAISE NOTICE 'Backfill: % recommendation_received notifications created', counter;
END;
$$;

-- Block 2: Nomination backfill
DO $$
DECLARE
  nom RECORD;
  instr_name TEXT;
  counter INT := 0;
BEGIN
  FOR nom IN
    SELECT n2.*
    FROM public.academy_nominations n2
    WHERE n2.status = 'submitted'
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.type = 'nomination_received'
          AND n.user_id = n2.student_user_id
          AND n.metadata->>'nomination_id' = n2.id::text
      )
  LOOP
    SELECT COALESCE(p.full_name, 'An instructor')
      INTO instr_name
      FROM public.profiles p
     WHERE p.user_id = nom.nominated_by;

    instr_name := COALESCE(instr_name, 'An instructor');

    PERFORM public.create_notification(
      nom.student_user_id,
      'nomination_received',
      instr_name || ' nominated you for an opportunity',
      CASE WHEN instr_name = 'An instructor'
           THEN 'قام مدرّب بترشيحك لفرصة'
           ELSE instr_name || ' رشّحك لفرصة' END,
      COALESCE(nom.nomination_reason, nom.evidence_summary,
               'You received a new nomination.'),
      COALESCE(nom.nomination_reason, nom.evidence_summary,
               'لقد تلقّيت ترشيحًا جديدًا.'),
      '/academy/portal/talent-profile',
      jsonb_build_object(
        'nomination_id', nom.id,
        'nominated_by', nom.nominated_by,
        'course_id', nom.course_id,
        'cohort_id', nom.cohort_id,
        'linked_job_id', nom.linked_job_id,
        'nomination_scope', nom.nomination_scope,
        'target_company_name', nom.target_company_name,
        'source', 'academy_talent_bridge'
      )
    );
    counter := counter + 1;
  END LOOP;
  RAISE NOTICE 'Backfill: % nomination_received notifications created', counter;
END;
$$;