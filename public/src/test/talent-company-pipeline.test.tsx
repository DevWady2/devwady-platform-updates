import { describe, it, expect, beforeEach, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { mockUseMutation, navigateMock, renderAtPath, renderWithRoute, resetTalentTestMocks, setTalentQueryMap } from "./talent-test-utils";
import TalentCompanyJobDetail from "@/portals/talent/pages/TalentCompanyJobDetail";
import TalentCompanyBrowse from "@/portals/talent/pages/TalentCompanyBrowse";
import TalentCompanyShortlists from "@/portals/talent/pages/TalentCompanyShortlists";
import TalentCompanyHires from "@/portals/talent/pages/TalentCompanyHires";
import TalentCompanyTeam from "@/portals/talent/pages/TalentCompanyTeam";

describe("Talent company pipeline pages", () => {
  beforeEach(() => {
    resetTalentTestMocks();
  });

  it("renders a job detail page with applicant cards", () => {
    setTalentQueryMap({
      "talent-job": { data: { id: "job-1", title: "Frontend Engineer", title_ar: null, type: "full-time", location: "Remote", salary_range: "$4k", is_active: true, description: "Build product interfaces" }, isLoading: false },
      "talent-job-applicants": { data: [{ id: "app-1", status: "pending", applicant_email: "person@example.com", created_at: "2026-03-21T10:00:00Z", profiles: { full_name: "Ali Hassan", location: "Cairo", skills: ["React", "TypeScript"] } }], isLoading: false },
    });
    mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false } as any);

    renderWithRoute(<TalentCompanyJobDetail />, "/talent/portal/company/jobs/job-1", "/talent/portal/company/jobs/:id");

    expect(screen.getByText("Frontend Engineer")).toBeInTheDocument();
    expect(screen.getByText(/Applicants \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText("Ali Hassan")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("shows a not-found state when the company job does not exist", () => {
    setTalentQueryMap({
      "talent-job": { data: null, isLoading: false },
      "talent-job-applicants": { data: [], isLoading: false },
    });

    renderWithRoute(<TalentCompanyJobDetail />, "/talent/portal/company/jobs/missing", "/talent/portal/company/jobs/:id");

    expect(screen.getByText(/Job not found/i)).toBeInTheDocument();
  });

  it("renders talent browse results and allows shortlist toggling", () => {
    const mutate = vi.fn();
    mockUseMutation.mockReturnValue({ mutate, isPending: false } as any);
    setTalentQueryMap({
      "talent-browse-pool": { data: [{ id: "profile-1", user_id: "freelancer-1", full_name: "Mina George", location: "Alexandria", rating: 4.8, bio: "Frontend specialist", skills: ["React", "Next.js"], hourly_rate: 25, is_available: true }], isLoading: false },
      "talent-shortlist-ids": { data: [], isLoading: false },
    });

    renderAtPath(<TalentCompanyBrowse />, "/talent/portal/company/browse");

    expect(screen.getByText("Mina George")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));
    expect(mutate).toHaveBeenCalledWith("freelancer-1");
  });

  it("shows shortlist empty-state action and internal hire/team pages", () => {
    setTalentQueryMap({
      "talent-shortlists-full": { data: [], isLoading: false },
    });

    renderAtPath(<TalentCompanyShortlists />, "/talent/portal/company/shortlists");
    fireEvent.click(screen.getByRole("button", { name: /Browse Talent/i }));
    expect(navigateMock).toHaveBeenCalledWith("/talent/portal/company/browse");

    setTalentQueryMap({
      "talent-company-profile": { data: { id: "company-1", company_name: "DevWady Labs" }, isLoading: false },
      "talent-hire-requests": { data: [{ id: "hire-1", title: "QA Contract", status: "pending", created_at: "2026-03-20T10:00:00Z", profiles: { full_name: "Sara Nabil" }, budget_range: "$2k", duration: "3 months" }], isLoading: false },
    });
    renderAtPath(<TalentCompanyHires />, "/talent/portal/company/hires");
    expect(screen.getByText("QA Contract")).toBeInTheDocument();

    setTalentQueryMap({
      "talent-team": { data: [{ id: "tm-1", role: "manager", accepted_at: "2026-03-20T10:00:00Z", profiles: { full_name: "Kareem Adel" } }], isLoading: false },
    });
    renderAtPath(<TalentCompanyTeam />, "/talent/portal/company/team");
    expect(screen.getByText("Kareem Adel")).toBeInTheDocument();
    expect(screen.getByText("Manager")).toBeInTheDocument();
  });
});
