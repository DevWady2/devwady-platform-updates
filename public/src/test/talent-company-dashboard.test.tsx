
import { describe, it, expect, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderAtPath, resetTalentTestMocks, setTalentQueryMap } from "./talent-test-utils";
import TalentCompanyDashboard from "@/portals/talent/pages/TalentCompanyDashboard";

describe("TalentCompanyDashboard", () => {
  beforeEach(() => {
    resetTalentTestMocks();
  });

  it("renders company stats, active jobs, and hire request summary", () => {
    setTalentQueryMap({
      "talent-company-profile": { data: { id: "company-1", company_name: "DevWady Labs" }, isLoading: false },
      "talent-company-jobs": { data: [
        { id: "job-1", title: "Senior Backend Engineer", type: "full-time", location: "Remote", is_active: true, is_urgent: true },
        { id: "job-2", title: "QA Engineer", type: "contract", location: "Cairo", is_active: false, is_urgent: false },
      ], isLoading: false },
      "talent-company-apps": { data: [
        { id: "app-1", applicant_email: "candidate@example.com", status: "pending", created_at: "2026-03-20T10:00:00Z" },
      ], isLoading: false },
      "talent-company-shortlists": { data: [{ id: "s-1" }], isLoading: false },
      "talent-company-hires": { data: [{ id: "h-1", title: "Mobile Squad", status: "accepted", created_at: "2026-03-21T10:00:00Z" }], isLoading: false },
    });

    renderAtPath(<TalentCompanyDashboard />, "/talent/portal/company");

    expect(screen.getByText(/DevWady Labs — Talent/i)).toBeInTheDocument();
    expect(screen.getByText("Active Jobs")).toBeInTheDocument();
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Senior Backend Engineer")).toBeInTheDocument();
    expect(screen.getByText("Recent Applications")).toBeInTheDocument();
    expect(screen.getByText("candidate@example.com")).toBeInTheDocument();
    expect(screen.getByText("Hire Requests")).toBeInTheDocument();
    expect(screen.getByText("Mobile Squad")).toBeInTheDocument();
  });

  it("shows the empty job state when no active jobs exist", () => {
    setTalentQueryMap({
      "talent-company-profile": { data: { id: "company-1", company_name: "DevWady Labs" }, isLoading: false },
      "talent-company-jobs": { data: [], isLoading: false },
      "talent-company-apps": { data: [], isLoading: false },
      "talent-company-shortlists": { data: [], isLoading: false },
      "talent-company-hires": { data: [], isLoading: false },
    });

    renderAtPath(<TalentCompanyDashboard />, "/talent/portal/company");

    expect(screen.getByText(/Post your first position to start building your talent pipeline/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Post Job/i).length).toBeGreaterThan(0);
  });
});
