/**
 * Academy — My Courses page (student-only in academy portal context).
 * Instructor course management lives in /instructor/workspace/courses.
 */
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader, EmptyState } from "@/core/components";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { BookOpen, Clock, BarChart3 } from "lucide-react";
import { ENROLLMENT_STATUS_COLORS, formatStatus } from "../constants";
import { useStudentEnrollments } from "../hooks/useStudentEnrollments";

/* ── Student Course Card ── */
function StudentCourseCard({ enrollment, getProgress, isAr }: { enrollment: any; getProgress: (id: string, total: number) => number; isAr: boolean }) {
  const course = enrollment.training_courses;
  const progress = getProgress(enrollment.id, course?.total_lessons ?? 0);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {course?.thumbnail_url ? (
            <img src={course.thumbnail_url} alt="" className="h-16 w-24 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="h-16 w-24 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <Link to={`/learn/${course?.slug}`} className="text-sm font-semibold hover:text-primary transition-colors truncate block">
              {isAr ? course?.title_ar : course?.title_en}
            </Link>
            <div className="flex items-center gap-2 mt-1.5">
              <Progress value={progress} className="h-1.5 flex-1 max-w-48" />
              <span className="text-[10px] text-muted-foreground font-medium">{progress}%</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />{course?.duration_en ?? "—"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <Badge variant="secondary" className={`text-[10px] ${ENROLLMENT_STATUS_COLORS[enrollment.status] ?? ""}`}>
              {formatStatus(enrollment.status)}
            </Badge>
            <Link to={`/learn/${course?.slug}`}>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <BarChart3 className="h-3 w-3 me-1" />{isAr ? "تابع" : "Continue"}
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Main Page (student-only in academy portal context) ── */
export default function AcademyCourses() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const [statusFilter, setStatusFilter] = useState("all");

  // Student data
  const { enrollments, isLoading: loadingEnroll, getProgress } = useStudentEnrollments();

  const isLoading = loadingEnroll;

  // Filter logic
  const filteredEnrollments = enrollments.filter((e: any) => {
    if (statusFilter === "all") return true;
    return e.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title_en="My Courses"
        title_ar="دوراتي"
        description_en="All courses you are enrolled in"
        description_ar="جميع الدورات المسجل بها"
        actions={
          <Link to="/academy/courses">
            <Button size="sm"><BookOpen className="h-4 w-4 me-1.5" />{isAr ? "تصفح الدورات" : "Browse Courses"}</Button>
          </Link>
        }
      />

      {/* Status filter tabs */}
      {!isLoading && enrollments.length > 0 && (
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">{isAr ? "الكل" : "All"} ({enrollments.length})</TabsTrigger>
            <TabsTrigger value="active">{isAr ? "نشطة" : "Active"} ({enrollments.filter((e: any) => e.status === "active").length})</TabsTrigger>
            <TabsTrigger value="completed">{isAr ? "مكتملة" : "Completed"} ({enrollments.filter((e: any) => e.status === "completed").length})</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : enrollments.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-12 w-12" />}
          title_en="No courses yet"
          title_ar="لا توجد دورات بعد"
          description_en="Start your learning journey — browse our course catalog and enroll in your first course."
          description_ar="ابدأ رحلة تعلمك — تصفح كتالوج الدورات وسجل في أول دورة."
        />
      ) : (
        <div className="space-y-3">
          {filteredEnrollments.map((e: any) => (
            <StudentCourseCard key={e.id} enrollment={e} getProgress={getProgress} isAr={isAr} />
          ))}
        </div>
      )}
    </div>
  );
}
