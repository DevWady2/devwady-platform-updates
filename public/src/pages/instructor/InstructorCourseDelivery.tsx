/**
 * Instructor Workspace — Course Delivery Management
 * ──────────────────────────────────────────────────
 * Route: /instructor/workspace/courses/:id/delivery
 *
 * Tabbed management for cohorts, sessions, attendance, and reviews.
 */
import { useState, useEffect } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCourseCohorts, useCourseSessions, useCohortMembershipCounts, useAttendanceRoster } from "@/portals/academy/hooks/useCourseDelivery";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ConfirmDeleteDialog from "@/components/admin/ConfirmDeleteDialog";
import {
  ArrowLeft, Loader2, Plus, Pencil, Trash2,
  Users, Calendar, ClipboardCheck, Star,
} from "lucide-react";
import { toast } from "sonner";

type DeliveryTab = "cohorts" | "sessions" | "attendance" | "reviews";

// ── Cohort Form ─────────────────────────────────────────────
interface CohortForm {
  title: string; code: string; description: string; status: string;
  start_date: string; end_date: string; capacity: number | null; enrollment_open: boolean;
}
const emptyCohort: CohortForm = {
  title: "", code: "", description: "", status: "draft",
  start_date: "", end_date: "", capacity: null, enrollment_open: false,
};

// ── Session Form ────────────────────────────────────────────
interface SessionForm {
  title: string; description: string; session_type: string;
  start_at: string; end_at: string; meeting_url: string;
  cohort_id: string; attendance_required: boolean; is_published: boolean;
}
const emptySession: SessionForm = {
  title: "", description: "", session_type: "live_class",
  start_at: "", end_at: "", meeting_url: "",
  cohort_id: "", attendance_required: false, is_published: true,
};

const SESSION_TYPES = [
  { value: "live_class", en: "Live Class", ar: "فصل مباشر" },
  { value: "office_hours", en: "Office Hours", ar: "ساعات مكتبية" },
  { value: "review", en: "Review", ar: "مراجعة" },
  { value: "demo", en: "Demo", ar: "عرض" },
  { value: "workshop", en: "Workshop", ar: "ورشة عمل" },
  { value: "other", en: "Other", ar: "أخرى" },
];
const COHORT_STATUSES = [
  { value: "draft", en: "Draft", ar: "مسودة" },
  { value: "active", en: "Active", ar: "نشط" },
  { value: "completed", en: "Completed", ar: "مكتمل" },
  { value: "cancelled", en: "Cancelled", ar: "ملغي" },
];

