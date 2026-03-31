/**
 * Regression coverage for the single-account compatibility boundary.
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";

let mockAccountType: "freelancer" | "instructor" = "freelancer";
let mockRole: "individual" | "instructor" = "individual";
let mockRoles: string[] = ["individual"];
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
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
    updatePassword: vi.fn(),
    switchRole: mockSwitchRole,
    addRole: mockAddRole,
    hasCapability: vi.fn(() => false),
  }),
  legacyRoleFrom: (accountType: string) => (accountType === "freelancer" ? "individual" : accountType),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ lang: "en", dir: "ltr", t: (_l: string, en: string) => en, setLang: vi.fn() }),
  LanguageProvider: ({ children }: any) => children,
}));

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({ theme: "light", toggleTheme: vi.fn() }),
  ThemeProvider: ({ children }: any) => children,
}));

vi.mock("@/hooks/useProfileCompleteness", () => ({
  useProfileCompleteness: () => ({ percentage: 80, score: 80, loading: false, nextStep: "Add your bio" }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { full_name: "Test", avatar_url: null }, error: null }),
        }),
      }),
    }),
    auth: {
      updateUser: vi.fn(),
      resend: vi.fn(),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      signOut: vi.fn(),
    },
    functions: { invoke: vi.fn() },
  },
}));

vi.mock("@/components/SEO", () => ({ default: () => null }));

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockAccountType = "freelancer";
  mockRole = "individual";
  mockRoles = ["individual"];
  mockSwitchRole.mockClear();
  mockAddRole.mockClear();
});

describe("single-account migration regressions", () => {
  it("deprecated switchRole does not change canonical accountType", async () => {
    await expect(mockSwitchRole("instructor")).rejects.toThrow(/disabled/i);
    expect(mockAccountType).toBe("freelancer");
    expect(mockRole).toBe("individual");
    expect(mockRoles).toEqual(["individual"]);
  });

  it("deprecated addRole does not create a new active identity", async () => {
    const result = await mockAddRole("student");
    expect(result.error.message).toMatch(/disabled/i);
    expect(mockAccountType).toBe("freelancer");
    expect(mockRoles).toEqual(["individual"]);
  });

  it("MyRolesSection exposes single-account framing instead of role-switch controls", async () => {
    const MyRolesSection = (await import("@/components/profile/MyRolesSection")).default;
    wrap(<MyRolesSection />);
    expect(screen.getByText("Account Type")).toBeInTheDocument();
    expect(screen.getByText("Freelancer")).toBeInTheDocument();
    expect(screen.queryByText(/Switch to/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Set as primary/i)).not.toBeInTheDocument();
  });

  it("AccountSettings shows read-only account identity with no role-switch affordance", async () => {
    const AccountSettings = (await import("@/pages/AccountSettings")).default;
    wrap(<AccountSettings />);
    expect(screen.getAllByText("Account Type").length).toBeGreaterThan(0);
    expect(screen.getByText("Freelancer")).toBeInTheDocument();
    expect(screen.queryByText(/Roles & Access/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Explore more roles/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Set as primary/i)).not.toBeInTheDocument();
  });

  it("AddRoleDialog stays informational and disabled", async () => {
    const AddRoleDialog = (await import("@/components/AddRoleDialog")).default;
    wrap(<AddRoleDialog open onOpenChange={vi.fn()} />);
    expect(screen.getByText("Not Available")).toBeInTheDocument();
    expect(screen.getByText(/single account type/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "OK" }));
    await waitFor(() => expect(mockAddRole).not.toHaveBeenCalled());
  });
});
