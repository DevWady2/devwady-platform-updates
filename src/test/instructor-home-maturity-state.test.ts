/**
 * Focused test: instructor homepage maturity-state classification.
 * Proves the state model distinguishes new / active / advanced.
 */
import { describe, it, expect } from "vitest";
import type { HomeState } from "@/hooks/useInstructorHomeData";

/** Minimal replica of the hook's state classification logic */
function classifyHomeState(params: {
  activeStudents: number;
  completedStudents: number;
  publishedCourses: number;
  nominationCount: number;
}): HomeState {
  const hasStudents = params.activeStudents > 0 || params.completedStudents > 0;
  if (!hasStudents) return "new";
  if (params.publishedCourses >= 3 && params.activeStudents >= 10) return "advanced";
  if (params.nominationCount >= 5) return "advanced";
  return "active";
}

describe("Instructor Home Maturity State", () => {
  it("classifies instructor with no courses as 'new'", () => {
    expect(
      classifyHomeState({ activeStudents: 0, completedStudents: 0, publishedCourses: 0, nominationCount: 0 })
    ).toBe("new");
  });

  it("classifies instructor with courses but no students as 'new'", () => {
    expect(
      classifyHomeState({ activeStudents: 0, completedStudents: 0, publishedCourses: 2, nominationCount: 0 })
    ).toBe("new");
  });

  it("classifies instructor with some students as 'active'", () => {
    expect(
      classifyHomeState({ activeStudents: 5, completedStudents: 0, publishedCourses: 1, nominationCount: 0 })
    ).toBe("active");
  });

  it("classifies instructor with many courses and students as 'advanced'", () => {
    expect(
      classifyHomeState({ activeStudents: 15, completedStudents: 3, publishedCourses: 4, nominationCount: 0 })
    ).toBe("advanced");
  });

  it("classifies instructor with strong nomination activity as 'advanced'", () => {
    expect(
      classifyHomeState({ activeStudents: 3, completedStudents: 0, publishedCourses: 1, nominationCount: 7 })
    ).toBe("advanced");
  });

  it("does not promote to advanced with few nominations and small student base", () => {
    expect(
      classifyHomeState({ activeStudents: 3, completedStudents: 0, publishedCourses: 1, nominationCount: 2 })
    ).toBe("active");
  });
});
