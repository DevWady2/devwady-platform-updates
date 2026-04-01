

import { describe, expect, it, beforeEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderAtPath } from "./backoffice-test-utils";

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ lang: "en", isAr: false }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

vi.mock("@/core/components", () => ({
  PageHeader: ({ title_en, title_ar, description_en, description_ar }: any) => (
    <header>
      <h1>{title_en ?? title_ar}</h1>
      <p>{description_en ?? description_ar}</p>
    </header>
  ),
  StatCardGrid: ({ stats, loading }: any) => (
    <section data-testid="stat-grid" data-loading={String(loading)}>
      {stats.map((s: any) => (
        <div key={s.label_en ?? s.label_ar}>
          <span>{s.label_en ?? s.label_ar}</span>
          <strong>{String(s.value)}</strong>
        </div>
      ))}
    </section>
  ),
  ActivityFeed: ({ limit }: any) => <div data-testid="activity-feed">ActivityFeed {limit}</div>,
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

const { useQuery } = await import("@tanstack/react-query");
const useQueryMock = vi.mocked(useQuery);
const { default: BackofficeDashboard } = await import("@/portals/backoffice/pages/BackofficeDashboard");

function mockDashboardQueries(overrides: Record<string, any> = {}) {
  useQueryMock.mockImplementation(({ queryKey }: any) => {
    const key = Array.isArray(queryKey) ? queryKey.join(":") : String(queryKey);
    const dataMap: Record<string, any> = {
      "bo-stats:users": 120,
      "bo-stats:requests": 14,
      "bo-stats:revenue": 4200,
      "bo-recent-requests": [
        { id: "r1", title: "ERP implementation", status: "new", contact_name: "Acme", created_at: "2026-03-20T00:00:00Z" },
        { id: "r2", title: "Website redesign", status: "quoted", contact_name: "Beta", created_at: "2026-03-21T00:00:00Z" },
      ],
      "bo-stats:pending-companies": 4,
      "bo-new-requests": 5,
      "bo-pending-bookings": 2,
      "bo-pending-instructor-apps": 3,
      "bo-unread-contacts": 7,
      ...overrides,
    };
    return {
      data: dataMap[key],
      isLoading: key == "bo-stats:users" ? false : false,
    } as any;
  });
}

describe("BackofficeDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDashboardQueries();
  });

  it("renders overview stats, quick actions, and pending actions", () => {
    renderAtPath(<BackofficeDashboard />, "/admin", "/admin");

    expect(screen.getByRole("heading", { name: /Backoffice/i })).toBeInTheDocument();
    expect(screen.getByText(/Total Users/i)).toBeInTheDocument();
    expect(screen.getByText(/Service Requests/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Revenue/i)).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument();
    expect(screen.getByText("$4,200")).toBeInTheDocument();
    expect(screen.getByText(/Pending Actions/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Account Approvals/i })).toHaveAttribute("href", "/admin/users");
    expect(screen.getByRole("link", { name: /New Requests/i })).toHaveAttribute("href", "/admin/service-requests");
    expect(screen.getByRole("link", { name: /Pending Bookings/i })).toHaveAttribute("href", "/admin/bookings");
    expect(screen.getByRole("link", { name: /Instructor Apps/i })).toHaveAttribute("href", "/admin/instructor-applications");
    expect(screen.getByRole("link", { name: /Unread Messages/i })).toHaveAttribute("href", "/admin/contacts");
  });

  it("renders recent enterprise requests and quick links", () => {
    renderAtPath(<BackofficeDashboard />, "/admin", "/admin");

    expect(screen.getByText(/Recent Enterprise Requests/i)).toBeInTheDocument();
    expect(screen.getByText(/ERP implementation/i)).toBeInTheDocument();
    expect(screen.getByText(/Website redesign/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View All/i })).toHaveAttribute("href", "/admin/service-requests");
    expect(screen.getByTestId("activity-feed")).toHaveTextContent("ActivityFeed 6");
    expect(screen.getByRole("link", { name: /Projects/i })).toHaveAttribute("href", "/admin/projects");
    expect(screen.getByRole("link", { name: /Bookings/i })).toHaveAttribute("href", "/admin/bookings");
    expect(screen.getByRole("link", { name: /Courses/i })).toHaveAttribute("href", "/admin/training");
    expect(screen.getByRole("link", { name: /Users/i })).toHaveAttribute("href", "/admin/users");
  });

  it("shows empty requests state when there are no recent enterprise requests", () => {
    mockDashboardQueries({ "bo-recent-requests": [] });
    renderAtPath(<BackofficeDashboard />, "/admin", "/admin");
    expect(screen.getByText(/No requests yet/i)).toBeInTheDocument();
  });
});
