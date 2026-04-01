
-- Add slug column to consulting_experts
ALTER TABLE public.consulting_experts ADD COLUMN IF NOT EXISTS slug text;

-- Generate slugs from expert names (lowercase, replace spaces with hyphens)
UPDATE public.consulting_experts 
SET slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- Make slug unique and not null
ALTER TABLE public.consulting_experts ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.consulting_experts ADD CONSTRAINT consulting_experts_slug_unique UNIQUE (slug);

-- Add slug column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS slug text;

-- Generate slugs from full_name where available
UPDATE public.profiles 
SET slug = lower(regexp_replace(regexp_replace(full_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL AND full_name IS NOT NULL AND full_name != '';

-- For profiles without names, use a portion of user_id
UPDATE public.profiles 
SET slug = 'user-' || left(user_id::text, 8)
WHERE slug IS NULL;

-- Make slug unique
ALTER TABLE public.profiles ADD CONSTRAINT profiles_slug_unique UNIQUE (slug);
