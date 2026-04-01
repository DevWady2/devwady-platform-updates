
CREATE OR REPLACE FUNCTION public.notify_freelancer_hire_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  company_name_val TEXT;
  freelancer_uid UUID;
BEGIN
  SELECT cp.company_name INTO company_name_val FROM public.company_profiles cp WHERE cp.user_id = NEW.company_id;
  SELECT p.user_id INTO freelancer_uid FROM public.profiles p WHERE p.id = NEW.freelancer_profile_id;

  IF freelancer_uid IS NOT NULL THEN
    PERFORM public.create_notification(
      freelancer_uid,
      'hire_request',
      'Hire offer from ' || COALESCE(company_name_val, 'a company'),
      'عرض توظيف من ' || COALESCE(company_name_val, 'شركة'),
      'A company wants to hire you',
      'شركة ترغب في توظيفك',
      '/profile/hires',
      jsonb_build_object('hire_request_id', NEW.id, 'company_id', NEW.company_id)
    );
  END IF;
  RETURN NEW;
END;
$function$;
