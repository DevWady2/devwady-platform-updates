/**
 * Hook — fetches talent profiles, recommendations, nominations,
 * and derives talent signals for a set of student user IDs
 * visible to the current instructor.
 * Returns a map keyed by student user_id for quick lookup.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TalentSignal } from "@/features/academy/talentBridge/signals";
import {
  TALENT_SIGNAL_LABELS,
  TALENT_SIGNAL_COLORS,
  talentSignalRank,
} from "@/features/academy/talentBridge/signals";
import { deriveTalentSignal } from "@/features/academy/talentBridge/derivedSignals";
import { computeReadiness, type ReadinessSignals } from "@/features/academy/learningModel/readiness";

export interface StudentTalentData {
  hasProfile: boolean;
  visibility: string | null;
  allowNomination: boolean;
  allowOpportunityMatching: boolean;
  headline: string | null;
  recommendationCount: number;
  nominationCount: number;
  /** Derived talent signal from readiness data */
  signal: TalentSignal | null;
  /** Computed readiness snapshot for use in recommendations */
  readinessSnapshot: ReadinessSignals | null;
}

export function useStudentTalentSignals(studentIds: string[]) {
  const uniqueIds = [...new Set(studentIds)];

  const { data: talentProfiles = [] } = useQuery({
    queryKey: ["instructor-student-talent-profiles", uniqueIds],
    enabled: uniqueIds.length > 0,
    staleTime: 3 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_talent_profiles")
        .select("user_id, visibility_state, allow_nomination, allow_opportunity_matching, headline")
        .in("user_id", uniqueIds);
      return data ?? [];
    },
  });

  const { data: recommendations = [] } = useQuery({
    queryKey: ["instructor-student-recommendations", uniqueIds],
    enabled: uniqueIds.length > 0,
    staleTime: 3 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_recommendations")
        .select("student_user_id, id, status")
        .in("student_user_id", uniqueIds);
      return data ?? [];
    },
  });

  const { data: nominations = [] } = useQuery({
    queryKey: ["instructor-student-nominations", uniqueIds],
    enabled: uniqueIds.length > 0,
    staleTime: 3 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_nominations")
        .select("student_user_id, id")
        .in("student_user_id", uniqueIds);
      return data ?? [];
    },
  });

  // Fetch lightweight progress data for signal derivation
  const { data: progressCounts = [] } = useQuery({
    queryKey: ["instructor-student-progress-counts", uniqueIds],
    enabled: uniqueIds.length > 0,
    staleTime: 3 * 60 * 1000,
    queryFn: async () => {
      // Lesson progress: count completed per user
      const { data: lessonData } = await supabase
        .from("lesson_progress")
        .select("user_id, is_completed")
        .in("user_id", uniqueIds);

      // Aggregate per user
      const map = new Map<string, { completed: number; total: number }>();
      for (const lp of lessonData ?? []) {
        const entry = map.get(lp.user_id) ?? { completed: 0, total: 0 };
        entry.total++;
        if (lp.is_completed) entry.completed++;
        map.set(lp.user_id, entry);
      }
      return Array.from(map.entries()).map(([user_id, counts]) => ({ user_id, ...counts }));
    },
  });

  // Build lookup map
  const map = new Map<string, StudentTalentData>();
  const progressMap = new Map(progressCounts.map(p => [p.user_id, p]));

  for (const uid of uniqueIds) {
    const tp = talentProfiles.find(p => p.user_id === uid);
    const recs = recommendations.filter(r => r.student_user_id === uid);
    const recCount = recs.length;
    const nomCount = nominations.filter(n => n.student_user_id === uid).length;
    const hasActiveRec = recs.some(r => r.status === "active");

    // Derive readiness + talent signal from progress data
    const progress = progressMap.get(uid);
    let signal: TalentSignal | null = null;
    let readinessSnapshot: ReadinessSignals | null = null;

    if (progress && progress.total > 0) {
      const readinessInput = {
        lessonsCompleted: progress.completed,
        lessonsTotal: progress.total,
        attendedSessions: 0,
        requiredSessions: 0,
        assessmentsPassed: 0,
        assessmentsTotal: 0,
        projectsApproved: 0,
        projectsTotal: 0,
        supportsLiveSessions: false,
        supportsAssessments: false,
        supportsProjects: false,
      };
      readinessSnapshot = computeReadiness(readinessInput);

      const talentResult = deriveTalentSignal({
        readiness: readinessSnapshot,
        lessonsCompleted: progress.completed,
        lessonsTotal: progress.total,
        projectsApproved: 0,
        projectsTotal: 0,
        assessmentsPassed: 0,
        assessmentsTotal: 0,
        attendedSessions: 0,
        requiredSessions: 0,
        isBootcamp: false,
        isLiveCourse: false,
        hasInstructorRecommendation: hasActiveRec,
        recommendationCount: recCount,
      });
      signal = talentResult.signal;
    }

    map.set(uid, {
      hasProfile: !!tp,
      visibility: tp?.visibility_state ?? null,
      allowNomination: tp?.allow_nomination ?? false,
      allowOpportunityMatching: tp?.allow_opportunity_matching ?? false,
      headline: tp?.headline ?? null,
      recommendationCount: recCount,
      nominationCount: nomCount,
      signal,
      readinessSnapshot,
    });
  }

  return map;
}

export { TALENT_SIGNAL_LABELS, TALENT_SIGNAL_COLORS, talentSignalRank };
