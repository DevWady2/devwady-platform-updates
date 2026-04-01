
import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EnterpriseRequests from "@/portals/enterprise/pages/EnterpriseRequests";
import EnterpriseProjects from "@/portals/enterprise/pages/EnterpriseProjects";
import { renderInRouter } from "./enterprise-test-utils";

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

describe("Enterprise list pages", () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
  });

  it("shows the requests empty state when the client has no submitted requests", () => {
    mockUseQuery.mockReturnValue({ data: [], isLoading: false });
    renderInRouter(<EnterpriseRequests />);

    expect(screen.getByText("No requests yet")).toBeInTheDocument();
    expect(screen.getByText("Submit your first service request to get started")).toBeInTheDocument();
  });

  it("filters enterprise projects by delivered status", async () => {
    mockUseQuery.mockReturnValue({
      data: [
        { id: "p1", title: "ERP Revamp", status: "planning", progress_pct: 25, start_date: "2026-03-01", total_budget_usd: 12000 },
        { id: "p2", title: "Support Retainer", status: "completed", progress_pct: 100, start_date: "2026-02-01", total_budget_usd: 5000 },
      ],
      isLoading: false,
    });

    renderInRouter(<EnterpriseProjects />);

    expect(screen.getByText("ERP Revamp")).toBeInTheDocument();
    expect(screen.getByText("Support Retainer")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: /delivered/i }));

    expect(screen.queryByText("ERP Revamp")).not.toBeInTheDocument();
    expect(screen.getByText("Support Retainer")).toBeInTheDocument();
  });
});
