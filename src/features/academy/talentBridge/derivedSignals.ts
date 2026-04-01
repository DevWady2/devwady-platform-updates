/**
 * Academy Talent Bridge — Derived Signal Computation
 *
 * Turns existing readiness data + academy metrics into talent-facing
 * signals. Pure functions — no DB calls, no side effects.
 *
 * Business rules are explicit and deterministic:
 *
 *   not_ready_yet    — overall readiness is low or not_started
 *   portfolio_ready  — ≥1 approved project AND completion ≥ moderate
 *   nomination_ready — portfolio_ready AND (assessment OR attendance ≥ high)
 *   interview_ready  — all applicable dimensions ≥ high
 *   standout_student — interview_ready AND has instructor recommendation
 *
 * Each rule is documented inline so non-engineers can audit the logic.
 */

import type { ReadinessSignals, SignalLevel } from "../learningModel/readiness";
import type { TalentSignal } from "./signals";

// ── Input shape ──────────────────────────────────────────────

export interface TalentSignalInput {
  /** Precomputed readiness signals from the learning model */
  readiness: ReadinessSignals;

  /** Raw counts for evidence generation */
  lessonsCompleted: number;
  lessonsTotal: number;
  projectsApproved: number;
  projectsTotal: number;
  assessmentsPassed: number;
  assessmentsTotal: number;
  attendedSessions: number;
  requiredSessions: number;

  /** Product type context */
  isBootcamp: boolean;
  isLiveCourse: boolean;

  /** Cohort completion state if available */
  cohortCompletionState?: string | null;

  /** Whether the student has an active instructor recommendation */
  hasInstructorRecommendation: boolean;

  /** Number of instructor recommendations (for evidence) */
  recommendationCount: number;
}

// ── Output shape ─────────────────────────────────────────────

export interface TalentSignalResult {
  /** The highest signal the student qualifies for */
  signal: TalentSignal;

  /** Per-signal breakdown: met or not, with reason */
  breakdown: Record<TalentSignal, SignalBreakdownEntry>;

  /** Human-readable evidence snippets for display */
  evidence: string[];

  /** Requirements not yet met — blockers to the next level */
  blockers: string[];

  /** Recommended nomination scopes based on signal + context */
  recommendedScopes: string[];

  /** How many dimensions support this signal (0-4) */
  supportingDimensions: number;
}

export interface SignalBreakdownEntry {
  met: boolean;
  reason: string;
}

// ── Level helpers ────────────────────────────────────────────

const LEVEL_ORDER: SignalLevel[] = ["not_started", "low", "moderate", "high", "complete"];

function levelRank(level: SignalLevel): number {
  return LEVEL_ORDER.indexOf(level);
}

function levelAtLeast(level: SignalLevel, threshold: SignalLevel): boolean {
  return levelRank(level) >= levelRank(threshold);
}

// ── Main derivation ──────────────────────────────────────────

/**
 * Compute the talent signal from academy performance data.
 * Pure, deterministic, explainable.
 */
