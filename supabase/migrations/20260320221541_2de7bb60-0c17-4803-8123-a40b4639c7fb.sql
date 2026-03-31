
-- Seed course modules using subqueries to get course_id from slug
-- Android modules
INSERT INTO public.course_modules (course_id, title_en, title_ar, lessons, duration, sort_order)
SELECT id, t.title_en, t.title_ar, t.lessons, t.duration, t.sort_order
FROM public.training_courses, (VALUES
  ('Kotlin Fundamentals & OOP', 'أساسيات Kotlin والبرمجة الكائنية', 8, '2 weeks', 1),
  ('Android UI — XML & Jetpack Compose', 'واجهات Android — XML و Jetpack Compose', 10, '2 weeks', 2),
  ('MVVM Architecture & Navigation', 'بنية MVVM والتنقل', 8, '2 weeks', 3),
  ('Networking — Retrofit & Room DB', 'الشبكات — Retrofit و Room DB', 8, '2 weeks', 4),
  ('Advanced Topics — Coroutines & DI', 'مواضيع متقدمة — Coroutines و DI', 6, '1 week', 5),
  ('Capstone — Publish to Google Play', 'مشروع التخرج — النشر على Google Play', 8, '1 week', 6)
) AS t(title_en, title_ar, lessons, duration, sort_order) WHERE slug = 'android';

-- iOS modules
INSERT INTO public.course_modules (course_id, title_en, title_ar, lessons, duration, sort_order)
SELECT id, t.title_en, t.title_ar, t.lessons, t.duration, t.sort_order
FROM public.training_courses, (VALUES
  ('Swift Fundamentals & OOP', 'أساسيات Swift والبرمجة الكائنية', 8, '2 weeks', 1),
  ('SwiftUI — Declarative UI', 'SwiftUI — واجهات تصريحية', 10, '2 weeks', 2),
  ('UIKit & Navigation Patterns', 'UIKit وأنماط التنقل', 8, '2 weeks', 3),
  ('Core Data & Networking', 'Core Data والشبكات', 8, '2 weeks', 4),
  ('Combine & Advanced Swift', 'Combine و Swift المتقدم', 6, '1 week', 5),
  ('Capstone — Publish to App Store', 'مشروع التخرج — النشر على App Store', 6, '1 week', 6)
) AS t(title_en, title_ar, lessons, duration, sort_order) WHERE slug = 'ios';

-- Flutter modules
INSERT INTO public.course_modules (course_id, title_en, title_ar, lessons, duration, sort_order)
SELECT id, t.title_en, t.title_ar, t.lessons, t.duration, t.sort_order
FROM public.training_courses, (VALUES
  ('Dart Fundamentals & OOP', 'أساسيات Dart والبرمجة الكائنية', 8, '2 weeks', 1),
  ('Flutter UI — Widgets & Layouts', 'واجهات Flutter — الودجات والتخطيطات', 10, '2 weeks', 2),
  ('State Management & Navigation', 'إدارة الحالة والتنقل', 8, '2 weeks', 3),
  ('API Integration & Backend', 'تكامل API والخوادم', 10, '2 weeks', 4),
  ('Firebase & Real-time Features', 'Firebase والميزات الفورية', 8, '1.5 weeks', 5),
  ('Capstone — Ship a Cross-Platform App', 'مشروع التخرج — أطلق تطبيقاً متعدد المنصات', 12, '2.5 weeks', 6)
) AS t(title_en, title_ar, lessons, duration, sort_order) WHERE slug = 'flutter';

