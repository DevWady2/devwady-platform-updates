/**
 * LP-10A — AcademyStudents course-scoped rec/nom chips and dialog options.
 */
import { describe, it, expect } from "vitest";

// ── Row-scoped rec/nom helpers (mirrors AcademyStudents logic) ──

interface Rec { id: string; student_user_id: string; course_id: string | null; status: string }
interface Nom { id: string; student_user_id: string; course_id: string | null; status: string }

function getRowRecs(recs: Rec[], userId: string, courseId: string) {
  return recs.filter(r => r.student_user_id === userId && (r.course_id === courseId || r.course_id === null));
}

function getRowNoms(noms: Nom[], userId: string, courseId: string) {
  return noms.filter(n => n.student_user_id === userId && (n.course_id === courseId || n.course_id === null));
}

// ── Shared-course builder (mirrors AcademyStudents logic) ──

interface CourseInfo { id: string; title_en: string; title_ar?: string | null }
interface Enrollment { user_id: string; course_id: string }

function getSharedCourses(
  enrollments: Enrollment[],
  instructorCourses: CourseInfo[],
  userId: string,
): CourseInfo[] {
  const studentCourseIds = new Set(
    enrollments.filter(e => e.user_id === userId).map(e => e.course_id),
  );
  return instructorCourses.filter(c => studentCourseIds.has(c.id));
}

// ── Fixtures ──

const COURSE_A = "course-a";
const COURSE_B = "course-b";
const STUDENT_1 = "student-1";

const allRecs: Rec[] = [
  { id: "rec-1", student_user_id: STUDENT_1, course_id: COURSE_A, status: "active" },
  { id: "rec-2", student_user_id: STUDENT_1, course_id: COURSE_B, status: "draft" },
  { id: "rec-3", student_user_id: STUDENT_1, course_id: null, status: "active" },
];

const allNoms: Nom[] = [
  { id: "nom-1", student_user_id: STUDENT_1, course_id: COURSE_A, status: "submitted" },
  { id: "nom-2", student_user_id: STUDENT_1, course_id: COURSE_B, status: "submitted" },
  { id: "nom-3", student_user_id: STUDENT_1, course_id: null, status: "accepted" },
];

const instructorCourses: CourseInfo[] = [
  { id: COURSE_A, title_en: "Course A" },
  { id: COURSE_B, title_en: "Course B" },
];

// ── Tests ──

describe("AcademyStudents — row chips are course-scoped", () => {
  it("Course A row shows only Course A rec + general rec, not Course B rec", () => {
    const rowRecs = getRowRecs(allRecs, STUDENT_1, COURSE_A);
    expect(rowRecs.map(r => r.id)).toEqual(["rec-1", "rec-3"]);
    expect(rowRecs.find(r => r.id === "rec-2")).toBeUndefined();
  });

  it("Course B row shows only Course B nom + general nom, not Course A nom", () => {
    const rowNoms = getRowNoms(allNoms, STUDENT_1, COURSE_B);
    expect(rowNoms.map(n => n.id)).toEqual(["nom-2", "nom-3"]);
    expect(rowNoms.find(n => n.id === "nom-1")).toBeUndefined();
  });

  it("general/null-course records appear on every row but are distinguishable", () => {
    const rowANoms = getRowNoms(allNoms, STUDENT_1, COURSE_A);
    const rowBNoms = getRowNoms(allNoms, STUDENT_1, COURSE_B);
    const generalInA = rowANoms.filter(n => n.course_id === null);
    const generalInB = rowBNoms.filter(n => n.course_id === null);
    expect(generalInA).toHaveLength(1);
    expect(generalInB).toHaveLength(1);
    expect(generalInA[0].id).toBe(generalInB[0].id);
  });
});

describe("AcademyStudents — dialog course options are student-scoped", () => {
  it("student enrolled in both courses sees both in dialog options", () => {
    const enrollments: Enrollment[] = [
      { user_id: STUDENT_1, course_id: COURSE_A },
      { user_id: STUDENT_1, course_id: COURSE_B },
    ];
    const shared = getSharedCourses(enrollments, instructorCourses, STUDENT_1);
    expect(shared).toHaveLength(2);
  });

  it("student enrolled only in Course A does not see Course B in dialog", () => {
    const enrollments: Enrollment[] = [
      { user_id: STUDENT_1, course_id: COURSE_A },
    ];
    const shared = getSharedCourses(enrollments, instructorCourses, STUDENT_1);
    expect(shared).toHaveLength(1);
    expect(shared[0].id).toBe(COURSE_A);
  });

  it("student with no enrollments gets empty course list", () => {
    const shared = getSharedCourses([], instructorCourses, STUDENT_1);
    expect(shared).toHaveLength(0);
  });
});
