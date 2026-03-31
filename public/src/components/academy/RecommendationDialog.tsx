/**
 * RecommendationDialog — Instructor creates a recommendation for a student.
 * Uses centralized Talent Bridge vocabulary.
 * Captures readiness_snapshot when available, and surfaces it as structured context.
 */
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Activity, BookOpen, ClipboardCheck, FolderKanban, CalendarCheck } from "lucide-react";
import {
  RECOMMENDATION_TYPES,
  RECOMMENDATION_TYPE_LABELS,
  type RecommendationType,
} from "@/features/academy/talentBridge/recommendations";
import { useCreateRecommendation } from "@/features/academy/talentBridge/hooks";
import {
  type ReadinessSignals,
  type SignalLevel,
  SIGNAL_LABELS,
} from "@/features/academy/learningModel/readiness";
import {
  TALENT_SIGNAL_LABELS,
  TALENT_SIGNAL_COLORS,
  type TalentSignal,
} from "@/features/academy/talentBridge/signals";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentUserId: string;
  studentName: string;
  courses: { id: string; title_en: string; title_ar?: string | null }[];
  /** If available, captured as readiness_snapshot on save */
  readinessSnapshot?: ReadinessSignals | null;
  /** Derived talent signal for this student */
  talentSignal?: TalentSignal | null;
}

// ── Readiness dimension config ──────────────────────────────

const DIMENSION_CONFIG: {
  key: keyof ReadinessSignals;
  icon: typeof Activity;
  en: string;
  ar: string;
}[] = [
  { key: "completion_quality", icon: BookOpen, en: "Course Completion", ar: "إكمال الدورة" },
  { key: "attendance_health", icon: CalendarCheck, en: "Attendance", ar: "الحضور" },
  { key: "assessment_readiness", icon: ClipboardCheck, en: "Assessments", ar: "التقييمات" },
  { key: "project_readiness", icon: FolderKanban, en: "Projects", ar: "المشاريع" },
];

function signalDot(level: SignalLevel): string {
  switch (level) {
    case "complete": return "bg-primary";
    case "high": return "bg-primary/70";
    case "moderate": return "bg-secondary";
    case "low": return "bg-destructive/60";
    default: return "bg-muted-foreground/30";
  }
}

export default function RecommendationDialog({
  open, onOpenChange, studentUserId, studentName, courses,
  readinessSnapshot, talentSignal,
}: Props) {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const { user } = useAuth();
  const createRec = useCreateRecommendation();

  const [recType, setRecType] = useState<RecommendationType>("instructor_recommendation");
  const [courseId, setCourseId] = useState<string>("");
  const [strength, setStrength] = useState("");
  const [evidence, setEvidence] = useState("");
  const [status, setStatus] = useState<"draft" | "active">("draft");

  const reset = () => {
    setRecType("instructor_recommendation");
    setCourseId("");
    setStrength("");
    setEvidence("");
    setStatus("draft");
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!strength.trim()) {
      toast.error(isAr ? "يرجى إضافة ملخص نقاط القوة" : "Please add a strength summary");
      return;
    }

    try {
      await createRec.mutateAsync({
        student_user_id: studentUserId,
        recommended_by: user.id,
        recommendation_type: recType,
        course_id: courseId || null,
        strength_summary: strength.trim(),
        evidence_summary: evidence.trim() || null,
        status,
        readiness_snapshot: readinessSnapshot ? (readinessSnapshot as any) : null,
      });
      toast.success(isAr ? "تم إنشاء التوصية" : "Recommendation created");
      reset();
      onOpenChange(false);
    } catch {
      toast.error(isAr ? "فشل إنشاء التوصية" : "Failed to create recommendation");
    }
  };

  const hasReadiness = readinessSnapshot && readinessSnapshot.overall_readiness_status !== "not_started";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">
            {isAr ? "توصية لـ" : "Recommend"} {studentName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">

          {/* ── Student State Context ─────────────────────────── */}
          {(hasReadiness || talentSignal) && (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5" />
                  {isAr ? "حالة الطالب الحالية" : "Current Student State"}
                </span>
                {talentSignal && talentSignal !== "not_ready_yet" && (
                  <Badge variant="secondary" className={`text-[10px] px-2 py-0 h-5 ${TALENT_SIGNAL_COLORS[talentSignal]}`}>
                    {isAr ? TALENT_SIGNAL_LABELS[talentSignal].ar : TALENT_SIGNAL_LABELS[talentSignal].en}
                  </Badge>
                )}
              </div>

              {hasReadiness && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {DIMENSION_CONFIG.map(({ key, icon: Icon, en, ar }) => {
                    const level = readinessSnapshot![key] as SignalLevel;
                    if (level === "not_started") return null;
                    return (
                      <div key={key} className="flex items-center gap-1.5 text-[11px]">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${signalDot(level)}`} />
                        <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground truncate">{isAr ? ar : en}</span>
                        <span className="font-medium ms-auto">
                          {isAr ? SIGNAL_LABELS[level].ar : SIGNAL_LABELS[level].en}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {readinessSnapshot && (
                <p className="text-[10px] text-muted-foreground/70 border-t border-border/50 pt-1.5">
                  {isAr
                    ? "سيتم حفظ لقطة الجاهزية تلقائيًا مع التوصية"
                    : "This snapshot will be captured with the recommendation"}
                </p>
              )}
            </div>
          )}

          {!hasReadiness && !talentSignal && (
            <div className="text-[11px] text-muted-foreground bg-muted/30 rounded-lg border p-3">
              {isAr
                ? "لا تتوفر بيانات جاهزية لهذا الطالب بعد. يمكنك المتابعة بتقديم التوصية."
                : "No readiness data available for this student yet. You can still proceed with the recommendation."}
            </div>
          )}

          {/* Type */}
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "نوع التوصية" : "Recommendation Type"}</Label>
            <Select value={recType} onValueChange={(v) => setRecType(v as RecommendationType)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECOMMENDATION_TYPES.map(t => (
                  <SelectItem key={t} value={t} className="text-sm">
                    {isAr ? RECOMMENDATION_TYPE_LABELS[t].ar : RECOMMENDATION_TYPE_LABELS[t].en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Course (optional) */}
          {courses.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "الدورة (اختياري)" : "Course (optional)"}</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder={isAr ? "اختر دورة" : "Select course"} />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(c => (
                    <SelectItem key={c.id} value={c.id} className="text-sm">
                      {isAr ? c.title_ar || c.title_en : c.title_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Strength Summary */}
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "ملخص نقاط القوة" : "Strength Summary"} *</Label>
            <Textarea
              value={strength}
              onChange={(e) => setStrength(e.target.value)}
              placeholder={isAr ? "ما الذي يميّز هذا الطالب؟" : "What makes this student stand out?"}
              className="text-sm min-h-[80px]"
            />
          </div>

          {/* Evidence */}
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "الأدلة الداعمة" : "Supporting Evidence"}</Label>
            <Textarea
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder={isAr ? "مشاريع، تقييمات، حضور..." : "Projects, assessments, attendance..."}
              className="text-sm min-h-[60px]"
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "الحالة" : "Save as"}</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as "draft" | "active")}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft" className="text-sm">{isAr ? "مسودة" : "Draft"}</SelectItem>
                <SelectItem value="active" className="text-sm">{isAr ? "نشط" : "Active"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={createRec.isPending}>
            {createRec.isPending
              ? (isAr ? "جاري الحفظ..." : "Saving...")
              : (isAr ? "حفظ التوصية" : "Save Recommendation")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
