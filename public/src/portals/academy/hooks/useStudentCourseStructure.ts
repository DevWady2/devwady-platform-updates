/**
 * Academy — Student Course Structure & Delivery Hooks
 *
 * Safe read hooks for students to view their own course structure,
 * cohort membership, sessions, attendance, and submission status.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ── Published structure counts (public-safe via RPC) ────────

export interface CourseStructureCounts {
  milestones: number;
  assessments: number;
  projects: number;
  sessions: number;
  cohorts: number;
}

export function useCourseStructureCounts(courseId: string | undefined) {
  return useQuery({
    queryKey: ["course-structure-counts", courseId],
    enabled: !!courseId,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<CourseStructureCounts> => {
      const { data, error } = await supabase.rpc("get_course_structure_counts", {
        p_course_id: courseId!,
      });
      if (error) throw error;
      const d = (data as any) ?? {};
      return {
        milestones: Number(d.milestones ?? 0),
        assessments: Number(d.assessments ?? 0),
        projects: Number(d.projects ?? 0),
        sessions: Number(d.sessions ?? 0),
        cohorts: Number(d.cohorts ?? 0),
      };
    },
  });
}

// ── Student's own cohort membership ─────────────────────────

export function useMyCourseCohort(courseId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ["my-course-cohort", courseId, userId],
    enabled: !!courseId && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cohort_memberships")
        .select("*, course_cohorts!inner(id, title, code, status, start_date, end_date, course_id)")
        .eq("user_id", userId!)
        .eq("course_cohorts.course_id", courseId!)
        .eq("membership_status", "active")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

// ── Published sessions for a student's course ───────────────

export function useMySessions(courseId: string | undefined, cohortId?: string | null) {
  return useQuery({
    queryKey: ["my-sessions", courseId, cohortId],
    enabled: !!courseId,
    queryFn: async () => {
      let q = supabase
        .from("course_sessions")
        .select("id, title, session_type, start_at, end_at, meeting_url, attendance_required, cohort_id")
        .eq("course_id", courseId!)
        .eq("is_published", true)
        .order("start_at", { ascending: true });

      if (cohortId) {
        // Show sessions for the student's cohort + course-wide sessions
        q = q.or(`cohort_id.eq.${cohortId},cohort_id.is.null`);
      } else {
        // No cohort: only show course-wide sessions — never other cohorts' sessions
        q = q.is("cohort_id", null);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ── Student's own attendance ────────────────────────────────

export function useMyAttendance(userId: string | undefined, sessionIds: string[]) {
  return useQuery({
    queryKey: ["my-attendance", userId, sessionIds],
    enabled: !!userId && sessionIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("session_attendance")
        .select("session_id, attendance_status")
        .eq("user_id", userId!)
        .in("session_id", sessionIds);
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const a of data ?? []) map[a.session_id] = a.attendance_status;
      return map;
    },
  });
}

// ── Student's published structure items ─────────────────────

export function useMyStructureItems(courseId: string | undefined) {
  return useQuery({
    queryKey: ["my-structure-items", courseId],
    enabled: !!courseId,
    staleTime: 3 * 60_000,
    queryFn: async () => {
      const [milestones, assessments, projects] = await Promise.all([
        supabase.from("course_milestones").select("id, title_en, title_ar, sort_order, is_required").eq("course_id", courseId!).eq("is_published", true).order("sort_order"),
        supabase.from("course_assessments").select("id, title_en, title_ar, sort_order, assessment_type, is_required, passing_score, max_attempts").eq("course_id", courseId!).eq("is_published", true).order("sort_order"),
        supabase.from("course_projects").select("id, title_en, title_ar, sort_order, submission_type, is_required, is_capstone").eq("course_id", courseId!).eq("is_published", true).order("sort_order"),
      ]);
      return {
        milestones: milestones.data ?? [],
        assessments: assessments.data ?? [],
        projects: projects.data ?? [],
      };
    },
  });
}

// ── Student's own assessment attempts ───────────────────────

export function useMyAttempts(userId: string | undefined, assessmentIds: string[]) {
  return useQuery({
    queryKey: ["my-attempts", userId, assessmentIds],
    enabled: !!userId && assessmentIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessment_attempts")
        .select("id, assessment_id, status, score, attempt_number, submitted_at, feedback")
        .eq("user_id", userId!)
        .in("assessment_id", assessmentIds)
        .order("attempt_number", { ascending: false });
      if (error) throw error;
      // Group by assessment: latest attempt first
      const map: Record<string, any[]> = {};
      for (const a of data ?? []) {
        if (!map[a.assessment_id]) map[a.assessment_id] = [];
        map[a.assessment_id].push(a);
      }
      return map;
    },
  });
}

// ── Student's own project submissions (with review fields) ──

export function useMySubmissions(userId: string | undefined, projectIds: string[]) {
  return useQuery({
    queryKey: ["my-submissions", userId, projectIds],
    enabled: !!userId && projectIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_submissions")
        .select("id, project_id, submission_status, submission_text, submission_url, submitted_at")
        .eq("user_id", userId!)
        .in("project_id", projectIds);
      if (error) throw error;
      const map: Record<string, any> = {};
      for (const s of data ?? []) map[s.project_id] = s;
      return map;
    },
  });
}

// ── Student's project reviews (instructor feedback) ─────────

export function useMyProjectReviews(userId: string | undefined, projectIds: string[]) {
  return useQuery({
    queryKey: ["my-project-reviews", userId, projectIds],
    enabled: !!userId && projectIds.length > 0,
    queryFn: async () => {
      // Get submission IDs first, then fetch reviews
      const { data: subs } = await supabase
        .from("project_submissions")
        .select("id, project_id")
        .eq("user_id", userId!)
        .in("project_id", projectIds);
      if (!subs?.length) return {} as Record<string, any>;

      const subIds = subs.map(s => s.id);
      const { data: reviews } = await supabase
        .from("project_reviews")
        .select("id, submission_id, reviewer_id, review_status, score, feedback, reviewed_at")
        .in("submission_id", subIds)
        .order("reviewed_at", { ascending: false });

      // Map by project_id using submission lookup
      const subToProject: Record<string, string> = {};
      for (const s of subs) subToProject[s.id] = s.project_id;

      const map: Record<string, any> = {};
      for (const r of reviews ?? []) {
        const pid = subToProject[r.submission_id];
        if (pid && !map[pid]) map[pid] = r; // latest review per project
      }
      return map;
    },
  });
}
