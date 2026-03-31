import { Smartphone, Monitor, Layers, TrendingUp, Users, Star, Car, Dog, Dumbbell, Home, Scissors, Wrench, WashingMachine } from "lucide-react";

export type Category = "all" | "mobile" | "web" | "enterprise";

export interface ProjectChannel {
  name: string;
  nameAr: string;
  audience: string;
  audienceAr: string;
  capabilities: string[];
  capabilitiesAr: string[];
}

export interface ProjectData {
  slug: string;
  imgKey: string;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  descEn: string;
  descAr: string;
  badge?: string;
  badgeAr?: string;
  category: Category;
  tech: string[];
  metrics: { icon: any; value: string; labelEn: string; labelAr: string }[];
  links: { labelEn: string; labelAr: string; url: string }[];
  featured?: boolean;
  channels: ProjectChannel[];
  coreModules?: { titleEn: string; titleAr: string; items: string[]; itemsAr: string[] }[];
  brandNote?: string;
  brandNoteAr?: string;
  inDevelopment?: string;
  inDevelopmentAr?: string;
}

export const projects: ProjectData[] = [
  {
    slug: "yozya",
    imgKey: "yozya",
    titleEn: "YOZYA Ecosystem",
    titleAr: "منظومة YOZYA",
    subtitleEn: "Flagship Platform",
    subtitleAr: "المنصة الرئيسية",
    descEn: "A connected multi-module platform combining Real Estate (Rentals & Sales), Services Marketplace, Transportation, and Community Operations — delivered across mobile, web, providers, and admin layers.",
    descAr: "منصة متعددة الوحدات تجمع العقارات (إيجار وبيع) وسوق الخدمات والنقل والعمليات المجتمعية — يتم تقديمها عبر الموبايل والويب ومقدمي الخدمات وطبقات الإدارة.",
    badge: "Flagship",
    badgeAr: "رئيسي",
    category: "mobile",
    tech: ["KMP (Kotlin Multiplatform)", "PHP", "Laravel", "MySQL", "Google Maps", "Stripe"],
    metrics: [
      { icon: Smartphone, value: "4", labelEn: "Apps", labelAr: "تطبيقات" },
      { icon: Layers, value: "5", labelEn: "Modules", labelAr: "وحدات" },
      { icon: Users, value: "10K+", labelEn: "Users", labelAr: "مستخدم" },
    ],
    links: [
      { labelEn: "Visit Website", labelAr: "زيارة الموقع", url: "https://www.yozya.com/eg/home?page=1" },
      { labelEn: "Android App", labelAr: "تطبيق أندرويد", url: "https://play.google.com/store/apps/details?id=net.shabek.yozya&pcampaignid=web_share" },
      { labelEn: "iOS App", labelAr: "تطبيق iOS", url: "https://apps.apple.com/eg/app/yozya/id6748906808" },
    ],
    featured: true,
    channels: [
      {
        name: "YOZYA Master App",
        nameAr: "تطبيق YOZYA الرئيسي",
        audience: "Clients & Owners",
        audienceAr: "العملاء والملاك",
        capabilities: ["Real Estate (Rentals/Sales) + Services + Transportation + Profile", "Search, filter, book, pay", "Multi-module unified experience"],
        capabilitiesAr: ["عقارات (إيجار/بيع) + خدمات + نقل + ملف شخصي", "بحث، تصفية، حجز، دفع", "تجربة موحدة متعددة الوحدات"],
      },
      {
        name: "YOZYA Partner App",
        nameAr: "تطبيق شركاء YOZYA",
        audience: "Service Providers",
        audienceAr: "مقدمو الخدمات",
        capabilities: ["Provider onboarding & management", "Order/request management", "Earnings & performance tracking"],
        capabilitiesAr: ["تسجيل وإدارة مقدمي الخدمات", "إدارة الطلبات", "تتبع الأرباح والأداء"],
      },
      {
        name: "YOZYA Website & Portal",
        nameAr: "موقع وبوابة YOZYA",
        audience: "Web Platforms",
        audienceAr: "منصات الويب",
        capabilities: ["Real Estate discovery + booking + owner property management", "Full web experience mirroring mobile", "SEO optimized listings"],
        capabilitiesAr: ["اكتشاف العقارات + الحجز + إدارة ممتلكات المالك", "تجربة ويب كاملة تحاكي الموبايل", "قوائم محسنة لمحركات البحث"],
      },
      {
        name: "YOZYA CMS (Admin)",
        nameAr: "نظام إدارة YOZYA",
        audience: "Admin / Operations",
        audienceAr: "الإدارة / العمليات",
        capabilities: ["Full ecosystem control — inventory, services, users, analytics", "Content management", "Reporting & dashboards"],
        capabilitiesAr: ["تحكم كامل بالمنظومة — المخزون والخدمات والمستخدمين والتحليلات", "إدارة المحتوى", "التقارير ولوحات القيادة"],
      },
    ],
    coreModules: [
      {
        titleEn: "Real Estate Module",
        titleAr: "وحدة العقارات",
        items: ["Rentals & Bookings (search, filters, calendar, payments)", "Selling (property listing, inquiries, negotiations)", "Owner portal for property management"],
        itemsAr: ["الإيجارات والحجوزات (بحث، فلاتر، تقويم، مدفوعات)", "البيع (إدراج العقارات، استفسارات، مفاوضات)", "بوابة المالك لإدارة الممتلكات"],
      },
      {
        titleEn: "Services Marketplace",
        titleAr: "سوق الخدمات",
        items: ["Maintenance / Housekeeping / Beauty", "Provider-driven category workflows", "Expandable service categories via CMS"],
        itemsAr: ["الصيانة / التنظيف / التجميل", "سير عمل قائم على مقدمي الخدمات", "فئات خدمات قابلة للتوسيع عبر نظام الإدارة"],
      },
      {
        titleEn: "Transportation Module",
        titleAr: "وحدة النقل",
        items: ["Ride requests & booking management", "Available via Master App & Website", "Driver matching & live tracking"],
        itemsAr: ["طلبات التوصيل وإدارة الحجوزات", "متاح عبر التطبيق الرئيسي والموقع", "مطابقة السائق والتتبع المباشر"],
      },
    ],
  },
  {
    slug: "atmodrive",
    imgKey: "atmodrive",
    titleEn: "AtmoDrive",
    titleAr: "AtmoDrive",
    subtitleEn: "Transportation System",
    subtitleAr: "نظام النقل",
    descEn: "A complete ride hailing transportation system connecting passengers and drivers with a centralized operations layer for dispatch, pricing, compliance, and support.",
    descAr: "نظام نقل متكامل يربط الركاب بالسائقين مع طبقة عمليات مركزية للإرسال والتسعير والامتثال والدعم.",
    category: "mobile",
    tech: ["Kotlin (Android Native)", "Swift (iOS Native)", "PHP", "Laravel", "MySQL", "Socket.io", "Google Maps", "Firebase"],
    metrics: [
      { icon: Smartphone, value: "3", labelEn: "Apps", labelAr: "تطبيقات" },
      { icon: TrendingUp, value: "Live", labelEn: "Tracking", labelAr: "تتبع" },
    ],
    links: [],
    brandNote: "Passenger App uses Dark logo | Driver (Captain) App uses Light logo",
    brandNoteAr: "تطبيق الراكب يستخدم الشعار الداكن | تطبيق السائق يستخدم الشعار الفاتح",
    channels: [
      {
        name: "Passenger App",
        nameAr: "تطبيق الراكب",
        audience: "Passengers / Riders",
        audienceAr: "الركاب",
        capabilities: ["Registration & onboarding", "Request a trip (map selection)", "Fare estimation + trip options", "Driver matching + ETA", "Live trip tracking", "Payments (cash/card/wallet)", "Trip lifecycle management", "Rating & feedback + history", "Support & issue reporting"],
        capabilitiesAr: ["التسجيل والانضمام", "طلب رحلة (اختيار على الخريطة)", "تقدير الأجرة + خيارات الرحلة", "مطابقة السائق + وقت الوصول", "تتبع الرحلة المباشر", "المدفوعات (نقد/بطاقة/محفظة)", "إدارة دورة حياة الرحلة", "التقييم والملاحظات + السجل", "الدعم والإبلاغ عن المشاكل"],
      },
      {
        name: "Captain App (Driver)",
        nameAr: "تطبيق الكابتن (السائق)",
        audience: "Drivers + Fleet Supervisors",
        audienceAr: "السائقون + مشرفو الأسطول",
        capabilities: ["Driver onboarding & verification", "Online/Offline availability toggle", "Trip requests (accept/decline)", "Navigation & routing", "Trip status updates", "Passenger communication tools", "Earnings & wallet management", "Performance insights", "Documents & account renewal"],
        capabilitiesAr: ["تسجيل السائق والتحقق", "تبديل التوفر عبر/غير متصل", "طلبات الرحلة (قبول/رفض)", "الملاحة والتوجيه", "تحديثات حالة الرحلة", "أدوات التواصل مع الراكب", "إدارة الأرباح والمحفظة", "رؤى الأداء", "المستندات وتجديد الحساب"],
      },
      {
        name: "AtmoDrive CMS (Admin)",
        nameAr: "نظام إدارة AtmoDrive",
        audience: "Admins / Operations / Support",
        audienceAr: "المسؤولون / العمليات / الدعم",
        capabilities: ["User management (all roles)", "Trips monitoring & history", "Driver onboarding approvals", "Pricing & zone configuration", "Service coverage settings", "Support tools & escalations", "Finance & payouts reporting", "Analytics dashboards"],
        capabilitiesAr: ["إدارة المستخدمين (جميع الأدوار)", "مراقبة الرحلات والسجل", "موافقات انضمام السائقين", "تكوين التسعير والمناطق", "إعدادات تغطية الخدمة", "أدوات الدعم والتصعيد", "تقارير المالية والمدفوعات", "لوحات التحليلات"],
      },
    ],
  },
  {
    slug: "hamla",
    imgKey: "hamla",
    titleEn: "HAMLA",
    titleAr: "HAMLA",
    subtitleEn: "Goods Logistics System",
    subtitleAr: "نظام لوجستيات البضائع",
    descEn: "A complete goods logistics system connecting customers, drivers, and logistics providers through mobile apps and a centralized operations layer — with multi-stop routing and live tracking.",
    descAr: "نظام لوجستيات بضائع متكامل يربط العملاء والسائقين ومقدمي الخدمات اللوجستية عبر تطبيقات الموبايل وطبقة عمليات مركزية — مع توجيه متعدد المحطات وتتبع مباشر.",
    category: "mobile",
    tech: ["Kotlin (Android Native)", "Swift (iOS Native)", "PHP", "Laravel", "MySQL", "Maps SDK", "Firebase"],
    metrics: [
      { icon: Smartphone, value: "3", labelEn: "Apps", labelAr: "تطبيقات" },
      { icon: Layers, value: "4", labelEn: "Portals", labelAr: "بوابات" },
    ],
    links: [],
    channels: [
      {
        name: "Client App",
        nameAr: "تطبيق العميل",
        audience: "Customers",
        audienceAr: "العملاء",
        capabilities: ["Create orders with goods details", "Truck type selection", "Goods category selection", "Multi-stop route planning", "Load/unload assistants", "Live order tracking", "Order status lifecycle", "History & ratings"],
        capabilitiesAr: ["إنشاء طلبات مع تفاصيل البضائع", "اختيار نوع الشاحنة", "اختيار فئة البضائع", "تخطيط مسار متعدد المحطات", "مساعدو التحميل/التفريغ", "تتبع الطلب المباشر", "دورة حياة حالة الطلب", "السجل والتقييمات"],
      },
      {
        name: "Captain App (Driver)",
        nameAr: "تطبيق الكابتن (السائق)",
        audience: "Drivers",
        audienceAr: "السائقون",
        capabilities: ["Driver login & profile", "Online/Offline toggle", "Receive & accept orders", "Multi-stop navigation", "Status updates per stage", "Communication tools", "Earnings/wallet", "Performance metrics"],
        capabilitiesAr: ["تسجيل دخول السائق والملف", "تبديل متصل/غير متصل", "استلام وقبول الطلبات", "تنقل متعدد المحطات", "تحديثات الحالة لكل مرحلة", "أدوات التواصل", "الأرباح/المحفظة", "مقاييس الأداء"],
      },
      {
        name: "Provider Portal (Web)",
        nameAr: "بوابة مقدم الخدمة (ويب)",
        audience: "Individuals & Companies",
        audienceAr: "أفراد وشركات",
        capabilities: ["Provider onboarding (individual/company)", "Fleet/driver management", "Order management & assignments", "Coverage & availability settings", "Pricing rules", "Reporting", "Role-based team access"],
        capabilitiesAr: ["تسجيل مقدم الخدمة (فرد/شركة)", "إدارة الأسطول/السائقين", "إدارة الطلبات والتعيينات", "إعدادات التغطية والتوفر", "قواعد التسعير", "التقارير", "وصول الفريق على أساس الأدوار"],
      },
      {
        name: "HAMLA CMS (Admin)",
        nameAr: "نظام إدارة HAMLA",
        audience: "Operations",
        audienceAr: "العمليات",
        capabilities: ["User management (all roles)", "Order monitoring & exceptions", "Provider verification & compliance", "Pricing & commission config", "Service setup (truck types, categories)", "Disputes & support tools", "Finance & settlements", "Analytics dashboards"],
        capabilitiesAr: ["إدارة المستخدمين (جميع الأدوار)", "مراقبة الطلبات والاستثناءات", "التحقق من مقدمي الخدمات والامتثال", "تكوين التسعير والعمولة", "إعداد الخدمة (أنواع الشاحنات، الفئات)", "النزاعات وأدوات الدعم", "المالية والتسويات", "لوحات التحليلات"],
      },
    ],
  },
  {
    slug: "majesty",
    imgKey: "majesty",
    titleEn: "Majesty International Schools",
    titleAr: "مدارس ماجستي الدولية",
    subtitleEn: "School Management System",
    subtitleAr: "نظام إدارة مدرسي",
    descEn: "An integrated school management system connecting parents with academics, behavior, finance, and transportation — supported by a centralized CMS for all school departments.",
    descAr: "نظام إدارة مدرسي متكامل يربط أولياء الأمور بالأكاديميات والسلوك والمالية والنقل — مدعوم بنظام إدارة مركزي لجميع أقسام المدرسة.",
    category: "enterprise",
    tech: ["Kotlin (Android Native)", "Swift (iOS Native)", "PHP", "Laravel", "MySQL", "Firebase"],
    metrics: [
      { icon: Users, value: "500+", labelEn: "Students", labelAr: "طالب" },
      { icon: Layers, value: "6", labelEn: "Modules", labelAr: "وحدات" },
    ],
    links: [
      { labelEn: "Visit Website", labelAr: "زيارة الموقع", url: "https://majestyschools.com/" },
    ],
    inDevelopment: "Teacher App • Student App • Driver App & Supervisor Apps",
    inDevelopmentAr: "تطبيق المعلم • تطبيق الطالب • تطبيق السائق والمشرف",
    channels: [
      {
        name: "Parent Mobile App",
        nameAr: "تطبيق أولياء الأمور",
        audience: "Parents & Guardians",
        audienceAr: "أولياء الأمور",
        capabilities: ["Student performance tracking (grades, evaluations)", "Behavior tracking & discipline records", "Academic reports & attendance", "Marketplace: Uniforms, Books, Supplies", "Installments & fees management", "Online payments (payment gateway)", "School bus live tracking (real-time map)", "Notifications & announcements"],
        capabilitiesAr: ["تتبع أداء الطالب (الدرجات، التقييمات)", "تتبع السلوك وسجلات الانضباط", "التقارير الأكاديمية والحضور", "السوق: الزي والكتب واللوازم", "إدارة الأقساط والرسوم", "المدفوعات الإلكترونية", "تتبع الحافلة المباشر (خريطة حية)", "الإشعارات والإعلانات"],
      },
      {
        name: "Majesty CMS (Admin)",
        nameAr: "نظام إدارة ماجستي",
        audience: "School management + all departments",
        audienceAr: "إدارة المدرسة + جميع الأقسام",
        capabilities: ["Multi-department management", "Student data & records management", "Grades, behavior logs, reporting", "Marketplace catalog & order management", "Fees setup + payment reconciliation", "Bus routes & tracking administration", "Role-based access by department"],
        capabilitiesAr: ["إدارة متعددة الأقسام", "إدارة بيانات وسجلات الطلاب", "الدرجات وسجلات السلوك والتقارير", "كتالوج السوق وإدارة الطلبات", "إعداد الرسوم + تسوية المدفوعات", "إدارة مسارات الحافلات والتتبع", "وصول على أساس الأدوار حسب القسم"],
      },
    ],
  },
  {
    slug: "nuut-pos",
    imgKey: "nuutPos",
    titleEn: "nuut.ai & nuut POS",
    titleAr: "nuut.ai و nuut POS",
    subtitleEn: "Restaurant System — Full Platform",
    subtitleAr: "نظام مطاعم — منصة كاملة",
    descEn: "A complete restaurant management and ordering platform covering all user types across mobile and web channels.",
    descAr: "منصة إدارة مطاعم وطلبات متكاملة تغطي جميع أنواع المستخدمين عبر قنوات الموبايل والويب.",
    category: "enterprise",
    tech: ["React", "Node.js", "AI/ML", "POS Hardware", "Firebase"],
    metrics: [
      { icon: Monitor, value: "3", labelEn: "Screens", labelAr: "شاشات" },
      { icon: Star, value: "AI", labelEn: "Powered", labelAr: "ذكاء" },
    ],
    links: [],
    channels: [
      {
        name: "Customer App",
        nameAr: "تطبيق العميل",
        audience: "Diners & Customers",
        audienceAr: "رواد المطعم والعملاء",
        capabilities: ["Browse menus & restaurants", "Customize orders", "Online ordering & delivery tracking", "Reservations / dine-in booking", "Loyalty programs & offers", "Payments (cash/card/wallet)", "Order history & ratings"],
        capabilitiesAr: ["تصفح القوائم والمطاعم", "تخصيص الطلبات", "الطلب عبر الإنترنت وتتبع التوصيل", "الحجوزات / حجز داخل المطعم", "برامج الولاء والعروض", "المدفوعات (نقد/بطاقة/محفظة)", "سجل الطلبات والتقييمات"],
      },
      {
        name: "Staff / Waiter App",
        nameAr: "تطبيق الموظفين / النادل",
        audience: "Restaurant Staff",
        audienceAr: "طاقم المطعم",
        capabilities: ["Table order management", "Send orders to kitchen", "Track order status per table", "Process payments & bills", "Split bills", "Shift management", "Notifications from kitchen"],
        capabilitiesAr: ["إدارة طلبات الطاولة", "إرسال الطلبات للمطبخ", "تتبع حالة الطلب لكل طاولة", "معالجة المدفوعات والفواتير", "تقسيم الفواتير", "إدارة المناوبات", "إشعارات من المطبخ"],
      },
      {
        name: "Kitchen Display (KDS)",
        nameAr: "شاشة المطبخ (KDS)",
        audience: "Kitchen Staff",
        audienceAr: "طاقم المطبخ",
        capabilities: ["Real-time order queue", "Order status updates", "Priority alerts", "Course & station routing", "Order timing tracking"],
        capabilitiesAr: ["طابور الطلبات الحي", "تحديثات حالة الطلب", "تنبيهات الأولوية", "توجيه المقاطع والمحطات", "تتبع توقيت الطلب"],
      },
      {
        name: "Restaurant CMS (Admin)",
        nameAr: "نظام إدارة المطعم",
        audience: "Management",
        audienceAr: "الإدارة",
        capabilities: ["Menu & pricing management", "Table/floor plan setup", "Multi-branch management", "Orders monitoring & reports", "Delivery zones & drivers", "Promotions & loyalty management", "Finance & revenue analytics"],
        capabilitiesAr: ["إدارة القائمة والتسعير", "إعداد خطة الطاولات/الطابق", "إدارة متعددة الفروع", "مراقبة الطلبات والتقارير", "مناطق التوصيل والسائقون", "إدارة العروض والولاء", "تحليلات المالية والإيرادات"],
      },
    ],
  },
  {
    slug: "alliance",
    imgKey: "alliance",
    titleEn: "Alliance Engineering",
    titleAr: "هندسة التحالف",
    subtitleEn: "Corporate Website",
    subtitleAr: "موقع مؤسسي",
    descEn: "Architectural & Engineering Consulting — a corporate website designed to present Alliance's services, portfolio, and professional identity to support client acquisition and business development.",
    descAr: "استشارات معمارية وهندسية — موقع مؤسسي مصمم لعرض خدمات التحالف ومحفظة الأعمال والهوية المهنية لدعم اكتساب العملاء وتطوير الأعمال.",
    category: "web",
    tech: ["React", "Tailwind CSS", "Framer Motion"],
    metrics: [],
    links: [
      { labelEn: "Visit Website", labelAr: "زيارة الموقع", url: "https://alliance-arabia.com/" },
    ],
    channels: [
      {
        name: "Website (Web Platform)",
        nameAr: "الموقع (منصة ويب)",
        audience: "Real estate developers, construction companies, investors, government clients, engineering partners",
        audienceAr: "مطوري العقارات وشركات البناء والمستثمرين والعملاء الحكوميين والشركاء الهندسيين",
        capabilities: ["Company profile (About, Vision, Mission)", "Services showcase (architectural design, engineering consulting, project supervision)", "Portfolio / Projects with visual galleries", "Team / Expertise section", "Inquiry & contact forms", "Multi-language support (EN / AR)", "CMS-ready for project & news updates"],
        capabilitiesAr: ["ملف الشركة (عن، الرؤية، الرسالة)", "عرض الخدمات (التصميم المعماري، الاستشارات الهندسية، الإشراف على المشاريع)", "محفظة الأعمال / المشاريع مع معارض مرئية", "قسم الفريق / الخبرة", "نماذج الاستفسار والتواصل", "دعم متعدد اللغات (EN / AR)", "جاهز لنظام إدارة المحتوى لتحديثات المشاريع والأخبار"],
      },
      {
        name: "Admin / CMS Layer",
        nameAr: "طبقة الإدارة / CMS",
        audience: "Alliance internal team",
        audienceAr: "فريق التحالف الداخلي",
        capabilities: ["Update services & projects", "Manage media galleries", "Publish announcements/news", "Manage contact submissions", "Content editing without developer dependency"],
        capabilitiesAr: ["تحديث الخدمات والمشاريع", "إدارة معارض الوسائط", "نشر الإعلانات/الأخبار", "إدارة استمارات التواصل", "تعديل المحتوى بدون الاعتماد على المطور"],
      },
    ],
  },
  {
    slug: "maamour",
    imgKey: "maamour",
    titleEn: "Ma'amour Arabia",
    titleAr: "مأمور العربية",
    subtitleEn: "Corporate Website",
    subtitleAr: "موقع مؤسسي",
    descEn: "A corporate website presenting Ma'amour Arabia's identity, services, development process, and project portfolio — supporting business development and investor/partner engagement.",
    descAr: "موقع مؤسسي يقدم هوية مأمور العربية وخدماتها وعملية التطوير ومحفظة المشاريع — يدعم تطوير الأعمال والتفاعل مع المستثمرين/الشركاء.",
    category: "web",
    tech: ["React", "TypeScript", "Tailwind CSS"],
    metrics: [],
    links: [
      { labelEn: "Visit Website", labelAr: "زيارة الموقع", url: "https://maamour-arabia.com/#home" },
    ],
    channels: [
      {
        name: "Website (Web Platform)",
        nameAr: "الموقع (منصة ويب)",
        audience: "Landowners / Investors / Strategic Partners, Real estate companies & government entities",
        audienceAr: "ملاك الأراضي / المستثمرون / الشركاء الاستراتيجيون، شركات العقارات والجهات الحكومية",
        capabilities: ["About Ma'amour (company overview + positioning)", "Vision & Mission", "Services showcase (feasibility, master planning, compliance, development management, sales/leasing, asset management)", "Development Process (investment → operation/exit lifecycle)", "Projects / Portfolio (listing + detail pages)", "Contact / Inquiry (lead forms + CTA)"],
        capabilitiesAr: ["عن مأمور (نظرة عامة + تموضع)", "الرؤية والرسالة", "عرض الخدمات (جدوى، تخطيط رئيسي، امتثال، إدارة تطوير، مبيعات/تأجير، إدارة أصول)", "عملية التطوير (استثمار ← تشغيل/خروج)", "المشاريع / محفظة الأعمال (قائمة + صفحات تفصيلية)", "التواصل / الاستفسار (نماذج + CTA)"],
      },
    ],
  },
  {
    slug: "rissad",
    imgKey: "rissad",
    titleEn: "Rissad",
    titleAr: "رصاد",
    subtitleEn: "Digital Platform",
    subtitleAr: "منصة رقمية",
    descEn: "Digital platform built on modern web technologies — clean UI, responsive layouts, and seamless user experience.",
    descAr: "منصة رقمية مبنية على تقنيات ويب حديثة — واجهة نظيفة وتصميم متجاوب وتجربة مستخدم سلسة.",
    category: "web",
    tech: ["React", "Vite", "Tailwind CSS"],
    metrics: [],
    links: [
      { labelEn: "Visit Website", labelAr: "زيارة الموقع", url: "https://rissad.lovable.app/" },
    ],
    channels: [],
  },
];

