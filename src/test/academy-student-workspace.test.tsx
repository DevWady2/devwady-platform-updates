import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import AcademyStudentDashboard from "@/portals/academy/pages/AcademyStudentDashboard";
import AcademyCourses from "@/portals/academy/pages/AcademyCourses";
import AcademyProgress from "@/portals/academy/pages/AcademyProgress";
import { mockUseAuth, mockUseStudentEnrollments, renderAtPath, resetAcademyTestMocks } from "./academy-test-utils";

vi.mock("@/contexts/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal() as any;
  return { ...actual, useQuery: vi.fn(), useMutation: vi.fn() };
});
vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: vi.fn() }));
vi.mock("@/portals/academy/hooks/useStudentEnrollments", () => ({ useStudentEnrollments: vi.fn() }));
vi.mock("@/core/hooks", () => ({ useSearch: vi.fn() }));
vi.mock("@/portals/academy/hooks/useInstructorCourses", () => ({ useInstructorCourses: vi.fn() }));
vi.mock("@/features/academy/talentBridge", async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    useMyTalentProfile: () => ({ data: null, isLoading: false }),
    useOpportunityHints: () => ({ summary: null, opportunityCount: 0 }),
  };
});

const studentEnrollments = [
  {
    id: "en-1",
    status: "active",
    completed_at: null,
    certificate_url: null,
    training_courses: {
      title_en: "Advanced React",
      title_ar: "ريأكت متقدم",
      slug: "advanced-react",
      thumbnail_url: null,
      total_lessons: 10,
      duration_en: "8 weeks",
    },
  },
  {
    id: "en-2",
    status: "completed",
    completed_at: "2026-03-10T10:00:00Z",
    certificate_url: "https://cdn.example.com/cert.pdf",
    training_courses: {
      title_en: "Testing Fundamentals",
      title_ar: "أساسيات الاختبار",
      slug: "testing-fundamentals",
      thumbnail_url: null,
      total_lessons: 6,
      duration_en: "4 weeks",
    },
  },
];

describe("Academy student workspace", () => {
  beforeEach(() => {
    resetAcademyTestMocks();
    mockUseAuth.mockReturnValue({
      accountType: "student",
      user: { id: "student-1" },
    } as any);
    mockUseStudentEnrollments.mockReturnValue({
      enrollments: studentEnrollments as any,
      progressData: [
        { enrollment_id: "en-1", is_completed: true, last_accessed_at: "2026-03-22T08:00:00Z" },
        { enrollment_id: "en-1", is_completed: true, last_accessed_at: "2026-03-23T09:00:00Z" },
      ],
      isLoading: false,
      getProgress: (id: string) => (id === "en-1" ? 20 : 100),
    } as any);
  });

  it("renders active courses, stats, and browse action on student dashboard", () => {
    renderAtPath(<AcademyStudentDashboard />, "/academy/portal");

    expect(screen.getByText("My Learning")).toBeInTheDocument();
    expect(screen.getByText("Browse Courses")).toBeInTheDocument();
    expect(screen.getAllByText("Active Courses").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Advanced React").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("My Certificates")).toBeInTheDocument();
    expect(screen.getByText("Testing Fundamentals")).toBeInTheDocument();
  });

  it("shows the student course list with active and completed tabs", () => {
    renderAtPath(<AcademyCourses />, "/academy/portal/courses");

    expect(screen.getByText("My Courses")).toBeInTheDocument();
    expect(screen.getByText(/Active \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Completed \(1\)/)).toBeInTheDocument();
    expect(screen.getByText("Advanced React")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /continue/i }).length).toBeGreaterThanOrEqual(1);
  });

  it("renders overall progress and per-course progress details", () => {
    renderAtPath(<AcademyProgress />, "/academy/portal/progress");

    expect(screen.getByText("Learning Progress")).toBeInTheDocument();
    expect(screen.getByText("Overall Progress")).toBeInTheDocument();
    expect(screen.getByText("Advanced React")).toBeInTheDocument();
    expect(screen.getByText(/2\/10/)).toBeInTheDocument();
    // Talent Bridge status card is present
    expect(screen.getByText("Talent Profile")).toBeInTheDocument();
  });

  it("shows empty states when the student has no enrollments", () => {
    mockUseStudentEnrollments.mockReturnValue({
      enrollments: [],
      progressData: [],
      isLoading: false,
      getProgress: () => 0,
    } as any);

    renderAtPath(<AcademyStudentDashboard />, "/academy/portal");
    expect(screen.queryByText("Advanced React")).not.toBeInTheDocument();

    renderAtPath(<AcademyProgress />, "/academy/portal/progress");
    expect(screen.getAllByText("No active courses").length).toBeGreaterThanOrEqual(1);
  });
});
