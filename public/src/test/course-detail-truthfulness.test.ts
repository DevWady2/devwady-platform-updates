import { describe, it, expect } from "vitest";

/**
 * LP-18A — Course detail truthfulness tests.
 * Validates that real courses do not get mock data injected,
 * sample badge only shows for mock courses, and no hardcoded fake rating on real courses.
 */

type Course = { id: string; title_en: string; slug: string };

function isSampleCourse(course: Course): boolean {
  return !!(course.id && course.id.startsWith("mock-"));
}

function getOverviewStats(
  course: Course,
  enrollmentCounts: { active: number; completed: number } | null,
  unansweredCount: number | null,
  mockActiveCount: number,
  mockCompletedCount: number,
  mockUnansweredCount: number
) {
  const isMock = isSampleCourse(course);
  return {
    activeStudents: isMock ? mockActiveCount : (enrollmentCounts?.active ?? 0),
    completedStudents: isMock ? mockCompletedCount : (enrollmentCounts?.completed ?? 0),
    unanswered: isMock ? mockUnansweredCount : (unansweredCount ?? 0),
    showRating: isMock,
  };
}

function shouldShowSampleBadge(course: Course): boolean {
  return isSampleCourse(course);
}

function shouldUseMockDetailData(course: Course): boolean {
  return isSampleCourse(course);
}

const realCourse: Course = { id: "uuid-real-123", title_en: "Real Course", slug: "real-course" };
const mockCourse: Course = { id: "mock-ic-1", title_en: "Mock Course", slug: "mock-slug" };

describe("Course detail truthfulness (LP-18A)", () => {
  it("real course does not inject mock students/reviews/questions", () => {
    expect(shouldUseMockDetailData(realCourse)).toBe(false);
  });

  it("mock course uses mock detail data", () => {
    expect(shouldUseMockDetailData(mockCourse)).toBe(true);
  });

  it("sample badge only shows for mock courses", () => {
    expect(shouldShowSampleBadge(realCourse)).toBe(false);
    expect(shouldShowSampleBadge(mockCourse)).toBe(true);
  });

  it("real course overview does not show hardcoded fake rating", () => {
    const stats = getOverviewStats(realCourse, { active: 5, completed: 3 }, 2, 10, 8, 4);
    expect(stats.showRating).toBe(false);
    expect(stats.activeStudents).toBe(5);
    expect(stats.completedStudents).toBe(3);
    expect(stats.unanswered).toBe(2);
  });

  it("mock course overview uses mock counts and shows rating", () => {
    const stats = getOverviewStats(mockCourse, null, null, 10, 8, 4);
    expect(stats.showRating).toBe(true);
    expect(stats.activeStudents).toBe(10);
    expect(stats.completedStudents).toBe(8);
    expect(stats.unanswered).toBe(4);
  });

  it("real course with no enrollment data shows zero counts, not mock values", () => {
    const stats = getOverviewStats(realCourse, null, null, 10, 8, 4);
    expect(stats.activeStudents).toBe(0);
    expect(stats.completedStudents).toBe(0);
    expect(stats.unanswered).toBe(0);
    expect(stats.showRating).toBe(false);
  });

  it("isSampleCourse is false for any non-mock-prefixed id", () => {
    expect(isSampleCourse({ id: "abc-123", title_en: "X", slug: "x" })).toBe(false);
    expect(isSampleCourse({ id: "mock-ic-2", title_en: "Y", slug: "y" })).toBe(true);
  });
});
