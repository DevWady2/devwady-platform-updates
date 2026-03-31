/**
 * LP-09A — Student Home Talent Bridge summary: privacy-accurate labels & truthful framing.
 */
import { describe, it, expect } from "vitest";

// ── Visibility label mapping (mirrors useStudentHomeData logic) ──

function visibilityLabel(vis: string): string {
  return vis === "opportunity_ready"
    ? "Open to Opportunities"
    : vis === "academy_only"
      ? "Academy Only"
      : "Private";
}

describe("Student Home — Talent Bridge visibility labels", () => {
  it("maps 'academy_only' to 'Academy Only', not generic 'Visible'", () => {
    expect(visibilityLabel("academy_only")).toBe("Academy Only");
    expect(visibilityLabel("academy_only")).not.toBe("Visible");
  });

  it("maps 'opportunity_ready' distinctly from 'academy_only'", () => {
    const ao = visibilityLabel("academy_only");
    const or_ = visibilityLabel("opportunity_ready");
    expect(ao).not.toBe(or_);
    expect(or_).toBe("Open to Opportunities");
  });

  it("maps 'private' correctly", () => {
    expect(visibilityLabel("private")).toBe("Private");
  });

  it("treats unknown/legacy values as 'Private'", () => {
    expect(visibilityLabel("instructors_only")).toBe("Private");
    expect(visibilityLabel("")).toBe("Private");
  });
});

// ── Readiness label truthfulness (mirrors useStudentHomeData snapshot logic) ──

function readinessLabel(
  hasProfile: boolean,
  profileComplete: boolean,
): string | null {
  if (!hasProfile) return null;
  return profileComplete ? "Profile complete" : "Profile incomplete";
}

describe("Student Home — Talent Bridge readiness framing", () => {
  it("does not produce a 'Ready' label from profile-completeness alone", () => {
    const label = readinessLabel(true, true);
    expect(label).not.toBe("Ready");
    expect(label).toBe("Profile complete");
  });

  it("shows 'Profile incomplete' when profile fields are missing", () => {
    expect(readinessLabel(true, false)).toBe("Profile incomplete");
  });

  it("returns null when no talent profile exists", () => {
    expect(readinessLabel(false, false)).toBeNull();
  });
});
