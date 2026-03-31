import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  dedupeNavLinks,
  PUBLIC_NAV_CONFIG,
  BUSINESS_LINES,
  type PublicNavCTA as NavCTA,
  type PublicNavLink as NavLink,
  type BusinessLine,
} from "@/config/publicNav";

type NavArea = "home" | "enterprise" | "talent" | "consulting" | "academy" | "other";

export type { NavCTA, NavLink, BusinessLine };

export interface NavConfig {
  area: NavArea;
  links: NavLink[];
  businessLines: BusinessLine[];
  primaryCTA: NavCTA;
  secondaryCTA?: NavCTA;
  /** Whether to show mega-menu (guest only) */
  showMegaMenu: boolean;
}

function getArea(pathname: string): NavArea {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/enterprise") && !pathname.includes("/portal")) return "enterprise";
  if (pathname.startsWith("/talent") && !pathname.includes("/portal")) return "talent";
  if (pathname.startsWith("/consulting") && !pathname.includes("/portal")) return "consulting";
  if (pathname.startsWith("/training") || (pathname.startsWith("/academy") && !pathname.includes("/portal"))) return "academy";
  if (pathname.startsWith("/hiring")) return "talent";
  return "other";
}

function getSignInPath(area: NavArea): string {
  switch (area) {
    case "enterprise": return "/auth/enterprise";
    case "talent": return "/auth/talent";
    case "consulting": return "/auth/consulting";
    case "academy": return "/auth/academy";
    default: return "/login";
  }
}

export function useNavConfig(): NavConfig {
  const { pathname } = useLocation();
  const { user, accountType } = useAuth();
  const area = getArea(pathname);

  return useMemo(() => {
    // Public / guest nav — single unified config with mega-menu
    if (!user) {
      return {
        area,
        links: dedupeNavLinks(PUBLIC_NAV_CONFIG.links),
        businessLines: BUSINESS_LINES,
        primaryCTA: PUBLIC_NAV_CONFIG.primaryCTA,
        secondaryCTA: { ...PUBLIC_NAV_CONFIG.secondaryCTA, path: getSignInPath(area) },
        showMegaMenu: true,
      };
    }

    // Authenticated nav — accountType-specific links, no mega-menu
    const base = { area, businessLines: BUSINESS_LINES, showMegaMenu: false };

    switch (accountType) {
      case "company":
        return {
          ...base,
          links: dedupeNavLinks([
            { path: "/", label_en: "Home", label_ar: "الرئيسية" },
            { path: "/enterprise", label_en: "Enterprise", label_ar: "المؤسسات" },
            { path: "/hiring?tab=freelancers", label_en: "Talent", label_ar: "المواهب" },
            { path: "/enterprise/portal/requests", label_en: "My Requests", label_ar: "طلباتي" },
            { path: "/enterprise/portal/projects", label_en: "My Projects", label_ar: "مشاريعي" },
          ]),
          primaryCTA: { path: "/enterprise/portal/new-request", label_en: "Start Project", label_ar: "ابدأ مشروع", variant: "primary" as const },
          secondaryCTA: { path: "/enterprise/portal", label_en: "Workspace", label_ar: "مساحة العمل", variant: "secondary" as const },
        };

      case "freelancer":
        return {
          ...base,
          links: dedupeNavLinks([
            { path: "/", label_en: "Home", label_ar: "الرئيسية" },
            { path: "/hiring", label_en: "Jobs", label_ar: "الوظائف" },
            { path: "/my/applications", label_en: "Applications", label_ar: "طلباتي" },
            { path: "/my/portfolio", label_en: "Portfolio", label_ar: "أعمالي" },
            { path: "/academy/courses", label_en: "Learning", label_ar: "التعلّم" },
          ]),
          primaryCTA: { path: "/hiring", label_en: "Browse Jobs", label_ar: "تصفح الوظائف", variant: "primary" as const },
          secondaryCTA: { path: "/talent/portal", label_en: "Workspace", label_ar: "مساحة العمل", variant: "secondary" as const },
        };

      case "expert":
        return {
          ...base,
          links: dedupeNavLinks([
            { path: "/", label_en: "Home", label_ar: "الرئيسية" },
            { path: "/consulting", label_en: "Consulting", label_ar: "الاستشارات" },
            { path: "/consulting/portal/bookings", label_en: "Sessions", label_ar: "الجلسات" },
            { path: "/consulting/portal/availability", label_en: "Availability", label_ar: "التوفر" },
          ]),
          primaryCTA: { path: "/consulting/portal/bookings", label_en: "View Sessions", label_ar: "عرض الجلسات", variant: "primary" as const },
          secondaryCTA: { path: "/consulting/portal", label_en: "Workspace", label_ar: "مساحة العمل", variant: "secondary" as const },
        };

      case "student":
        return {
          ...base,
          links: dedupeNavLinks([
            { path: "/", label_en: "Home", label_ar: "الرئيسية" },
            { path: "/academy", label_en: "Academy", label_ar: "الأكاديمية" },
            { path: "/academy/courses", label_en: "Courses", label_ar: "الدورات" },
            { path: "/my/learning", label_en: "My Learning", label_ar: "تعلّمي" },
            { path: "/my/certificates", label_en: "Certificates", label_ar: "شهاداتي" },
          ]),
          primaryCTA: { path: "/my/learning", label_en: "Continue Learning", label_ar: "تابع التعلم", variant: "primary" as const },
          secondaryCTA: { path: "/academy/portal", label_en: "Learning Hub", label_ar: "مركز التعلم", variant: "secondary" as const },
        };

      case "instructor":
        return {
          ...base,
          links: dedupeNavLinks([
            { path: "/", label_en: "Home", label_ar: "الرئيسية" },
            { path: "/instructor/jobs", label_en: "Jobs", label_ar: "الوظائف" },
            { path: "/instructor/courses", label_en: "View My Listed Courses", label_ar: "عرض دوراتي" },
            { path: "/instructor/questions", label_en: "Student Questions", label_ar: "أسئلة الطلاب" },
            { path: "/instructor/assistants", label_en: "Assistant Oversight", label_ar: "إشراف المساعدين" },
          ]),
          primaryCTA: { path: "/instructor/workspace", label_en: "Open Workspace", label_ar: "مساحة العمل", variant: "primary" as const },
        };

      case "admin":
        return {
          ...base,
          showMegaMenu: false,
          links: dedupeNavLinks([
            { path: "/admin/users", label_en: "Users", label_ar: "المستخدمون" },
            { path: "/admin/service-requests", label_en: "Operations", label_ar: "العمليات" },
            { path: "/admin/payments", label_en: "Payments", label_ar: "المدفوعات" },
          ]),
          primaryCTA: { path: "/admin", label_en: "Backoffice", label_ar: "الإدارة", variant: "primary" as const },
        };

      default:
        return {
          ...base,
          showMegaMenu: true,
          links: dedupeNavLinks(PUBLIC_NAV_CONFIG.links),
          primaryCTA: PUBLIC_NAV_CONFIG.primaryCTA,
          secondaryCTA: PUBLIC_NAV_CONFIG.secondaryCTA,
        };
    }
  }, [user, accountType, area]);
}