export const similarProducts = [
  {
    icon: Home,
    titleEn: "Gated Community System",
    titleAr: "نظام المجتمعات المسورة",
    items: ["Resident & visitor management", "Gate access control & QR entry", "Community announcements & voting", "Facility booking (pool, gym, halls)", "Maintenance request tracking", "Service providers directory", "Payments & dues management", "Security team app (guard)"],
    itemsAr: ["إدارة السكان والزوار", "التحكم في الوصول وQR", "إعلانات وتصويت المجتمع", "حجز المرافق (مسبح، صالة)", "تتبع طلبات الصيانة", "دليل مقدمي الخدمات", "إدارة المدفوعات والمستحقات", "تطبيق فريق الأمن"],
  },
  {
    icon: WashingMachine,
    titleEn: "Laundry Management App",
    titleAr: "تطبيق إدارة المغاسل",
    items: ["Customer order creation & pickup scheduling", "Real-time tracking (pickup → processing → delivery)", "Pricing catalog by garment type", "Driver/pickup agent app", "Laundry operations management panel", "Subscriptions & loyalty plans", "Admin dashboard & reporting"],
    itemsAr: ["إنشاء طلبات العملاء وجدولة الاستلام", "تتبع حي (استلام ← معالجة ← توصيل)", "كتالوج أسعار حسب نوع الملابس", "تطبيق سائق/عامل الاستلام", "لوحة إدارة عمليات المغسلة", "اشتراكات وبرامج ولاء", "لوحة إدارة وتقارير"],
  },
  {
    icon: Home,
    titleEn: "Housekeeping & Cleaning App",
    titleAr: "تطبيق التنظيف والتدبير",
    items: ["Customer service request & scheduling", "Service type selection (cleaning, deep clean, move-out)", "Cleaner/staff app with task management", "Live job tracking & status updates", "Provider company management portal", "Recurring bookings & subscriptions", "Ratings & quality control"],
    itemsAr: ["طلب خدمة العميل والجدولة", "اختيار نوع الخدمة", "تطبيق عمال النظافة مع إدارة المهام", "تتبع حي وتحديثات الحالة", "بوابة إدارة شركة مقدم الخدمة", "حجوزات متكررة واشتراكات", "التقييمات ومراقبة الجودة"],
  },
  {
    icon: Scissors,
    titleEn: "Barber & Salon Booking App",
    titleAr: "تطبيق حجز الحلاقة والصالون",
    items: ["Customer booking with stylist selection", "Service menu & pricing", "Queue/waitlist management", "Barber/staff availability & schedule", "In-app payments & digital receipts", "Loyalty points & promotions", "Salon management dashboard"],
    itemsAr: ["حجز العميل مع اختيار المصفف", "قائمة الخدمات والأسعار", "إدارة الطابور/قائمة الانتظار", "توفر الحلاق/الموظفين والجدول", "مدفوعات داخل التطبيق وإيصالات رقمية", "نقاط ولاء وعروض", "لوحة إدارة الصالون"],
  },
  {
    icon: Wrench,
    titleEn: "Maintenance & Repair App",
    titleAr: "تطبيق الصيانة والإصلاح",
    items: ["Multi-category service requests (AC, plumbing, electrical, appliances)", "Technician matching & dispatch", "Job status tracking & ETA", "Technician app with work orders", "Spare parts & cost estimation", "Contract / subscription plans", "Provider company management"],
    itemsAr: ["طلبات خدمة متعددة الفئات (تكييف، سباكة، كهرباء، أجهزة)", "مطابقة الفني والإرسال", "تتبع حالة العمل ووقت الوصول", "تطبيق الفني مع أوامر العمل", "قطع غيار وتقدير التكلفة", "عقود / خطط اشتراك", "إدارة شركة مقدم الخدمة"],
  },
  {
    icon: Home,
    titleEn: "House Management App",
    titleAr: "تطبيق إدارة العقارات",
    items: ["Property listing & rental management", "Tenant portal & lease tracking", "Maintenance request management", "Utility bill tracking & payments", "Owner financial reporting", "Document storage & contracts", "Multi-property dashboard"],
    itemsAr: ["إدراج العقارات وإدارة الإيجار", "بوابة المستأجر وتتبع العقود", "إدارة طلبات الصيانة", "تتبع فواتير المرافق والمدفوعات", "تقارير مالية للمالك", "تخزين المستندات والعقود", "لوحة متعددة العقارات"],
  },
  {
    icon: Car,
    titleEn: "Car Service & Wash App",
    titleAr: "تطبيق خدمة وغسيل السيارات",
    items: ["Customer booking (wash, detailing, service)", "Location-based provider matching", "Service type & package selection", "Real-time progress tracking", "Technician/mobile unit app", "Fleet service for companies", "Subscription & loyalty plans"],
    itemsAr: ["حجز العميل (غسيل، تلميع، خدمة)", "مطابقة مقدم الخدمة حسب الموقع", "اختيار نوع الخدمة والباقة", "تتبع التقدم الحي", "تطبيق الفني/الوحدة المتنقلة", "خدمة أسطول للشركات", "اشتراكات وبرامج ولاء"],
  },
  {
    icon: Dog,
    titleEn: "Pet Services App",
    titleAr: "تطبيق خدمات الحيوانات",
    items: ["Vet appointment booking", "Grooming & spa services", "Pet sitting & walking requests", "Pet supplies marketplace", "Health records & reminders", "Provider management portal", "Multi-service scheduling"],
    itemsAr: ["حجز موعد بيطري", "خدمات التجميل والسبا", "طلبات رعاية ومشي الحيوانات", "سوق مستلزمات الحيوانات", "سجلات صحية وتذكيرات", "بوابة إدارة مقدمي الخدمات", "جدولة متعددة الخدمات"],
  },
  {
    icon: Dumbbell,
    titleEn: "Fitness & Gym Platform",
    titleAr: "منصة اللياقة والجيم",
    items: ["Membership & subscription management", "Class booking & schedule", "Trainer matching & booking", "Live/on-demand workout content", "Progress & body stats tracking", "Gym staff & trainer app", "Admin dashboard & reporting"],
    itemsAr: ["إدارة العضوية والاشتراكات", "حجز الحصص والجدول", "مطابقة وحجز المدرب", "محتوى تمارين مباشر/عند الطلب", "تتبع التقدم وإحصائيات الجسم", "تطبيق طاقم الجيم والمدرب", "لوحة إدارة وتقارير"],
  },
];

