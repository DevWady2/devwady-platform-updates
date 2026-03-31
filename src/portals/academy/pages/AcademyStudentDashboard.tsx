/**
 * Academy — Student Dashboard.
 * First-screen: continue learning focus → progress → certificates.
 */
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader, StatCardGrid, FocusBlock } from "@/core/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { BookOpen, Award, ArrowRight, GraduationCap, Play } from "lucide-react";
import { useStudentEnrollments } from "../hooks/useStudentEnrollments";
import { useWorkspaceEntry } from "@/hooks/useWorkspaceEntry";
import ArrivalHint from "@/components/portal/ArrivalHint";

export default function AcademyStudentDashboard() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const { enrollments, isLoading, getProgress } = useStudentEnrollments();
  const entry = useWorkspaceEntry();

  const active = enrollments.filter(e => e.status === "active");
  const completed = enrollments.filter(e => e.status === "completed");
  const certificates = completed.filter(e => e.certificate_url);

  // Find the course with highest progress for "continue learning"
  const activeWithProgress = active.map((e: any) => ({
    ...e,
    progress: getProgress(e.id, e.training_courses?.total_lessons ?? 0),
  })).sort((a, b) => b.progress - a.progress);
  const topCourse = activeWithProgress[0];

  const stats = [
    { label_en: "Active Courses", label_ar: "دورات نشطة", value: active.length, icon: "courses" as const, color: "primary" as const },
    { label_en: "Completed", label_ar: "مكتملة", value: completed.length, icon: "chart" as const, color: "success" as const },
    { label_en: "Certificates", label_ar: "شهادات", value: certificates.length, icon: "rating" as const, color: "warning" as const },
  ];

  return (
    <div className="space-y-6">
      <ArrivalHint entry={entry} />
      <PageHeader
        title_en="My Learning"
        title_ar="تعلّمي"
        description_en="Track your courses and learning progress"
        description_ar="تتبع دوراتك وتقدمك التعليمي"
        actions={
          <Link to="/academy/courses">
            <Button size="sm"><BookOpen className="h-4 w-4 me-1.5" />{isAr ? "تصفح الدورات" : "Browse Courses"}</Button>
          </Link>
        }
      />

      {/* Dominant focus: continue learning or start */}
      {!isLoading && (topCourse ? (
        <FocusBlock
          icon={Play}
          label_en="Continue Learning"
          label_ar="تابع التعلم"
          title_en={isAr ? topCourse.training_courses?.title_ar : topCourse.training_courses?.title_en}
          title_ar={topCourse.training_courses?.title_ar ?? topCourse.training_courses?.title_en}
          subtitle_en={`${topCourse.progress}% complete`}
          subtitle_ar={`${topCourse.progress}% مكتمل`}
          action_en="Continue"
          action_ar="متابعة"
          actionHref={`/learn/${topCourse.training_courses?.slug}`}
          accent="primary"
        >
          <Progress value={topCourse.progress} className="h-1.5" />
        </FocusBlock>
      ) : enrollments.length === 0 ? (
        <FocusBlock
          icon={GraduationCap}
          label_en="Start Learning"
          label_ar="ابدأ التعلم"
          title_en="Browse our course catalog and enroll in your first course"
          title_ar="تصفح كتالوج الدورات وسجل في أول دورة"
          action_en="Browse Courses"
          action_ar="تصفح الدورات"
          actionHref="/academy/courses"
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
                {isAr ? "الدورات النشطة" : "Active Courses"}
              </CardTitle>
              <Link to="/academy/portal/courses">
                <Button variant="ghost" size="sm" className="text-xs">
                  {isAr ? "عرض الكل" : "View All"}<ArrowRight className="h-3.5 w-3.5 ms-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {active.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {isAr ? "لا توجد دورات نشطة" : "No active courses"}
                </p>
              ) : (
                active.slice(0, 4).map((e: any) => {
                  const course = e.training_courses;
                  const progress = getProgress(e.id, course?.total_lessons ?? 0);
                  return (
                    <Link key={e.id} to={`/learn/${course?.slug}`} className="block">
                      <div className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                        {course?.thumbnail_url ? (
                          <img src={course.thumbnail_url} alt="" className="h-12 w-16 rounded-md object-cover flex-shrink-0" />
                        ) : (
                          <div className="h-12 w-16 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{isAr ? course?.title_ar : course?.title_en}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={progress} className="h-1.5 flex-1" />
                            <span className="text-[10px] text-muted-foreground font-medium">{progress}%</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {certificates.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  {isAr ? "شهاداتي" : "My Certificates"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {certificates.slice(0, 3).map((e: any) => (
                  <Link key={e.id} to={`/certificate/${e.id}`} className="block">
                    <div className="p-2.5 rounded-lg border hover:bg-muted/30 transition-colors">
                      <p className="text-sm font-medium truncate">{isAr ? e.training_courses?.title_ar : e.training_courses?.title_en}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(e.completed_at).toLocaleDateString()}</p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
