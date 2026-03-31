import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import AcademyLessons from "@/portals/academy/pages/AcademyLessons";
import AcademyStudents from "@/portals/academy/pages/AcademyStudents";
import AcademyEarnings from "@/portals/academy/pages/AcademyEarnings";
import {
  downloadCSVMock,
  mockUseAuth,
  mockUseInstructorCourses,
  mockUseSearch,
  renderAtPath,
  resetAcademyTestMocks,
  setAcademyQueryMap,
} from "./academy-test-utils";

vi.mock("@/contexts/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: vi.fn() }));
vi.mock("@/portals/academy/hooks/useInstructorCourses", () => ({ useInstructorCourses: vi.fn() }));
vi.mock("@/core/hooks", () => ({ useSearch: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: vi.fn() } }));
vi.mock("@/lib/csvExport", () => ({ downloadCSV: (...args: any[]) => (vi as any).__downloadCSV?.(...args) }));

describe("Instructor workspace teaching management pages", () => {
  beforeEach(() => {
    resetAcademyTestMocks();
    mockUseAuth.mockReturnValue({ roles: ["instructor"], user: { id: "inst-1" } } as any);
    mockUseInstructorCourses.mockReturnValue({
      data: [
        { id: "course-1", title_en: "Systems Design Bootcamp", title_ar: "معسكر تصميم الأنظمة", total_lessons: 2 },
        { id: "course-2", title_en: "QA Foundations", title_ar: "أساسيات ضمان الجودة", total_lessons: 1 },
      ],
      isLoading: false,
    } as any);
    setAcademyQueryMap({
      "academy-course-modules": {
        data: [{ id: "mod-1", course_id: "course-1", title_en: "Module One", title_ar: "الوحدة الأولى" }],
        isLoading: false,
      },
      "academy-course-lessons": {
        data: [
          { id: "lesson-1", course_id: "course-1", module_id: "mod-1", title_en: "Lesson One", title_ar: "الدرس الأول", content_type: "video", is_preview: true, is_published: true },
          { id: "lesson-2", course_id: "course-1", module_id: "mod-1", title_en: "Lesson Two", title_ar: "الدرس الثاني", content_type: "text", is_preview: false, is_published: false },
        ],
        isLoading: false,
      },
      "academy-instructor-students": {
        data: [
          { id: "en-1", user_id: "student-1", course_id: "course-1", status: "active", enrolled_at: "2026-03-01T00:00:00Z" },
          { id: "en-2", user_id: "student-2", course_id: "course-2", status: "completed", enrolled_at: "2026-03-02T00:00:00Z" },
        ],
        isLoading: false,
      },
      "academy-student-profiles": {
        data: [
          { user_id: "student-1", full_name: "Amina Ali", avatar_url: null },
          { user_id: "student-2", full_name: "Omar Hassan", avatar_url: null },
        ],
        isLoading: false,
      },
      "academy-earn-payments": {
        data: [
          { id: "pay-1", amount_usd: 200, paid_at: "2026-03-10T00:00:00Z", created_at: "2026-03-10T00:00:00Z", reference_id: "course-1" },
          { id: "pay-2", amount_usd: 150, paid_at: "2026-03-15T00:00:00Z", created_at: "2026-03-15T00:00:00Z", reference_id: "course-2" },
        ],
        isLoading: false,
      },
    });
  });

  it("renders lesson management with course selector and lessons grouped by module", () => {
    renderAtPath(<AcademyLessons />, "/instructor/workspace/lessons");

    expect(screen.getByText("Lesson Management")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Systems Design Bootcamp/i })).toBeInTheDocument();
    expect(screen.getByText("Module One")).toBeInTheDocument();
    expect(screen.getByText("Lesson One")).toBeInTheDocument();
    expect(screen.getByText("Preview")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it("renders students list and supports search updates", () => {
    const setQuery = vi.fn();
    mockUseSearch.mockReturnValue({
      params: { query: "" },
      setQuery,
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

    renderAtPath(<AcademyStudents />, "/instructor/workspace/students");

    expect(screen.getByText("My Students")).toBeInTheDocument();
    expect(screen.getByText("Amina Ali")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("search"), { target: { value: "Omar" } });
    expect(setQuery).toHaveBeenCalledWith("Omar");
  });

  it("renders earnings chart and exports CSV", () => {
    renderAtPath(<AcademyEarnings />, "/instructor/workspace/earnings");

    expect(screen.getByText("Earnings")).toBeInTheDocument();
    expect(screen.getByText("Total Earnings")).toBeInTheDocument();
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /export csv/i }));
    expect(downloadCSVMock).toHaveBeenCalled();
  });
});