export const deliverySteps = [
  {
    step: "01",
    titleEn: "Discover",
    titleAr: "الاكتشاف",
    descEn: "Workshops, goals, scope, priorities → Outputs: BRD/SRS, roadmap, delivery plan",
    descAr: "ورش عمل، أهداف، نطاق، أولويات ← المخرجات: وثيقة متطلبات الأعمال، خارطة طريق، خطة تسليم",
  },
  {
    step: "02",
    titleEn: "Design (UI/UX)",
    titleAr: "التصميم (UI/UX)",
    descEn: "User journeys, prototypes, UI system → Outputs: final screens + handoff",
    descAr: "رحلات المستخدم، نماذج أولية، نظام واجهة ← المخرجات: شاشات نهائية + تسليم",
  },
  {
    step: "03",
    titleEn: "Build",
    titleAr: "البناء",
    descEn: "Mobile, web, backend services, integrations → Outputs: incremental releases, documented APIs",
    descAr: "موبايل، ويب، خدمات خلفية، تكاملات ← المخرجات: إصدارات تدريجية، APIs موثقة",
  },
  {
    step: "04",
    titleEn: "QA & Validation",
    titleAr: "ضمان الجودة والتحقق",
    descEn: "Test plans, regression, performance checks → Outputs: release candidate with quality gates",
    descAr: "خطط اختبار، اختبار انحدار، فحوصات أداء ← المخرجات: مرشح للإصدار مع بوابات جودة",
  },
  {
    step: "05",
    titleEn: "Launch & Support",
    titleAr: "الإطلاق والدعم",
    descEn: "Go-live readiness, monitoring, iterations → Outputs: stable launch + improvement plan",
    descAr: "جاهزية الإطلاق، المراقبة، التكرار ← المخرجات: إطلاق مستقر + خطة تحسين",
  },
];

