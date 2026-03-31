/**
 * Hook — compute readiness signals for a student enrollment.
 * Combines lesson progress, attendance, attempts, and submissions.
 */
import { useMemo } from "react";
import { computeReadiness, ReadinessSignals } from "@/features/academy/learningModel/readiness";

interface ReadinessInputData {
  lessonsCompleted: number;
  lessonsTotal: number;
  attendedSessions: number;
  requiredSessions: number;
  assessmentsPassed: number;
  assessmentsTotal: number;
  projectsApproved: number;
  projectsTotal: number;
  supportsLiveSessions: boolean;
  supportsAssessments: boolean;
  supportsProjects: boolean;
}

export function useStudentReadiness(input: ReadinessInputData | null): ReadinessSignals | null {
  return useMemo(() => {
    if (!input) return null;
    return computeReadiness(input);
  }, [
    input?.lessonsCompleted, input?.lessonsTotal,
    input?.attendedSessions, input?.requiredSessions,
    input?.assessmentsPassed, input?.assessmentsTotal,
    input?.projectsApproved, input?.projectsTotal,
    input?.supportsLiveSessions, input?.supportsAssessments, input?.supportsProjects,
  ]);
}
