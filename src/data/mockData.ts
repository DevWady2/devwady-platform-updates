/**
 * Centralized mock/demo data for development and testing.
 *
 * Rules:
 * - Only used when real data is absent AND sample-mode is enabled
 * - Never overwrites real query results
 * - Never shown for intentionally-filtered empty results
 */

/* ── Feature flag ─────────────────────────────────────────────── */
const DEV = import.meta.env.DEV;

/** Returns true when mock/demo data should be shown as fallback */
export function isSampleMode(): boolean {
  if (!DEV) return false;
  // Opt-in via localStorage toggle for demo/testing
  try {
    return localStorage.getItem("devwady_sample_data") === "on";
  } catch {
    return false;
  }
}

/** Enable/disable sample-data mode (dev only) */
export function setSampleMode(on: boolean) {
  if (!DEV) return;
  try {
    localStorage.setItem("devwady_sample_data", on ? "on" : "off");
  } catch { /* noop */ }
}

/* ── Helper: use real data if present, else mock if sample mode ── */
export function withMockFallback<T>(realData: T[] | undefined | null, mockData: T[]): T[] {
  if (realData && realData.length > 0) return realData;
  if (isSampleMode()) return mockData;
  return realData ?? [];
}

/** Enhanced fallback that also signals whether sample data is active */
export function withSampleFallback<T>(
  realData: T[] | undefined | null,
  mockData: T[]
): { data: T[]; isSample: boolean } {
  if (realData && realData.length > 0) return { data: realData, isSample: false };
  if (isSampleMode()) return { data: mockData, isSample: true };
  return { data: realData ?? [], isSample: false };
}

/* ═══════════════════════════════════════════════════════════════
   Mock Datasets
   ═══════════════════════════════════════════════════════════════ */

/* ── Job Listings ─────────────────────────────────────────────── */
export const MOCK_JOB_LISTINGS = [
  {
    id: "mock-job-1",
    title: "Senior Android Engineer",
    title_ar: "مهندس Android أول",
    type: "Full-time",
    location: "Remote",
    location_ar: "عن بعد",
    tags: ["Android", "Kotlin", "Jetpack Compose"],
    is_urgent: true,
    is_active: true,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    company_name: "TechVentures Inc.",
    salary_range: "$80k – $120k",
  },
  {
    id: "mock-job-2",
    title: "Junior Android Developer",
    title_ar: "مطور Android مبتدئ",
    type: "Full-time",
    location: "Cairo, Egypt",
    location_ar: "القاهرة، مصر",
    tags: ["Android", "Kotlin", "MVVM"],
    is_urgent: false,
    is_active: true,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    company_name: "AppCraft Studio",
    salary_range: "$35k – $55k",
  },
  {
    id: "mock-job-3",
    title: "Android Instructor Assistant",
    title_ar: "مساعد مدرب Android",
    type: "Part-time",
    location: "Remote",
    location_ar: "عن بعد",
    tags: ["Android", "Kotlin", "Teaching"],
    is_urgent: false,
    is_active: true,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    company_name: "DevWady Academy",
    salary_range: "$25k – $40k",
  },
  {
    id: "mock-job-4",
    title: "Android SDK & Performance Engineer",
    title_ar: "مهندس Android SDK والأداء",
    type: "Contract",
    location: "Riyadh, KSA",
    location_ar: "الرياض، السعودية",
    tags: ["Android", "Performance", "NDK"],
    is_urgent: true,
    is_active: true,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    company_name: "CloudPeak Solutions",
    salary_range: "$70k – $100k",
  },
];

