ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT now();

-- Set existing roles as primary
UPDATE public.user_roles SET is_primary = true WHERE is_primary = false;

-- Only one primary per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_primary ON public.user_roles (user_id) WHERE (is_primary = true);