export const engagementModels = [
  { titleEn: "Project-Based Delivery", titleAr: "تسليم قائم على المشروع", descEn: "Fixed scope with milestones and clear sign-offs.", descAr: "نطاق ثابت مع مراحل وتوقيعات واضحة." },
  { titleEn: "Dedicated Squad", titleAr: "فريق مخصص", descEn: "Monthly delivery team for continuous product development.", descAr: "فريق تسليم شهري لتطوير المنتجات المستمر." },
  { titleEn: "Team Augmentation", titleAr: "تعزيز الفريق", descEn: "Specialists embedded into your team and process.", descAr: "متخصصون مدمجون في فريقك وعملياتك." },
  { titleEn: "Outsourcing Hiring", titleAr: "التوظيف التعهيدي", descEn: "Continuous staffing with delivery governance and reporting.", descAr: "توظيف مستمر مع حوكمة التسليم والتقارير." },
  { titleEn: "Consulting Retainer", titleAr: "استشارات دورية", descEn: "Product/tech advisory, audits, and maturity planning.", descAr: "استشارات منتج/تقنية، تدقيقات، وتخطيط النضج." },
  { titleEn: "Training Programs", titleAr: "برامج التدريب", descEn: "Upskilling programs for teams and individuals (applied).", descAr: "برامج تطوير مهارات للفرق والأفراد (تطبيقية)." },
];

