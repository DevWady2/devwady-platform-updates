/**
 * InviteAssistantDialog — Instructor invites a freelancer in the same
 * specialization to act as a Technical Assistant for a specific course.
 *
 * Entry points: Assistant Oversight page, course owner page.
 */
import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserPlus, Send } from "lucide-react";
import { toast } from "sonner";
import {
  MOCK_INSTRUCTOR_COURSES,
  MOCK_INSTRUCTOR_FREELANCER_CANDIDATES,
} from "@/data/mockData";

import FreelancerPicker from "./invite-assistant/FreelancerPicker";
import InvitationForm from "./invite-assistant/InvitationForm";
import ExistingStateNotice from "./invite-assistant/ExistingStateNotice";

/* ── Constants ── */

const DURATION_OPTIONS = [
  { value: "1_month", label_en: "1 Month", label_ar: "شهر واحد" },
  { value: "3_months", label_en: "3 Months", label_ar: "3 أشهر" },
  { value: "6_months", label_en: "6 Months", label_ar: "6 أشهر" },
  { value: "course_duration", label_en: "Full Course Duration", label_ar: "مدة الدورة كاملة" },
];

const COMPENSATION_OPTIONS = [
  { value: "volunteer", label_en: "Volunteer", label_ar: "تطوعي" },
  { value: "revenue_share", label_en: "Revenue Share", label_ar: "مشاركة الإيرادات" },
  { value: "fixed_fee", label_en: "Fixed Fee", label_ar: "أجر ثابت" },
  { value: "per_session", label_en: "Per Session", label_ar: "لكل جلسة" },
];

export { DURATION_OPTIONS, COMPENSATION_OPTIONS };

/* ── Types ── */

export interface ExistingInvitation {
  id: string;
  status: string;
  course_id: string | null;
  freelancer_id: string;
}

/**
 * Determine invitation state for a freelancer+course pair from existing records.
 * Returns the blocking record or null if a new invite is allowed.
 */
export function getExistingInvitationState(
  existingInvitations: ExistingInvitation[],
  freelancerId: string,
  courseId: string
): { status: "pending" | "accepted" | "declined"; record: ExistingInvitation } | null {
  const matching = existingInvitations.filter(
    (inv) => inv.freelancer_id === freelancerId && inv.course_id === courseId
  );
  // Priority: accepted > pending > declined
  const accepted = matching.find((r) => r.status === "accepted");
  if (accepted) return { status: "accepted", record: accepted };
  const pending = matching.find((r) => r.status === "pending");
  if (pending) return { status: "pending", record: pending };
  const declined = matching.find((r) => r.status === "declined");
  if (declined) return { status: "declined", record: declined };
  return null;
}

/* ── Props ── */

interface InviteAssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedCourseId?: string;
  isSampleContext?: boolean;
}

