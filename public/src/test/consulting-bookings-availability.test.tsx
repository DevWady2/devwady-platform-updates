import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConsultingBookings from "@/portals/consulting/pages/ConsultingBookings";
import ConsultingAvailability from "@/portals/consulting/pages/ConsultingAvailability";
import { renderInRouter } from "./consulting-test-utils";

const mockUseQuery = vi.hoisted(() => vi.fn());
const mockUseMutation = vi.hoisted(() => vi.fn());
const mockUseExpertRecord = vi.hoisted(() => vi.fn());
const mockUseSearch = vi.hoisted(() => vi.fn());
const mutationSpy = vi.hoisted(() => vi.fn());
const queryClient = vi.hoisted(() => ({ invalidateQueries: vi.fn() }));

vi.mock("@tanstack/react-query", () => ({
  useQuery: mockUseQuery,
  useMutation: mockUseMutation,
  useQueryClient: () => queryClient,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({ update: vi.fn(() => ({ eq: vi.fn() })), insert: vi.fn(), delete: vi.fn(() => ({ eq: vi.fn() })), select: vi.fn(() => ({ eq: vi.fn(() => ({ order: vi.fn(() => ({ order: vi.fn() })) })) })) })),
  },
}));

vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: () => ({ lang: "en" }) }));
vi.mock("@/core/hooks", () => ({ useSearch: mockUseSearch }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/portals/consulting/hooks/useExpertRecord", () => ({ useExpertRecord: mockUseExpertRecord }));

describe("Consulting bookings and availability", () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockUseMutation.mockReset();
    mockUseExpertRecord.mockReset();
    mockUseSearch.mockReset();
    mutationSpy.mockReset();
    queryClient.invalidateQueries.mockReset();

    mockUseExpertRecord.mockReturnValue({ data: { id: "expert-1" } });
    mockUseSearch.mockReturnValue({ params: { query: "" }, setQuery: vi.fn() });
    mockUseMutation.mockReturnValue({ mutate: mutationSpy, isPending: false });
  });

  it("renders bookings list with confirm/decline and meeting link actions", () => {
    mockUseQuery.mockReturnValueOnce({
      data: [
        { id: "b1", guest_name: "Acme", guest_email: "pm@acme.com", booking_date: "2026-03-28", start_time: "09:00:00", end_time: "10:00:00", status: "pending", payment_status: "paid", amount_usd: 120 },
        { id: "b2", guest_name: "Beta", guest_email: "cto@beta.com", booking_date: "2026-03-29", start_time: "11:00:00", end_time: "12:00:00", status: "confirmed", payment_status: "paid", amount_usd: 140, meeting_url: "https://meet.example" },
      ],
      isLoading: false,
    });

    renderInRouter(<ConsultingBookings />);

    expect(screen.getByText("Session Bookings")).toBeInTheDocument();
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirm/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /decline/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /meeting link/i })).toHaveAttribute("href", "https://meet.example");
  });

  it("fires status mutation from bookings actions", async () => {
    const user = userEvent.setup();
    mockUseQuery.mockReturnValueOnce({
      data: [
        { id: "b1", guest_name: "Acme", guest_email: "pm@acme.com", booking_date: "2026-03-28", start_time: "09:00:00", end_time: "10:00:00", status: "pending", payment_status: "paid", amount_usd: 120 },
      ],
      isLoading: false,
    });

    renderInRouter(<ConsultingBookings />);
    await user.click(screen.getByRole("button", { name: /confirm/i }));
    expect(mutationSpy).toHaveBeenCalledWith({ id: "b1", status: "confirmed" });
  });

  it("renders grouped availability slots and add slot form", () => {
    mockUseQuery.mockReturnValueOnce({
      data: [
        { id: "s1", day_of_week: 1, start_time: "09:00:00", end_time: "12:00:00", is_active: true },
        { id: "s2", day_of_week: 3, start_time: "13:00:00", end_time: "15:00:00", is_active: false },
      ],
      isLoading: false,
    });

    renderInRouter(<ConsultingAvailability />);

    expect(screen.getByText("Availability")).toBeInTheDocument();
    expect(screen.getByText("Add Availability Slot")).toBeInTheDocument();
    expect(screen.getAllByText("Mon").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Wed").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("09:00 – 12:00")).toBeInTheDocument();
    expect(screen.getByText("13:00 – 15:00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Add$/i })).toBeInTheDocument();
  });
});
