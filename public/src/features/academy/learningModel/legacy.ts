/**
 * Academy Learning Model — Legacy Compatibility Helpers
 *
 * The existing `training_courses.course_type` column uses the values
 * "recorded", "live", and "hybrid".  These helpers map between the
 * legacy strings and the canonical learning-model vocabulary.
 */

import type { ProductType } from "./productTypes";
import type { DeliveryMode } from "./deliveryModes";

/** Values currently stored in `training_courses.course_type`. */
export type LegacyCourseType = "recorded" | "live" | "hybrid";

const LEGACY_VALUES: readonly string[] = ["recorded", "live", "hybrid"];

export function isLegacyCourseType(value: unknown): value is LegacyCourseType {
  return typeof value === "string" && LEGACY_VALUES.includes(value);
}

/**
 * Map a legacy course_type to the canonical product type.
 * Until the schema migrates, "recorded" and "hybrid" both map to
 * standard_course (the dominant product shape); "live" maps to live_course.
 */
export function legacyToProductType(legacy: LegacyCourseType): ProductType {
  switch (legacy) {
    case "live":
      return "live_course";
    case "hybrid":
    case "recorded":
    default:
      return "standard_course";
  }
}

/**
 * Map a legacy course_type to the canonical delivery mode.
 */
export function legacyToDeliveryMode(legacy: LegacyCourseType): DeliveryMode {
  switch (legacy) {
    case "live":
      return "live";
    case "hybrid":
      return "hybrid";
    case "recorded":
    default:
      return "self_paced";
  }
}

/**
 * Reverse map: canonical product type → best legacy course_type value.
 * Useful when writing back to the existing schema column.
 */
export function productTypeToLegacy(pt: ProductType): LegacyCourseType {
  switch (pt) {
    case "live_course":
      return "live";
    case "bootcamp_track":
      return "recorded"; // closest legacy bucket
    case "standard_course":
    default:
      return "recorded";
  }
}
