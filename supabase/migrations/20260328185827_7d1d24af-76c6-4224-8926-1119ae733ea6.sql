-- Remove anon SELECT policy - public pages will use get_public_profile RPC instead
DROP POLICY IF EXISTS "Public can view non-sensitive profile fields" ON public.profiles;

-- Update get_public_profile to work with slug lookup too
CREATE OR REPLACE FUNCTION public.get_public_profile_by_slug(p_slug text)
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
  github_url text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.user_id, p.full_name, p.avatar_url, p.bio, p.location,
         p.skills, p.is_devwady_alumni, p.track, p.batch, p.rating,
         p.projects_count, p.is_available, p.slug, p.portfolio_url,
         p.linkedin_url, p.github_url, p.created_at, p.updated_at
  FROM public.profiles p
  WHERE p.slug = p_slug AND p.account_status = 'active';
$$;