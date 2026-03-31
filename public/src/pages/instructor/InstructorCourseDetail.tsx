/**
 * /instructor/courses/:slug — Website-layer owner course detail page.
 * Shows Overview, Active Students, Past Students, Standout Students, Feedback, Q&A, Assistant Activity.
 */
import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Users, Star, MessageSquare, Bot, ArrowLeft,
  Sparkles, Clock, UserCheck, Award, Send,
  TrendingUp, TrendingDown, UserPlus, AlertTriangle, Briefcase,
} from "lucide-react";
import {
  isSampleMode,
  MOCK_INSTRUCTOR_SUGGESTED_EXPERTS,
  MOCK_INSTRUCTOR_OUTSTANDING_STUDENTS,
  MOCK_INSTRUCTOR_REVIEW_INSIGHTS,
  MOCK_INSTRUCTOR_COURSE_ACTIVITY,
  MOCK_COURSE_DETAIL_STUDENTS,
  MOCK_COURSE_DETAIL_QUESTIONS,
  MOCK_COURSE_DETAIL_REVIEWS,
  MOCK_COURSE_DETAIL_ENTRIES,
} from "@/data/mockData";
import SampleDataBadge from "@/components/SampleDataBadge";
import NominateStudentDialog from "@/components/instructor/NominateStudentDialog";
import InviteAssistantDialog from "@/components/instructor/InviteAssistantDialog";
import SEO from "@/components/SEO";

