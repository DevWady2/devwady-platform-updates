import { describe, expect, it, beforeEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderAtPath } from "./backoffice-test-utils";

vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: () => ({ lang: "en" }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

const searchState = { params: { query: "" }, setQuery: vi.fn() };
vi.mock("@/core/hooks", () => ({ useSearch: () => searchState }));

vi.mock("@/core/components", () => ({
  PageHeader: ({ title_en, description_en }: any) => (<header><h1>{title_en}</h1><p>{description_en}</p></header>),
  SearchFilterBar: ({ query, placeholder_en }: any) => <input aria-label="account-type-search" defaultValue={query} placeholder={placeholder_en} />,
  EmptyState: ({ title_en, description_en }: any) => <div><h2>{title_en}</h2><p>{description_en}</p></div>,
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

const { useQuery } = await import("@tanstack/react-query");
const useQueryMock = vi.mocked(useQuery);
const { default: BackofficeRoles } = await import("@/portals/backoffice/pages/BackofficeRoles");

function mockProfiles(profiles: any[]) {
  useQueryMock.mockImplementation(({ queryKey }: any) => {
    const key = Array.isArray(queryKey) ? queryKey.join(":") : String(queryKey);
    if (key === "bo-account-types") return { data: profiles, isLoading: false } as any;
    return { data: [], isLoading: false } as any;
  });
}

describe("BackofficeRoles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchState.params.query = "";
  });

  it("renders grouped users with canonical account-type badges and capability counts", () => {
    mockProfiles([
      { user_id: "u1", full_name: "Kamal Wagdi", account_type: "admin", capabilities: ["admin_backoffice"] },
      { user_id: "u2", full_name: "Sara Ali", account_type: "company", capabilities: ["manage_team", "post_jobs"] },
      { user_id: "u3", full_name: "Mina Adel", account_type: "student", capabilities: ["enroll_courses"] },
    ]);

    renderAtPath(<BackofficeRoles />, "/admin/roles", "/admin/roles");

    expect(screen.getByRole("heading", { name: /Account Types & Capabilities/i })).toBeInTheDocument();
    expect(screen.getByText(/Admin: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Company: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Student: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Kamal Wagdi/i)).toBeInTheDocument();
    expect(screen.getByText(/Sara Ali/i)).toBeInTheDocument();
    expect(screen.getAllByText(/capabilities/i).length).toBeGreaterThan(0);
  });

  it("shows empty state when no canonical account types exist", () => {
    mockProfiles([]);
    renderAtPath(<BackofficeRoles />, "/admin/roles", "/admin/roles");
    expect(screen.getByText(/No canonical account types/i)).toBeInTheDocument();
    expect(screen.getByText(/Users with a canonical account type will appear here/i)).toBeInTheDocument();
  });
});
