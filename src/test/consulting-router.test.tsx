import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import ConsultingDashboard from "@/portals/consulting/pages/ConsultingDashboard";
import { renderInRouter } from "./consulting-test-utils";

const rolesState = vi.hoisted(() => ({ roles: ["individual"] as string[] }));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ roles: rolesState.roles }),
}));

vi.mock("@/portals/consulting/pages/ConsultingExpertDashboard", () => ({
  default: () => <div>expert-dashboard-view</div>,
}));

vi.mock("@/portals/consulting/pages/ConsultingClientDashboard", () => ({
  default: () => <div>client-dashboard-view</div>,
}));

describe("ConsultingDashboard router", () => {
  it("renders expert dashboard for expert role", () => {
    rolesState.roles = ["expert"];
    renderInRouter(<ConsultingDashboard />);
    expect(screen.getByText("expert-dashboard-view")).toBeInTheDocument();
  });

  it("renders expert dashboard for admin role", () => {
    rolesState.roles = ["admin"];
    renderInRouter(<ConsultingDashboard />);
    expect(screen.getByText("expert-dashboard-view")).toBeInTheDocument();
  });

  it("renders client dashboard for non-expert roles", () => {
    rolesState.roles = ["individual"];
    renderInRouter(<ConsultingDashboard />);
    expect(screen.getByText("client-dashboard-view")).toBeInTheDocument();
  });
});
