-- Single-account cutover: compatibility-first canonical profile fields and helpers
-- Additive only. Keeps public.user_roles and public.has_role(...) intact.

-- 1) Canonical single-account columns on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type TEXT,
  ADD COLUMN IF NOT EXISTS approval_status TEXT,
  ADD COLUMN IF NOT EXISTS badges JSONB,
  ADD COLUMN IF NOT EXISTS entitlements JSONB,
  ADD COLUMN IF NOT EXISTS capabilities TEXT[] NOT NULL DEFAULT '{}'::TEXT[];

COMMENT ON COLUMN public.profiles.account_type IS
  'Canonical single-account identity. Transitional source-of-truth target for account identity.';
COMMENT ON COLUMN public.profiles.approval_status IS
  'Optional canonical approval state for single-account migration.';
COMMENT ON COLUMN public.profiles.badges IS
  'Optional canonical badges payload for single-account migration.';
COMMENT ON COLUMN public.profiles.entitlements IS
  'Optional canonical entitlements payload for single-account migration.';
COMMENT ON COLUMN public.profiles.capabilities IS
  'Canonical capability list for single-account migration.';

-- 2) Mapping + helper functions
CREATE OR REPLACE FUNCTION public.legacy_role_to_account_type(_role public.app_role)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE _role
    WHEN 'individual'::public.app_role THEN 'freelancer'
    WHEN 'company'::public.app_role THEN 'company'
    WHEN 'student'::public.app_role THEN 'student'
    WHEN 'instructor'::public.app_role THEN 'instructor'
    WHEN 'expert'::public.app_role THEN 'expert'
    WHEN 'admin'::public.app_role THEN 'admin'
    ELSE NULL
  END
$$;

CREATE OR REPLACE FUNCTION public.default_capabilities_for_account_type(_account_type TEXT)
RETURNS TEXT[]
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    CASE lower(_account_type)
      WHEN 'freelancer' THEN ARRAY['browse_courses', 'enroll_courses', 'apply_jobs', 'receive_hires', 'build_portfolio', 'request_services', 'book_consultations', 'track_projects', 'earn_from_platform']::TEXT[]
      WHEN 'company' THEN ARRAY['browse_courses', 'enroll_courses', 'post_jobs', 'request_services', 'book_consultations', 'track_projects', 'manage_team']::TEXT[]
      WHEN 'student' THEN ARRAY['browse_courses', 'enroll_courses', 'request_services', 'book_consultations']::TEXT[]
      WHEN 'instructor' THEN ARRAY['browse_courses', 'create_courses', 'earn_from_platform']::TEXT[]
      WHEN 'expert' THEN ARRAY['browse_courses', 'give_consultations', 'earn_from_platform']::TEXT[]
      WHEN 'admin' THEN ARRAY['admin_backoffice', 'browse_courses', 'enroll_courses', 'apply_jobs', 'post_jobs', 'request_services', 'book_consultations', 'track_projects', 'manage_team']::TEXT[]
      ELSE ARRAY[]::TEXT[]
    END,
    ARRAY[]::TEXT[]
  )
$$;

CREATE OR REPLACE FUNCTION public.has_account_type(_user_id UUID, _account_type TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = _user_id
      AND lower(COALESCE(p.account_type, '')) = lower(COALESCE(_account_type, ''))
  )
$$;

CREATE OR REPLACE FUNCTION public.has_capability(_user_id UUID, _capability TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = _user_id
      AND lower(COALESCE(_capability, '')) = ANY (
        SELECT lower(value)
        FROM unnest(COALESCE(p.capabilities, ARRAY[]::TEXT[])) AS value
      )
  )
$$;

-- 3) Transitional admin-review table for unresolved account-type backfill
CREATE TABLE IF NOT EXISTS public.account_type_migration_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  detected_roles public.app_role[] NOT NULL DEFAULT '{}'::public.app_role[],
  detected_account_types TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  review_reason TEXT NOT NULL,
  proposed_account_type TEXT,
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.account_type_migration_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view account type migration reviews" ON public.account_type_migration_reviews;
CREATE POLICY "Admins can view account type migration reviews"
  ON public.account_type_migration_reviews
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage account type migration reviews" ON public.account_type_migration_reviews;
CREATE POLICY "Admins can manage account type migration reviews"
  ON public.account_type_migration_reviews
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP TRIGGER IF EXISTS update_account_type_migration_reviews_updated_at ON public.account_type_migration_reviews;
CREATE TRIGGER update_account_type_migration_reviews_updated_at
  BEFORE UPDATE ON public.account_type_migration_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Backfill canonical account_type from legacy user_roles
