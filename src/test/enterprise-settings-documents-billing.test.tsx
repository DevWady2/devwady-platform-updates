
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import EnterpriseSettings from "@/portals/enterprise/pages/EnterpriseSettings";
import EnterpriseDocuments from "@/portals/enterprise/pages/EnterpriseDocuments";
import EnterpriseBilling from "@/portals/enterprise/pages/EnterpriseBilling";
import { renderInRouter } from "./enterprise-test-utils";

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ lang: "en" }),
}));

vi.mock("@/core/hooks", () => ({
  usePayments: () => ({
    payments: [
      { id: "pay-1", description: "Milestone 1", type: "project", status: "paid", amount_usd: 5000, paid_at: "2026-03-15T00:00:00Z", created_at: "2026-03-15T00:00:00Z" },
      { id: "pay-2", description: "Milestone 2", type: "project", status: "pending", amount_usd: 2500, created_at: "2026-03-20T00:00:00Z" },
    ],
    isLoading: false,
    totalPaid: 5000,
  }),
}));

vi.mock("@/core/components", async () => {
  const actual = await vi.importActual<any>("@/core/components");
  return {
    ...actual,
    MediaManager: (props: any) => (
      <div data-testid="media-manager" data-bucket={props.bucket} data-folder={props.folder}>
        media-manager
      </div>
    ),
  };
});

describe("Enterprise support pages", () => {
  it("renders enterprise settings links to company and account areas", () => {
    renderInRouter(<EnterpriseSettings />);

    expect(screen.getByRole("link", { name: /company profile/i })).toHaveAttribute("href", "/enterprise/portal/company-profile");
    expect(screen.getByRole("link", { name: /account & security/i })).toHaveAttribute("href", "/settings");
  });

  it("passes the enterprise delivery bucket/folder into the documents media manager", () => {
    renderInRouter(<EnterpriseDocuments />);

    const media = screen.getByTestId("media-manager");
    expect(media).toHaveAttribute("data-bucket", "media");
    expect(media).toHaveAttribute("data-folder", "delivery");
  });

  it("renders billing totals and payment history from the shared payments hook", () => {
    renderInRouter(<EnterpriseBilling />);

    expect(screen.getByText("$5,000")).toBeInTheDocument();
    expect(screen.getByText("$2,500")).toBeInTheDocument();
    expect(screen.getAllByText(/^2$/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Milestone 1")).toBeInTheDocument();
    expect(screen.getByText("Milestone 2")).toBeInTheDocument();
  });
});
