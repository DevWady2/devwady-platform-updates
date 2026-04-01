import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import AcademyCourseCreate from "@/portals/academy/pages/AcademyCourseCreate";
import AcademySettings from "@/portals/academy/pages/AcademySettings";
import { mockUseAuth, mutationMutateMock, renderAtPath, resetAcademyTestMocks } from "./academy-test-utils";

vi.mock("@/core/hooks", () => ({ useSearch: vi.fn() }));
vi.mock("@/portals/academy/hooks/useStudentEnrollments", () => ({ useStudentEnrollments: vi.fn() }));
vi.mock("@/portals/academy/hooks/useInstructorCourses", () => ({ useInstructorCourses: vi.fn() }));
vi.mock("@tanstack/react-query", () => ({ useQuery: vi.fn(), useMutation: vi.fn(() => ({ mutateAsync: vi.fn() })) }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: vi.fn() } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("Instructor workspace create / shared settings pages", () => {
  beforeEach(() => {
    resetAcademyTestMocks();
  });

  it("keeps create course submit disabled until english title is provided", () => {
    mockUseAuth.mockReturnValue({ user: { id: "inst-1" } } as any);
    renderAtPath(<AcademyCourseCreate />, "/instructor/workspace/courses/new");

    const createButton = screen.getByRole("button", { name: /create course/i });
    expect(createButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Course Title \(English\)/i), { target: { value: "New Course" } });
    expect(createButton).not.toBeDisabled();
  });

  it("shows price input when the course is not free and triggers mutation on submit", () => {
    mockUseAuth.mockReturnValue({ user: { id: "inst-1" } } as any);
    renderAtPath(<AcademyCourseCreate />, "/instructor/workspace/courses/new");

    fireEvent.change(screen.getByLabelText(/Course Title \(English\)/i), { target: { value: "Architecture Fundamentals" } });
    fireEvent.click(screen.getByRole("switch"));

    expect(screen.getByLabelText(/Price \(USD\)/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Price \(USD\)/i), { target: { value: "120" } });
    fireEvent.click(screen.getByRole("button", { name: /create course/i }));
    expect(mutationMutateMock).toHaveBeenCalled();
  });

  it("shows instructor-specific settings links for instructors", () => {
    mockUseAuth.mockReturnValue({ accountType: "instructor", user: { id: "inst-1" } } as any);
    renderAtPath(<AcademySettings />, "/academy/portal/settings");

    expect(screen.getByText("Instructor Profile")).toBeInTheDocument();
    expect(screen.getByText("Course Management")).toBeInTheDocument();
    expect(screen.getByText("Notifications")).toBeInTheDocument();
  });

  it("hides instructor-specific settings links for students", () => {
    mockUseAuth.mockReturnValue({ accountType: "student", user: { id: "student-1" } } as any);
    renderAtPath(<AcademySettings />, "/academy/portal/settings");

    expect(screen.queryByText("Instructor Profile")).not.toBeInTheDocument();
    expect(screen.queryByText("Course Management")).not.toBeInTheDocument();
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Account & Security")).toBeInTheDocument();
  });
});
