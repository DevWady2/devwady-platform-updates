import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import AcademyCertificates from "@/portals/academy/pages/AcademyCertificates";
import { mockUseAuth, renderAtPath, resetAcademyTestMocks, setAcademyQueryMap } from "./academy-test-utils";

vi.mock("@/contexts/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: vi.fn() } }));

describe("AcademyCertificates", () => {
  beforeEach(() => {
    resetAcademyTestMocks();
    mockUseAuth.mockReturnValue({ roles: ["student"], user: { id: "student-1" } } as any);
  });

  it("shows empty state when there are no completed certificates", () => {
    setAcademyQueryMap({
      "academy-certificates": { data: [], isLoading: false },
    });

    renderAtPath(<AcademyCertificates />, "/academy/portal/certificates");
    expect(screen.getByText("No certificates yet")).toBeInTheDocument();
  });

  it("renders certificate cards with view and download actions", () => {
    setAcademyQueryMap({
      "academy-certificates": {
        data: [
          {
            id: "en-1",
            completed_at: "2026-03-10T10:00:00Z",
            certificate_url: "https://cdn.example.com/cert.pdf",
            training_courses: { title_en: "Advanced React", title_ar: "ريأكت متقدم", slug: "advanced-react" },
          },
        ],
        isLoading: false,
      },
    });

    renderAtPath(<AcademyCertificates />, "/academy/portal/certificates");
    expect(screen.getByText("Advanced React")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /view certificate/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /download/i })).toBeInTheDocument();
  });
});