/* ── Freelancer Directory ─────────────────────────────────────── */
export const MOCK_FREELANCERS = [
  {
    id: "mock-fl-1",
    user_id: "mock-user-1",
    full_name: "Ahmad Hassan",
    avatar_url: null,
    bio: "Android developer with 6+ years of experience in Kotlin & Jetpack libraries",
    skills: ["Kotlin", "Jetpack Compose", "MVVM", "Room"],
    hourly_rate: "$45/hr",
    location: "Cairo, Egypt",
    rating: 4.8,
    is_available: true,
    projects_count: 23,
  },
  {
    id: "mock-fl-2",
    user_id: "mock-user-2",
    full_name: "Sara Al-Rashid",
    avatar_url: null,
    bio: "Android specialist — Kotlin, Compose, and native performance optimization",
    skills: ["Android", "Kotlin", "Coroutines", "Hilt"],
    hourly_rate: "$55/hr",
    location: "Dubai, UAE",
    rating: 4.9,
    is_available: true,
    projects_count: 31,
  },
  {
    id: "mock-fl-3",
    user_id: "mock-user-3",
    full_name: "Omar Khalil",
    avatar_url: null,
    bio: "Android architect specializing in multi-module Clean Architecture",
    skills: ["Android", "Clean Architecture", "Kotlin", "CI/CD"],
    hourly_rate: "$60/hr",
    location: "Riyadh, KSA",
    rating: 4.7,
    is_available: false,
    projects_count: 18,
  },
];

/* ── Courses Catalog ──────────────────────────────────────────── */
export const MOCK_COURSES = [
  {
    id: "mock-course-1",
    title_en: "Android Fundamentals Bootcamp",
    title_ar: "معسكر أساسيات Android",
    description_en: "Master Android development with Kotlin, MVVM, and Jetpack libraries",
    description_ar: "احترف تطوير Android مع Kotlin وMVVM ومكتبات Jetpack",
    category: "android",
    level: "beginner",
    duration_weeks: 10,
    price_usd: 199,
    instructor_name: "Dr. Layla Mansour",
    enrollment_count: 142,
    rating: 4.7,
    cover_image_url: null,
    is_published: true,
  },
  {
    id: "mock-course-2",
    title_en: "Advanced Android Architecture",
    title_ar: "هندسة Android المتقدمة",
    description_en: "Deep dive into Clean Architecture, multi-module projects, and Jetpack Compose",
    description_ar: "تعمق في Clean Architecture والمشاريع متعددة الوحدات وJetpack Compose",
    category: "android",
    level: "advanced",
    duration_weeks: 8,
    price_usd: 249,
    instructor_name: "Eng. Faris Nabil",
    enrollment_count: 98,
    rating: 4.8,
    cover_image_url: null,
    is_published: true,
  },
  {
    id: "mock-course-3",
    title_en: "Kotlin for Beginners",
    title_ar: "Kotlin للمبتدئين",
    description_en: "Learn Kotlin from scratch — from syntax basics to coroutines and flows",
    description_ar: "تعلم Kotlin من الصفر — من الأساسيات حتى الـ Coroutines والـ Flows",
    category: "android",
    level: "beginner",
    duration_weeks: 6,
    price_usd: 0,
    instructor_name: "Prof. Nadia Youssef",
    enrollment_count: 76,
    rating: 4.6,
    cover_image_url: null,
    is_published: true,
  },
];

/* ── Company Requests ─────────────────────────────────────────── */
export const MOCK_SERVICE_REQUESTS = [
  {
    id: "mock-sr-1",
    title: "E-Commerce Platform Development",
    status: "in_progress",
    priority: "high",
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    category: "web_development",
  },
  {
    id: "mock-sr-2",
    title: "Mobile App UI/UX Redesign",
    status: "pending",
    priority: "medium",
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    category: "design",
  },
];

/* ── Projects ─────────────────────────────────────────────────── */
export const MOCK_PROJECTS = [
  {
    id: "mock-proj-1",
    title: "SmartInventory ERP System",
    status: "active",
    progress_pct: 65,
    start_date: new Date(Date.now() - 60 * 86400000).toISOString(),
    target_end_date: new Date(Date.now() + 30 * 86400000).toISOString(),
    total_budget_usd: 45000,
    paid_usd: 22500,
  },
  {
    id: "mock-proj-2",
    title: "Customer Portal v2",
    status: "planning",
    progress_pct: 10,
    start_date: new Date(Date.now() - 7 * 86400000).toISOString(),
    target_end_date: new Date(Date.now() + 90 * 86400000).toISOString(),
    total_budget_usd: 28000,
    paid_usd: 5600,
  },
];

