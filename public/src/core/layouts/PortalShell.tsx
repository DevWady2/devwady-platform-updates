/**
 * PortalShell — Shared authenticated portal layout with sidebar + header.
 * Unified header design using portal-header utility class.
 */
import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import type { PortalConfig } from "@/core/portals/registry";
import PortalSwitcher from "@/core/components/PortalSwitcher";
import PortalBreadcrumb from "@/core/components/PortalBreadcrumb";
import NotificationBell from "@/components/NotificationBell";
import PortalErrorBoundary from "@/core/components/PortalErrorBoundary";

interface PortalShellProps {
  portal: PortalConfig;
  sidebar: ReactNode;
  children: ReactNode;
}

export default function PortalShell({ portal, sidebar, children }: PortalShellProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, dir } = useLanguage();
  const location = useLocation();

  const initials = user?.email?.charAt(0).toUpperCase() ?? "?";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/20" dir={dir}>
        {sidebar}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Unified Portal Header */}
          <header className={`portal-header bg-gradient-to-r ${portal.accentGradient}`}>
            <div className="h-14 flex items-center gap-3 px-4 lg:px-6">
              <SidebarTrigger className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200" />

              {/* Portal identity */}
              <div className="flex items-center gap-2 me-auto">
                <portal.icon className="h-4.5 w-4.5 text-white/70" />
                <span className="font-semibold text-sm text-white/90 hidden sm:inline">
                  {lang === "ar" ? portal.label_ar : portal.label_en}
                </span>
                <div className="h-4 w-px bg-white/15 mx-1 hidden sm:block" />
                <PortalSwitcher currentPortal={portal} />
              </div>

              {/* Right controls — compact, unified */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
                  onClick={() => setLang(lang === "en" ? "ar" : "en")}
                  aria-label={lang === "en" ? "Switch to Arabic" : "Switch to English"}
                >
                  <Languages className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <div className="[&_button]:text-white/60 [&_button]:hover:text-white [&_button]:hover:bg-white/10 [&_button]:h-8 [&_button]:w-8 [&_button]:rounded-lg [&_button]:transition-colors [&_button]:duration-200">
                  <NotificationBell />
                </div>
                <div className="h-5 w-px bg-white/15 mx-1.5" />
                <div className="h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center text-white text-xs font-bold">
                  {initials}
                </div>
              </div>
            </div>
          </header>

          {/* Content area with consistent padding */}
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <PortalBreadcrumb portal={portal} />
            <PortalErrorBoundary>
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </PortalErrorBoundary>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
