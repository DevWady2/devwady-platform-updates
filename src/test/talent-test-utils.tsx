import React from "react";
import { render, cleanup } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";

export const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/contexts/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: vi.fn() }));
vi.mock("@/core/hooks/useSearch", () => ({ useSearch: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("@/core/components", () => ({
  PageHeader: ({ title_en, title_ar, description_en, description_ar, actions, badge }: any) => (
    <header>
      <h1>{title_en ?? title_ar}</h1>
      {(description_en || description_ar) && <p>{description_en ?? description_ar}</p>}
      {badge}
      {actions}
    </header>
  ),
  SearchFilterBar: ({ query, onQueryChange, placeholder_en, placeholder_ar }: any) => (
    <label>
      Search
      <input
        aria-label="search"
        placeholder={placeholder_en ?? placeholder_ar}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />
    </label>
  ),
  EmptyState: ({ title_en, title_ar, description_en, description_ar, actionLabel_en, actionLabel_ar, onAction }: any) => (
    <div>
      <h2>{title_en ?? title_ar}</h2>
      <p>{description_en ?? description_ar}</p>
      {onAction ? <button onClick={onAction}>{actionLabel_en ?? actionLabel_ar ?? "Action"}</button> : null}
    </div>
  ),
  StatCardGrid: ({ stats, loading }: any) => (
    <div data-testid="stat-grid" data-loading={loading ? "true" : "false"}>
      {stats.map((stat: any) => (
        <div key={stat.label_en}>
          <span>{stat.label_en ?? stat.label_ar}</span>
          <strong>{String(stat.value)}</strong>
        </div>
      ))}
    </div>
  ),
  ActivityFeed: () => <div data-testid="activity-feed">Activity feed</div>,
  FocusBlock: ({ title_en, title_ar, action_en, action_ar, actionHref, subtitle_en, subtitle_ar, label_en, label_ar }: any) => (
    <div data-testid="focus-block">
      <span>{title_en ?? title_ar}</span>
      {(subtitle_en || subtitle_ar) && <p>{subtitle_en ?? subtitle_ar}</p>}
      <a href={actionHref}>{action_en ?? action_ar}</a>
    </div>
  ),
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>("@tanstack/react-query");
  return {
    ...actual,
    useQuery: vi.fn(),
    useMutation: vi.fn(),
    useQueryClient: vi.fn(),
  };
});

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSearch } from "@/core/hooks/useSearch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const mockUseAuth = vi.mocked(useAuth);
export const mockUseLanguage = vi.mocked(useLanguage);
export const mockUseSearch = vi.mocked(useSearch);
export const mockUseQuery = vi.mocked(useQuery);
export const mockUseMutation = vi.mocked(useMutation);
export const mockUseQueryClient = vi.mocked(useQueryClient);

export const invalidateQueriesMock = vi.fn();


export function resetTalentTestMocks() {
  vi.clearAllMocks();
  navigateMock.mockReset();
  invalidateQueriesMock.mockReset();

  const accountType = "company";

  mockUseAuth.mockReturnValue({
    user: { id: "user-1", email: "user@example.com" },
    session: null,
    loading: false,
    accountType,
    capabilities: ["post_jobs", "request_services", "manage_team"],
    accountStatus: "active",
    approvalStatus: "approved",
    badges: [],
    entitlements: [],
    isEmailVerified: true,
    hasCapability: vi.fn((cap: string) => ["post_jobs", "request_services", "manage_team"].includes(cap)),
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
    updatePassword: vi.fn(),
  } as any);

  mockUseLanguage.mockReturnValue({
    lang: "en",
    dir: "ltr",
    t: (key: string) => key,
    setLang: vi.fn(),
  } as any);

  mockUseSearch.mockReturnValue({
    params: { query: "" },
    setQuery: vi.fn(),
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    setSort: vi.fn(),
    setFilter: vi.fn(),
    clearFilters: vi.fn(),
    resetAll: vi.fn(),
    activeFilterCount: 0,
    rangeFrom: 0,
    rangeTo: 11,
  } as any);

  mockUseQuery.mockImplementation(() => ({ data: undefined, isLoading: false } as any));
  mockUseMutation.mockImplementation(() => ({ mutate: vi.fn(), isPending: false } as any));
  mockUseQueryClient.mockReturnValue({ invalidateQueries: invalidateQueriesMock } as any);
}

export function setTalentQueryMap(map: Record<string, any>) {
  mockUseQuery.mockImplementation((options: any) => {
    const key = Array.isArray(options?.queryKey) ? String(options.queryKey[0]) : String(options?.queryKey);
    const value = map[key];
    if (typeof value === "function") return value(options);
    if (value && typeof value === "object" && ("data" in value || "isLoading" in value || "error" in value)) {
      return value;
    }
    return { data: value, isLoading: false } as any;
  });
}

export function renderAtPath(element: React.ReactNode, path = "/") {
  cleanup();
  return render(<MemoryRouter initialEntries={[path]}>{element}</MemoryRouter>);
}

export function renderWithRoute(element: React.ReactNode, path: string, routePath: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={routePath} element={element} />
      </Routes>
    </MemoryRouter>
  );
}

export function renderTalentRouterAt(path = "/talent/portal") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/talent/portal" element={<div />} />
      </Routes>
    </MemoryRouter>
  );
}