-- Frontend modules
INSERT INTO public.course_modules (course_id, title_en, title_ar, lessons, duration, sort_order)
SELECT id, t.title_en, t.title_ar, t.lessons, t.duration, t.sort_order
FROM public.training_courses, (VALUES
  ('JavaScript Fundamentals & ES6+', 'أساسيات JavaScript و ES6+', 10, '2 weeks', 1),
  ('React Basics — Components & JSX', 'أساسيات React — المكونات و JSX', 10, '2 weeks', 2),
  ('State, Hooks & Side Effects', 'الحالة والـ Hooks والتأثيرات الجانبية', 8, '2 weeks', 3),
  ('Routing, Forms & API Integration', 'التنقل والنماذج وتكامل API', 8, '2 weeks', 4),
  ('TypeScript & Testing', 'TypeScript والاختبار', 6, '1 week', 5),
  ('Capstone — Build a Production Web App', 'مشروع التخرج — ابنِ تطبيق ويب للإنتاج', 8, '1 week', 6)
) AS t(title_en, title_ar, lessons, duration, sort_order) WHERE slug = 'frontend';

-- Backend modules
INSERT INTO public.course_modules (course_id, title_en, title_ar, lessons, duration, sort_order)
SELECT id, t.title_en, t.title_ar, t.lessons, t.duration, t.sort_order
FROM public.training_courses, (VALUES
  ('PHP Fundamentals & OOP', 'أساسيات PHP والبرمجة الكائنية', 8, '2 weeks', 1),
  ('Laravel Framework — Routing & MVC', 'إطار Laravel — التوجيه و MVC', 10, '2 weeks', 2),
  ('Database Design — Eloquent & Migrations', 'تصميم قواعد البيانات — Eloquent و Migrations', 8, '2 weeks', 3),
  ('RESTful APIs & Authentication', 'APIs و المصادقة', 8, '2 weeks', 4),
  ('Queues, Caching & Performance', 'الطوابير والتخزين المؤقت والأداء', 6, '1 week', 5),
  ('Capstone — Build a Production API', 'مشروع التخرج — ابنِ API للإنتاج', 8, '1 week', 6)
) AS t(title_en, title_ar, lessons, duration, sort_order) WHERE slug = 'backend';

-- SDET modules
INSERT INTO public.course_modules (course_id, title_en, title_ar, lessons, duration, sort_order)
SELECT id, t.title_en, t.title_ar, t.lessons, t.duration, t.sort_order
FROM public.training_courses, (VALUES
  ('SDET Fundamentals & SDLC', 'أساسيات SDET ودورة حياة البرمجيات', 6, '1.5 weeks', 1),
  ('Manual Testing & Test Strategy', 'الاختبار اليدوي واستراتيجية الاختبار', 8, '1.5 weeks', 2),
  ('API Testing — Postman & REST Assured', 'اختبار API', 8, '1.5 weeks', 3),
  ('UI Automation — Selenium & Cypress', 'أتمتة الواجهات — Selenium و Cypress', 10, '2 weeks', 4),
  ('Performance & Security Testing', 'اختبار الأداء والأمان', 6, '1.5 weeks', 5),
  ('CI/CD Integration & Capstone', 'تكامل CI/CD ومشروع التخرج', 6, '2 weeks', 6)
) AS t(title_en, title_ar, lessons, duration, sort_order) WHERE slug = 'sdet';

-- Design modules
INSERT INTO public.course_modules (course_id, title_en, title_ar, lessons, duration, sort_order)
SELECT id, t.title_en, t.title_ar, t.lessons, t.duration, t.sort_order
FROM public.training_courses, (VALUES
  ('Design Thinking & Research', 'التفكير التصميمي والبحث', 6, '1.5 weeks', 1),
  ('Figma Mastery', 'إتقان Figma', 10, '2 weeks', 2),
  ('UI Design Systems', 'أنظمة تصميم UI', 8, '2 weeks', 3),
  ('UX — Wireframes & Prototyping', 'UX — النماذج الأولية', 8, '2 weeks', 4),
  ('Responsive & Accessible Design', 'التصميم المتجاوب والوصول', 4, '1 week', 5),
  ('Portfolio Project', 'مشروع المحفظة', 6, '1.5 weeks', 6)
) AS t(title_en, title_ar, lessons, duration, sort_order) WHERE slug = 'design';

