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

// Mock react-helmet-async
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
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }), single: async () => ({ data: null }) }) }),
    }),
  },
}));
vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === "instructor-application") {
      return { data: { status: "approved", admin_notes: null }, isLoading: false };
    }
    return { data: null, isLoading: false };
  },
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

describe("Instructor entry CTAs target canonical workspace", () => {
  it("BecomeInstructor approved CTA links to /instructor/workspace", async () => {
    const { default: BecomeInstructor } = await import("@/pages/BecomeInstructor");

    render(
      <MemoryRouter initialEntries={["/become-instructor"]}>
        <Routes>
          <Route path="/become-instructor" element={<BecomeInstructor />} />
          <Route path="/instructor/workspace" element={<div>workspace-sentinel</div>} />
        </Routes>
      </MemoryRouter>
    );

    const link = screen.getByRole("link", { name: /go to workspace/i });
    expect(link).toHaveAttribute("href", "/instructor/workspace");
  });

  it("BecomeInstructor approved CTA does NOT link to legacy /instructor/dashboard", async () => {
    const { default: BecomeInstructor } = await import("@/pages/BecomeInstructor");

    render(
      <MemoryRouter initialEntries={["/become-instructor"]}>
        <Routes>
          <Route path="/become-instructor" element={<BecomeInstructor />} />
        </Routes>
      </MemoryRouter>
    );

    const link = screen.getByRole("link", { name: /go to workspace/i });
    expect(link.getAttribute("href")).not.toContain("/instructor/dashboard");
  });

});
