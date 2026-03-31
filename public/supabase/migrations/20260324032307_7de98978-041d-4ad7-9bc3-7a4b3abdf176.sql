DROP POLICY IF EXISTS "Users can insert own non-admin role" ON public.user_roles;
CREATE POLICY "Users can insert own non-admin role" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND role IN ('individual'::app_role, 'company'::app_role, 'student'::app_role)
  );