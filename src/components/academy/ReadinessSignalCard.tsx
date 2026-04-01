/**
 * ReadinessSignalCard — compact readiness signal display.
 * Shows computed readiness signals using canonical labels/colors.
 */
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { ReadinessSignals, SIGNAL_LABELS, SIGNAL_COLORS } from "@/features/academy/learningModel/readiness";

interface Props {
  signals: ReadinessSignals;
  compact?: boolean;
}

const DIMENSION_LABELS: Record<keyof Omit<ReadinessSignals, "overall_readiness_status">, { en: string; ar: string }> = {
  completion_quality: { en: "Completion", ar: "الإكمال" },
  attendance_health: { en: "Attendance", ar: "الحضور" },
  assessment_readiness: { en: "Assessments", ar: "التقييمات" },
  project_readiness: { en: "Projects", ar: "المشاريع" },
};

export default function ReadinessSignalCard({ signals, compact }: Props) {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const dimensions = (Object.keys(DIMENSION_LABELS) as (keyof typeof DIMENSION_LABELS)[])
    .filter(k => signals[k] !== "not_started");

  if (dimensions.length === 0 && signals.overall_readiness_status === "not_started") return null;

  if (compact) {
    return (
      <Badge variant="outline" className={`text-[10px] ${SIGNAL_COLORS[signals.overall_readiness_status]}`}>
        {isAr ? SIGNAL_LABELS[signals.overall_readiness_status].ar : SIGNAL_LABELS[signals.overall_readiness_status].en}
      </Badge>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-xs font-medium">
        <span>{isAr ? "جاهزية التعلم" : "Learning Readiness"}</span>
        <Badge variant="outline" className={`text-[10px] ${SIGNAL_COLORS[signals.overall_readiness_status]}`}>
          {isAr ? SIGNAL_LABELS[signals.overall_readiness_status].ar : SIGNAL_LABELS[signals.overall_readiness_status].en}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {dimensions.map(dim => (
          <div key={dim} className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">{isAr ? DIMENSION_LABELS[dim].ar : DIMENSION_LABELS[dim].en}:</span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${SIGNAL_COLORS[signals[dim]]}`}>
              {isAr ? SIGNAL_LABELS[signals[dim]].ar : SIGNAL_LABELS[signals[dim]].en}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
