
import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import EnterpriseDashboard from "@/portals/enterprise/pages/EnterpriseDashboard";
import { renderInRouter } from "./enterprise-test-utils";

const { mockUseQuery } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: mockUseQuery,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1", email: "company@devwady.com" } }),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ lang: "en" }),
}));

vi.mock("@/core/components/ActivityFeed", () => ({
  default: () => <div data-testid="activity-feed">activity</div>,
}));

describe("EnterpriseDashboard", () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
  });

  it("renders key enterprise stats and action links from existing query results", () => {
    mockUseQuery
      .mockReturnValueOnce({
        data: [
          { id: "p1", title: "ERP Platform", status: "in_progress", progress_pct: 70, created_at: "2026-03-20T00:00:00Z" },
          { id: "p2", title: "Legacy Migration", status: "completed", progress_pct: 100, created_at: "2026-03-10T00:00:00Z" },
        ],
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: [
          { id: "r1", title: "Discovery Workshop", status: "new", service_type: "consulting", created_at: "2026-03-21T00:00:00Z" },
          { id: "r2", title: "QA Audit", status: "quoted", service_type: "qa_testing", created_at: "2026-03-19T00:00:00Z" },
        ],
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: [
          { id: "q1", status: "sent", total_usd: 2500, created_at: "2026-03-22T00:00:00Z" },
          { id: "q2", status: "approved", total_usd: 5000, created_at: "2026-03-18T00:00:00Z" },
        ],
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: [
          { id: "pay-1", status: "paid", amount_usd: 3000 },
          { id: "pay-2", status: "pending", amount_usd: 750 },
        ],
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: { id: "cp-1", company_name: "Acme Corp", logo_url: null, industry: "tech" },
      })
      .mockReturnValueOnce({
        data: { full_name: "John Doe" },
      });

    renderInRouter(<EnterpriseDashboard />);

    expect(screen.getByText("Acme Corp Dashboard")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /new request/i })).toHaveAttribute("href", "/enterprise/portal/requests/new");

    expect(screen.getAllByText(/^1$/).length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText("$3,000")).toBeInTheDocument();

    expect(screen.getByText("ERP Platform")).toBeInTheDocument();
    expect(screen.getByText("Discovery Workshop")).toBeInTheDocument();
  });
});