/* ── Consulting Bookings ──────────────────────────────────────── */
export const MOCK_BOOKINGS = [
  {
    id: "mock-bk-1",
    booking_date: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    start_time: "10:00",
    end_time: "11:00",
    status: "confirmed",
    expert_name: "Dr. Amira Soliman",
    track: "Cloud Architecture",
    amount_usd: 150,
  },
  {
    id: "mock-bk-2",
    booking_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    start_time: "14:00",
    end_time: "15:00",
    status: "pending",
    expert_name: "Eng. Khalid Nasser",
    track: "Security Audit",
    amount_usd: 200,
  },
];

/* ── Student Enrollments ──────────────────────────────────────── */
export const MOCK_ENROLLMENTS = [
  {
    id: "mock-enr-1",
    course_title_en: "Android Fundamentals Bootcamp",
    course_title_ar: "معسكر أساسيات Android",
    status: "active",
    progress_pct: 45,
    enrolled_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: "mock-enr-2",
    course_title_en: "Kotlin for Beginners",
    course_title_ar: "Kotlin للمبتدئين",
    status: "active",
    progress_pct: 12,
    enrolled_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
];

/* ── Certificates ─────────────────────────────────────────────── */
export const MOCK_CERTIFICATES = [
  {
    id: "mock-cert-1",
    course_title_en: "Jetpack Compose UI Course",
    course_title_ar: "دورة واجهات Jetpack Compose",
    completed_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    certificate_url: "#",
  },
];

/* ── Applications (freelancer) ────────────────────────────────── */
export const MOCK_APPLICATIONS = [
  {
    id: "mock-app-1",
    job_title: "Senior Android Engineer",
    job_title_ar: "مهندس Android أول",
    company_name: "TechVentures Inc.",
    status: "reviewing",
    applied_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "mock-app-2",
    job_title: "Junior Android Developer",
    job_title_ar: "مطور Android مبتدئ",
    company_name: "AppCraft Studio",
    status: "shortlisted",
    applied_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

/* ── Portfolio Items (freelancer) ─────────────────────────────── */
export const MOCK_PORTFOLIO_ITEMS = [
  {
    id: "mock-port-1",
    title: "TaskFlow Android App",
    title_ar: "تطبيق TaskFlow للأندرويد",
    description: "A productivity app built with Kotlin, Jetpack Compose, and Room database",
    description_ar: "تطبيق إنتاجية مبني بـ Kotlin وJetpack Compose وقاعدة بيانات Room",
    technologies: ["Kotlin", "Jetpack Compose", "Room"],
    category: "android",
    thumbnail_url: null,
    is_featured: true,
  },
  {
    id: "mock-port-2",
    title: "FitTrack Health Monitor",
    title_ar: "تطبيق FitTrack لمتابعة الصحة",
    description: "Android health tracking app with Material 3 design and Hilt DI",
    description_ar: "تطبيق Android لمتابعة الصحة بتصميم Material 3 وHilt DI",
    technologies: ["Android", "Kotlin", "Hilt", "Material 3"],
    category: "android",
    thumbnail_url: null,
    is_featured: false,
  },
];

/* ── Instructor Students ──────────────────────────────────────── */
export const MOCK_INSTRUCTOR_STUDENTS = [
  {
    id: "mock-ist-1",
    student_name: "Lina Haddad",
    email: "lina@example.com",
    course_title: "Android Fundamentals Bootcamp",
    progress_pct: 72,
    enrolled_at: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: "mock-ist-2",
    student_name: "Tariq Mansour",
    email: "tariq@example.com",
    course_title: "Advanced Android Architecture",
    progress_pct: 34,
    enrolled_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: "mock-ist-3",
    student_name: "Noor Al-Salem",
    email: "noor@example.com",
    course_title: "Android App Architecture",
    progress_pct: 88,
    enrolled_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
];

/* ── Notifications ────────────────────────────────────────────── */
export const MOCK_NOTIFICATIONS = [
  {
    id: "mock-notif-1",
    title_en: "New application received",
    title_ar: "تم استلام طلب جديد",
    body_en: "Ahmad Hassan applied for Senior Android Engineer position",
    body_ar: "أحمد حسن تقدم لوظيفة مهندس Android أول",
    type: "application",
    is_read: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    link: "/talent/portal/company/applications",
  },
  {
    id: "mock-notif-2",
    title_en: "Course progress milestone",
    title_ar: "إنجاز في تقدم الدورة",
    body_en: "You've completed 50% of Android Fundamentals Bootcamp",
    body_ar: "أكملت 50% من معسكر أساسيات Android",
    type: "progress",
    is_read: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    link: "/my/learning",
  },
];

/* ── Instructor: Track-Relevant Opportunities ─────────────────── */
export const MOCK_INSTRUCTOR_OPPORTUNITIES = [
  {
    id: "mock-iop-1",
    title_en: "Android & Kotlin Trainer",
    title_ar: "مدرب Android و Kotlin",
    type_en: "Contract",
    location_en: "Remote",
    location_ar: "عن بعد",
    tags: ["Android", "Kotlin", "Training"],
  },
  {
    id: "mock-iop-2",
    title_en: "Technical Mentor — Android Track",
    title_ar: "مرشد تقني — مسار Android",
    type_en: "Part-time",
    location_en: "Cairo, Egypt",
    location_ar: "القاهرة، مصر",
    tags: ["Mentoring", "Android", "Jetpack Compose"],
  },
  {
    id: "mock-iop-3",
    title_en: "Curriculum Developer — Mobile Apps",
    title_ar: "مطور مناهج — تطبيقات الجوال",
    type_en: "Freelance",
    location_en: "Remote",
    location_ar: "عن بعد",
    tags: ["Android", "Mobile", "Curriculum"],
  },
];

/* ── Instructor: Learner Requests ─────────────────────────────── */
export const MOCK_INSTRUCTOR_LEARNER_REQUESTS = [
  {
    id: "mock-ilr-1",
    course_title: "Android Fundamentals Bootcamp",
    enrolled_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    status: "active",
  },
  {
    id: "mock-ilr-2",
    course_title: "Kotlin for Beginners",
    enrolled_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    status: "active",
  },
  {
    id: "mock-ilr-3",
    course_title: "Android Fundamentals Bootcamp",
    enrolled_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    status: "active",
  },
];

/* ── Instructor: My Courses (Teaching block) ──────────────────── */
export const MOCK_INSTRUCTOR_COURSES = [
  {
    id: "mock-ic-1",
    title_en: "Android Fundamentals Bootcamp",
    title_ar: "معسكر أساسيات Android",
    slug: "android-fundamentals-kotlin",
    status: "published",
    total_lessons: 24,
    price_usd: 199,
    is_free: false,
    thumbnail_url: null,
    category: "Android",
    tags: ["Kotlin", "MVVM", "Coroutines"],
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: "mock-ic-2",
    title_en: "Advanced Android Architecture",
    title_ar: "هندسة Android المتقدمة",
    slug: "advanced-android-jetpack-compose",
    status: "published",
    total_lessons: 18,
    price_usd: 249,
    is_free: false,
    thumbnail_url: null,
    category: "Android",
    tags: ["Jetpack Compose", "Clean Architecture", "Multi-module"],
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: "mock-ic-3",
    title_en: "Kotlin for Beginners (Free)",
    title_ar: "Kotlin للمبتدئين (مجاني)",
    slug: "android-app-architecture",
    status: "published",
    total_lessons: 12,
    price_usd: 0,
    is_free: true,
    thumbnail_url: null,
    category: "Android",
    tags: ["Kotlin", "Fundamentals"],
    created_at: new Date(Date.now() - 120 * 86400000).toISOString(),
  },
];

/* ── Instructor: Freelancer Candidates (same specialization) ──── */
export const MOCK_INSTRUCTOR_FREELANCER_CANDIDATES = [
  { id: "fl-1", user_id: "mock-uid-1", full_name: "Sara Al-Rashid", track: "Android", skills: ["Kotlin", "Jetpack Compose", "MVVM"], rating: 4.8, location: "Riyadh" },
  { id: "fl-2", user_id: "mock-uid-2", full_name: "Omar Khalil", track: "Android", skills: ["Kotlin", "Room", "Coroutines"], rating: 4.5, location: "Amman" },
  { id: "fl-3", user_id: "mock-uid-3", full_name: "Nada Fakhoury", track: "Android", skills: ["Kotlin", "Firebase", "Material Design"], rating: 4.6, location: "Dubai" },
];

/* ── Instructor: Suggested Experts (Android specialization) ───── */
export const MOCK_INSTRUCTOR_SUGGESTED_EXPERTS = [
  {
    id: "mock-ise-1",
    name: "Dr. Hana Al-Farsi",
    name_ar: "د. هناء الفارسي",
    role: "Senior Android Architect",
    role_ar: "مهندسة Android أولى",
    slug: "hana-al-farsi",
    track: "Android Development",
    avatar_url: null,
    session_rate_usd: 180,
  },
  {
    id: "mock-ise-2",
    name: "Eng. Faisal Zayed",
    name_ar: "م. فيصل زايد",
    role: "Kotlin & Jetpack Compose Specialist",
    role_ar: "متخصص Kotlin و Jetpack Compose",
    slug: "faisal-zayed",
    track: "Android Development",
    avatar_url: null,
    session_rate_usd: 150,
  },
  {
    id: "mock-ise-3",
    name: "Eng. Reem Bakr",
    name_ar: "م. ريم بكر",
    role: "Android Performance & Testing Consultant",
    role_ar: "استشارية أداء واختبار Android",
    slug: "reem-bakr",
    track: "Android Development",
    avatar_url: null,
    session_rate_usd: 160,
  },
];

/* ── Instructor: Recent Student Questions ─────────────────────── */
export const MOCK_INSTRUCTOR_QUESTIONS = [
  {
    id: "mock-iq-1",
    question: "How do I handle ViewModelScope cancellation in Kotlin coroutines?",
    student_name: "Lina Haddad",
    course_title: "Android Fundamentals Bootcamp",
    answered: false,
    answered_by: null,
    age: "2h ago",
  },
  {
    id: "mock-iq-2",
    question: "What is the difference between remember and rememberSaveable in Compose?",
    student_name: "Tariq Mansour",
    course_title: "Advanced Android Architecture",
    answered: true,
    answered_by: "instructor",
    age: "1d ago",
  },
  {
    id: "mock-iq-3",
    question: "Can you explain the MVVM vs MVI architecture trade-offs for Android?",
    student_name: "Noor Al-Salem",
    course_title: "Android App Architecture",
    answered: false,
    answered_by: null,
    age: "4h ago",
  },
];

/* ── Instructor: Recent Feedback / Reviews ────────────────────── */
export const MOCK_INSTRUCTOR_FEEDBACK = [
  {
    id: "mock-ifb-1",
    rating: 5,
    review: "Excellent Android course structure. The Kotlin coroutines module was especially clear and well-paced.",
    student_name: "Ahmad Hassan",
    course_title: "Android Fundamentals Bootcamp",
    age: "3d ago",
  },
  {
    id: "mock-ifb-2",
    rating: 4,
    review: "Great Jetpack Compose content. Would love more advanced animation patterns in future modules.",
    student_name: "Sara Al-Rashid",
    course_title: "Advanced Android Architecture",
    age: "5d ago",
  },
  {
    id: "mock-ifb-3",
    rating: 5,
    review: "The best Android architecture course I've taken. Real-world examples made all the difference.",
    student_name: "Omar Khalil",
    course_title: "Android App Architecture",
    age: "1w ago",
  },
];

/* ── Instructor: Outstanding Students (Advanced state) ────────── */
export const MOCK_INSTRUCTOR_OUTSTANDING_STUDENTS = [
  {
    id: "mock-ios-1",
    name: "Lina Haddad",
    course_title: "Android Fundamentals Bootcamp",
    progress_pct: 96,
    highlight: "Top scorer, ready for nomination",
    status: "ready" as const,
    skills: ["Kotlin", "MVVM", "Coroutines"],
    activity: "high" as const,
    assignments_avg: 94,
    last_active: "2 hours ago",
  },
  {
    id: "mock-ios-2",
    name: "Tariq Mansour",
    course_title: "Advanced Android Architecture",
    progress_pct: 88,
    highlight: "Fastest completion pace",
    status: "promising" as const,
    skills: ["Compose", "Material 3", "Kotlin"],
    activity: "high" as const,
    assignments_avg: 87,
    last_active: "5 hours ago",
  },
  {
    id: "mock-ios-3",
    name: "Noor Al-Salem",
    course_title: "Android Fundamentals Bootcamp",
    progress_pct: 92,
    highlight: "Consistent high scores",
    status: "ready" as const,
    skills: ["Kotlin", "Room", "Retrofit"],
    activity: "medium" as const,
    assignments_avg: 91,
    last_active: "1 day ago",
  },
  {
    id: "mock-ios-4",
    name: "Ahmad Hassan",
    course_title: "Android App Architecture",
    progress_pct: 78,
    highlight: "Strong but needs guidance",
    status: "needs_support" as const,
    skills: ["MVVM", "Clean Architecture"],
    activity: "low" as const,
    assignments_avg: 72,
    last_active: "3 days ago",
  },
];

/* ── Instructor: Course Activity Feed ─────────────────────────── */
export const MOCK_INSTRUCTOR_COURSE_ACTIVITY = [
  { id: "mock-ca-1", type: "enrollment", icon: "UserPlus", text_en: "Lina Haddad enrolled in Android Fundamentals Bootcamp", text_ar: "انضمت لينا حداد إلى معسكر أساسيات Android", age: "1h ago", course: "Android Fundamentals Bootcamp" },
  { id: "mock-ca-2", type: "assistant_answer", icon: "Bot", text_en: "Sara Al-Rashid answered 2 student questions in Jetpack Compose", text_ar: "أجابت سارة الراشد على سؤالين في Jetpack Compose", age: "3h ago", course: "Advanced Android Architecture" },
  { id: "mock-ca-3", type: "review", icon: "Star", text_en: "Ahmad Hassan submitted a 5★ review for Android App Architecture", text_ar: "قدّم أحمد حسن تقييم 5★ لدورة هندسة تطبيقات Android", age: "6h ago", course: "Android App Architecture" },
  { id: "mock-ca-4", type: "inactive_alert", icon: "AlertTriangle", text_en: "3 students inactive for 7+ days in Android Fundamentals", text_ar: "3 طلاب غير نشطين لأكثر من 7 أيام في أساسيات Android", age: "1d ago", course: "Android Fundamentals Bootcamp" },
  { id: "mock-ca-5", type: "job_match", icon: "Briefcase", text_en: "New job posted: Junior Android Developer — matches your students", text_ar: "وظيفة جديدة: مطور Android مبتدئ — تناسب طلابك", age: "1d ago", course: null },
  { id: "mock-ca-6", type: "nomination_ready", icon: "Award", text_en: "Noor Al-Salem is ready for nomination (96% avg, high activity)", text_ar: "نور السالم جاهزة للترشيح (معدل 96%، نشاط عالٍ)", age: "2d ago", course: "Android Fundamentals Bootcamp" },
];

/* ── Instructor: Review Insights ─────────────────────────────── */
export const MOCK_INSTRUCTOR_REVIEW_INSIGHTS = {
  latest: {
    id: "mock-ri-1", rating: 5, review: "Excellent Android course structure. The Kotlin coroutines module was especially clear.", student_name: "Ahmad Hassan", course_title: "Android Fundamentals Bootcamp", age: "3d ago",
  },
  trend: { direction: "up" as const, avg_rating: 4.6, prev_avg: 4.3, total_reviews: 24 },
  repeated_praise: [
    { theme: "Clear Kotlin examples", count: 8 },
    { theme: "Well-paced modules", count: 6 },
    { theme: "Real-world Android projects", count: 5 },
  ],
  improvement_requests: [
    { theme: "More advanced animation patterns", count: 4 },
    { theme: "Longer Q&A sessions", count: 3 },
  ],
};

/* ── Instructor: Assistant Scorecard (Advanced state) ─────────── */
export const MOCK_INSTRUCTOR_ASSISTANT_SCORECARD = [
  {
    id: "mock-ias-1",
    name: "Sara Al-Rashid",
    replies_count: 47,
    courses_count: 2,
    last_active: "2h ago",
  },
  {
    id: "mock-ias-2",
    name: "Omar Khalil",
    replies_count: 23,
    courses_count: 1,
    last_active: "1d ago",
  },
];


/* ── Instructor: Eligible Students for Job Nomination ─────────── */
export const MOCK_INSTRUCTOR_ELIGIBLE_STUDENTS = [
  { id: "mock-es-1", name: "Lina Haddad", course: "Android Fundamentals Bootcamp", progress_pct: 96, skills: ["Kotlin", "MVVM", "Coroutines"] },
  { id: "mock-es-2", name: "Tariq Mansour", course: "Advanced Android Architecture", progress_pct: 88, skills: ["Compose", "Kotlin", "Material 3"] },
  { id: "mock-es-3", name: "Noor Al-Salem", course: "Android Fundamentals Bootcamp", progress_pct: 92, skills: ["Kotlin", "Room", "Retrofit"] },
  { id: "mock-es-4", name: "Ahmad Hassan", course: "Android App Architecture", progress_pct: 85, skills: ["MVVM", "Clean Architecture", "Hilt"] },
];

export const MOCK_ADMIN_STATS = {
  total_users: 1247,
  active_projects: 38,
  pending_requests: 12,
  monthly_revenue_usd: 67500,
  new_signups_this_week: 43,
  active_courses: 12,
  total_bookings: 156,
};

/* ── Instructor: Assistant Activity Feed (sidebar) ────────────── */
export const MOCK_INSTRUCTOR_ASSISTANT_ACTIVITY = [
  { id: "aa-1", assistant: "Sara Al-Rashid", action: "replied", target: "ViewModelScope question", course: "Android Fundamentals Bootcamp", age: "1h ago", type: "reply" as const },
  { id: "aa-2", assistant: "Omar Khalil", action: "escalated", target: "Compose navigation issue", course: "Advanced Android Architecture", age: "3h ago", type: "escalation" as const },
  { id: "aa-3", assistant: "Sara Al-Rashid", action: "resolved", target: "Gradle build config question", course: "Android Fundamentals Bootcamp", age: "5h ago", type: "reply" as const },
];

/* ── Instructor Course Detail: Students / Q&A / Reviews ──────── */
export const MOCK_COURSE_DETAIL_STUDENTS = [
  { id: "ms-1", name: "Lina Haddad", progress: 72, status: "active", enrolled: "2 weeks ago" },
  { id: "ms-2", name: "Tariq Mansour", progress: 34, status: "active", enrolled: "1 week ago" },
  { id: "ms-3", name: "Noor Al-Salem", progress: 100, status: "completed", enrolled: "2 months ago" },
  { id: "ms-4", name: "Omar Khalil", progress: 100, status: "completed", enrolled: "3 months ago" },
];

export const MOCK_COURSE_DETAIL_QUESTIONS = [
  { id: "mq-1", student: "Lina Haddad", question: "How do I handle ViewModelScope cancellation in Kotlin coroutines?", answered: false, age: "2 hours ago" },
  { id: "mq-2", student: "Tariq Mansour", question: "What's the difference between remember and rememberSaveable in Compose?", answered: true, answeredBy: "Instructor", age: "1 day ago" },
  { id: "mq-3", student: "Noor Al-Salem", question: "Best practice for multi-module Hilt dependency injection?", answered: true, answeredBy: "Assistant", age: "3 days ago" },
];

export const MOCK_COURSE_DETAIL_REVIEWS = [
  { id: "mr-1", student: "Noor Al-Salem", rating: 5, review: "Excellent Android course! The Kotlin coroutines module was especially clear.", date: "1 week ago" },
  { id: "mr-2", student: "Omar Khalil", rating: 4, review: "Great Jetpack Compose content. Would love more advanced animation patterns.", date: "2 weeks ago" },
];

/* ── Instructor Students: Centralized mock arrays ─────────────── */
export const MOCK_STUDENT_ENROLLMENTS = [
  { id: "mock-enr-1", user_id: "mock-u1", course_id: "mock-ic-1", status: "active", enrolled_at: new Date(Date.now() - 14 * 86400000).toISOString(), completed_at: null, certificate_url: null },
  { id: "mock-enr-2", user_id: "mock-u2", course_id: "mock-ic-1", status: "active", enrolled_at: new Date(Date.now() - 7 * 86400000).toISOString(), completed_at: null, certificate_url: null },
  { id: "mock-enr-3", user_id: "mock-u3", course_id: "mock-ic-1", status: "completed", enrolled_at: new Date(Date.now() - 60 * 86400000).toISOString(), completed_at: new Date(Date.now() - 5 * 86400000).toISOString(), certificate_url: "/certificate/mock-enr-3" },
  { id: "mock-enr-4", user_id: "mock-u4", course_id: "mock-ic-1", status: "completed", enrolled_at: new Date(Date.now() - 90 * 86400000).toISOString(), completed_at: new Date(Date.now() - 20 * 86400000).toISOString(), certificate_url: "/certificate/mock-enr-4" },
  { id: "mock-enr-5", user_id: "mock-u5", course_id: "mock-ic-1", status: "active", enrolled_at: new Date(Date.now() - 3 * 86400000).toISOString(), completed_at: null, certificate_url: null },
];

export const MOCK_STUDENT_PROFILES = [
  { user_id: "mock-u1", full_name: "Lina Haddad", avatar_url: null },
  { user_id: "mock-u2", full_name: "Tariq Mansour", avatar_url: null },
  { user_id: "mock-u3", full_name: "Noor Al-Salem", avatar_url: null },
  { user_id: "mock-u4", full_name: "Omar Khalil", avatar_url: null },
  { user_id: "mock-u5", full_name: "Ahmad Hassan", avatar_url: null },
];

export const MOCK_STUDENT_PROGRESS: Record<string, { completed: number; lastAccessed: string | null }> = {
  "mock-enr-1": { completed: 17, lastAccessed: new Date(Date.now() - 2 * 3600000).toISOString() },
  "mock-enr-2": { completed: 8, lastAccessed: new Date(Date.now() - 5 * 3600000).toISOString() },
  "mock-enr-3": { completed: 24, lastAccessed: new Date(Date.now() - 5 * 86400000).toISOString() },
  "mock-enr-4": { completed: 24, lastAccessed: new Date(Date.now() - 20 * 86400000).toISOString() },
  "mock-enr-5": { completed: 3, lastAccessed: new Date(Date.now() - 1 * 86400000).toISOString() },
};

export const MOCK_STUDENT_COURSE = { id: "mock-ic-1", title_en: "Android Fundamentals Bootcamp", title_ar: "معسكر أساسيات Android", instructor_id: "mock" };

/* ── Instructor Course Detail: Mock course entries for slug lookup ── */
export const MOCK_COURSE_DETAIL_ENTRIES = [
  { id: "mock-ic-1", title_en: "Android Fundamentals Bootcamp", title_ar: "معسكر أساسيات Android", slug: "android-fundamentals-kotlin", status: "published", total_lessons: 24, price_usd: 199, is_free: false, description_en: "Master Android development with Kotlin, MVVM, and Jetpack libraries.", description_ar: "أتقن تطوير Android مع Kotlin وMVVM ومكتبات Jetpack.", thumbnail_url: null, created_at: new Date().toISOString() },
  { id: "mock-ic-2", title_en: "Advanced Android Architecture", title_ar: "هندسة Android المتقدمة", slug: "advanced-android-jetpack-compose", status: "published", total_lessons: 18, price_usd: 249, is_free: false, description_en: "Deep dive into Clean Architecture, multi-module projects, and Jetpack Compose.", description_ar: "تعمق في Clean Architecture والمشاريع متعددة الوحدات وJetpack Compose.", thumbnail_url: null, created_at: new Date().toISOString() },
  { id: "mock-ic-3", title_en: "Kotlin for Beginners (Free)", title_ar: "Kotlin للمبتدئين (مجاني)", slug: "android-app-architecture", status: "published", total_lessons: 12, price_usd: 0, is_free: true, description_en: "Get started with Kotlin fundamentals for Android development.", description_ar: "ابدأ مع أساسيات Kotlin لتطوير Android.", thumbnail_url: null, created_at: new Date().toISOString() },
];
