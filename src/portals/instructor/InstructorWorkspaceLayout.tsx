/**
 * Instructor Workspace Layout
 * ────────────────────────────
 * Reuses the PortalShell with academy portal config but provides
 * instructor-specific sidebar navigation pointing to /instructor/workspace/*.
 *
 * This is the canonical layout for the instructor internal workspace route family.
 */
import { ReactNode } from "react";
import { PORTALS } from "@/core/portals/registry";
import PortalGuard from "@/core/guards/PortalGuard";
import PortalShell from "@/core/layouts/PortalShell";
import PortalSidebar, { type SidebarNavGroup } from "@/core/layouts/PortalSidebar";
import PortalQuickBar from "@/core/components/PortalQuickBar";
import { INSTRUCTOR_WORKSPACE_HEADER } from "@/core/config/portalHeaderConfig";
import {
  LayoutDashboard, BookOpen, Plus, Users, DollarSign, Settings, FileText,
} from "lucide-react";
import { INSTRUCTOR_WORKSPACE } from "@/core/routing/academyInstructorRoutes";

// Use the dedicated instructor portal config for auth/role gating
const portal = PORTALS.instructor;

const sidebarGroups: SidebarNavGroup[] = [
  {
    label_en: "Workspace",
    label_ar: "مساحة العمل",
    items: [
      { label_en: "Dashboard", label_ar: "لوحة التحكم", url: INSTRUCTOR_WORKSPACE.root, icon: LayoutDashboard },
    ],
  },
  {
    label_en: "Teaching",
    label_ar: "التدريس",
    items: [
      { label_en: "My Courses", label_ar: "دوراتي", url: INSTRUCTOR_WORKSPACE.courses, icon: BookOpen },
      { label_en: "Create Course", label_ar: "إنشاء دورة", url: INSTRUCTOR_WORKSPACE.courseNew, icon: Plus },
      { label_en: "Lessons", label_ar: "الدروس", url: INSTRUCTOR_WORKSPACE.lessons, icon: FileText },
      { label_en: "Students", label_ar: "الطلاب", url: INSTRUCTOR_WORKSPACE.students, icon: Users },
    ],
  },
  {
    label_en: "Finance",
    label_ar: "المالية",
    items: [
      { label_en: "Earnings", label_ar: "الأرباح", url: INSTRUCTOR_WORKSPACE.earnings, icon: DollarSign },
    ],
  },
  {
    label_en: "Settings",
    label_ar: "الإعدادات",
    items: [
      { label_en: "Preferences", label_ar: "التفضيلات", url: INSTRUCTOR_WORKSPACE.settings, icon: Settings },
    ],
  },
];

export default function InstructorWorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <PortalGuard portal={portal}>
      <PortalShell portal={portal} sidebar={<PortalSidebar portal={portal} groups={sidebarGroups} />}>
        <PortalQuickBar config={INSTRUCTOR_WORKSPACE_HEADER} />
        {children}
      </PortalShell>
    </PortalGuard>
  );
}
