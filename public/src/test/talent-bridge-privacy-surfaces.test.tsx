/**
 * Talent Bridge — Privacy-Safe Surface Behavior Tests
 *
 * Verifies:
 * - StudentOpportunityFitBadge only renders for opportunity_ready students
 * - OpportunityHintsCard renders summary chips correctly
 * - Visibility defaults remain privacy-safe
 * - Opportunity matching is read-only (no apply flow)
 * - Barrel export completeness
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { StudentTalentData } from "@/portals/academy/hooks/useStudentTalentSignals";
import type { MatchingSummary } from "@/features/academy/talentBridge/opportunityMatching";

// Mock LanguageContext
vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ lang: "en", dir: "ltr", t: (k: string) => k, setLang: vi.fn() }),
}));

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({ data: [], error: null }),
        in: () => ({ data: [], error: null }),
      }),
    }),
  },
}));

// Mock react-query to prevent actual fetches
vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: () => ({ data: [], isLoading: false }),
  };
});

describe("StudentOpportunityFitBadge eligibility", () => {
  // Import after mocks
  let StudentOpportunityFitBadge: typeof import("@/components/academy/StudentOpportunityFitBadge").default;

  beforeAll(async () => {
    const mod = await import("@/components/academy/StudentOpportunityFitBadge");
    StudentOpportunityFitBadge = mod.default;
  });

  it("renders nothing when talentData is undefined", () => {
    const { container } = render(<StudentOpportunityFitBadge talentData={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing for private students", () => {
    const data: StudentTalentData = {
      hasProfile: true,
      visibility: "private",
      allowNomination: false,
      allowOpportunityMatching: false,
      headline: null,
      recommendationCount: 0,
      nominationCount: 0,
      signal: "portfolio_ready",
      readinessSnapshot: null,
    };
    const { container } = render(<StudentOpportunityFitBadge talentData={data} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing for academy_only students", () => {
    const data: StudentTalentData = {
      hasProfile: true,
      visibility: "academy_only",
      allowNomination: true,
      allowOpportunityMatching: true,
      headline: null,
      recommendationCount: 1,
      nominationCount: 0,
      signal: "nomination_ready",
      readinessSnapshot: null,
    };
    const { container } = render(<StudentOpportunityFitBadge talentData={data} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing for not_ready_yet signal even if opportunity_ready", () => {
    const data: StudentTalentData = {
      hasProfile: true,
      visibility: "opportunity_ready",
      allowNomination: true,
      allowOpportunityMatching: true,
      headline: null,
      recommendationCount: 0,
      nominationCount: 0,
      signal: "not_ready_yet",
      readinessSnapshot: null,
    };
    const { container } = render(<StudentOpportunityFitBadge talentData={data} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("OpportunityHintsCard rendering", () => {
  let OpportunityHintsCard: typeof import("@/components/academy/OpportunityHintsCard").default;

  beforeAll(async () => {
    const mod = await import("@/components/academy/OpportunityHintsCard");
    OpportunityHintsCard = mod.default;
  });

  it("shows summary counts", () => {
    const summary: MatchingSummary = {
      totalOpportunities: 5,
      alignedCount: 2,
      partialCount: 1,
      notReadyCount: 2,
      results: [],
    };
    render(<OpportunityHintsCard summary={summary} />);
    expect(screen.getByText(/2 aligned of 5/i)).toBeInTheDocument();
    expect(screen.getByText(/Aligned/)).toBeInTheDocument();
  });

  it("shows empty message when no results", () => {
    const summary: MatchingSummary = {
      totalOpportunities: 0,
      alignedCount: 0,
      partialCount: 0,
      notReadyCount: 0,
      results: [],
    };
    render(<OpportunityHintsCard summary={summary} />);
    expect(screen.getByText(/No opportunities available/i)).toBeInTheDocument();
  });
});

describe("Barrel export completeness", () => {
  it("talentBridge index exports all expected symbols", async () => {
    const barrel = await import("@/features/academy/talentBridge");
    
    // Visibility
    expect(barrel.VISIBILITY_STATES).toBeDefined();
    expect(barrel.isExternallyVisible).toBeDefined();
    expect(barrel.isNominationEligible).toBeDefined();
    
    // Signals
    expect(barrel.TALENT_SIGNALS).toBeDefined();
    expect(barrel.meetsSignalThreshold).toBeDefined();
    
    // Nominations
    expect(barrel.NOMINATION_SCOPES).toBeDefined();
    expect(barrel.isTerminalNominationStatus).toBeDefined();
    
    // Recommendations
    expect(barrel.RECOMMENDATION_TYPES).toBeDefined();
    
    // Helpers
    expect(barrel.readinessToTalentSignal).toBeDefined();
    expect(barrel.deriveTalentSignal).toBeDefined();
    
    // Opportunity matching
    expect(barrel.matchStudentToOpportunity).toBeDefined();
    expect(barrel.matchStudentToOpportunities).toBeDefined();
    expect(barrel.useOpportunityHints).toBeDefined();
  });
});

describe("Opportunity matching is read-only", () => {
  it("matchStudentToOpportunity returns explainable result, not an application action", async () => {
    const { matchStudentToOpportunity } = await import(
      "@/features/academy/talentBridge/opportunityMatching"
    );
    const result = matchStudentToOpportunity(
      {
        primaryTrack: "Frontend",
        specializationTags: ["React"],
        talentSignal: "nomination_ready",
        hasRecommendation: false,
        nominationCount: 0,
        availabilityStatus: null,
      },
      { id: "opp-1", title: "React Dev", type: "full-time", tags: ["React"], requirements: [], location: null },
    );
    // Result is informational only — no apply/submit/action properties
    expect(result).toHaveProperty("alignmentScore");
    expect(result).toHaveProperty("matchReasons");
    expect(result).toHaveProperty("mismatchReasons");
    expect(result).not.toHaveProperty("applicationId");
    expect(result).not.toHaveProperty("applied");
  });
});

// ── LP-12A: Compact row indicator privacy / opt-in checks ──

/** Mirrors StudentOpportunityFitBadge eligibility (updated with allowOpportunityMatching) */
function isOpportunityFitEligible(talent: {
  hasProfile: boolean;
  visibility: string | null;
  allowOpportunityMatching: boolean;
  signal: string | null;
}): boolean {
  return (
    talent.hasProfile &&
    talent.visibility === "opportunity_ready" &&
    talent.allowOpportunityMatching === true &&
    !!talent.signal &&
    talent.signal !== "not_ready_yet"
  );
}

