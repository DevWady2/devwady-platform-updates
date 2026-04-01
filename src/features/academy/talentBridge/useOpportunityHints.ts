/**
 * Academy Talent Bridge — Opportunity Hints Hook (Read-Only)
 *
 * Fetches active job_postings and matches them against a student's
 * talent profile + signals. Internal use only — no apply flow.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  matchStudentToOpportunities,
  type StudentMatchProfile,
  type MatchingSummary,
} from "./opportunityMatching";

/**
 * Fetch active opportunities and compute match hints for an opted-in student.
 * Returns null if student is not eligible for matching.
 */
export function useOpportunityHints(
  student: StudentMatchProfile | null,
  enabled = true,
) {
  const { data: opportunities = [] } = useQuery({
    queryKey: ["talent-bridge-opportunities"],
    enabled: enabled && !!student,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("job_postings")
        .select("id, title, type, tags, requirements, location")
        .eq("is_active", true)
        .limit(50);
      return (data ?? []).map((j) => ({
        id: j.id,
        title: j.title,
        type: j.type,
        tags: (j.tags as string[]) ?? [],
        requirements: (j.requirements as string[]) ?? [],
        location: j.location,
      }));
    },
  });

  const summary: MatchingSummary | null =
    student && opportunities.length > 0
      ? matchStudentToOpportunities(student, opportunities)
      : null;

  return { summary, opportunityCount: opportunities.length };
}
