
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

vi.mock("@/core/components", () => ({
  PageHeader: ({ title_en, title_ar, description_en, description_ar, actions }: any) => (
    <header>
      <h1>{title_en ?? title_ar}</h1>
      {(description_en || description_ar) && <p>{description_en ?? description_ar}</p>}
      {actions}
    </header>
  ),
  StatCardGrid: ({ stats }: any) => (
    <section data-testid="stat-grid">
      {stats.map((s: any) => (
        <div key={s.label_en ?? s.label_ar}>
          <span>{s.label_en ?? s.label_ar}</span>
          <strong>{String(s.value)}</strong>
        </div>
      ))}
    </section>
  ),
  FocusBlock: ({ title_en, title_ar, action_en, action_ar, actionHref, subtitle_en, subtitle_ar }: any) => (
    <div data-testid="focus-block">
      <span>{title_en ?? title_ar}</span>
      {(subtitle_en || subtitle_ar) && <p>{subtitle_en ?? subtitle_ar}</p>}
      <a href={actionHref}>{action_en ?? action_ar}</a>
    </div>
  ),
  ActivityFeed: () => <div data-testid="activity-feed">activity</div>,
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
          { id: "q1", quote_number: "Q-001", title: "Discovery Workshop", status: "sent", total_usd: 2500, created_at: "2026-03-22T00:00:00Z" },
          { id: "q2", quote_number: "Q-002", title: "QA Audit", status: "approved", total_usd: 5000, created_at: "2026-03-18T00:00:00Z" },
        ],
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: { id: "cp-1", company_name: "Acme Corp", logo_url: null, industry: "tech" },
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: { full_name: "John Doe" },
        isLoading: false,
      });

    renderInRouter(<EnterpriseDashboard />);

    expect(screen.getByText("Acme Corp Dashboard")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /new request/i })).toHaveAttribute("href", "/enterprise/portal/requests/new");

    expect(screen.getAllByText(/^1$/).length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText("Quote Q-001 — $2500")).toBeInTheDocument();

    expect(screen.getByText("ERP Platform")).toBeInTheDocument();
    expect(screen.getByText("Discovery Workshop")).toBeInTheDocument();
  });
});
