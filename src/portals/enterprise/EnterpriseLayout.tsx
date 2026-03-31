/**
 * Enterprise Portal Layout — wraps all /enterprise/portal/* routes.
 */
import { ReactNode } from "react";
import { PORTALS } from "@/core/portals/registry";
import PortalGuard from "@/core/guards/PortalGuard";
import PortalShell from "@/core/layouts/PortalShell";
import PortalSidebar, { type SidebarNavGroup } from "@/core/layouts/PortalSidebar";
import PortalQuickBar from "@/core/components/PortalQuickBar";
import { ENTERPRISE_HEADER } from "@/core/config/portalHeaderConfig";
import {
  LayoutDashboard, FileInput, Receipt, FolderKanban,
  DollarSign, Settings, FileText, Plus,
} from "lucide-react";

const portal = PORTALS.enterprise;

const navGroups: SidebarNavGroup[] = [
  {
    label_en: "Workspace",
    label_ar: "مساحة العمل",
    items: [
      { label_en: "Dashboard", label_ar: "لوحة التحكم", url: "/enterprise/portal", icon: LayoutDashboard },
      { label_en: "New Request", label_ar: "طلب جديد", url: "/enterprise/portal/requests/new", icon: Plus },
    ],
  },
  {
    label_en: "Delivery",
    label_ar: "التسليمات",
    items: [
      { label_en: "My Projects", label_ar: "مشاريعي", url: "/enterprise/portal/projects", icon: FolderKanban },
      { label_en: "Service Requests", label_ar: "طلبات الخدمة", url: "/enterprise/portal/requests", icon: FileInput },
      { label_en: "Quotes & Proposals", label_ar: "العروض والمقترحات", url: "/enterprise/portal/quotes", icon: Receipt },
    ],
  },
  {
    label_en: "Finance & Files",
    label_ar: "المالية والملفات",
    items: [
      { label_en: "Billing", label_ar: "الفواتير", url: "/enterprise/portal/billing", icon: DollarSign },
      { label_en: "Documents", label_ar: "المستندات", url: "/enterprise/portal/documents", icon: FileText },
    ],
  },
  {
    label_en: "Company",
    label_ar: "الشركة",
    items: [
      { label_en: "Workspace Settings", label_ar: "إعدادات مساحة العمل", url: "/enterprise/portal/settings", icon: Settings },
    ],
  },
];

export default function EnterpriseLayout({ children }: { children: ReactNode }) {
  return (
    <PortalGuard portal={portal}>
      <PortalShell portal={portal} sidebar={<PortalSidebar portal={portal} groups={navGroups} />}>
        <PortalQuickBar config={ENTERPRISE_HEADER} />
        {children}
      </PortalShell>
    </PortalGuard>
  );
}
