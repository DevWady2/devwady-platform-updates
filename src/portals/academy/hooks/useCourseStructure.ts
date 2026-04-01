/**
 * Academy — Course Structure Hooks
 *
 * Basic CRUD/read hooks for milestones, assessments, and projects.
 * Full submission/review flows are NOT included yet.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ── Milestones ──────────────────────────────────────────────

export function useCourseMilestones(courseId: string | undefined) {
  return useQuery({
    queryKey: ["course-milestones", courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_milestones")
        .select("*")
        .eq("course_id", courseId!)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}

// ── Assessments ─────────────────────────────────────────────

export function useCourseAssessments(courseId: string | undefined) {
  return useQuery({
    queryKey: ["course-assessments", courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_assessments")
        .select("*")
        .eq("course_id", courseId!)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}

// ── Projects ────────────────────────────────────────────────

export function useCourseProjects(courseId: string | undefined) {
  return useQuery({
    queryKey: ["course-projects", courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_projects")
        .select("*")
        .eq("course_id", courseId!)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}
