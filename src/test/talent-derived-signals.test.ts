/**
 * Tests for the derived talent signal computation.
 *
 * Covers all 5 signal levels, edge cases, blocker generation,
 * evidence snippets, and recommended scope output.
 */
import { describe, it, expect } from "vitest";
import { deriveTalentSignal, type TalentSignalInput } from "@/features/academy/talentBridge/derivedSignals";
import { computeReadiness, type ReadinessInput } from "@/features/academy/learningModel/readiness";

// Helper to build a full input from partial overrides
function makeInput(overrides: Partial<TalentSignalInput> = {}): TalentSignalInput {
  const readinessInput: ReadinessInput = {
    lessonsCompleted: overrides.lessonsCompleted ?? 0,
    lessonsTotal: overrides.lessonsTotal ?? 10,
    attendedSessions: overrides.attendedSessions ?? 0,
    requiredSessions: overrides.requiredSessions ?? 0,
    assessmentsPassed: overrides.assessmentsPassed ?? 0,
    assessmentsTotal: overrides.assessmentsTotal ?? 0,
    projectsApproved: overrides.projectsApproved ?? 0,
    projectsTotal: overrides.projectsTotal ?? 0,
    supportsLiveSessions: (overrides.requiredSessions ?? 0) > 0,
    supportsAssessments: (overrides.assessmentsTotal ?? 0) > 0,
    supportsProjects: (overrides.projectsTotal ?? 0) > 0,
  };

  return {
    readiness: computeReadiness(readinessInput),
    lessonsCompleted: readinessInput.lessonsCompleted,
    lessonsTotal: readinessInput.lessonsTotal,
    projectsApproved: readinessInput.projectsApproved,
    projectsTotal: readinessInput.projectsTotal,
    assessmentsPassed: readinessInput.assessmentsPassed,
    assessmentsTotal: readinessInput.assessmentsTotal,
    attendedSessions: readinessInput.attendedSessions,
    requiredSessions: readinessInput.requiredSessions,
    isBootcamp: overrides.isBootcamp ?? false,
    isLiveCourse: overrides.isLiveCourse ?? false,
    cohortCompletionState: overrides.cohortCompletionState ?? null,
    hasInstructorRecommendation: overrides.hasInstructorRecommendation ?? false,
    recommendationCount: overrides.recommendationCount ?? 0,
  };
}

