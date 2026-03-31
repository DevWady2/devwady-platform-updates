
import { describe, it, expect, beforeEach, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { mockUseAuth, mockUseMutation, navigateMock, renderAtPath, renderWithRoute, resetTalentTestMocks, setTalentQueryMap } from "./talent-test-utils";
import TalentFreelancerJobView from "@/portals/talent/pages/TalentFreelancerJobView";
import TalentFreelancerApplications from "@/portals/talent/pages/TalentFreelancerApplications";

describe("Talent freelancer application flow", () => {
  beforeEach(() => {
    resetTalentTestMocks();
  });

  it("shows a sign-in prompt on job detail when the user is not authenticated", () => {
    mockUseAuth.mockReturnValue({ user: null, roles: [], loading: false } as any);
    setTalentQueryMap({
      "talent-job-public": { data: { id: "job-1", title: "Backend Engineer", type: "contract", location: "Remote", created_at: "2026-03-22T10:00:00Z" }, isLoading: false },
      "talent-my-app": { data: null, isLoading: false },
    });

    renderWithRoute(<TalentFreelancerJobView />, "/talent/portal/freelancer/jobs/job-1", "/talent/portal/freelancer/jobs/:id");

    expect(screen.getByText(/Sign in to apply/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Sign In/i })).toHaveAttribute("href", "/login?redirect=/talent/portal/freelancer/jobs/job-1");
  });

  it("shows applied state when an existing application is found", () => {
    setTalentQueryMap({
      "talent-job-public": { data: { id: "job-1", title: "Backend Engineer", type: "contract", location: "Remote", created_at: "2026-03-22T10:00:00Z" }, isLoading: false },
      "talent-my-app": { data: { id: "app-1", status: "reviewing" }, isLoading: false },
    });

    renderWithRoute(<TalentFreelancerJobView />, "/talent/portal/freelancer/jobs/job-1", "/talent/portal/freelancer/jobs/:id");

    expect(screen.getByText(/You've applied to this job/i)).toBeInTheDocument();
    expect(screen.getByText(/Status: Reviewing/i)).toBeInTheDocument();
  });

  it("renders the apply form and submits through the existing mutation", () => {
    const mutate = vi.fn();
    mockUseMutation.mockReturnValue({ mutate, isPending: false } as any);
    setTalentQueryMap({
      "talent-job-public": { data: { id: "job-1", title: "Backend Engineer", type: "contract", location: "Remote", description: "API and services", created_at: "2026-03-22T10:00:00Z", requirements: ["Laravel"], tags: ["PHP"] }, isLoading: false },
      "talent-my-app": { data: null, isLoading: false },
    });

    renderWithRoute(<TalentFreelancerJobView />, "/talent/portal/freelancer/jobs/job-1", "/talent/portal/freelancer/jobs/:id");

    fireEvent.change(screen.getByPlaceholderText(/Why you're a great fit for this role/i), { target: { value: "I have shipped similar products." } });
    fireEvent.click(screen.getByRole("button", { name: /Submit Application/i }));
    expect(mutate).toHaveBeenCalled();
  });

  it("shows freelancer applications list", () => {
    setTalentQueryMap({
      "talent-freelancer-all-applications": { data: [{ id: "app-1", status: "pending", created_at: "2026-03-20T10:00:00Z", cover_note: "Excited", job_postings: { title: "React Engineer", type: "full-time", location: "Remote" } }], isLoading: false },
    });

    renderAtPath(<TalentFreelancerApplications />, "/talent/portal/freelancer/applications");
    expect(screen.getByText("My Applications")).toBeInTheDocument();
    expect(screen.getByText("React Engineer")).toBeInTheDocument();
  });

  it("shows the freelancer applications empty-state browse action", () => {
    setTalentQueryMap({ "talent-freelancer-all-applications": { data: [], isLoading: false } });
    renderAtPath(<TalentFreelancerApplications />, "/talent/portal/freelancer/applications");
    fireEvent.click(screen.getByRole("button", { name: /Browse Jobs/i }));
    expect(navigateMock).toHaveBeenCalledWith("/talent/portal/freelancer/jobs");
  });
});
