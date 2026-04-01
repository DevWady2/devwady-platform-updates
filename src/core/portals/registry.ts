/**
 * Portal Registry — Single source of truth for all DevWady portals.
 * Each portal defines its slug, base path, allowed account types, display metadata, and accent color.
 */
import type { LucideIcon } from "lucide-react";
import {
  Globe, Rocket, Users, MessageSquareMore, GraduationCap, ShieldCheck,
} from "lucide-react";
import type { PortalId, AccountType, Capability } from "@/core/types";

export interface PortalConfig {
  id: PortalId;
  basePath: string;
  label_en: string;
  label_ar: string;
  description_en: string;
  description_ar: string;
  icon: LucideIcon;
  /** Canonical account types that can access this portal (empty = public) */
  allowedAccountTypes: AccountType[];
  /** Optional capability hints for transition-safe access checks */
  allowedCapabilities?: Capability[];
  /** Whether the portal requires authentication */
  requiresAuth: boolean;
  /** Accent CSS class for the portal header gradient */
  accentGradient: string;
}

export const PORTALS: Record<PortalId, PortalConfig> = {
  public: {
    id: "public",
    basePath: "/",
    label_en: "DevWady",
    label_ar: "ديف وادي",
    description_en: "Main public website",
    description_ar: "الموقع العام الرئيسي",
    icon: Globe,
    allowedAccountTypes: [],
    allowedCapabilities: [],
    requiresAuth: false,
    accentGradient: "from-primary to-secondary",
  },
  enterprise: {
    id: "enterprise",
    basePath: "/enterprise/portal",
    label_en: "Enterprise",
    label_ar: "إنتربرايز",
    description_en: "Projects, systems & delivery",
    description_ar: "المشاريع والأنظمة والتسليم",
    icon: Rocket,
    allowedAccountTypes: ["company", "admin"],
    allowedCapabilities: [],
    requiresAuth: true,
    accentGradient: "from-[#7D33FF] to-[#956EFA]",
  },
  talent: {
    id: "talent",
    basePath: "/talent/portal",
    label_en: "Talent",
    label_ar: "تالنت",
    description_en: "Hiring, staffing & talent",
    description_ar: "التوظيف والتعهيد والمواهب",
    icon: Users,
    allowedAccountTypes: ["company", "freelancer", "admin"],
    allowedCapabilities: [],
    requiresAuth: true,
    accentGradient: "from-[#185FA5] to-[#378ADD]",
  },
  consulting: {
    id: "consulting",
    basePath: "/consulting/portal",
    label_en: "Consulting",
    label_ar: "الاستشارات",
    description_en: "Expert consulting sessions",
    description_ar: "جلسات استشارية مع الخبراء",
    icon: MessageSquareMore,
    allowedAccountTypes: ["freelancer", "company", "expert", "admin"],
    allowedCapabilities: [],
    requiresAuth: true,
    accentGradient: "from-[#7D33FF] to-[#3333FF]",
  },
  academy: {
    id: "academy",
    basePath: "/academy/portal",
    label_en: "Academy",
    label_ar: "الأكاديمية",
    description_en: "Student learning & courses",
    description_ar: "تعلم الطلاب والدورات",
    icon: GraduationCap,
    allowedAccountTypes: ["student", "admin"],
    allowedCapabilities: [],
    requiresAuth: true,
    accentGradient: "from-[#0F6E56] to-[#1D9E75]",
  },
  instructor: {
    id: "instructor",
    basePath: "/instructor/workspace",
    label_en: "Instructor Workspace",
    label_ar: "مساحة عمل المعلم",
    description_en: "Course creation & teaching management",
    description_ar: "إنشاء الدورات وإدارة التدريس",
    icon: GraduationCap,
    allowedAccountTypes: ["instructor", "admin"],
    allowedCapabilities: ["create_courses"],
    requiresAuth: true,
    accentGradient: "from-[#0F6E56] to-[#1D9E75]",
  },
  backoffice: {
    id: "backoffice",
    basePath: "/admin",
    label_en: "Backoffice",
    label_ar: "الإدارة",
    description_en: "Internal administration",
    description_ar: "الإدارة الداخلية",
    icon: ShieldCheck,
    allowedAccountTypes: ["admin"],
    allowedCapabilities: ["admin_backoffice"],
    requiresAuth: true,
    accentGradient: "from-rose-600 to-pink-500",
  },
};

export const PORTAL_LIST = Object.values(PORTALS);

/** Get a portal config by its base path */
export function getPortalByPath(path: string): PortalConfig | undefined {
  if (path === "/" || path === "") return PORTALS.public;
  return PORTAL_LIST.find(
    (p) => p.basePath !== "/" && path.startsWith(p.basePath)
  );
}


export interface PortalAccessSubject {
  accountType?: AccountType | null;
  capabilities?: Capability[];
}

/**
 * Canonical portal access check.
 * Prefer accountType and optionally allow capability-based access for portals that define it.
 * No legacy runtime fallback is used here.
 */
export function canAccessPortal(portal: PortalConfig, subject: PortalAccessSubject): boolean {
  if (!portal.requiresAuth) return true;

  const { accountType = null, capabilities = [] } = subject;

  if (accountType && portal.allowedAccountTypes.includes(accountType)) {
    return true;
  }

  if (portal.allowedCapabilities?.length) {
    const hasCapabilityAccess = portal.allowedCapabilities.some((cap) => capabilities.includes(cap));
    if (hasCapabilityAccess) return true;
  }


  return false;
}
