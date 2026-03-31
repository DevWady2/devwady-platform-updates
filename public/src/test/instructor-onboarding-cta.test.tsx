import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import React from "react";

// Polyfill IntersectionObserver for jsdom (framer-motion needs it)
beforeAll(() => {
  globalThis.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
});

// --- Hoisted state shared with vi.mock factories ---
const { navigateSpy, stepOverride } = vi.hoisted(() => ({
  navigateSpy: vi.fn(),
  stepOverride: { active: false },
}));

// --- Module-level mocks ---
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateSpy };
});

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  let intercepted = false;
  return {
    ...actual,
    default: actual,
    useState: (init: unknown) => {
      // Intercept only the first useState(1) call when step override is active
      if (stepOverride.active && init === 1 && !intercepted) {
        intercepted = true;
        return [4, vi.fn()] as any;
      }
      return actual.useState(init);
    },
  };
});

vi.mock("react-helmet-async", () => ({
  Helmet: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  HelmetProvider: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ lang: "en", t: (k: string) => k }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1", email: "test@test.com" } }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: async () => ({ data: null }),
              }),
            }),
          }),
          maybeSingle: async () => ({ data: null }),
          single: async () => ({ data: null }),
        }),
      }),
      update: () => ({ eq: async () => ({ error: null }) }),
      insert: () => ({
        select: () => ({
          single: async () => ({ data: { id: "course-1" }, error: null }),
        }),
      }),
    }),
  },
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: null, isLoading: false }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock("@/hooks/useMediaUpload", () => ({
  useMediaUpload: () => ({ uploading: false, upload: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

vi.mock("@/features/academy/learningModel", () => ({
  normalizeCourseMetadata: (v: unknown) => v,
}));

describe("InstructorOnboarding completion CTA", () => {
  it("navigates to /instructor/workspace at runtime", async () => {
    navigateSpy.mockClear();
    stepOverride.active = true;

    const { default: InstructorOnboarding } = await import(
      "@/pages/onboarding/InstructorOnboarding"
    );

    const { unmount } = render(
      <MemoryRouter initialEntries={["/onboarding/instructor"]}>
        <Routes>
          <Route
            path="/onboarding/instructor"
            element={<InstructorOnboarding />}
          />
        </Routes>
      </MemoryRouter>
    );

    // The completion CTA button should be visible at step 4
    const ctaButton = screen.getByRole("button", {
      name: /go to instructor workspace/i,
    });
    const { default: userEvent } = await import("@testing-library/user-event");
    await userEvent.click(ctaButton);

    // Positive proof: navigate called with canonical workspace
    expect(navigateSpy).toHaveBeenCalledWith("/instructor/workspace");

    // Negative proof: never called with legacy dashboard path
    const allArgs = navigateSpy.mock.calls.flat();
    expect(
      allArgs.every(
        (arg: unknown) =>
          typeof arg !== "string" || !arg.includes("/instructor/dashboard")
      )
    ).toBe(true);

    unmount();
    stepOverride.active = false;
  });
});
