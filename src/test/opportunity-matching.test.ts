/**
 * Tests for the opportunity matching preparation layer.
 * Covers alignment scoring, track matching, tag overlap,
 * seniority detection, readiness gating, and summary counts.
 */
import { describe, it, expect } from "vitest";
import {
  matchStudentToOpportunity,
  matchStudentToOpportunities,
  type StudentMatchProfile,
  type OpportunityRecord,
} from "@/features/academy/talentBridge/opportunityMatching";

const baseStudent: StudentMatchProfile = {
  primaryTrack: "Frontend Development",
  specializationTags: ["React", "TypeScript", "Tailwind"],
  talentSignal: "nomination_ready",
  hasRecommendation: false,
  nominationCount: 0,
  availabilityStatus: "actively_looking",
};

const baseOpp: OpportunityRecord = {
  id: "opp-1",
  title: "Junior React Developer",
  type: "full-time",
  tags: ["React", "JavaScript", "CSS"],
  requirements: ["React experience", "Git basics"],
  location: "Remote",
};

describe("matchStudentToOpportunity", () => {
  it("returns positive alignment for track + tag match", () => {
    const result = matchStudentToOpportunity(baseStudent, baseOpp);
    expect(result.meetsMinimumReadiness).toBe(true);
    expect(result.alignmentScore).toBeGreaterThan(40);
    expect(result.matchReasons.length).toBeGreaterThan(0);
    expect(result.matchReasons.some(r => r.includes("React"))).toBe(true);
  });

  it("gates on minimum readiness", () => {
    const weak: StudentMatchProfile = { ...baseStudent, talentSignal: "not_ready_yet" };
    const result = matchStudentToOpportunity(weak, baseOpp);
    expect(result.meetsMinimumReadiness).toBe(false);
    expect(result.mismatchReasons.some(r => r.includes("below minimum"))).toBe(true);
  });

  it("handles null talent signal", () => {
    const none: StudentMatchProfile = { ...baseStudent, talentSignal: null };
    const result = matchStudentToOpportunity(none, baseOpp);
    expect(result.meetsMinimumReadiness).toBe(false);
  });

  it("detects seniority mismatch for senior roles", () => {
    const seniorOpp: OpportunityRecord = {
      ...baseOpp,
      id: "opp-sr",
      title: "Senior Backend Engineer",
      tags: ["Node.js"],
    };
    const result = matchStudentToOpportunity(baseStudent, seniorOpp);
    expect(result.mismatchReasons.some(r => r.includes("senior"))).toBe(true);
  });

  it("awards bonus for recommendation", () => {
    const endorsed = { ...baseStudent, hasRecommendation: true, nominationCount: 2 };
    const r1 = matchStudentToOpportunity(baseStudent, baseOpp);
    const r2 = matchStudentToOpportunity(endorsed, baseOpp);
    expect(r2.alignmentScore).toBeGreaterThan(r1.alignmentScore);
    expect(r2.matchReasons.some(r => r.includes("recommendation"))).toBe(true);
    expect(r2.matchReasons.some(r => r.includes("nomination"))).toBe(true);
  });

  it("handles no tag overlap gracefully", () => {
    const noOverlap: OpportunityRecord = {
      ...baseOpp,
      tags: ["Java", "Spring"],
    };
    const result = matchStudentToOpportunity(baseStudent, noOverlap);
    expect(result.mismatchReasons.some(r => r.includes("No overlapping"))).toBe(true);
  });

  it("handles student with no track", () => {
    const noTrack = { ...baseStudent, primaryTrack: null };
    const result = matchStudentToOpportunity(noTrack, baseOpp);
    expect(result.mismatchReasons.some(r => r.includes("no primary track"))).toBe(true);
  });

  it("detects intern-level opportunities", () => {
    const internOpp: OpportunityRecord = {
      ...baseOpp,
      id: "opp-intern",
      title: "Product Design Intern",
      tags: ["Figma"],
    };
    const result = matchStudentToOpportunity(
      { ...baseStudent, talentSignal: "portfolio_ready" },
      internOpp,
    );
    expect(result.matchReasons.some(r => r.includes("intern"))).toBe(true);
  });
});

describe("matchStudentToOpportunities", () => {
  it("returns sorted summary with correct counts", () => {
    const opps: OpportunityRecord[] = [
      baseOpp,
      { id: "opp-2", title: "Laravel Backend Dev", type: "full-time", tags: ["PHP", "Laravel"], requirements: [], location: null },
      { id: "opp-3", title: "QA Engineer", type: "contract", tags: ["Selenium"], requirements: [], location: null },
    ];
    const summary = matchStudentToOpportunities(baseStudent, opps);
    expect(summary.totalOpportunities).toBe(3);
    expect(summary.results).toHaveLength(3);
    expect(summary.results[0].alignmentScore).toBeGreaterThanOrEqual(summary.results[1].alignmentScore);
    expect(summary.alignedCount + summary.partialCount + summary.notReadyCount).toBe(3);
  });

  it("marks all as not-ready for weak student", () => {
    const weak: StudentMatchProfile = { ...baseStudent, talentSignal: "not_ready_yet" };
    const summary = matchStudentToOpportunities(weak, [baseOpp]);
    expect(summary.notReadyCount).toBe(1);
    expect(summary.alignedCount).toBe(0);
  });

  it("handles empty opportunities", () => {
    const summary = matchStudentToOpportunities(baseStudent, []);
    expect(summary.totalOpportunities).toBe(0);
    expect(summary.results).toHaveLength(0);
  });
});
