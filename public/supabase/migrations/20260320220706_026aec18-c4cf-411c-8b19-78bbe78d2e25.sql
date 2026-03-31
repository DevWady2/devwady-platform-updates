
-- Page views tracking table
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  referrer text,
  user_agent text,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert page views (anonymous tracking)
CREATE POLICY "Anyone can insert page views" ON public.page_views
  FOR INSERT TO public WITH CHECK (true);

-- Only admins can read analytics
CREATE POLICY "Admins can read page views" ON public.page_views
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for fast analytics queries
CREATE INDEX idx_page_views_created_at ON public.page_views (created_at DESC);
CREATE INDEX idx_page_views_path ON public.page_views (path);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.page_views;
