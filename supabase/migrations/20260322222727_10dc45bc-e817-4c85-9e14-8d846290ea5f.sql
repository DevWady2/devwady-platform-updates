
-- Fix search_path for generate_profile_slug function
ALTER FUNCTION public.generate_profile_slug() SET search_path = public;
