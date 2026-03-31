/**
 * Tests for student course structure hooks — verifies safe query patterns
 * without hitting real DB (hooks are mocked at the supabase level).
 */
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock supabase before importing hooks
vi.mock("@/integrations/supabase/client", () => {
  const chain = () => {
    const obj: any = {};
    for (const m of ["from", "select", "eq", "in", "is", "or", "order", "maybeSingle", "rpc"]) {
      obj[m] = vi.fn().mockReturnValue(obj);
    }
    // Default resolved value
    obj.then = (resolve: any) => resolve({ data: [], error: null });
    // Make it thenable for await
    Object.defineProperty(obj, Symbol.toStringTag, { value: "Promise" });
    return obj;
  };
  return { supabase: chain() };
});

import {
  useCourseStructureCounts,
  useMyCourseCohort,
  useMySessions,
  useMyAttendance,
  useMyStructureItems,
  useMyAttempts,
  useMySubmissions,
  useMyProjectReviews,
} from "@/portals/academy/hooks/useStudentCourseStructure";

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: qc }, children);
}

describe("Student course structure hooks", () => {
  it("useCourseStructureCounts is disabled without courseId", () => {
    const { result } = renderHook(() => useCourseStructureCounts(undefined), { wrapper });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it("useMyCourseCohort is disabled without userId", () => {
    const { result } = renderHook(() => useMyCourseCohort("course-1", undefined), { wrapper });
    expect(result.current.data).toBeUndefined();
  });

  it("useMySessions is disabled without courseId", () => {
    const { result } = renderHook(() => useMySessions(undefined), { wrapper });
    expect(result.current.data).toBeUndefined();
  });

  it("useMyAttendance is disabled with empty sessionIds", () => {
    const { result } = renderHook(() => useMyAttendance("user-1", []), { wrapper });
    expect(result.current.data).toBeUndefined();
  });

  it("useMyStructureItems is disabled without courseId", () => {
    const { result } = renderHook(() => useMyStructureItems(undefined), { wrapper });
    expect(result.current.data).toBeUndefined();
  });

  it("useMyAttempts is disabled with empty assessmentIds", () => {
    const { result } = renderHook(() => useMyAttempts("user-1", []), { wrapper });
    expect(result.current.data).toBeUndefined();
  });

  it("useMySubmissions is disabled with empty projectIds", () => {
    const { result } = renderHook(() => useMySubmissions("user-1", []), { wrapper });
    expect(result.current.data).toBeUndefined();
  });

  it("useMyProjectReviews is disabled with empty projectIds", () => {
    const { result } = renderHook(() => useMyProjectReviews("user-1", []), { wrapper });
    expect(result.current.data).toBeUndefined();
  });
});
