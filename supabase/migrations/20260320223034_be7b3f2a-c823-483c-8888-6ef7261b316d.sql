
-- Media content items (videos, podcasts, reels, etc.)
CREATE TABLE public.media_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en text NOT NULL,
  title_ar text,
  type text NOT NULL DEFAULT 'video',
  category text DEFAULT 'tech',
  duration text,
  thumbnail_url text,
  external_url text,
  description_en text,
  description_ar text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Media items viewable by everyone" ON public.media_items
  FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Admins can manage media items" ON public.media_items
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Seed current videos
INSERT INTO public.media_items (title_en, title_ar, type, category, duration, sort_order) VALUES
('Building YOZYA: Behind the Scenes', 'بناء YOZYA: كواليس العمل', 'video', 'tech', '12:34', 1),
('A Day in DevWady''s Office', 'يوم في مكتب DevWady', 'reel', 'work', '0:45', 2),
('Flutter Tips: State Management', 'نصائح Flutter: إدارة الحالة', 'video', 'tech', '8:15', 3),
('How We Hire Great Developers', 'كيف نوظف مطورين ممتازين', 'reel', 'business', '1:20', 4),
('Career Advice for Junior Developers', 'نصائح مهنية للمطورين المبتدئين', 'video', 'advising', '15:00', 5),
('Egyptian Tech Market in 2026', 'سوق التكنولوجيا المصري في 2026', 'video', 'business', '20:10', 6);

-- Seed current podcasts
INSERT INTO public.media_items (title_en, title_ar, type, category, duration, sort_order) VALUES
('Episode 1: Why We Started DevWady', 'الحلقة 1: لماذا أسسنا DevWady', 'podcast', 'business', '45 min', 7),
('Episode 2: The Future of Mobile Development', 'الحلقة 2: مستقبل تطوير تطبيقات الموبايل', 'podcast', 'tech', '38 min', 8),
('Episode 3: Freelancing vs Full-Time in Tech', 'الحلقة 3: العمل الحر مقابل الدوام الكامل في التقنية', 'podcast', 'business', '52 min', 9);