WITH role_summary AS (
  SELECT
    ur.user_id,
    ARRAY_AGG(DISTINCT ur.role ORDER BY ur.role) AS detected_roles,
    ARRAY_AGG(DISTINCT public.legacy_role_to_account_type(ur.role) ORDER BY public.legacy_role_to_account_type(ur.role)) AS detected_account_types,
    COUNT(DISTINCT CASE WHEN ur.role <> 'admin'::public.app_role THEN ur.role END) AS non_admin_role_count,
    MIN(CASE WHEN ur.role <> 'admin'::public.app_role THEN public.legacy_role_to_account_type(ur.role) END) AS sole_non_admin_account_type,
    BOOL_OR(ur.role = 'admin'::public.app_role) AS has_admin_role,
    COUNT(DISTINCT ur.role) AS total_role_count
  FROM public.user_roles ur
  GROUP BY ur.user_id
),
resolvable AS (
  SELECT
    rs.user_id,
    CASE
      WHEN rs.non_admin_role_count = 1 THEN rs.sole_non_admin_account_type
      WHEN rs.non_admin_role_count = 0 AND rs.has_admin_role AND rs.total_role_count = 1 THEN 'admin'
      ELSE NULL
    END AS resolved_account_type
  FROM role_summary rs
)
UPDATE public.profiles p
SET
  account_type = r.resolved_account_type,
  capabilities = CASE
    WHEN COALESCE(array_length(p.capabilities, 1), 0) = 0 THEN public.default_capabilities_for_account_type(r.resolved_account_type)
    ELSE p.capabilities
  END
FROM resolvable r
WHERE p.user_id = r.user_id
  AND r.resolved_account_type IS NOT NULL
  AND COALESCE(p.account_type, '') = '';

-- Normalize any stray legacy values if this migration is re-run after partial manual changes.
UPDATE public.profiles
SET account_type = 'freelancer'
WHERE account_type = 'individual';

-- Backfill default capabilities for already-resolved profiles that still have an empty capability set.
UPDATE public.profiles
SET capabilities = public.default_capabilities_for_account_type(account_type)
WHERE COALESCE(account_type, '') <> ''
  AND COALESCE(array_length(capabilities, 1), 0) = 0;

-- Flag ambiguous multi-role users for admin review instead of auto-collapsing them.
WITH role_summary AS (
  SELECT
    ur.user_id,
    ARRAY_AGG(DISTINCT ur.role ORDER BY ur.role) AS detected_roles,
    ARRAY_AGG(DISTINCT public.legacy_role_to_account_type(ur.role) ORDER BY public.legacy_role_to_account_type(ur.role)) AS detected_account_types,
    COUNT(DISTINCT CASE WHEN ur.role <> 'admin'::public.app_role THEN ur.role END) AS non_admin_role_count,
    BOOL_OR(ur.role = 'admin'::public.app_role) AS has_admin_role
  FROM public.user_roles ur
  GROUP BY ur.user_id
),
ambiguous AS (
  SELECT
    rs.user_id,
    rs.detected_roles,
    rs.detected_account_types,
    'multiple_business_roles'::TEXT AS review_reason,
    NULL::TEXT AS proposed_account_type
  FROM role_summary rs
  WHERE rs.non_admin_role_count > 1
)
INSERT INTO public.account_type_migration_reviews (
  user_id,
  detected_roles,
  detected_account_types,
  review_reason,
  proposed_account_type
)
SELECT
  a.user_id,
  a.detected_roles,
  a.detected_account_types,
  a.review_reason,
  a.proposed_account_type
FROM ambiguous a
ON CONFLICT (user_id) DO UPDATE
SET
  detected_roles = EXCLUDED.detected_roles,
  detected_account_types = EXCLUDED.detected_account_types,
  review_reason = EXCLUDED.review_reason,
  proposed_account_type = EXCLUDED.proposed_account_type,
  updated_at = now();

-- 5) Update new-user profile bootstrap to write canonical account_type + capabilities.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _metadata_account_type TEXT;
  _canonical_account_type TEXT;
  _initial_status TEXT;
  _initial_approval_status TEXT;
BEGIN
  _metadata_account_type := COALESCE(
    NEW.raw_user_meta_data ->> 'account_type',
    NEW.raw_user_meta_data ->> 'accountType',
    'individual'
  );

  _canonical_account_type := CASE
    WHEN _metadata_account_type = 'individual' THEN 'freelancer'
    ELSE lower(_metadata_account_type)
  END;

  IF _canonical_account_type = 'company' THEN
    _initial_status := 'pending_approval';
    _initial_approval_status := 'pending_review';
  ELSE
    _initial_status := 'active';
    _initial_approval_status := NULL;
  END IF;

  INSERT INTO public.profiles (
    user_id,
    full_name,
    account_type,
    account_status,
    approval_status,
    capabilities
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    _canonical_account_type,
    _initial_status,
    _initial_approval_status,
    public.default_capabilities_for_account_type(_canonical_account_type)
  );

  PERFORM public.create_notification(
    NEW.id, 'welcome',
    'Welcome to DevWady!', 'مرحباً بك في DevWady!',
    'Complete your profile to get started', 'أكمل ملفك الشخصي للبدء',
    '/profile/edit?onboarding=true', '{}'::jsonb
  );

  RETURN NEW;
END;
$$;

-- 6) Stop self-service multi-role growth while preserving admin-managed writes.
DROP POLICY IF EXISTS "Users can insert own non-admin role" ON public.user_roles;
CREATE POLICY "Users can insert own non-admin role" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = public.user_roles.user_id
    AND public.user_roles.role <> 'admin'::public.app_role
    AND NOT EXISTS (
      SELECT 1
      FROM public.user_roles existing
      WHERE existing.user_id = public.user_roles.user_id
        AND existing.role <> 'admin'::public.app_role
        AND existing.role IS DISTINCT FROM public.user_roles.role
    )
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = public.user_roles.user_id
        AND (
          COALESCE(p.account_type, '') = ''
          OR p.account_type = public.legacy_role_to_account_type(public.user_roles.role)
        )
    )
  );
