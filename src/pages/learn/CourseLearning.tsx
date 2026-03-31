import { useParams, Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { computeReadiness } from "@/features/academy/learningModel/readiness";
import ReadinessSignalCard from "@/components/academy/ReadinessSignalCard";
import SEO from "@/components/SEO";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
// Input used via native element in project dialog
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, FileText, CheckCircle2, Circle, ChevronLeft, ChevronRight,
  ChevronDown, ChevronUp, Menu, ArrowLeft, Star, Loader2, Download, GraduationCap,
  Target, ClipboardCheck, FolderKanban, Calendar, Users, Send, ExternalLink,
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  useMyCourseCohort, useMySessions, useMyAttendance,
  useMyStructureItems, useMyAttempts, useMySubmissions, useMyProjectReviews,
} from "@/portals/academy/hooks/useStudentCourseStructure";

export default function CourseLearning() {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isAr = lang === "ar";

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [completing, setCompleting] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch course
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ["learn-course", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_courses")
        .select("*")
        .eq("slug", slug!)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Check enrollment
  const { data: enrollment, isLoading: enrollLoading } = useQuery({
    queryKey: ["learn-enrollment", course?.id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("course_enrollments")
        .select("id, status")
        .eq("course_id", course!.id)
        .eq("user_id", user!.id)
        .eq("status", "active")
        .maybeSingle();
      return data;
    },
    enabled: !!course?.id && !!user?.id,
  });

  // Fetch modules + lessons
  const { data: modules = [] } = useQuery({
    queryKey: ["learn-modules", course?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("course_modules")
        .select("*, course_lessons(*)")
        .eq("course_id", course!.id)
        .order("sort_order");
      return (data ?? []).map((m: any) => ({
        ...m,
        course_lessons: (m.course_lessons || []).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)),
      }));
    },
    enabled: !!course?.id && !!enrollment,
  });

  // Fetch progress
  const { data: progressMap = {} } = useQuery({
    queryKey: ["learn-progress", enrollment?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("lesson_progress")
        .select("lesson_id, is_completed, progress_seconds")
        .eq("enrollment_id", enrollment!.id);
      const map: Record<string, { is_completed: boolean; progress_seconds: number }> = {};
      (data ?? []).forEach((p: any) => { map[p.lesson_id] = p; });
      return map;
    },
    enabled: !!enrollment?.id,
  });

  // ── Structure & Delivery data ──
  const { data: structureItems } = useMyStructureItems(course?.id);
  const { data: myCohort } = useMyCourseCohort(course?.id, user?.id);
  const cohortId = (myCohort as any)?.course_cohorts?.id ?? null;
  const { data: mySessions = [] } = useMySessions(course?.id, cohortId);
  const sessionIds = mySessions.map((s: any) => s.id);
  const { data: myAttendanceMap = {} } = useMyAttendance(user?.id, sessionIds);
  const assessmentIds = (structureItems?.assessments ?? []).map((a: any) => a.id);
  const projectIds = (structureItems?.projects ?? []).map((p: any) => p.id);
  const { data: myAttempts = {} } = useMyAttempts(user?.id, assessmentIds);
  const { data: mySubmissions = {} } = useMySubmissions(user?.id, projectIds);
  const { data: myProjectReviews = {} } = useMyProjectReviews(user?.id, projectIds);

  const [startingAttempt, setStartingAttempt] = useState<string | null>(null);

  const [submitProjectId, setSubmitProjectId] = useState<string | null>(null);
  const [submitText, setSubmitText] = useState("");
  const [submitUrl, setSubmitUrl] = useState("");
  const [submittingProject, setSubmittingProject] = useState(false);

  const handleSubmitProject = async () => {
    if (!submitProjectId || !user) return;
    setSubmittingProject(true);
    const payload: any = {
      project_id: submitProjectId,
      user_id: user.id,
      submission_status: "submitted",
      submitted_at: new Date().toISOString(),
      submission_text: submitText || null,
      submission_url: submitUrl || null,
    };
    const { error } = await supabase
      .from("project_submissions")
      .upsert(payload, { onConflict: "project_id,user_id" });
    if (error) toast.error(error.message);
    else {
      toast.success(isAr ? "تم الإرسال" : "Submitted");
      qc.invalidateQueries({ queryKey: ["my-submissions"] });
      setSubmitProjectId(null);
      setSubmitText("");
      setSubmitUrl("");
    }
    setSubmittingProject(false);
  };


  const { data: myReview } = useQuery({
    queryKey: ["learn-review", course?.id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("course_reviews")
        .select("*")
        .eq("course_id", course!.id)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!course?.id && !!user?.id,
  });

  // All lessons flat
  const allLessons = useMemo(() => {
    return modules.flatMap((m: any) => (m.course_lessons || []).map((l: any) => ({ ...l, module_id: m.id })));
  }, [modules]);

  // Set first lesson & expand all modules on load
  useEffect(() => {
    if (allLessons.length > 0 && !activeLessonId) {
      // Find first incomplete lesson or default to first
      const firstIncomplete = allLessons.find((l: any) => !progressMap[l.id]?.is_completed);
      setActiveLessonId(firstIncomplete?.id || allLessons[0].id);
    }
    if (modules.length > 0 && Object.keys(expandedModules).length === 0) {
      const exp: Record<string, boolean> = {};
      modules.forEach((m: any) => { exp[m.id] = true; });
      setExpandedModules(exp);
    }
  }, [allLessons, modules, activeLessonId, progressMap, expandedModules]);

  // Redirect if not enrolled
  useEffect(() => {
    if (!courseLoading && !enrollLoading && course && !enrollment) {
      toast.error(isAr ? "يرجى التسجيل للوصول لهذه الدورة" : "Please enroll to access this course");
      navigate(`/academy/courses/${slug}`);
    }
  }, [courseLoading, enrollLoading, course, enrollment, navigate, slug, isAr]);

  const activeLesson = useMemo(() => allLessons.find((l: any) => l.id === activeLessonId), [allLessons, activeLessonId]);
  const activeLessonIndex = useMemo(() => allLessons.findIndex((l: any) => l.id === activeLessonId), [allLessons, activeLessonId]);

  // Progress stats
  const completedCount = useMemo(() => allLessons.filter((l: any) => progressMap[l.id]?.is_completed).length, [allLessons, progressMap]);
  const progressPct = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0;

  // Track lesson access
  useEffect(() => {
    if (!activeLesson || !enrollment || !user) return;
    const upsertProgress = async () => {
      await supabase.from("lesson_progress").upsert({
        enrollment_id: enrollment.id,
        lesson_id: activeLesson.id,
        user_id: user.id,
        last_accessed_at: new Date().toISOString(),
      }, { onConflict: "enrollment_id,lesson_id" });
    };
    upsertProgress();
  }, [activeLesson?.id, enrollment?.id, user?.id]);

  // Video progress tracking (every 30s)
  useEffect(() => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    if (!activeLesson || activeLesson.content_type !== "video" || !enrollment || !user) return;

    progressTimerRef.current = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.paused) return;
      const seconds = Math.round(video.currentTime);
      await supabase.from("lesson_progress").upsert({
        enrollment_id: enrollment.id,
        lesson_id: activeLesson.id,
        user_id: user.id,
        progress_seconds: seconds,
        last_accessed_at: new Date().toISOString(),
      }, { onConflict: "enrollment_id,lesson_id" });

      // Auto-complete at 90%
      if (activeLesson.video_duration_seconds && seconds >= activeLesson.video_duration_seconds * 0.9 && !progressMap[activeLesson.id]?.is_completed) {
        handleMarkComplete();
      }
    }, 30000);

    return () => { if (progressTimerRef.current) clearInterval(progressTimerRef.current); };
  }, [activeLesson?.id]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: any) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const dir = e.key === "ArrowRight" ? 1 : -1;
        const next = activeLessonIndex + dir;
        if (next >= 0 && next < allLessons.length) {
          setActiveLessonId(allLessons[next].id);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeLessonIndex, allLessons]);

  const handleMarkComplete = useCallback(async () => {
    if (!activeLesson || !enrollment || !user || completing) return;
    setCompleting(true);
    await supabase.from("lesson_progress").upsert({
      enrollment_id: enrollment.id,
      lesson_id: activeLesson.id,
      user_id: user.id,
      is_completed: true,
      completed_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
    }, { onConflict: "enrollment_id,lesson_id" });
    qc.invalidateQueries({ queryKey: ["learn-progress", enrollment.id] });

    // Check if all complete
    const newCompleted = completedCount + 1;
    if (newCompleted >= allLessons.length) {
      // Course complete!
      await supabase.from("course_enrollments").update({
        status: "completed",
        completed_at: new Date().toISOString(),
        certificate_url: `/certificate/${enrollment.id}`,
      }).eq("id", enrollment.id);

      await supabase.rpc("create_notification", {
        _user_id: user.id,
        _type: "course_completed",
        _title_en: `Congratulations! You completed ${course?.title_en}`,
        _title_ar: `تهانينا! أكملت ${course?.title_ar || course?.title_en}`,
        _body_en: "Download your certificate now",
        _body_ar: "حمل شهادتك الآن",
        _link: `/academy/courses/${slug}`,
        _metadata: { course_id: course?.id },
      });

      setShowCompletion(true);
    } else {
      toast.success(isAr ? "تم إكمال الدرس ✓" : "Lesson completed ✓");
      // Auto-advance
      if (activeLessonIndex < allLessons.length - 1) {
        setTimeout(() => setActiveLessonId(allLessons[activeLessonIndex + 1].id), 500);
      }
    }
    setCompleting(false);
  }, [activeLesson, enrollment, user, completing, completedCount, allLessons, activeLessonIndex, course, slug, isAr, qc]);

  const handleSubmitReview = async () => {
    if (!reviewRating || !user || !enrollment || !course) return;
    setSubmittingReview(true);
    const { error } = await supabase.from("course_reviews").insert({
      course_id: course.id,
      user_id: user.id,
      enrollment_id: enrollment.id,
      rating: reviewRating,
      review: reviewText || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success(isAr ? "شكراً لتقييمك!" : "Thanks for your review!");
      qc.invalidateQueries({ queryKey: ["learn-review", course.id] });
    }
    setSubmittingReview(false);
  };

  // Parse YouTube/Vimeo
  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`;
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return null;
  };

  const formatDuration = (s: number) => {
    const m = Math.round(s / 60);
    return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
  };

  if (courseLoading || enrollLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!course || !enrollment) return null;

  const courseName = isAr ? (course.title_ar || course.title_en) : course.title_en;

  // Sidebar content (reused for desktop + mobile sheet)
  const SidebarContent_ = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <Link to={`/academy/courses/${slug}`} className="text-xs text-primary hover:underline flex items-center gap-1 mb-2">
          <ArrowLeft className="icon-flip-rtl h-3 w-3" /> {isAr ? "العودة للدورة" : "Back to course"}
        </Link>
        <h2 className="font-bold text-sm line-clamp-2">{courseName}</h2>
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>{completedCount}/{allLessons.length} {isAr ? "دروس" : "lessons"}</span>
            <span>{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="py-2">
          {modules.map((mod: any, mi: any) => {
            const lessons = mod.course_lessons || [];
            const isExpanded = expandedModules[mod.id] ?? true;
            const modCompleted = lessons.filter((l: any) => progressMap[l.id]?.is_completed).length;
            return (
              <div key={mod.id}>
                <button
                  onClick={() => setExpandedModules(prev => ({ ...prev, [mod.id]: !prev[mod.id] }))}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-start"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-muted-foreground shrink-0">{String(mi + 1).padStart(2, "0")}</span>
                    <span className="text-sm font-medium truncate">{isAr ? (mod.title_ar || mod.title_en) : mod.title_en}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">{modCompleted}/{lessons.length}</span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                      {lessons.map((lesson: any) => {
                        const isActive = lesson.id === activeLessonId;
                        const isComplete = progressMap[lesson.id]?.is_completed;
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => { setActiveLessonId(lesson.id); setSidebarOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-start transition-colors ${isActive ? "bg-primary/10 border-s-2 border-s-primary" : "hover:bg-muted/30 border-s-2 border-s-transparent"}`}
                          >
                            {isComplete ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            ) : (
                              <Circle className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground/40"}`} />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs truncate ${isActive ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                                {isAr ? (lesson.title_ar || lesson.title_en) : lesson.title_en}
                              </p>
                              {lesson.video_duration_seconds && (
                                <p className="text-[10px] text-muted-foreground">{formatDuration(lesson.video_duration_seconds)}</p>
                              )}
                            </div>
                            {lesson.content_type === "video" ? <Play className="h-3 w-3 text-muted-foreground shrink-0" /> : <FileText className="h-3 w-3 text-muted-foreground shrink-0" />}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* ── Structure & Delivery Panel ─────────────────── */}
        {((structureItems?.milestones?.length ?? 0) > 0 ||
          (structureItems?.assessments?.length ?? 0) > 0 ||
          (structureItems?.projects?.length ?? 0) > 0 ||
          mySessions.length > 0 ||
          myCohort) && (
          <div className="border-t border-border px-4 py-3 space-y-3">

            {/* Cohort badge */}
            {myCohort && (
              <div className="flex items-center gap-2 text-xs">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium">{(myCohort as any).course_cohorts?.title}</span>
                <Badge variant="outline" className="text-[10px]">{(myCohort as any).course_cohorts?.status}</Badge>
              </div>
            )}

            {/* Sessions */}
            {mySessions.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  <Calendar className="h-3 w-3 inline me-1" />{isAr ? "الجلسات" : "Sessions"}
                </p>
                {mySessions.slice(0, 5).map((s: any) => {
                  const att = myAttendanceMap[s.id];
                  return (
                    <div key={s.id} className="flex items-center gap-2 py-1 text-xs">
                      <span className="truncate flex-1">{s.title}</span>
                      <span className="text-muted-foreground text-[10px]">{new Date(s.start_at).toLocaleDateString()}</span>
                      {att && (
                        <Badge variant={att === "present" ? "default" : "secondary"} className="text-[9px] px-1 py-0">
                          {att}
                        </Badge>
                      )}
                      {s.meeting_url && (
                        <a href={s.meeting_url} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-3 w-3 text-primary" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Milestones */}
            {(structureItems?.milestones?.length ?? 0) > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  <Target className="h-3 w-3 inline me-1" />{isAr ? "المعالم" : "Milestones"}
                </p>
                {structureItems!.milestones.map((m: any) => (
                  <div key={m.id} className="flex items-center gap-2 py-1 text-xs">
                    <Circle className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                    <span className="truncate">{isAr ? (m.title_ar || m.title_en) : m.title_en}</span>
                    {m.is_required && <span className="text-[9px] text-destructive">*</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Assessments */}
            {(structureItems?.assessments?.length ?? 0) > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  <ClipboardCheck className="h-3 w-3 inline me-1" />{isAr ? "التقييمات" : "Assessments"}
                </p>
                {structureItems!.assessments.map((a: any) => {
                  const attempts = myAttempts[a.id] ?? [];
                  const latest = attempts[0];
                  const canStart = !latest || (latest.status === "failed" && a.max_attempts && attempts.length < a.max_attempts);
                  const isInProgress = latest?.status === "in_progress";
                  return (
                    <div key={a.id} className="flex items-center gap-2 py-1 text-xs">
                      {latest?.status === "passed" ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className="truncate flex-1">{isAr ? (a.title_ar || a.title_en) : a.title_en}</span>
                      {latest ? (
                        <div className="flex items-center gap-1">
                          {latest.score != null && <span className="text-[9px] text-muted-foreground">{latest.score}{a.passing_score ? `/${a.passing_score}` : ""}</span>}
                          <Badge variant={latest.status === "passed" ? "default" : "secondary"} className="text-[9px] px-1 py-0">
                            {latest.status}
                          </Badge>
                          {isInProgress && (
                            <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5"
                              disabled={startingAttempt === a.id}
                              onClick={async () => {
                                setStartingAttempt(a.id);
                                await supabase.from("assessment_attempts").update({
                                  status: "submitted",
                                  submitted_at: new Date().toISOString(),
                                }).eq("id", latest.id);
                                qc.invalidateQueries({ queryKey: ["my-attempts"] });
                                toast.success(isAr ? "تم الإرسال" : "Submitted");
                                setStartingAttempt(null);
                              }}>
                              <Send className="h-2.5 w-2.5 me-0.5" />{isAr ? "إرسال" : "Submit"}
                            </Button>
                          )}
                        </div>
                      ) : canStart || !latest ? (
                        <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5"
                          disabled={startingAttempt === a.id}
                          onClick={async () => {
                            if (!user) return;
                            setStartingAttempt(a.id);
                            const { error } = await supabase.from("assessment_attempts").insert({
                              assessment_id: a.id,
                              user_id: user.id,
                              status: "in_progress",
                              attempt_number: (attempts.length || 0) + 1,
                              started_at: new Date().toISOString(),
                            });
                            if (error) toast.error(error.message);
                            else {
                              toast.success(isAr ? "تم البدء" : "Started");
                              qc.invalidateQueries({ queryKey: ["my-attempts"] });
                            }
                            setStartingAttempt(null);
                          }}>
                          <Play className="h-2.5 w-2.5 me-0.5" />{isAr ? "بدء" : "Start"}
                        </Button>
                      ) : null}
                      {latest?.feedback && (
                        <span className="text-[9px] text-muted-foreground italic truncate max-w-[60px]" title={latest.feedback}>💬</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Projects */}
            {(structureItems?.projects?.length ?? 0) > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  <FolderKanban className="h-3 w-3 inline me-1" />{isAr ? "المشاريع" : "Projects"}
                </p>
                {structureItems!.projects.map((p: any) => {
                  const sub = mySubmissions[p.id];
                  const review = myProjectReviews[p.id];
                  return (
                    <div key={p.id} className="space-y-0.5">
                      <div className="flex items-center gap-2 py-1 text-xs">
                        {sub?.submission_status === "approved" || review?.review_status === "approved" ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                        ) : (
                          <Circle className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                        )}
                        <span className="truncate flex-1">{isAr ? (p.title_ar || p.title_en) : p.title_en}</span>
                        {sub ? (
                          <Badge variant={sub.submission_status === "approved" ? "default" : "secondary"} className="text-[9px] px-1 py-0">
                            {sub.submission_status}
                          </Badge>
                        ) : (
                          <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5" onClick={() => setSubmitProjectId(p.id)}>
                            <Send className="h-2.5 w-2.5 me-0.5" />{isAr ? "إرسال" : "Submit"}
                          </Button>
                        )}
                        {p.is_capstone && <span className="text-[9px] text-primary font-medium">★</span>}
                      </div>
                      {review && (
                        <div className="ms-5 text-[10px] text-muted-foreground space-y-0.5">
                          {review.score != null && <span className="me-2 font-medium">{isAr ? "الدرجة:" : "Score:"} {review.score}</span>}
                          {review.feedback && <p className="italic line-clamp-2" title={review.feedback}>💬 {review.feedback}</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {/* Readiness Signals */}
            {(() => {
              const attCount = Object.values(myAttendanceMap).filter(s => s === "present").length;
              const reqSessions = mySessions.filter((s: any) => s.attendance_required).length;
              const passedAssessments = assessmentIds.filter((aid: string) => (myAttempts[aid] ?? [])[0]?.status === "passed").length;
              const approvedProjects = projectIds.filter((pid: string) => {
                const sub = mySubmissions[pid];
                const rev = myProjectReviews[pid];
                return sub?.submission_status === "approved" || rev?.review_status === "approved";
              }).length;
              const signals = computeReadiness({
                lessonsCompleted: completedCount,
                lessonsTotal: allLessons.length,
                attendedSessions: attCount,
                requiredSessions: reqSessions,
                assessmentsPassed: passedAssessments,
                assessmentsTotal: assessmentIds.length,
                projectsApproved: approvedProjects,
                projectsTotal: projectIds.length,
                supportsLiveSessions: mySessions.length > 0,
                supportsAssessments: assessmentIds.length > 0,
                supportsProjects: projectIds.length > 0,
              });
              return signals.overall_readiness_status !== "not_started" ? (
                <div className="border-t border-border px-4 py-3">
                  <ReadinessSignalCard signals={signals} />
                </div>
              ) : null;
            })()}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  return (
    <>
      <SEO title={`${courseName} — ${isAr ? "تعلم" : "Learn"}`} />

      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-80 border-r border-border bg-card flex-col shrink-0">
          <SidebarContent_ />
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center gap-2 p-3 border-b border-border bg-card">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side={isAr ? "right" : "left"} className="p-0 w-80">
                <SidebarContent_ />
              </SheetContent>
            </Sheet>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{courseName}</p>
              <Progress value={progressPct} className="h-1.5 mt-1 w-32" />
            </div>
          </div>

          {activeLesson ? (
            <div className="flex-1 flex flex-col">
              {/* Content area */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto p-4 lg:p-8">
                  {/* Video content */}
                  {activeLesson.content_type === "video" && activeLesson.video_url && (() => {
                    const embedUrl = getEmbedUrl(activeLesson.video_url);
                    return embedUrl ? (
                      <div className="aspect-video rounded-xl overflow-hidden bg-black mb-6">
                        <iframe
                          src={embedUrl}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={activeLesson.title_en}
                        />
                      </div>
                    ) : (
                      <div className="aspect-video rounded-xl overflow-hidden bg-black mb-6">
                        <video ref={videoRef} src={activeLesson.video_url} controls className="w-full h-full" />
                      </div>
                    );
                  })()}

                  {/* Text content */}
                  {activeLesson.content_type === "text" && (
                    <div
                      className="prose prose-lg dark:prose-invert max-w-none mb-6"
                      dangerouslySetInnerHTML={{
                        __html: isAr
                          ? (activeLesson.text_content_ar || activeLesson.text_content || "")
                          : (activeLesson.text_content || ""),
                      }}
                    />
                  )}

                  {/* Lesson info */}
                  <div className="mb-6">
                    <h1 className="text-2xl font-bold mb-2">
                      {isAr ? (activeLesson.title_ar || activeLesson.title_en) : activeLesson.title_en}
                    </h1>
                    {(activeLesson.description_en || activeLesson.description_ar) && (
                      <p className="text-muted-foreground">
                        {isAr ? (activeLesson.description_ar || activeLesson.description_en) : activeLesson.description_en}
                      </p>
                    )}
                  </div>

                  {/* Attachments */}
                  {activeLesson.attachment_urls?.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-sm mb-2">{isAr ? "المرفقات" : "Attachments"}</h3>
                      <div className="flex flex-wrap gap-2">
                        {activeLesson.attachment_urls.map((url: string, i: number) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors">
                            <Download className="h-4 w-4" />
                            {isAr ? `مرفق ${i + 1}` : `Attachment ${i + 1}`}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mark complete button */}
                  {!progressMap[activeLesson.id]?.is_completed ? (
                    <Button onClick={handleMarkComplete} disabled={completing} className="gradient-brand text-primary-foreground rounded-xl" size="lg">
                      {completing ? <Loader2 className="h-4 w-4 animate-spin ltr:me-2 rtl:ms-2" /> : <CheckCircle2 className="h-4 w-4 ltr:me-2 rtl:ms-2" />}
                      {isAr ? "تحديد كمكتمل" : "Mark as Complete"}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">{isAr ? "مكتمل" : "Completed"}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation bar */}
              <div className="border-t border-border bg-card p-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => activeLessonIndex > 0 && setActiveLessonId(allLessons[activeLessonIndex - 1].id)}
                  disabled={activeLessonIndex <= 0}
                  className="rounded-xl"
                >
                  <ChevronLeft className="icon-flip-rtl h-4 w-4 ltr:me-1 rtl:ms-1" />
                  {isAr ? "السابق" : "Previous"}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {activeLessonIndex + 1} / {allLessons.length}
                </span>
                <Button
                  variant="outline"
                  onClick={() => activeLessonIndex < allLessons.length - 1 && setActiveLessonId(allLessons[activeLessonIndex + 1].id)}
                  disabled={activeLessonIndex >= allLessons.length - 1}
                  className="rounded-xl"
                >
                  {isAr ? "التالي" : "Next"}
                  <ChevronRight className="icon-flip-rtl h-4 w-4 ltr:ms-1 rtl:me-1" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p>{isAr ? "اختر درساً للبدء" : "Select a lesson to start"}</p>
            </div>
          )}
        </main>
      </div>

      {/* Completion modal */}
      <Dialog open={showCompletion} onOpenChange={setShowCompletion}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="sr-only">{isAr ? "تهانينا!" : "Congratulations!"}</DialogTitle>
          </DialogHeader>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
            <GraduationCap className="h-20 w-20 mx-auto text-primary mb-4" />
          </motion.div>
          <h2 className="text-2xl font-bold">{isAr ? "تهانينا! 🎉" : "Congratulations! 🎉"}</h2>
          <p className="text-muted-foreground mt-2">
            {isAr
              ? `لقد أكملت دورة "${courseName}" بنجاح!`
              : `You've successfully completed "${courseName}"!`}
          </p>

          {/* Review form if not reviewed */}
          {!myReview && (
            <div className="mt-6 text-start border-t border-border pt-4">
              <h3 className="font-semibold text-sm mb-3">{isAr ? "قيّم تجربتك" : "Rate your experience"}</h3>
              <div className="flex items-center gap-1 mb-3 justify-center">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setReviewRating(s)} className="focus:outline-none">
                    <Star className={`h-7 w-7 cursor-pointer transition-colors ${s <= reviewRating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`} />
                  </button>
                ))}
              </div>
              <Textarea placeholder={isAr ? "شاركنا رأيك..." : "Share your thoughts..."} value={reviewText} onChange={e => setReviewText(e.target.value)} maxLength={500} className="mb-3" />
              <Button onClick={handleSubmitReview} disabled={!reviewRating || submittingReview} className="w-full gradient-brand text-primary-foreground rounded-xl">
                {submittingReview && <Loader2 className="h-4 w-4 animate-spin ltr:me-2 rtl:ms-2" />}
                {isAr ? "إرسال التقييم" : "Submit Review"}
              </Button>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <Link to={`/academy/courses/${slug}`} className="flex-1">
              <Button variant="outline" className="w-full rounded-xl">{isAr ? "العودة للدورة" : "Back to Course"}</Button>
            </Link>
            <Link to="/academy/courses" className="flex-1">
              <Button className="w-full gradient-brand text-primary-foreground rounded-xl">{isAr ? "تصفح الدورات" : "Browse Courses"}</Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* Project submission dialog */}
      <Dialog open={!!submitProjectId} onOpenChange={(o) => { if (!o) setSubmitProjectId(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isAr ? "إرسال المشروع" : "Submit Project"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">{isAr ? "رابط (اختياري)" : "URL (optional)"}</label>
              <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={submitUrl} onChange={(e) => setSubmitUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{isAr ? "نص الإرسال" : "Submission text"}</label>
              <Textarea value={submitText} onChange={(e) => setSubmitText(e.target.value)} rows={4} placeholder={isAr ? "اكتب هنا..." : "Write here..."} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setSubmitProjectId(null)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleSubmitProject} disabled={submittingProject}>
              {submittingProject && <Loader2 className="h-4 w-4 animate-spin me-1" />}
              <Send className="h-4 w-4 me-1" />{isAr ? "إرسال" : "Submit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
