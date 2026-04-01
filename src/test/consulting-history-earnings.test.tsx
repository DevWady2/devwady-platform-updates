import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConsultingHistory from "@/portals/consulting/pages/ConsultingHistory";
import ConsultingEarnings from "@/portals/consulting/pages/ConsultingEarnings";
import { renderInRouter } from "./consulting-test-utils";

const mockUseQuery = vi.hoisted(() => vi.fn());
const mockUseExpertRecord = vi.hoisted(() => vi.fn());
const downloadCSV = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-query", () => ({ useQuery: mockUseQuery }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "user-1" } }) }));
vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: () => ({ lang: "en" }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("@/core/components", async () => {
  const actual = await vi.importActual<any>("@/core/components");
  return {
    ...actual,
    StatCardGrid: ({ stats }: any) => <div>{stats.map((s: any) => <div key={s.label_en}>{s.label_en}:{String(s.value)}</div>)}</div>,
  };
});
vi.mock("@/lib/csvExport", () => ({ downloadCSV }));
vi.mock("@/portals/consulting/hooks/useExpertRecord", () => ({ useExpertRecord: mockUseExpertRecord }));
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="chart">{children}</div>,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => <div>bar-series</div>,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

describe("Consulting history and earnings", () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockUseExpertRecord.mockReset();
    downloadCSV.mockReset();
    mockUseExpertRecord.mockReturnValue({ data: { id: "expert-1", session_rate_usd: 120 } });
  });

  it("renders completed session history and review text", () => {
    mockUseQuery.mockReturnValueOnce({
      data: [
        { id: "b1", booking_date: "2026-03-10", amount_usd: 120, rating: 5, review: "Very practical advice", consulting_experts: { name: "John", name_ar: "جون", initials: "JD" } },
      ],
      isLoading: false,
    });

    renderInRouter(<ConsultingHistory />);

    expect(screen.getByText("Session History")).toBeInTheDocument();
    expect(screen.getByText("John")).toBeInTheDocument();
    expect(screen.getByText("Very practical advice")).toBeInTheDocument();
  });

  it("renders earnings stats and exports csv", async () => {
    const user = userEvent.setup();
    mockUseQuery.mockReturnValueOnce({
      data: [
        { id: "p1", booking_date: "2026-03-05", amount_usd: 120, payment_status: "paid", status: "completed", guest_name: "Acme" },
        { id: "p2", booking_date: "2026-03-12", amount_usd: 140, payment_status: "paid", status: "completed", guest_name: "Beta" },
      ],
      isLoading: false,
    });

    renderInRouter(<ConsultingEarnings />);

    expect(screen.getByText(/Total Earnings:\$260/)).toBeInTheDocument();
    expect(screen.getByText(/Paid Sessions:2/)).toBeInTheDocument();
    expect(screen.getByTestId("chart")).toBeInTheDocument();
    expect(screen.getByText("Acme")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /export csv/i }));
    expect(downloadCSV).toHaveBeenCalled();
  });
});
