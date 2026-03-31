import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { buildEntryState } from "@/lib/workspaceEntry";
import { motion } from "framer-motion";
import { useInstructorHomeData } from "@/hooks/useInstructorHomeData";
import { useStudentHomeData } from "@/hooks/useStudentHomeData";

import ProfileCompletenessBanner from "@/components/profile/ProfileCompletenessBanner";
import ResumeTaskCard from "@/components/landing/ResumeTaskCard";
import SuggestedNextSteps from "@/components/landing/SuggestedNextSteps";
import InstructorHomeSections from "@/components/landing/InstructorHomeSections";
import StudentHomeSections from "@/components/landing/StudentHomeSections";
import InstructorSidebar from "@/components/landing/InstructorSidebar";
import StudentHomeRail from "@/components/home/StudentHomeRail";
import ActivityFeed from "@/core/components/ActivityFeed";
import {
  ArrowRight, Rocket, Users, Lightbulb, GraduationCap, BookOpen,
  LayoutDashboard,
} from "lucide-react";

/* ── animation ── */
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.3, ease: "easeOut" as const },
  }),
};

const ROLE_GREETING: Record<string, { subtitle_en: string; subtitle_ar: string }> = {
  company:    { subtitle_en: "Here's what needs your attention today.", subtitle_ar: "إليك ما يحتاج اهتمامك اليوم." },
  individual: { subtitle_en: "Here's what's new for you.", subtitle_ar: "إليك آخر المستجدات." },
  expert:     { subtitle_en: "Here's your consulting overview.", subtitle_ar: "إليك نظرة على استشاراتك." },
  student:    { subtitle_en: "Ready to continue learning?", subtitle_ar: "مستعد لمتابعة التعلم؟" },
  instructor: { subtitle_en: "Here's your teaching & specialization overview.", subtitle_ar: "إليك نظرة على تدريسك وتخصصك." },
};