export default function InstructorCourseDelivery() {
  const { user, role } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const { id: courseId } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const [tab, setTab] = useState<DeliveryTab>("cohorts");

  // ── Course fetch ──
  const { data: course, isLoading } = useQuery({
    queryKey: ["instructor-delivery-course", courseId],
    enabled: !!courseId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_courses")
        .select("id, title_en, title_ar, learning_product_type")
        .eq("id", courseId!)
        .eq("instructor_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // ── Cohorts ──
  const { data: cohorts = [], isLoading: cohortsLoading } = useCourseCohorts(courseId);
  const cohortIds = cohorts.map((c: any) => c.id);
  const { data: cohortCounts = {} } = useCohortMembershipCounts(cohortIds);
  const [cohortDialog, setCohortDialog] = useState(false);
  const [editingCohortId, setEditingCohortId] = useState<string | null>(null);
  const [cohortForm, setCohortForm] = useState<CohortForm>({ ...emptyCohort });
  const [savingCohort, setSavingCohort] = useState(false);
  const [deleteCohortId, setDeleteCohortId] = useState<string | null>(null);

  // ── Sessions ──
  const [sessionCohortFilter, setSessionCohortFilter] = useState<string>("__all__");
  const { data: sessions = [], isLoading: sessionsLoading } = useCourseSessions(courseId, sessionCohortFilter === "__all__" ? undefined : sessionCohortFilter);
  const [sessionDialog, setSessionDialog] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [sessionForm, setSessionForm] = useState<SessionForm>({ ...emptySession });
  const [savingSession, setSavingSession] = useState(false);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);

  // ── Attendance ──
  // Use ALL sessions (unfiltered) so attendance selector isn't affected by sessions-tab cohort filter
  const { data: allSessions = [] } = useCourseSessions(courseId);
  const [attendanceSessionId, setAttendanceSessionId] = useState<string>("__none__");
  const activeSessionId = attendanceSessionId === "__none__" ? undefined : attendanceSessionId;
  const selectedSession = allSessions.find((s: any) => s.id === activeSessionId);
  const { data: roster = [], isLoading: rosterLoading } = useAttendanceRoster(
    activeSessionId,
    courseId,
    selectedSession?.cohort_id ?? null,
  );

  // Optimistic local attendance state — seeded from roster, updated on mark
  const [localAttendance, setLocalAttendance] = useState<Record<string, string>>({});
  const [savingAttendanceFor, setSavingAttendanceFor] = useState<string | null>(null);

  // Sync local state when roster data changes (new session selected or refetch)
  useEffect(() => {
    const map: Record<string, string> = {};
    for (const r of roster) map[r.user_id] = r.attendance_status;
    setLocalAttendance(map);
  }, [roster]);

  // ── Reviews ──
  const { data: pendingAttempts = [], isLoading: attemptsLoading } = useQuery({
    queryKey: ["pending-attempts", courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessment_attempts")
        .select("*, course_assessments!inner(course_id, title_en, title_ar, assessment_type, passing_score)")
        .eq("course_assessments.course_id", courseId!)
        .eq("status", "submitted")
        .order("submitted_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: pendingSubmissions = [], isLoading: submissionsLoading } = useQuery({
    queryKey: ["pending-submissions", courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_submissions")
        .select("*, course_projects!inner(course_id, title_en, title_ar, is_capstone, submission_type)")
        .eq("course_projects.course_id", courseId!)
        .eq("submission_status", "submitted")
        .order("submitted_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch student profiles for review items (via relationship-scoped RPC)
  const { data: reviewProfiles = [] } = useQuery({
    queryKey: ["review-profiles", courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data } = await supabase.rpc("get_course_student_profiles", {
        p_course_ids: [courseId!],
      });
      return (data ?? []) as { user_id: string; full_name: string | null; avatar_url: string | null }[];
    },
  });
  const reviewProfileMap = new Map(reviewProfiles.map((p: any) => [p.user_id, p.full_name]));

  const [reviewDialog, setReviewDialog] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ type: "attempt" | "submission"; id: string; title: string } | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewScore, setReviewScore] = useState("");
  const [reviewAction, setReviewAction] = useState<string>("reviewed");
  const [savingReview, setSavingReview] = useState(false);

  // ── Cohort CRUD ───────────────────────────────────────────
  const openCohortCreate = () => { setCohortForm({ ...emptyCohort }); setEditingCohortId(null); setCohortDialog(true); };
  const openCohortEdit = (c: any) => {
    setCohortForm({
      title: c.title, code: c.code || "", description: c.description || "",
      status: c.status, start_date: c.start_date || "", end_date: c.end_date || "",
      capacity: c.capacity, enrollment_open: c.enrollment_open,
    });
    setEditingCohortId(c.id);
    setCohortDialog(true);
  };
  const saveCohort = async () => {
    if (!cohortForm.title.trim()) { toast.error(isAr ? "العنوان مطلوب" : "Title is required"); return; }
    setSavingCohort(true);
    try {
      const payload = {
        course_id: courseId!, title: cohortForm.title, code: cohortForm.code || null,
        description: cohortForm.description || null, status: cohortForm.status,
        start_date: cohortForm.start_date || null, end_date: cohortForm.end_date || null,
        capacity: cohortForm.capacity, enrollment_open: cohortForm.enrollment_open,
        created_by: user!.id,
      };
      if (editingCohortId) {
        const { error } = await supabase.from("course_cohorts").update(payload).eq("id", editingCohortId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("course_cohorts").insert(payload);
        if (error) throw error;
      }
      toast.success(isAr ? "تم الحفظ" : "Saved");
      setCohortDialog(false);
      qc.invalidateQueries({ queryKey: ["course-cohorts", courseId] });
    } catch (e: any) { toast.error(e.message); }
    finally { setSavingCohort(false); }
  };
  const deleteCohort = async () => {
    if (!deleteCohortId) return;
    const { error } = await supabase.from("course_cohorts").delete().eq("id", deleteCohortId);
    if (error) toast.error(error.message); else toast.success(isAr ? "تم الحذف" : "Deleted");
    setDeleteCohortId(null);
    qc.invalidateQueries({ queryKey: ["course-cohorts", courseId] });
  };

  // ── Session CRUD ──────────────────────────────────────────
  const openSessionCreate = () => { setSessionForm({ ...emptySession }); setEditingSessionId(null); setSessionDialog(true); };
  const openSessionEdit = (s: any) => {
    setSessionForm({
      title: s.title, description: s.description || "", session_type: s.session_type,
      start_at: s.start_at?.slice(0, 16) || "", end_at: s.end_at?.slice(0, 16) || "",
      meeting_url: s.meeting_url || "", cohort_id: s.cohort_id || "",
      attendance_required: s.attendance_required, is_published: s.is_published,
    });
    setEditingSessionId(s.id);
    setSessionDialog(true);
  };
  const saveSession = async () => {
    if (!sessionForm.title.trim() || !sessionForm.start_at || !sessionForm.end_at) {
      toast.error(isAr ? "العنوان والوقت مطلوبان" : "Title and times are required"); return;
    }
    setSavingSession(true);
    try {
      const payload = {
        course_id: courseId!, title: sessionForm.title, description: sessionForm.description || null,
        session_type: sessionForm.session_type, start_at: sessionForm.start_at,
        end_at: sessionForm.end_at, meeting_url: sessionForm.meeting_url || null,
        cohort_id: sessionForm.cohort_id || null, attendance_required: sessionForm.attendance_required,
        is_published: sessionForm.is_published, created_by: user!.id,
      };
      if (editingSessionId) {
        const { error } = await supabase.from("course_sessions").update(payload).eq("id", editingSessionId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("course_sessions").insert(payload);
        if (error) throw error;
      }
      toast.success(isAr ? "تم الحفظ" : "Saved");
      setSessionDialog(false);
      qc.invalidateQueries({ queryKey: ["course-sessions", courseId] });
    } catch (e: any) { toast.error(e.message); }
    finally { setSavingSession(false); }
  };
  const deleteSession = async () => {
    if (!deleteSessionId) return;
    const { error } = await supabase.from("course_sessions").delete().eq("id", deleteSessionId);
    if (error) toast.error(error.message); else toast.success(isAr ? "تم الحذف" : "Deleted");
    setDeleteSessionId(null);
    qc.invalidateQueries({ queryKey: ["course-sessions", courseId] });
  };

  // ── Attendance Mark ───────────────────────────────────────
  const markAttendance = async (userId: string, status: string) => {
    if (!activeSessionId) return;
    // Optimistic update
    setLocalAttendance(prev => ({ ...prev, [userId]: status }));
    setSavingAttendanceFor(userId);
    try {
      const { error } = await supabase
        .from("session_attendance")
        .upsert(
          { session_id: activeSessionId, user_id: userId, attendance_status: status, marked_by: user!.id, marked_at: new Date().toISOString() },
          { onConflict: "session_id,user_id" }
        );
      if (error) {
        // Revert optimistic update
        const original = roster.find(r => r.user_id === userId);
        setLocalAttendance(prev => ({ ...prev, [userId]: original?.attendance_status ?? "pending" }));
        toast.error(error.message);
      } else {
        toast.success(isAr ? "تم التحديث" : "Updated");
        // Background refetch to sync has_record flags
        qc.invalidateQueries({ queryKey: ["attendance-roster"] });
        qc.invalidateQueries({ queryKey: ["session-attendance"] });
      }
    } catch (e: any) {
      const original = roster.find(r => r.user_id === userId);
      setLocalAttendance(prev => ({ ...prev, [userId]: original?.attendance_status ?? "pending" }));
      toast.error(e.message);
    } finally {
      setSavingAttendanceFor(null);
    }
  };

  // ── Review Action ─────────────────────────────────────────
  const openReview = (type: "attempt" | "submission", id: string, title: string) => {
    setReviewTarget({ type, id, title });
    setReviewFeedback(""); setReviewScore(""); setReviewAction(type === "attempt" ? "passed" : "approved");
    setReviewDialog(true);
  };
  const submitReview = async () => {
    if (!reviewTarget) return;
    setSavingReview(true);
    try {
      if (reviewTarget.type === "attempt") {
        const { error } = await supabase.from("assessment_attempts").update({
          status: reviewAction, score: reviewScore ? Number(reviewScore) : null,
          feedback: reviewFeedback || null, reviewed_at: new Date().toISOString(), reviewed_by: user!.id,
        }).eq("id", reviewTarget.id);
        if (error) throw error;
        qc.invalidateQueries({ queryKey: ["pending-attempts", courseId] });
      } else {
        // Update submission status
        const { error: subErr } = await supabase.from("project_submissions").update({
          submission_status: reviewAction,
        }).eq("id", reviewTarget.id);
        if (subErr) throw subErr;
        // Create review record
        const { error: revErr } = await supabase.from("project_reviews").insert({
          submission_id: reviewTarget.id, reviewer_id: user!.id,
          review_status: reviewAction, score: reviewScore ? Number(reviewScore) : null,
          feedback: reviewFeedback || null, reviewed_at: new Date().toISOString(),
        });
        if (revErr) throw revErr;
        qc.invalidateQueries({ queryKey: ["pending-submissions", courseId] });
      }
      toast.success(isAr ? "تمت المراجعة" : "Review submitted");
      setReviewDialog(false);
    } catch (e: any) { toast.error(e.message); }
    finally { setSavingReview(false); }
  };

  if (role !== "instructor" && role !== "admin") return <Navigate to="/" replace />;
  if (isLoading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!course) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
      <p className="text-muted-foreground">{isAr ? "الدورة غير موجودة" : "Course not found"}</p>
      <Button variant="outline" asChild><Link to="/instructor/workspace"><ArrowLeft className="icon-flip-rtl h-4 w-4 me-1" />{isAr ? "العودة" : "Back"}</Link></Button>
    </div>
  );

  const totalReviews = pendingAttempts.length + pendingSubmissions.length;

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4" dir={isAr ? "rtl" : "ltr"}>
      <SEO title={isAr ? "إدارة التسليم" : "Delivery Management"} />

      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/instructor/workspace/courses/${courseId}/edit`}><ArrowLeft className="icon-flip-rtl h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">{isAr ? "إدارة التسليم" : "Delivery"}</h1>
        <Badge variant="secondary">{isAr ? course.title_ar || course.title_en : course.title_en}</Badge>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as DeliveryTab)}>
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 mb-6">
          <TabsTrigger value="cohorts" className="gap-1"><Users className="h-4 w-4 sm:me-1 shrink-0" /><span className="hidden sm:inline">{isAr ? "الأفواج" : "Cohorts"}</span><span className="sm:hidden text-xs">{isAr ? "أفواج" : "Cohorts"}</span></TabsTrigger>
          <TabsTrigger value="sessions" className="gap-1"><Calendar className="h-4 w-4 sm:me-1 shrink-0" /><span className="hidden sm:inline">{isAr ? "الجلسات" : "Sessions"}</span><span className="sm:hidden text-xs">{isAr ? "جلسات" : "Sessions"}</span></TabsTrigger>
          <TabsTrigger value="attendance" className="gap-1"><ClipboardCheck className="h-4 w-4 sm:me-1 shrink-0" /><span className="hidden sm:inline">{isAr ? "الحضور" : "Attendance"}</span><span className="sm:hidden text-xs">{isAr ? "حضور" : "Attend."}</span></TabsTrigger>
          <TabsTrigger value="reviews" className="relative gap-1">
            <Star className="h-4 w-4 sm:me-1 shrink-0" /><span className="hidden sm:inline">{isAr ? "المراجعات" : "Reviews"}</span><span className="sm:hidden text-xs">{isAr ? "مراجعة" : "Reviews"}</span>
            {totalReviews > 0 && <span className="ms-1 inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-destructive text-destructive-foreground text-xs">{totalReviews}</span>}
          </TabsTrigger>
        </TabsList>

        {/* ── COHORTS ────────────────────────────────────────── */}
        <TabsContent value="cohorts" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={openCohortCreate}><Plus className="h-4 w-4 me-1" />{isAr ? "فوج جديد" : "New Cohort"}</Button>
          </div>
          {cohortsLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /> : cohorts.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">{isAr ? "لا توجد أفواج" : "No cohorts yet"}</p>
          ) : (
            <div className="space-y-3">
              {cohorts.map((c: any) => {
                const counts = cohortCounts[c.id];
                const active = counts?.active ?? 0;
                const total = counts?.total ?? 0;
                return (
                <div key={c.id} className="flex flex-wrap items-center gap-3 border rounded-lg p-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{c.title}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                      {c.code && <span className="font-mono text-xs">{c.code}</span>}
                      {(c.start_date || c.end_date) && (
                        <span>{c.start_date || "?"} — {c.end_date || "?"}</span>
                      )}
                      {c.capacity != null && (
                        <span className="text-xs">{isAr ? "السعة" : "Cap"}: {c.capacity}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 tabular-nums">
                    <Users className="h-3.5 w-3.5" />
                    <span className={active > 0 ? "text-foreground font-medium" : ""}>{active}</span>
                    <span>/</span>
                    <span>{total}</span>
                    <span className="hidden sm:inline ms-0.5">{isAr ? "عضو" : "members"}</span>
                  </span>
                  <Badge variant={c.status === "active" ? "default" : "secondary"}>{COHORT_STATUSES.find(s => s.value === c.status)?.[isAr ? "ar" : "en"] || c.status}</Badge>
                  {c.enrollment_open && <Badge variant="outline" className="text-xs">{isAr ? "مفتوح" : "Open"}</Badge>}
                  <Button variant="ghost" size="icon" onClick={() => openCohortEdit(c)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteCohortId(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── SESSIONS ───────────────────────────────────────── */}
        <TabsContent value="sessions" className="space-y-4">
          <div className="flex items-center gap-3 justify-between">
            <Select value={sessionCohortFilter} onValueChange={setSessionCohortFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder={isAr ? "كل الأفواج" : "All cohorts"} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{isAr ? "الكل" : "All"}</SelectItem>
                {cohorts.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={openSessionCreate}><Plus className="h-4 w-4 me-1" />{isAr ? "جلسة جديدة" : "New Session"}</Button>
          </div>
          {sessionsLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /> : sessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">{isAr ? "لا توجد جلسات" : "No sessions yet"}</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((s: any) => {
                const cohortName = s.cohort_id ? cohorts.find((c: any) => c.id === s.cohort_id)?.title : null;
                const isCourseWide = !s.cohort_id;
                return (
                <div key={s.id} className="flex flex-wrap items-center gap-3 border rounded-lg p-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{s.title}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
                      <span>{SESSION_TYPES.find(t => t.value === s.session_type)?.[isAr ? "ar" : "en"] || s.session_type}</span>
                      <span>·</span>
                      <span>{new Date(s.start_at).toLocaleDateString()} {new Date(s.start_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}–{new Date(s.end_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                  {isCourseWide ? (
                    <Badge variant="outline" className="text-[10px]">{isAr ? "كل الدورة" : "Course-wide"}</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">{cohortName || (isAr ? "فوج" : "Cohort")}</Badge>
                  )}
                  {s.attendance_required && <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">{isAr ? "حضور مطلوب" : "Required"}</Badge>}
                  {!s.is_published && <Badge variant="secondary" className="text-[10px]">{isAr ? "مسودة" : "Draft"}</Badge>}
                  {s.meeting_url && <a href={s.meeting_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">{isAr ? "رابط" : "Link"}</a>}
                  <Button variant="ghost" size="icon" onClick={() => openSessionEdit(s)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteSessionId(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── ATTENDANCE ─────────────────────────────────────── */}
        <TabsContent value="attendance" className="space-y-4">
          <Select value={attendanceSessionId} onValueChange={setAttendanceSessionId}>
            <SelectTrigger className="w-full max-w-sm"><SelectValue placeholder={isAr ? "اختر جلسة" : "Select a session"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">{isAr ? "— اختر —" : "— Select —"}</SelectItem>
              {allSessions.map((s: any) => {
                const cohortName = s.cohort_id ? cohorts.find((c: any) => c.id === s.cohort_id)?.title : null;
                const scope = cohortName ? ` [${cohortName}]` : ` [${isAr ? "كل الدورة" : "Course-wide"}]`;
                return <SelectItem key={s.id} value={s.id}>{s.title} — {new Date(s.start_at).toLocaleDateString()}{scope}</SelectItem>;
              })}
            </SelectContent>
          </Select>
          {activeSessionId && selectedSession?.cohort_id && (
            <p className="text-xs text-muted-foreground">
              {isAr ? "القائمة من أعضاء الفوج" : "Roster from cohort members"}: <span className="font-medium">{cohorts.find((c: any) => c.id === selectedSession.cohort_id)?.title}</span>
            </p>
          )}
          {activeSessionId && !selectedSession?.cohort_id && (
            <p className="text-xs text-muted-foreground">
              {isAr ? "القائمة من المسجلين النشطين" : "Roster from active enrollments (course-wide)"}
            </p>
          )}
          {!activeSessionId ? (
            <p className="text-center text-muted-foreground py-12">{isAr ? "اختر جلسة لعرض الحضور" : "Select a session to view attendance"}</p>
          ) : rosterLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /> : roster.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">{isAr ? "لا يوجد طلاب في القائمة" : "No learners in roster"}</p>
          ) : (
            <div className="space-y-2">
              {roster.map((r) => {
                const currentStatus = localAttendance[r.user_id] ?? r.attendance_status;
                const isSaving = savingAttendanceFor === r.user_id;
                return (
                <div key={r.user_id} className="flex items-center gap-3 border rounded-lg p-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">
                      {r.full_name || (isAr ? "متعلم" : "Learner")}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">{r.user_id.slice(0, 8)}…</span>
                  </div>
                  <Select value={currentStatus} onValueChange={(v) => markAttendance(r.user_id, v)} disabled={isSaving}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{isAr ? "معلق" : "Pending"}</SelectItem>
                      <SelectItem value="present">{isAr ? "حاضر" : "Present"}</SelectItem>
                      <SelectItem value="absent">{isAr ? "غائب" : "Absent"}</SelectItem>
                      <SelectItem value="late">{isAr ? "متأخر" : "Late"}</SelectItem>
                      <SelectItem value="excused">{isAr ? "معذور" : "Excused"}</SelectItem>
                    </SelectContent>
                  </Select>
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── REVIEWS ────────────────────────────────────────── */}
        <TabsContent value="reviews" className="space-y-6">
          {(attemptsLoading || submissionsLoading) && <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />}

          {!attemptsLoading && !submissionsLoading && pendingAttempts.length === 0 && pendingSubmissions.length === 0 && (
            <div className="text-center py-12">
              <ClipboardCheck className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">{isAr ? "لا توجد عناصر بحاجة للمراجعة" : "No items awaiting review"}</p>
            </div>
          )}

          {/* Assessment Attempts */}
          {pendingAttempts.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                {isAr ? "محاولات التقييم المعلقة" : "Pending Assessment Attempts"}
                <Badge variant="secondary" className="text-xs">{pendingAttempts.length}</Badge>
              </h3>
              <div className="space-y-2">
                {pendingAttempts.map((a: any) => {
                  const studentName = reviewProfileMap.get(a.user_id) || (isAr ? "متعلم" : "Learner");
                  const assessmentTitle = isAr ? (a.course_assessments?.title_ar || a.course_assessments?.title_en) : a.course_assessments?.title_en;
                  const passingScore = a.course_assessments?.passing_score;
                  return (
                    <div key={a.id} className="flex flex-wrap items-center gap-3 border rounded-lg p-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{assessmentTitle}</p>
                        <p className="text-xs text-muted-foreground">
                          {studentName} · {isAr ? "المحاولة" : "Attempt"} #{a.attempt_number}
                          {passingScore != null && <> · {isAr ? "درجة النجاح" : "Pass"}: {passingScore}%</>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isAr ? "أُرسل" : "Submitted"}: {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : "—"}
                        </p>
                      </div>
                      <Badge variant="secondary">{isAr ? "بانتظار المراجعة" : "Awaiting Review"}</Badge>
                      <Button size="sm" onClick={() => openReview("attempt", a.id, assessmentTitle || "Attempt")}>
                        {isAr ? "مراجعة" : "Review"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Project Submissions */}
          {pendingSubmissions.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                {isAr ? "مشاريع معلقة" : "Pending Project Submissions"}
                <Badge variant="secondary" className="text-xs">{pendingSubmissions.length}</Badge>
              </h3>
              <div className="space-y-2">
                {pendingSubmissions.map((s: any) => {
                  const studentName = reviewProfileMap.get(s.user_id) || (isAr ? "متعلم" : "Learner");
                  const projectTitle = isAr ? (s.course_projects?.title_ar || s.course_projects?.title_en) : s.course_projects?.title_en;
                  const isCapstone = s.course_projects?.is_capstone;
                  return (
                    <div key={s.id} className="flex flex-wrap items-center gap-3 border rounded-lg p-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{projectTitle}</p>
                          {isCapstone && <Badge variant="default" className="text-[10px] px-1.5 py-0">{isAr ? "مشروع نهائي" : "Capstone"}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {studentName} · {s.course_projects?.submission_type || "file"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isAr ? "أُرسل" : "Submitted"}: {s.submitted_at ? new Date(s.submitted_at).toLocaleDateString() : "—"}
                        </p>
                      </div>
                      {s.submission_url && (
                        <a href={s.submission_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline shrink-0">
                          {isAr ? "رابط العمل" : "View Work"}
                        </a>
                      )}
                      <Badge variant="secondary">{isAr ? "بانتظار المراجعة" : "Awaiting Review"}</Badge>
                      <Button size="sm" onClick={() => openReview("submission", s.id, projectTitle || "Submission")}>
                        {isAr ? "مراجعة" : "Review"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Cohort Dialog ──────────────────────────────────── */}
      <Dialog open={cohortDialog} onOpenChange={setCohortDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingCohortId ? (isAr ? "تعديل الفوج" : "Edit Cohort") : (isAr ? "فوج جديد" : "New Cohort")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{isAr ? "العنوان" : "Title"}</Label><Input value={cohortForm.title} onChange={(e) => setCohortForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>{isAr ? "الرمز" : "Code"}</Label><Input value={cohortForm.code} onChange={(e) => setCohortForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. BOOT-2026-Q1" /></div>
            <div><Label>{isAr ? "الوصف" : "Description"}</Label><Textarea value={cohortForm.description} onChange={(e) => setCohortForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{isAr ? "تاريخ البداية" : "Start Date"}</Label><Input type="date" value={cohortForm.start_date} onChange={(e) => setCohortForm(f => ({ ...f, start_date: e.target.value }))} /></div>
              <div><Label>{isAr ? "تاريخ النهاية" : "End Date"}</Label><Input type="date" value={cohortForm.end_date} onChange={(e) => setCohortForm(f => ({ ...f, end_date: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{isAr ? "الحالة" : "Status"}</Label>
                <Select value={cohortForm.status} onValueChange={(v) => setCohortForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{COHORT_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{isAr ? s.ar : s.en}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>{isAr ? "السعة" : "Capacity"}</Label><Input type="number" value={cohortForm.capacity ?? ""} onChange={(e) => setCohortForm(f => ({ ...f, capacity: e.target.value ? Number(e.target.value) : null }))} /></div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={cohortForm.enrollment_open} onCheckedChange={(v) => setCohortForm(f => ({ ...f, enrollment_open: v }))} />
              <Label>{isAr ? "التسجيل مفتوح" : "Enrollment Open"}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCohortDialog(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={saveCohort} disabled={savingCohort}>{savingCohort && <Loader2 className="h-4 w-4 animate-spin me-1" />}{isAr ? "حفظ" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Session Dialog ─────────────────────────────────── */}
      <Dialog open={sessionDialog} onOpenChange={setSessionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingSessionId ? (isAr ? "تعديل الجلسة" : "Edit Session") : (isAr ? "جلسة جديدة" : "New Session")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{isAr ? "العنوان" : "Title"}</Label><Input value={sessionForm.title} onChange={(e) => setSessionForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>{isAr ? "الوصف" : "Description"}</Label><Textarea value={sessionForm.description} onChange={(e) => setSessionForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{isAr ? "النوع" : "Type"}</Label>
                <Select value={sessionForm.session_type} onValueChange={(v) => setSessionForm(f => ({ ...f, session_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SESSION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isAr ? "الفوج" : "Cohort"}</Label>
                <Select value={sessionForm.cohort_id || "__none__"} onValueChange={(v) => setSessionForm(f => ({ ...f, cohort_id: v === "__none__" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder={isAr ? "بدون" : "None"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{isAr ? "الكل" : "All (no cohort)"}</SelectItem>
                    {cohorts.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{isAr ? "البداية" : "Start"}</Label><Input type="datetime-local" value={sessionForm.start_at} onChange={(e) => setSessionForm(f => ({ ...f, start_at: e.target.value }))} /></div>
              <div><Label>{isAr ? "النهاية" : "End"}</Label><Input type="datetime-local" value={sessionForm.end_at} onChange={(e) => setSessionForm(f => ({ ...f, end_at: e.target.value }))} /></div>
            </div>
            <div><Label>{isAr ? "رابط الاجتماع" : "Meeting URL"}</Label><Input value={sessionForm.meeting_url} onChange={(e) => setSessionForm(f => ({ ...f, meeting_url: e.target.value }))} placeholder="https://..." /></div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2"><Switch checked={sessionForm.attendance_required} onCheckedChange={(v) => setSessionForm(f => ({ ...f, attendance_required: v }))} /><Label>{isAr ? "حضور مطلوب" : "Attendance Required"}</Label></div>
              <div className="flex items-center gap-2"><Switch checked={sessionForm.is_published} onCheckedChange={(v) => setSessionForm(f => ({ ...f, is_published: v }))} /><Label>{isAr ? "منشور" : "Published"}</Label></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSessionDialog(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={saveSession} disabled={savingSession}>{savingSession && <Loader2 className="h-4 w-4 animate-spin me-1" />}{isAr ? "حفظ" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Review Dialog ──────────────────────────────────── */}
      <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{isAr ? "مراجعة" : "Review"}: {reviewTarget?.title}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{isAr ? "القرار" : "Decision"}</Label>
              <Select value={reviewAction} onValueChange={setReviewAction}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {reviewTarget?.type === "attempt" ? (
                    <>
                      <SelectItem value="passed">{isAr ? "ناجح" : "Passed"}</SelectItem>
                      <SelectItem value="failed">{isAr ? "راسب" : "Failed"}</SelectItem>
                      <SelectItem value="reviewed">{isAr ? "تمت المراجعة" : "Reviewed"}</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="approved">{isAr ? "موافق" : "Approved"}</SelectItem>
                      <SelectItem value="revision_requested">{isAr ? "تعديلات مطلوبة" : "Revision Requested"}</SelectItem>
                      <SelectItem value="rejected">{isAr ? "مرفوض" : "Rejected"}</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div><Label>{isAr ? "الدرجة" : "Score"}</Label><Input type="number" value={reviewScore} onChange={(e) => setReviewScore(e.target.value)} placeholder={isAr ? "اختياري" : "Optional"} /></div>
            <div><Label>{isAr ? "ملاحظات" : "Feedback"}</Label><Textarea value={reviewFeedback} onChange={(e) => setReviewFeedback(e.target.value)} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={submitReview} disabled={savingReview}>{savingReview && <Loader2 className="h-4 w-4 animate-spin me-1" />}{isAr ? "إرسال" : "Submit"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmations ───────────────────────────── */}
      <ConfirmDeleteDialog open={!!deleteCohortId} onOpenChange={(v) => !v && setDeleteCohortId(null)} onConfirm={deleteCohort} title={isAr ? "حذف الفوج" : "Delete Cohort"} />
      <ConfirmDeleteDialog open={!!deleteSessionId} onOpenChange={(v) => !v && setDeleteSessionId(null)} onConfirm={deleteSession} title={isAr ? "حذف الجلسة" : "Delete Session"} />
    </div>
  );
}
