-- Remove the prematurely deployed nomination trigger and function
-- (nomination notifications will be added in a separate step)
DROP TRIGGER IF EXISTS trg_nomination_notification ON public.academy_nominations;
DROP FUNCTION IF EXISTS public.notify_on_nomination();