
import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import EnterpriseQuotes from "@/portals/enterprise/pages/EnterpriseQuotes";
import EnterpriseQuoteDetail from "@/portals/enterprise/pages/EnterpriseQuoteDetail";
import { renderAtPath, renderInRouter } from "./enterprise-test-utils";

const { mockUseQuery, mockUseMutation, mockInvalidateQueries } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockUseMutation: vi.fn(),
  mockInvalidateQueries: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: mockUseQuery,
  useMutation: mockUseMutation,
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ lang: "en" }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("EnterpriseQuotes and EnterpriseQuoteDetail", () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockUseMutation.mockReset();
    mockInvalidateQueries.mockReset();
  });

  it("renders available quotes in the listing page", () => {
    mockUseQuery.mockReturnValue({
      data: [
        {
          id: "q1",
          quote_number: "Q-001",
          title: "ERP Discovery Quote",
          description: "Initial discovery and planning",
          status: "sent",
          total_usd: 2500,
          estimated_duration: "2 weeks",
          valid_until: "2026-04-01T00:00:00Z",
        },
      ],
      isLoading: false,
    });

    renderInRouter(<EnterpriseQuotes />);

    expect(screen.getByText("ERP Discovery Quote")).toBeInTheDocument();
    expect(screen.getByText("Q-001")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view/i })).toHaveAttribute("href", "/enterprise/portal/quotes/q1");
  });

  it("lets the client approve a sent quote from the detail page", () => {
    const mutate = vi.fn();
    mockUseQuery.mockReturnValue({
      data: {
        id: "q1",
        quote_number: "Q-001",
        title: "ERP Discovery Quote",
        description: "Initial discovery and planning",
        status: "sent",
        total_usd: 2500,
        subtotal_usd: 2500,
        line_items: [{ description: "Workshop", qty: 1, unit_price: 2500, total: 2500 }],
        valid_until: "2026-04-01T00:00:00Z",
      },
      isLoading: false,
    });
    mockUseMutation.mockReturnValue({ mutate, isPending: false });

    renderAtPath(<EnterpriseQuoteDetail />, "/enterprise/portal/quotes/q1", "/enterprise/portal/quotes/:id");

    expect(screen.getByText("ERP Discovery Quote")).toBeInTheDocument();
    expect(screen.getByText("Workshop")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /approve quote/i }));
    expect(mutate).toHaveBeenCalledWith("approved");
  });
});
