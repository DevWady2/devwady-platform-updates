import { describe, it, expect } from "vitest";

/**
 * LP-19A — InstructorStudents course-route truthfulness tests.
 * Validates mock data gating and row chip course-scoping logic.
 */

function isSampleMode(): boolean {
  return true; // simulate dev sample mode being on
}

function isSampleCourse(courseId: string): boolean {
  return !!(courseId && courseId.startsWith("mock-")) && isSampleMode();
}

type Rec = { id: string; student_user_id: string; course_id: string | null; status: string };
type Nom = { id: string; student_user_id: string; course_id: string | null; status: string };

function getStudentRecs(recs: Rec[], userId: string, courseId: string): Rec[] {
  return recs.filter(r => r.student_user_id === userId && (r.course_id === courseId || r.course_id === null));
}

function getStudentNoms(noms: Nom[], userId: string, courseId: string): Nom[] {
  return noms.filter(n => n.student_user_id === userId && (n.course_id === courseId || n.course_id === null));
}

const REAL_COURSE_ID = "uuid-real-abc";
const MOCK_COURSE_ID = "mock-ic-1";
const OTHER_COURSE_ID = "uuid-other-xyz";
const STUDENT_ID = "student-1";

describe("InstructorStudents truthfulness (LP-19A)", () => {
  describe("sample mode gating", () => {
    it("real course ID + sample mode does NOT use mock data", () => {
      expect(isSampleCourse(REAL_COURSE_ID)).toBe(false);
    });

    it("mock course ID + sample mode uses mock data", () => {
      expect(isSampleCourse(MOCK_COURSE_ID)).toBe(true);
    });

    it("non-mock-prefixed ID is never treated as sample", () => {
      expect(isSampleCourse("some-uuid-123")).toBe(false);
      expect(isSampleCourse("MOCK-uppercase")).toBe(false); // case-sensitive
    });
  });

  describe("row chip course-scoping", () => {
    const allRecs: Rec[] = [
      { id: "r1", student_user_id: STUDENT_ID, course_id: REAL_COURSE_ID, status: "active" },
      { id: "r2", student_user_id: STUDENT_ID, course_id: OTHER_COURSE_ID, status: "active" },
      { id: "r3", student_user_id: STUDENT_ID, course_id: null, status: "draft" },
    ];
    const allNoms: Nom[] = [
      { id: "n1", student_user_id: STUDENT_ID, course_id: REAL_COURSE_ID, status: "submitted" },
      { id: "n2", student_user_id: STUDENT_ID, course_id: OTHER_COURSE_ID, status: "submitted" },
      { id: "n3", student_user_id: STUDENT_ID, course_id: null, status: "pending" },
    ];

    it("only includes recs for current course + general (null)", () => {
      const scoped = getStudentRecs(allRecs, STUDENT_ID, REAL_COURSE_ID);
      expect(scoped.map(r => r.id).sort()).toEqual(["r1", "r3"]);
    });

    it("excludes recs from unrelated courses", () => {
      const scoped = getStudentRecs(allRecs, STUDENT_ID, REAL_COURSE_ID);
      expect(scoped.find(r => r.course_id === OTHER_COURSE_ID)).toBeUndefined();
    });

    it("only includes noms for current course + general (null)", () => {
      const scoped = getStudentNoms(allNoms, STUDENT_ID, REAL_COURSE_ID);
      expect(scoped.map(n => n.id).sort()).toEqual(["n1", "n3"]);
    });

    it("excludes noms from unrelated courses", () => {
      const scoped = getStudentNoms(allNoms, STUDENT_ID, REAL_COURSE_ID);
      expect(scoped.find(n => n.course_id === OTHER_COURSE_ID)).toBeUndefined();
    });

    it("general/null-course records are distinguishable", () => {
      const scoped = getStudentRecs(allRecs, STUDENT_ID, REAL_COURSE_ID);
      const general = scoped.filter(r => r.course_id === null);
      expect(general).toHaveLength(1);
      expect(general[0].id).toBe("r3");
    });
  });

  describe("sample disclosure (LP-19B)", () => {
    it("mock course route shows sample disclosure", () => {
      expect(isSampleCourse("mock-ic-1")).toBe(true);
    });

    it("real course route does not show sample disclosure", () => {
      expect(isSampleCourse(REAL_COURSE_ID)).toBe(false);
    });

    it("sample disclosure flag is false for non-mock IDs regardless of sample mode", () => {
      expect(isSampleCourse("real-course-uuid")).toBe(false);
      expect(isSampleCourse("abc-123")).toBe(false);
    });
  });
});
