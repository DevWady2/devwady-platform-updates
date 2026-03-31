
-- Create services table
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL DEFAULT 'service',
  icon text NOT NULL DEFAULT 'Layers',
  title_en text NOT NULL,
  title_ar text,
  description_en text,
  description_ar text,
  features_en text[] DEFAULT '{}'::text[],
  features_ar text[] DEFAULT '{}'::text[],
  color text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Services viewable by everyone" ON public.services
  FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Admins can manage services" ON public.services
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed sectors
INSERT INTO public.services (section, icon, title_en, title_ar, description_en, description_ar, color, sort_order) VALUES
('sector', 'Code2', 'Software Delivery', 'تسليم البرمجيات', 'End-to-end software development and delivery', 'تطوير وتسليم البرمجيات من البداية للنهاية', 'from-primary to-secondary', 1),
('sector', 'Users', 'Outsourcing & Hiring', 'التوظيف الخارجي', 'Qualified developers and engineers to augment your team', 'توفير مطورين ومهندسين مؤهلين لتعزيز فريقك', 'from-primary to-primary', 2),
('sector', 'GraduationCap', 'Consulting & Training', 'الاستشارات والتدريب', 'Expert consulting and professional training programs', 'استشارات الخبراء وبرامج التدريب المهني', 'from-secondary to-primary', 3);

-- Seed core services
INSERT INTO public.services (section, icon, title_en, title_ar, description_en, description_ar, features_en, features_ar, sort_order) VALUES
('service', 'Smartphone', 'Mobile Applications', 'تطبيقات الموبايل', 'Native & cross-platform mobile apps', 'تطبيقات موبايل أصلية ومتعددة المنصات', 
  ARRAY['Native & cross-platform iOS/Android apps', 'Payment & maps integration', 'Real-time notifications & tracking', 'App Store & Google Play deployment'],
  ARRAY['تطبيقات iOS و Android أصلية وهجينة', 'تكامل مع أنظمة الدفع والخرائط', 'إشعارات فورية وتتبع مباشر', 'نشر على App Store و Google Play'], 1),
('service', 'Globe', 'Web Development', 'تطوير المواقع', 'Corporate websites, platforms & e-commerce', 'مواقع مؤسسية ومنصات ومتاجر إلكترونية',
  ARRAY['Corporate websites & landing pages', 'Content Management Systems (CMS)', 'E-commerce & digital platforms', 'SEO optimization & performance'],
  ARRAY['مواقع مؤسسية وصفحات هبوط', 'أنظمة إدارة محتوى (CMS)', 'متاجر إلكترونية ومنصات رقمية', 'تحسين محركات البحث والأداء'], 2),
('service', 'Server', 'Enterprise Systems', 'الأنظمة المؤسسية', 'ERP, portals & scalable cloud solutions', 'أنظمة ERP وبوابات وحلول سحابية',
  ARRAY['ERP systems & internal portals', 'Advanced dashboards & reporting', 'Third-party API integrations', 'Scalable cloud-based solutions'],
  ARRAY['أنظمة ERP وبوابات داخلية', 'لوحات تحكم وتقارير متقدمة', 'تكامل مع أنظمة خارجية وAPIs', 'حلول سحابية قابلة للتوسع'], 3),
('service', 'Palette', 'UI/UX Design', 'تصميم الواجهات', 'User research, prototyping & design systems', 'بحث المستخدمين والنماذج الأولية وأنظمة التصميم',
  ARRAY['User research & analysis', 'Wireframes & interactive prototypes', 'Scalable design systems', 'Usability testing & iteration'],
  ARRAY['بحث وتحليل المستخدمين', 'تصميم واجهات تفاعلية (Wireframes & Prototypes)', 'أنظمة تصميم متكاملة (Design Systems)', 'اختبار قابلية الاستخدام'], 4),
('service', 'ShieldCheck', 'Quality Assurance', 'ضمان الجودة', 'Comprehensive manual & automated testing', 'اختبار شامل يدوي وآلي',
  ARRAY['Manual & automated testing', 'Performance & security testing', 'Cross-device compatibility testing', 'Detailed quality reports'],
  ARRAY['اختبار يدوي وآلي شامل', 'اختبار الأداء والأمان', 'اختبار التوافق عبر الأجهزة', 'تقارير جودة مفصلة'], 5),
