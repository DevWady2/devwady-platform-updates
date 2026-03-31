/**
 * LP-13A — Assistant oversight activity must be course-scoped.
 *
 * Pure-logic tests that verify the scoping functions extracted
 * from InstructorAssistants activity computation.
 */
import { describe, it, expect } from "vitest";

/* ── Replicate the scoping logic from InstructorAssistants ── */

interface Invitation {
  id: string;
  freelancer_id: string;
  course_id: string | null;
  status: string;
}

interface QuestionRow {
  id: string;
  answered_by: string | null;
  course_id: string;
  updated_at: string;
  is_visible_to_class: boolean;
}

function buildAssistantCourseMap(accepted: Invitation[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const inv of accepted) {
    if (!inv.course_id) continue;
    const set = map.get(inv.freelancer_id) ?? new Set();
    set.add(inv.course_id);
    map.set(inv.freelancer_id, set);
  }
  return map;
}

function computeScopedActivity(
  questions: QuestionRow[],
  assistantCourseMap: Map<string, Set<string>>
): Record<string, { total: number; visible: number; lastActive: string | null }> {
  const counts: Record<string, { total: number; visible: number; lastActive: string | null }> = {};
  for (const q of questions) {
    if (!q.answered_by) continue;
    const assignedCourses = assistantCourseMap.get(q.answered_by);
    if (!assignedCourses || !assignedCourses.has(q.course_id)) continue;
    if (!counts[q.answered_by]) counts[q.answered_by] = { total: 0, visible: 0, lastActive: null };
    counts[q.answered_by].total++;
    if (q.is_visible_to_class) counts[q.answered_by].visible++;
    if (!counts[q.answered_by].lastActive || q.updated_at > counts[q.answered_by].lastActive!) {
      counts[q.answered_by].lastActive = q.updated_at;
    }
  }
  return counts;
}

/* ── Fixtures ── */
const ASSISTANT_A = "assistant-a";
const ASSISTANT_B = "assistant-b";
const COURSE_1 = "course-1"; // assigned to assistant A
const COURSE_2 = "course-2"; // assigned to assistant B
const COURSE_UNRELATED = "course-unrelated"; // not assigned to anyone

const accepted: Invitation[] = [
  { id: "inv-1", freelancer_id: ASSISTANT_A, course_id: COURSE_1, status: "accepted" },
  { id: "inv-2", freelancer_id: ASSISTANT_B, course_id: COURSE_2, status: "accepted" },
];

const assistantCourseMap = buildAssistantCourseMap(accepted);

/* ── Tests ── */

describe("LP-13A: assistant oversight activity scoping", () => {
  it("counts answers only from assigned courses", () => {
    const questions: QuestionRow[] = [
      { id: "q1", answered_by: ASSISTANT_A, course_id: COURSE_1, updated_at: "2026-03-01T10:00:00Z", is_visible_to_class: true },
      { id: "q2", answered_by: ASSISTANT_A, course_id: COURSE_1, updated_at: "2026-03-02T10:00:00Z", is_visible_to_class: false },
    ];
    const result = computeScopedActivity(questions, assistantCourseMap);
    expect(result[ASSISTANT_A]?.total).toBe(2);
    expect(result[ASSISTANT_A]?.visible).toBe(1);
  });

  it("excludes answers on unrelated courses", () => {
    const questions: QuestionRow[] = [
      { id: "q1", answered_by: ASSISTANT_A, course_id: COURSE_1, updated_at: "2026-03-01T10:00:00Z", is_visible_to_class: true },
      { id: "q2", answered_by: ASSISTANT_A, course_id: COURSE_UNRELATED, updated_at: "2026-03-05T10:00:00Z", is_visible_to_class: true },
    ];
    const result = computeScopedActivity(questions, assistantCourseMap);
    expect(result[ASSISTANT_A]?.total).toBe(1);
  });

  it("does not cross-count between assistants", () => {
    const questions: QuestionRow[] = [
      { id: "q1", answered_by: ASSISTANT_A, course_id: COURSE_2, updated_at: "2026-03-01T10:00:00Z", is_visible_to_class: true },
    ];
    const result = computeScopedActivity(questions, assistantCourseMap);
    // Assistant A is not assigned to COURSE_2, so this should be excluded
    expect(result[ASSISTANT_A]).toBeUndefined();
  });

  it("lastActive comes only from scoped activity", () => {
    const questions: QuestionRow[] = [
      { id: "q1", answered_by: ASSISTANT_A, course_id: COURSE_1, updated_at: "2026-01-01T10:00:00Z", is_visible_to_class: false },
      // More recent but on unrelated course — must be excluded
      { id: "q2", answered_by: ASSISTANT_A, course_id: COURSE_UNRELATED, updated_at: "2026-03-28T10:00:00Z", is_visible_to_class: true },
    ];
    const result = computeScopedActivity(questions, assistantCourseMap);
    expect(result[ASSISTANT_A]?.lastActive).toBe("2026-01-01T10:00:00Z");
  });

  it("returns empty object when no scoped answers exist", () => {
    const questions: QuestionRow[] = [
      { id: "q1", answered_by: ASSISTANT_A, course_id: COURSE_UNRELATED, updated_at: "2026-03-01T10:00:00Z", is_visible_to_class: true },
    ];
    const result = computeScopedActivity(questions, assistantCourseMap);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("handles null course_id assignments gracefully", () => {
    const mapWithNull = buildAssistantCourseMap([
      { id: "inv-x", freelancer_id: "f-x", course_id: null, status: "accepted" },
    ]);
    expect(mapWithNull.has("f-x")).toBe(false);
  });
});
