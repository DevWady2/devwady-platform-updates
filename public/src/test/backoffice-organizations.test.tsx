

import { describe, expect, it, beforeEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderAtPath } from "./backoffice-test-utils";

vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: () => ({ lang: "en" }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

const searchState = { params: { query: "" }, setQuery: vi.fn() };
vi.mock("@/core/hooks", () => ({ useSearch: () => searchState }));

vi.mock("@/core/components", () => ({
  PageHeader: ({ title_en, description_en }: any) => (<header><h1>{title_en}</h1><p>{description_en}</p></header>),
  SearchFilterBar: ({ query, placeholder_en }: any) => <input aria-label="company-search" defaultValue={query} placeholder={placeholder_en} />,
  EmptyState: ({ title_en, description_en }: any) => <div><h2>{title_en}</h2><p>{description_en}</p></div>,
}));

vi.mock("@tanstack/react-query", () => ({ useQuery: vi.fn() }));
const { useQuery } = await import("@tanstack/react-query");
const useQueryMock = vi.mocked(useQuery);
const { default: BackofficeOrganizations } = await import("@/portals/backoffice/pages/BackofficeOrganizations");

function mockCompanies(data: any[] = []) {
  useQueryMock.mockReturnValue({ data, isLoading: false } as any);
}

describe("BackofficeOrganizations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchState.params.query = "";
  });

  it("renders organization cards with status and external link", () => {
    mockCompanies([
      {
        id: "c1",
        company_name: "Acme Systems",
        logo_url: null,
        industry: "ERP",
        location: "Cairo",
        employee_count: "51-200",
        is_verified: true,
        slug: "acme-systems",
        created_at: "2026-03-20T00:00:00Z",
        owner_name: "Mona",
        owner_status: "active",
      },
    ]);

    renderAtPath(<BackofficeOrganizations />, "/admin/organizations", "/admin/organizations");

    expect(screen.getByRole("heading", { name: /Organizations/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue("")).toBeInTheDocument();
    expect(screen.getByText(/Acme Systems/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Verified/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/ERP/i)).toBeInTheDocument();
    expect(screen.getByText(/Cairo/i)).toBeInTheDocument();
    expect(screen.getByText(/51-200/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "" })).toHaveAttribute("href", "/companies/acme-systems");
  });

  it("shows empty state when there are no matching organizations", () => {
    mockCompanies([]);
    renderAtPath(<BackofficeOrganizations />, "/admin/organizations", "/admin/organizations");
    expect(screen.getByText(/No organizations found/i)).toBeInTheDocument();
    expect(screen.getByText(/Company accounts will appear here/i)).toBeInTheDocument();
  });
});
