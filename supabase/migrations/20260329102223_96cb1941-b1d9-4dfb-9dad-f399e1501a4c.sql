
-- ============================================================
-- SECURITY HARDENING MIGRATION — 4 Findings
-- ============================================================

-- ─── Finding 1: service_requests INSERT hardening ───────────
DROP POLICY IF EXISTS "Anyone can submit" ON public.service_requests;
CREATE POLICY "Anyone can submit safe defaults" ON public.service_requests
  FOR INSERT TO public
  WITH CHECK (
    status = 'new'
    AND priority IN ('normal', 'low')
    AND admin_notes IS NULL
    AND internal_estimate_usd IS NULL
    AND assigned_to IS NULL
  );

-- ─── Finding 2: consulting_experts — hide email from public ─
DROP POLICY IF EXISTS "Experts are viewable by everyone" ON public.consulting_experts;

-- RPC: list all active experts (safe columns, no email)
CREATE OR REPLACE FUNCTION public.get_public_experts()
RETURNS TABLE (
  id uuid, name text, name_ar text, role text, role_ar text,
  bio text, bio_ar text, avatar_url text, initials text,
  track text, track_ar text, specializations text[],
  specializations_ar text[], years_experience int,
  session_rate_usd numeric, session_duration_minutes int,
  is_active boolean, linkedin_url text, github_url text,
  slug text, user_id uuid, created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT id, name, name_ar, role, role_ar, bio, bio_ar,
    avatar_url, initials, track, track_ar, specializations,
    specializations_ar, years_experience, session_rate_usd,
    session_duration_minutes, is_active, linkedin_url, github_url,
    slug, user_id, created_at
  FROM consulting_experts WHERE is_active = true
  ORDER BY created_at;
$$;

-- RPC: single expert by slug (safe columns, no email)
CREATE OR REPLACE FUNCTION public.get_public_expert_by_slug(p_slug text)
RETURNS TABLE (
  id uuid, name text, name_ar text, role text, role_ar text,
  bio text, bio_ar text, avatar_url text, initials text,
  track text, track_ar text, specializations text[],
  specializations_ar text[], years_experience int,
  session_rate_usd numeric, session_duration_minutes int,
  is_active boolean, linkedin_url text, github_url text,
  slug text, user_id uuid, created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT id, name, name_ar, role, role_ar, bio, bio_ar,
    avatar_url, initials, track, track_ar, specializations,
    specializations_ar, years_experience, session_rate_usd,
    session_duration_minutes, is_active, linkedin_url, github_url,
    slug, user_id, created_at
  FROM consulting_experts WHERE slug = p_slug AND is_active = true
  LIMIT 1;
$$;

-- Lock down function permissions
REVOKE ALL ON FUNCTION public.get_public_experts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_experts() TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_public_expert_by_slug(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_expert_by_slug(text) TO anon, authenticated;

-- ─── Finding 3: profiles — restrict to self + admin ─────────
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ─── Finding 4: payments — drop public exposure ────────────
DROP POLICY IF EXISTS "Anyone can view by session" ON public.payments;

-- RPC: payment success page data (narrow columns, joined)
CREATE OR REPLACE FUNCTION public.get_payment_success(p_session_id text)
RETURNS TABLE (
  amount_usd numeric,
  status text,
  booking_date date,
  start_time time,
  end_time time,
  expert_name text,
  expert_name_ar text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT p.amount_usd, p.status, cb.booking_date, cb.start_time,
    cb.end_time, ce.name, ce.name_ar
  FROM payments p
  LEFT JOIN consulting_bookings cb ON cb.id = p.reference_id
  LEFT JOIN consulting_experts ce ON ce.id = cb.expert_id
  WHERE p.stripe_session_id = p_session_id
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_payment_success(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_payment_success(text) TO anon, authenticated;
