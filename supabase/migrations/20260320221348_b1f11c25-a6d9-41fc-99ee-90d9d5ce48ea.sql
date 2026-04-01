
-- Training courses table
CREATE TABLE public.training_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  icon text NOT NULL DEFAULT 'Layers',
  emoji text,
  color text,
  title_en text NOT NULL,
  title_ar text,
  description_en text,
  description_ar text,
  duration_en text,
  duration_ar text,
  level_en text,
  level_ar text,
  total_lessons integer DEFAULT 0,
  total_projects integer DEFAULT 0,
  outcomes_en text[] DEFAULT '{}'::text[],
  outcomes_ar text[] DEFAULT '{}'::text[],
  tools text[] DEFAULT '{}'::text[],
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Course modules table
CREATE TABLE public.course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.training_courses(id) ON DELETE CASCADE NOT NULL,
  title_en text NOT NULL,
  title_ar text,
  lessons integer DEFAULT 0,
  duration text,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Course webinars table
CREATE TABLE public.course_webinars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.training_courses(id) ON DELETE CASCADE NOT NULL,
  title_en text NOT NULL,
  title_ar text,
  schedule text,
  speaker text,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_webinars ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Active courses viewable by everyone" ON public.training_courses
  FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admins can manage courses" ON public.training_courses
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Modules viewable by everyone" ON public.course_modules
  FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage modules" ON public.course_modules
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Webinars viewable by everyone" ON public.course_webinars
  FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage webinars" ON public.course_webinars
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
