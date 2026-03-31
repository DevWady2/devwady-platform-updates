/**
 * StudentHomeRail — compact right-column support layer for the Student homepage.
 * Consumes useStudentHomeData() output. Context-aware: adapts blocks by homeState.
 */
import { BookOpen, Award, Calendar, CheckCircle2, GraduationCap, TrendingUp, User, Eye, EyeOff, ShieldCheck, ShieldOff } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import type { StudentHomeData } from "@/hooks/useStudentHomeData";
import QuickActions, { type QuickAction } from "@/components/home/QuickActions";
import { Badge } from "@/components/ui/badge";

import { useActivity } from "@/core/hooks/useActivity";

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Continue Learning", path: "/my/learning", icon: BookOpen },
  { label: "Open Progress", path: "/academy/portal/progress", icon: TrendingUp },
  { label: "Talent Profile", path: "/academy/portal/talent-profile", icon: User },
  { label: "View Certificates", path: "/my/certificates", icon: Award },
  { label: "Browse Courses", path: "/academy/courses", icon: GraduationCap },
];

interface StudentHomeRailProps {
  data: StudentHomeData;
}

export default function StudentHomeRail({ data }: StudentHomeRailProps) {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const state = data.homeState;
  const { activities } = useActivity({ limit: 3 });
  const hasNotifications = activities.length > 0;
  const snap = data.learningSnapshot;

  return (
    <div className="space-y-3">
      {/* Quick Actions — always visible */}
      <RailBlock title={isAr ? "إجراءات سريعة" : "Quick Actions"}>
        <QuickActions actions={QUICK_ACTIONS} />
      </RailBlock>

      {/* Learning Path — only in empty state */}
      {state === "empty" && (
        <RailBlock title={isAr ? "مسار التعلم" : "Your Learning Path"}>
          <div className="space-y-1.5">
            {(isAr
              ? ["سجّل في دورة", "أكمل الدروس", "احصل على شهادة"]
              : ["Enroll in a course", "Complete lessons", "Earn certificate"]
            ).map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                <span>{step}</span>
              </div>
            ))}
          </div>
        </RailBlock>
      )}

      {/* Upcoming Sessions — low_signal / active, only when data exists */}
      {state !== "empty" && data.upcomingSessions.length > 0 && (
        <RailBlock title={isAr ? "الجلسات القادمة" : "Upcoming Sessions"}>
          <div className="space-y-1">
            {data.upcomingSessions.slice(0, 3).map((s) => (
              <Link
                key={s.id}
                to="/my/learning"
                className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-2.5 py-1.5 text-xs hover:bg-muted/50 transition-colors"
              >
                <Calendar className="h-3 w-3 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-card-foreground truncate leading-snug">
                    {s.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {s.courseName} · {format(new Date(s.startAt), "MMM d, h:mm a")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </RailBlock>
      )}

      {/* Notifications — low_signal / active, only when real content */}
      {(state === "low_signal" || state === "active") && hasNotifications && (
        <RailBlock title={isAr ? "الإشعارات" : "Notifications"}>
          <CompactActivityList activities={activities} isAr={isAr} />
        </RailBlock>
      )}

      {/* Learning Snapshot — low_signal / active */}
      {state !== "empty" && (
        <RailBlock title={isAr ? "لمحة سريعة" : "Learning Snapshot"}>
          <div className="rounded-lg border border-border/60 bg-card px-3 py-2 space-y-1.5">
            <SnapshotRow
              label={isAr ? "دورات نشطة" : "Active courses"}
              value={String(snap.activeCourses)}
            />
            <SnapshotRow
              label={isAr ? "دورات مكتملة" : "Completed"}
              value={String(snap.completedCourses)}
            />
          </div>
        </RailBlock>
      )}

      {/* Talent Profile Status — low_signal / active */}
      {state !== "empty" && (
        <RailBlock title={isAr ? "ملف المواهب" : "Talent Profile"}>
          <Link
            to="/academy/portal/talent-profile"
            className="block rounded-lg border border-border/60 bg-card px-3 py-2.5 hover:bg-muted/50 transition-colors space-y-2"
          >
            {/* Visibility */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                {snap.visibilityState === "private" || !snap.visibilityState
                  ? <EyeOff className="h-3 w-3" />
                  : <Eye className="h-3 w-3" />}
                {isAr ? "الظهور" : "Visibility"}
              </span>
              <Badge
                variant="outline"
                className={`text-[9px] px-1.5 py-0 h-4 ${
                  snap.visibilityState === "opportunity_ready"
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    : snap.visibilityState === "academy_only"
                      ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {snap.visibilityState === "opportunity_ready"
                  ? (isAr ? "مفتوح للفرص" : "Open to Opportunities")
                  : snap.visibilityState === "academy_only"
                    ? (isAr ? "الأكاديمية فقط" : "Academy Only")
                    : (isAr ? "خاص" : "Private")}
              </Badge>
            </div>

            {/* Nomination opt-in */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                {snap.allowNomination
                  ? <ShieldCheck className="h-3 w-3" />
                  : <ShieldOff className="h-3 w-3" />}
                {isAr ? "الترشيح" : "Nominations"}
              </span>
              <Badge
                variant="outline"
                className={`text-[9px] px-1.5 py-0 h-4 ${
                  snap.allowNomination
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {snap.allowNomination ? (isAr ? "مفعّل" : "Enabled") : (isAr ? "معطّل" : "Disabled")}
              </Badge>
            </div>

            {/* Profile status — explicitly framed as profile completeness, not readiness */}
            {snap.readinessLabel && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {isAr ? "حالة الملف" : "Profile Status"}
                </span>
                <span className="text-[10px] font-medium text-card-foreground">
                  {snap.readinessLabel === "Profile complete"
                    ? (isAr ? "مكتمل" : "Complete")
                    : (isAr ? "غير مكتمل" : "Incomplete")}
                </span>
              </div>
            )}

            {/* Profile completeness hint */}
            {!snap.talentProfileComplete && snap.visibilityState && (
              <p className="text-[10px] text-muted-foreground/70 pt-0.5">
                {isAr ? "أكمل ملفك لتحسين ظهورك" : "Complete your profile to improve visibility"}
              </p>
            )}
          </Link>
        </RailBlock>
      )}
    </div>
  );
}

/** Lightweight titled block wrapper for rail sections */
function RailBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-0.5">
        {title}
      </h4>
      {children}
    </div>
  );
}

/** Compact key-value row for the snapshot block */
function SnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-card-foreground font-medium">{value}</span>
    </div>
  );
}

/** Compact inline notification list — replaces the heavy ActivityFeed Card in rail context */
function CompactActivityList({ activities, isAr }: { activities: Array<{ id: string; title_en: string; title_ar?: string | null; created_at: string }>; isAr: boolean }) {
  return (
    <div className="space-y-0">
      {activities.map((a) => (
        <div key={a.id} className="flex items-start gap-1.5 px-1 py-0.5 text-[11px]">
          <div className="h-1 w-1 rounded-full bg-primary/50 mt-1.5 shrink-0" />
          <span className="text-muted-foreground leading-snug line-clamp-1">
            {isAr ? (a.title_ar ?? a.title_en) : a.title_en}
          </span>
        </div>
      ))}
    </div>
  );
}
