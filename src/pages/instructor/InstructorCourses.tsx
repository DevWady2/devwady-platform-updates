/**
 * /instructor/courses — Website-layer owner overview of instructor's listed courses.
 * Shows owner-mode cards (status, students, ratings) — NOT a dashboard page.
 */
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorCourses } from "@/portals/academy/hooks/useInstructorCourses";
import {
  BookOpen, Users, MessageSquare, ArrowRight, FileEdit, Bot, Radio,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  withSampleFallback,
  MOCK_INSTRUCTOR_COURSES,
} from "@/data/mockData";
import SampleDataBadge from "@/components/SampleDataBadge";
import SEO from "@/components/SEO";

export default function InstructorCourses() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const { data: rawCourses, isLoading } = useInstructorCourses();
  const { data: courses, isSample } = withSampleFallback(rawCourses, MOCK_INSTRUCTOR_COURSES as any);

  // Fetch enrollment counts per course
  const courseIds = courses.map((c: any) => c.id);
  const { data: enrollmentCounts } = useQuery({
    queryKey: ["instructor-course-enrollments", courseIds],
    enabled: courseIds.length > 0 && !courseIds[0]?.startsWith("mock-"),
    staleTime: 3 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("course_enrollments")
        .select("course_id, status")
        .in("course_id", courseIds);
      if (!data) return {};
      const counts: Record<string, { active: number; completed: number }> = {};
      data.forEach((e) => {
        if (!counts[e.course_id]) counts[e.course_id] = { active: 0, completed: 0 };
        if (e.status === "active") counts[e.course_id].active++;
        else if (e.status === "completed") counts[e.course_id].completed++;
      });
      return counts;
    },
  });

  const published = courses.filter((c: any) => c.status === "published");
  const drafts = courses.filter((c: any) => c.status === "draft");

  const getMockCounts = (id: string) => {
    if (id === "mock-ic-1") return { active: 47, completed: 12 };
    if (id === "mock-ic-2") return { active: 32, completed: 8 };
    if (id === "mock-ic-3") return { active: 89, completed: 34 };
    return { active: 0, completed: 0 };
  };

  const getStats = (id: string) => {
    if (enrollmentCounts && enrollmentCounts[id]) return enrollmentCounts[id];
    return getMockCounts(id);
  };

  return (
    <div className="pt-24 pb-20">
      <SEO title={isAr ? "دوراتي | DevWady" : "My Listed Courses | DevWady"} />
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">
                {isAr ? "دوراتي المدرجة" : "My Listed Courses"}
              </h1>
              <SampleDataBadge isSample={isSample} />
            </div>
            <p className="text-muted-foreground text-sm">
              {isAr ? "نظرة عامة على جميع دوراتك كمالك" : "Owner overview of all your courses"}
            </p>
          </div>
          <Link
            to="/instructor/workspace"
            className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
          >
            {isAr ? "مساحة العمل" : "Workspace"}
            <ArrowRight className="icon-flip-rtl h-3 w-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm mb-4">
              {isAr ? "لم تنشئ أي دورة بعد" : "You haven't created any courses yet"}
            </p>
            <Link
              to="/instructor/workspace/courses"
              className="text-sm font-medium text-primary hover:underline"
            >
              {isAr ? "ابدأ من مساحة العمل" : "Start from Workspace"}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Published courses */}
            {published.length > 0 && (
              <>
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  {isAr ? `منشورة (${published.length})` : `Published (${published.length})`}
                </h2>
                {published.map((course: any) => {
                  const stats = getStats(course.id);
                  return (
                    <Link
                      key={course.id}
                      to={`/instructor/courses/${course.slug}`}
                      className="block p-5 rounded-xl border border-border/60 bg-card hover:border-primary/20 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-semibold text-foreground truncate">
                            {isAr ? (course.title_ar || course.title_en) : course.title_en}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {course.total_lessons ?? 0} {isAr ? "درس" : "lessons"} ·{" "}
                            {course.is_free ? (isAr ? "مجاني" : "Free") : `$${course.price_usd ?? 0}`}
                          </p>
                        </div>
                        <Badge className="bg-green-500/15 text-green-600 border-0 text-[10px]">
                          {isAr ? "منشور" : "Published"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {stats.active} {isAr ? "نشط" : "active"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {stats.completed} {isAr ? "مكتمل" : "completed"}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {isAr ? "أسئلة" : "Q&A"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bot className="h-3.5 w-3.5" />
                          {isAr ? "مساعد" : "Assistant"}
                        </span>
                        {(course.learning_product_type === "live_course" || course.learning_product_type === "bootcamp_track") && (
                          <Link
                            to={`/instructor/workspace/courses/${course.id}/delivery`}
                            className="flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Radio className="h-3.5 w-3.5 text-primary" />
                            <span className="text-primary">{isAr ? "التسليم" : "Delivery"}</span>
                          </Link>
                        )}
                        <ArrowRight className="icon-flip-rtl h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors ms-auto" />
                      </div>
                    </Link>
                  );
                })}
              </>
            )}

            {/* Draft courses */}
            {drafts.length > 0 && (
              <>
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mt-6 mb-2">
                  <FileEdit className="h-4 w-4 text-muted-foreground" />
                  {isAr ? `مسودات (${drafts.length})` : `Drafts (${drafts.length})`}
                </h2>
                {drafts.map((course: any) => (
                  <Link
                    key={course.id}
                    to={`/instructor/courses/${course.slug}`}
                    className="block p-5 rounded-xl border border-dashed border-border/60 bg-muted/30 hover:border-primary/20 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-foreground truncate">
                          {isAr ? (course.title_ar || course.title_en) : course.title_en}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {course.total_lessons ?? 0} {isAr ? "درس" : "lessons"} ·{" "}
                          {isAr ? "أكمل وانشر" : "Complete & publish"}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        {isAr ? "مسودة" : "Draft"}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