export default function InstructorCourseDetail() {
  const { slug } = useParams();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const isAr = lang === "ar";

  const { data: course, isLoading } = useQuery({
    queryKey: ["instructor-course-detail", slug, user?.id],
    enabled: !!user && !!slug,
    staleTime: 3 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_courses")
        .select("id, title_en, title_ar, slug, status, total_lessons, price_usd, is_free, description_en, description_ar, thumbnail_url, created_at")
        .eq("instructor_id", user!.id)
        .eq("slug", slug!)
        .maybeSingle();

      // Never mask real query errors with sample data
      if (error) throw error;
      if (data) return data;

      // Sample fallback only on success + empty
      if (isSampleMode()) {
        return MOCK_COURSE_DETAIL_ENTRIES.find((c) => c.slug === slug) ?? null;
      }
      return null;
    },
  });

  // Truthful sample gating: only use mock detail data when the course itself is mock
  const isSampleCourse = !!(course?.id && course.id.startsWith("mock-"));

  // Instructor profile track for specialization-locked expert filtering
  const { data: instrProfile } = useQuery({
    queryKey: ["instructor-course-detail-profile", user?.id],
    enabled: !!user,
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

  const instrTrack = instrProfile?.track ?? null;

  // Experts in same specialization for contextual panel
  const { data: experts = [] } = useQuery({
    queryKey: ["instructor-course-experts", instrTrack, isSampleCourse],
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_experts");
      if (error) throw error;
      const all = (data ?? []) as any[];
      if (instrTrack) {
        const matched = all
          .filter((e: any) => e.track?.toLowerCase().includes(instrTrack.toLowerCase()))
          .slice(0, 2);
        if (matched.length > 0) return matched;
      }
      // Only fall back to mock experts on a sample course, never on real courses
      if (isSampleCourse) return MOCK_INSTRUCTOR_SUGGESTED_EXPERTS;
      return [];
    },
  });

  const [nominateOpen, setNominateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  /* ── Assistant invitations for this course ── */
  const { data: courseAssistants = [] } = useQuery({
    queryKey: ["instructor-course-assistants", course?.id, user?.id],
    enabled: !!user && !!course?.id,
    staleTime: 30_000,
    queryFn: async () => {
      if (isSampleCourse) return [];
      const { data, error } = await supabase
        .from("assistant_invitations")
        .select("id, freelancer_id, status, role, support_scope, created_at")
        .eq("instructor_id", user!.id)
        .eq("course_id", course!.id)
        .in("status", ["pending", "accepted", "declined"]);
      if (error) throw error;
      return data ?? [];
    },
  });


  const { data: assistantProfiles = [] } = useQuery({
    queryKey: ["instructor-course-assistant-profiles", course?.id],
    enabled: !!course?.id,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      if (isSampleCourse) return [];
      const { data, error } = await supabase.rpc("get_instructor_assistant_profiles" as any, { p_course_id: course!.id });
      if (error) throw error;
      return (data as any[]) ?? [];
    },
  });

  const profileMap = useMemo(() => {
    const m = new Map<string, string>();
    assistantProfiles.forEach((p: any) => m.set(p.user_id, p.full_name ?? "Unknown"));
    return m;
  }, [assistantProfiles]);

  const acceptedAssistants = courseAssistants.filter((a: any) => a.status === "accepted");
  const pendingAssistants = courseAssistants.filter((a: any) => a.status === "pending");


  /* ── Real enrollment & question counts for real courses ── */
  const { data: enrollmentCounts } = useQuery({
    queryKey: ["instructor-course-enrollment-counts", course?.id],
    enabled: !isSampleCourse && !!course?.id,
    staleTime: 2 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("course_enrollments")
        .select("id, status")
        .eq("course_id", course!.id);
      const rows = data ?? [];
      return {
        active: rows.filter(r => r.status === "active").length,
        completed: rows.filter(r => r.status === "completed").length,
      };
    },
  });

  const { data: unansweredCount } = useQuery({
    queryKey: ["instructor-course-unanswered", course?.id],
    enabled: !isSampleCourse && !!course?.id,
    staleTime: 2 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("course_questions")
        .select("id")
        .eq("course_id", course!.id)
        .is("answered_at", null);
      return data?.length ?? 0;
    },
  });

  if (isLoading) {
    return (
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="h-8 w-48 bg-muted animate-pulse rounded mb-4" />
          <div className="h-64 bg-muted animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="pt-24 pb-20 text-center">
        <div className="container mx-auto px-4">
          <p className="text-muted-foreground">{isAr ? "الدورة غير موجودة" : "Course not found"}</p>
          <Link to="/instructor/courses" className="text-primary text-sm mt-2 inline-block hover:underline">
            {isAr ? "العودة لدوراتي" : "Back to my courses"}
          </Link>
        </div>
      </div>
    );
  }

  const activeStudents = (isSampleCourse ? MOCK_COURSE_DETAIL_STUDENTS : []).filter((s: any) => s.status === "active");
  const pastStudents = (isSampleCourse ? MOCK_COURSE_DETAIL_STUDENTS : []).filter((s: any) => s.status === "completed");
  const unanswered = (isSampleCourse ? MOCK_COURSE_DETAIL_QUESTIONS : []).filter((q: any) => !q.answered);
  const standoutStudents = isSampleCourse ? MOCK_INSTRUCTOR_OUTSTANDING_STUDENTS.slice(0, 4) : [];
  const reviewInsights = isSampleCourse ? MOCK_INSTRUCTOR_REVIEW_INSIGHTS : null;
  const courseActivity = isSampleCourse ? MOCK_INSTRUCTOR_COURSE_ACTIVITY.filter(e => !e.course || e.course === (course.title_en)) : [];

  // Derived overview values — truthful per source
  const overviewActiveStudents = isSampleCourse ? activeStudents.length : (enrollmentCounts?.active ?? 0);
  const overviewCompletedStudents = isSampleCourse ? pastStudents.length : (enrollmentCounts?.completed ?? 0);
  const overviewUnanswered = isSampleCourse ? unanswered.length : (unansweredCount ?? 0);

  return (
    <div className="pt-24 pb-20">
      <SEO title={`${isAr ? (course.title_ar || course.title_en) : course.title_en} | DevWady`} />
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back */}
        <Link to="/instructor/courses" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6">
          <ArrowLeft className="icon-flip-rtl h-3.5 w-3.5" />
          {isAr ? "العودة لدوراتي" : "Back to my courses"}
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground mb-1">
                {isAr ? (course.title_ar || course.title_en) : course.title_en}
              </h1>
              <SampleDataBadge isSample={isSampleCourse} />
            </div>
            <p className="text-sm text-muted-foreground">
              {course.total_lessons ?? 0} {isAr ? "درس" : "lessons"} ·{" "}
              {course.is_free ? (isAr ? "مجاني" : "Free") : `$${course.price_usd ?? 0}`}
            </p>
          </div>
          <Badge className={course.status === "published" ? "bg-green-500/15 text-green-600 border-0" : "bg-muted text-muted-foreground border-0"}>
            {course.status === "published" ? (isAr ? "منشور" : "Published") : (isAr ? "مسودة" : "Draft")}
          </Badge>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start bg-muted/50 rounded-xl p-1 mb-6">
            <TabsTrigger value="overview">{isAr ? "نظرة عامة" : "Overview"}</TabsTrigger>
            <TabsTrigger value="active">{isAr ? "طلاب نشطون" : "Active Students"}</TabsTrigger>
            <TabsTrigger value="past">{isAr ? "طلاب سابقون" : "Past Students"}</TabsTrigger>
            <TabsTrigger value="feedback">{isAr ? "التقييمات" : "Feedback"}</TabsTrigger>
            <TabsTrigger value="activity">{isAr ? "النشاط" : "Activity"}</TabsTrigger>
            <TabsTrigger value="standout">{isAr ? "طلاب متميزون" : "Standout"}</TabsTrigger>
            <TabsTrigger value="qa">{isAr ? "أسئلة" : "Q&A"}</TabsTrigger>
            <TabsTrigger value="assistant">{isAr ? "المساعد" : "Assistant"}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              {[
                { icon: Users, label: isAr ? "طلاب نشطون" : "Active Students", value: overviewActiveStudents },
                { icon: UserCheck, label: isAr ? "مكتملون" : "Completed", value: overviewCompletedStudents },
                ...(isSampleCourse ? [{ icon: Star, label: isAr ? "التقييم" : "Rating", value: "4.5 ★" }] : []),
                { icon: MessageSquare, label: isAr ? "بدون إجابة" : "Unanswered", value: overviewUnanswered },
              ].map((stat) => (
                <div key={stat.label} className="p-4 rounded-xl border border-border/60 bg-card">
                  <stat.icon className="h-4 w-4 text-muted-foreground mb-1.5" />
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
            {course.description_en && (
              <div className="p-4 rounded-xl border border-border/60 bg-card">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isAr ? (course.description_ar || course.description_en) : course.description_en}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="active">
            {activeStudents.length === 0 && !isSampleCourse ? (
              <div className="text-center py-12">
                <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{isAr ? "سيُعرض الطلاب النشطون هنا عند ربط البيانات" : "Active students will appear here once enrollment data is connected"}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeStudents.map((s) => (
                  <div key={s.id} className="p-4 rounded-xl border border-border/60 bg-card flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{isAr ? "انضم" : "Enrolled"} {s.enrolled}</p>
                    </div>
                    <div className="text-end">
                      <p className="text-sm font-semibold text-primary">{s.progress}%</p>
                      <p className="text-[10px] text-muted-foreground">{isAr ? "تقدم" : "progress"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {pastStudents.length === 0 && !isSampleCourse ? (
              <div className="text-center py-12">
                <UserCheck className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{isAr ? "سيُعرض الطلاب المكتملون هنا" : "Completed students will appear here"}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pastStudents.map((s) => (
                  <div key={s.id} className="p-4 rounded-xl border border-border/60 bg-card flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{isAr ? "أكمل" : "Completed"} {s.enrolled}</p>
                    </div>
                    <Badge className="bg-green-500/15 text-green-600 border-0 text-[10px]">
                      {isAr ? "مكتمل" : "Completed"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="feedback">
            {!isSampleCourse ? (
              <div className="text-center py-12">
                <Star className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{isAr ? "ستُعرض التقييمات هنا عند توفرها" : "Course reviews will appear here once available"}</p>
              </div>
            ) : (
              <>
                {reviewInsights && (
                  <div className="p-4 rounded-xl border border-border/60 bg-card space-y-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-1 text-sm font-semibold ${reviewInsights.trend.direction === "up" ? "text-green-600" : "text-destructive"}`}>
                        {reviewInsights.trend.direction === "up" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        {reviewInsights.trend.avg_rating} ★
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {isAr ? `من ${reviewInsights.trend.prev_avg} ★` : `from ${reviewInsights.trend.prev_avg} ★`} · {reviewInsights.trend.total_reviews} {isAr ? "تقييم" : "reviews"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] font-medium text-green-600 mb-1.5">{isAr ? "إشادات" : "Praise"}</p>
                        {reviewInsights.repeated_praise.slice(0, 3).map((p: any) => (
                          <div key={p.theme} className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] text-muted-foreground/60">×{p.count}</span>
                            <span className="text-xs text-foreground">{p.theme}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-amber-600 mb-1.5">{isAr ? "تحسينات" : "Improvements"}</p>
                        {reviewInsights.improvement_requests.slice(0, 3).map((p: any) => (
                          <div key={p.theme} className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] text-muted-foreground/60">×{p.count}</span>
                            <span className="text-xs text-foreground">{p.theme}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-3">
                  {MOCK_COURSE_DETAIL_REVIEWS.map((r: any) => (
                    <div key={r.id} className="p-4 rounded-xl border border-border/60 bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-foreground">{r.student}</p>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: r.rating }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 text-amber-500 fill-amber-500" />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{r.review}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-2">{r.date}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="activity">
            {courseActivity.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{isAr ? "لا يوجد نشاط بعد" : "No activity yet"}</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {courseActivity.map((ev: any) => {
                  const iconMap: Record<string, any> = { UserPlus, Bot, Star, AlertTriangle, Briefcase, Award };
                  const Icon = iconMap[ev.icon] ?? Clock;
                  return (
                    <div key={ev.id} className="flex items-start gap-3 p-3 rounded-xl border border-border/60 bg-card">
                      <Icon className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground leading-snug">{isAr ? ev.text_ar : ev.text_en}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">{ev.age}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="standout">
            {standoutStudents.length === 0 ? (
              <div className="text-center py-12">
                <Award className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{isAr ? "لا طلاب متميزون حالياً" : "No standout students yet"}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {standoutStudents.map((s) => {
                  const statusCfg: Record<string, { label: string; cls: string }> = {
                    ready: { label: isAr ? "جاهز للترشيح" : "Ready to Nominate", cls: "bg-green-500/10 text-green-600" },
                    promising: { label: isAr ? "واعد" : "Promising", cls: "bg-primary/10 text-primary" },
                    needs_support: { label: isAr ? "يحتاج دعم" : "Needs Support", cls: "bg-amber-500/10 text-amber-600" },
                  };
                  const cfg = statusCfg[s.status] ?? statusCfg.promising;
                  return (
                    <div key={s.id} className="p-4 rounded-xl border border-border/60 bg-card">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="text-sm font-semibold text-foreground">{s.name}</p>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {s.course_title} · {s.progress_pct}% · {isAr ? "المعدل" : "Avg"}: {s.assignments_avg}%
                          </p>
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {s.skills.slice(0, 3).map((sk) => (
                              <span key={sk} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{sk}</span>
                            ))}
                          </div>
                        </div>
                        {s.status === "ready" && (
                          <button
                            onClick={() => setNominateOpen(true)}
                            className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline flex-shrink-0 mt-1"
                          >
                            <Send className="h-3 w-3" />
                            {isAr ? "رشّح" : "Nominate"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <NominateStudentDialog
              open={nominateOpen}
              onOpenChange={setNominateOpen}
              jobTitle={isAr ? "فرص Android ذات صلة" : "Relevant Android Opportunities"}
              isSampleContext={isSampleCourse}
            />
          </TabsContent>

          <TabsContent value="qa">
            {!isSampleCourse ? (
              <div className="text-center py-12">
                <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{isAr ? "ستُعرض الأسئلة هنا عند توفرها" : "Student questions will appear here once available"}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {MOCK_COURSE_DETAIL_QUESTIONS.map((q: any) => (
                  <div key={q.id} className={`p-4 rounded-xl border ${q.answered ? "border-border/60 bg-card" : "border-primary/20 bg-primary/3"}`}>
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-medium text-foreground">{q.question}</p>
                      {!q.answered && (
                        <Badge variant="destructive" className="text-[10px] flex-shrink-0 ms-2">
                          {isAr ? "بدون إجابة" : "Unanswered"}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
                      <span>{q.student}</span>
                      <span>·</span>
                      <Clock className="h-3 w-3" />
                      <span>{q.age}</span>
                      {q.answered && (
                        <>
                          <span>·</span>
                          <span className="text-green-600">{isAr ? "أجاب:" : "By:"} {q.answeredBy}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="assistant">
            {/* Accepted assistants */}
            {acceptedAssistants.length > 0 && (
              <div className="space-y-2 mb-4">
                {acceptedAssistants.map((a: any) => (
                  <div key={a.id} className="p-4 rounded-xl border border-border/60 bg-card flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {(profileMap.get(a.freelancer_id) ?? "?")[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{profileMap.get(a.freelancer_id) ?? (isAr ? "مساعد" : "Assistant")}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {a.role ?? (isAr ? "مساعد تقني" : "Technical Assistant")}
                        {a.support_scope ? ` · ${a.support_scope}` : ""}
                      </p>
                    </div>
                    <Badge className="bg-green-500/15 text-green-600 border-0 text-[10px]">
                      {isAr ? "معيّن" : "Assigned"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Pending invitations */}
            {pendingAssistants.length > 0 && (
              <div className="space-y-2 mb-4">
                {pendingAssistants.map((a: any) => (
                  <div key={a.id} className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {(profileMap.get(a.freelancer_id) ?? "?")[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{profileMap.get(a.freelancer_id) ?? (isAr ? "مستقل" : "Freelancer")}</p>
                      <p className="text-[10px] text-muted-foreground">{isAr ? "بانتظار الرد" : "Awaiting response"}</p>
                    </div>
                    <Badge className="bg-amber-500/15 text-amber-600 border-0 text-[10px]">
                      {isAr ? "معلّقة" : "Pending"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state — only when no relevant records */}
            {acceptedAssistants.length === 0 && pendingAssistants.length === 0 && (
              <div className="text-center py-12">
                <Bot className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">
                  {isAr ? "لم يتم تعيين مساعد بعد" : "No assistant assigned yet"}
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  {isAr ? "ادعُ مساعداً لدعم طلابك في هذه الدورة" : "Invite an assistant to support your students on this course"}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => setInviteOpen(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <UserPlus className="h-3.5 w-3.5" />
                {isAr ? "دعوة مساعد" : "Invite Assistant"}
              </button>
              <Link
                to="/instructor/assistants"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {isAr ? "إدارة المساعدين" : "Manage Assistants"}
              </Link>
            </div>

            <InviteAssistantDialog
              open={inviteOpen}
              onOpenChange={setInviteOpen}
              preselectedCourseId={course.id}
              isSampleContext={isSampleCourse}
            />
          </TabsContent>
        </Tabs>

        {/* Expert consultation panel */}
        {experts.length > 0 && (
          <div className="mt-10 p-5 rounded-xl border border-border/60 bg-card">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              {isAr ? "خبراء في مجالك" : "Suggested Experts in My Field"}
            </h3>
            <div className="space-y-2">
              {experts.map((exp: any) => (
                <Link
                  key={exp.id}
                  to={`/consulting/${exp.slug}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-all group"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {exp.name?.[0] ?? "E"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{isAr ? exp.name_ar : exp.name}</p>
                    <p className="text-[11px] text-muted-foreground">{isAr ? exp.role_ar : exp.role} · ${exp.session_rate_usd}/session</p>
                  </div>
                  <ArrowLeft className="icon-flip-rtl h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary rotate-180" />
                </Link>
              ))}
            </div>
            <Link to="/consulting" className="text-xs text-primary hover:underline mt-2 inline-block">
              {isAr ? "تصفح جميع الخبراء" : "Browse all experts"} →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
