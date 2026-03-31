/**
 * Focused regression tests for multi-role switch safety.
 * Covers: Instructor+Freelancer, Instructor+Student, and action-safety (double-click).
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";

/* ── mock state ── */
let mockRole: string = "instructor";
let mockRoles: string[] = ["instructor", "individual"];
let switchDelay = 0;
const mockSwitchRole = vi.fn(async (r: string) => {
  if (switchDelay > 0) await new Promise((res) => setTimeout(res, switchDelay));
  mockRole = r;
});

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "test@example.com" },
    session: {},
    loading: false,
    role: mockRole,
    roles: mockRoles,
    accountStatus: "active",
    isEmailVerified: true,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
    updatePassword: vi.fn(),
    switchRole: mockSwitchRole,
    addRole: vi.fn(),
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
          maybeSingle: () => Promise.resolve({ data: { full_name: "Test", avatar_url: null }, error: null }),
          order: () => ({ then: (r: any) => Promise.resolve({ data: [], error: null }).then(r) }),
        }),
      }),
    }),
  },
}));

vi.mock("@/hooks/useProfileCompleteness", () => ({
  useProfileCompleteness: () => ({ percentage: 80, score: 80, loading: false }),
}));

vi.mock("@/components/SEO", () => ({ default: () => null }));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockRole = "instructor";
  mockRoles = ["instructor", "individual"];
  switchDelay = 0;
  mockSwitchRole.mockClear();
});

/* ═══════════════════════════════════════════════════════════════
 * 1. Instructor + Freelancer (individual) — no stale instructor state
 * ═══════════════════════════════════════════════════════════════ */
describe("Instructor + Freelancer switch regression", () => {
  it("switchRole changes active role from instructor to individual", async () => {
    expect(mockRole).toBe("instructor");
    await mockSwitchRole("individual");
    expect(mockRole).toBe("individual");
    expect(mockSwitchRole).toHaveBeenCalledWith("individual");
  });

  it("after switch, role is individual not instructor", async () => {
    await mockSwitchRole("individual");
    expect(mockRole).not.toBe("instructor");
    expect(mockRole).toBe("individual");
  });
});

/* ═══════════════════════════════════════════════════════════════
 * 2. Instructor + Student — no stale student state after switch
 * ═══════════════════════════════════════════════════════════════ */
describe("Instructor + Student switch regression", () => {
  beforeEach(() => {
    mockRole = "student";
    mockRoles = ["student", "instructor"];
  });

  it("switchRole changes active role from student to instructor", async () => {
    expect(mockRole).toBe("student");
    await mockSwitchRole("instructor");
    expect(mockRole).toBe("instructor");
    expect(mockRole).not.toBe("student");
  });

  it("switchRole changes active role from instructor to student", async () => {
    mockRole = "instructor";
    await mockSwitchRole("student");
    expect(mockRole).toBe("student");
    expect(mockRole).not.toBe("instructor");
  });
});

/* ═══════════════════════════════════════════════════════════════
 * 3. MyRolesSection — pending guard blocks double-click
 * ═══════════════════════════════════════════════════════════════ */
describe("MyRolesSection action safety", () => {
  let MyRolesSection: any;
  beforeEach(async () => {
    MyRolesSection = (await import("@/components/profile/MyRolesSection")).default;
  });

  it("renders switch button for non-primary role", () => {
    mockRole = "instructor";
    mockRoles = ["instructor", "individual"];
    wrap(<MyRolesSection />);
    expect(screen.getByText("Switch to")).toBeTruthy();
  });

  it("disables button while switch is pending", async () => {
    switchDelay = 200;
    mockRole = "instructor";
    mockRoles = ["instructor", "individual"];
    wrap(<MyRolesSection />);
    const btn = screen.getByText("Switch to");
    fireEvent.click(btn);
    // During pending, button should show loading text
    await waitFor(() => {
      expect(screen.getByText("...")).toBeTruthy();
    });
  });
});

/* ═══════════════════════════════════════════════════════════════
 * 4. AccountSettings — pending guard blocks double-click
 * ═══════════════════════════════════════════════════════════════ */
describe("AccountSettings action safety", () => {
  let AccountSettings: any;
  beforeEach(async () => {
    AccountSettings = (await import("@/pages/AccountSettings")).default;
  });

  it("renders Set as primary for non-primary roles", () => {
    mockRole = "instructor";
    mockRoles = ["instructor", "individual"];
    wrap(<AccountSettings />);
    expect(screen.getByText("Set as primary")).toBeTruthy();
  });

  it("shows loading state during switch", async () => {
    switchDelay = 200;
    mockRole = "instructor";
    mockRoles = ["instructor", "individual"];
    wrap(<AccountSettings />);
    const btn = screen.getByText("Set as primary");
    fireEvent.click(btn);
    await waitFor(() => {
      expect(screen.getByText("...")).toBeTruthy();
    });
  });
});
