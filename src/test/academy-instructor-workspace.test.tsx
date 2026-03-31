import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import AcademyInstructorDashboard from "@/portals/academy/pages/AcademyInstructorDashboard";
import InstructorWorkspaceCourses from "@/portals/academy/pages/InstructorWorkspaceCourses";
import { mockUseAuth, mockUseInstructorCourses, renderAtPath, resetAcademyTestMocks, setAcademyQueryMap } from "./academy-test-utils";

vi.mock("@/contexts/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: vi.fn() }));
vi.mock("@/core/hooks", () => ({ useSearch: vi.fn() }));
vi.mock("@/portals/academy/hooks/useInstructorCourses", () => ({ useInstructorCourses: vi.fn() }));
vi.mock("@/portals/academy/hooks/useStudentEnrollments", () => ({ useStudentEnrollments: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: vi.fn() } }));
vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return { ...actual, useQuery: vi.fn(), useMutation: vi.fn() };
});

const instructorCourses = [
  {
    id: "course-1",
    title_en: "Systems Design Bootcamp",
    title_ar: "معسكر تصميم الأنظمة",
    slug: "systems-design-bootcamp",
    status: "published",
    total_lessons: 12,
    price_usd: 199,
    is_free: false,
    thumbnail_url: null,
    created_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "course-2",
    title_en: "QA Foundations",
    title_ar: "أساسيات ضمان الجودة",
    slug: "qa-foundations",
    status: "draft",
    total_lessons: 8,
    price_usd: 0,
    is_free: true,
    thumbnail_url: null,
    created_at: "2026-03-02T00:00:00Z",
  },
];

describe("Instructor workspace (renders via /instructor/workspace/*)", () => {
  beforeEach(() => {
    resetAcademyTestMocks();
    mockUseAuth.mockReturnValue({ roles: ["instructor"], user: { id: "inst-1" } } as any);
    mockUseInstructorCourses.mockReturnValue({ data: instructorCourses as any, isLoading: false } as any);
    setAcademyQueryMap({
      "academy-instructor-enrollments": {
        data: [
          { id: "en-1", course_id: "course-1", status: "active" },
          { id: "en-2", course_id: "course-1", status: "active" },
          { id: "en-3", course_id: "course-2", status: "completed" },
        ],
        isLoading: false,
      },
      "academy-instructor-payments": {
        data: [
          { amount_usd: 100, status: "paid" },
          { amount_usd: 150, status: "paid" },
        ],
        isLoading: false,
      },
      "academy-enroll-counts": {
        data: [{ course_id: "course-1" }, { course_id: "course-1" }, { course_id: "course-2" }],
        isLoading: false,
      },
    });
  });

  it("renders instructor stats, course list, and create course CTA", () => {
    renderAtPath(<AcademyInstructorDashboard />, "/instructor/workspace");

    expect(screen.getByText("Instructor Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Published Courses")).toBeInTheDocument();
    expect(screen.getByText("Total Students")).toBeInTheDocument();
    expect(screen.getByText("Revenue")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /new course/i })).toBeInTheDocument();
    expect(screen.getByText("Systems Design Bootcamp")).toBeInTheDocument();
  });

  it("renders instructor courses page with published and draft tabs", () => {
    renderAtPath(<InstructorWorkspaceCourses />, "/instructor/workspace/courses");

    expect(screen.getByText("My Courses")).toBeInTheDocument();
    expect(screen.getByText(/Published \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Draft \(1\)/)).toBeInTheDocument();
    expect(screen.getByText("Systems Design Bootcamp")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /edit/i }).length).toBeGreaterThan(0);
  });

  it("shows create-first-course empty state when the instructor has no courses", () => {
    mockUseInstructorCourses.mockReturnValue({ data: [], isLoading: false } as any);
    setAcademyQueryMap({ "academy-enroll-counts": { data: [], isLoading: false } });

    renderAtPath(<AcademyInstructorDashboard />, "/instructor/workspace");
    expect(screen.getByText(/Create your first course/i)).toBeInTheDocument();
  });
});
