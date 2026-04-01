import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import ConsultingDashboard from "@/portals/consulting/pages/ConsultingDashboard";
import { renderInRouter } from "./consulting-test-utils";

const authState = vi.hoisted(() => ({ accountType: "freelancer" }));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => authState,
}));

vi.mock("@/portals/consulting/pages/ConsultingExpertDashboard", () => ({
  default: () => <div>expert-dashboard-view</div>,
}));

vi.mock("@/portals/consulting/pages/ConsultingClientDashboard", () => ({
  default: () => <div>client-dashboard-view</div>,
}));

describe("ConsultingDashboard router", () => {
  it("renders expert dashboard for expert account types", () => {
    authState.accountType = "expert";
    renderInRouter(<ConsultingDashboard />);
    expect(screen.getByText("expert-dashboard-view")).toBeInTheDocument();
  });

  it("renders expert dashboard for admin account types", () => {
    authState.accountType = "admin";
    renderInRouter(<ConsultingDashboard />);
    expect(screen.getByText("expert-dashboard-view")).toBeInTheDocument();
  });

  it("renders client dashboard for freelancer account types", () => {
    authState.accountType = "freelancer";
    renderInRouter(<ConsultingDashboard />);
    expect(screen.getByText("client-dashboard-view")).toBeInTheDocument();
  });
});
