
-- Gallery timeline events
CREATE TABLE public.gallery_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year_label text NOT NULL,
  title_en text NOT NULL,
  title_ar text,
  description_en text,
  description_ar text,
  icon text DEFAULT 'Rocket',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Timeline viewable by everyone" ON public.gallery_timeline
  FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Admins can manage timeline" ON public.gallery_timeline
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Gallery photos
CREATE TABLE public.gallery_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label_en text NOT NULL,
  label_ar text,
  image_url text,
  gradient text DEFAULT 'from-primary/20 to-secondary/20',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photos viewable by everyone" ON public.gallery_photos
  FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Admins can manage photos" ON public.gallery_photos
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Seed timeline
INSERT INTO public.gallery_timeline (year_label, title_en, title_ar, description_en, description_ar, icon, sort_order) VALUES
('2025 Q1', 'DevWady Founded', 'تأسيس DevWady', 'Started in Cairo with a vision to build real products and real talent.', 'بدأنا في القاهرة برؤية لبناء منتجات حقيقية وكفاءات حقيقية.', 'Rocket', 1),
('2025 Q2', 'First Team Assembled', 'تكوين أول فريق', 'Grew to 15+ developers, designers, and QA engineers.', 'نمونا لأكثر من 15 مطور ومصمم ومهندس ضمان جودة.', 'Users', 2),
('2025 Q3', 'YOZYA Launched', 'إطلاق YOZYA', 'Flagship multi-module ecosystem went live across Egypt.', 'تم إطلاق منظومة YOZYA متعددة الوحدات في مصر.', 'Trophy', 3),
('2025 Q4', 'Training Academy Opened', 'افتتاح أكاديمية التدريب', 'First batch of 20 trainees started learning by shipping.', 'بدأت أول دفعة من 20 متدرب التعلم من خلال بناء منتجات حقيقية.', 'GraduationCap', 4),
('2026 Q1', 'KSA Expansion', 'التوسع في السعودية', 'Opened operations in Saudi Arabia with new client partnerships.', 'افتتحنا عملياتنا في السعودية مع شراكات جديدة.', 'Rocket', 5);

-- Seed photos
INSERT INTO public.gallery_photos (label_en, label_ar, gradient, sort_order) VALUES
('Team Building Day', 'يوم بناء الفريق', 'from-primary/20 to-secondary/20', 1),
('Office Life', 'الحياة في المكتب', 'from-secondary/20 to-primary/20', 2),
('Bootcamp Batch 1', 'الدفعة الأولى من المعسكر', 'from-destructive/20 to-warning/20', 3),
('YOZYA Launch Party', 'حفل إطلاق YOZYA', 'from-warning/20 to-primary/20', 4),
('Client Workshop', 'ورشة عمل مع العملاء', 'from-primary/20 to-destructive/20', 5),
('Code Review Session', 'جلسة مراجعة الكود', 'from-secondary/20 to-warning/20', 6),
('Friday Fun', 'مرح يوم الجمعة', 'from-primary/30 to-secondary/30', 7),
('Team Lunch', 'غداء الفريق', 'from-warning/20 to-destructive/20', 8);