export default function AuthenticatedHomepage() {
  const { lang } = useLanguage();
  const { user, role, roles } = useAuth();
  const isAr = lang === "ar";

  const { data: profile } = useQuery({
    queryKey: ["auth-home-profile", user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("full_name, avatar_url").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const effectiveRole = role ?? "individual";
  const greeting = ROLE_GREETING[effectiveRole] ?? ROLE_GREETING.individual;
  const firstName = profile?.full_name?.split(" ")[0] ?? "";
  const isInstructor = effectiveRole === "instructor";
  const isStudent = effectiveRole === "student";

  /* primary workspace per role */
  const PRIMARY_WORKSPACE: Record<string, string> = {
    company: "/enterprise/portal",
    individual: "/talent/portal",
    expert: "/consulting/portal",
    student: "/academy/portal",
    instructor: "/instructor/workspace",
  };
  const primaryPath = PRIMARY_WORKSPACE[effectiveRole];

  /* workspace shortcuts — only portals the user has access to */
  const portalCards = [
    { path: "/enterprise/portal", label_en: "Enterprise", label_ar: "إنتربرايز", icon: Rocket, gradient: "from-primary to-primary/60", desc_en: "Projects & delivery", desc_ar: "المشاريع والتسليم", roles: ["company", "admin"] },
    { path: "/talent/portal", label_en: "Talent", label_ar: "تالنت", icon: Users, gradient: "from-accent to-accent/60", desc_en: "Hiring & opportunities", desc_ar: "التوظيف والفرص", roles: ["individual", "company", "admin"] },
    { path: "/consulting/portal", label_en: "Consulting", label_ar: "الاستشارات", icon: Lightbulb, gradient: "from-primary to-accent", desc_en: "Expert sessions", desc_ar: "جلسات الخبراء", roles: ["expert", "individual", "company", "admin"] },
    { path: "/academy/portal", label_en: "Academy", label_ar: "الأكاديمية", icon: GraduationCap, gradient: "from-secondary to-secondary/60", desc_en: "Courses & learning", desc_ar: "الدورات والتعلم", roles: ["student", "admin"] },
    { path: "/instructor/workspace", label_en: "Instructor", label_ar: "المدرب", icon: BookOpen, gradient: "from-amber-500 to-amber-400", desc_en: "Teaching & courses", desc_ar: "التدريس والدورات", roles: ["instructor"] },
  ].filter(p => p.roles.some(r => roles.includes(r as any)));

  /* ── Workspace shortcuts block (shared — legacy roles only) ── */
  const workspaceShortcuts = portalCards.length > 0 && (
    <motion.div initial="hidden" animate="visible" className="section-gap-lg">
      <motion.div variants={fadeUp} custom={0} className="section-header">
        <h2 className="section-label">
          <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center">
            <LayoutDashboard className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          {isAr ? "مساحات العمل" : "Your Workspaces"}
        </h2>
      </motion.div>
      <div className={`grid gap-3 ${portalCards.length >= 3 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2"}`}>
        {portalCards.map((portal, i) => (
          <motion.div key={portal.path} variants={fadeUp} custom={i + 1}>
            <Link
              to={portal.path}
              state={buildEntryState({ context_en: portal.label_en + " Workspace", context_ar: "مساحة " + portal.label_ar })}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 group ${
                portal.path === primaryPath
                  ? "border-primary/20 bg-primary/5 hover:bg-primary/8"
                  : "border-border/60 bg-card hover:border-primary/20 hover:bg-primary/3"
              }`}
            >
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${portal.gradient} flex items-center justify-center flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity`}>
                <portal.icon className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{isAr ? portal.label_ar : portal.label_en}</p>
                <p className="text-[11px] text-muted-foreground truncate">{isAr ? portal.desc_ar : portal.desc_en}</p>
              </div>
              <ArrowRight className="icon-flip-rtl h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors flex-shrink-0" />
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  /* ── Welcome header helper ── */
  const compactHeader = (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-3">
      <h1 className="text-lg lg:text-xl font-bold text-foreground">
        {isAr ? `مرحباً${firstName ? ` ${firstName}` : ""} 👋` : `Welcome back${firstName ? `, ${firstName}` : ""} 👋`}
      </h1>
      <p className="text-muted-foreground text-xs lg:text-sm mt-0.5">
        {isAr ? greeting.subtitle_ar : greeting.subtitle_en}
      </p>
    </motion.div>
  );

  /* ═══════════════════════════════════════════════════════════════════════════
   * INSTRUCTOR — scoped layout
   * ═══════════════════════════════════════════════════════════════════════════ */
  if (isInstructor) return <InstructorHomeLayout header={compactHeader} />;

  /* ═══════════════════════════════════════════════════════════════════════════
   * STUDENT — scoped layout
   * ═══════════════════════════════════════════════════════════════════════════ */
  if (isStudent) return <StudentHomeLayout header={compactHeader} />;

  /* ═══════════════════════════════════════════════════════════════════════════
   * LEGACY LAYOUT — company / expert / individual / other
   * ═══════════════════════════════════════════════════════════════════════════ */
  const legacyHeader = (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-4">
      <h1 className="text-xl lg:text-2xl font-bold text-foreground">
        {isAr ? `مرحباً${firstName ? ` ${firstName}` : ""} 👋` : `Welcome back${firstName ? `, ${firstName}` : ""} 👋`}
      </h1>
      <p className="text-muted-foreground text-xs lg:text-sm mt-0.5">
        {isAr ? greeting.subtitle_ar : greeting.subtitle_en}
      </p>
    </motion.div>
  );

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        {legacyHeader}
        <ProfileCompletenessBanner />
        <ResumeTaskCard />
        <div className="section-gap">
          <SuggestedNextSteps />
        </div>
        <div className="section-gap">
          <ActivityFeed limit={4} />
        </div>
        {workspaceShortcuts}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Scoped layout: Instructor — hooks run only for instructor role
 * ═══════════════════════════════════════════════════════════════════════════ */
function InstructorHomeLayout({ header }: { header: React.ReactNode }) {
  const instructorData = useInstructorHomeData();
  const sidebar = InstructorSidebar();

  return (
    <div className="pt-20 pb-16">
      <div className="container mx-auto px-4 max-w-6xl">
        {header}
        <div className="flex flex-col lg:flex-row gap-5">
          <div className="flex-1 min-w-0">
            <InstructorHomeSections data={instructorData} />
          </div>
          {sidebar?.desktopSidebar}
        </div>
        {sidebar?.mobileAccordion}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Scoped layout: Student — hooks run only for student role
 * ═══════════════════════════════════════════════════════════════════════════ */
function StudentHomeLayout({ header }: { header: React.ReactNode }) {
  const studentData = useStudentHomeData();
  return (
    <div className="pt-20 pb-16">
      <div className="container mx-auto px-4 max-w-6xl">
        {header}
        <div className="flex flex-col lg:flex-row gap-5">
          <div className="flex-1 min-w-0">
            <StudentHomeSections data={studentData} />
          </div>
          <aside className="w-full lg:w-64 xl:w-72 shrink-0 hidden lg:block">
            <div className="sticky top-24">
              <StudentHomeRail data={studentData} />
            </div>
          </aside>
        </div>
        <div className="lg:hidden mt-4">
          <StudentHomeRail data={studentData} />
        </div>
      </div>
    </div>
  );
}
// Phase B3 — Student Home wired