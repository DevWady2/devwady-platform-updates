/**
 * Shared hook — fetches the student's enrollments and lesson progress.
 * Reused across StudentDashboard, Courses, Progress, Certificates.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const STUDENT_ENROLLMENTS_KEY = "academy-student-enrollments";
export const STUDENT_PROGRESS_KEY = "academy-student-progress";

export function useStudentEnrollments() {
  const { user } = useAuth();

  const enrollments = useQuery({
    queryKey: [STUDENT_ENROLLMENTS_KEY, user?.id],
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_enrollments")
        .select("*, training_courses(title_en, title_ar, slug, thumbnail_url, total_lessons, duration_en)")
        .eq("user_id", user!.id)
        .order("enrolled_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const progress = useQuery({
    queryKey: [STUDENT_PROGRESS_KEY, user?.id],
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("lesson_progress")
        .select("enrollment_id, is_completed, last_accessed_at")
        .eq("user_id", user!.id);
      return data ?? [];
    },
  });

  const getProgress = (enrollmentId: string, totalLessons: number) => {
    if (!totalLessons) return 0;
    const done = (progress.data ?? []).filter(
      (p) => p.enrollment_id === enrollmentId && p.is_completed
    ).length;
    return Math.round((done / totalLessons) * 100);
  };

  return {
    enrollments: enrollments.data ?? [],
    progressData: progress.data ?? [],
    isLoading: enrollments.isLoading,
    getProgress,
  };
}
