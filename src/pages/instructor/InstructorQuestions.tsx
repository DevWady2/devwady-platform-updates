/**
 * /instructor/questions — Student Q&A management for instructors.
 * Shows questions from students enrolled in the instructor's courses.
 * Supports answering, editing answers, and toggling class visibility.
 */
import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  MessageSquare, Filter, Clock, CheckCircle, Eye, EyeOff,
  Send, Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import SEO from "@/components/SEO";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type FilterStatus = "all" | "unanswered" | "answered";

/** Resolve who answered a question (course-specific assistant check) */
export function resolveAnswerSource(
  answeredBy: string | null,
  currentUserId: string,
  assistantsByCourse: Map<string, Set<string>>,
  courseId: string,
  isAr: boolean,
): { label: string; isInstructor: boolean; isAssistant: boolean } {
  if (!answeredBy) return { label: "", isInstructor: false, isAssistant: false };
  if (answeredBy === currentUserId)
    return { label: isAr ? "إجابة المدرب" : "Answered by Instructor", isInstructor: true, isAssistant: false };
  const courseAssistants = assistantsByCourse.get(courseId);
  if (courseAssistants?.has(answeredBy))
    return { label: isAr ? "إجابة المساعد" : "Answered by Assistant", isInstructor: false, isAssistant: true };
  return { label: isAr ? "تمت الإجابة" : "Answered", isInstructor: false, isAssistant: false };
}

