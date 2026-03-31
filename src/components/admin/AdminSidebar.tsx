import {
  LayoutDashboard, FileText, Briefcase, Users, UserCheck,
  Mail, Calendar, Image, LogOut, ChevronLeft, Wrench, GraduationCap, UserPlus, Camera, MessageSquareQuote, Bell, CreditCard, ClipboardList, FileInput, Receipt, FolderKanban, Handshake
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const contentItems = [
  { titleKey: "admin.dashboard", url: "/admin", icon: LayoutDashboard },
  { titleKey: "admin.serviceRequests", url: "/admin/service-requests", icon: FileInput },
  { titleKey: "admin.quotes", url: "/admin/quotes", icon: Receipt },
  { titleKey: "admin.projectTracking", url: "/admin/projects", icon: FolderKanban },
  { titleKey: "admin.blogPosts", url: "/admin/blog", icon: FileText },
  { titleKey: "admin.portfolio", url: "/admin/portfolio", icon: Briefcase },
  { titleKey: "admin.services", url: "/admin/services", icon: Wrench },
  { titleKey: "admin.teamMembers", url: "/admin/team", icon: Users },
  { titleKey: "admin.testimonials", url: "/admin/testimonials", icon: MessageSquareQuote },
];

const operationItems = [
  { titleKey: "admin.training", url: "/admin/training", icon: GraduationCap },
  { titleKey: "admin.instructorApps", url: "/admin/instructor-applications", icon: ClipboardList },
  { titleKey: "admin.hiring", url: "/admin/hiring", icon: UserPlus },
  { titleKey: "admin.engagements", url: "/admin/engagements", icon: Handshake },
  { titleKey: "admin.experts", url: "/admin/experts", icon: UserCheck },
  { titleKey: "admin.bookings", url: "/admin/bookings", icon: Calendar },
  { titleKey: "admin.payments", url: "/admin/payments", icon: CreditCard },
  { titleKey: "admin.contacts", url: "/admin/contacts", icon: Mail },
  { titleKey: "admin.media", url: "/admin/media", icon: Image },
  { titleKey: "admin.gallery", url: "/admin/gallery", icon: Camera },
  { titleKey: "admin.users", url: "/admin/users", icon: Users },
  { titleKey: "admin.notifications", url: "/admin/notifications", icon: Bell },
];

export default function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();
  const { t, dir } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (url: string) => {
    if (url === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(url);
  };

  return (
    <Sidebar collapsible="icon" side={dir === "rtl" ? "right" : "left"} className="border-e-0 overflow-hidden">
      <SidebarContent className="admin-gradient-sidebar text-white/90">
        {/* Brand */}
        <div className="p-4 pb-6 pt-5">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-sm shadow-lg">
                DW
              </div>
              <div>
                <div className="text-sm font-bold tracking-tight text-white">DevWady</div>
                <div className="text-[10px] text-white/60">{t("admin.console")}</div>
              </div>
            </div>
          ) : (
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-sm mx-auto shadow-lg">
              DW
            </div>
          )}
        </div>

        {/* Content Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-white/40 px-4 mb-1">
            {t("admin.content")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {contentItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className={`mx-2 rounded-xl transition-all duration-200 text-white/70 hover:text-white hover:bg-white/10 ${
                        isActive(item.url) ? "!bg-white/20 !text-white font-semibold shadow-sm" : ""
                      }`}
                      activeClassName="!bg-white/20 !text-white font-semibold"
                    >
                      <item.icon className="me-2.5 h-4 w-4" />
                      {!collapsed && <span className="text-sm">{t(item.titleKey)}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Operations Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-white/40 px-4 mb-1">
            {t("admin.operations")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {operationItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={`mx-2 rounded-xl transition-all duration-200 text-white/70 hover:text-white hover:bg-white/10 ${
                        isActive(item.url) ? "!bg-white/20 !text-white font-semibold shadow-sm" : ""
                      }`}
                      activeClassName="!bg-white/20 !text-white font-semibold"
                    >
                      <item.icon className="me-2.5 h-4 w-4" />
                      {!collapsed && <span className="text-sm">{t(item.titleKey)}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="admin-gradient-sidebar border-t border-white/10 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/" className="mx-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all" activeClassName="">
                <ChevronLeft className="icon-flip-rtl me-2.5 h-4 w-4" />
                {!collapsed && <span className="text-sm">{t("admin.backToSite")}</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} className="mx-2 rounded-xl text-red-300/80 hover:text-red-200 hover:bg-red-500/15 cursor-pointer transition-all">
              <LogOut className="me-2.5 h-4 w-4" />
              {!collapsed && <span className="text-sm">{t("admin.signOut")}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
