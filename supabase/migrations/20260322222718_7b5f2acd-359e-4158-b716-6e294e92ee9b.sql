
-- Create function to auto-generate slug from full_name on profiles
CREATE OR REPLACE FUNCTION public.generate_profile_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  -- Only generate if slug is null or full_name changed
  IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND OLD.full_name IS DISTINCT FROM NEW.full_name AND NEW.slug = OLD.slug) THEN
    IF NEW.full_name IS NOT NULL AND NEW.full_name != '' THEN
      base_slug := lower(regexp_replace(regexp_replace(NEW.full_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
    ELSE
      base_slug := 'user-' || left(NEW.user_id::text, 8);
    END IF;
    
    final_slug := base_slug;
    LOOP
      -- Check if slug exists (excluding current row)
      IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE slug = final_slug AND id != NEW.id) THEN
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

-- Create trigger
DROP TRIGGER IF EXISTS trigger_generate_profile_slug ON public.profiles;
CREATE TRIGGER trigger_generate_profile_slug
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_profile_slug();
