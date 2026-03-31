/**
 * workspaceRoutes — Context-aware deep-link resolver for signed-in homepage.
 *
 * Given a role + optional entity context, returns the best deep-link target
 * with a fallback to the appropriate workspace section.
 */

export interface DeepLinkTarget {
  path: string;
  label_en: string;
  label_ar: string;
}

/* ── Fallback routes by accountType and section ── */
const FALLBACKS: Record<string, Record<string, DeepLinkTarget>> = {
  company: {
    projects:     { path: "/enterprise/portal/projects",  label_en: "All Projects",     label_ar: "كل المشاريع" },
    quotes:       { path: "/enterprise/portal/quotes",    label_en: "All Quotes",       label_ar: "كل عروض الأسعار" },
    requests:     { path: "/enterprise/portal/requests",  label_en: "All Requests",     label_ar: "كل الطلبات" },
    jobs:         { path: "/talent/portal/company/jobs",   label_en: "All Jobs",         label_ar: "كل الوظائف" },
    applications: { path: "/talent/portal/company/applications", label_en: "All Applications", label_ar: "كل الطلبات" },
    workspace:    { path: "/enterprise/portal",           label_en: "Enterprise Workspace", label_ar: "مساحة العمل" },
  },
  freelancer: {
    applications: { path: "/talent/portal/freelancer/applications", label_en: "My Applications", label_ar: "طلباتي" },
    jobs:         { path: "/talent/portal/freelancer/jobs",         label_en: "Browse Jobs",     label_ar: "تصفح الوظائف" },
    profile:      { path: "/profile/edit",                         label_en: "Edit Profile",    label_ar: "تعديل الملف" },
    workspace:    { path: "/talent/portal/freelancer",             label_en: "Talent Workspace", label_ar: "مساحة العمل" },
  },
  /** @deprecated Legacy alias — kept for compatibility with consumers still passing "individual" */
  individual: {
    applications: { path: "/talent/portal/freelancer/applications", label_en: "My Applications", label_ar: "طلباتي" },
    jobs:         { path: "/talent/portal/freelancer/jobs",         label_en: "Browse Jobs",     label_ar: "تصفح الوظائف" },
    profile:      { path: "/profile/edit",                         label_en: "Edit Profile",    label_ar: "تعديل الملف" },
    workspace:    { path: "/talent/portal/freelancer",             label_en: "Talent Workspace", label_ar: "مساحة العمل" },
  },
  expert: {
    bookings:     { path: "/consulting/portal/bookings",     label_en: "All Sessions",      label_ar: "كل الجلسات" },
    availability: { path: "/consulting/portal/availability", label_en: "Availability",      label_ar: "التوافر" },
    workspace:    { path: "/consulting/portal",              label_en: "Consulting Workspace", label_ar: "مساحة العمل" },
  },
  student: {
    courses:      { path: "/academy/portal/courses",      label_en: "My Courses",        label_ar: "دوراتي" },
    certificates: { path: "/academy/portal/certificates", label_en: "Certificates",      label_ar: "الشهادات" },
    workspace:    { path: "/academy/portal",              label_en: "Academy Workspace", label_ar: "مساحة العمل" },
  },
  instructor: {
    courses:   { path: "/instructor/workspace/courses",   label_en: "My Courses",    label_ar: "دوراتي" },
    students:  { path: "/instructor/workspace/students",  label_en: "Students",      label_ar: "الطلاب" },
    workspace: { path: "/instructor/workspace",           label_en: "Instructor Workspace", label_ar: "مساحة العمل" },
  },
};

/**
 * Resolve the best deep-link for a given context.
 * If an entity ID is provided and valid, returns a detail-level route.
 * Otherwise returns the section-level fallback.
 */
export function resolveDeepLink(
  role: string,
  section: string,
  entityId?: string | null,
): DeepLinkTarget {
  // Attempt entity-level deep link
  if (entityId) {
    const deepLink = resolveEntityRoute(role, section, entityId);
    if (deepLink) return deepLink;
  }
  // Fallback to section
  return FALLBACKS[role]?.[section] ?? FALLBACKS[role]?.workspace ?? { path: "/", label_en: "Home", label_ar: "الرئيسية" };
}

function resolveEntityRoute(role: string, section: string, entityId: string): DeepLinkTarget | null {
  switch (role) {
    case "company":
      switch (section) {
        case "projects": return { path: `/enterprise/portal/projects/${entityId}`, label_en: "Open Project", label_ar: "افتح المشروع" };
        case "quotes":   return { path: `/enterprise/portal/quotes/${entityId}`,   label_en: "Review Quote", label_ar: "مراجعة العرض" };
        case "requests": return { path: `/enterprise/portal/requests`,             label_en: "View Request", label_ar: "عرض الطلب" };
        case "jobs":     return { path: `/talent/portal/company/jobs/${entityId}`,  label_en: "View Job",     label_ar: "عرض الوظيفة" };
      }
      break;
    case "freelancer":
    case "individual":
      switch (section) {
        case "applications": return { path: `/talent/portal/freelancer/applications`, label_en: "View Application", label_ar: "عرض الطلب" };
        case "jobs":         return { path: `/talent/portal/freelancer/jobs`,          label_en: "View Job",         label_ar: "عرض الوظيفة" };
      }
      break;
    case "expert":
      switch (section) {
        case "bookings": return { path: `/consulting/portal/bookings`, label_en: "View Session", label_ar: "عرض الجلسة" };
      }
      break;
    case "student":
      switch (section) {
        case "courses": return { path: `/learn/${entityId}`, label_en: "Continue Course", label_ar: "أكمل الدورة" };
      }
      break;
    case "instructor":
      switch (section) {
        case "courses": return { path: `/instructor/workspace/courses`, label_en: "Edit Course", label_ar: "تعديل الدورة" };
      }
      break;
  }
  return null;
}

/** Get the section-level fallback for a role */
export function getFallback(role: string, section: string): DeepLinkTarget {
  return FALLBACKS[role]?.[section] ?? FALLBACKS[role]?.workspace ?? { path: "/", label_en: "Home", label_ar: "الرئيسية" };
}