-- DevOps modules
INSERT INTO public.course_modules (course_id, title_en, title_ar, lessons, duration, sort_order)
SELECT id, t.title_en, t.title_ar, t.lessons, t.duration, t.sort_order
FROM public.training_courses, (VALUES
  ('Linux & Shell Scripting', 'Linux وبرمجة Shell', 6, '1 week', 1),
  ('Docker & Containerization', 'Docker والحاويات', 8, '1.5 weeks', 2),
  ('Kubernetes Orchestration', 'إدارة Kubernetes', 8, '1.5 weeks', 3),
  ('AWS Core Services', 'خدمات AWS الأساسية', 8, '1.5 weeks', 4),
  ('CI/CD Pipelines & IaC', 'خطوط CI/CD والبنية ككود', 6, '1.5 weeks', 5),
  ('Capstone — Full Cloud Deployment', 'مشروع التخرج — نشر سحابي كامل', 4, '1 week', 6)
) AS t(title_en, title_ar, lessons, duration, sort_order) WHERE slug = 'devops';

-- AI/ML modules
INSERT INTO public.course_modules (course_id, title_en, title_ar, lessons, duration, sort_order)
SELECT id, t.title_en, t.title_ar, t.lessons, t.duration, t.sort_order
FROM public.training_courses, (VALUES
  ('Python for Data Science', 'Python لعلم البيانات', 8, '2 weeks', 1),
  ('Statistics & Data Analysis', 'الإحصاء وتحليل البيانات', 8, '2 weeks', 2),
  ('Machine Learning Fundamentals', 'أساسيات تعلم الآلة', 10, '2 weeks', 3),
  ('Deep Learning — TensorFlow & PyTorch', 'التعلم العميق — TensorFlow و PyTorch', 10, '2.5 weeks', 4),
  ('NLP & Computer Vision', 'معالجة اللغة الطبيعية والرؤية الحاسوبية', 8, '2 weeks', 5),
  ('Capstone — Deploy an AI Model', 'مشروع التخرج — انشر نموذج AI', 8, '1.5 weeks', 6)
) AS t(title_en, title_ar, lessons, duration, sort_order) WHERE slug = 'ai-ml';

-- Cybersecurity modules
INSERT INTO public.course_modules (course_id, title_en, title_ar, lessons, duration, sort_order)
SELECT id, t.title_en, t.title_ar, t.lessons, t.duration, t.sort_order
FROM public.training_courses, (VALUES
  ('Security Fundamentals & Networking', 'أساسيات الأمن والشبكات', 6, '1.5 weeks', 1),
  ('Linux & Security Tools', 'Linux وأدوات الأمان', 6, '1 week', 2),
  ('Web Application Security', 'أمن تطبيقات الويب', 8, '1.5 weeks', 3),
  ('Penetration Testing & Ethical Hacking', 'اختبار الاختراق والقرصنة الأخلاقية', 8, '2 weeks', 4),
  ('Security Audits & Compliance', 'تدقيق الأمان والامتثال', 6, '1 week', 5),
  ('Capstone — Security Assessment Report', 'مشروع التخرج — تقرير تقييم أمني', 4, '1 week', 6)
) AS t(title_en, title_ar, lessons, duration, sort_order) WHERE slug = 'cybersecurity';

