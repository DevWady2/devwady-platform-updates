/**
 * Standalone "My Learning" page for students (website-first UX).
 * Tabs for active/completed, search, animated transitions.
 */
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { BookOpen, Award, Clock, ArrowLeft, ArrowRight, CheckCircle2, Search, GraduationCap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "active" | "completed" | "all";

export default function MyLearning() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const [tab, setTab] = useState<Tab>("active");
  const [search, setSearch] = useState("");

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ["my-learning-page", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_enrollments")
        .select("*, training_courses(title_en, title_ar, slug, thumbnail_url, total_lessons, duration_en)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: progressData = [] } = useQuery({
    queryKey: ["my-learning-progress", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lesson_progress")
        .select("enrollment_id, is_completed")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const getProgress = (enrollmentId: string, totalLessons: number) => {
    if (totalLessons === 0) return 0;
    const completed = progressData.filter((p: any) => p.enrollment_id === enrollmentId && p.is_completed).length;
    return Math.round((completed / totalLessons) * 100);
  };

  const active = enrollments.filter((e: any) => e.status === "active");
  const completed = enrollments.filter((e: any) => e.status === "completed");

  const displayed = useMemo(() => {
    const base = tab === "active" ? active : tab === "completed" ? completed : enrollments;
    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter((e: any) => {
      const c = e.training_courses;
      return c?.title_en?.toLowerCase().includes(q) || c?.title_ar?.includes(q);
    });
  }, [tab, search, active, completed, enrollments]);

  const tabs: { key: Tab; label_en: string; label_ar: string; count: number }[] = [
    { key: "active", label_en: "Active", label_ar: "نشطة", count: active.length },
    { key: "completed", label_en: "Completed", label_ar: "مكتملة", count: completed.length },
    { key: "all", label_en: "All", label_ar: "الكل", count: enrollments.length },
  ];

  return (
    <>
      <SEO title={isAr ? "تعلّمي" : "My Learning"} description={isAr ? "تتبع تقدمك التعليمي" : "Track your learning progress"} />
      <section className="py-10">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link to="/academy/courses" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
                <ArrowLeft className="h-3 w-3 icon-flip-rtl" /> {isAr ? "العودة للدورات" : "Back to Courses"}
              </Link>
              <h1 className="text-2xl font-bold">{isAr ? "تعلّمي" : "My Learning"}</h1>
              <p className="text-sm text-muted-foreground mt-1">{isAr ? "تتبع دوراتك وتقدمك التعليمي" : "Track your courses and learning progress"}</p>
            </div>
            <Link to="/academy/courses">
              <Button size="sm" className="rounded-full">
                <BookOpen className="h-4 w-4 me-1.5" />{isAr ? "تصفح الدورات" : "Browse Courses"}
              </Button>
            </Link>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{active.length}</p><p className="text-xs text-muted-foreground">{isAr ? "نشطة" : "Active"}</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{completed.length}</p><p className="text-xs text-muted-foreground">{isAr ? "مكتملة" : "Completed"}</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{enrollments.length}</p><p className="text-xs text-muted-foreground">{isAr ? "إجمالي" : "Total"}</p></CardContent></Card>
          </div>

          {/* Tabs + Search */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
            <div className="flex gap-1 bg-muted/50 rounded-full p-1">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    tab === t.key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isAr ? t.label_ar : t.label_en}
                  <span className="ms-1.5 text-[10px] opacity-60">({t.count})</span>
                </button>
              ))}
            </div>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isAr ? "بحث في الدورات..." : "Search courses..."}
                className="ps-9 h-8 text-xs rounded-full"
              />
            </div>
          </div>

          {/* Course list */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tab + search}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {isLoading ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />)}</div>
              ) : displayed.length === 0 ? (
                <div className="text-center py-16">
                  <GraduationCap className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="font-medium">
                    {search ? (isAr ? "لا توجد نتائج" : "No results found") : (isAr ? "لم تسجل في أي دورة بعد" : "No courses yet")}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {search
                      ? (isAr ? "جرب بحثاً مختلفاً" : "Try a different search")
                      : (isAr ? "تصفح الدورات المتاحة وابدأ التعلم" : "Browse available courses and start learning")}
                  </p>
                  {!search && (
                    <Link to="/academy/courses">
                      <Button variant="outline" size="sm" className="mt-4 rounded-full">
                        <BookOpen className="h-3.5 w-3.5 me-1" />{isAr ? "تصفح الدورات" : "Browse Courses"}
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                displayed.map((e: any, i: number) => {
                  const course = e.training_courses;
                  const pct = getProgress(e.id, course?.total_lessons ?? 0);
                  const isCompleted = e.status === "completed";
                  return (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {course?.thumbnail_url ? (
                              <img src={course.thumbnail_url} alt="" className="h-14 w-20 rounded-md object-cover flex-shrink-0" />
                            ) : (
                              <div className="h-14 w-20 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                                {isCompleted ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> : <BookOpen className="h-6 w-6 text-primary" />}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{isAr ? course?.title_ar : course?.title_en}</p>
                              {isCompleted ? (
                                <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  {isAr ? "مكتمل في" : "Completed"} {e.completed_at ? new Date(e.completed_at).toLocaleDateString() : "—"}
                                </p>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <Progress value={pct} className="h-1.5 flex-1" />
                                    <span className="text-xs font-bold">{pct}%</span>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />{course?.duration_en ?? "—"}
                                  </p>
                                </>
                              )}
                            </div>
                            {isCompleted ? (
                              <Link to={`/certificate/${e.id}`}>
                                <Button size="sm" variant="outline" className="text-xs h-8 rounded-full">
                                  <Award className="h-3 w-3 me-1" />{isAr ? "الشهادة" : "Certificate"}
                                </Button>
                              </Link>
                            ) : (
                              <Link to={`/learn/${course?.slug}`}>
                                <Button size="sm" variant="outline" className="text-xs h-8 rounded-full">
                                  {isAr ? "متابعة" : "Resume"} <ArrowRight className="h-3 w-3 ms-1 icon-flip-rtl" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </>
  );
}
