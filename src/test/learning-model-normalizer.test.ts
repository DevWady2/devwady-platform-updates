import { describe, it, expect } from "vitest";
import { normalizeCourseMetadata } from "@/features/academy/learningModel/normalizer";

describe("normalizeCourseMetadata", () => {
  it("defaults to standard_course / self_paced", () => {
    const r = normalizeCourseMetadata();
    expect(r.learning_product_type).toBe("standard_course");
    expect(r.delivery_mode).toBe("self_paced");
    expect(r.requires_cohort).toBe(false);
    expect(r.supports_live_sessions).toBe(false);
    expect(r.supports_assessments).toBe(false);
    expect(r.supports_projects).toBe(false);
    expect(r.course_type).toBe("recorded");
  });

  it("normalizes live_course with correct defaults", () => {
    const r = normalizeCourseMetadata({ learning_product_type: "live_course" });
    expect(r.delivery_mode).toBe("live");
    expect(r.supports_live_sessions).toBe(true);
    expect(r.requires_cohort).toBe(false);
    expect(r.course_type).toBe("live");
  });

  it("normalizes bootcamp_track with full features enabled", () => {
    const r = normalizeCourseMetadata({ learning_product_type: "bootcamp_track" });
    expect(r.delivery_mode).toBe("cohort_based");
    expect(r.requires_cohort).toBe(true);
    expect(r.supports_assessments).toBe(true);
    expect(r.supports_projects).toBe(true);
    expect(r.supports_live_sessions).toBe(true);
    expect(r.course_type).toBe("recorded");
  });

  it("respects explicit overrides", () => {
    const r = normalizeCourseMetadata({
      learning_product_type: "standard_course",
      delivery_mode: "hybrid",
      supports_assessments: true,
    });
    expect(r.delivery_mode).toBe("hybrid");
    expect(r.supports_assessments).toBe(true);
    expect(r.supports_projects).toBe(false); // not overridden
  });

  it("falls back to standard_course for invalid product type", () => {
    const r = normalizeCourseMetadata({ learning_product_type: "invalid_type" });
    expect(r.learning_product_type).toBe("standard_course");
  });

  it("falls back to default delivery mode for invalid delivery_mode", () => {
    const r = normalizeCourseMetadata({ delivery_mode: "teleportation" });
    expect(r.delivery_mode).toBe("self_paced");
  });
});
