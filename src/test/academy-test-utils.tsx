import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";

export const navigateMock = vi.fn();
export const mutationMutateMock = vi.fn();
export const downloadCSVMock = vi.fn();

const queryMap = new Map<string, any>();

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSearch } from "@/core/hooks";
import { useStudentEnrollments } from "@/portals/academy/hooks/useStudentEnrollments";
import { useInstructorCourses } from "@/portals/academy/hooks/useInstructorCourses";
import { useMutation, useQuery } from "@tanstack/react-query";

export const mockUseAuth = vi.mocked(useAuth);
export const mockUseLanguage = vi.mocked(useLanguage);
export const mockUseSearch = vi.mocked(useSearch);
export const mockUseStudentEnrollments = vi.mocked(useStudentEnrollments);
export const mockUseInstructorCourses = vi.mocked(useInstructorCourses);
export const mockUseQuery = vi.mocked(useQuery);
export const mockUseMutation = vi.mocked(useMutation);

function legacyRoleFromAccountType(accountType: string | null) {
  if (accountType === "freelancer") return "individual";
  return accountType;
}

export function resetAcademyTestMocks() {
  vi.clearAllMocks();
  queryMap.clear();
  navigateMock.mockReset();
  mutationMutateMock.mockReset();
  downloadCSVMock.mockReset();

  const accountType = "student";
  const role = legacyRoleFromAccountType(accountType);

  mockUseAuth.mockReturnValue({
    user: { id: "user-1", email: "user@example.com" },
    session: null,
    loading: false,
    accountType,
    role,
    roles: role ? [role] : [],
    capabilities: ["browse_courses", "enroll_courses"],
    accountStatus: "active",
    approvalStatus: "approved",
    badges: [],
    entitlements: [],
    isEmailVerified: true,
    hasCapability: vi.fn((cap: string) => ["browse_courses", "enroll_courses"].includes(cap)),
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
    updatePassword: vi.fn(),
    switchRole: vi.fn(async () => {
      throw new Error("Role switching is disabled. The platform now uses a single canonical account model.");
    }),
    addRole: vi.fn(async () => ({
      error: new Error("Adding roles is disabled. The platform now uses a single canonical account model."),
    })),
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

  mockUseStudentEnrollments.mockReturnValue({
    enrollments: [],
    progressData: [],
    isLoading: false,
    getProgress: vi.fn(() => 0),
  } as any);

  mockUseInstructorCourses.mockReturnValue({
    data: [],
    isLoading: false,
  } as any);

  mockUseQuery.mockImplementation((options: any) => {
    const key = Array.isArray(options?.queryKey) ? String(options.queryKey[0]) : String(options?.queryKey ?? "");
    return queryMap.get(key) ?? { data: [], isLoading: false, isPending: false };
  });

  mockUseMutation.mockImplementation((config: any) => ({
    mutate: (...args: any[]) => {
      mutationMutateMock(...args);
      return config?.mutationFn?.(...args);
    },
    isPending: false,
    reset: vi.fn(),
  }) as any);
}

export function setAcademyQueryMap(map: Record<string, any>) {
  queryMap.clear();
  Object.entries(map).forEach(([key, value]) => queryMap.set(key, value));
}

export function renderAtPath(ui: React.ReactElement, path: string, routePath = path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={routePath} element={ui} />
      </Routes>
    </MemoryRouter>
  );
}

export function renderInRouter(ui: React.ReactElement, initialEntries: string[] = ["/"]) {
  return render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>);
}
