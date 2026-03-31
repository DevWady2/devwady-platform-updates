/**
 * Academy — Instructor Lessons management (select a course, view/manage lessons).
 * Uses shared useInstructorCourses hook.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader, EmptyState } from "@/core/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileText, Video, BookOpen, ChevronRight, Edit } from "lucide-react";
import { useInstructorCourses } from "../hooks/useInstructorCourses";

const contentTypeIcon = (type: string) => {
  if (type === "video") return <Video className="h-3.5 w-3.5 text-primary" />;
  return <FileText className="h-3.5 w-3.5 text-muted-foreground" />;
};

export default function AcademyLessons() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const { data: courses = [] } = useInstructorCourses();

  const activeCourseId = selectedCourseId ?? (courses.length > 0 ? courses[0].id : null);

  const { data: modules = [] } = useQuery({
    queryKey: ["academy-course-modules", activeCourseId],
    enabled: !!activeCourseId,
    queryFn: async () => {
      const { data } = await supabase
        .from("course_modules")
        .select("*")
        .eq("course_id", activeCourseId!)
        .order("sort_order");
      return data ?? [];
    },
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["academy-course-lessons", activeCourseId],
    enabled: !!activeCourseId,
    queryFn: async () => {
      const { data } = await supabase
        .from("course_lessons")
        .select("*")
        .eq("course_id", activeCourseId!)
        .order("sort_order");
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title_en="Lesson Management"
        title_ar="إدارة الدروس"
        description_en="View and organize lessons across your courses"
        description_ar="عرض وتنظيم الدروس في دوراتك"
      />

      <div className="flex gap-2 flex-wrap">
        {courses.map(c => (
          <Button
            key={c.id}
            variant={activeCourseId === c.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCourseId(c.id)}
          >
            <BookOpen className="h-3.5 w-3.5 me-1" />
            {isAr ? c.title_ar : c.title_en}
            <Badge variant="secondary" className="ms-1.5 text-[10px]">{c.total_lessons}</Badge>
          </Button>
        ))}
      </div>

      {!activeCourseId ? (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title_en="Select a course"
          title_ar="اختر دورة"
          description_en="Choose a course above to view its lessons"
          description_ar="اختر دورة أعلاه لعرض دروسها"
        />
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Link to={`/instructor/workspace/courses/${activeCourseId}/lessons`}>
              <Button variant="outline" size="sm">
                <Edit className="h-3.5 w-3.5 me-1" />{isAr ? "تعديل الدروس" : "Edit Lessons"}
              </Button>
            </Link>
          </div>

          {modules.length > 0 ? (
            modules.map(mod => {
              const modLessons = lessons.filter(l => l.module_id === mod.id);
              return (
                <Card key={mod.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ChevronRight className="h-4 w-4" />
                      {isAr ? mod.title_ar : mod.title_en}
                      <Badge variant="secondary" className="text-[10px]">{modLessons.length} {isAr ? "درس" : "lessons"}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {modLessons.map((l, idx) => (
                      <div key={l.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                        <span className="text-[10px] text-muted-foreground w-5">{idx + 1}</span>
                        {contentTypeIcon(l.content_type)}
                        <span className="text-sm flex-1 truncate">{isAr ? l.title_ar : l.title_en}</span>
                        {l.is_preview && <Badge variant="outline" className="text-[10px]">{isAr ? "معاينة" : "Preview"}</Badge>}
                        {!l.is_published && <Badge variant="destructive" className="text-[10px]">{isAr ? "مسودة" : "Draft"}</Badge>}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="p-4 space-y-1">
                {lessons.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">{isAr ? "لا توجد دروس بعد" : "No lessons yet"}</p>
                ) : (
                  lessons.map((l, idx) => (
                    <div key={l.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                      <span className="text-[10px] text-muted-foreground w-5">{idx + 1}</span>
                      {contentTypeIcon(l.content_type)}
                      <span className="text-sm flex-1 truncate">{isAr ? l.title_ar : l.title_en}</span>
                      {l.is_preview && <Badge variant="outline" className="text-[10px]">{isAr ? "معاينة" : "Preview"}</Badge>}
                      {!l.is_published && <Badge variant="destructive" className="text-[10px]">{isAr ? "مسودة" : "Draft"}</Badge>}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
