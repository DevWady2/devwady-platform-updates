/**
 * Academy Learning Model — Delivery Modes
 *
 * A "delivery mode" describes *how* content reaches the learner,
 * independent of product type.
 *
 * - self_paced    : learner progresses on their own schedule
 * - live          : sessions happen at fixed times with an instructor
 * - hybrid        : mix of self-paced material and scheduled live sessions
 * - cohort_based  : self-paced or hybrid, but learners progress together in a cohort
 */

export const DELIVERY_MODES = [
  "self_paced",
  "live",
  "hybrid",
  "cohort_based",
] as const;

export type DeliveryMode = (typeof DELIVERY_MODES)[number];

export const DELIVERY_MODE_LABELS: Record<DeliveryMode, { en: string; ar: string }> = {
  self_paced: { en: "Self-paced", ar: "ذاتي السرعة" },
  live: { en: "Live", ar: "مباشر" },
  hybrid: { en: "Hybrid", ar: "مدمج" },
  cohort_based: { en: "Cohort-based", ar: "جماعي" },
};

export function isDeliveryMode(value: unknown): value is DeliveryMode {
  return typeof value === "string" && (DELIVERY_MODES as readonly string[]).includes(value);
}
