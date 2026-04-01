/**
 * InstructorHomeRail — compact right-column support layer for the Instructor homepage.
 * Consumes useInstructorHomeData() output. Context-aware: adapts blocks by homeState.
 *
 * Quick Actions block removed per LP-01A — homepage must not repeat the navbar.
 */
import { Calendar, CheckCircle2, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import type { InstructorHomeData } from "@/hooks/useInstructorHomeData";
import ActivityFeed from "@/core/components/ActivityFeed";

interface InstructorHomeRailProps {
  data: InstructorHomeData;
}

export default function InstructorHomeRail({ data }: InstructorHomeRailProps) {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const state = data.homeState;

  return (
    <div className="space-y-3">
      {/* Upcoming Sessions — only when sessions exist */}
      {data.upcomingSessions.length > 0 && (
        <RailBlock title={isAr ? "الجلسات القادمة" : "Upcoming Sessions"}>
          <div className="space-y-1">
            {data.upcomingSessions.slice(0, 3).map((s) => (
              <Link
                key={s.id}
                to={`/instructor/workspace/courses/${s.courseId}/delivery`}
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

      {/* ── Context-aware middle block ── */}
      {state === "new" && (
        <RailBlock title={isAr ? "معالمك" : "Your Milestones"}>
          <div className="space-y-1.5">
            {(isAr
              ? ["أنشئ دورة", "انشرها وشاركها", "احصل على أول طالب"]
              : ["Create a course", "Publish and share", "Get your first student"]
            ).map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                <span>{step}</span>
              </div>
            ))}
          </div>
        </RailBlock>
      )}

      {(state === "active" || state === "advanced") && (
        <RailBlock title={isAr ? "الإشعارات" : "Notifications"}>
          <ActivityFeed limit={3} />
        </RailBlock>
      )}

      {/* Experts — always visible as a support block */}
      {data.experts.length > 0 && (
        <RailBlock title={isAr ? "خبراء" : "Experts"}>
          <div className="space-y-1">
            {data.experts.slice(0, 2).map((e) => (
              <Link
                key={e.id}
                to={`/consulting/${e.slug}`}
                className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-2.5 py-1.5 text-xs hover:bg-muted/50 transition-colors"
              >
                <Users className="h-3 w-3 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-card-foreground truncate">
                    {isAr ? e.nameAr : e.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {isAr ? e.roleAr : e.role} · ${e.sessionRateUsd}
                  </p>
                </div>
              </Link>
            ))}
          </div>
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