-- Product modules
INSERT INTO public.course_modules (course_id, title_en, title_ar, lessons, duration, sort_order)
SELECT id, t.title_en, t.title_ar, t.lessons, t.duration, t.sort_order
FROM public.training_courses, (VALUES
  ('Product Discovery & Strategy', 'اكتشاف واستراتيجية المنتج', 6, '1 week', 1),
  ('Agile & Scrum Mastery', 'إتقان Agile و Scrum', 6, '1 week', 2),
  ('User Stories & Roadmapping', 'قصص المستخدم وخرائط الطريق', 6, '1 week', 3),
  ('Metrics, KPIs & Analytics', 'المقاييس والتحليلات', 6, '1 week', 4),
  ('Stakeholder Management', 'إدارة أصحاب المصلحة', 4, '1 week', 5),
  ('Capstone — Launch a Product', 'مشروع التخرج — أطلق منتجاً', 6, '1 week', 6)
) AS t(title_en, title_ar, lessons, duration, sort_order) WHERE slug = 'product';

-- Corporate modules
INSERT INTO public.course_modules (course_id, title_en, title_ar, lessons, duration, sort_order)
SELECT id, t.title_en, t.title_ar, t.lessons, t.duration, t.sort_order
FROM public.training_courses, (VALUES
  ('Needs Assessment & Custom Plan', 'تقييم الاحتياجات وخطة مخصصة', 4, 'Custom', 1),
  ('Technical Workshops', 'ورش عمل تقنية', 8, 'Custom', 2),
  ('Team Building & Code Reviews', 'بناء الفريق ومراجعة الكود', 6, 'Custom', 3),
  ('Delivery Simulation Project', 'محاكاة مشروع تسليم', 6, 'Custom', 4)
) AS t(title_en, title_ar, lessons, duration, sort_order) WHERE slug = 'corporate';

-- Seed webinars
INSERT INTO public.course_webinars (course_id, title_en, title_ar, schedule, speaker, sort_order)
SELECT id, t.title_en, t.title_ar, t.schedule, t.speaker, t.sort_order
FROM public.training_courses, (VALUES
  ('android', 'Android Architecture Deep Dive', 'تعمق في بنية Android', 'Weekly', 'Senior Android Dev', 1)
) AS t(slug, title_en, title_ar, schedule, speaker, sort_order) WHERE training_courses.slug = t.slug;

INSERT INTO public.course_webinars (course_id, title_en, title_ar, schedule, speaker, sort_order)
SELECT id, t.title_en, t.title_ar, t.schedule, t.speaker, t.sort_order
FROM public.training_courses, (VALUES
  ('ios', 'iOS Design Patterns Workshop', 'ورشة أنماط تصميم iOS', 'Weekly', 'Senior iOS Dev', 1)
) AS t(slug, title_en, title_ar, schedule, speaker, sort_order) WHERE training_courses.slug = t.slug;

INSERT INTO public.course_webinars (course_id, title_en, title_ar, schedule, speaker, sort_order)
SELECT id, t.title_en, t.title_ar, t.schedule, t.speaker, t.sort_order
FROM public.training_courses, (VALUES
  ('flutter', 'Flutter Best Practices Q&A', 'أسئلة مباشرة: أفضل ممارسات Flutter', 'Weekly', 'Senior Mobile Dev', 1),
  ('flutter', 'Code Review Session', 'جلسة مراجعة الكود', 'Bi-weekly', 'Tech Lead', 2)
) AS t(slug, title_en, title_ar, schedule, speaker, sort_order) WHERE training_courses.slug = t.slug;

INSERT INTO public.course_webinars (course_id, title_en, title_ar, schedule, speaker, sort_order)
SELECT id, t.title_en, t.title_ar, t.schedule, t.speaker, t.sort_order
FROM public.training_courses, (VALUES
  ('frontend', 'React Performance Workshop', 'ورشة أداء React', 'Weekly', 'Frontend Architect', 1)
) AS t(slug, title_en, title_ar, schedule, speaker, sort_order) WHERE training_courses.slug = t.slug;

INSERT INTO public.course_webinars (course_id, title_en, title_ar, schedule, speaker, sort_order)
SELECT id, t.title_en, t.title_ar, t.schedule, t.speaker, t.sort_order
FROM public.training_courses, (VALUES
  ('backend', 'System Design Workshop', 'ورشة تصميم الأنظمة', 'Weekly', 'Backend Architect', 1)
) AS t(slug, title_en, title_ar, schedule, speaker, sort_order) WHERE training_courses.slug = t.slug;