export default function InstructorQuestions() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const isAr = lang === "ar";
  const qc = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // Fetch instructor's courses for filter dropdown
  const { data: myCourses = [] } = useQuery({
    queryKey: ["instructor-courses-list", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_courses")
        .select("id, title_en, title_ar")
        .eq("instructor_id", user!.id)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch accepted assistants for the instructor's courses
  const { data: acceptedAssistants = [] } = useQuery({
    queryKey: ["instructor-accepted-assistants", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assistant_invitations")
        .select("freelancer_id, course_id")
        .eq("instructor_id", user!.id)
        .eq("status", "accepted");
      if (error) throw error;
      return data ?? [];
    },
  });

  const assistantsByCourse = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const a of acceptedAssistants) {
      if (!a.course_id) continue;
      if (!map.has(a.course_id)) map.set(a.course_id, new Set());
      map.get(a.course_id)!.add(a.freelancer_id);
    }
    return map;
  }, [acceptedAssistants]);

  // Fetch questions (RLS ensures only own courses)
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["instructor-questions", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_questions" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const myCourseIds = myCourses.map((c: any) => c.id);
  const { data: studentProfiles = [] } = useQuery({
    queryKey: ["question-student-profiles", myCourseIds],
    enabled: myCourseIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_question_author_profiles" as any, { p_course_ids: myCourseIds });
      if (error) throw error;
      return (data as any[]) ?? [];
    },
  });

  const studentName = (uid: string) =>
    studentProfiles.find((p: any) => p.user_id === uid)?.full_name || (isAr ? "طالب" : "Student");

  const courseName = (courseId: string) => {
    const c = myCourses.find((c: any) => c.id === courseId);
    if (!c) return "";
    return isAr ? (c.title_ar || c.title_en) : c.title_en;
  };

  // Answer mutation
  const answerMutation = useMutation({
    mutationFn: async ({ questionId, text }: { questionId: string; text: string }) => {
      const { error } = await supabase
        .from("course_questions" as any)
        .update({
          answer_text: text,
          answered_by: user!.id,
          answered_at: new Date().toISOString(),
        } as any)
        .eq("id", questionId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["instructor-questions"] });
      setReplyingTo(null);
      setReplyText("");
      toast.success(isAr ? "تم إرسال الإجابة" : "Answer submitted");
    },
    onError: () => toast.error(isAr ? "فشل الإرسال" : "Failed to submit"),
  });

  // Visibility toggle mutation
  const visibilityMutation = useMutation({
    mutationFn: async ({ questionId, visible }: { questionId: string; visible: boolean }) => {
      const { error } = await supabase
        .from("course_questions" as any)
        .update({ is_visible_to_class: visible } as any)
        .eq("id", questionId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["instructor-questions"] });
      toast.success(isAr ? "تم تحديث الرؤية" : "Visibility updated");
    },
  });

  // Filtering
  const filtered = questions.filter((q: any) => {
    if (courseFilter !== "all" && q.course_id !== courseFilter) return false;
    if (statusFilter === "unanswered") return !q.answer_text;
    if (statusFilter === "answered") return !!q.answer_text;
    return true;
  });

  const unansweredCount = questions.filter((q: any) => !q.answer_text).length;

  return (
    <div className="pt-24 pb-20">
      <SEO title={isAr ? "أسئلة الطلاب | DevWady" : "Student Questions | DevWady"} />
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">
            {isAr ? "أسئلة الطلاب" : "Student Questions"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isLoading
              ? (isAr ? "جارٍ التحميل..." : "Loading...")
              : unansweredCount > 0
              ? isAr
                ? `${unansweredCount} سؤال بانتظار الإجابة`
                : `${unansweredCount} question${unansweredCount > 1 ? "s" : ""} awaiting your answer`
              : questions.length > 0
              ? (isAr ? "جميع الأسئلة تمت الإجابة عليها" : "All questions have been addressed")
              : (isAr ? "لم يسأل أي طالب بعد" : "No student questions yet")}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-[240px] rounded-xl text-sm h-9">
              <Filter className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
              <SelectValue placeholder={isAr ? "كل الدورات" : "All courses"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "كل الدورات" : "All courses"}</SelectItem>
              {myCourses.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>
                  {isAr ? (c.title_ar || c.title_en) : c.title_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as FilterStatus)}>
            <SelectTrigger className="w-[180px] rounded-xl text-sm h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "الكل" : "All"} ({questions.length})</SelectItem>
              <SelectItem value="unanswered">{isAr ? "بحاجة إجابة" : "Unanswered"} ({unansweredCount})</SelectItem>
              <SelectItem value="answered">{isAr ? "تمت الإجابة" : "Answered"} ({questions.length - unansweredCount})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* Empty state */
          <div className="text-center py-20">
            <MessageSquare className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" strokeWidth={1.2} />
            <h3 className="font-semibold text-foreground mb-1">
              {questions.length === 0
                ? (isAr ? "لا توجد أسئلة بعد" : "No questions yet")
                : (isAr ? "لا توجد أسئلة تطابق الفلتر" : "No questions match your filters")}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {questions.length === 0
                ? (isAr ? "عندما يسأل الطلاب أسئلة في دوراتك ستظهر هنا." : "When students ask questions in your courses, they'll appear here.")
                : (isAr ? "جرب تغيير الفلتر." : "Try adjusting your filters.")}
            </p>
          </div>
        ) : (
          /* Questions list */
          <div className="space-y-3">
            {filtered.map((q: any) => {
              const isUnanswered = !q.answer_text;
              const isReplying = replyingTo === q.id;
              const source = resolveAnswerSource(q.answered_by, user?.id ?? "", assistantsByCourse, q.course_id, isAr);

              return (
                <div
                  key={q.id}
                  className={`p-5 rounded-xl border transition-all ${
                    isUnanswered
                      ? "border-primary/20 bg-primary/[0.02]"
                      : "border-border/60 bg-card"
                  }`}
                >
                  {/* Top row: status + visibility */}
                  <div className="flex items-center justify-between mb-2.5">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] font-medium border-0 ${
                        isUnanswered
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-emerald-500/10 text-emerald-600"
                      }`}
                    >
                      {isUnanswered
                        ? (isAr ? "بانتظار الإجابة" : "Awaiting Answer")
                        : (isAr ? "تمت الإجابة" : "Answered")}
                    </Badge>

                    {/* Visibility toggle (only meaningful for answered questions) */}
                    {q.answer_text && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[10px] gap-1 rounded-lg"
                        disabled={visibilityMutation.isPending}
                        onClick={() =>
                          visibilityMutation.mutate({
                            questionId: q.id,
                            visible: !q.is_visible_to_class,
                          })
                        }
                      >
                        {q.is_visible_to_class ? (
                          <><Eye className="h-3 w-3 text-primary" /> {isAr ? "مرئي للطلاب" : "Visible to class"}</>
                        ) : (
                          <><EyeOff className="h-3 w-3 text-muted-foreground" /> {isAr ? "خاص" : "Private"}</>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Question text */}
                  <p className="text-sm font-medium text-foreground mb-2">{q.question_text}</p>

                  {/* Meta row */}
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                    <span>{studentName(q.asked_by)}</span>
                    <span>·</span>
                    <span className="text-xs font-medium text-primary/70">{courseName(q.course_id)}</span>
                    <span>·</span>
                    <Clock className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}</span>
                    {q.answer_text && (
                      <>
                        <span>·</span>
                        <CheckCircle className="h-3 w-3 text-emerald-500" />
                        <span className="text-emerald-600">
                          {source.label}
                          {q.answered_at && ` ${formatDistanceToNow(new Date(q.answered_at), { addSuffix: true })}`}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Existing answer */}
                  {q.answer_text && !isReplying && (
                    <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border/40">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">
                        {source.isInstructor
                          ? (isAr ? "إجابتك:" : "Your answer:")
                          : source.isAssistant
                          ? (isAr ? "إجابة المساعد:" : "Assistant's answer:")
                          : (isAr ? "الإجابة:" : "Answer:")}
                      </p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{q.answer_text}</p>
                    </div>
                  )}

                  {/* Reply / Edit form */}
                  <div className="mt-3">
                    {isReplying ? (
                      <div className="space-y-2">
                        <Textarea
                          placeholder={isAr ? "اكتب إجابتك..." : "Write your answer..."}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="min-h-[80px] text-sm rounded-lg"
                          autoFocus
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="rounded-full text-xs gap-1"
                            disabled={!replyText.trim() || answerMutation.isPending}
                            onClick={() => answerMutation.mutate({ questionId: q.id, text: replyText.trim() })}
                          >
                            {answerMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Send className="h-3 w-3" />
                            )}
                            {isAr ? "إرسال" : "Submit"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-full text-xs"
                            onClick={() => { setReplyingTo(null); setReplyText(""); }}
                          >
                            {isAr ? "إلغاء" : "Cancel"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant={isUnanswered ? "default" : "outline"}
                        className="rounded-full text-xs"
                        onClick={() => {
                          setReplyingTo(q.id);
                          setReplyText(q.answer_text ?? "");
                        }}
                      >
                        {q.answer_text ? (isAr ? "تعديل الإجابة" : "Edit Answer") : (isAr ? "أجب" : "Reply")}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
