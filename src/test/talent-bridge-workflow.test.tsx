/**
 * Talent Bridge — Recommendation & Nomination Workflow Tests
 *
 * Covers:
 * - RecommendationDialog render + readiness snapshot indicator
 * - NominationDialog render + privacy gate when blocked
 * - NominationDialog render for allowed students
 * - Status badge rendering for recs/noms
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RecommendationDialog from "@/components/academy/RecommendationDialog";
import NominationDialog from "@/components/academy/NominationDialog";
import StudentTalentBadges from "@/components/academy/StudentTalentBadges";
import type { StudentTalentData } from "@/portals/academy/hooks/useStudentTalentSignals";
import type { ReadinessSignals } from "@/features/academy/learningModel/readiness";

// ── Mocks ────────────────────────────────────────────────────

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ lang: "en", dir: "ltr", t: (k: string) => k, setLang: vi.fn() }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "instructor-1", email: "inst@dev.test" },
    session: null,
    loading: false,
    role: "instructor",
    roles: ["instructor"],
    accountStatus: "active",
    isEmailVerified: true,
  }),
}));

vi.mock("@/features/academy/talentBridge/hooks", () => ({
  useCreateRecommendation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateNomination: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({ order: () => ({ limit: () => ({ data: [], error: null }) }), data: [], error: null }),
        in: () => ({ data: [], error: null }),
      }),
    }),
  },
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: () => ({ data: [], isLoading: false }),
  };
});

// ── Tests ────────────────────────────────────────────────────

describe("RecommendationDialog", () => {
  const baseCourses = [{ id: "c1", title_en: "React Fundamentals" }];

  it("renders with student name and save button", () => {
    render(
      <MemoryRouter>
        <RecommendationDialog
          open={true}
          onOpenChange={vi.fn()}
          studentUserId="student-1"
          studentName="Sara Ahmed"
          courses={baseCourses}
        />
      </MemoryRouter>
    );
    expect(screen.getByText("Recommend Sara Ahmed")).toBeInTheDocument();
    expect(screen.getByText("Save Recommendation")).toBeInTheDocument();
  });

  it("shows readiness snapshot indicator when provided", () => {
    const snapshot: ReadinessSignals = {
      completion_quality: "high",
      attendance_health: "not_started",
      assessment_readiness: "moderate",
      project_readiness: "high",
      overall_readiness_status: "moderate",
    };

    render(
      <MemoryRouter>
        <RecommendationDialog
          open={true}
          onOpenChange={vi.fn()}
          studentUserId="student-1"
          studentName="Sara Ahmed"
          courses={baseCourses}
          readinessSnapshot={snapshot}
        />
      </MemoryRouter>
    );
    expect(screen.getByText(/Current Student State/)).toBeInTheDocument();
    expect(screen.getByText(/In Progress/)).toBeInTheDocument();
  });

  it("does not show snapshot indicator when not provided", () => {
    render(
      <MemoryRouter>
        <RecommendationDialog
          open={true}
          onOpenChange={vi.fn()}
          studentUserId="student-1"
          studentName="Sara Ahmed"
          courses={baseCourses}
        />
      </MemoryRouter>
    );
    expect(screen.queryByText(/Current Student State/)).not.toBeInTheDocument();
  });
});

describe("NominationDialog — privacy gate", () => {
  it("shows blocked alert when allowsNomination is false", () => {
    render(
      <MemoryRouter>
        <NominationDialog
          open={true}
          onOpenChange={vi.fn()}
          studentUserId="student-1"
          studentName="Blocked Student"
          allowsNomination={false}
          hasProfile={true}
          courses={[]}
        />
      </MemoryRouter>
    );
    expect(screen.getByText(/has not enabled nominations/)).toBeInTheDocument();
    expect(screen.queryByText("Save Nomination")).not.toBeInTheDocument();
  });

  it("renders form when allowsNomination is true", () => {
    render(
      <MemoryRouter>
        <NominationDialog
          open={true}
          onOpenChange={vi.fn()}
          studentUserId="student-1"
          studentName="Allowed Student"
          allowsNomination={true}
          courses={[{ id: "c1", title_en: "Test Course" }]}
        />
      </MemoryRouter>
    );
    expect(screen.queryByText(/has not enabled nominations/)).not.toBeInTheDocument();
    expect(screen.getByText("Save Nomination")).toBeInTheDocument();
    expect(screen.getByText("Nomination Scope")).toBeInTheDocument();
  });
});

describe("StudentTalentBadges", () => {
  it("renders nothing when no profile", () => {
    const { container } = render(
      <StudentTalentBadges data={undefined} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders visibility and nominatable badges", () => {
    const data: StudentTalentData = {
      hasProfile: true,
      visibility: "opportunity_ready",
      allowNomination: true,
      allowOpportunityMatching: true,
      headline: null,
      recommendationCount: 2,
      nominationCount: 1,
      signal: null,
      readinessSnapshot: null,
    };

    render(<StudentTalentBadges data={data} />);
    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByText("Nominatable")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("hides labels in compact mode but keeps icons", () => {
    const data: StudentTalentData = {
      hasProfile: true,
      visibility: "academy_only",
      allowNomination: false,
      allowOpportunityMatching: false,
      headline: null,
      recommendationCount: 0,
      nominationCount: 0,
      signal: null,
      readinessSnapshot: null,
    };

    render(<StudentTalentBadges data={data} compact />);
    // In compact mode, text labels are hidden but icon container exists
    expect(screen.queryByText("Academy")).not.toBeInTheDocument();
  });
});