export function deriveTalentSignal(input: TalentSignalInput): TalentSignalResult {
  const { readiness } = input;

  // ── Step 1: Evaluate each talent signal gate ──

  // portfolio_ready: at least 1 approved project AND completion ≥ moderate
  const hasApprovedProject = input.projectsApproved >= 1;
  const completionModerate = levelAtLeast(readiness.completion_quality, "moderate");
  const portfolioMet = hasApprovedProject && completionModerate;

  // nomination_ready: portfolio_ready AND at least one of (assessment ≥ high, attendance ≥ high)
  const assessmentHigh = levelAtLeast(readiness.assessment_readiness, "high");
  const attendanceHigh = levelAtLeast(readiness.attendance_health, "high");
  const hasStrongDimension = assessmentHigh || attendanceHigh;
  const nominationMet = portfolioMet && hasStrongDimension;

  // interview_ready: all applicable dimensions ≥ high
  const completionHigh = levelAtLeast(readiness.completion_quality, "high");
  const projectHigh = levelAtLeast(readiness.project_readiness, "high");
  const allApplicableHigh =
    completionHigh &&
    projectHigh &&
    (readiness.assessment_readiness === "not_started" || assessmentHigh) &&
    (readiness.attendance_health === "not_started" || attendanceHigh);
  const interviewMet = nominationMet && allApplicableHigh;

  // standout_student: interview_ready AND has instructor recommendation
  const standoutMet = interviewMet && input.hasInstructorRecommendation;

  // ── Step 2: Determine highest signal ──

  let signal: TalentSignal = "not_ready_yet";
  if (standoutMet) signal = "standout_student";
  else if (interviewMet) signal = "interview_ready";
  else if (nominationMet) signal = "nomination_ready";
  else if (portfolioMet) signal = "portfolio_ready";

  // ── Step 3: Build breakdown ──

  const breakdown: Record<TalentSignal, SignalBreakdownEntry> = {
    not_ready_yet: {
      met: signal === "not_ready_yet",
      reason: "Minimum thresholds not yet reached.",
    },
    portfolio_ready: {
      met: portfolioMet,
      reason: portfolioMet
        ? `${input.projectsApproved} approved project(s), completion at ${readiness.completion_quality} level.`
        : !hasApprovedProject
          ? `No approved projects yet (${input.projectsApproved}/${input.projectsTotal}).`
          : `Completion quality is ${readiness.completion_quality}, needs moderate or above.`,
    },
    nomination_ready: {
      met: nominationMet,
      reason: nominationMet
        ? `Strong in ${assessmentHigh ? "assessments" : ""}${assessmentHigh && attendanceHigh ? " and " : ""}${attendanceHigh ? "attendance" : ""}.`
        : !portfolioMet
          ? "Portfolio readiness not yet met."
          : "Needs assessment or attendance at high level.",
    },
    interview_ready: {
      met: interviewMet,
      reason: interviewMet
        ? "All applicable dimensions at high level or above."
        : buildInterviewBlockerReason(readiness),
    },
    standout_student: {
      met: standoutMet,
      reason: standoutMet
        ? `${input.recommendationCount} instructor recommendation(s) plus interview readiness.`
        : !interviewMet
          ? "Interview readiness not yet achieved."
          : "Needs at least one instructor recommendation.",
    },
  };

  // ── Step 4: Evidence snippets ──

  const evidence: string[] = [];

  if (input.lessonsTotal > 0) {
    const pct = Math.round((input.lessonsCompleted / input.lessonsTotal) * 100);
    evidence.push(`Completed ${input.lessonsCompleted}/${input.lessonsTotal} lessons (${pct}%).`);
  }
  if (input.projectsTotal > 0) {
    evidence.push(`${input.projectsApproved}/${input.projectsTotal} projects approved.`);
  }
  if (input.assessmentsTotal > 0) {
    evidence.push(`${input.assessmentsPassed}/${input.assessmentsTotal} assessments passed.`);
  }
  if (input.requiredSessions > 0) {
    evidence.push(`Attended ${input.attendedSessions}/${input.requiredSessions} required sessions.`);
  }
  if (input.isBootcamp) evidence.push("Bootcamp track participant.");
  if (input.isLiveCourse) evidence.push("Live course participant.");
  if (input.cohortCompletionState) {
    evidence.push(`Cohort state: ${input.cohortCompletionState}.`);
  }
  if (input.recommendationCount > 0) {
    evidence.push(`${input.recommendationCount} instructor recommendation(s).`);
  }

  // ── Step 5: Blockers to next level ──

  const blockers: string[] = [];
  if (!portfolioMet) {
    if (!hasApprovedProject) blockers.push("Get at least one project approved.");
    if (!completionModerate) blockers.push("Complete more lessons (need moderate level).");
  } else if (!nominationMet) {
    if (!hasStrongDimension) blockers.push("Reach high level in assessments or attendance.");
  } else if (!interviewMet) {
    if (!completionHigh) blockers.push("Raise completion quality to high level.");
    if (!projectHigh) blockers.push("Get more projects approved (need high level).");
    if (readiness.assessment_readiness !== "not_started" && !assessmentHigh)
      blockers.push("Improve assessment scores to high level.");
    if (readiness.attendance_health !== "not_started" && !attendanceHigh)
      blockers.push("Improve attendance to high level.");
  } else if (!standoutMet) {
    blockers.push("Obtain an instructor recommendation.");
  }

  // ── Step 6: Recommended scopes ──

  const recommendedScopes: string[] = [];
  if (signal === "not_ready_yet") {
    // No scopes
  } else if (signal === "portfolio_ready") {
    recommendedScopes.push("internal_pool");
  } else if (signal === "nomination_ready") {
    recommendedScopes.push("internal_pool", "general_opportunity");
  } else if (signal === "interview_ready") {
    recommendedScopes.push("general_opportunity", "role_specific");
  } else if (signal === "standout_student") {
    recommendedScopes.push("general_opportunity", "role_specific", "company_specific");
  }

  // ── Step 7: Supporting dimensions count ──

  let supportingDimensions = 0;
  if (completionHigh) supportingDimensions++;
  if (projectHigh) supportingDimensions++;
  if (assessmentHigh) supportingDimensions++;
  if (attendanceHigh) supportingDimensions++;

  return {
    signal,
    breakdown,
    evidence,
    blockers,
    recommendedScopes,
    supportingDimensions,
  };
}

function buildInterviewBlockerReason(r: ReadinessSignals): string {
  const weak: string[] = [];
  if (!levelAtLeast(r.completion_quality, "high")) weak.push("completion");
  if (!levelAtLeast(r.project_readiness, "high")) weak.push("projects");
  if (r.assessment_readiness !== "not_started" && !levelAtLeast(r.assessment_readiness, "high"))
    weak.push("assessments");
  if (r.attendance_health !== "not_started" && !levelAtLeast(r.attendance_health, "high"))
    weak.push("attendance");
  return weak.length ? `Needs improvement in: ${weak.join(", ")}.` : "Close to interview readiness.";
}
