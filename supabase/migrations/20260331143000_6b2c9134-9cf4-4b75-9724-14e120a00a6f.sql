-- Tighten transitional single-account bridge on user_roles.
-- Compatibility-first: keep user_roles and has_role(...), but prevent duplicate identical legacy rows
-- and block repeated self-service bridge inserts before they hit the unique constraint.

-- public.user_roles already has a UNIQUE (user_id, role) guard from table creation.
-- Keep that as the storage-level duplicate protection and tighten the self-service RLS bridge as well.

DROP POLICY IF EXISTS "Users can insert own non-admin role" ON public.user_roles;
CREATE POLICY "Users can insert own non-admin role" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = public.user_roles.user_id
    AND public.user_roles.role <> 'admin'::public.app_role
    AND NOT EXISTS (
      SELECT 1
      FROM public.user_roles existing_same
      WHERE existing_same.user_id = public.user_roles.user_id
        AND existing_same.role = public.user_roles.role
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.user_roles existing_other
      WHERE existing_other.user_id = public.user_roles.user_id
        AND existing_other.role <> 'admin'::public.app_role
        AND existing_other.role IS DISTINCT FROM public.user_roles.role
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
