
import { describe, it, expect, beforeEach, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { mockUseMutation, mockUseSearch, renderAtPath, resetTalentTestMocks, setTalentQueryMap } from "./talent-test-utils";

vi.mock("@/portals/talent/components/JobPostDialog", () => ({
  default: ({ open }: { open: boolean }) => open ? <div>JobPostDialog Open</div> : null,
}));

import TalentCompanyJobs from "@/portals/talent/pages/TalentCompanyJobs";
import TalentCompanyApplications from "@/portals/talent/pages/TalentCompanyApplications";

describe("Talent company jobs and applications", () => {
  beforeEach(() => {
    resetTalentTestMocks();
  });

  it("opens the post-job dialog and renders company job listings", () => {
    const mutate = vi.fn();
    mockUseMutation.mockReturnValue({ mutate, isPending: false } as any);
    setTalentQueryMap({
      "talent-company-jobs": {
        data: [
          { id: "job-1", title: "Frontend Engineer", type: "full-time", location: "Remote", salary_range: "$4k", is_active: true, is_urgent: true, created_at: "2026-03-20T10:00:00Z" },
        ],
        isLoading: false,
      },
    });

    renderAtPath(<TalentCompanyJobs />, "/talent/portal/company/jobs");

    expect(screen.getByText("Frontend Engineer")).toBeInTheDocument();
    expect(screen.getByText("Urgent")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Post Job/i }));
    expect(screen.getByText("JobPostDialog Open")).toBeInTheDocument();
  });

  it("shows company applications with status buckets and candidate names", () => {
    mockUseSearch.mockReturnValue({
      params: { query: "" },
      setQuery: vi.fn(),
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

    setTalentQueryMap({
      "talent-all-company-applications": {
        data: [
          {
            id: "app-1",
            status: "pending",
            applicant_email: "ahmed@example.com",
            created_at: "2026-03-20T10:00:00Z",
            job_id: "job-1",
            profiles: { full_name: "Ahmed Salah" },
            job_postings: { title: "Frontend Engineer" },
          },
          {
            id: "app-2",
            status: "accepted",
            applicant_email: "mona@example.com",
            created_at: "2026-03-21T10:00:00Z",
            job_id: "job-2",
            profiles: { full_name: "Mona Adel" },
            job_postings: { title: "QA Engineer" },
          },
        ],
        isLoading: false,
      },
    });

    renderAtPath(<TalentCompanyApplications />, "/talent/portal/company/applications");

    expect(screen.getByText("All Applications")).toBeInTheDocument();
    expect(screen.getByText(/All \(2\)/i)).toBeInTheDocument();
    expect(screen.getByText(/New \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText("Ahmed Salah")).toBeInTheDocument();
    expect(screen.getByText("Mona Adel")).toBeInTheDocument();
    expect(screen.getAllByText(/View/i).length).toBeGreaterThan(0);
  });
});
