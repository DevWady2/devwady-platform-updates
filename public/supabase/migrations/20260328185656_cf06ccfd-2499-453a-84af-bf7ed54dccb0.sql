-- Fix 1: Restrict profiles SELECT to authenticated users only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Create a security definer function for public pages needing basic profile info (excludes phone, hourly_rate, account_status)
CREATE OR REPLACE FUNCTION public.get_public_profile(p_user_id uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  full_name text,
  avatar_url text,
  bio text,
  location text,
  skills text[],
  is_devwady_alumni boolean,
  track text,
  batch text,
  rating numeric,
  projects_count integer,
  is_available boolean,
  slug text,
  portfolio_url text,
  linkedin_url text,
  github_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.user_id, p.full_name, p.avatar_url, p.bio, p.location,
         p.skills, p.is_devwady_alumni, p.track, p.batch, p.rating,
         p.projects_count, p.is_available, p.slug, p.portfolio_url,
         p.linkedin_url, p.github_url
  FROM public.profiles p
  WHERE p.user_id = p_user_id;
$$;

-- Fix 2: Remove the dangerous public booking SELECT policy
-- The lookup-bookings edge function already handles guest lookups securely
DROP POLICY IF EXISTS "Public can track bookings by email" ON public.consulting_bookings;