/**
 * Academy Learning Model — Readiness / Outcome Signals
 *
 * Lightweight derived signals that summarize a student's learning outcome
 * readiness for future Talent Bridge integration.
 *
 * All signals are computed purely from data already available in the
 * academy domain — no new tables required.
 */

// ── Signal types ─────────────────────────────────────────────

export type SignalLevel = "not_started" | "low" | "moderate" | "high" | "complete";

export interface ReadinessSignals {
  completion_quality: SignalLevel;
  attendance_health: SignalLevel;
  assessment_readiness: SignalLevel;
  project_readiness: SignalLevel;
  overall_readiness_status: SignalLevel;
}

export const SIGNAL_LABELS: Record<SignalLevel, { en: string; ar: string }> = {
  not_started: { en: "Not Started", ar: "لم يبدأ" },
  low: { en: "Needs Work", ar: "يحتاج تحسين" },
  moderate: { en: "In Progress", ar: "قيد التقدم" },
  high: { en: "Strong", ar: "قوي" },
  complete: { en: "Complete", ar: "مكتمل" },
};

export const SIGNAL_COLORS: Record<SignalLevel, string> = {
  not_started: "bg-muted text-muted-foreground",
  low: "bg-destructive/10 text-destructive",
  moderate: "bg-amber-500/10 text-amber-600",
  high: "bg-emerald-500/10 text-emerald-600",
  complete: "bg-blue-500/10 text-blue-600",
};

// ── Pure derivation helpers ──────────────────────────────────

function ratioToLevel(completed: number, total: number): SignalLevel {
  if (total === 0) return "not_started";
  const pct = completed / total;
  if (pct >= 1) return "complete";
  if (pct >= 0.75) return "high";
  if (pct >= 0.4) return "moderate";
  if (pct > 0) return "low";
  return "not_started";
}

// ── Input shape ──────────────────────────────────────────────

export interface ReadinessInput {
  /** Lesson completion ratio */
  lessonsCompleted: number;
  lessonsTotal: number;

  /** Attendance (present count vs required-session count) */
  attendedSessions: number;
  requiredSessions: number;

  /** Assessment attempts: passed vs total required */
  assessmentsPassed: number;
  assessmentsTotal: number;

  /** Project submissions: approved vs total required */
  projectsApproved: number;
  projectsTotal: number;

  /** Whether the product type supports these dimensions */
  supportsLiveSessions: boolean;
  supportsAssessments: boolean;
  supportsProjects: boolean;
}

// ── Main derivation function ─────────────────────────────────

/**
 * Compute readiness signals from raw learning data.
 * Pure function — no side effects, no DB calls.
 */
export function computeReadiness(input: ReadinessInput): ReadinessSignals {
  const completion_quality = ratioToLevel(input.lessonsCompleted, input.lessonsTotal);

  const attendance_health = input.supportsLiveSessions
    ? ratioToLevel(input.attendedSessions, input.requiredSessions)
    : "not_started"; // N/A for self-paced

  const assessment_readiness = input.supportsAssessments
    ? ratioToLevel(input.assessmentsPassed, input.assessmentsTotal)
    : "not_started";

  const project_readiness = input.supportsProjects
    ? ratioToLevel(input.projectsApproved, input.projectsTotal)
    : "not_started";

  // Overall: weighted minimum of applicable dimensions
  const applicable: SignalLevel[] = [completion_quality];
  if (input.supportsLiveSessions) applicable.push(attendance_health);
  if (input.supportsAssessments) applicable.push(assessment_readiness);
  if (input.supportsProjects) applicable.push(project_readiness);

  const ORDER: SignalLevel[] = ["not_started", "low", "moderate", "high", "complete"];
  const overall_readiness_status = applicable.reduce((min, s) =>
    ORDER.indexOf(s) < ORDER.indexOf(min) ? s : min
  );

  return {
    completion_quality,
    attendance_health,
    assessment_readiness,
    project_readiness,
    overall_readiness_status,
  };
}
