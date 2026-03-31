/**
 * SuggestedNextSteps — Rule-based suggestions with deep-link routing.
 */
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { resolveDeepLink, getFallback } from "@/lib/workspaceRoutes";
import { buildEntryState } from "@/lib/workspaceEntry";
import { motion } from "framer-motion";
import {
  User, FileText, Calendar, BookOpen, Clock,
  Upload, Lightbulb, ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Suggestion {
  icon: LucideIcon;
  label_en: string;
  label_ar: string;
  path: string;
  priority: number;
}

export default function SuggestedNextSteps() {
  const { lang } = useLanguage();
  const { user, accountType } = useAuth();
  const isAr = lang === "ar";

  const { data: suggestions = [] } = useQuery({
    queryKey: ["suggested-steps", user?.id, accountType],
    enabled: !!user && !!accountType,
    staleTime: 2 * 60_000,
    queryFn: async (): Promise<Suggestion[]> => {
      const uid = user!.id;
      const currentAccountType = accountType ?? "freelancer";
      const items: Suggestion[] = [];

      const { data: profile } = await supabase
        .from("profiles").select("full_name, bio, skills, avatar_url")
        .eq("user_id", uid).maybeSingle();

      if (profile && !profile.avatar_url) {
        items.push({ icon: Upload, label_en: "Add a profile photo", label_ar: "أضف صورة للملف", path: getFallback(currentAccountType, "profile").path || "/profile/edit", priority: 1 });
      }
      if (profile && !profile.bio) {
        items.push({ icon: User, label_en: "Write your bio", label_ar: "اكتب نبذة عنك", path: "/profile/edit", priority: 2 });
      }

      if (currentAccountType === "company") {
        const { data: pendingQuotes } = await supabase
          .from("quotes").select("id", { count: "exact", head: false })
          .eq("status", "pending").limit(5);
        const count = pendingQuotes?.length ?? 0;
        if (count > 0) {
          const firstId = pendingQuotes?.[0]?.id;
          const target = count === 1 && firstId
            ? resolveDeepLink("company", "quotes", firstId)
            : getFallback("company", "quotes");
          items.push({ icon: FileText, label_en: `Review ${count} pending quote(s)`, label_ar: `راجع ${count} عرض سعر معلق`, path: target.path, priority: 0 });
        }
      }

      if (currentAccountType === "expert") {
        const { count } = await supabase
          .from("expert_availability").select("id", { count: "exact", head: true })
          .eq("expert_id", uid).eq("is_active", true);
        if ((count ?? 0) === 0) {
          const target = getFallback("expert", "availability");
          items.push({ icon: Calendar, label_en: "Set your availability", label_ar: "حدد أوقات توافرك", path: target.path, priority: 0 });
        }
      }

      if (currentAccountType === "student") {
        const { data: enrollment } = await supabase
          .from("course_enrollments").select("id, course_id")
          .eq("user_id", uid).eq("status", "active").limit(1).maybeSingle();
        if (enrollment) {
          const target = resolveDeepLink("student", "courses", enrollment.course_id);
          items.push({ icon: BookOpen, label_en: "Continue your active course", label_ar: "أكمل دورتك النشطة", path: target.path, priority: 0 });
        }
      }

      if (currentAccountType === "instructor") {
        const { count } = await supabase
          .from("training_courses").select("id", { count: "exact", head: true })
          .eq("instructor_id", uid).eq("status", "draft");
        if ((count ?? 0) > 0) {
          const target = getFallback("instructor", "courses");
          items.push({ icon: Clock, label_en: `Publish ${count} draft course(s)`, label_ar: `انشر ${count} مسودة دورة`, path: target.path, priority: 0 });
        }
      }

      return items.sort((a, b) => a.priority - b.priority).slice(0, 4);
    },
  });

  if (suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
    >
      <div className="section-header">
        <h2 className="section-label">
          <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center">
            <Lightbulb className="h-3.5 w-3.5 text-primary" />
          </div>
          {isAr ? "خطوات مقترحة" : "Suggested Next Steps"}
        </h2>
      </div>
      <div className="grid gap-2">
        {suggestions.map((s, i) => (
          <Link
            key={`${s.path}-${i}`}
            to={s.path}
            state={buildEntryState({ context_en: s.label_en, context_ar: s.label_ar })}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/60 bg-card hover:border-primary/15 hover:bg-primary/3 transition-all duration-200 group"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0">
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm text-foreground flex-1">
              {isAr ? s.label_ar : s.label_en}
            </span>
            <ArrowRight className="icon-flip-rtl h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
