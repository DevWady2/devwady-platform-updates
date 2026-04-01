import { describe, expect, it } from "vitest";
import { ACCOUNT_TYPE_VALUES } from "@/core/types";
import { DEFAULT_CAPABILITIES } from "@/contexts/AuthContext";

describe("DEFAULT_CAPABILITIES parity", () => {
  it("covers every canonical account type exactly once", () => {
    expect(Object.keys(DEFAULT_CAPABILITIES).sort()).toEqual([...ACCOUNT_TYPE_VALUES].sort());
  });

  it("maps each account type to a non-empty unique capability list", () => {
    for (const accountType of ACCOUNT_TYPE_VALUES) {
      const capabilities = DEFAULT_CAPABILITIES[accountType];
      expect(capabilities.length).toBeGreaterThan(0);
      expect(new Set(capabilities).size).toBe(capabilities.length);
    }
  });
});
