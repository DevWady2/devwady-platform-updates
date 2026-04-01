/**
 * Academy Learning Model — Product Types
 *
 * A "product type" describes *what* a learner purchases / enrolls in.
 *
 * - standard_course : pre-recorded, self-paced curriculum (most common today)
 * - live_course      : instructor-led sessions delivered on a schedule
 * - bootcamp_track   : intensive multi-course program with milestones & a capstone
 */

export const PRODUCT_TYPES = [
  "standard_course",
  "live_course",
  "bootcamp_track",
] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number];

/** Bilingual labels for UI display. */
export const PRODUCT_TYPE_LABELS: Record<ProductType, { en: string; ar: string }> = {
  standard_course: { en: "Standard Course", ar: "دورة تعليمية" },
  live_course: { en: "Live Course", ar: "دورة مباشرة" },
  bootcamp_track: { en: "Bootcamp Track", ar: "مسار معسكر تدريبي" },
};

/** Short marketing descriptions used in catalog cards & tooltips. */
export const PRODUCT_TYPE_DESCRIPTIONS: Record<ProductType, { en: string; ar: string }> = {
  standard_course: {
    en: "Learn at your own pace with pre-recorded lessons and hands-on projects.",
    ar: "تعلّم بسرعتك الخاصة من خلال دروس مسجّلة ومشاريع تطبيقية.",
  },
  live_course: {
    en: "Join scheduled live sessions with real-time instructor interaction.",
    ar: "انضم إلى جلسات مباشرة مجدولة مع تفاعل حي مع المدرّب.",
  },
  bootcamp_track: {
    en: "An intensive program spanning multiple courses, milestones, and a capstone project.",
    ar: "برنامج مكثّف يشمل عدة دورات ومعالم ومشروع تخرّج.",
  },
};

/** Badge-style short text for compact UI (tags, pills). */
export const PRODUCT_TYPE_BADGE: Record<ProductType, { en: string; ar: string }> = {
  standard_course: { en: "Course", ar: "دورة" },
  live_course: { en: "Live", ar: "مباشر" },
  bootcamp_track: { en: "Bootcamp", ar: "معسكر" },
};

export function isProductType(value: unknown): value is ProductType {
  return typeof value === "string" && (PRODUCT_TYPES as readonly string[]).includes(value);
}
