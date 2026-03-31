/**
 * Talent Portal Layout — role-aware sidebar + role-first quick bar.
 * Companies see recruitment tools; freelancers see job search & applications.
 */
import { ReactNode } from "react";
import { PORTALS } from "@/core/portals/registry";
import PortalGuard from "@/core/guards/PortalGuard";
import PortalShell from "@/core/layouts/PortalShell";
import PortalSidebar, { type SidebarNavGroup } from "@/core/layouts/PortalSidebar";
import PortalQuickBar from "@/core/components/PortalQuickBar";
import { TALENT_COMPANY_HEADER, TALENT_FREELANCER_HEADER } from "@/core/config/portalHeaderConfig";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Briefcase, FileText, Search, Heart,
  Send, UserPlus, Settings, FolderOpen, User,
} from "lucide-react";

const portal = PORTALS.talent;

const companyGroups: SidebarNavGroup[] = [
  {
    label_en: "Workspace",
    label_ar: "مساحة العمل",
    items: [
      { label_en: "Dashboard", label_ar: "لوحة التحكم", url: "/talent/portal/company", icon: LayoutDashboard },
    ],
  },
  {
    label_en: "Recruitment",
    label_ar: "التوظيف",
    items: [
      { label_en: "Job Listings", label_ar: "الوظائف", url: "/talent/portal/company/jobs", icon: Briefcase },
      { label_en: "Applications", label_ar: "الطلبات", url: "/talent/portal/company/applications", icon: FileText },
      { label_en: "Browse Talent", label_ar: "تصفح المواهب", url: "/talent/portal/company/browse", icon: Search },
      { label_en: "Shortlists", label_ar: "القوائم المختصرة", url: "/talent/portal/company/shortlists", icon: Heart },
    ],
  },
  {
    label_en: "Engagements",
    label_ar: "العقود",
    items: [
      { label_en: "Hire Requests", label_ar: "طلبات التوظيف", url: "/talent/portal/company/hires", icon: Send },
      { label_en: "Team Members", label_ar: "أعضاء الفريق", url: "/talent/portal/company/team", icon: UserPlus },
    ],
  },
  {
    label_en: "Settings",
    label_ar: "الإعدادات",
    items: [
      { label_en: "Workspace Settings", label_ar: "إعدادات مساحة العمل", url: "/talent/portal/company/settings", icon: Settings },
    ],
  },
];

const freelancerGroups: SidebarNavGroup[] = [
  {
    label_en: "Workspace",
    label_ar: "مساحة العمل",
    items: [
      { label_en: "Dashboard", label_ar: "لوحة التحكم", url: "/talent/portal/freelancer", icon: LayoutDashboard },
    ],
  },
  {
    label_en: "Jobs",
    label_ar: "الوظائف",
    items: [
      { label_en: "Browse Jobs", label_ar: "تصفح الوظائف", url: "/talent/portal/freelancer/jobs", icon: Search },
      { label_en: "My Applications", label_ar: "طلباتي", url: "/talent/portal/freelancer/applications", icon: FileText },
    ],
  },
  {
    label_en: "Profile",
    label_ar: "الملف الشخصي",
    items: [
      { label_en: "Portfolio", label_ar: "معرض الأعمال", url: "/talent/portal/freelancer/portfolio", icon: FolderOpen },
      { label_en: "Profile", label_ar: "الملف الشخصي", url: "/talent/portal/freelancer/profile", icon: User },
    ],
  },
  {
    label_en: "Settings",
    label_ar: "الإعدادات",
    items: [
      { label_en: "Preferences", label_ar: "التفضيلات", url: "/talent/portal/freelancer/settings", icon: Settings },
    ],
  },
];

export default function TalentLayout({ children }: { children: ReactNode }) {
  const { role } = useAuth();
  const isCompany = role === "company" || role === "admin";
  const groups = isCompany ? companyGroups : freelancerGroups;
  const headerConfig = isCompany ? TALENT_COMPANY_HEADER : TALENT_FREELANCER_HEADER;

  return (
    <PortalGuard portal={portal}>
      <PortalShell portal={portal} sidebar={<PortalSidebar portal={portal} groups={groups} />}>
        <PortalQuickBar config={headerConfig} />
        {children}
      </PortalShell>
    </PortalGuard>
  );
}
