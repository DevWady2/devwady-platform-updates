import { describe, it, expect } from "vitest";
import {
  PRODUCT_TYPES,
  PRODUCT_TYPE_LABELS,
  PRODUCT_TYPE_BADGE,
  isProductType,
} from "@/features/academy/learningModel/productTypes";
import {
  DELIVERY_MODES,
  DELIVERY_MODE_LABELS,
  isDeliveryMode,
} from "@/features/academy/learningModel/deliveryModes";
import {
  legacyToProductType,
  legacyToDeliveryMode,
  productTypeToLegacy,
  isLegacyCourseType,
} from "@/features/academy/learningModel/legacy";

describe("Product Types", () => {
  it("has exactly 3 product types", () => {
    expect(PRODUCT_TYPES).toHaveLength(3);
  });

  it("has labels for all product types", () => {
    for (const pt of PRODUCT_TYPES) {
      expect(PRODUCT_TYPE_LABELS[pt].en).toBeTruthy();
      expect(PRODUCT_TYPE_LABELS[pt].ar).toBeTruthy();
      expect(PRODUCT_TYPE_BADGE[pt].en).toBeTruthy();
    }
  });

  it("isProductType validates correctly", () => {
    expect(isProductType("standard_course")).toBe(true);
    expect(isProductType("live_course")).toBe(true);
    expect(isProductType("bootcamp_track")).toBe(true);
    expect(isProductType("invalid")).toBe(false);
    expect(isProductType(42)).toBe(false);
    expect(isProductType(null)).toBe(false);
  });
});

describe("Delivery Modes", () => {
  it("has exactly 4 delivery modes", () => {
    expect(DELIVERY_MODES).toHaveLength(4);
  });

  it("has labels for all delivery modes", () => {
    for (const dm of DELIVERY_MODES) {
      expect(DELIVERY_MODE_LABELS[dm].en).toBeTruthy();
    }
  });

  it("isDeliveryMode validates correctly", () => {
    expect(isDeliveryMode("self_paced")).toBe(true);
    expect(isDeliveryMode("live")).toBe(true);
    expect(isDeliveryMode("invalid")).toBe(false);
  });
});

describe("Legacy compatibility", () => {
  it("maps legacy to product type correctly", () => {
    expect(legacyToProductType("recorded")).toBe("standard_course");
    expect(legacyToProductType("live")).toBe("live_course");
    expect(legacyToProductType("hybrid")).toBe("standard_course");
  });

  it("maps legacy to delivery mode correctly", () => {
    expect(legacyToDeliveryMode("recorded")).toBe("self_paced");
    expect(legacyToDeliveryMode("live")).toBe("live");
    expect(legacyToDeliveryMode("hybrid")).toBe("hybrid");
  });

  it("reverse maps product type to legacy correctly", () => {
    expect(productTypeToLegacy("standard_course")).toBe("recorded");
    expect(productTypeToLegacy("live_course")).toBe("live");
    expect(productTypeToLegacy("bootcamp_track")).toBe("recorded");
  });

  it("validates legacy course types", () => {
    expect(isLegacyCourseType("recorded")).toBe(true);
    expect(isLegacyCourseType("live")).toBe(true);
    expect(isLegacyCourseType("hybrid")).toBe(true);
    expect(isLegacyCourseType("bootcamp")).toBe(false);
  });
});