export default function InviteAssistantDialog({
  open,
  onOpenChange,
  preselectedCourseId,
  isSampleContext = false,
}: InviteAssistantDialogProps) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const isAr = lang === "ar";

  const [search, setSearch] = useState("");
  const [selectedFreelancer, setSelectedFreelancer] = useState<any | null>(null);
  const [courseId, setCourseId] = useState(preselectedCourseId ?? "");
  const [supportScope, setSupportScope] = useState("");
  const [duration, setDuration] = useState("");
  const [compensation, setCompensation] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (preselectedCourseId) setCourseId(preselectedCourseId);
  }, [preselectedCourseId]);

  /* ── Instructor profile track ── */
  const { data: profile } = useQuery({
    queryKey: ["invite-assistant-profile", user?.id],
    enabled: !!user && open,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("track, skills")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const track = profile?.track ?? "Android";

  /* ── Instructor's courses ── */
  const { data: courses = [] } = useQuery({
    queryKey: ["invite-assistant-courses", user?.id],
    enabled: !!user && open,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_courses")
        .select("id, title_en, title_ar")
        .eq("instructor_id", user!.id)
        .eq("status", "published");
      // Never mask real query errors with sample data
      if (error) throw error;
      if (data && data.length > 0) return data;
      if (isSampleContext) return MOCK_INSTRUCTOR_COURSES.map((c) => ({ id: c.id, title_en: c.title_en, title_ar: c.title_ar }));
      return [];
    },
  });

  /* ── Freelancers in same specialization ── */
  const { data: freelancers = [] } = useQuery({
    queryKey: ["invite-assistant-freelancers", track],
    enabled: !!user && open,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_profiles_browse" as any);
      // Never mask real query errors with sample data
      if (error) throw error;
      const filtered = ((data as any[]) ?? [])
        .filter((p: any) => p.is_available === true && p.user_id !== user!.id && p.track && p.track.toLowerCase().includes(track.toLowerCase()))
        .slice(0, 20);
      if (filtered.length > 0) return filtered;
      if (isSampleContext) return MOCK_INSTRUCTOR_FREELANCER_CANDIDATES;
      return [];
    },
  });

  /* ── Existing invitations for this instructor ── */
  const { data: existingInvitations = [] } = useQuery({
    queryKey: ["invite-assistant-existing", user?.id],
    enabled: !!user && open,
    staleTime: 30_000,
    queryFn: async () => {
      if (isSampleContext) return [] as ExistingInvitation[];
      const { data, error } = await supabase
        .from("assistant_invitations")
        .select("id, status, course_id, freelancer_id")
        .eq("instructor_id", user!.id)
        .in("status", ["pending", "accepted", "declined"]);
      if (error) throw error;
      return (data ?? []) as ExistingInvitation[];
    },
  });

  const filteredFreelancers = search
    ? freelancers.filter((f: any) =>
        f.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        f.skills?.some((s: string) => s.toLowerCase().includes(search.toLowerCase()))
      )
    : freelancers;

  /* ── Existing state for current selection ── */
  const existingState = useMemo(() => {
    if (!selectedFreelancer || !courseId) return null;
    return getExistingInvitationState(
      existingInvitations,
      selectedFreelancer.user_id,
      courseId
    );
  }, [existingInvitations, selectedFreelancer, courseId]);

  const isBlocked = existingState?.status === "pending" || existingState?.status === "accepted";
  const isDeclinedRetry = existingState?.status === "declined";

  const handleSend = async () => {
    if (!selectedFreelancer || !courseId || isBlocked) return;
    setSending(true);

    if (isSampleContext) {
      await new Promise((r) => setTimeout(r, 600));
      toast.success(
        isAr
          ? `تم إرسال الدعوة إلى ${selectedFreelancer.full_name}`
          : `Invitation sent to ${selectedFreelancer.full_name}`
      );
      resetForm();
      onOpenChange(false);
      setSending(false);
      return;
    }

    const { error } = await supabase.from("assistant_invitations").insert({
      instructor_id: user!.id,
      freelancer_id: selectedFreelancer.user_id,
      course_id: courseId,
      support_scope: supportScope || null,
      duration: duration || null,
      compensation_type: compensation || null,
      message: message || null,
    });

    setSending(false);

    if (error) {
      // Catch unique constraint violation for duplicates
      if (error.code === "23505") {
        toast.error(
          isAr
            ? "توجد دعوة فعّالة بالفعل لهذا المستقل في هذه الدورة"
            : "An active invitation already exists for this freelancer on this course"
        );
      } else {
        toast.error(isAr ? "حدث خطأ أثناء الإرسال" : "Failed to send invitation");
      }
      return;
    }

    toast.success(
      isAr
        ? `تم إرسال الدعوة إلى ${selectedFreelancer.full_name}`
        : `Invitation sent to ${selectedFreelancer.full_name}`
    );
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setSearch("");
    setSelectedFreelancer(null);
    setCourseId(preselectedCourseId ?? "");
    setSupportScope("");
    setDuration("");
    setCompensation("");
    setMessage("");
  };

  const selectedCourse = courses.find((c: any) => c.id === courseId);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-4 w-4 text-primary" />
            {isAr ? "دعوة مساعد تقني" : "Invite Technical Assistant"}
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {isAr
              ? `اختر مستقلاً في تخصص ${track} لدعم طلابك`
              : `Select a freelancer in ${track} to support your students`}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!selectedFreelancer ? (
            <FreelancerPicker
              search={search}
              onSearchChange={setSearch}
              freelancers={filteredFreelancers}
              onSelect={setSelectedFreelancer}
              isAr={isAr}
            />
          ) : (
            <>
              {/* Selected freelancer chip */}
              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-primary/20 bg-primary/5">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {selectedFreelancer.full_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{selectedFreelancer.full_name}</p>
                  <p className="text-[10px] text-muted-foreground">{track}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] px-2"
                  onClick={() => setSelectedFreelancer(null)}
                >
                  {isAr ? "تغيير" : "Change"}
                </Button>
              </div>

              {/* Existing state notice */}
              {existingState && (
                <ExistingStateNotice status={existingState.status} isAr={isAr} />
              )}

              <InvitationForm
                courses={courses}
                courseId={courseId}
                onCourseChange={setCourseId}
                selectedCourse={selectedCourse}
                supportScope={supportScope}
                onSupportScopeChange={setSupportScope}
                duration={duration}
                onDurationChange={setDuration}
                compensation={compensation}
                onCompensationChange={setCompensation}
                message={message}
                onMessageChange={setMessage}
                isAr={isAr}
                durationOptions={DURATION_OPTIONS}
                compensationOptions={COMPENSATION_OPTIONS}
              />
            </>
          )}
        </div>

        {selectedFreelancer && (
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { resetForm(); onOpenChange(false); }}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              size="sm"
              disabled={!courseId || sending || isBlocked}
              onClick={handleSend}
            >
              <Send className="h-3.5 w-3.5" />
              {sending
                ? isAr ? "جارٍ الإرسال..." : "Sending..."
                : isDeclinedRetry
                  ? isAr ? "إعادة الدعوة" : "Re-invite"
                  : isAr ? "إرسال الدعوة" : "Send Invitation"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
