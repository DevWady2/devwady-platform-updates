import { useState, useEffect, useRef, type MouseEvent as ReactMouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { flushSync } from "react-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import type { AccountType } from "@/core/types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sun, Moon, Menu, X, LogOut, User,
  ShieldCheck, Settings, CreditCard,
  BookOpen, GraduationCap, Users, FolderOpen,
  ArrowRight, Rocket,
  ChevronDown, Layers, Lightbulb, Cpu,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logoLight from "@/assets/logo-light.webp";
import logoDark from "@/assets/logo-dark.svg";
import ProfileCompletenessRing from "@/components/profile/ProfileCompletenessRing";
import NotificationBell from "@/components/NotificationBell";
import { motion, AnimatePresence } from "framer-motion";
import { useNavConfig, type BusinessLine } from "@/hooks/useNavConfig";

/* ── account type badge colors (canonical) ─────────────────── */
const accountBadge: Record<string, string> = {
  admin: "bg-red-500/15 text-red-600",
  company: "bg-blue-500/15 text-blue-600",
  freelancer: "bg-green-500/15 text-green-600",
  expert: "bg-purple-500/15 text-purple-600",
  instructor: "bg-amber-500/15 text-amber-600",
  student: "bg-teal-500/15 text-teal-600",
};

/* ── business line icons ────────────────────────────────────── */
const businessLineIcon: Record<string, LucideIcon> = {
  enterprise: Cpu,
  talent: Users,
  consulting: Lightbulb,
  academy: GraduationCap,
};

/* ── menu item types ────────────────────────────────────────── */
interface MenuItem {
  path: string;
  icon: LucideIcon;
  label_en: string;
  label_ar: string;
  destructive?: boolean;
}

/* workspace items — shown at the top with visual separation */
const accountTypeWorkspaceItems: Record<AccountType, MenuItem[]> = {
  freelancer: [
    { path: "/talent/portal/freelancer", icon: Users, label_en: "Freelancer Workspace", label_ar: "مساحة المستقل" },
  ],
  company: [
    { path: "/enterprise/portal", icon: Rocket, label_en: "Enterprise Workspace", label_ar: "مساحة إنتربرايز" },
    { path: "/talent/portal/company", icon: Users, label_en: "Talent Workspace", label_ar: "مساحة المواهب" },
  ],
  expert: [
    { path: "/consulting/portal", icon: Lightbulb, label_en: "Consulting Workspace", label_ar: "مساحة الاستشارات" },
  ],
  instructor: [],
  student: [
    { path: "/academy/portal", icon: GraduationCap, label_en: "Academy Workspace", label_ar: "مساحة الأكاديمية" },
  ],
  admin: [
    { path: "/admin", icon: ShieldCheck, label_en: "Backoffice", label_ar: "الإدارة", destructive: true },
  ],
};

/* regular menu items — profile, settings & account utilities only.
   Role-specific pages are now in the center nav bar. */
const accountTypeMenuItems: Record<AccountType, MenuItem[]> = {
  freelancer: [
    { path: "/profile", icon: User, label_en: "My Profile", label_ar: "ملفي الشخصي" },
    { path: "/profile/edit", icon: Settings, label_en: "Edit Profile", label_ar: "تعديل الملف" },
    { path: "/profile/payments", icon: CreditCard, label_en: "Payments", label_ar: "المدفوعات" },
  ],
  company: [
    { path: "/profile/edit", icon: Settings, label_en: "Edit Profile", label_ar: "تعديل الملف" },
    { path: "/profile/payments", icon: CreditCard, label_en: "Payments", label_ar: "المدفوعات" },
  ],
  expert: [
    { path: "/profile", icon: User, label_en: "My Profile", label_ar: "ملفي الشخصي" },
    { path: "/profile/edit", icon: Settings, label_en: "Edit Profile", label_ar: "تعديل الملف" },
  ],
  instructor: [
    { path: "/profile", icon: User, label_en: "My Profile", label_ar: "ملفي" },
  ],
  student: [
    { path: "/profile", icon: User, label_en: "My Profile", label_ar: "ملفي الشخصي" },
    { path: "/profile/edit", icon: Settings, label_en: "Edit Profile", label_ar: "تعديل الملف" },
  ],
  admin: [
    { path: "/profile", icon: User, label_en: "My Profile", label_ar: "ملفي الشخصي" },
    { path: "/profile/edit", icon: Settings, label_en: "Edit Profile", label_ar: "تعديل الملف" },
    { path: "/profile/payments", icon: CreditCard, label_en: "Payments", label_ar: "المدفوعات" },
  ],
};

/* ═══════════════════════════════════════════════════════════════
   Mega-Menu Panel — "What We Do"
   ═══════════════════════════════════════════════════════════════ */
function MegaMenuPanel({
  businessLines,
  isAr,
  onClose,
}: {
  businessLines: BusinessLine[];
  isAr: boolean;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[540px] max-w-[calc(100vw-2rem)] rounded-2xl border border-border/50 bg-popover/95 backdrop-blur-xl shadow-xl p-4 z-50"
    >
      <div className="grid grid-cols-2 gap-2">
        {businessLines.map((bl) => {
          const Icon = businessLineIcon[bl.key] || Layers;
          return (
            <Link
              key={bl.key}
              to={bl.path}
              onClick={onClose}
              className={`group flex items-start gap-3 rounded-xl p-3 transition-all hover:bg-accent/50 ${
                bl.emphasis
                  ? "col-span-2 bg-primary/5 border border-primary/10 hover:bg-primary/10"
                  : ""
              }`}
            >
              <div
                className={`flex-shrink-0 mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center ${
                  bl.emphasis
                    ? "gradient-brand text-primary-foreground"
                    : "bg-muted text-muted-foreground group-hover:text-foreground"
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p
                  className={`text-sm font-semibold leading-tight ${
                    bl.emphasis ? "text-primary" : "text-foreground"
                  }`}
                >
                  {isAr ? bl.label_ar : bl.label_en}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                  {isAr ? bl.tagline_ar : bl.tagline_en}
                </p>
              </div>
              <ArrowRight
                className={`icon-flip-rtl ms-auto mt-1 h-3.5 w-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 flex-shrink-0`}
              />
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Navbar
   ═══════════════════════════════════════════════════════════════ */
export default function Navbar() {
  const { t, lang, setLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut, accountStatus, accountType } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const location = useLocation();
  const isAr = lang === "ar";
  const navConfig = useNavConfig();
  const megaRef = useRef<HTMLDivElement>(null);
  const megaTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMegaOpen(false);
  }, [location.pathname]);

  // Body scroll lock when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [mobileOpen]);

  // Escape key closes mobile menu
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [mobileOpen]);

  // Close mega-menu on outside click
  useEffect(() => {
    if (!megaOpen) return;
    const handler = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) {
        setMegaOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [megaOpen]);

  const handleMegaEnter = () => {
    clearTimeout(megaTimeout.current);
    setMegaOpen(true);
  };
  const handleMegaLeave = () => {
    megaTimeout.current = setTimeout(() => setMegaOpen(false), 200);
  };

  const { data: navProfile } = useQuery({
    queryKey: ["navbar-profile", user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: enrollmentCount } = useQuery({
    queryKey: ["navbar-enrollments", user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { count } = await supabase
        .from("course_enrollments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("status", "active");
      return count || 0;
    },
  });

  const { data: serviceRequestCount } = useQuery({
    queryKey: ["navbar-service-requests", user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { count } = await supabase
        .from("service_requests")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return count || 0;
    },
  });

  const initials = navProfile?.full_name
    ? navProfile.full_name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : (user?.email?.[0]?.toUpperCase() ?? "U");

  const workspaceItems: MenuItem[] = accountType ? (accountTypeWorkspaceItems[accountType] || []) : [];
  const menuItems: MenuItem[] = accountType ? (accountTypeMenuItems[accountType] || accountTypeMenuItems.freelancer) : [];

  const crossRoleItems: MenuItem[] = [];
  if (enrollmentCount && enrollmentCount > 0 && accountType !== "student" && accountType !== "instructor") {
    crossRoleItems.push({ path: "/my/learning", icon: BookOpen, label_en: "My Courses", label_ar: "دوراتي" });
  }
  if (serviceRequestCount && serviceRequestCount > 0 && accountType !== "instructor") {
    crossRoleItems.push({ path: "/enterprise/portal/projects", icon: FolderOpen, label_en: "My Projects", label_ar: "مشاريعي" });
  }

  const statusDot = accountStatus === "pending_approval"
    ? "ring-2 ring-amber-500 ring-offset-2 ring-offset-background"
    : accountStatus === "suspended"
      ? "ring-2 ring-red-500 ring-offset-2 ring-offset-background"
      : "";

  const closeMobileMenu = () => {
    flushSync(() => {
      setMobileOpen(false);
      setMegaOpen(false);
    });
  };

  const handleMobileNavigate = (path: string) => (event: ReactMouseEvent<HTMLElement>) => {
    if (event.defaultPrevented) return;
    if ("button" in event && event.button !== 0) return;
    if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return;

    event.preventDefault();
    closeMobileMenu();

    if (location.pathname !== path) {
      navigate(path);
    }
  };

  // Role switching is disabled in single-account model

  const handleMobileSignOut = async () => {
    closeMobileMenu();
    await signOut();
  };

  const renderMenuItemLink = (item: MenuItem) => {
    const Icon = item.icon;
    const label = isAr ? item.label_ar : item.label_en;
    const showBadge = item.path === "/my/learning" && accountType === "student" && enrollmentCount && enrollmentCount > 0;
    return (
      <Link to={item.path} className={`flex items-center gap-2 cursor-pointer ${item.destructive ? "text-destructive" : ""}`}>
        <Icon className="h-4 w-4" /> {label}
        {showBadge && (
          <span className="ms-auto text-[10px] font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
            {enrollmentCount}
          </span>
        )}
      </Link>
    );
  };

  const mobileMenuItem = (item: MenuItem) => (
    <Link
      key={item.path}
      to={item.path}
      onClick={handleMobileNavigate(item.path)}
      className={`px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2.5 transition-colors ${
        item.destructive ? "text-destructive hover:bg-destructive/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
      }`}
    >
      <item.icon className="h-4 w-4" /> {isAr ? item.label_ar : item.label_en}
    </Link>
  );

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const isBusinessLineActive = navConfig.businessLines.some((bl) => isActive(bl.path));

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="container mx-auto px-3 pt-3">
          <motion.div
            initial={false}
            animate={{
              backgroundColor: scrolled
                ? (theme === "dark" ? "rgba(14, 13, 25, 0.85)" : "rgba(255, 255, 255, 0.82)")
                : (theme === "dark" ? "rgba(14, 13, 25, 0.6)" : "rgba(255, 255, 255, 0.55)"),
              boxShadow: scrolled
                ? "0 8px 32px rgba(125, 51, 255, 0.08), 0 1px 2px rgba(0,0,0,0.06)"
                : "0 0 0 rgba(0,0,0,0)",
            }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl backdrop-blur-xl border border-border/50 pointer-events-auto relative z-20"
          >
            <div className="flex items-center justify-between h-14 px-4">
              {/* Logo */}
              <Link to="/" className="flex-shrink-0 flex items-center">
                <img
                  fetchPriority="high"
                  src={theme === "dark" ? logoDark : logoLight}
                  alt="DevWady"
                  className="h-10 w-auto"
                />
              </Link>

              {/* Desktop Center Nav */}
              <div className="hidden lg:flex items-center gap-0.5 mx-4">
                {/* "What We Do" mega-menu trigger — guest only */}
                {navConfig.showMegaMenu && (
                  <div
                    ref={megaRef}
                    className="relative"
                    onMouseEnter={handleMegaEnter}
                    onMouseLeave={handleMegaLeave}
                  >
                    <button
                      onClick={() => setMegaOpen((v) => !v)}
                      className={`relative px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 flex items-center gap-1 ${
                        megaOpen || isBusinessLineActive
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {isAr ? "ما نقدمه" : "What We Do"}
                      <ChevronDown
                        className={`h-3 w-3 transition-transform duration-200 ${
                          megaOpen ? "rotate-180" : ""
                        }`}
                      />
                      {isBusinessLineActive && !megaOpen && (
                        <motion.div
                          layoutId="nav-indicator"
                          className="absolute inset-0 rounded-lg bg-primary/8 -z-10"
                          transition={{ type: "spring", stiffness: 500, damping: 35 }}
                        />
                      )}
                    </button>

                    <AnimatePresence>
                      {megaOpen && (
                        <MegaMenuPanel
                          businessLines={navConfig.businessLines}
                          isAr={isAr}
                          onClose={() => setMegaOpen(false)}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Account-aware direct links */}
                {navConfig.links.map((link) => (
                  <Link
                    key={`${link.path}-${link.label_en}`}
                    to={link.path}
                    className={`relative px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                      isActive(link.path)
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {isAr ? link.label_ar : link.label_en}
                    {isActive(link.path) && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute inset-0 rounded-lg bg-primary/8 -z-10"
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                  </Link>
                ))}
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-1.5">
                <Link to={navConfig.primaryCTA.path} className="hidden lg:block">
                  <Button
                    size="sm"
                    className="gradient-brand text-primary-foreground rounded-full px-4 h-8 text-xs font-semibold shadow-sm hover:shadow-md transition-shadow group"
                  >
                    {isAr ? navConfig.primaryCTA.label_ar : navConfig.primaryCTA.label_en}
                    <ArrowRight className="icon-flip-rtl ms-1.5 h-3 w-3 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                  </Button>
                </Link>

                {/* Sign In for guests — module-aware path */}
                {!user && navConfig.secondaryCTA && (
                  <Link to={navConfig.secondaryCTA.path} className="hidden lg:block">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full h-8 px-4 text-xs font-semibold border border-border/60 hover:border-primary/30 hover:text-primary transition-all"
                    >
                      {isAr ? navConfig.secondaryCTA.label_ar : navConfig.secondaryCTA.label_en}
                    </Button>
                  </Link>
                )}

                {/* Workspace shortcut for logged-in users */}
                {user && navConfig.secondaryCTA && (
                  <Link to={navConfig.secondaryCTA.path} className="hidden lg:block">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full h-8 px-4 text-xs font-semibold border border-border/60 hover:border-primary/30 hover:text-primary transition-all"
                    >
                      {isAr ? navConfig.secondaryCTA.label_ar : navConfig.secondaryCTA.label_en}
                    </Button>
                  </Link>
                )}

                <div className="hidden lg:flex items-center gap-0.5 ms-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                    aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                  >
                    {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setLang(lang === "en" ? "ar" : "en")}
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                    aria-label={lang === "en" ? "Switch to Arabic" : "Switch to English"}
                  >
                    <span className="text-[11px] font-bold">{lang === "en" ? "ع" : "EN"}</span>
                  </Button>
                </div>

                {user && <NotificationBell />}

                {user ? (
                  <div className="hidden lg:block ms-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className={`rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${statusDot}`}>
                          {navProfile?.avatar_url ? (
                            <img
                              loading="lazy"
                              src={navProfile.avatar_url}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover border border-border"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-primary-foreground text-xs font-bold">
                              {initials}
                            </div>
                          )}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <div className="px-3 py-2.5 flex items-center gap-3">
                          <ProfileCompletenessRing size={36} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {navProfile?.full_name || user.email}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            {accountType && (
                              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${accountBadge[accountType] ?? "bg-muted text-muted-foreground"}`}>
                                {accountType === "freelancer" ? (isAr ? "مستقل" : "Freelancer") : accountType}
                              </span>
                            )}
                          </div>
                        </div>
                        <DropdownMenuSeparator />
                        {/* Account type badge — single account model, no role switching */}
                        {accountType && (
                          <>
                            <div className="px-3 py-1">
                              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                {isAr ? "نوع الحساب" : "Account Type"}
                              </p>
                            </div>
                            <div className="px-3 py-1.5">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${accountBadge[accountType] ?? "bg-muted text-muted-foreground"}`}>
                                {accountType === "freelancer" ? (isAr ? "مستقل" : "Freelancer") : accountType}
                              </span>
                            </div>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        {workspaceItems.length > 0 && (
                          <>
                            <div className="px-3 py-1">
                              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                {isAr ? "مساحات العمل" : "Workspaces"}
                              </p>
                            </div>
                            {workspaceItems.map((item) => (
                              <DropdownMenuItem key={item.path} asChild>
                                <Link to={item.path} className="flex items-center gap-2 cursor-pointer font-medium">
                                  <item.icon className="h-4 w-4 text-primary" />
                                  {isAr ? item.label_ar : item.label_en}
                                  <ArrowRight className="icon-flip-rtl h-3 w-3 ms-auto text-muted-foreground/40" />
                                </Link>
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                          </>
                        )}
                        {menuItems.map((item) => (
                          <DropdownMenuItem key={item.path} asChild>
                            {renderMenuItemLink(item)}
                          </DropdownMenuItem>
                        ))}
                        {crossRoleItems.length > 0 && (
                          <>
                            <DropdownMenuSeparator />
                            {crossRoleItems.map((item) => (
                              <DropdownMenuItem key={item.path} asChild>
                                {renderMenuItemLink(item)}
                              </DropdownMenuItem>
                            ))}
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                            <Settings className="h-4 w-4" /> {isAr ? "إعدادات الحساب" : "Account Settings"}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => signOut()}
                          className="flex items-center gap-2 cursor-pointer text-destructive"
                        >
                          <LogOut className="h-4 w-4" /> {t("nav.signOut")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : null}

                {/* Mobile controls */}
                <div className="flex lg:hidden items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="h-8 w-8 rounded-full text-muted-foreground"
                    aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                  >
                    {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setLang(lang === "en" ? "ar" : "en")}
                    className="h-8 w-8 rounded-full text-muted-foreground"
                    aria-label={lang === "en" ? "Switch to Arabic" : "Switch to English"}
                  >
                    <span className="text-[11px] font-bold">{lang === "en" ? "ع" : "EN"}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => setMobileOpen((prev) => !prev)}
                    aria-label={mobileOpen ? "Close menu" : "Open menu"}
                  >
                    {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-10 pointer-events-auto lg:hidden"
                  onClick={closeMobileMenu}
                  aria-hidden="true"
                />
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="relative z-20 lg:hidden mt-2 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-xl overflow-hidden pointer-events-auto"
                >
                <div className="p-3 flex flex-col gap-0.5 max-h-[70vh] overflow-y-auto">
                  {/* Home */}
                  <Link
                    to="/"
                    onClick={handleMobileNavigate("/")}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive("/")
                        ? "text-primary bg-primary/8"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {t("nav.home")}
                  </Link>

                  {/* Business Lines Section — guest only */}
                  {navConfig.showMegaMenu && (
                    <>
                      <div className="px-4 pt-3 pb-1">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          {isAr ? "ما نقدمه" : "What We Do"}
                        </p>
                      </div>
                      {navConfig.businessLines.map((bl) => {
                        const Icon = businessLineIcon[bl.key] || Layers;
                        return (
                          <Link
                            key={bl.key}
                            to={bl.path}
                            onClick={handleMobileNavigate(bl.path)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2.5 ${
                              isActive(bl.path)
                                ? "text-primary bg-primary/8"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            {isAr ? bl.label_ar : bl.label_en}
                          </Link>
                        );
                      })}
                    </>
                  )}

                  <div className="h-px bg-border/50 my-2" />

                  {/* Account-aware nav links (skip Home — already rendered above) */}
                  {navConfig.links
                    .filter((link) => link.path !== "/")
                    .map((link) => (
                    <Link
                      key={`${link.path}-${link.label_en}`}
                      to={link.path}
                      onClick={handleMobileNavigate(link.path)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive(link.path)
                          ? "text-primary bg-primary/8"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      {isAr ? link.label_ar : link.label_en}
                    </Link>
                  ))}

                  <div className="h-px bg-border/50 my-2" />

                  {/* Mobile CTAs */}
                  <Link to={navConfig.primaryCTA.path} onClick={handleMobileNavigate(navConfig.primaryCTA.path)}>
                    <Button className="gradient-brand text-primary-foreground rounded-full w-full h-10 text-sm font-semibold group">
                      {isAr ? navConfig.primaryCTA.label_ar : navConfig.primaryCTA.label_en}
                      <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                    </Button>
                  </Link>
                  {navConfig.secondaryCTA && (
                    <Link to={navConfig.secondaryCTA.path} onClick={handleMobileNavigate(navConfig.secondaryCTA.path)}>
                      <Button variant="outline" className="rounded-full w-full mt-1 h-10 text-sm">
                        {isAr ? navConfig.secondaryCTA.label_ar : navConfig.secondaryCTA.label_en}
                      </Button>
                    </Link>
                  )}

                  {/* Authenticated mobile user section */}
                  {user && (
                    <>
                      <div className="h-px bg-border/50 my-2" />
                      {/* Account type indicator — single account model */}
                      {accountType && (
                        <div className="px-4 py-2">
                          <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-medium capitalize gradient-brand text-primary-foreground`}>
                            {accountType === "freelancer" ? (isAr ? "مستقل" : "Freelancer") : accountType}
                          </span>
                        </div>
                      )}
                      {menuItems.map((item) => mobileMenuItem(item))}
                      {crossRoleItems.map((item) => mobileMenuItem(item))}
                      {mobileMenuItem({ path: "/settings", icon: Settings, label_en: "Account Settings", label_ar: "إعدادات الحساب" })}
                      <Button
                        onClick={() => void handleMobileSignOut()}
                        variant="outline"
                        className="rounded-full w-full mt-2 h-10"
                      >
                        <LogOut className="me-2 h-4 w-4" /> {t("nav.signOut")}
                      </Button>
                    </>
                  )}
                </div>
              </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </nav>

    </>
  );
}
