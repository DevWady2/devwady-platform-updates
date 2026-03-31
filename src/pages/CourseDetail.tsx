import { useParams, Link, useNavigate } from "react-router-dom";
import { legacyToDeliveryMode, DELIVERY_MODE_LABELS, PRODUCT_TYPE_BADGE, isProductType } from "@/features/academy/learningModel";
import { useCourseStructureCounts } from "@/portals/academy/hooks/useStudentCourseStructure";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import SEO from "@/components/SEO";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import {
  ArrowRight, Clock, BookOpen, Play, FileText, Star,
  Users, Globe, Lock, CheckCircle2, Loader2, GraduationCap, User,
  Target, ClipboardCheck, FolderKanban, Calendar,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export default function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isAr = lang === "ar";

  const [enrolling, setEnrolling] = useState(false);
  const [previewLesson, setPreviewLesson] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Fetch course with modules, lessons, reviews
  const { data: course, isLoading } = useQuery({
    queryKey: ["course-detail", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_courses")
        .select("*, course_modules(*, course_lessons(id, title_en, title_ar, is_preview, content_type, video_duration_seconds, sort_order)), course_reviews(rating)")
        .eq("slug", slug!)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Structure counts (published only — safe for public)
  const { data: structureCounts } = useCourseStructureCounts(course?.id);


  const { data: enrollmentCount = 0 } = useQuery({
    queryKey: ["course-enrollment-count", course?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("course_enrollments")
        .select("id", { count: "exact", head: true })
        .eq("course_id", course!.id)
        .eq("status", "active");
      return count ?? 0;
    },
    enabled: !!course?.id,
  });

  // Check if current user is enrolled
  const { data: myEnrollment } = useQuery({
    queryKey: ["my-enrollment", course?.id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("course_enrollments")
        .select("id, status")
        .eq("course_id", course!.id)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!course?.id && !!user?.id,
  });

  // Fetch instructor profile if instructor_id exists
  const { data: instructor } = useQuery({
    queryKey: ["course-instructor", course?.instructor_id],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_profile_display_by_id" as any, { p_user_id: course!.instructor_id! });
      const rows = data as any[];
      return rows && rows.length > 0 ? rows[0] : null;
    },
    enabled: !!course?.instructor_id,
  });

  // Fetch reviews with user names
  const { data: reviews = [] } = useQuery({
    queryKey: ["course-reviews-detail", course?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("course_reviews")
        .select("*")
        .eq("course_id", course!.id)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!course?.id,
  });

  // Check if user already reviewed
  const { data: myReview } = useQuery({
    queryKey: ["my-course-review", course?.id, user?.id],
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

  // Compute stats
  const stats = useMemo(() => {
    if (!course) return { avgRating: 0, totalLessons: 0, totalDuration: 0 };
    const ratings = (course.course_reviews as any[]) || [];
    const avg = ratings.length ? ratings.reduce((s: number, r: any) => s + r.rating, 0) / ratings.length : 0;
    const modules = (course.course_modules as any[]) || [];
    let lessons = 0;
    let duration = 0;
    modules.forEach((m: any) => {
      const mLessons = m.course_lessons || [];
      lessons += mLessons.length;
      mLessons.forEach((l: any) => { duration += l.video_duration_seconds || 0; });
    });
    return { avgRating: avg, totalLessons: lessons, totalDuration: Math.round(duration / 3600 * 10) / 10 };
  }, [course]);

  const isEnrolled = myEnrollment?.status === "active";
  const isFree = course?.is_free || !course?.price_usd || Number(course?.price_usd) <= 0;

  const handleEnrollFree = async () => {
    if (!user) { navigate(`/auth/academy`); return; }
    setEnrolling(true);
    const { error } = await supabase.from("course_enrollments").insert({
      course_id: course!.id,
      user_id: user.id,
      status: "active",
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(isAr ? "تم التسجيل بنجاح!" : "Enrolled successfully!");
      qc.invalidateQueries({ queryKey: ["my-enrollment", course!.id] });
    }
    setEnrolling(false);
  };

  const handleEnrollPaid = async () => {
    if (!user) { navigate(`/auth/academy`); return; }
    setEnrolling(true);
    const { data: checkoutData, error } = await supabase.functions.invoke("create-checkout", {
      body: {
        type: "course_purchase",
        reference_id: course!.id,
        amount_usd: Number(course!.price_usd),
        description: `${isAr ? "دورة:" : "Course:"} ${isAr ? (course!.title_ar || course!.title_en) : course!.title_en}`,
        customer_email: user.email,
        user_id: user.id,
        metadata: { course_name: course!.title_en },
        success_path: "/payment/success",
        cancel_path: "/payment/cancel",
      },
    });
    if (error || !checkoutData) {
      toast.error(isAr ? "فشل إنشاء جلسة الدفع" : "Failed to create payment session");
      setEnrolling(false);
      return;
    }
    if (checkoutData.dev_mode) {
      // Dev mode - enroll directly
      await supabase.from("course_enrollments").insert({ course_id: course!.id, user_id: user.id, status: "active" });
      toast.success(isAr ? "تم التسجيل (وضع التطوير)" : "Enrolled (dev mode)");
      qc.invalidateQueries({ queryKey: ["my-enrollment", course!.id] });
      setEnrolling(false);
      return;
    }
    window.location.href = checkoutData.checkout_url;
  };

  const handleSubmitReview = async () => {
    if (!reviewRating || !user || !myEnrollment) return;
    setSubmittingReview(true);
    const { error } = await supabase.from("course_reviews").insert({
      course_id: course!.id,
      user_id: user.id,
      enrollment_id: myEnrollment.id,
      rating: reviewRating,
      review: reviewText || null,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(isAr ? "شكراً لتقييمك!" : "Thanks for your review!");
      qc.invalidateQueries({ queryKey: ["my-course-review", course!.id] });
      qc.invalidateQueries({ queryKey: ["course-reviews-detail", course!.id] });
      setReviewRating(0);
      setReviewText("");
    }
    setSubmittingReview(false);
  };

  if (isLoading) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-4 space-y-6">
          <Skeleton className="h-12 w-96" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </section>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">{isAr ? "الدورة غير موجودة" : "Course Not Found"}</h1>
        <Link to="/academy/courses"><Button>{t("training.viewCourses")}</Button></Link>
      </div>
    );
  }

  const name = isAr ? (course.title_ar || course.title_en) : course.title_en;
  const desc = isAr ? (course.description_ar || course.description_en) : course.description_en;
  const modules = ((course.course_modules as any[]) || []).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));

  const formatDuration = (s: number) => {
    const m = Math.round(s / 60);
    return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
  };

  return (
    <>
      <SEO title={name} />

      {/* Hero */}
      <section className="py-16 lg:py-24 relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${course.color || "from-primary to-secondary"} opacity-10`} />
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Left content */}
            <div className="lg:col-span-2">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Link to="/academy/courses" className="text-sm text-primary hover:underline mb-4 inline-block">
                  ← {t("training.viewCourses")}
                </Link>
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  {course.level_en && <Badge variant="outline">{isAr ? (course.level_ar || course.level_en) : course.level_en}</Badge>}
                  {(course as any).language && <Badge variant="outline" className="gap-1"><Globe className="h-3 w-3" />{(course as any).language === "ar" ? "العربية" : "English"}</Badge>}
                  {isProductType((course as any).learning_product_type) && (
                    <Badge variant="secondary">{isAr ? PRODUCT_TYPE_BADGE[(course as any).learning_product_type as keyof typeof PRODUCT_TYPE_BADGE].ar : PRODUCT_TYPE_BADGE[(course as any).learning_product_type as keyof typeof PRODUCT_TYPE_BADGE].en}</Badge>
                  )}
                  {(() => { const dm = (course as any).delivery_mode || ((course as any).course_type ? legacyToDeliveryMode((course as any).course_type) : null); if (!dm) return null; const lbl = DELIVERY_MODE_LABELS[dm as keyof typeof DELIVERY_MODE_LABELS]; return lbl ? <Badge variant="secondary">{isAr ? lbl.ar : lbl.en}</Badge> : null; })()}
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-5xl">{course.emoji}</span>
                  <h1 className="text-3xl lg:text-4xl font-bold">{name}</h1>
                </div>
                {desc && <p className="text-muted-foreground text-lg max-w-2xl mt-4">{desc}</p>}

                {/* Instructor */}
                {instructor && (
                  <div className="flex items-center gap-3 mt-6 p-3 bg-card/80 rounded-xl border border-border inline-flex">
                    {instructor.avatar_url ? (
                      <img loading="lazy" src={instructor.avatar_url} alt={instructor.full_name || ""} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><User className="h-5 w-5 text-primary" /></div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">{isAr ? "المدرب" : "Instructor"}</p>
                      <p className="font-medium text-sm">{instructor.full_name}</p>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Stats bar */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex flex-wrap gap-4 mt-8">
                <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{enrollmentCount} {isAr ? "طالب" : "Students"}</span>
                </div>
                {stats.avgRating > 0 && (
                  <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-medium">{stats.avgRating.toFixed(1)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{stats.totalLessons} {isAr ? "درس" : "Lessons"}</span>
                </div>
                {stats.totalDuration > 0 && (
                  <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{stats.totalDuration}h</span>
                  </div>
                )}
                {structureCounts && structureCounts.assessments > 0 && (
                  <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border">
                    <ClipboardCheck className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{structureCounts.assessments} {isAr ? "تقييم" : "Assessments"}</span>
                  </div>
                )}
                {structureCounts && structureCounts.projects > 0 && (
                  <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border">
                    <FolderKanban className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{structureCounts.projects} {isAr ? "مشروع" : "Projects"}</span>
                  </div>
                )}
                {structureCounts && structureCounts.milestones > 0 && (
                  <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{structureCounts.milestones} {isAr ? "معلم" : "Milestones"}</span>
                  </div>
                )}
                {structureCounts && structureCounts.sessions > 0 && (
                  <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{structureCounts.sessions} {isAr ? "جلسة مباشرة" : "Live Sessions"}</span>
                  </div>
                )}
                {structureCounts && structureCounts.cohorts > 0 && (
                  <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{structureCounts.cohorts} {isAr ? "مجموعة" : (structureCounts.cohorts === 1 ? "Cohort" : "Cohorts")}</span>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Pricing card - sticky sidebar */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="lg:sticky lg:top-24 self-start">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
                {(course as any).thumbnail_url ? (
                  <img loading="lazy" src={(course as any).thumbnail_url} alt={name} className="w-full h-40 object-cover rounded-xl mb-4" />
                ) : (
                  <div className={`w-full h-40 rounded-xl mb-4 bg-gradient-to-br ${course.color || "from-primary to-secondary"} flex items-center justify-center`}>
                    <GraduationCap className="h-16 w-16 text-primary-foreground/50" />
                  </div>
                )}

                <div className="text-center mb-4">
                  {isFree ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-lg px-4 py-1">{isAr ? "مجاني" : "Free"}</Badge>
                  ) : (
                    <p className="text-3xl font-bold">${Number(course.price_usd).toFixed(2)}</p>
                  )}
                </div>

                {isEnrolled ? (
                  <Link to={`/learn/${slug}`}>
                    <Button className="w-full gradient-brand text-primary-foreground rounded-xl" size="lg">
                      <Play className="h-4 w-4 ltr:me-2 rtl:ms-2" />
                      {isAr ? "متابعة التعلم" : "Continue Learning"}
                    </Button>
                  </Link>
                ) : !user ? (
                  <Link to="/auth/academy">
                    <Button className="w-full gradient-brand text-primary-foreground rounded-xl" size="lg">
                      {isAr ? "سجل للتسجيل" : "Sign up to Enroll"}
                    </Button>
                  </Link>
                ) : isFree ? (
                  <Button className="w-full gradient-brand text-primary-foreground rounded-xl" size="lg" onClick={handleEnrollFree} disabled={enrolling}>
                    {enrolling ? <Loader2 className="h-4 w-4 animate-spin ltr:me-2 rtl:ms-2" /> : <GraduationCap className="h-4 w-4 ltr:me-2 rtl:ms-2" />}
                    {isAr ? "سجل مجاناً" : "Enroll for Free"}
                  </Button>
                ) : (
                  <Button className="w-full gradient-brand text-primary-foreground rounded-xl" size="lg" onClick={handleEnrollPaid} disabled={enrolling}>
                    {enrolling ? <Loader2 className="h-4 w-4 animate-spin ltr:me-2 rtl:ms-2" /> : <Lock className="h-4 w-4 ltr:me-2 rtl:ms-2" />}
                    {isAr ? `سجل — $${Number(course.price_usd).toFixed(2)}` : `Enroll — $${Number(course.price_usd).toFixed(2)}`}
                  </Button>
                )}

                {course.duration_en && (
                  <div className="mt-4 text-sm text-muted-foreground text-center">
                    <Clock className="h-3.5 w-3.5 inline ltr:me-1 rtl:ms-1" />
                    {isAr ? (course.duration_ar || course.duration_en) : course.duration_en}
                  </div>
                )}

                {/* Outcomes */}
                {(course.outcomes_en?.length ?? 0) > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-sm mb-3">{isAr ? "ماذا ستتعلم" : "What you'll learn"}</h3>
                    <ul className="space-y-2">
                      {(isAr ? (course.outcomes_ar?.length ? course.outcomes_ar : course.outcomes_en) : course.outcomes_en)?.map((o, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Curriculum */}
      {modules.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">{isAr ? "محتوى الدورة" : "Course Curriculum"}</h2>
            <div className="space-y-4">
              {modules.map((mod: any, i: number) => {
                const lessons = ((mod.course_lessons as any[]) || []).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
                return (
                  <motion.div key={mod.id} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                    className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="p-5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${course.color || "from-primary to-secondary"} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                          {String(i + 1).padStart(2, "0")}
                        </div>
                        <div>
                          <h3 className="font-semibold">{isAr ? (mod.title_ar || mod.title_en) : mod.title_en}</h3>
                          <p className="text-xs text-muted-foreground">{lessons.length} {isAr ? "دروس" : "lessons"}{mod.duration ? ` · ${mod.duration}` : ""}</p>
                        </div>
                      </div>
                    </div>
                    {lessons.length > 0 && (
                      <div className="border-t border-border">
                        {lessons.map((lesson: any) => (
                          <div key={lesson.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors border-b border-border last:border-0">
                            <div className="flex items-center gap-3">
                              {lesson.content_type === "video" ? <Play className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-primary" />}
                              <span className="text-sm">{isAr ? (lesson.title_ar || lesson.title_en) : lesson.title_en}</span>
                              {lesson.is_preview && <Badge variant="outline" className="text-xs">{isAr ? "معاينة" : "Preview"}</Badge>}
                            </div>
                            <div className="flex items-center gap-2">
                              {lesson.video_duration_seconds && <span className="text-xs text-muted-foreground">{formatDuration(lesson.video_duration_seconds)}</span>}
                              {lesson.is_preview ? (
                                <Button variant="ghost" size="sm" className="text-xs" onClick={() => setPreviewLesson(lesson)}><Play className="h-3 w-3 ltr:me-1 rtl:ms-1" />{isAr ? "معاينة" : "Preview"}</Button>
                              ) : !isEnrolled ? (
                                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Instructor Card */}
      {instructor && (
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">{isAr ? "المدرب" : "Instructor"}</h2>
            <div className="bg-card rounded-2xl border border-border p-6 flex items-start gap-5">
              {instructor.avatar_url ? (
                <img loading="lazy" src={instructor.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><User className="h-8 w-8 text-primary" /></div>
              )}
              <div>
                <h3 className="font-bold text-lg">{instructor.full_name}</h3>
                {instructor.bio && <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{instructor.bio}</p>}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Reviews */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8">{isAr ? "التقييمات" : "Reviews"}</h2>

          {/* Write a review */}
          {isEnrolled && !myReview && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl border border-border p-6 mb-8">
              <h3 className="font-semibold mb-4">{isAr ? "اكتب تقييماً" : "Write a review"}</h3>
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setReviewRating(s)} className="focus:outline-none">
                    <Star className={`h-7 w-7 cursor-pointer transition-colors ${s <= reviewRating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`} />
                  </button>
                ))}
              </div>
              <Textarea placeholder={isAr ? "شاركنا رأيك..." : "Share your thoughts..."} value={reviewText} onChange={e => setReviewText(e.target.value)} maxLength={500} className="mb-3" />
              <Button onClick={handleSubmitReview} disabled={!reviewRating || submittingReview} className="gradient-brand text-primary-foreground rounded-xl">
                {submittingReview && <Loader2 className="h-4 w-4 animate-spin ltr:me-2 rtl:ms-2" />}
                {isAr ? "إرسال التقييم" : "Submit Review"}
              </Button>
            </motion.div>
          )}

          {myReview && (
            <div className="bg-primary/5 rounded-xl border border-primary/20 p-4 mb-6">
              <div className="flex items-center gap-1 mb-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={`h-4 w-4 ${s <= (myReview.rating || 0) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/20"}`} />
                ))}
              </div>
              {myReview.review && <p className="text-sm text-muted-foreground mt-1">{myReview.review}</p>}
              <p className="text-xs text-muted-foreground mt-2">{isAr ? "تقييمك" : "Your review"}</p>
            </div>
          )}

          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.filter((r: any) => r.user_id !== user?.id).map((r: any) => (
                <div key={r.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`h-4 w-4 ${s <= r.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/20"}`} />
                    ))}
                  </div>
                  {r.review && <p className="text-sm">{r.review}</p>}
                </div>
              ))}
            </div>
          ) : !myReview && (
            <p className="text-muted-foreground text-sm">{isAr ? "لا توجد تقييمات بعد" : "No reviews yet"}</p>
          )}
        </div>
      </section>

      {/* CTA */}
      {!isEnrolled && (
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
              className="gradient-brand rounded-3xl p-10 lg:p-16 text-primary-foreground">
              <h2 className="text-3xl font-bold mb-4">{isAr ? "جاهز للبدء؟" : "Ready to Start?"}</h2>
              <p className="text-lg opacity-90 mb-8">{isAr ? "سجل الآن وابدأ رحلتك" : "Enroll now and start your learning journey"}</p>
              {!user ? (
                <Link to="/auth/academy">
                  <Button size="lg" variant="secondary" className="rounded-full px-8">{isAr ? "سجل الآن" : "Sign up to Enroll"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" /></Button>
                </Link>
              ) : isFree ? (
                <Button size="lg" variant="secondary" className="rounded-full px-8" onClick={handleEnrollFree} disabled={enrolling}>
                  {isAr ? "سجل مجاناً" : "Enroll for Free"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
                </Button>
              ) : (
                <Button size="lg" variant="secondary" className="rounded-full px-8" onClick={handleEnrollPaid} disabled={enrolling}>
                  {isAr ? `سجل — $${Number(course.price_usd).toFixed(2)}` : `Enroll — $${Number(course.price_usd).toFixed(2)}`} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
                </Button>
              )}
            </motion.div>
          </div>
        </section>
      )}

      {/* Preview lesson modal */}
      <Dialog open={!!previewLesson} onOpenChange={(o) => !o && setPreviewLesson(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewLesson && (isAr ? (previewLesson.title_ar || previewLesson.title_en) : previewLesson.title_en)}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{isAr ? "معاينة الدرس — سجل للوصول الكامل" : "Lesson preview — Enroll for full access"}</p>
        </DialogContent>
      </Dialog>

      {/* Enrolling overlay */}
      {enrolling && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg font-medium">{isAr ? "جارٍ التسجيل..." : "Processing enrollment..."}</p>
          </div>
        </div>
      )}
    </>
  );
}
