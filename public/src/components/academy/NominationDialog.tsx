/**
 * NominationDialog — Instructor nominates a student for an opportunity.
 * Enforces privacy gating: blocked if student hasn't opted in.
 * Supports optional linked_job_id when jobs are available.
 */
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import {
  NOMINATION_SCOPES,
  NOMINATION_SCOPE_LABELS,
  NOMINATION_SCOPE_DESCRIPTIONS,
  type NominationScope,
} from "@/features/academy/talentBridge/nominations";
import { useCreateNomination } from "@/features/academy/talentBridge/hooks";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentUserId: string;
  studentName: string;
  allowsNomination: boolean;
  /** Talent profile visibility state — used for richer blocking messages */
  visibilityState?: string | null;
  /** Whether student has a talent profile at all */
  hasProfile?: boolean;
  courses: { id: string; title_en: string; title_ar?: string | null }[];
}

export default function NominationDialog({
  open, onOpenChange, studentUserId, studentName, allowsNomination,
  visibilityState, hasProfile, courses,
}: Props) {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const { user } = useAuth();
  const createNom = useCreateNomination();

  const [scope, setScope] = useState<NominationScope>("general_opportunity");
  const [courseId, setCourseId] = useState("");
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [linkedJobId, setLinkedJobId] = useState("");
  const [saveAs, setSaveAs] = useState<"draft" | "submitted">("draft");

  // Fetch available jobs for optional linking (role_specific / company_specific scopes)
  const showJobLink = scope === "role_specific" || scope === "company_specific";
  const { data: availableJobs = [] } = useQuery({
    queryKey: ["nomination-available-jobs"],
    enabled: open && showJobLink,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("job_postings")
        .select("id, title, location, type")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  const reset = () => {
    setScope("general_opportunity");
    setCourseId("");
    setReason("");
    setEvidence("");
    setTargetCompany("");
    setLinkedJobId("");
    setSaveAs("draft");
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!allowsNomination) return;
    if (!reason.trim()) {
      toast.error(isAr ? "يرجى إضافة سبب الترشيح" : "Please add a nomination reason");
      return;
    }

    try {
      await createNom.mutateAsync({
        student_user_id: studentUserId,
        nominated_by: user.id,
        nomination_scope: scope,
        course_id: courseId || null,
        nomination_reason: reason.trim(),
        evidence_summary: evidence.trim() || null,
        target_company_name: targetCompany.trim() || null,
        linked_job_id: linkedJobId || null,
        status: saveAs,
        submitted_at: saveAs === "submitted" ? new Date().toISOString() : null,
      });
      toast.success(isAr ? "تم إنشاء الترشيح" : "Nomination created");
      reset();
      onOpenChange(false);
    } catch {
      toast.error(isAr ? "فشل إنشاء الترشيح" : "Failed to create nomination");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">
            {isAr ? "ترشيح" : "Nominate"} {studentName}
          </DialogTitle>
        </DialogHeader>

        {/* Privacy gate — explain why nomination is blocked */}
        {!allowsNomination ? (
          <Alert variant="destructive" className="my-2">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription className="text-xs space-y-1">
              {!hasProfile ? (
                <p>
                  {isAr
                    ? "هذا الطالب لم ينشئ ملفًا مهنيًا بعد. يجب أن ينشئ ملفه ويفعّل الترشيح قبل أن تتمكن من ترشيحه."
                    : "This student has not created a talent profile yet. They must create their profile and enable nominations before you can nominate them."}
                </p>
              ) : visibilityState === "private" ? (
                <p>
                  {isAr
                    ? "ملف هذا الطالب المهني مضبوط على \"خاص\". يجب أن يغيّر حالة الظهور إلى \"الأكاديمية فقط\" أو \"مفتوح للفرص\" ويفعّل الترشيح."
                    : "This student's talent profile is set to \"Private\". They must change visibility to \"Academy Only\" or \"Open to Opportunities\" and enable nominations."}
                </p>
              ) : (
                <p>
                  {isAr
                    ? "هذا الطالب لم يفعّل خيار الترشيح في ملفه المهني. لا يمكن إنشاء ترشيح حتى يفعّله."
                    : "This student has not enabled nominations in their talent profile. Nomination is blocked until they opt in."}
                </p>
              )}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {/* Scope */}
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "نطاق الترشيح" : "Nomination Scope"}</Label>
              <Select value={scope} onValueChange={(v) => setScope(v as NominationScope)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOMINATION_SCOPES.map(s => (
                    <SelectItem key={s} value={s} className="text-sm">
                      {isAr ? NOMINATION_SCOPE_LABELS[s].ar : NOMINATION_SCOPE_LABELS[s].en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                {isAr ? NOMINATION_SCOPE_DESCRIPTIONS[scope].ar : NOMINATION_SCOPE_DESCRIPTIONS[scope].en}
              </p>
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

            {/* Target company for company_specific */}
            {scope === "company_specific" && (
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "اسم الشركة" : "Target Company"}</Label>
                <Input
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  placeholder={isAr ? "اسم الشركة المستهدفة" : "Company name"}
                  className="h-9 text-sm"
                />
              </div>
            )}

            {/* Optional job/opportunity linking */}
            {showJobLink && availableJobs.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "ربط بفرصة (اختياري)" : "Link to Opportunity (optional)"}</Label>
                <Select value={linkedJobId} onValueChange={setLinkedJobId}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder={isAr ? "اختر فرصة" : "Select opportunity"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableJobs.map(j => (
                      <SelectItem key={j.id} value={j.id} className="text-sm">
                        {j.title} {j.type ? `(${j.type})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Reason */}
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "سبب الترشيح" : "Nomination Reason"} *</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={isAr ? "لماذا ترشّح هذا الطالب؟" : "Why are you nominating this student?"}
                className="text-sm min-h-[80px]"
              />
            </div>

            {/* Evidence */}
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "الأدلة الداعمة" : "Supporting Evidence"}</Label>
              <Textarea
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                placeholder={isAr ? "مشاريع، مهارات، إنجازات..." : "Projects, skills, achievements..."}
                className="text-sm min-h-[60px]"
              />
            </div>

            {/* Save as */}
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "الحالة" : "Save as"}</Label>
              <Select value={saveAs} onValueChange={(v) => setSaveAs(v as "draft" | "submitted")}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft" className="text-sm">{isAr ? "مسودة" : "Draft"}</SelectItem>
                  <SelectItem value="submitted" className="text-sm">{isAr ? "تقديم" : "Submit"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
          {allowsNomination && (
            <Button size="sm" onClick={handleSubmit} disabled={createNom.isPending}>
              {createNom.isPending
                ? (isAr ? "جاري الحفظ..." : "Saving...")
                : (isAr ? "حفظ الترشيح" : "Save Nomination")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
