import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AcademyDashboard from "@/portals/academy/pages/AcademyDashboard";
import { mockUseAuth, resetAcademyTestMocks } from "./academy-test-utils";

vi.mock("@/contexts/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: vi.fn() }));
vi.mock("@/core/hooks", () => ({ useSearch: vi.fn() }));
vi.mock("@/portals/academy/hooks/useStudentEnrollments", () => ({ useStudentEnrollments: vi.fn() }));
vi.mock("@/portals/academy/hooks/useInstructorCourses", () => ({ useInstructorCourses: vi.fn() }));
vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return { ...actual, useQuery: vi.fn(), useMutation: vi.fn() };
});

vi.mock("@/portals/academy/pages/AcademyStudentDashboard", () => ({
  default: () => <div>student-dashboard-view</div>,
}));

vi.mock("@/portals/academy/pages/AcademyInstructorDashboard", () => ({
  default: () => <div>instructor-dashboard-view</div>,
}));

/** Render AcademyDashboard inside a router with a sentinel route for redirect verification */
function renderWithSentinel() {
  return render(
    <MemoryRouter initialEntries={["/academy/portal"]}>
      <Routes>
        <Route path="/academy/portal" element={<AcademyDashboard />} />
        <Route path="/instructor/workspace" element={<div>instructor-workspace-sentinel</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("AcademyDashboard router", () => {
  beforeEach(() => {
    resetAcademyTestMocks();
  });

  it("renders student dashboard for student role", () => {
    mockUseAuth.mockReturnValue({ roles: ["student"] } as any);
    renderWithSentinel();
    expect(screen.getByText("student-dashboard-view")).toBeInTheDocument();
  });

  it("redirects instructor-only user to /instructor/workspace", () => {
    mockUseAuth.mockReturnValue({ roles: ["instructor"] } as any);
    renderWithSentinel();
    // Positive proof: landed on canonical instructor workspace
    expect(screen.getByText("instructor-workspace-sentinel")).toBeInTheDocument();
    // Negative proof: student dashboard not rendered
    expect(screen.queryByText("student-dashboard-view")).not.toBeInTheDocument();
  });

  it("multi-role student+instructor still sees student dashboard", () => {
    mockUseAuth.mockReturnValue({ roles: ["student", "instructor"] } as any);
    renderWithSentinel();
    expect(screen.getByText("student-dashboard-view")).toBeInTheDocument();
    expect(screen.queryByText("instructor-workspace-sentinel")).not.toBeInTheDocument();
  });

  it("renders student dashboard for admin role (admin has student access)", () => {
    mockUseAuth.mockReturnValue({ roles: ["admin"] } as any);
    renderWithSentinel();
    expect(screen.getByText("student-dashboard-view")).toBeInTheDocument();
  });
});