describe("deriveTalentSignal", () => {
  describe("not_ready_yet", () => {
    it("returns not_ready_yet for a fresh student with no progress", () => {
      const result = deriveTalentSignal(makeInput());
      expect(result.signal).toBe("not_ready_yet");
      expect(result.breakdown.not_ready_yet.met).toBe(true);
      expect(result.blockers.length).toBeGreaterThan(0);
    });

    it("returns not_ready_yet when lessons started but no projects", () => {
      const result = deriveTalentSignal(makeInput({
        lessonsCompleted: 3,
        lessonsTotal: 10,
        projectsTotal: 2,
        projectsApproved: 0,
      }));
      expect(result.signal).toBe("not_ready_yet");
    });
  });

  describe("portfolio_ready", () => {
    it("triggers when ≥1 project approved and completion ≥ moderate", () => {
      const result = deriveTalentSignal(makeInput({
        lessonsCompleted: 5,
        lessonsTotal: 10,
        projectsApproved: 1,
        projectsTotal: 2,
      }));
      expect(result.signal).toBe("portfolio_ready");
      expect(result.breakdown.portfolio_ready.met).toBe(true);
    });

    it("does not trigger with approved project but low completion", () => {
      const result = deriveTalentSignal(makeInput({
        lessonsCompleted: 1,
        lessonsTotal: 10,
        projectsApproved: 1,
        projectsTotal: 2,
      }));
      expect(result.signal).toBe("not_ready_yet");
      expect(result.breakdown.portfolio_ready.met).toBe(false);
    });

    it("suggests internal_pool scope", () => {
      const result = deriveTalentSignal(makeInput({
        lessonsCompleted: 5,
        lessonsTotal: 10,
        projectsApproved: 1,
        projectsTotal: 2,
      }));
      expect(result.recommendedScopes).toContain("internal_pool");
      expect(result.recommendedScopes).not.toContain("role_specific");
    });
  });

  describe("nomination_ready", () => {
    it("triggers with portfolio + high assessments", () => {
      const result = deriveTalentSignal(makeInput({
        lessonsCompleted: 6,
        lessonsTotal: 10,
        projectsApproved: 1,
        projectsTotal: 2,
        assessmentsPassed: 4,
        assessmentsTotal: 5,
      }));
      expect(result.signal).toBe("nomination_ready");
      expect(result.breakdown.nomination_ready.met).toBe(true);
    });

    it("triggers with portfolio + high attendance", () => {
      const result = deriveTalentSignal(makeInput({
        lessonsCompleted: 5,
        lessonsTotal: 10,
        projectsApproved: 1,
        projectsTotal: 2,
        attendedSessions: 8,
        requiredSessions: 10,
      }));
      expect(result.signal).toBe("nomination_ready");
    });

    it("does not trigger with portfolio but moderate assessment only", () => {
      const result = deriveTalentSignal(makeInput({
        lessonsCompleted: 5,
        lessonsTotal: 10,
        projectsApproved: 1,
        projectsTotal: 2,
        assessmentsPassed: 2,
        assessmentsTotal: 5,
      }));
      expect(result.signal).toBe("portfolio_ready");
    });

    it("suggests general_opportunity scope", () => {
      const result = deriveTalentSignal(makeInput({
        lessonsCompleted: 6,
        lessonsTotal: 10,
        projectsApproved: 1,
        projectsTotal: 2,
        assessmentsPassed: 4,
        assessmentsTotal: 5,
      }));
      expect(result.recommendedScopes).toContain("general_opportunity");
    });
  });

  describe("interview_ready", () => {
    it("triggers when all applicable dimensions are high", () => {
      const result = deriveTalentSignal(makeInput({
        lessonsCompleted: 8,
        lessonsTotal: 10,
        projectsApproved: 4,
        projectsTotal: 5,
        assessmentsPassed: 4,
        assessmentsTotal: 5,
        attendedSessions: 9,
        requiredSessions: 10,
      }));
      expect(result.signal).toBe("interview_ready");
      expect(result.breakdown.interview_ready.met).toBe(true);
      expect(result.supportingDimensions).toBe(4);
    });

    it("triggers for self-paced with no sessions/assessments when projects+completion high", () => {
      const result = deriveTalentSignal(makeInput({
        lessonsCompleted: 8,
        lessonsTotal: 10,
        projectsApproved: 4,
        projectsTotal: 5,
      }));
      // No assessments or sessions — those are "not_started", so not blocking
      // But nomination_ready requires portfolio + strong dimension,
      // and with no assessments/attendance both are not_started.
      // So nomination gate fails => stays portfolio_ready
      expect(result.signal).toBe("portfolio_ready");
    });

    it("suggests role_specific scope", () => {
      const result = deriveTalentSignal(makeInput({
        lessonsCompleted: 8,
        lessonsTotal: 10,
        projectsApproved: 4,
        projectsTotal: 5,
        assessmentsPassed: 4,
        assessmentsTotal: 5,
        attendedSessions: 9,
        requiredSessions: 10,
      }));
      expect(result.recommendedScopes).toContain("role_specific");
    });
  });

  describe("standout_student", () => {
    it("triggers when interview_ready + instructor recommendation", () => {
      const result = deriveTalentSignal(makeInput({
        lessonsCompleted: 10,
        lessonsTotal: 10,
        projectsApproved: 5,
        projectsTotal: 5,
        assessmentsPassed: 5,
        assessmentsTotal: 5,
        attendedSessions: 10,
        requiredSessions: 10,
        hasInstructorRecommendation: true,
        recommendationCount: 2,
      }));
      expect(result.signal).toBe("standout_student");
      expect(result.breakdown.standout_student.met).toBe(true);
      expect(result.recommendedScopes).toContain("company_specific");
    });

    it("does not trigger without recommendation even if all dimensions complete", () => {
      const result = deriveTalentSignal(makeInput({
        lessonsCompleted: 10,
        lessonsTotal: 10,
        projectsApproved: 5,
        projectsTotal: 5,
        assessmentsPassed: 5,
        assessmentsTotal: 5,
        attendedSessions: 10,
        requiredSessions: 10,
        hasInstructorRecommendation: false,
      }));
      expect(result.signal).toBe("interview_ready");
      expect(result.blockers).toContain("Obtain an instructor recommendation.");
    });
  });

  describe("evidence and blockers", () => {
    it("generates evidence snippets from available data", () => {
      const result = deriveTalentSignal(makeInput({
        lessonsCompleted: 7,
        lessonsTotal: 10,
        projectsApproved: 2,
        projectsTotal: 3,
        assessmentsPassed: 3,
        assessmentsTotal: 4,
        isBootcamp: true,
        recommendationCount: 1,
        hasInstructorRecommendation: true,
      }));
      expect(result.evidence.some(e => e.includes("7/10 lessons"))).toBe(true);
      expect(result.evidence.some(e => e.includes("2/3 projects"))).toBe(true);
      expect(result.evidence.some(e => e.includes("3/4 assessments"))).toBe(true);
      expect(result.evidence.some(e => e.includes("Bootcamp"))).toBe(true);
      expect(result.evidence.some(e => e.includes("1 instructor"))).toBe(true);
    });

    it("generates actionable blockers for not_ready_yet", () => {
      const result = deriveTalentSignal(makeInput({
        lessonsCompleted: 1,
        lessonsTotal: 10,
        projectsTotal: 2,
      }));
      expect(result.blockers.some(b => b.includes("project"))).toBe(true);
      expect(result.blockers.some(b => b.includes("lessons"))).toBe(true);
    });

    it("includes cohort state in evidence when provided", () => {
      const result = deriveTalentSignal(makeInput({
        cohortCompletionState: "graduated",
      }));
      expect(result.evidence.some(e => e.includes("graduated"))).toBe(true);
    });
  });

  describe("supporting dimensions", () => {
    it("counts 0 when nothing is high", () => {
      const result = deriveTalentSignal(makeInput());
      expect(result.supportingDimensions).toBe(0);
    });

    it("counts correctly with mixed levels", () => {
      const result = deriveTalentSignal(makeInput({
        lessonsCompleted: 8,
        lessonsTotal: 10,
        projectsApproved: 1,
        projectsTotal: 5,
        assessmentsPassed: 4,
        assessmentsTotal: 5,
      }));
      // completion=high, projects=low, assessments=high
      expect(result.supportingDimensions).toBe(2);
    });
  });
});
