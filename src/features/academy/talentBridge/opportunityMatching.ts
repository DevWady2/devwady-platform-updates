/**
 * Academy Talent Bridge — Opportunity Matching (Read-Only Preparation)
 *
 * Lightweight, explainable matching between student talent profiles
 * and existing job/opportunity records. Pure functions — no DB calls.
 *
 * NOT a ranking engine. Returns simple match/mismatch reasons
 * for internal instructor and opted-in student surfaces only.
 *
 * Company-facing surfaces and apply flows are NOT part of this layer.
 * Jobs/opportunities remain owned by the existing Talent portal sector.
 *
 * TODO: When Talent Bridge integration progresses, this may feed into
 * a formal matching pipeline. For now it is read-only preparation.
 */

import type { TalentSignal } from "./signals";
import { talentSignalRank } from "./signals";

// ── Input types ──────────────────────────────────────────────

export interface StudentMatchProfile {
  primaryTrack: string | null;
  specializationTags: string[];
  talentSignal: TalentSignal | null;
  hasRecommendation: boolean;
  nominationCount: number;
  availabilityStatus: string | null;
}

export interface OpportunityRecord {
  id: string;
  title: string;
  type: string;
  tags: string[];
  requirements: string[];
  location: string | null;
}

// ── Output types ─────────────────────────────────────────────

export interface OpportunityMatchResult {
  opportunityId: string;
  opportunityTitle: string;
  /** 0–100 alignment score for sorting (NOT a ranking) */
  alignmentScore: number;
  matchReasons: string[];
  mismatchReasons: string[];
  /** Whether the student meets minimum readiness for this opportunity */
  meetsMinimumReadiness: boolean;
}

export interface MatchingSummary {
  totalOpportunities: number;
  alignedCount: number;
  partialCount: number;
  notReadyCount: number;
  results: OpportunityMatchResult[];
}

// ── Constants ────────────────────────────────────────────────

/** Minimum signal level to be considered for any opportunity */
const MIN_SIGNAL_FOR_MATCHING: TalentSignal = "portfolio_ready";

/** Signal thresholds per opportunity seniority hint */
const SENIORITY_SIGNAL_MAP: Record<string, TalentSignal> = {
  intern: "portfolio_ready",
  junior: "nomination_ready",
  mid: "interview_ready",
  senior: "standout_student",
};

// ── Core matching logic ──────────────────────────────────────

/**
 * Compute match alignment between a student and a single opportunity.
 * Pure, deterministic, explainable.
 */
export function matchStudentToOpportunity(
  student: StudentMatchProfile,
  opportunity: OpportunityRecord,
): OpportunityMatchResult {
  const matchReasons: string[] = [];
  const mismatchReasons: string[] = [];
  let score = 0;

  // 1) Readiness gate
  const signalRank = student.talentSignal
    ? talentSignalRank(student.talentSignal)
    : -1;
  const minRank = talentSignalRank(MIN_SIGNAL_FOR_MATCHING);
  const meetsMinimumReadiness = signalRank >= minRank;

  if (!meetsMinimumReadiness) {
    mismatchReasons.push(
      `Talent signal (${student.talentSignal ?? "none"}) below minimum (${MIN_SIGNAL_FOR_MATCHING}).`,
    );
  } else {
    matchReasons.push(`Meets minimum readiness: ${student.talentSignal}.`);
    score += 20;
  }

  // 2) Track alignment
  const trackMatch = matchTrack(student, opportunity);
  if (trackMatch.matched) {
    matchReasons.push(trackMatch.reason);
    score += 30;
  } else if (trackMatch.reason) {
    mismatchReasons.push(trackMatch.reason);
  }

  // 3) Tag/specialization overlap
  const tagOverlap = computeTagOverlap(student.specializationTags, opportunity.tags);
  if (tagOverlap.count > 0) {
    matchReasons.push(`${tagOverlap.count} matching tag(s): ${tagOverlap.matched.join(", ")}.`);
    score += Math.min(tagOverlap.count * 10, 25);
  } else if (opportunity.tags.length > 0 && student.specializationTags.length > 0) {
    mismatchReasons.push("No overlapping specialization tags.");
  }

  // 4) Seniority alignment
  const seniorityHint = detectSeniority(opportunity.title, opportunity.type);
  if (seniorityHint) {
    const requiredSignal = SENIORITY_SIGNAL_MAP[seniorityHint] ?? MIN_SIGNAL_FOR_MATCHING;
    const requiredRank = talentSignalRank(requiredSignal);
    if (signalRank >= requiredRank) {
      matchReasons.push(`Signal level meets ${seniorityHint}-level requirement.`);
      score += 15;
    } else {
      mismatchReasons.push(
        `${seniorityHint}-level role needs ${requiredSignal}, student is ${student.talentSignal ?? "none"}.`,
      );
    }
  }

  // 5) Endorsement bonus
  if (student.hasRecommendation) {
    matchReasons.push("Has instructor recommendation.");
    score += 10;
  }
  if (student.nominationCount > 0) {
    matchReasons.push(`${student.nominationCount} nomination(s) on record.`);
    score += 5;
  }

  return {
    opportunityId: opportunity.id,
    opportunityTitle: opportunity.title,
    alignmentScore: Math.min(score, 100),
    matchReasons,
    mismatchReasons,
    meetsMinimumReadiness,
  };
}

