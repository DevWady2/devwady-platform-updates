/**
 * PortalBreadcrumb — Auto-generates breadcrumbs from the current route path.
 * Strips the portal base path and converts slug segments to bilingual labels.
 */
import { useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";
import type { PortalConfig } from "@/core/portals/registry";

const LABELS: Record<string, [string, string]> = {
  projects: ["Projects", "مشاريع"],
  requests: ["Requests", "الطلبات"],
  quotes: ["Quotes", "عروض الأسعار"],
  billing: ["Billing", "الفواتير"],
  documents: ["Documents", "المستندات"],
  settings: ["Settings", "الإعدادات"],
  courses: ["Courses", "الدورات"],
  bookings: ["Bookings", "الحجوزات"],
  jobs: ["Jobs", "الوظائف"],
  applications: ["Applications", "الطلبات"],
  earnings: ["Earnings", "الأرباح"],
  progress: ["Progress", "التقدم"],
  certificates: ["Certificates", "الشهادات"],
  students: ["Students", "الطلاب"],
  lessons: ["Lessons", "الدروس"],
  create: ["Create", "إنشاء"],
  availability: ["Availability", "التوافر"],
  sessions: ["Sessions", "الجلسات"],
  history: ["History", "السجل"],
  profile: ["Profile", "الملف"],
  portfolio: ["Portfolio", "أعمالي"],
  browse: ["Browse", "تصفح"],
  shortlists: ["Shortlists", "المختصرة"],
  hires: ["Hires", "التوظيفات"],
  team: ["Team", "الفريق"],
  company: ["Company", "الشركة"],
  freelancer: ["Freelancer", "مستقل"],
  new: ["New", "جديد"],
  analytics: ["Analytics", "التحليلات"],
  organizations: ["Organizations", "المؤسسات"],
  roles: ["Roles", "الأدوار"],
};

function isUuidLike(s: string): boolean {
  return s.length >= 20 && /[0-9a-f-]{8,}/i.test(s);
}

function fallbackLabel(segment: string): string {
  return segment.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface Props {
  portal: PortalConfig;
}

export default function PortalBreadcrumb({ portal }: Props) {
  const { pathname } = useLocation();
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const relative = pathname.replace(portal.basePath, "").replace(/^\//, "");
  const segments = relative ? relative.split("/").filter(Boolean) : [];

  // On portal root, show just the portal name as current page
  if (segments.length === 0) {
    return (
      <Breadcrumb className="text-sm mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="flex items-center gap-1.5">
              <Home className="h-3.5 w-3.5" />
              {isAr ? portal.label_ar : portal.label_en}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  const crumbs: { label: string; path: string }[] = [];
  let accumulated = portal.basePath;

  for (const seg of segments) {
    accumulated += `/${seg}`;
    const known = LABELS[seg.toLowerCase()];
    if (known) {
      crumbs.push({ label: isAr ? known[1] : known[0], path: accumulated });
    } else if (isUuidLike(seg)) {
      crumbs.push({ label: isAr ? "التفاصيل" : "Details", path: accumulated });
    } else {
      crumbs.push({ label: fallbackLabel(seg), path: accumulated });
    }
  }

  return (
    <Breadcrumb className="text-sm mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href={portal.basePath} className="flex items-center gap-1.5">
            <Home className="h-3.5 w-3.5" />
            {isAr ? portal.label_ar : portal.label_en}
          </BreadcrumbLink>
        </BreadcrumbItem>
        {crumbs.map((crumb, i) => (
          <span key={crumb.path} className="contents">
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {i === crumbs.length - 1 ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={crumb.path}>{crumb.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