('service', 'Wrench', 'IT Services & DevOps', 'خدمات تقنية المعلومات', 'Cloud infrastructure, maintenance & CI/CD', 'بنية سحابية وصيانة وCI/CD',
  ARRAY['Cloud infrastructure management', 'Ongoing maintenance & support', 'DevOps & CI/CD solutions', 'Performance & security monitoring'],
  ARRAY['إدارة البنية التحتية السحابية', 'صيانة ودعم فني مستمر', 'حلول DevOps وCI/CD', 'مراقبة الأداء والأمان'], 6),
('service', 'Headphones', 'Technology Consulting', 'الاستشارات التقنية', 'Strategic and technical advice to guide your digital decisions', 'نصائح استراتيجية وتقنية لتوجيه قراراتك الرقمية',
  ARRAY['Current architecture assessment', 'Product strategy & tech roadmap', 'Technology stack selection', 'Code review & security audit'],
  ARRAY['تقييم البنية التقنية الحالية', 'استراتيجية المنتج والخريطة التقنية', 'اختيار التقنيات المناسبة', 'مراجعة الكود والأمان'], 7),
('service', 'BookOpen', 'Training & Bootcamps', 'التدريب والبوتكامب', 'Technical and non-technical training programs', 'برامج تدريب تقنية وغير تقنية',
  ARRAY['Advanced tech training (Flutter, React, Backend)', 'Non-tech training (PM, QA, Scrum)', 'Intensive bootcamps with real projects', 'Custom corporate programs'],
  ARRAY['تدريب تقني متقدم (Flutter, React, Backend)', 'تدريب غير تقني (إدارة مشاريع، QA)', 'بوتكامبات مكثفة بمشاريع حقيقية', 'برامج مخصصة للشركات'], 8),
('service', 'UserPlus', 'Outsourcing Hiring', 'التوظيف الخارجي', 'Qualified developers and engineers to augment your team', 'توفير مطورين ومهندسين مؤهلين لتعزيز فريقك',
  ARRAY['Ready-to-deploy developers', 'Specialized teams per project', 'Full or partial management', 'Flexible scaling up & down'],
  ARRAY['مطورون جاهزون للعمل فوراً', 'فرق متخصصة حسب المشروع', 'إدارة كاملة أو جزئية', 'مرونة في التوسع والتقليص'], 9);

-- Seed delivery steps
INSERT INTO public.services (section, icon, title_en, title_ar, description_en, description_ar, sort_order) VALUES
('delivery_step', 'Search', 'Discover', 'اكتشاف', 'Understand requirements & market', 'فهم المتطلبات والسوق', 1),
('delivery_step', 'PenTool', 'Design', 'تصميم', 'Design the optimal solution', 'تصميم الحل الأمثل', 2),
('delivery_step', 'Hammer', 'Build', 'بناء', 'Develop & implement', 'تطوير وتنفيذ', 3),
('delivery_step', 'TestTube', 'Test', 'اختبار', 'Quality assurance', 'ضمان الجودة', 4),
('delivery_step', 'Rocket', 'Launch', 'إطلاق', 'Deploy & go live', 'نشر وتشغيل', 5),
('delivery_step', 'RefreshCw', 'Improve', 'تحسين', 'Continuous improvement', 'تحسين مستمر', 6);

-- Seed engagement models
INSERT INTO public.services (section, icon, title_en, title_ar, description_en, description_ar, sort_order) VALUES
('engagement_model', 'Briefcase', 'Project Delivery', 'تسليم مشروع', 'Fixed scope, clear timeline, full delivery', 'نطاق محدد، جدول زمني واضح، تسليم كامل', 1),
('engagement_model', 'UsersRound', 'Dedicated Squad', 'فريق مخصص', 'Full team working exclusively on your project', 'فريق متكامل يعمل حصرياً على مشروعك', 2),
('engagement_model', 'UserPlus', 'Staff Augmentation', 'تعزيز الفريق', 'Developers integrated into your existing team', 'مطورون يندمجون مع فريقك الحالي', 3);
