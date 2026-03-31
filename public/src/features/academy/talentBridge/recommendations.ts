/**
 * Academy Talent Bridge — Recommendation Types
 *
 * Describes how a student was recommended: by an instructor,
 * through a bootcamp cohort, based on project work, or
 * automatically from readiness signals.
 */

export const RECOMMENDATION_TYPES = [
  "instructor_recommendation",
  "bootcamp_recommendation",
  "project_based_recommendation",
  "readiness_based_recommendation",
] as const;

export type RecommendationType = (typeof RECOMMENDATION_TYPES)[number];

export const RECOMMENDATION_TYPE_LABELS: Record<RecommendationType, { en: string; ar: string }> = {
  instructor_recommendation:     { en: "Instructor Recommendation",    ar: "توصية مدرّب" },
  bootcamp_recommendation:       { en: "Bootcamp Recommendation",      ar: "توصية معسكر تدريبي" },
  project_based_recommendation:  { en: "Project-Based Recommendation", ar: "توصية مبنية على مشروع" },
  readiness_based_recommendation:{ en: "Readiness-Based",              ar: "مبنية على الجاهزية" },
};

export const RECOMMENDATION_TYPE_DESCRIPTIONS: Record<RecommendationType, { en: string; ar: string }> = {
  instructor_recommendation:     { en: "Personally recommended by the course instructor.",       ar: "توصية شخصية من مدرّب المادة." },
  bootcamp_recommendation:       { en: "Completed a bootcamp cohort with strong outcomes.",      ar: "أتمّ معسكرًا تدريبيًا بنتائج قوية." },
  project_based_recommendation:  { en: "Demonstrated skills through approved project work.",     ar: "أثبت مهاراته من خلال مشاريع معتمدة." },
  readiness_based_recommendation:{ en: "Automatically qualified through readiness signals.",     ar: "مؤهّل تلقائيًا من خلال إشارات الجاهزية." },
};
