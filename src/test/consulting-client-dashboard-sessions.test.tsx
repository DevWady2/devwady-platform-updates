import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConsultingClientDashboard from "@/portals/consulting/pages/ConsultingClientDashboard";
import ConsultingClientSessions from "@/portals/consulting/pages/ConsultingClientSessions";
import { renderInRouter } from "./consulting-test-utils";

const mockUseQuery = vi.hoisted(() => vi.fn());
const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-query", () => ({ useQuery: mockUseQuery }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "user-1" } }) }));
vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: () => ({ lang: "en" }) }));
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<any>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});
vi.mock("@/core/components", async () => {
  const actual = await vi.importActual<any>("@/core/components");
  return {
    ...actual,
    StatCardGrid: ({ stats }: any) => <div>{stats.map((s: any) => <div key={s.label_en}>{s.label_en}:{String(s.value)}</div>)}</div>,
    ActivityFeed: () => <div>activity-feed</div>,
  };
});

describe("Consulting client dashboard and sessions", () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockNavigate.mockReset();
  });

  it("renders client dashboard stats and browse experts CTA", () => {
    mockUseQuery.mockReturnValueOnce({
      data: [
        { id: "b1", booking_date: "2026-03-28", start_time: "10:00:00", status: "confirmed", payment_status: "paid", amount_usd: 120, consulting_experts: { name: "John", name_ar: "جون", initials: "JD" } },
        { id: "b2", booking_date: "2026-03-10", start_time: "13:00:00", status: "completed", payment_status: "paid", amount_usd: 150, rating: 5, consulting_experts: { name: "Sarah", name_ar: "سارة", initials: "SR" } },
      ],
      isLoading: false,
    });

    renderInRouter(<ConsultingClientDashboard />);

    expect(screen.getByText("My Consulting")).toBeInTheDocument();
    expect(screen.getByText(/Upcoming:1/)).toBeInTheDocument();
    expect(screen.getByText(/Completed:1/)).toBeInTheDocument();
    expect(screen.getByText(/Total Spent:\$270/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /browse experts/i })).toHaveAttribute("href", "/consulting");
    expect(screen.getByText("John")).toBeInTheDocument();
  });

  it("shows empty state action on sessions page and navigates to experts", async () => {
    const user = userEvent.setup();
    mockUseQuery.mockReturnValueOnce({ data: [], isLoading: false });

    renderInRouter(<ConsultingClientSessions />);

    expect(screen.getByText("No sessions yet")).toBeInTheDocument();
    const browseButtons = screen.getAllByRole("button", { name: /browse experts/i });
    await user.click(browseButtons[browseButtons.length - 1]);
    expect(mockNavigate).toHaveBeenCalledWith("/consulting");
  });

  it("renders sessions list with join link and completed filter counts", () => {
    mockUseQuery.mockReturnValueOnce({
      data: [
        { id: "b1", booking_date: "2026-03-28", start_time: "10:00:00", status: "confirmed", payment_status: "paid", amount_usd: 120, meeting_url: "https://meet.example", consulting_experts: { name: "John", name_ar: "جون", initials: "JD", track: "Architecture", slug: "john" } },
        { id: "b2", booking_date: "2026-03-10", start_time: "13:00:00", status: "completed", payment_status: "paid", amount_usd: 150, rating: 5, consulting_experts: { name: "Sarah", name_ar: "سارة", initials: "SR", track: "QA", slug: "sarah" } },
      ],
      isLoading: false,
    });

    renderInRouter(<ConsultingClientSessions />);

    expect(screen.getByText(/Upcoming.*\(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Completed.*\(1\)/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /join/i })).toHaveAttribute("href", "https://meet.example");
    expect(screen.getByRole("link", { name: "John" })).toHaveAttribute("href", "/consulting/john");
  });
});