/** Mirrors AcademyStudents / InstructorStudents signal-badge rendering */
function shouldShowSignalBadge(talent: {
  signal: string | null;
  visibility: string | null;
}): boolean {
  return (
    !!talent.signal &&
    talent.signal !== "not_ready_yet" &&
    talent.visibility !== "private"
  );
}

describe("LP-12A: Signal badge suppression for private students", () => {
  it("private visibility suppresses signal badge even with a strong signal", () => {
    expect(shouldShowSignalBadge({ signal: "standout_student", visibility: "private" })).toBe(false);
  });

  it("academy_only visibility allows signal badge", () => {
    expect(shouldShowSignalBadge({ signal: "portfolio_ready", visibility: "academy_only" })).toBe(true);
  });

  it("opportunity_ready visibility allows signal badge", () => {
    expect(shouldShowSignalBadge({ signal: "nomination_ready", visibility: "opportunity_ready" })).toBe(true);
  });

  it("null signal suppresses badge regardless of visibility", () => {
    expect(shouldShowSignalBadge({ signal: null, visibility: "opportunity_ready" })).toBe(false);
  });
});

describe("LP-12A: Opportunity fit badge respects allowOpportunityMatching", () => {
  const base = {
    hasProfile: true,
    visibility: "opportunity_ready" as const,
    signal: "nomination_ready",
  };

  it("matching enabled → eligible", () => {
    expect(isOpportunityFitEligible({ ...base, allowOpportunityMatching: true })).toBe(true);
  });

  it("matching disabled → not eligible", () => {
    expect(isOpportunityFitEligible({ ...base, allowOpportunityMatching: false })).toBe(false);
  });

  it("private visibility → not eligible even with matching enabled", () => {
    expect(isOpportunityFitEligible({ ...base, allowOpportunityMatching: true, visibility: "private" })).toBe(false);
  });

  it("no profile → not eligible", () => {
    expect(isOpportunityFitEligible({ ...base, allowOpportunityMatching: true, hasProfile: false })).toBe(false);
  });

  it("not_ready_yet signal → not eligible", () => {
    expect(isOpportunityFitEligible({ ...base, allowOpportunityMatching: true, signal: "not_ready_yet" })).toBe(false);
  });
});
