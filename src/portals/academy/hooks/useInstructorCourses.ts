/**
 * Shared hook — fetches the instructor's courses from training_courses.
 * Reused across InstructorDashboard, Courses, Lessons, Students, Earnings.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const INSTRUCTOR_COURSES_KEY = "academy-instructor-courses";

export function useInstructorCourses() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [INSTRUCTOR_COURSES_KEY, user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_courses")
        .select("id, title_en, title_ar, slug, status, total_lessons, price_usd, is_free, thumbnail_url, created_at, learning_product_type, delivery_mode")
        .eq("instructor_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
