

import { describe, expect, it, beforeEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderAtPath } from "./backoffice-test-utils";

vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: () => ({ lang: "en" }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

vi.mock("@/core/components", () => ({
  PageHeader: ({ title_en, description_en }: any) => (<header><h1>{title_en}</h1><p>{description_en}</p></header>),
  StatCardGrid: ({ stats }: any) => (
    <section>
      {stats.map((s: any) => <div key={s.label_en}><span>{s.label_en}</span><strong>{String(s.value)}</strong></div>)}
    </section>
  ),
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="chart-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar-series" />,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

vi.mock("@tanstack/react-query", () => ({ useQuery: vi.fn() }));
const { useQuery } = await import("@tanstack/react-query");
const useQueryMock = vi.mocked(useQuery);
const { default: BackofficeAnalytics } = await import("@/portals/backoffice/pages/BackofficeAnalytics");

function mockAnalyticsQueries(overrides: Record<string, any> = {}) {
  useQueryMock.mockImplementation(({ queryKey }: any) => {
    const key = Array.isArray(queryKey) ? queryKey.join(":") : String(queryKey);
    const dataMap: Record<string, any> = {
      "bo-analytics-chart-views": [
        { created_at: "2026-03-20T00:00:00Z" },
        { created_at: "2026-03-20T04:00:00Z" },
        { created_at: "2026-03-21T00:00:00Z" },
      ],
      "bo-analytics-total-views": 320,
      "bo-analytics-payments": { total: 5400, count: 9 },
      "bo-analytics-new-users": 27,
      ...overrides,
    };
    return { data: dataMap[key], isLoading: false } as any;
  });
}

describe("BackofficeAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAnalyticsQueries();
  });

  it("renders analytics stats and chart container", () => {
    renderAtPath(<BackofficeAnalytics />, "/admin/analytics", "/admin/analytics");

    expect(screen.getByRole("heading", { name: /Analytics & Reports/i })).toBeInTheDocument();
    expect(screen.getByText(/Page Views \(30d\)/i)).toBeInTheDocument();
    expect(screen.getByText("320")).toBeInTheDocument();
    expect(screen.getByText(/New Users \(30d\)/i)).toBeInTheDocument();
    expect(screen.getByText("27")).toBeInTheDocument();
    expect(screen.getByText(/Revenue \(30d\)/i)).toBeInTheDocument();
    expect(screen.getByText("$5,400")).toBeInTheDocument();
    expect(screen.getByTestId("chart-container")).toBeInTheDocument();
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("renders report placeholders for future analytics modules", () => {
    renderAtPath(<BackofficeAnalytics />, "/admin/analytics", "/admin/analytics");
    expect(screen.getByText(/User Growth Report/i)).toBeInTheDocument();
    expect(screen.getByText(/Revenue Breakdown/i)).toBeInTheDocument();
    expect(screen.getByText(/Conversion Funnel/i)).toBeInTheDocument();
    expect(screen.getByText(/Content Performance/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Coming soon/i).length).toBeGreaterThanOrEqual(4);
  });
});
