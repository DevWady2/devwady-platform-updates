-- Auto-create company owner row on company_profiles insert
CREATE OR REPLACE FUNCTION public.auto_create_company_owner()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.company_team_members (company_user_id, member_user_id, role, accepted_at)
  VALUES (NEW.user_id, NEW.user_id, 'owner', now())
  ON CONFLICT (company_user_id, member_user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_company_profile_created AFTER INSERT ON public.company_profiles
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_company_owner();