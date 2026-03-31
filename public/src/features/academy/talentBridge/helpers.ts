/**
 * Academy Talent Bridge — Shared Helpers
 *
 * Route-agnostic, UI-light utilities for mapping between
 * talent bridge vocabulary and existing platform concepts.
 */

import type { TalentSignal } from "./signals";
import type { SignalLevel } from "../learningModel/readiness";
import { talentSignalRank } from "./signals";

// ── Readiness → Talent Signal mapping ────────────────────────

const LEVEL_TO_SIGNAL: Record<SignalLevel, TalentSignal> = {
  not_started: "not_ready_yet",
  low:         "not_ready_yet",
  moderate:    "portfolio_ready",
  high:        "nomination_ready",
  complete:    "interview_ready",
};

/**
 * Map a readiness overall_readiness_status to a talent signal.
 * "standout_student" requires explicit instructor action.
 */
export function readinessToTalentSignal(level: SignalLevel): TalentSignal {
  return LEVEL_TO_SIGNAL[level];
}

// ── Badge / label helpers ────────────────────────────────────

/** Format any bridge enum value for display: "role_specific" → "Role Specific". */
export function formatBridgeLabel(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Sorting / comparison ─────────────────────────────────────

/** Compare two talent signals for sorting (ascending readiness). */
export function compareTalentSignals(a: TalentSignal, b: TalentSignal): number {
  return talentSignalRank(a) - talentSignalRank(b);
}

/** Return the higher of two talent signals. */
export function maxTalentSignal(a: TalentSignal, b: TalentSignal): TalentSignal {
  return talentSignalRank(a) >= talentSignalRank(b) ? a : b;
}

/** Return the lower of two talent signals. */
export function minTalentSignal(a: TalentSignal, b: TalentSignal): TalentSignal {
  return talentSignalRank(a) <= talentSignalRank(b) ? a : b;
}

// ── Privacy-safe mapping to existing job concepts ────────────

/**
 * Determines the minimum talent signal required for a given
 * experience level from the existing Talent portal vocabulary.
 * Used for future matching — does not expose student data.
 */
export function minimumSignalForExperienceLevel(
  level: "junior" | "mid" | "senior" | "lead"
): TalentSignal {
  switch (level) {
    case "junior":  return "portfolio_ready";
    case "mid":     return "nomination_ready";
    case "senior":  return "interview_ready";
    case "lead":    return "standout_student";
  }
}

/**
 * Check if a talent signal meets the minimum for a given
 * experience level. Safe to call without exposing student data.
 */
export function signalMeetsExperienceLevel(
  signal: TalentSignal,
  level: "junior" | "mid" | "senior" | "lead"
): boolean {
  const min = minimumSignalForExperienceLevel(level);
  return talentSignalRank(signal) >= talentSignalRank(min);
}