/**
 * Match a student against all available opportunities.
 * Returns a sorted summary with aligned/partial/not-ready counts.
 */
export function matchStudentToOpportunities(
  student: StudentMatchProfile,
  opportunities: OpportunityRecord[],
): MatchingSummary {
  const results = opportunities.map((opp) =>
    matchStudentToOpportunity(student, opp),
  );

  // Sort by alignment score descending
  results.sort((a, b) => b.alignmentScore - a.alignmentScore);

  let alignedCount = 0;
  let partialCount = 0;
  let notReadyCount = 0;

  for (const r of results) {
    if (!r.meetsMinimumReadiness) {
      notReadyCount++;
    } else if (r.alignmentScore >= 50) {
      alignedCount++;
    } else {
      partialCount++;
    }
  }

  return {
    totalOpportunities: opportunities.length,
    alignedCount,
    partialCount,
    notReadyCount,
    results,
  };
}

// ── Internal helpers ─────────────────────────────────────────

function matchTrack(
  student: StudentMatchProfile,
  opportunity: OpportunityRecord,
): { matched: boolean; reason: string } {
  if (!student.primaryTrack) {
    return { matched: false, reason: "Student has no primary track set." };
  }

  const studentTrack = student.primaryTrack.toLowerCase();
  const oppText = [
    opportunity.title,
    ...opportunity.tags,
    ...opportunity.requirements,
  ]
    .join(" ")
    .toLowerCase();

  // Check if student track keywords appear in opportunity text
  const trackWords = studentTrack.split(/[\s,/]+/).filter((w) => w.length > 2);
  const hits = trackWords.filter((w) => oppText.includes(w));

  if (hits.length > 0) {
    return {
      matched: true,
      reason: `Track "${student.primaryTrack}" aligns with opportunity.`,
    };
  }

  return {
    matched: false,
    reason: `Track "${student.primaryTrack}" does not align with "${opportunity.title}".`,
  };
}

function computeTagOverlap(
  studentTags: string[],
  oppTags: string[],
): { count: number; matched: string[] } {
  const studentSet = new Set(studentTags.map((t) => t.toLowerCase().trim()));
  const matched: string[] = [];

  for (const tag of oppTags) {
    if (studentSet.has(tag.toLowerCase().trim())) {
      matched.push(tag);
    }
  }

  return { count: matched.length, matched };
}

function detectSeniority(
  title: string,
  type: string,
): string | null {
  const text = `${title} ${type}`.toLowerCase();

  if (text.includes("intern") || text.includes("trainee") || text.includes("graduate")) {
    return "intern";
  }
  if (text.includes("junior") || text.includes("jr.") || text.includes("entry")) {
    return "junior";
  }
  if (text.includes("senior") || text.includes("sr.") || text.includes("lead")) {
    return "senior";
  }
  if (text.includes("mid") || text.includes("intermediate")) {
    return "mid";
  }

  return null;
}
