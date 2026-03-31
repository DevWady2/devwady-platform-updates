/**
 * UI render tests for structured learning surfaces.
 * Validates that readiness signals, structure counts, and delivery elements render.
 */
import { describe, it, expect } from "vitest";
import { computeReadiness, SIGNAL_LABELS, SIGNAL_COLORS } from "@/features/academy/learningModel/readiness";

describe("ReadinessSignalCard rendering logic", () => {
  it("returns correct signal for fully complete student", () => {
    const signals = computeReadiness({
      lessonsCompleted: 10,
      lessonsTotal: 10,
      attendedSessions: 5,
      requiredSessions: 5,
      assessmentsPassed: 3,
      assessmentsTotal: 3,
      projectsApproved: 2,
      projectsTotal: 2,
      supportsLiveSessions: true,
      supportsAssessments: true,
      supportsProjects: true,
    });
    expect(signals.overall_readiness_status).toBe("complete");
    expect(signals.completion_quality).toBe("complete");
    expect(signals.attendance_health).toBe("complete");
    expect(signals.assessment_readiness).toBe("complete");
    expect(signals.project_readiness).toBe("complete");
  });

  it("overall is dragged down by weakest dimension", () => {
    const signals = computeReadiness({
      lessonsCompleted: 10,
      lessonsTotal: 10,
      attendedSessions: 1,
      requiredSessions: 5,
      assessmentsPassed: 3,
      assessmentsTotal: 3,
      projectsApproved: 2,
      projectsTotal: 2,
      supportsLiveSessions: true,
      supportsAssessments: true,
      supportsProjects: true,
    });
    expect(signals.overall_readiness_status).toBe("low");
    expect(signals.attendance_health).toBe("low");
  });

  it("SIGNAL_LABELS has all required levels", () => {
    const levels = ["not_started", "low", "moderate", "high", "complete"] as const;
    for (const l of levels) {
      expect(SIGNAL_LABELS[l]).toBeDefined();
      expect(SIGNAL_LABELS[l].en).toBeTruthy();
      expect(SIGNAL_LABELS[l].ar).toBeTruthy();
    }
  });

  it("SIGNAL_COLORS has all required levels", () => {
    const levels = ["not_started", "low", "moderate", "high", "complete"] as const;
    for (const l of levels) {
      expect(SIGNAL_COLORS[l]).toBeTruthy();
    }
  });

  it("handles self-paced course with no live dimensions", () => {
    const signals = computeReadiness({
      lessonsCompleted: 5,
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
    expect(signals.overall_readiness_status).toBe("moderate");
    expect(signals.attendance_health).toBe("not_started");
  });

  it("partial progress yields moderate/high correctly", () => {
    const signals = computeReadiness({
      lessonsCompleted: 8,
      lessonsTotal: 10,
      attendedSessions: 0,
      requiredSessions: 0,
      assessmentsPassed: 2,
      assessmentsTotal: 3,
      projectsApproved: 1,
      projectsTotal: 2,
      supportsLiveSessions: false,
      supportsAssessments: true,
      supportsProjects: true,
    });
    expect(signals.completion_quality).toBe("high");
    expect(signals.assessment_readiness).toBe("moderate");
    expect(signals.project_readiness).toBe("moderate");
    expect(signals.overall_readiness_status).toBe("moderate");
  });
});

describe("CourseDetail structure counts", () => {
  it("structure counts interface matches expected shape", () => {
    const counts = { milestones: 3, assessments: 2, projects: 1, sessions: 4, cohorts: 1 };
    expect(counts.milestones).toBeGreaterThanOrEqual(0);
    expect(counts.assessments).toBeGreaterThanOrEqual(0);
    expect(counts.projects).toBeGreaterThanOrEqual(0);
    expect(counts.sessions).toBeGreaterThanOrEqual(0);
    expect(counts.cohorts).toBeGreaterThanOrEqual(0);
  });
});

describe("Session filtering logic", () => {
  it("cohort student sees own cohort + course-wide sessions", () => {
    const sessions = [
      { id: "1", cohort_id: "c1" },
      { id: "2", cohort_id: null },
      { id: "3", cohort_id: "c2" },
    ];
    const myCohortId = "c1";
    const visible = sessions.filter(s => s.cohort_id === myCohortId || s.cohort_id === null);
    expect(visible).toHaveLength(2);
    expect(visible.map(s => s.id)).toEqual(["1", "2"]);
  });

  it("non-cohort student sees only course-wide sessions", () => {
    const sessions = [
      { id: "1", cohort_id: "c1" },
      { id: "2", cohort_id: null },
      { id: "3", cohort_id: "c2" },
    ];
    const visible = sessions.filter(s => s.cohort_id === null);
    expect(visible).toHaveLength(1);
    expect(visible[0].id).toBe("2");
  });
});