export const whyDevWady = [
  { titleEn: "Product-First Mindset", titleAr: "عقلية المنتج أولاً", descEn: "We think beyond features into full ecosystems — designed for scale from day one.", descAr: "نفكر أبعد من الميزات نحو أنظمة كاملة — مصممة للتوسع من اليوم الأول." },
  { titleEn: "Proven Delivery Model", titleAr: "نموذج تسليم مثبت", descEn: "Built from real squads and a shipping culture — not just resources.", descAr: "مبني من فرق حقيقية وثقافة إطلاق — وليس مجرد موارد." },
  { titleEn: "Full-Stack Execution", titleAr: "تنفيذ متكامل", descEn: "UI/UX → Mobile → Backend → QA → Release — one team, one pipeline.", descAr: "UI/UX ← موبايل ← خلفية ← ضمان جودة ← إصدار — فريق واحد، خط إنتاج واحد." },
  { titleEn: "Talent Pipeline", titleAr: "خط مواهب", descEn: "Mentorship + training that produces delivery-ready engineers joining real projects.", descAr: "إرشاد + تدريب ينتج مهندسين جاهزين للتسليم ينضمون لمشاريع حقيقية." },
  { titleEn: "Quality Embedded", titleAr: "جودة مدمجة", descEn: "QA is a discipline integrated from day one, not an afterthought at the end.", descAr: "ضمان الجودة نظام مدمج من اليوم الأول وليس فكرة لاحقة." },
  { titleEn: "Transparent Execution", titleAr: "تنفيذ شفاف", descEn: "Clear plans, weekly reporting, risks flagged early, accountability at every step.", descAr: "خطط واضحة، تقارير أسبوعية، مخاطر مُعلنة مبكراً، مسؤولية في كل خطوة." },
];
