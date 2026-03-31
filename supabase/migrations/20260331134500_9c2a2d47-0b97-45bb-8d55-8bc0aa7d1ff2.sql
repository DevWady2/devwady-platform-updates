-- Tighten first-wave canonical business access helper to remove privilege widening.
-- Capabilities may refine access for a matching canonical account_type,
-- but they must never substitute for a mismatched account_type.
-- Legacy role fallback remains allowed only while profiles.account_type is unresolved.

CREATE OR REPLACE FUNCTION public.has_canonical_business_access(
  _user_id UUID,
  _account_type TEXT,
  _legacy_role public.app_role DEFAULT NULL,
  _capabilities TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH profile_identity AS (
    SELECT
      lower(COALESCE(p.account_type, '')) AS account_type,
      ARRAY(
        SELECT lower(value)
        FROM unnest(COALESCE(p.capabilities, ARRAY[]::TEXT[])) AS value
      ) AS capabilities
    FROM public.profiles p
    WHERE p.user_id = _user_id
  ),
  requested_capabilities AS (
    SELECT ARRAY(
      SELECT lower(value)
      FROM unnest(COALESCE(_capabilities, ARRAY[]::TEXT[])) AS value
    ) AS capabilities
  )
  SELECT
    EXISTS (
      SELECT 1
      FROM profile_identity pi
      CROSS JOIN requested_capabilities rc
      WHERE COALESCE(_account_type, '') <> ''
        AND pi.account_type = lower(_account_type)
        AND (
          cardinality(rc.capabilities) = 0
          OR EXISTS (
            SELECT 1
            FROM unnest(pi.capabilities) AS capability
            WHERE capability = ANY(rc.capabilities)
          )
        )
    )
    OR (
      _legacy_role IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.user_id = _user_id
          AND COALESCE(p.account_type, '') <> ''
      )
      AND public.has_role(_user_id, _legacy_role)
    );
$$;

COMMENT ON FUNCTION public.has_canonical_business_access(UUID, TEXT, public.app_role, TEXT[]) IS
  'Canonical-first business identity helper. Requires matching profiles.account_type; capabilities only refine matching-account access. Falls back to legacy has_role only while profiles.account_type is unresolved.';
