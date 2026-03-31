

import { describe, expect, it, beforeEach, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderAtPath } from "./backoffice-test-utils";

vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: () => ({ lang: "en" }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const searchState = { params: { query: "" }, setQuery: vi.fn() };
vi.mock("@/core/hooks", () => ({ useSearch: () => searchState }));

vi.mock("@/core/components", () => ({
  PageHeader: ({ title_en, description_en }: any) => (<header><h1>{title_en}</h1><p>{description_en}</p></header>),
  SearchFilterBar: ({ query, placeholder_en }: any) => <input aria-label="role-search" defaultValue={query} placeholder={placeholder_en} />,
  EmptyState: ({ title_en, description_en }: any) => <div><h2>{title_en}</h2><p>{description_en}</p></div>,
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

const { useQuery, useMutation } = await import("@tanstack/react-query");
const useQueryMock = vi.mocked(useQuery);
const useMutationMock = vi.mocked(useMutation);
const { default: BackofficeRoles } = await import("@/portals/backoffice/pages/BackofficeRoles");

function mockRolesData(userRoles: any[], profiles: any[]) {
  useQueryMock.mockImplementation(({ queryKey }: any) => {
    const key = Array.isArray(queryKey) ? queryKey.join(":") : String(queryKey);
    if (key === "bo-user-roles") return { data: userRoles, isLoading: false } as any;
    if (key === "bo-role-profiles") return { data: profiles, isLoading: false } as any;
    return { data: [], isLoading: false } as any;
  });
  useMutationMock.mockReturnValue({ mutate: vi.fn(), isPending: false } as any);
}

describe("BackofficeRoles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchState.params.query = "";
  });

  it("renders grouped users with role badges and counts", () => {
    mockRolesData(
      [
        { id: "r1", user_id: "u1", role: "admin" },
        { id: "r2", user_id: "u1", role: "company" },
        { id: "r3", user_id: "u2", role: "student" },
      ],
      [
        { user_id: "u1", full_name: "Kamal Wagdi" },
        { user_id: "u2", full_name: "Sara Ali" },
      ]
    );

    renderAtPath(<BackofficeRoles />, "/admin/roles", "/admin/roles");

    expect(screen.getByRole("heading", { name: /Roles & Permissions/i })).toBeInTheDocument();
    expect(screen.getByText(/admin: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/company: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/student: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Kamal Wagdi/i)).toBeInTheDocument();
    expect(screen.getByText(/Sara Ali/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Add Role/i).length).toBeGreaterThanOrEqual(2);
  });

  it("opens add-role inline controls for a selected user", () => {
    mockRolesData(
      [{ id: "r1", user_id: "u1", role: "admin" }],
      [{ user_id: "u1", full_name: "Kamal Wagdi" }]
    );

    renderAtPath(<BackofficeRoles />, "/admin/roles", "/admin/roles");
    fireEvent.click(screen.getByRole("button", { name: /Add Role/i }));
    expect(screen.getByText(/Select role/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Add$/i })).toBeDisabled();
  });

  it("shows empty state when no users have roles", () => {
    mockRolesData([], []);
    renderAtPath(<BackofficeRoles />, "/admin/roles", "/admin/roles");
    expect(screen.getByText(/No users with roles/i)).toBeInTheDocument();
    expect(screen.getByText(/Assign roles to users to see them here/i)).toBeInTheDocument();
  });
});
