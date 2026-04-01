/**
 * Instructor Workspace Dashboard.
 * NOTE: This file lives under portals/academy/ for historical reasons but is
 * exclusively owned by /instructor/workspace (InstructorWorkspaceLayout).
 * It is NOT rendered inside AcademyLayout and is NOT an academy-portal page.
 * First-screen: active course/draft focus → students → earnings.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader, StatCardGrid, FocusBlock, ActivityFeed } from "@/core/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BookOpen, Users, Plus, ArrowRight, PenLine } from "lucide-react";
import { COURSE_STATUS_COLORS, formatStatus } from "../constants";
import { PRODUCT_TYPE_BADGE, isProductType } from "@/features/academy/learningModel";
import { useInstructorCourses } from "../hooks/useInstructorCourses";
import { useWorkspaceEntry } from "@/hooks/useWorkspaceEntry";
import ArrivalHint from "@/components/portal/ArrivalHint";

export default function AcademyInstructorDashboard() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const entry = useWorkspaceEntry();

  const { data: courses = [], isLoading } = useInstructorCourses();

  const { data: enrollments = [] } = useQuery({
    queryKey: ["academy-instructor-enrollments", user?.id],
    enabled: !!user && courses.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_enrollments")
        .select("id, course_id, status")
        .in("course_id", courses.map(c => c.id));
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["academy-instructor-payments", user?.id],
    enabled: !!user && courses.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("amount_usd, status")
        .eq("type", "course")
        .in("reference_id", courses.map(c => c.id))
        .eq("status", "paid");
      if (error) throw error;
      return data ?? [];
    },
  });

  const totalStudents = enrollments.length;
  const totalRevenue = payments.reduce((s, p) => s + (Number(p.amount_usd) || 0), 0);
  const publishedCourses = courses.filter(c => c.status === "published").length;
  const draftCourse = courses.find(c => c.status === "draft");

  const stats = [
    { label_en: "Published Courses", label_ar: "دورات منشورة", value: publishedCourses, icon: "courses" as const, color: "primary" as const },
    { label_en: "Total Students", label_ar: "إجمالي الطلاب", value: totalStudents, icon: "users" as const, color: "success" as const },
    { label_en: "Revenue", label_ar: "الإيرادات", value: `$${totalRevenue.toLocaleString()}`, icon: "revenue" as const, color: "warning" as const },
  ];

  return (
    <div className="space-y-6">
      <ArrivalHint entry={entry} />
      <PageHeader
        title_en="Instructor Dashboard"
        title_ar="لوحة تحكم المعلم"
        description_en="Manage your courses and students"
        description_ar="إدارة دوراتك وطلابك"
        actions={
          <Link to="/instructor/workspace/courses/new">
            <Button size="sm"><Plus className="h-4 w-4 me-1.5" />{isAr ? "دورة جديدة" : "New Course"}</Button>
          </Link>
        }
      />

      {/* Dominant focus: draft course or create first */}
      {!isLoading && (draftCourse ? (
        <FocusBlock
          icon={PenLine}
          label_en="Continue Editing"
          label_ar="متابعة التحرير"
          title_en={draftCourse.title_en}
          title_ar={draftCourse.title_ar ?? draftCourse.title_en ?? ""}
          subtitle_en={`Draft · ${draftCourse.total_lessons} lessons`}
          subtitle_ar={`مسودة · ${draftCourse.total_lessons} درس`}
          action_en="Edit Course"
          action_ar="تعديل الدورة"
          actionHref={`/instructor/workspace/courses`}
          accent="warning"
        />
      ) : courses.length === 0 ? (
        <FocusBlock
          icon={BookOpen}
          label_en="Get Started"
          label_ar="ابدأ الآن"
          title_en="Create your first course and start sharing your expertise"
          title_ar="أنشئ دورتك الأولى وابدأ مشاركة خبراتك"
          action_en="Create Course"
          action_ar="إنشاء دورة"
          actionHref="/instructor/workspace/courses/new"
          accent="primary"
        />
      ) : null)}

      <StatCardGrid stats={stats} loading={isLoading} columns={3} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {isAr ? "دوراتي" : "My Courses"}
              </CardTitle>
              <Link to="/instructor/workspace/courses">
                <Button variant="ghost" size="sm" className="text-xs">
                  {isAr ? "عرض الكل" : "View All"}<ArrowRight className="h-3.5 w-3.5 ms-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {courses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {isAr ? "لم تنشئ أي دورات بعد" : "No courses created yet"}
                </p>
              ) : (
                courses.slice(0, 5).map(c => {
                  const studentCount = enrollments.filter(e => e.course_id === c.id).length;
                  return (
                    <div key={c.id} className="flex items-center gap-4 p-3 rounded-lg border">
                      {c.thumbnail_url ? (
                        <img src={c.thumbnail_url} alt="" className="h-12 w-16 rounded-md object-cover flex-shrink-0" />
                      ) : (
                        <div className="h-12 w-16 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{isAr ? c.title_ar : c.title_en}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-0.5"><Users className="h-3 w-3" />{studentCount}</span>
                          <span>{c.total_lessons} {isAr ? "درس" : "lessons"}</span>
                          <span>{c.is_free ? (isAr ? "مجاني" : "Free") : `$${c.price_usd}`}</span>
                        </div>
                      </div>
                      {isProductType((c as any).learning_product_type) && (c as any).learning_product_type !== "standard_course" && (
                        <Badge variant="outline" className="text-[10px]">
                          {isAr ? PRODUCT_TYPE_BADGE[(c as any).learning_product_type as keyof typeof PRODUCT_TYPE_BADGE].ar : PRODUCT_TYPE_BADGE[(c as any).learning_product_type as keyof typeof PRODUCT_TYPE_BADGE].en}
                        </Badge>
                      )}
                      <Badge variant="secondary" className={`text-[10px] ${COURSE_STATUS_COLORS[c.status ?? "draft"] ?? ""}`}>
                        {formatStatus(c.status ?? "draft")}
                      </Badge>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <ActivityFeed limit={5} />
        </div>
      </div>
    </div>
  );
}
