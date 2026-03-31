/**
 * Talent Bridge — Vocabulary, Visibility & Privacy Helpers
 *
 * Covers:
 * - Visibility states and privacy defaults
 * - Nomination eligibility logic
 * - Signal threshold comparison
 * - Nomination status helpers (terminal, transitions)
 * - Helper utilities (readinessToTalentSignal, formatBridgeLabel, etc.)
 * - Notification type config recognition
 */
import { describe, it, expect } from "vitest";
import {
  VISIBILITY_STATES,
  VISIBILITY_LABELS,
  VISIBILITY_COLORS,
  isExternallyVisible,
  isNominationEligible,
} from "@/features/academy/talentBridge/visibility";
import {
  TALENT_SIGNALS,
  TALENT_SIGNAL_LABELS,
  TALENT_SIGNAL_COLORS,
  talentSignalRank,
  meetsSignalThreshold,
} from "@/features/academy/talentBridge/signals";
import {
  NOMINATION_SCOPES,
  NOMINATION_STATUSES,
  NOMINATION_STATUS_TRANSITIONS,
  isTerminalNominationStatus,
} from "@/features/academy/talentBridge/nominations";
import {
  RECOMMENDATION_TYPES,
  RECOMMENDATION_TYPE_LABELS,
} from "@/features/academy/talentBridge/recommendations";
import {
  readinessToTalentSignal,
  formatBridgeLabel,
  compareTalentSignals,
  maxTalentSignal,
  minTalentSignal,
  minimumSignalForExperienceLevel,
  signalMeetsExperienceLevel,
} from "@/features/academy/talentBridge/helpers";

// ── Visibility & Privacy ────────────────────────────────────

describe("Visibility states", () => {
  it("defaults to privacy-safe: private is first state", () => {
    expect(VISIBILITY_STATES[0]).toBe("private");
  });

  it("has labels and colors for all states", () => {
    for (const v of VISIBILITY_STATES) {
      expect(VISIBILITY_LABELS[v]).toBeDefined();
      expect(VISIBILITY_LABELS[v].en).toBeTruthy();
      expect(VISIBILITY_LABELS[v].ar).toBeTruthy();
      expect(VISIBILITY_COLORS[v]).toBeTruthy();
    }
  });

  it("isExternallyVisible is false for private and academy_only", () => {
    expect(isExternallyVisible("private")).toBe(false);
    expect(isExternallyVisible("academy_only")).toBe(false);
  });

  it("isExternallyVisible is true only for opportunity_ready", () => {
    expect(isExternallyVisible("opportunity_ready")).toBe(true);
  });

  it("isNominationEligible is false only for private", () => {
    expect(isNominationEligible("private")).toBe(false);
    expect(isNominationEligible("academy_only")).toBe(true);
    expect(isNominationEligible("opportunity_ready")).toBe(true);
  });
});

// ── Talent Signals ──────────────────────────────────────────

describe("Talent signals", () => {
  it("has 5 ordered levels", () => {
    expect(TALENT_SIGNALS).toHaveLength(5);
    expect(TALENT_SIGNALS[0]).toBe("not_ready_yet");
    expect(TALENT_SIGNALS[4]).toBe("standout_student");
  });

  it("has labels and colors for all signals", () => {
    for (const s of TALENT_SIGNALS) {
      expect(TALENT_SIGNAL_LABELS[s].en).toBeTruthy();
      expect(TALENT_SIGNAL_COLORS[s]).toBeTruthy();
    }
  });

  it("talentSignalRank orders correctly", () => {
    expect(talentSignalRank("not_ready_yet")).toBeLessThan(talentSignalRank("standout_student"));
    expect(talentSignalRank("portfolio_ready")).toBeLessThan(talentSignalRank("nomination_ready"));
  });

  it("meetsSignalThreshold works", () => {
    expect(meetsSignalThreshold("standout_student", "not_ready_yet")).toBe(true);
    expect(meetsSignalThreshold("not_ready_yet", "portfolio_ready")).toBe(false);
    expect(meetsSignalThreshold("nomination_ready", "nomination_ready")).toBe(true);
  });
});

