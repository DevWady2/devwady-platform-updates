/**
 * Authenticated student banner shown at top of /training page.
 * Shows overall progress ring, active courses, next lesson, certificates, and quick links.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Award, ArrowRight, PlayCircle, Flame, Target } from "lucide-react";
import { motion } from "framer-motion";

function ProgressRing({ value, size = 56 }: { value: number; size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="hsl(var(--primary))" strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </svg>
  );
}

export default function StudentBanner() {
  const { user, role } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const { data } = useQuery({
    queryKey: ["student-banner", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const [enrollRes, certRes, progressRes] = await Promise.all([
        supabase
          .from("course_enrollments")
          .select("id, status, course_id, enrolled_at, training_courses(title_en, title_ar, slug, total_lessons)")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("course_enrollments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user!.id)
          .eq("status", "completed"),
        supabase
          .from("lesson_progress")
          .select("enrollment_id, is_completed, last_accessed_at")
          .eq("user_id", user!.id),
      ]);
      const enrollments = enrollRes.data ?? [];
      const active = enrollments.filter((e: any) => e.status === "active");
      const completedLessons = (progressRes.data ?? []).filter((p: any) => p.is_completed);

      // Overall progress across all active courses
      let totalLessons = 0;
      let totalDone = 0;
      active.forEach((e: any) => {
        const t = e.training_courses?.total_lessons ?? 0;
        totalLessons += t;
        totalDone += completedLessons.filter((p: any) => p.enrollment_id === e.id).length;
      });
      const overallProgress = totalLessons > 0 ? Math.round((totalDone / totalLessons) * 100) : 0;

      // Find most recent active course for "Continue Learning"
      let continueCourse: any = null;
      let continueProgress = 0;
      if (active.length > 0) {
        const first = active[0] as any;
        const total = first.training_courses?.total_lessons ?? 0;
        const done = completedLessons.filter((p: any) => p.enrollment_id === first.id).length;
        continueProgress = total > 0 ? Math.round((done / total) * 100) : 0;
        continueCourse = first;
      }

      // Learning streak: count unique days with lesson progress in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentDays = new Set(
        (progressRes.data ?? [])
          .filter((p: any) => p.last_accessed_at && new Date(p.last_accessed_at) >= thirtyDaysAgo)
          .map((p: any) => new Date(p.last_accessed_at!).toDateString())
      );
      const streak = recentDays.size;

      return {
        activeCount: active.length,
        certCount: certRes.count ?? 0,
        totalEnrolled: enrollments.length,
        continueCourse,
        continueProgress,
        overallProgress,
        streak,
      };
    },
  });

  if (!user || role !== "student" || !data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-emerald-500/8 to-teal-500/8 border border-emerald-500/15 rounded-2xl p-5 mb-8"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Overall progress ring */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <ProgressRing value={data.overallProgress} size={56} />
            <span className="absolute text-xs font-bold text-primary">{data.overallProgress}%</span>
          </div>
          <div className="hidden md:block">
            <p className="text-xs text-muted-foreground">{isAr ? "التقدم الكلي" : "Overall"}</p>
            <p className="text-sm font-semibold">{isAr ? "التعلم" : "Progress"}</p>
          </div>
        </div>

        {/* Continue learning */}
        {data.continueCourse ? (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <PlayCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">{isAr ? "تابع التعلم" : "Continue Learning"}</p>
              <p className="text-sm font-medium truncate">
                {isAr ? data.continueCourse.training_courses?.title_ar : data.continueCourse.training_courses?.title_en}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={data.continueProgress} className="h-1.5 flex-1 max-w-[120px]" />
                <span className="text-[10px] text-muted-foreground font-medium">{data.continueProgress}%</span>
              </div>
            </div>
            <Link to={`/learn/${data.continueCourse.training_courses?.slug}`}>
              <Button size="sm" className="text-xs h-8 rounded-full">
                {isAr ? "متابعة" : "Resume"} <ArrowRight className="h-3.5 w-3.5 ms-1 icon-flip-rtl" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex-1">
            <p className="text-sm font-medium">{isAr ? "ابدأ رحلة تعلمك!" : "Start your learning journey!"}</p>
            <p className="text-xs text-muted-foreground">{isAr ? "تصفح الدورات أدناه وسجل في أول دورة" : "Browse courses below and enroll in your first course"}</p>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3">
          <div className="text-center px-2">
            <div className="flex items-center justify-center gap-1">
              <Target className="h-3 w-3 text-primary" />
              <p className="text-lg font-bold text-primary">{data.activeCount}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">{isAr ? "نشطة" : "Active"}</p>
          </div>
          <div className="text-center px-2">
            <div className="flex items-center justify-center gap-1">
              <Award className="h-3 w-3 text-amber-500" />
              <p className="text-lg font-bold text-amber-600">{data.certCount}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">{isAr ? "شهادات" : "Certs"}</p>
          </div>
          <div className="text-center px-2">
            <div className="flex items-center justify-center gap-1">
              <Flame className="h-3 w-3 text-orange-500" />
              <p className="text-lg font-bold text-orange-600">{data.streak}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">{isAr ? "أيام" : "Days"}</p>
          </div>
        </div>

        {/* Quick links */}
        <div className="flex items-center gap-2">
          <Link to="/my/learning">
            <Button variant="outline" size="sm" className="text-xs h-8 rounded-full">
              <BookOpen className="h-3.5 w-3.5 me-1" />{isAr ? "تعلّمي" : "My Learning"}
            </Button>
          </Link>
          <Link to="/my/certificates">
            <Button variant="ghost" size="sm" className="text-xs h-8 rounded-full">
              <Award className="h-3.5 w-3.5 me-1" />{isAr ? "شهاداتي" : "Certificates"}
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
