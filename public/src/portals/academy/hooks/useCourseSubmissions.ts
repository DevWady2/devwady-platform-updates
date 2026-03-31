/**
 * Academy — Submission & Review Hooks
 *
 * Read/write hooks for assessment attempts, project submissions, and reviews.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ── Assessment Attempts ─────────────────────────────────────

export function useAssessmentAttempts(assessmentId: string | undefined, userId?: string) {
  return useQuery({
    queryKey: ["assessment-attempts", assessmentId, userId],
    enabled: !!assessmentId,
    queryFn: async () => {
      let q = supabase
        .from("assessment_attempts")
        .select("*")
        .eq("assessment_id", assessmentId!)
        .order("attempt_number", { ascending: true });
      if (userId) q = q.eq("user_id", userId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      assessment_id: string;
      user_id: string;
      cohort_id?: string;
      attempt_number?: number;
    }) => {
      const { data, error } = await supabase
        .from("assessment_attempts")
        .insert(values)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["assessment-attempts", v.assessment_id] });
    },
  });
}

// ── Project Submissions ─────────────────────────────────────

export function useProjectSubmissions(projectId: string | undefined, userId?: string) {
  return useQuery({
    queryKey: ["project-submissions", projectId, userId],
    enabled: !!projectId,
    queryFn: async () => {
      let q = supabase
        .from("project_submissions")
        .select("*")
        .eq("project_id", projectId!);
      if (userId) q = q.eq("user_id", userId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      project_id: string;
      user_id: string;
      cohort_id?: string;
      submission_status?: string;
      submission_text?: string;
      submission_url?: string;
      attachment_url?: string;
      submitted_at?: string;
    }) => {
      const { data, error } = await supabase
        .from("project_submissions")
        .upsert(values, { onConflict: "project_id,user_id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["project-submissions", v.project_id] });
    },
  });
}

// ── Project Reviews ─────────────────────────────────────────

export function useProjectReviews(submissionId: string | undefined) {
  return useQuery({
    queryKey: ["project-reviews", submissionId],
    enabled: !!submissionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_reviews")
        .select("*")
        .eq("submission_id", submissionId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      submission_id: string;
      reviewer_id: string;
      review_status?: string;
      score?: number;
      feedback?: string;
      reviewed_at?: string;
    }) => {
      const { data, error } = await supabase
        .from("project_reviews")
        .insert(values)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["project-reviews", v.submission_id] });
    },
  });
}