INSERT INTO public.course_webinars (course_id, title_en, title_ar, schedule, speaker, sort_order)
SELECT id, t.title_en, t.title_ar, t.schedule, t.speaker, t.sort_order
FROM public.training_courses, (VALUES
  ('sdet', 'Bug Bash Live Session', 'جلسة صيد الأخطاء', 'Bi-weekly', 'QA Manager', 1),
  ('sdet', 'Automation Framework Design', 'تصميم إطار الأتمتة', 'Weekly', 'SDET Lead', 2)
) AS t(slug, title_en, title_ar, schedule, speaker, sort_order) WHERE training_courses.slug = t.slug;

INSERT INTO public.course_webinars (course_id, title_en, title_ar, schedule, speaker, sort_order)
SELECT id, t.title_en, t.title_ar, t.schedule, t.speaker, t.sort_order
FROM public.training_courses, (VALUES
  ('design', 'Design Critique Sessions', 'جلسات نقد التصميم', 'Weekly', 'UI/UX Lead', 1)
) AS t(slug, title_en, title_ar, schedule, speaker, sort_order) WHERE training_courses.slug = t.slug;

INSERT INTO public.course_webinars (course_id, title_en, title_ar, schedule, speaker, sort_order)
SELECT id, t.title_en, t.title_ar, t.schedule, t.speaker, t.sort_order
FROM public.training_courses, (VALUES
  ('devops', 'Cloud Architecture Review', 'مراجعة بنية السحابة', 'Weekly', 'DevOps Lead', 1)
) AS t(slug, title_en, title_ar, schedule, speaker, sort_order) WHERE training_courses.slug = t.slug;

INSERT INTO public.course_webinars (course_id, title_en, title_ar, schedule, speaker, sort_order)
SELECT id, t.title_en, t.title_ar, t.schedule, t.speaker, t.sort_order
FROM public.training_courses, (VALUES
  ('ai-ml', 'ML Paper Reading Club', 'نادي قراءة أوراق ML', 'Weekly', 'AI Engineer', 1)
) AS t(slug, title_en, title_ar, schedule, speaker, sort_order) WHERE training_courses.slug = t.slug;

INSERT INTO public.course_webinars (course_id, title_en, title_ar, schedule, speaker, sort_order)
SELECT id, t.title_en, t.title_ar, t.schedule, t.speaker, t.sort_order
FROM public.training_courses, (VALUES
  ('cybersecurity', 'CTF Challenge Sessions', 'جلسات تحديات CTF', 'Bi-weekly', 'Security Engineer', 1)
) AS t(slug, title_en, title_ar, schedule, speaker, sort_order) WHERE training_courses.slug = t.slug;

INSERT INTO public.course_webinars (course_id, title_en, title_ar, schedule, speaker, sort_order)
SELECT id, t.title_en, t.title_ar, t.schedule, t.speaker, t.sort_order
FROM public.training_courses, (VALUES
  ('product', 'PM Office Hours', 'ساعات مفتوحة لإدارة المنتجات', 'Weekly', 'Product Director', 1)
) AS t(slug, title_en, title_ar, schedule, speaker, sort_order) WHERE training_courses.slug = t.slug;

INSERT INTO public.course_webinars (course_id, title_en, title_ar, schedule, speaker, sort_order)
SELECT id, t.title_en, t.title_ar, t.schedule, t.speaker, t.sort_order
FROM public.training_courses, (VALUES
  ('corporate', 'Executive Tech Briefing', 'إحاطة تقنية للقيادة', 'On-demand', 'CTO', 1)
) AS t(slug, title_en, title_ar, schedule, speaker, sort_order) WHERE training_courses.slug = t.slug;
