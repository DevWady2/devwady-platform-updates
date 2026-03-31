-- 1. Add account_status columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS status_reason TEXT,
  ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status_changed_by UUID;

-- 2. Update handle_new_user trigger to set initial status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _account_type TEXT;
  _initial_status TEXT;
BEGIN
  _account_type := COALESCE(NEW.raw_user_meta_data ->> 'account_type', 'individual');

  IF _account_type = 'company' THEN
    _initial_status := 'pending_approval';
  ELSE
    _initial_status := 'active';
  END IF;

  INSERT INTO public.profiles (user_id, full_name, account_status)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', _initial_status);

  PERFORM public.create_notification(
    NEW.id, 'welcome',
    'Welcome to DevWady!', 'مرحباً بك في DevWady!',
    'Complete your profile to get started', 'أكمل ملفك الشخصي للبدء',
    '/profile/edit?onboarding=true', '{}'::jsonb
  );

  RETURN NEW;
END;
$$;

-- 3. Notify admins when company account needs approval
CREATE OR REPLACE FUNCTION public.notify_admin_pending_company()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_rec RECORD;
BEGIN
  IF NEW.account_status = 'pending_approval' AND (OLD IS NULL OR OLD.account_status IS DISTINCT FROM 'pending_approval') THEN
    FOR admin_rec IN SELECT user_id FROM public.user_roles WHERE role = 'admin'
    LOOP
      PERFORM public.create_notification(
        admin_rec.user_id, 'account_review',
        'New company account needs approval: ' || COALESCE(NEW.full_name, 'Unknown'),
        'حساب شركة جديد يحتاج موافقة: ' || COALESCE(NEW.full_name, 'غير معروف'),
        NULL, NULL, '/admin/users',
        jsonb_build_object('user_id', NEW.user_id, 'status', 'pending_approval')
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_status_change
  AFTER INSERT OR UPDATE OF account_status ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_pending_company();

-- 4. Update role insertion policy
DROP POLICY IF EXISTS "Users can insert own non-admin role" ON public.user_roles;
CREATE POLICY "Users can insert own non-admin role" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND role IN ('individual'::app_role, 'company'::app_role, 'student'::app_role)
  );

-- 5. Function to check account status
CREATE OR REPLACE FUNCTION public.get_account_status(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(account_status, 'active') FROM public.profiles WHERE user_id = _user_id
$$;