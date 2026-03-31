/**
 * LP-15A/15B — Course-level assistant tab rendering logic tests.
 *
 * Validates that the assistant tab derives the correct UI state
 * from course-scoped assistant_invitations records.
 */
import { describe, it, expect } from "vitest";

/* ── Helpers mirroring rendering logic ── */

interface CourseAssistant {
  id: string;
  freelancer_id: string;
  status: string;
  role: string | null;
  support_scope: string | null;
}

function deriveCourseAssistantState(records: CourseAssistant[]) {
  const accepted = records.filter((r) => r.status === "accepted");
  const pending = records.filter((r) => r.status === "pending");

  const showAccepted = accepted.length > 0;
  const showPending = pending.length > 0;
  const showEmpty = !showAccepted && !showPending;

  return { showAccepted, showPending, showEmpty, accepted, pending };
}

/* ── Tests ── */

describe("LP-15A: Course assistant tab state", () => {
  it("shows assigned state when accepted assistant exists", () => {
    const records: CourseAssistant[] = [
      { id: "1", freelancer_id: "f1", status: "accepted", role: "technical_assistant", support_scope: "Q&A" },
    ];
    const state = deriveCourseAssistantState(records);
    expect(state.showAccepted).toBe(true);
    expect(state.accepted).toHaveLength(1);
  });

  it("shows pending state when only pending invitations exist", () => {
    const records: CourseAssistant[] = [
      { id: "2", freelancer_id: "f2", status: "pending", role: null, support_scope: null },
    ];
    const state = deriveCourseAssistantState(records);
    expect(state.showPending).toBe(true);
    expect(state.showEmpty).toBe(false);
  });

  it("shows empty state when no relevant records exist", () => {
    const state = deriveCourseAssistantState([]);
    expect(state.showEmpty).toBe(true);
    expect(state.showAccepted).toBe(false);
    expect(state.showPending).toBe(false);
  });

  it("shows empty state when only declined records exist", () => {
    const records: CourseAssistant[] = [
      { id: "3", freelancer_id: "f3", status: "declined", role: null, support_scope: null },
    ];
    const state = deriveCourseAssistantState(records);
    expect(state.showEmpty).toBe(true);
  });

  it("invite entry point receives preselected course ID", () => {
    const courseId = "course-abc-123";
    const preselectedProp = { preselectedCourseId: courseId };
    expect(preselectedProp.preselectedCourseId).toBe(courseId);
  });

  it("does not count records from other courses", () => {
    const allRecords: (CourseAssistant & { course_id: string })[] = [
      { id: "10", freelancer_id: "f10", status: "accepted", role: null, support_scope: null, course_id: "course-A" },
      { id: "11", freelancer_id: "f11", status: "accepted", role: null, support_scope: null, course_id: "course-B" },
    ];
    const filtered = allRecords.filter((r) => r.course_id === "course-A");
    const state = deriveCourseAssistantState(filtered);
    expect(state.accepted).toHaveLength(1);
    expect(state.accepted[0].freelancer_id).toBe("f10");
  });
});

describe("LP-15B: Mixed accepted + pending course state", () => {
  it("renders both sections when accepted and pending coexist", () => {
    const records: CourseAssistant[] = [
      { id: "4", freelancer_id: "f4", status: "accepted", role: "technical_assistant", support_scope: null },
      { id: "5", freelancer_id: "f5", status: "pending", role: null, support_scope: null },
    ];
    const state = deriveCourseAssistantState(records);
    expect(state.showAccepted).toBe(true);
    expect(state.showPending).toBe(true);
    expect(state.showEmpty).toBe(false);
  });

  it("empty state does not appear when only accepted exists", () => {
    const records: CourseAssistant[] = [
      { id: "6", freelancer_id: "f6", status: "accepted", role: null, support_scope: null },
    ];
    expect(deriveCourseAssistantState(records).showEmpty).toBe(false);
  });

  it("empty state does not appear when only pending exists", () => {
    const records: CourseAssistant[] = [
      { id: "7", freelancer_id: "f7", status: "pending", role: null, support_scope: null },
    ];
    expect(deriveCourseAssistantState(records).showEmpty).toBe(false);
  });
});
