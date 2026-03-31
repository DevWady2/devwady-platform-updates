
import { describe, it, expect, beforeEach, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { mockUseSearch, renderAtPath, resetTalentTestMocks, setTalentQueryMap } from "./talent-test-utils";
import TalentFreelancerDashboard from "@/portals/talent/pages/TalentFreelancerDashboard";
import TalentFreelancerJobs from "@/portals/talent/pages/TalentFreelancerJobs";

describe("Talent freelancer dashboard and jobs", () => {
  beforeEach(() => {
    resetTalentTestMocks();
  });

  it("renders freelancer dashboard stats, profile block, and recent applications", () => {
    setTalentQueryMap({
      "talent-freelancer-applications": { data: [
        { id: "app-1", status: "pending", created_at: "2026-03-20T10:00:00Z", job_postings: { title: "Frontend Engineer" } },
        { id: "app-2", status: "interview", created_at: "2026-03-21T10:00:00Z", job_postings: { title: "QA Engineer" } },
      ], isLoading: false },
      "talent-freelancer-shortlisted": { data: [{ id: "s-1" }, { id: "s-2" }], isLoading: false },
      "talent-freelancer-profile": { data: { full_name: "Omar Tarek", skills: ["React", "Node.js"], is_available: true }, isLoading: false },
    });

    renderAtPath(<TalentFreelancerDashboard />, "/talent/portal/freelancer");

    expect(screen.getByText(/Welcome, Omar Tarek/i)).toBeInTheDocument();
    expect(screen.getByText("Applications")).toBeInTheDocument();
    expect(screen.getByText("Frontend Engineer")).toBeInTheDocument();
    expect(screen.getByText("Companies Interested")).toBeInTheDocument();
    expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId("activity-feed")).toBeInTheDocument();
  });

  it("renders job browsing results and updates the search input", () => {
    const setQuery = vi.fn();
    mockUseSearch.mockReturnValue({
      params: { query: "React" },
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

    setTalentQueryMap({
      "talent-public-jobs": { data: [{ id: "job-1", title: "React Engineer", type: "full-time", location: "Remote", salary_range: "$5k", is_urgent: true, tags: ["React", "TypeScript"], created_at: "2026-03-22T10:00:00Z" }], isLoading: false },
    });

    renderAtPath(<TalentFreelancerJobs />, "/talent/portal/freelancer/jobs");

    expect(screen.getByText("React Engineer")).toBeInTheDocument();
    expect(screen.getByText("Urgent")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("search"), { target: { value: "Node" } });
    expect(setQuery).toHaveBeenCalledWith("Node");
  });

  it("shows the no-jobs empty state when there are no available jobs", () => {
    setTalentQueryMap({ "talent-public-jobs": { data: [], isLoading: false } });
    renderAtPath(<TalentFreelancerJobs />, "/talent/portal/freelancer/jobs");
    expect(screen.getByText(/No jobs available/i)).toBeInTheDocument();
  });
});
