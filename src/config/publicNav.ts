export interface PublicNavLink {
  path: string;
  label_en: string;
  label_ar: string;
}

export interface PublicNavCTA {
  path: string;
  label_en: string;
  label_ar: string;
  variant: "primary" | "secondary";
}

export interface BusinessLine {
  key: string;
  path: string;
  label_en: string;
  label_ar: string;
  tagline_en: string;
  tagline_ar: string;
  emphasis?: boolean;
}

export interface PublicNavConfig {
  /** Top-level visible links */
  links: PublicNavLink[];
  /** Business lines shown inside the mega-menu */
  businessLines: BusinessLine[];
  primaryCTA: PublicNavCTA;
  secondaryCTA: PublicNavCTA;
}

/** Business lines for mega-menu — Enterprise first with emphasis */
export const BUSINESS_LINES: BusinessLine[] = [
  {
    key: "enterprise",
    path: "/enterprise",
    label_en: "Enterprise",
    label_ar: "إنتربرايز",
    tagline_en: "Custom software, ERP systems & digital platforms",
    tagline_ar: "أنظمة مخصصة ومنصات رقمية وحلول ERP",
    emphasis: true,
  },
  {
    key: "talent",
    path: "/talent",
    label_en: "Talent",
    label_ar: "تالنت",
    tagline_en: "Staffing, outsourcing & freelancer marketplace",
    tagline_ar: "توظيف واستعانة بمصادر خارجية وسوق مستقلين",
  },
  {
    key: "consulting",
    path: "/consulting",
    label_en: "Consulting",
    label_ar: "الاستشارات",
    tagline_en: "Expert advisory & technical consulting",
    tagline_ar: "استشارات فنية وتقنية متخصصة",
  },
  {
    key: "academy",
    path: "/academy",
    label_en: "Academy",
    label_ar: "الأكاديمية",
    tagline_en: "Courses, bootcamps & professional upskilling",
    tagline_ar: "دورات وبرامج تدريبية وتطوير مهني",
  },
];

/** Single unified public nav config — business-line-first */
export const PUBLIC_NAV_CONFIG: PublicNavConfig = {
  links: [
    // "What We Do" is rendered as a mega-menu trigger, not a simple link
    { path: "/portfolio", label_en: "Our Work", label_ar: "أعمالنا" },
    { path: "/about", label_en: "Company", label_ar: "الشركة" },
  ],
  businessLines: BUSINESS_LINES,
  primaryCTA: {
    path: "/start-project",
    label_en: "Start a Project",
    label_ar: "ابدأ مشروعك",
    variant: "primary",
  },
  secondaryCTA: {
    path: "/login",
    label_en: "Sign In",
    label_ar: "دخول",
    variant: "secondary",
  },
};

export function dedupeNavLinks(links: PublicNavLink[]): PublicNavLink[] {
  const seenPaths = new Set<string>();
  const seenLabels = new Set<string>();

  return links.filter((link) => {
    const pathKey = link.path.trim().toLowerCase();
    const labelKey = `${link.label_en}::${link.label_ar}`.trim().toLowerCase();

    if (seenPaths.has(pathKey) || seenLabels.has(labelKey)) {
      return false;
    }

    seenPaths.add(pathKey);
    seenLabels.add(labelKey);
    return true;
  });
}
