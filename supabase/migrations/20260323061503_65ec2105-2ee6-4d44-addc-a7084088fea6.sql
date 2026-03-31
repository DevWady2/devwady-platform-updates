
ALTER TABLE public.company_profiles ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

CREATE OR REPLACE FUNCTION public.generate_company_slug()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND OLD.company_name IS DISTINCT FROM NEW.company_name AND NEW.slug = OLD.slug) THEN
    base_slug := lower(regexp_replace(regexp_replace(NEW.company_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
    IF base_slug = '' OR base_slug IS NULL THEN
      base_slug := 'company-' || left(NEW.id::text, 8);
    END IF;
    final_slug := base_slug;
    LOOP
      IF NOT EXISTS (SELECT 1 FROM public.company_profiles WHERE slug = final_slug AND id != NEW.id) THEN
        EXIT;
      END IF;
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_company_slug BEFORE INSERT OR UPDATE ON public.company_profiles
  FOR EACH ROW EXECUTE FUNCTION public.generate_company_slug();

-- Backfill existing companies with slugs
UPDATE public.company_profiles SET slug = lower(regexp_replace(regexp_replace(company_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) WHERE slug IS NULL;
