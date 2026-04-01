/**
 * portalHeaderConfig — Role-first quick-link and CTA config for each portal.
 * Centralizes header navigation priorities per role.
 */
import type { LucideIcon } from "lucide-react";
import {
  Plus, Search, Calendar, Clock, BookOpen, ClipboardList,
} from "lucide-react";

export interface PortalQuickLink {
  path: string;
  label_en: string;
  label_ar: string;
  icon?: LucideIcon;
}

export interface PortalPrimaryCTA {
  path: string;
  label_en: string;
  label_ar: string;
  icon: LucideIcon;
}

export interface PortalHeaderConfig {
  quickLinks: PortalQuickLink[];
  primaryCTA: PortalPrimaryCTA;
}

/* ── Enterprise ── */
export const ENTERPRISE_HEADER: PortalHeaderConfig = {
  quickLinks: [
    { path: "/enterprise/portal", label_en: "Dashboard", label_ar: "لوحة التحكم" },
    { path: "/enterprise/portal/requests", label_en: "Requests", label_ar: "الطلبات" },
    { path: "/enterprise/portal/projects", label_en: "Projects", label_ar: "المشاريع" },
    { path: "/enterprise/portal/documents", label_en: "Documents", label_ar: "المستندات" },
    { path: "/enterprise/portal/billing", label_en: "Billing", label_ar: "الفواتير" },
  ],
  primaryCTA: { path: "/enterprise/portal/requests/new", label_en: "New Request", label_ar: "طلب جديد", icon: Plus },
};

/* ── Talent: Company ── */
export const TALENT_COMPANY_HEADER: PortalHeaderConfig = {
  quickLinks: [
    { path: "/talent/portal/company", label_en: "Dashboard", label_ar: "لوحة التحكم" },
    { path: "/talent/portal/company/jobs", label_en: "Jobs", label_ar: "الوظائف" },
    { path: "/talent/portal/company/applications", label_en: "Applicants", label_ar: "المتقدمون" },
    { path: "/talent/portal/company/shortlists", label_en: "Shortlist", label_ar: "المرشحون" },
    { path: "/talent/portal/company/team", label_en: "Team", label_ar: "الفريق" },
  ],
  primaryCTA: { path: "/talent/portal/company/jobs?new=true", label_en: "Post Job", label_ar: "نشر وظيفة", icon: Plus },
};

/* ── Talent: Freelancer ── */
export const TALENT_FREELANCER_HEADER: PortalHeaderConfig = {
  quickLinks: [
    { path: "/talent/portal/freelancer", label_en: "Dashboard", label_ar: "لوحة التحكم" },
    { path: "/talent/portal/freelancer/jobs", label_en: "Opportunities", label_ar: "الفرص" },
    { path: "/talent/portal/freelancer/applications", label_en: "Applications", label_ar: "الطلبات" },
    { path: "/talent/portal/freelancer/portfolio", label_en: "Portfolio", label_ar: "معرض الأعمال" },
    { path: "/talent/portal/freelancer/profile", label_en: "Profile", label_ar: "الملف" },
  ],
  primaryCTA: { path: "/talent/portal/freelancer/jobs", label_en: "Browse Jobs", label_ar: "تصفح الوظائف", icon: Search },
};

/* ── Consulting: Client ── */
export const CONSULTING_CLIENT_HEADER: PortalHeaderConfig = {
  quickLinks: [
    { path: "/consulting/portal", label_en: "Dashboard", label_ar: "لوحة التحكم" },
    { path: "/consulting", label_en: "Experts", label_ar: "الخبراء" },
    { path: "/consulting/portal/sessions", label_en: "Sessions", label_ar: "الجلسات" },
    { path: "/consulting/portal/history", label_en: "History", label_ar: "السجل" },
  ],
  primaryCTA: { path: "/consulting", label_en: "Book Consultation", label_ar: "حجز استشارة", icon: Calendar },
};

/* ── Consulting: Expert ── */
export const CONSULTING_EXPERT_HEADER: PortalHeaderConfig = {
  quickLinks: [
    { path: "/consulting/portal", label_en: "Dashboard", label_ar: "لوحة التحكم" },
    { path: "/consulting/portal/availability", label_en: "Availability", label_ar: "التوافر" },
    { path: "/consulting/portal/bookings", label_en: "Bookings", label_ar: "الحجوزات" },
    { path: "/consulting/portal/earnings", label_en: "Earnings", label_ar: "الأرباح" },
    { path: "/consulting/portal/profile", label_en: "Profile", label_ar: "الملف" },
  ],
  primaryCTA: { path: "/consulting/portal/availability", label_en: "Add Availability", label_ar: "إضافة توافر", icon: Clock },
};

/* ── Academy: Student ── */
export const ACADEMY_STUDENT_HEADER: PortalHeaderConfig = {
  quickLinks: [
    { path: "/academy/portal", label_en: "Dashboard", label_ar: "لوحة التحكم" },
    { path: "/academy/portal/courses", label_en: "My Courses", label_ar: "دوراتي" },
    { path: "/academy/portal/progress", label_en: "Progress", label_ar: "التقدم" },
    { path: "/academy/portal/certificates", label_en: "Certificates", label_ar: "الشهادات" },
  ],
  primaryCTA: { path: "/academy/portal/courses", label_en: "Continue Learning", label_ar: "تابع التعلم", icon: BookOpen },
};

// TODO: ACADEMY_INSTRUCTOR_HEADER removed — instructor workspace now uses INSTRUCTOR_WORKSPACE_HEADER.
// If any admin flow relied on academy-owned instructor pages, it should use /instructor/workspace/* instead.


/* ── Instructor Workspace (canonical) ── */
export const INSTRUCTOR_WORKSPACE_HEADER: PortalHeaderConfig = {
  quickLinks: [
    { path: "/instructor/workspace", label_en: "Dashboard", label_ar: "لوحة التحكم" },
    { path: "/instructor/workspace/courses", label_en: "My Courses", label_ar: "دوراتي" },
    { path: "/instructor/workspace/students", label_en: "Students", label_ar: "الطلاب" },
    { path: "/instructor/workspace/earnings", label_en: "Earnings", label_ar: "الأرباح" },
  ],
  primaryCTA: { path: "/instructor/workspace/courses/new", label_en: "Create Course", label_ar: "إنشاء دورة", icon: Plus },
};

/* ── Backoffice ── */
export const BACKOFFICE_HEADER: PortalHeaderConfig = {
  quickLinks: [
    { path: "/admin", label_en: "Dashboard", label_ar: "لوحة التحكم" },
    { path: "/admin/users", label_en: "Users", label_ar: "المستخدمون" },
    { path: "/admin/service-requests", label_en: "Requests", label_ar: "الطلبات" },
    { path: "/admin/projects", label_en: "Operations", label_ar: "العمليات" },
    { path: "/admin/analytics", label_en: "Reports", label_ar: "التقارير" },
  ],
  primaryCTA: { path: "/admin", label_en: "Review Pending", label_ar: "مراجعة المعلقات", icon: ClipboardList },
};
