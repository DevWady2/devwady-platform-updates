
CREATE OR REPLACE FUNCTION public.update_freelancer_avg_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles SET rating = (
    SELECT ROUND(AVG(rating)::numeric, 2) FROM public.freelancer_reviews
    WHERE freelancer_user_id = NEW.freelancer_user_id AND is_approved = true
  ) WHERE user_id = NEW.freelancer_user_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_freelancer_review AFTER INSERT OR UPDATE ON public.freelancer_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_freelancer_avg_rating();

CREATE OR REPLACE FUNCTION public.update_company_avg_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.company_profiles SET avg_rating = (
    SELECT ROUND(AVG(rating)::numeric, 2) FROM public.company_reviews
    WHERE company_user_id = NEW.company_user_id AND is_approved = true
  ) WHERE user_id = NEW.company_user_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_company_review AFTER INSERT OR UPDATE ON public.company_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_company_avg_rating();
