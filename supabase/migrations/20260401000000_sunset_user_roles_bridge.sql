-- PR6 bridge sunset migration
-- Guard destructive changes behind readiness checks so this migration aborts until the data state is ready.

DO $bridge$
DECLARE
  unresolved_reviews bigint := 0;
  active_users_missing_account_type bigint := 0;
  bridge_only_users bigint := 0;
  multi_role_users bigint := 0;
BEGIN
  IF to_regclass('public.account_type_migration_reviews') IS NOT NULL THEN
    SELECT count(*)
    INTO unresolved_reviews
    FROM public.account_type_migration_reviews
    WHERE coalesce(status, 'pending') NOT IN ('resolved', 'dismissed');
  END IF;

  SELECT count(*)
  INTO active_users_missing_account_type
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  WHERE u.deleted_at IS NULL
    AND p.account_type IS NULL;

  IF to_regclass('public.user_roles') IS NOT NULL THEN
    SELECT count(DISTINCT ur.user_id)
    INTO bridge_only_users
    FROM public.user_roles ur
    LEFT JOIN public.profiles p ON p.user_id = ur.user_id
    WHERE p.account_type IS NULL;

    SELECT count(*)
    INTO multi_role_users
    FROM (
      SELECT user_id
      FROM public.user_roles
      WHERE role <> 'admin'::public.app_role
      GROUP BY user_id
      HAVING count(DISTINCT role) > 1
    ) t;
  END IF;

  IF unresolved_reviews > 0
     OR active_users_missing_account_type > 0
     OR bridge_only_users > 0
     OR multi_role_users > 0 THEN
    RAISE EXCEPTION
      'Bridge sunset blocked. unresolved_reviews=%, active_users_missing_account_type=%, bridge_only_users=%, multi_role_users=%',
      unresolved_reviews, active_users_missing_account_type, bridge_only_users, multi_role_users;
  END IF;
END
$bridge$;

-- Canonicalize account_type_migration_reviews admin access.
DROP POLICY IF EXISTS "Admins can view account type migration reviews" ON public.account_type_migration_reviews;
CREATE POLICY "Admins can view account type migration reviews"
  ON public.account_type_migration_reviews
  FOR SELECT
  TO authenticated
  USING (public.has_account_type(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage account type migration reviews" ON public.account_type_migration_reviews;
CREATE POLICY "Admins can manage account type migration reviews"
  ON public.account_type_migration_reviews
  FOR ALL
  TO authenticated
  USING (public.has_account_type(auth.uid(), 'admin'))
  WITH CHECK (public.has_account_type(auth.uid(), 'admin'));

-- Drop transitional self-service policies on the legacy bridge table.
DROP POLICY IF EXISTS "Roles are viewable by everyone" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own non-admin role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage all roles" ON public.user_roles;

-- Keep has_role available as a canonical compatibility shim for any untouched historical references.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = _user_id
      AND p.account_type = CASE _role
        WHEN 'individual'::public.app_role THEN 'freelancer'
        ELSE _role::text
      END
  );
$fn$;

DROP FUNCTION IF EXISTS public.legacy_role_to_account_type(public.app_role);

DO $archive$
BEGIN
  IF to_regclass('public.user_roles') IS NOT NULL THEN
    IF to_regclass('public.user_roles_archive') IS NULL THEN
      EXECUTE 'CREATE TABLE public.user_roles_archive AS TABLE public.user_roles WITH DATA';
    ELSE
      EXECUTE 'INSERT INTO public.user_roles_archive SELECT ur.* FROM public.user_roles ur WHERE NOT EXISTS (SELECT 1 FROM public.user_roles_archive ura WHERE ura.id = ur.id)';
    END IF;
  END IF;
END
$archive$;

DROP TABLE IF EXISTS public.user_roles;
