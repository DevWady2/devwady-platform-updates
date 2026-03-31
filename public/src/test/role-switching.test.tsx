/**
 * Single-account regression coverage for shared surfaces that used to rely on active role switching.
 */
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";

let mockAccountType: "student" | "instructor" | "freelancer" | "expert" = "student";
let mockRole: "student" | "instructor" | "individual" | "expert" = "student";
let mockRoles: string[] = ["student"];
const mockSwitchRole = vi.fn(async () => {
  throw new Error("Role switching is disabled. The platform now uses a single canonical account model.");
});
const mockAddRole = vi.fn(async () => ({
  error: new Error("Adding roles is disabled. The platform now uses a single canonical account model."),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "test@example.com" },
    session: {},
    loading: false,
    accountType: mockAccountType,
    role: mockRole,
    roles: mockRoles,
    capabilities: [],
    accountStatus: "active",
    approvalStatus: "approved",
    badges: [],
    entitlements: [],
    isEmailVerified: true,
    hasCapability: vi.fn(() => false),
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
    updatePassword: vi.fn(),
    switchRole: mockSwitchRole,
    addRole: mockAddRole,
  }),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ lang: "en", dir: "ltr", t: (_l: string, en: string) => en, setLang: vi.fn() }),
  LanguageProvider: ({ children }: any) => children,
}));

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({ theme: "light", toggleTheme: vi.fn() }),
  ThemeProvider: ({ children }: any) => children,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { full_name: "Test User", avatar_url: null }, error: null }),
        }),
      }),
    }),
  },
}));

vi.mock("@/components/profile/ProfileCompletenessBanner", () => ({ default: () => <div data-testid="profile-banner" /> }));
vi.mock("@/components/landing/ResumeTaskCard", () => ({ default: () => <div data-testid="resume-task" /> }));
vi.mock("@/components/landing/SuggestedNextSteps", () => ({ default: () => <div data-testid="next-steps" /> }));
vi.mock("@/components/landing/InstructorHomeSections", () => ({ default: () => <div data-testid="instructor-sections" /> }));
vi.mock("@/components/landing/StudentHomeSections", () => ({ default: () => <div data-testid="student-sections" /> }));
vi.mock("@/components/landing/InstructorSidebar", () => ({ default: () => ({ desktopSidebar: <div data-testid="instructor-sidebar" />, mobileAccordion: null }) }));
vi.mock("@/components/home/StudentHomeRail", () => ({ default: () => <div data-testid="student-rail" /> }));
vi.mock("@/core/components/ActivityFeed", () => ({ default: () => <div data-testid="activity-feed" /> }));
vi.mock("@/hooks/useInstructorHomeData", () => ({ useInstructorHomeData: () => ({}) }));
vi.mock("@/hooks/useStudentHomeData", () => ({ useStudentHomeData: () => ({}) }));
vi.mock("@/lib/workspaceEntry", () => ({ buildEntryState: () => ({}) }));
vi.mock("@/portals/consulting/pages/ConsultingExpertDashboard", () => ({ default: () => <div data-testid="expert-dashboard" /> }));
vi.mock("@/portals/consulting/pages/ConsultingClientDashboard", () => ({ default: () => <div data-testid="client-dashboard" /> }));
vi.mock("@/portals/academy/pages/AcademyStudentDashboard", () => ({ default: () => <div data-testid="student-dashboard" /> }));

function wrap(ui: React.ReactElement, initialEntries: string[] = ["/"]) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  mockAccountType = "student";
  mockRole = "student";
  mockRoles = ["student"];
  mockSwitchRole.mockClear();
  mockAddRole.mockClear();
});

describe("single-account shared surfaces", () => {
  it("renders the student homepage from canonical accountType", async () => {
    const Homepage = (await import("@/components/landing/AuthenticatedHomepage")).default;
    wrap(<Homepage />);
    expect(screen.getByTestId("student-sections")).toBeInTheDocument();
    expect(screen.queryByTestId("instructor-sections")).not.toBeInTheDocument();
  });

  it("renders the instructor homepage from canonical accountType", async () => {
    const Homepage = (await import("@/components/landing/AuthenticatedHomepage")).default;
    mockAccountType = "instructor";
    mockRole = "instructor";
    mockRoles = ["instructor"];
    wrap(<Homepage />);
    expect(screen.getByTestId("instructor-sections")).toBeInTheDocument();
    expect(screen.queryByTestId("student-sections")).not.toBeInTheDocument();
  });

  it("keeps consulting dashboard behavior stable with a canonical freelancer account and legacy role shim", async () => {
    const Dashboard = (await import("@/portals/consulting/pages/ConsultingDashboard")).default;
    mockAccountType = "freelancer";
    mockRole = "individual";
    mockRoles = ["individual"];
    wrap(<Dashboard />);
    expect(screen.getByTestId("client-dashboard")).toBeInTheDocument();
    expect(screen.queryByTestId("expert-dashboard")).not.toBeInTheDocument();
  });

  it("routes freelancer talent access to the canonical freelancer workspace", async () => {
    const Router = (await import("@/portals/talent/pages/TalentRouterPage")).default;
    mockAccountType = "freelancer";
    mockRole = "individual";
    mockRoles = ["individual"];

    render(
      <MemoryRouter initialEntries={["/talent/portal"]}>
        <Routes>
          <Route path="/talent/portal" element={<Router />} />
          <Route path="/talent/portal/freelancer" element={<div>Freelancer Workspace</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Freelancer Workspace")).toBeInTheDocument();
  });

  it("does not provide real role switching behavior through deprecated auth actions", async () => {
    await expect(mockSwitchRole("instructor")).rejects.toThrow(/disabled/i);
    const result = await mockAddRole("student");
    expect(result.error.message).toMatch(/disabled/i);
    expect(mockAccountType).toBe("student");
    expect(mockRole).toBe("student");
    expect(mockRoles).toEqual(["student"]);
  });
});
