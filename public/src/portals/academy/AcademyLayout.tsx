/**
 * Academy Portal Layout — student-only workspace.
 * Instructor workspace is owned by /instructor/workspace/* (InstructorWorkspaceLayout).
 */
import { ReactNode } from "react";
import { PORTALS } from "@/core/portals/registry";
import PortalGuard from "@/core/guards/PortalGuard";
import PortalShell from "@/core/layouts/PortalShell";
import PortalSidebar, { type SidebarNavGroup } from "@/core/layouts/PortalSidebar";
import PortalQuickBar from "@/core/components/PortalQuickBar";
import { ACADEMY_STUDENT_HEADER } from "@/core/config/portalHeaderConfig";
import {
  LayoutDashboard, BookOpen, BarChart3, Award, Search, Settings, Sparkles,
} from "lucide-react";

const portal = PORTALS.academy;

const studentGroups: SidebarNavGroup[] = [
  {
    label_en: "Workspace",
    label_ar: "مساحة العمل",
    items: [
      { label_en: "Dashboard", label_ar: "لوحة التحكم", url: "/academy/portal", icon: LayoutDashboard },
    ],
  },
  {
    label_en: "Learning",
    label_ar: "التعلم",
    items: [
      { label_en: "My Courses", label_ar: "دوراتي", url: "/academy/portal/courses", icon: BookOpen },
      { label_en: "Progress", label_ar: "التقدم", url: "/academy/portal/progress", icon: BarChart3 },
      { label_en: "Certificates", label_ar: "الشهادات", url: "/academy/portal/certificates", icon: Award },
      { label_en: "Browse Courses", label_ar: "تصفح الدورات", url: "/academy/courses", icon: Search },
    ],
  },
  {
    label_en: "Career",
    label_ar: "المسار المهني",
    items: [
      { label_en: "Talent Profile", label_ar: "ملف المواهب", url: "/academy/portal/talent-profile", icon: Sparkles },
    ],
  },
  {
    label_en: "Settings",
    label_ar: "الإعدادات",
    items: [
      { label_en: "Preferences", label_ar: "التفضيلات", url: "/academy/portal/settings", icon: Settings },
    ],
  },
];

export default function AcademyLayout({ children }: { children: ReactNode }) {
  return (
    <PortalGuard portal={portal}>
      <PortalShell portal={portal} sidebar={<PortalSidebar portal={portal} groups={studentGroups} />}>
        <PortalQuickBar config={ACADEMY_STUDENT_HEADER} />
        {children}
      </PortalShell>
    </PortalGuard>
  );
}
