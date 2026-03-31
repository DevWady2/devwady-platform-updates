

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PORTALS } from "@/core/portals/registry";
import { backofficeRoutes } from "@/routes/portalRoutes";

const portalGuardSpy = vi.fn();
const portalShellSpy = vi.fn();
const portalSidebarSpy = vi.fn();

vi.mock("@/core/guards/PortalGuard", () => ({
  default: ({ children, portal }: any) => {
    portalGuardSpy(portal);
    return <div data-testid="portal-guard">{children}</div>;
  },
}));

vi.mock("@/core/layouts/PortalShell", () => ({
  default: ({ children, portal, sidebar }: any) => {
    portalShellSpy({ portal, sidebar });
    return <div data-testid="portal-shell">{sidebar}{children}</div>;
  },
}));

vi.mock("@/core/layouts/PortalSidebar", () => ({
  __esModule: true,
  default: ({ groups, portal }: any) => {
    portalSidebarSpy({ groups, portal });
    return <nav data-testid="portal-sidebar">{groups.map((g: any) => <span key={g.label_en}>{g.label_en}</span>)}</nav>;
  },
}));

const { default: BackofficeLayout } = await import("@/portals/backoffice/BackofficeLayout");

describe("Backoffice routes and layout", () => {
  it("contains the expected core and legacy admin routes", () => {
    const paths = backofficeRoutes.map((r) => r.path);
    expect(paths).toContain("/admin");
    expect(paths).toContain("/admin/analytics");
    expect(paths).toContain("/admin/organizations");
    expect(paths).toContain("/admin/roles");
    expect(paths).toContain("/admin/settings");
    expect(paths).toContain("/admin/users");
    expect(paths).toContain("/admin/service-requests");
    expect(paths).toContain("/admin/quotes");
    expect(paths).toContain("/admin/quotes/new");
    expect(paths).toContain("/admin/projects");
    expect(paths).toContain("/admin/projects/:id");
    expect(paths).toContain("/admin/engagements");
    expect(paths).toContain("/admin/notifications");
    expect(paths).toContain("/admin/bookings");
    expect(paths).toContain("/admin/training");
  });

  it("renders backoffice layout with grouped sidebar navigation and portal guard", () => {
    render(
      <MemoryRouter>
        <BackofficeLayout>
          <div>Backoffice Child</div>
        </BackofficeLayout>
      </MemoryRouter>
    );

    expect(screen.getByTestId("portal-guard")).toBeInTheDocument();
    expect(screen.getByTestId("portal-shell")).toBeInTheDocument();
    expect(screen.getByTestId("portal-sidebar")).toBeInTheDocument();
    expect(screen.getByText(/Backoffice Child/i)).toBeInTheDocument();
    expect(portalGuardSpy).toHaveBeenCalledWith(PORTALS.backoffice);

    const sidebarArg = portalSidebarSpy.mock.calls[0][0];
    expect(sidebarArg.portal).toEqual(PORTALS.backoffice);
    expect(sidebarArg.groups.map((g: any) => g.label_en)).toEqual([
      "Overview",
      "Users & Access",
      "Enterprise",
      "Talent",
      "Consulting",
      "Academy",
      "Content",
      "Finance",
      "System",
    ]);
  });
});
