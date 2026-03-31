/**
 * Academy Learning Model — Learning Structure Item Types
 *
 * These describe the *building blocks* inside a course or bootcamp track.
 *
 * - lesson     : a single teaching unit (video, text, or mixed)
 * - milestone  : a checkpoint that gates further progress (e.g. quiz pass)
 * - assessment : a graded test or quiz
 * - project    : a hands-on deliverable the learner submits
 * - session    : a scheduled live meeting (workshop, Q&A, review)
 */

export const STRUCTURE_ITEM_TYPES = [
  "lesson",
  "milestone",
  "assessment",
  "project",
  "session",
] as const;

export type StructureItemType = (typeof STRUCTURE_ITEM_TYPES)[number];

export const STRUCTURE_ITEM_LABELS: Record<StructureItemType, { en: string; ar: string }> = {
  lesson: { en: "Lesson", ar: "درس" },
  milestone: { en: "Milestone", ar: "معلم" },
  assessment: { en: "Assessment", ar: "تقييم" },
  project: { en: "Project", ar: "مشروع" },
  session: { en: "Session", ar: "جلسة" },
};

export function isStructureItemType(value: unknown): value is StructureItemType {
  return typeof value === "string" && (STRUCTURE_ITEM_TYPES as readonly string[]).includes(value);
}
