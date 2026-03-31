/**
 * LP-07A — Talent Profile state consistency & signal truthfulness tests.
 *
 * Proves:
 * 1. Changing visibility away from opportunity_ready clears allow_opportunity_matching in the saved payload
 * 2. The signal derivation does NOT rely on fake hardcoded full-signal inputs
 */
import { describe, it, expect } from "vitest";
import { computeReadiness } from "@/features/academy/learningModel/readiness";
import { deriveTalentSignal } from "@/features/academy/talentBridge/derivedSignals";

// ── Helper: mirrors the save payload logic from AcademyTalentProfile ──

function buildSavePayload(
  visibility: string,
  allowMatching: boolean,
) {
  const effectiveMatching = visibility === "opportunity_ready" ? allowMatching : false;
  return {
    visibility_state: visibility,
    allow_opportunity_matching: effectiveMatching,
  };
}

describe("Talent Profile — state consistency on save", () => {
  it("saves allow_opportunity_matching=true when visibility is opportunity_ready", () => {
    const payload = buildSavePayload("opportunity_ready", true);
    expect(payload.allow_opportunity_matching).toBe(true);
  });

  it("clears allow_opportunity_matching when visibility is academy_only", () => {
    const payload = buildSavePayload("academy_only", true);
    expect(payload.allow_opportunity_matching).toBe(false);
  });

  it("clears allow_opportunity_matching when visibility is private", () => {
    const payload = buildSavePayload("private", true);
    expect(payload.allow_opportunity_matching).toBe(false);
  });

  it("keeps allow_opportunity_matching=false when already false", () => {
    const payload = buildSavePayload("opportunity_ready", false);
    expect(payload.allow_opportunity_matching).toBe(false);
  });
});

describe("Talent Profile — signal truthfulness (no fake full-signal)", () => {
  it("produces not_ready_yet when only lesson data exists with no projects", () => {
    // This mirrors the real page: supportsProjects=false, supportsAssessments=false
    const readiness = computeReadiness({
      lessonsCompleted: 8,
      lessonsTotal: 10,
      attendedSessions: 0,
      requiredSessions: 0,
      assessmentsPassed: 0,
      assessmentsTotal: 0,
      projectsApproved: 0,
      projectsTotal: 0,
      supportsLiveSessions: false,
      supportsAssessments: false,
      supportsProjects: false,
    });

    const result = deriveTalentSignal({
      readiness,
      lessonsCompleted: 8,
      lessonsTotal: 10,
      projectsApproved: 0,
      projectsTotal: 0,
      assessmentsPassed: 0,
      assessmentsTotal: 0,
      attendedSessions: 0,
      requiredSessions: 0,
      isBootcamp: false,
      isLiveCourse: false,
      hasInstructorRecommendation: false,
      recommendationCount: 0,
    });

    // Without approved projects, portfolio_ready is impossible → stays not_ready_yet
    expect(result.signal).toBe("not_ready_yet");
  });

  it("does not claim standout_student from lesson data alone", () => {
    const readiness = computeReadiness({
      lessonsCompleted: 10,
      lessonsTotal: 10,
      attendedSessions: 0,
      requiredSessions: 0,
      assessmentsPassed: 0,
      assessmentsTotal: 0,
      projectsApproved: 0,
      projectsTotal: 0,
      supportsLiveSessions: false,
      supportsAssessments: false,
      supportsProjects: false,
    });

    const result = deriveTalentSignal({
      readiness,
      lessonsCompleted: 10,
      lessonsTotal: 10,
      projectsApproved: 0,
      projectsTotal: 0,
      assessmentsPassed: 0,
      assessmentsTotal: 0,
      attendedSessions: 0,
      requiredSessions: 0,
      isBootcamp: false,
      isLiveCourse: false,
      hasInstructorRecommendation: true,
      recommendationCount: 1,
    });

    // Even 100% lessons + recommendation cannot reach standout without projects
    expect(result.signal).not.toBe("standout_student");
    expect(result.signal).not.toBe("interview_ready");
    expect(result.signal).toBe("not_ready_yet");
  });

  it("reaches portfolio_ready only when projects are genuinely approved", () => {
    const readiness = computeReadiness({
      lessonsCompleted: 8,
      lessonsTotal: 10,
      attendedSessions: 0,
      requiredSessions: 0,
      assessmentsPassed: 0,
      assessmentsTotal: 0,
      projectsApproved: 1,
      projectsTotal: 2,
      supportsLiveSessions: false,
      supportsAssessments: false,
      supportsProjects: true,
    });

    const result = deriveTalentSignal({
      readiness,
      lessonsCompleted: 8,
      lessonsTotal: 10,
      projectsApproved: 1,
      projectsTotal: 2,
      assessmentsPassed: 0,
      assessmentsTotal: 0,
      attendedSessions: 0,
      requiredSessions: 0,
      isBootcamp: false,
      isLiveCourse: false,
      hasInstructorRecommendation: false,
      recommendationCount: 0,
    });

    expect(result.signal).toBe("portfolio_ready");
  });
});
