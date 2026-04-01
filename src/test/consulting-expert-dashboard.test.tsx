import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConsultingExpertDashboard from "@/portals/consulting/pages/ConsultingExpertDashboard";
import { renderInRouter } from "./consulting-test-utils";

const qc = vi.hoisted(() => ({ invalidateQueries: vi.fn() }));
const mockUseQuery = vi.hoisted(() => vi.fn());
const mockUseMutation = vi.hoisted(() => vi.fn());
const mockUseExpertRecord = vi.hoisted(() => vi.fn());
const mutationSpy = vi.hoisted(() => vi.fn());
const toggleUpdate = vi.hoisted(() => vi.fn(async () => ({ error: null })));

vi.mock("@tanstack/react-query", () => ({
  useQuery: mockUseQuery,
  useMutation: mockUseMutation,
  useQueryClient: () => qc,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({ update: vi.fn(() => ({ eq: toggleUpdate })) })),
  },
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ lang: "en" }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("@/core/components", () => ({
  StatCardGrid: ({ stats }: any) => (
    <div>
      {stats.map((s: any) => (
        <div key={s.label_en}>{s.label_en}:{String(s.value)}</div>
      ))}
    </div>
  ),
  ActivityFeed: () => <div>activity-feed</div>,
  FocusBlock: ({ title_en, title_ar, action_en, action_ar, actionHref, subtitle_en, subtitle_ar, label_en, label_ar }: any) => (
    <div data-testid="focus-block">
      <span>{title_en ?? title_ar}</span>
      {(subtitle_en || subtitle_ar) && <p>{subtitle_en ?? subtitle_ar}</p>}
      <a href={actionHref}>{action_en ?? action_ar}</a>
    </div>
  ),
}));

vi.mock("@/portals/consulting/hooks/useExpertRecord", () => ({
  useExpertRecord: mockUseExpertRecord,
  EXPERT_RECORD_KEY: "consulting-expert-record",
}));

describe("ConsultingExpertDashboard", () => {
  beforeEach(() => {
    qc.invalidateQueries.mockReset();
    mockUseQuery.mockReset();
    mockUseMutation.mockReset();
    mockUseExpertRecord.mockReset();
    mutationSpy.mockReset();
    toggleUpdate.mockClear();

    mockUseExpertRecord.mockReturnValue({
      data: {
        id: "expert-1",
        slug: "john-doe",
        initials: "JD",
        avatar_url: null,
        name: "John Doe",
        name_ar: "جون دو",
        role: "Architecture Advisor",
        role_ar: "مستشار معماري",
        track: "Architecture",
        track_ar: "الهندسة",
        session_rate_usd: 120,
        is_active: true,
      },
      isLoading: false,
    });

    mockUseQuery.mockReturnValue({
      data: [
        { id: "b1", guest_name: "Acme", booking_date: "2026-03-26", start_time: "10:00:00", end_time: "11:00:00", status: "pending", payment_status: "paid", amount_usd: 120, created_at: "2026-03-25T00:00:00Z" },
        { id: "b2", guest_name: "Beta", booking_date: "2026-03-28", start_time: "12:00:00", end_time: "13:00:00", status: "confirmed", payment_status: "paid", amount_usd: 120, created_at: "2026-03-24T00:00:00Z", meeting_url: "https://meet.devwady.test" },
        { id: "b3", guest_name: "Gamma", booking_date: "2026-03-10", start_time: "14:00:00", end_time: "15:00:00", status: "completed", payment_status: "paid", amount_usd: 140, rating: 5, created_at: "2026-03-10T00:00:00Z" },
      ],
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({ mutate: mutationSpy, isPending: false });
  });

  it("renders expert summary, stats, and upcoming session actions", () => {
    renderInRouter(<ConsultingExpertDashboard />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText(/Total Sessions:2/)).toBeInTheDocument();
    expect(screen.getByText(/Earnings:\$380/)).toBeInTheDocument();
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /public profile/i })).toHaveAttribute("href", "/consulting/john-doe");
    expect(screen.getByText("activity-feed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirm/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /decline/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /join/i })).toHaveAttribute("href", "https://meet.devwady.test");
  });

  it("triggers booking status mutation when confirming a pending session", async () => {
    const user = userEvent.setup();
    renderInRouter(<ConsultingExpertDashboard />);
    await user.click(screen.getByRole("button", { name: /confirm/i }));
    expect(mutationSpy).toHaveBeenCalledWith({ id: "b1", status: "confirmed" });
  });
});
