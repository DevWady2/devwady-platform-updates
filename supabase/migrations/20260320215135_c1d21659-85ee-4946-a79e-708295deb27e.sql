
ALTER TABLE public.portfolio_projects 
  ADD COLUMN IF NOT EXISTS metrics jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS links jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS channels jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS core_modules jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS brand_note text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS brand_note_ar text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS in_development text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS in_development_ar text DEFAULT NULL;
