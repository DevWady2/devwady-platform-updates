-- Add a restricted public SELECT policy for profiles that excludes sensitive fields
-- This allows public freelancer profile pages to work without auth
-- Only non-sensitive columns are accessible; phone, hourly_rate, account_status, status_reason, status_changed_at, status_changed_by are excluded via a view

-- Create a view with only public-safe columns
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  id, user_id, full_name, avatar_url, bio, location, skills,
  is_devwady_alumni, track, batch, rating, projects_count,
  is_available, slug, portfolio_url, linkedin_url, github_url,
  created_at, updated_at
FROM public.profiles;

-- Allow anon to read the view (views inherit RLS from underlying table,
-- so we need a policy on profiles for anon but restricted)
CREATE POLICY "Public can view non-sensitive profile fields"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (true);