import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import React from "react";

beforeAll(() => {
  globalThis.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
});

const { navigateSpy } = vi.hoisted(() => ({
  navigateSpy: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateSpy };
});

vi.mock("react-helmet-async", () => ({
  Helmet: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  HelmetProvider: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ lang: "en", t: (k: string) => k }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "test@test.com" },
    roles: ["instructor"],
    role: "instructor",
  }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null }),
          single: async () => ({ data: null }),
        }),
      }),
    }),
  },
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: null, isLoading: false }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

describe("Join page instructor role card CTA", () => {
  it("instructor active-role CTA navigates to /instructor/workspace", async () => {
    navigateSpy.mockClear();

    const { default: Join } = await import("@/pages/Join");

    render(
      <MemoryRouter initialEntries={["/join"]}>
        <Routes>
          <Route path="/join" element={<Join />} />
        </Routes>
      </MemoryRouter>
    );

    // Scope to the instructor card via its heading (filter to the card <h3>, not the FAQ accordion)
    const instructorHeadings = screen.getAllByRole("heading", { name: /instructor/i });
    const instructorHeading = instructorHeadings.find(
      (h) => h.tagName === "H3" && h.textContent?.trim() === "Instructor"
    )!;
    const card = instructorHeading.closest(".rounded-lg") ?? instructorHeading.parentElement!;
    const ctaButton = within(card as HTMLElement).getByRole("button", { name: /go to dashboard/i });

    const { default: userEvent } = await import("@testing-library/user-event");
    await userEvent.click(ctaButton);

    // Positive: navigate called with canonical workspace
    expect(navigateSpy).toHaveBeenCalledWith("/instructor/workspace");

    // Negative: never called with legacy path
    const allArgs = navigateSpy.mock.calls.flat();
    expect(
      allArgs.every(
        (arg: unknown) => typeof arg !== "string" || !arg.includes("/instructor/dashboard")
      )
    ).toBe(true);
  });
});
