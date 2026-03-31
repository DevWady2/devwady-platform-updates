/**
 * PortalSidebar — Unified sidebar for all authenticated portals.
 * Clean navigation with portal branding, grouped links, and sign-out.
 */
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LogOut, ChevronLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PortalConfig } from "@/core/portals/registry";
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

export interface SidebarNavItem {
  label_en: string;
  label_ar: string;
  url: string;
  icon: LucideIcon;
}

export interface SidebarNavGroup {
  label_en: string;
  label_ar: string;
  items: SidebarNavItem[];
}

interface PortalSidebarProps {
  portal: PortalConfig;
  groups: SidebarNavGroup[];
}

export default function PortalSidebar({ portal, groups }: PortalSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();
  const { lang, dir } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <Sidebar collapsible="icon" side={dir === "rtl" ? "right" : "left"}>
      <SidebarContent className="pt-3">
        {/* Back to home */}
        <div className="px-3 mb-2">
          <Link
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            <ChevronLeft className="h-4 w-4 icon-flip-rtl flex-shrink-0" />
            {!collapsed && (
              <span className="text-xs font-medium">
                {lang === "ar" ? "الرئيسية" : "Home"}
              </span>
            )}
          </Link>
        </div>

        {/* Portal branding */}
        {!collapsed && (
          <div className="px-4 mb-5">
            <div className="flex items-center gap-2.5">
              <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${portal.accentGradient} flex items-center justify-center flex-shrink-0`}>
                <portal.icon className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-foreground leading-none truncate">
                  {lang === "ar" ? portal.label_ar : portal.label_en}
                </h2>
                <p className="label-xs mt-0.5 truncate">
                  {lang === "ar" ? portal.description_ar : portal.description_en}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation groups */}
        {groups.map((group) => (
          <SidebarGroup key={group.label_en}>
            <SidebarGroupLabel className="label-xs uppercase tracking-wider">
              {lang === "ar" ? group.label_ar : group.label_en}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = location.pathname === item.url ||
                    (item.url !== portal.basePath && location.pathname.startsWith(item.url));
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={collapsed ? (lang === "ar" ? item.label_ar : item.label_en) : undefined}
                      >
                        <Link to={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{lang === "ar" ? item.label_ar : item.label_en}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              tooltip={collapsed ? (lang === "ar" ? "تسجيل الخروج" : "Sign Out") : undefined}
              className="text-destructive hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span>{lang === "ar" ? "تسجيل الخروج" : "Sign Out"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
