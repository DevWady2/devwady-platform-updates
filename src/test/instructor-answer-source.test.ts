/**
 * Focused test: course-specific answer-source labeling on /instructor/questions.
 */
import { describe, it, expect } from "vitest";
import { resolveAnswerSource } from "@/pages/instructor/InstructorQuestions";

const INSTRUCTOR_ID = "user-instructor-1";
const ASSISTANT_ID = "user-assistant-1";
const UNKNOWN_ID = "user-unknown-1";
const COURSE_A = "course-a";
const COURSE_B = "course-b";

// Assistant accepted only for COURSE_A
const assistantsByCourse = new Map<string, Set<string>>([
  [COURSE_A, new Set([ASSISTANT_ID])],
]);

describe("resolveAnswerSource (course-specific)", () => {
  it("labels instructor's own answer", () => {
    const result = resolveAnswerSource(INSTRUCTOR_ID, INSTRUCTOR_ID, assistantsByCourse, COURSE_A, false);
    expect(result.isInstructor).toBe(true);
    expect(result.isAssistant).toBe(false);
    expect(result.label).toBe("Answered by Instructor");
  });

  it("labels assistant answer on matching course", () => {
    const result = resolveAnswerSource(ASSISTANT_ID, INSTRUCTOR_ID, assistantsByCourse, COURSE_A, false);
    expect(result.isAssistant).toBe(true);
    expect(result.label).toBe("Answered by Assistant");
  });

  it("falls back to generic when assistant answered on different course", () => {
    const result = resolveAnswerSource(ASSISTANT_ID, INSTRUCTOR_ID, assistantsByCourse, COURSE_B, false);
    expect(result.isAssistant).toBe(false);
    expect(result.isInstructor).toBe(false);
    expect(result.label).toBe("Answered");
  });

  it("falls back to generic for unknown answerer", () => {
    const result = resolveAnswerSource(UNKNOWN_ID, INSTRUCTOR_ID, assistantsByCourse, COURSE_A, false);
    expect(result.label).toBe("Answered");
  });

  it("returns empty for null answeredBy", () => {
    const result = resolveAnswerSource(null, INSTRUCTOR_ID, assistantsByCourse, COURSE_A, false);
    expect(result.label).toBe("");
  });

  it("supports Arabic labels", () => {
    const result = resolveAnswerSource(ASSISTANT_ID, INSTRUCTOR_ID, assistantsByCourse, COURSE_A, true);
    expect(result.label).toBe("إجابة المساعد");
  });
});
