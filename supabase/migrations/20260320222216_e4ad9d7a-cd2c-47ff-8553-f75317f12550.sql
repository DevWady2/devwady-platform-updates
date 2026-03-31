
-- Job listings table
CREATE TABLE public.job_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en text NOT NULL,
  title_ar text,
  type_en text NOT NULL DEFAULT 'Full-time',
  type_ar text,
  location_en text,
  location_ar text,
  tags text[] DEFAULT '{}',
  is_urgent boolean DEFAULT false,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jobs viewable by everyone" ON public.job_listings
  FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Admins can manage jobs" ON public.job_listings
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Seed current data
INSERT INTO public.job_listings (title_en, title_ar, type_en, type_ar, location_en, location_ar, tags, is_urgent, sort_order) VALUES
('Mid Flutter Developer', 'مطور Flutter متوسط', 'Full-time', 'دوام كامل', 'Cairo / Remote', 'القاهرة / عن بعد', ARRAY['Flutter', 'Dart', 'Firebase'], true, 1),
('Node.js Backend Engineer', 'مهندس خوادم Node.js', 'Full-time', 'دوام كامل', 'Cairo', 'القاهرة', ARRAY['Node.js', 'PostgreSQL', 'Docker'], false, 2),
('UI/UX Designer', 'مصمم UI/UX', 'Contract', 'عقد', 'Remote', 'عن بعد', ARRAY['Figma', 'Design Systems', 'Prototyping'], false, 3),
('QA Engineer', 'مهندس ضمان الجودة', 'Full-time', 'دوام كامل', 'Cairo', 'القاهرة', ARRAY['Selenium', 'Cypress', 'API Testing'], true, 4);
