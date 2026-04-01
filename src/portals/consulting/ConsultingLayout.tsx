/**
 * Consulting Portal Layout — account-type-aware sidebar + account-type-first quick bar.
 */
import { ReactNode } from "react";
import { PORTALS } from "@/core/portals/registry";
import PortalGuard from "@/core/guards/PortalGuard";
import PortalShell from "@/core/layouts/PortalShell";
import PortalSidebar, { type SidebarNavGroup } from "@/core/layouts/PortalSidebar";
import PortalQuickBar from "@/core/components/PortalQuickBar";
import { CONSULTING_EXPERT_HEADER, CONSULTING_CLIENT_HEADER } from "@/core/config/portalHeaderConfig";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Calendar, Clock, DollarSign,
  User, Settings, History, Search,
} from "lucide-react";

const portal = PORTALS.consulting;

const expertGroups: SidebarNavGroup[] = [
  {
    label_en: "Workspace",
    label_ar: "مساحة العمل",
    items: [
      { label_en: "Dashboard", label_ar: "لوحة التحكم", url: "/consulting/portal", icon: LayoutDashboard },
    ],
  },
  {
    label_en: "Sessions",
    label_ar: "الجلسات",
    items: [
      { label_en: "Bookings", label_ar: "الحجوزات", url: "/consulting/portal/bookings", icon: Calendar },
      { label_en: "Availability", label_ar: "جدول التوافر", url: "/consulting/portal/availability", icon: Clock },
    ],
  },
  {
    label_en: "Earnings & Profile",
    label_ar: "الأرباح والملف",
    items: [
      { label_en: "Earnings", label_ar: "الأرباح", url: "/consulting/portal/earnings", icon: DollarSign },
      { label_en: "Edit Profile", label_ar: "تعديل الملف", url: "/consulting/portal/profile", icon: User },
    ],
  },
  {
    label_en: "Settings",
    label_ar: "الإعدادات",
    items: [
      { label_en: "Workspace Settings", label_ar: "إعدادات مساحة العمل", url: "/consulting/portal/settings", icon: Settings },
    ],
  },
];

const clientGroups: SidebarNavGroup[] = [
  {
    label_en: "Workspace",
    label_ar: "مساحة العمل",
    items: [
      { label_en: "Dashboard", label_ar: "لوحة التحكم", url: "/consulting/portal", icon: LayoutDashboard },
    ],
  },
  {
    label_en: "My Sessions",
    label_ar: "جلساتي",
    items: [
      { label_en: "Upcoming & Active", label_ar: "القادمة والنشطة", url: "/consulting/portal/sessions", icon: Calendar },
      { label_en: "Session History", label_ar: "سجل الجلسات", url: "/consulting/portal/history", icon: History },
      { label_en: "Browse Experts", label_ar: "تصفح الخبراء", url: "/consulting", icon: Search },
    ],
  },
  {
    label_en: "Settings",
    label_ar: "الإعدادات",
    items: [
      { label_en: "Preferences", label_ar: "التفضيلات", url: "/consulting/portal/settings", icon: Settings },
    ],
  },
];

export default function ConsultingLayout({ children }: { children: ReactNode }) {
  const { accountType } = useAuth();
  const isExpertWorkspace = accountType === "expert" || accountType === "admin";
  const groups = isExpertWorkspace ? expertGroups : clientGroups;
  const headerConfig = isExpertWorkspace ? CONSULTING_EXPERT_HEADER : CONSULTING_CLIENT_HEADER;

  return (
    <PortalGuard portal={portal}>
      <PortalShell portal={portal} sidebar={<PortalSidebar portal={portal} groups={groups} />}>
        <PortalQuickBar config={headerConfig} />
        {children}
      </PortalShell>
    </PortalGuard>
  );
}
