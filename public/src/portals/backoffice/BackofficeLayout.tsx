/**
 * Backoffice Portal Layout — admin sidebar + role-first quick bar.
 */
import { ReactNode } from "react";
import { PORTALS } from "@/core/portals/registry";
import PortalGuard from "@/core/guards/PortalGuard";
import PortalShell from "@/core/layouts/PortalShell";
import PortalSidebar, { type SidebarNavGroup } from "@/core/layouts/PortalSidebar";
import PortalQuickBar from "@/core/components/PortalQuickBar";
import { BACKOFFICE_HEADER } from "@/core/config/portalHeaderConfig";
import {
  LayoutDashboard, FileText, Briefcase, Users, UserCheck,
  Mail, Calendar, Image, Wrench, GraduationCap, UserPlus,
  Camera, MessageSquareQuote, Bell, CreditCard, ClipboardList,
  FileInput, Receipt, FolderKanban, Handshake, Shield,
  Settings, BarChart3, Building2,
} from "lucide-react";

const portal = PORTALS.backoffice;

const navGroups: SidebarNavGroup[] = [
  {
    label_en: "Overview",
    label_ar: "نظرة عامة",
    items: [
      { label_en: "Dashboard", label_ar: "لوحة التحكم", url: "/admin", icon: LayoutDashboard },
      { label_en: "Analytics", label_ar: "التحليلات", url: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    label_en: "Users & Access",
    label_ar: "المستخدمون والوصول",
    items: [
      { label_en: "Users", label_ar: "المستخدمون", url: "/admin/users", icon: Users },
      { label_en: "Organizations", label_ar: "المؤسسات", url: "/admin/organizations", icon: Building2 },
      { label_en: "Roles & Permissions", label_ar: "الأدوار والصلاحيات", url: "/admin/roles", icon: Shield },
    ],
  },
  {
    label_en: "Enterprise",
    label_ar: "إنتربرايز",
    items: [
      { label_en: "Service Requests", label_ar: "طلبات الخدمة", url: "/admin/service-requests", icon: FileInput },
      { label_en: "Quotes", label_ar: "عروض الأسعار", url: "/admin/quotes", icon: Receipt },
      { label_en: "Projects", label_ar: "المشاريع", url: "/admin/projects", icon: FolderKanban },
    ],
  },
  {
    label_en: "Talent",
    label_ar: "تالنت",
    items: [
      { label_en: "Job Postings", label_ar: "الوظائف", url: "/admin/hiring", icon: UserPlus },
      { label_en: "Engagements", label_ar: "العقود", url: "/admin/engagements", icon: Handshake },
    ],
  },
  {
    label_en: "Consulting",
    label_ar: "الاستشارات",
    items: [
      { label_en: "Experts", label_ar: "الخبراء", url: "/admin/experts", icon: UserCheck },
      { label_en: "Bookings", label_ar: "الحجوزات", url: "/admin/bookings", icon: Calendar },
    ],
  },
  {
    label_en: "Academy",
    label_ar: "الأكاديمية",
    items: [
      { label_en: "Courses", label_ar: "الدورات", url: "/admin/training", icon: GraduationCap },
      { label_en: "Instructor Apps", label_ar: "طلبات المعلمين", url: "/admin/instructor-applications", icon: ClipboardList },
    ],
  },
  {
    label_en: "Content",
    label_ar: "المحتوى",
    items: [
      { label_en: "Blog", label_ar: "المدونة", url: "/admin/blog", icon: FileText },
      { label_en: "Portfolio", label_ar: "معرض الأعمال", url: "/admin/portfolio", icon: Briefcase },
      { label_en: "Services", label_ar: "الخدمات", url: "/admin/services", icon: Wrench },
      { label_en: "Team", label_ar: "الفريق", url: "/admin/team", icon: Users },
      { label_en: "Testimonials", label_ar: "آراء العملاء", url: "/admin/testimonials", icon: MessageSquareQuote },
      { label_en: "Media", label_ar: "الوسائط", url: "/admin/media", icon: Image },
      { label_en: "Gallery", label_ar: "المعرض", url: "/admin/gallery", icon: Camera },
    ],
  },
  {
    label_en: "Finance",
    label_ar: "المالية",
    items: [
      { label_en: "Payments", label_ar: "المدفوعات", url: "/admin/payments", icon: CreditCard },
    ],
  },
  {
    label_en: "System",
    label_ar: "النظام",
    items: [
      { label_en: "Contacts", label_ar: "الاتصالات", url: "/admin/contacts", icon: Mail },
      { label_en: "Notifications", label_ar: "الإشعارات", url: "/admin/notifications", icon: Bell },
      { label_en: "Settings", label_ar: "الإعدادات", url: "/admin/settings", icon: Settings },
    ],
  },
];

export default function BackofficeLayout({ children }: { children: ReactNode }) {
  return (
    <PortalGuard portal={portal}>
      <PortalShell portal={portal} sidebar={<PortalSidebar portal={portal} groups={navGroups} />}>
        <PortalQuickBar config={BACKOFFICE_HEADER} />
        {children}
      </PortalShell>
    </PortalGuard>
  );
}
