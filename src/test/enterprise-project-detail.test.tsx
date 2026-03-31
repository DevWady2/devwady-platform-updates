
import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EnterpriseProjectDetail from "@/portals/enterprise/pages/EnterpriseProjectDetail";
import { renderAtPath } from "./enterprise-test-utils";

const { mockUseQuery } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: mockUseQuery,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ lang: "en" }),
}));

describe("EnterpriseProjectDetail", () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
  });

  it("renders the project timeline, updates, and billing summary", async () => {
    mockUseQuery
      .mockReturnValueOnce({
        data: {
          id: "p1",
          title: "ERP Platform",
          description: "Enterprise rollout",
          status: "review",
          progress_pct: 80,
          total_budget_usd: 15000,
          paid_usd: 9000,
          start_date: "2026-03-01",
          target_end_date: "2026-05-01",
        },
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: [
          {
            id: "u1",
            type: "deliverable",
            title: "Sprint 2 Demo Uploaded",
            body: "Review the attached build.",
            attachments: ["https://example.com/demo.pdf"],
            created_at: "2026-03-22T00:00:00Z",
          },
        ],
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: [
          { id: "pay-1", status: "paid", description: "Milestone 1", amount_usd: 5000, created_at: "2026-03-15T00:00:00Z" },
          { id: "pay-2", status: "pending", description: "Milestone 2", amount_usd: 4000, created_at: "2026-03-20T00:00:00Z" },
        ],
        isLoading: false,
      });

    renderAtPath(<EnterpriseProjectDetail />, "/enterprise/portal/projects/p1", "/enterprise/portal/projects/:id");

    expect(screen.getByText("ERP Platform")).toBeInTheDocument();
    expect(screen.getByText("Planning")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getAllByText("Review").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("80%" )).toBeInTheDocument();
    expect(screen.getByText("Sprint 2 Demo Uploaded")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /attachment 1/i })).toHaveAttribute("href", "https://example.com/demo.pdf");

    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: /billing/i }));
    expect(screen.getAllByText("$15,000")[0]).toBeInTheDocument();
    expect(screen.getByText("$9,000")).toBeInTheDocument();
    expect(screen.getByText("$6,000")).toBeInTheDocument();
    expect(screen.getByText("Milestone 1")).toBeInTheDocument();
  });

  it("shows the not found state when the project is missing", () => {
    mockUseQuery
      .mockReturnValueOnce({ data: null, isLoading: false })
      .mockReturnValueOnce({ data: [], isLoading: false })
      .mockReturnValueOnce({ data: [], isLoading: false });

    renderAtPath(<EnterpriseProjectDetail />, "/enterprise/portal/projects/missing", "/enterprise/portal/projects/:id");

    expect(screen.getByText("Project not found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back/i })).toHaveAttribute("href", "/enterprise/portal/projects");
  });
});
