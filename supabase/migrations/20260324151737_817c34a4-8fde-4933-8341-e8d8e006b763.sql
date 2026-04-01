
-- Add category column to distinguish projects from services
ALTER TABLE public.service_requests 
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'project';

-- Add metadata JSONB column for type-specific structured data
ALTER TABLE public.service_requests 
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_service_request_category()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.category NOT IN ('project', 'service') THEN
    RAISE EXCEPTION 'category must be project or service';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_service_request_category
  BEFORE INSERT OR UPDATE ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_service_request_category();

-- Backfill existing records
UPDATE public.service_requests 
  SET category = 'service' 
  WHERE service_type IN ('team_augmentation', 'qa_testing', 'it_services', 'consulting');

UPDATE public.service_requests 
  SET category = 'project' 
  WHERE service_type IN ('mobile_app', 'website', 'enterprise_system', 'uiux_design', 'other');

-- Add index for category-based filtering
CREATE INDEX IF NOT EXISTS idx_service_requests_category ON public.service_requests(category);
