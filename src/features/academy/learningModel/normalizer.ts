/**
 * Academy Learning Model — Canonical Course Metadata Normalizer
 *
 * Single source of truth for computing canonical learning fields on writes.
 * All course create/update flows should call `normalizeCourseMetadata()` to
 * produce a consistent payload fragment before persisting.
 *
 * During the transition period the legacy `course_type` column is still
 * written for backward compatibility, but it is *derived* from the canonical
 * `learning_product_type` — never the other way around.
 */

import type { ProductType } from "./productTypes";
import type { DeliveryMode } from "./deliveryModes";
import { isProductType } from "./productTypes";
import { isDeliveryMode } from "./deliveryModes";
import { productTypeToLegacy } from "./legacy";

/** Input accepted by the normalizer — only product type is required. */
export interface CourseMetadataInput {
  learning_product_type?: ProductType | string;
  delivery_mode?: DeliveryMode | string;
  requires_cohort?: boolean;
  supports_assessments?: boolean;
  supports_projects?: boolean;
  supports_live_sessions?: boolean;
}

/** Fully resolved canonical fields + legacy compatibility value. */
export interface NormalizedCourseMetadata {
  learning_product_type: ProductType;
  delivery_mode: DeliveryMode;
  requires_cohort: boolean;
  supports_assessments: boolean;
  supports_projects: boolean;
  supports_live_sessions: boolean;
  /** Legacy column — written for backward compat only. */
  course_type: string;
}

/**
 * Resolve canonical course metadata from partial input.
 *
 * Rules:
 * - `standard_course` → defaults to `self_paced`, no live sessions
 * - `live_course`     → defaults to `live`, `supports_live_sessions = true`
 * - `bootcamp_track`  → defaults to `cohort_based`, cohort + projects + assessments enabled
 *
 * Explicit overrides in `input` are respected; only unset fields get defaults.
 */
export function normalizeCourseMetadata(
  input: CourseMetadataInput = {},
): NormalizedCourseMetadata {
  const pt: ProductType = isProductType(input.learning_product_type)
    ? input.learning_product_type
    : "standard_course";

  // --- Per-product-type defaults ---
  let defaultDelivery: DeliveryMode;
  let defaultCohort: boolean;
  let defaultAssessments: boolean;
  let defaultProjects: boolean;
  let defaultLive: boolean;

  switch (pt) {
    case "live_course":
      defaultDelivery = "live";
      defaultCohort = false;
      defaultAssessments = false;
      defaultProjects = false;
      defaultLive = true;
      break;
    case "bootcamp_track":
      defaultDelivery = "cohort_based";
      defaultCohort = true;
      defaultAssessments = true;
      defaultProjects = true;
      defaultLive = true;
      break;
    case "standard_course":
    default:
      defaultDelivery = "self_paced";
      defaultCohort = false;
      defaultAssessments = false;
      defaultProjects = false;
      defaultLive = false;
      break;
  }

  const delivery: DeliveryMode = isDeliveryMode(input.delivery_mode)
    ? input.delivery_mode
    : defaultDelivery;

  const supportsLive = input.supports_live_sessions ?? defaultLive;

  return {
    learning_product_type: pt,
    delivery_mode: delivery,
    requires_cohort: input.requires_cohort ?? defaultCohort,
    supports_assessments: input.supports_assessments ?? defaultAssessments,
    supports_projects: input.supports_projects ?? defaultProjects,
    supports_live_sessions: supportsLive,
    course_type: productTypeToLegacy(pt),
  };
}
