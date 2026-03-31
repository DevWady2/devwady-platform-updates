
-- Add canonical learning product metadata to training_courses (additive only)

ALTER TABLE public.training_courses
  ADD COLUMN IF NOT EXISTS learning_product_type text NOT NULL DEFAULT 'standard_course',
  ADD COLUMN IF NOT EXISTS delivery_mode text NOT NULL DEFAULT 'self_paced',
  ADD COLUMN IF NOT EXISTS requires_cohort boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS supports_assessments boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS supports_projects boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS supports_live_sessions boolean NOT NULL DEFAULT false;

-- Validation triggers (not CHECK constraints, per guidelines)

CREATE OR REPLACE FUNCTION public.validate_learning_product_type()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.learning_product_type NOT IN ('standard_course', 'live_course', 'bootcamp_track') THEN
    RAISE EXCEPTION 'learning_product_type must be standard_course, live_course, or bootcamp_track';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_learning_product_type ON public.training_courses;
CREATE TRIGGER trg_validate_learning_product_type
  BEFORE INSERT OR UPDATE ON public.training_courses
  FOR EACH ROW EXECUTE FUNCTION public.validate_learning_product_type();

CREATE OR REPLACE FUNCTION public.validate_delivery_mode()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.delivery_mode NOT IN ('self_paced', 'live', 'hybrid', 'cohort_based') THEN
    RAISE EXCEPTION 'delivery_mode must be self_paced, live, hybrid, or cohort_based';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_delivery_mode ON public.training_courses;
CREATE TRIGGER trg_validate_delivery_mode
  BEFORE INSERT OR UPDATE ON public.training_courses
  FOR EACH ROW EXECUTE FUNCTION public.validate_delivery_mode();

-- Backfill existing rows from legacy course_type
UPDATE public.training_courses
SET
  learning_product_type = CASE
    WHEN course_type = 'live' THEN 'live_course'
    ELSE 'standard_course'
  END,
  delivery_mode = CASE
    WHEN course_type = 'live' THEN 'live'
    WHEN course_type = 'hybrid' THEN 'hybrid'
    ELSE 'self_paced'
  END,
  supports_live_sessions = CASE
    WHEN course_type IN ('live', 'hybrid') THEN true
    ELSE false
  END,
  supports_projects = CASE
    WHEN total_projects IS NOT NULL AND total_projects > 0 THEN true
    ELSE false
  END
WHERE learning_product_type = 'standard_course' AND delivery_mode = 'self_paced';