// ── Nominations ─────────────────────────────────────────────

describe("Nomination statuses", () => {
  it("has 6 statuses", () => {
    expect(NOMINATION_STATUSES).toHaveLength(6);
  });

  it("terminal statuses are correct", () => {
    expect(isTerminalNominationStatus("accepted")).toBe(true);
    expect(isTerminalNominationStatus("declined")).toBe(true);
    expect(isTerminalNominationStatus("archived")).toBe(true);
    expect(isTerminalNominationStatus("draft")).toBe(false);
    expect(isTerminalNominationStatus("submitted")).toBe(false);
    expect(isTerminalNominationStatus("withdrawn")).toBe(false);
  });

  it("archived has no transitions (truly terminal)", () => {
    expect(NOMINATION_STATUS_TRANSITIONS.archived).toEqual([]);
  });

  it("draft can transition to submitted or archived", () => {
    expect(NOMINATION_STATUS_TRANSITIONS.draft).toContain("submitted");
    expect(NOMINATION_STATUS_TRANSITIONS.draft).toContain("archived");
  });

  it("has 4 nomination scopes", () => {
    expect(NOMINATION_SCOPES).toHaveLength(4);
    expect(NOMINATION_SCOPES).toContain("internal_pool");
  });
});

// ── Recommendations ─────────────────────────────────────────

describe("Recommendation types", () => {
  it("has 4 types with labels", () => {
    expect(RECOMMENDATION_TYPES).toHaveLength(4);
    for (const t of RECOMMENDATION_TYPES) {
      expect(RECOMMENDATION_TYPE_LABELS[t].en).toBeTruthy();
      expect(RECOMMENDATION_TYPE_LABELS[t].ar).toBeTruthy();
    }
  });
});

// ── Helpers ─────────────────────────────────────────────────

describe("talentBridge helpers", () => {
  it("readinessToTalentSignal maps correctly", () => {
    expect(readinessToTalentSignal("not_started")).toBe("not_ready_yet");
    expect(readinessToTalentSignal("low")).toBe("not_ready_yet");
    expect(readinessToTalentSignal("moderate")).toBe("portfolio_ready");
    expect(readinessToTalentSignal("high")).toBe("nomination_ready");
    expect(readinessToTalentSignal("complete")).toBe("interview_ready");
  });

  it("formatBridgeLabel formats snake_case", () => {
    expect(formatBridgeLabel("role_specific")).toBe("Role Specific");
    expect(formatBridgeLabel("internal_pool")).toBe("Internal Pool");
  });

  it("compareTalentSignals sorts ascending", () => {
    expect(compareTalentSignals("not_ready_yet", "standout_student")).toBeLessThan(0);
    expect(compareTalentSignals("standout_student", "not_ready_yet")).toBeGreaterThan(0);
    expect(compareTalentSignals("portfolio_ready", "portfolio_ready")).toBe(0);
  });

  it("maxTalentSignal returns higher", () => {
    expect(maxTalentSignal("not_ready_yet", "portfolio_ready")).toBe("portfolio_ready");
    expect(maxTalentSignal("standout_student", "nomination_ready")).toBe("standout_student");
  });

  it("minTalentSignal returns lower", () => {
    expect(minTalentSignal("nomination_ready", "portfolio_ready")).toBe("portfolio_ready");
  });

  it("minimumSignalForExperienceLevel maps correctly", () => {
    expect(minimumSignalForExperienceLevel("junior")).toBe("portfolio_ready");
    expect(minimumSignalForExperienceLevel("mid")).toBe("nomination_ready");
    expect(minimumSignalForExperienceLevel("senior")).toBe("interview_ready");
    expect(minimumSignalForExperienceLevel("lead")).toBe("standout_student");
  });

  it("signalMeetsExperienceLevel checks correctly", () => {
    expect(signalMeetsExperienceLevel("nomination_ready", "junior")).toBe(true);
    expect(signalMeetsExperienceLevel("portfolio_ready", "mid")).toBe(false);
    expect(signalMeetsExperienceLevel("standout_student", "lead")).toBe(true);
  });
});
