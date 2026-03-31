/**
 * ResumeTaskCard — Shows one high-priority unfinished item for the signed-in user.
 * Routes to the exact entity-level deep link when possible, with section-level fallbacks.
 */
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { resolveDeepLink, getFallback } from "@/lib/workspaceRoutes";
import { buildEntryState } from "@/lib/workspaceEntry";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, FileText, Briefcase, Calendar, BookOpen,
  User, Rocket, Clock, Edit3,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ResumeItem {
  icon: LucideIcon;
  title_en: string;
  title_ar: string;
  desc_en: string;
  desc_ar: string;
  cta_en: string;
  cta_ar: string;
  path: string;
}

export default function ResumeTaskCard() {
  const { lang } = useLanguage();
  const { user, role } = useAuth();
  const isAr = lang === "ar";

  const { data: resumeItem } = useQuery({
    queryKey: ["resume-task", user?.id, role],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async (): Promise<ResumeItem | null> => {
      const uid = user!.id;
      const r = role ?? "individual";

      if (r === "company") {
        const { data: quote } = await supabase
          .from("quotes").select("id, title, service_request_id")
          .eq("status", "pending").order("created_at", { ascending: false })
          .limit(1).maybeSingle();
        if (quote) {
          const target = resolveDeepLink("company", "quotes", quote.id);
          return { icon: FileText, title_en: "Quote awaiting your review", title_ar: "عرض سعر بانتظار مراجعتك", desc_en: quote.title ?? "A quote needs your attention", desc_ar: quote.title ?? "عرض سعر يحتاج اهتمامك", cta_en: target.label_en, cta_ar: target.label_ar, path: target.path };
        }
        const { data: project } = await supabase
          .from("project_tracking").select("id, title")
          .eq("user_id", uid).not("status", "in", '("completed","cancelled")')
          .order("updated_at", { ascending: false }).limit(1).maybeSingle();
        if (project) {
          const target = resolveDeepLink("company", "projects", project.id);
          return { icon: Rocket, title_en: "Active project in progress", title_ar: "مشروع نشط قيد التنفيذ", desc_en: project.title ?? "Your project is underway", desc_ar: project.title ?? "مشروعك قيد التنفيذ", cta_en: target.label_en, cta_ar: target.label_ar, path: target.path };
        }
        const { data: req } = await supabase
          .from("service_requests").select("id, title")
          .eq("user_id", uid).in("status", ["new", "in_progress"])
          .order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (req) {
          const fallback = getFallback("company", "requests");
          return { icon: Rocket, title_en: "Active request in progress", title_ar: "طلب نشط قيد التنفيذ", desc_en: req.title ?? "Your request is being processed", desc_ar: req.title ?? "طلبك قيد المعالجة", cta_en: fallback.label_en, cta_ar: fallback.label_ar, path: fallback.path };
        }
      }

      if (r === "individual") {
        const { data: profile } = await supabase
          .from("profiles").select("full_name, bio, skills, avatar_url")
          .eq("user_id", uid).maybeSingle();
        const missing = profile && (!profile.bio || !profile.skills || !profile.avatar_url);
        if (missing) {
          const target = getFallback("individual", "profile");
          return { icon: User, title_en: "Complete your profile", title_ar: "أكمل ملفك الشخصي", desc_en: "A complete profile helps you stand out to employers", desc_ar: "الملف الكامل يساعدك على التميز أمام أصحاب العمل", cta_en: target.label_en, cta_ar: target.label_ar, path: target.path };
        }
        const { data: app } = await supabase
          .from("job_applications").select("id, status, job_id")
          .eq("applicant_user_id", uid).order("created_at", { ascending: false })
          .limit(1).maybeSingle();
        if (app) {
          const target = getFallback("individual", "applications");
          return { icon: Briefcase, title_en: "Track your latest application", title_ar: "تتبع آخر طلب تقدمت له", desc_en: `Status: ${app.status}`, desc_ar: `الحالة: ${app.status}`, cta_en: target.label_en, cta_ar: target.label_ar, path: target.path };
        }
      }

      if (r === "expert") {
        const { data: session } = await supabase
          .from("consulting_bookings").select("id, booking_date, start_time")
          .eq("expert_id", uid).in("status", ["confirmed", "pending"])
          .gte("booking_date", new Date().toISOString().split("T")[0])
          .order("booking_date", { ascending: true }).limit(1).maybeSingle();
        if (session) {
          const target = getFallback("expert", "bookings");
          return { icon: Calendar, title_en: "Upcoming session", title_ar: "جلسة قادمة", desc_en: `${session.booking_date} at ${session.start_time}`, desc_ar: `${session.booking_date} الساعة ${session.start_time}`, cta_en: target.label_en, cta_ar: target.label_ar, path: target.path };
        }
      }

      if (r === "student") {
        const { data: enrollment } = await supabase
          .from("course_enrollments").select("id, course_id")
          .eq("user_id", uid).eq("status", "active")
          .order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (enrollment) {
          const target = resolveDeepLink("student", "courses", enrollment.course_id);
          return { icon: BookOpen, title_en: "Continue your course", title_ar: "أكمل دورتك", desc_en: "Pick up where you left off", desc_ar: "أكمل من حيث توقفت", cta_en: target.label_en, cta_ar: target.label_ar, path: target.path };
        }
      }

      if (r === "instructor") {
        const { data: course } = await supabase
          .from("training_courses").select("id, title_en")
          .eq("instructor_id", uid).eq("status", "draft")
          .order("updated_at", { ascending: false }).limit(1).maybeSingle();
        if (course) {
          const target = getFallback("instructor", "courses");
          return { icon: Edit3, title_en: "Finish your course draft", title_ar: "أكمل مسودة دورتك", desc_en: course.title_en ?? "Your draft is waiting", desc_ar: course.title_en ?? "مسودتك بانتظارك", cta_en: target.label_en, cta_ar: target.label_ar, path: target.path };
        }
      }

      return null;
    },
  });

  if (!resumeItem) return null;

  const Icon = resumeItem.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="section-gap"
    >
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">
          {isAr ? "أكمل من حيث توقفت" : "Resume where you left off"}
        </span>
      </div>
      <Card className="border-primary/15 overflow-hidden relative group card-hover rounded-2xl">
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-primary to-primary/60" />
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/12 transition-colors">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground mb-0.5">
              {isAr ? resumeItem.title_ar : resumeItem.title_en}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {isAr ? resumeItem.desc_ar : resumeItem.desc_en}
            </p>
          </div>
          <Button asChild size="sm" className="flex-shrink-0 rounded-full shadow-sm">
            <Link to={resumeItem.path} state={buildEntryState({ context_en: resumeItem.title_en, context_ar: resumeItem.title_ar })} className="flex items-center gap-1.5">
              {isAr ? resumeItem.cta_ar : resumeItem.cta_en}
              <ArrowRight className="icon-flip-rtl h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
