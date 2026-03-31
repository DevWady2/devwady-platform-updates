import { describe, it, expect } from "vitest";
import { computeReadiness, type ReadinessInput } from "@/features/academy/learningModel/readiness";

const BASE: ReadinessInput = {
  lessonsCompleted: 0,
  lessonsTotal: 10,
  attendedSessions: 0,
  requiredSessions: 5,
  assessmentsPassed: 0,
  assessmentsTotal: 3,
  projectsApproved: 0,
  projectsTotal: 2,
  supportsLiveSessions: true,
  supportsAssessments: true,
  supportsProjects: true,
};

describe("computeReadiness", () => {
  it("returns not_started when no progress exists", () => {
    const r = computeReadiness(BASE);
    expect(r.completion_quality).toBe("not_started");
    expect(r.overall_readiness_status).toBe("not_started");
  });

  it("returns complete when all dimensions are fully done", () => {
    const r = computeReadiness({
      ...BASE,
      lessonsCompleted: 10,
      attendedSessions: 5,
      assessmentsPassed: 3,
      projectsApproved: 2,
    });
    expect(r.completion_quality).toBe("complete");
    expect(r.attendance_health).toBe("complete");
    expect(r.assessment_readiness).toBe("complete");
    expect(r.project_readiness).toBe("complete");
    expect(r.overall_readiness_status).toBe("complete");
  });

  it("overall is the minimum of applicable dimensions", () => {
    const r = computeReadiness({
      ...BASE,
      lessonsCompleted: 10,
      attendedSessions: 5,
      assessmentsPassed: 3,
      projectsApproved: 0, // low dimension
    });
    expect(r.completion_quality).toBe("complete");
    expect(r.project_readiness).toBe("not_started");
    expect(r.overall_readiness_status).toBe("not_started");
  });

  it("ignores non-applicable dimensions for self-paced courses", () => {
    const r = computeReadiness({
      ...BASE,
      lessonsCompleted: 8,
      supportsLiveSessions: false,
      supportsAssessments: false,
      supportsProjects: false,
    });
    expect(r.attendance_health).toBe("not_started"); // N/A
    expect(r.overall_readiness_status).toBe("high"); // only lessons count
  });

  it("handles zero totals gracefully", () => {
    const r = computeReadiness({
      ...BASE,
      lessonsTotal: 0,
      requiredSessions: 0,
      assessmentsTotal: 0,
      projectsTotal: 0,
    });
    expect(r.completion_quality).toBe("not_started");
  });

  it("returns moderate for partial progress", () => {
    const r = computeReadiness({
      ...BASE,
      lessonsCompleted: 5,
      attendedSessions: 3,
      assessmentsPassed: 2,
      projectsApproved: 1,
    });
    expect(r.completion_quality).toBe("moderate");
    expect(r.attendance_health).toBe("moderate");
    expect(r.assessment_readiness).toBe("moderate");
    expect(r.project_readiness).toBe("moderate");
    expect(r.overall_readiness_status).toBe("moderate");
  });

  it("returns high for 75%+ progress", () => {
    const r = computeReadiness({
      ...BASE,
      lessonsCompleted: 8,
      supportsLiveSessions: false,
      supportsAssessments: false,
      supportsProjects: false,
    });
    expect(r.completion_quality).toBe("high");
  });
});
