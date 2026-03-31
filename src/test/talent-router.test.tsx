import { describe, it, expect, beforeEach } from "vitest";
import { Routes, Route, MemoryRouter } from "react-router-dom";
import { render } from "@testing-library/react";
import { mockUseAuth, resetTalentTestMocks } from "./talent-test-utils";
import TalentRouterPage from "@/portals/talent/pages/TalentRouterPage";

describe("TalentRouterPage", () => {
  beforeEach(() => {
    resetTalentTestMocks();
  });

  it("shows a loading spinner while auth is loading", () => {
    mockUseAuth.mockReturnValue({ loading: true, accountType: null, role: null, roles: [] } as any);
    const { container } = render(
      <MemoryRouter initialEntries={["/talent/portal"]}>
        <TalentRouterPage />
      </MemoryRouter>
    );
    expect(container.querySelector(".animate-spin")).toBeTruthy();
  });

  it("redirects company users to the company workspace", async () => {
    mockUseAuth.mockReturnValue({ loading: false, accountType: "company", role: "company", roles: ["company"] } as any);
    const { findByText } = render(
      <MemoryRouter initialEntries={["/talent/portal"]}>
        <Routes>
          <Route path="/talent/portal" element={<TalentRouterPage />} />
          <Route path="/talent/portal/company" element={<div>Company Workspace</div>} />
          <Route path="/talent/portal/freelancer" element={<div>Freelancer Workspace</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(await findByText("Company Workspace")).toBeInTheDocument();
  });

  it("redirects admin users to the company workspace", async () => {
    mockUseAuth.mockReturnValue({ loading: false, accountType: "admin", role: "admin", roles: ["admin"] } as any);
    const { findByText } = render(
      <MemoryRouter initialEntries={["/talent/portal"]}>
        <Routes>
          <Route path="/talent/portal" element={<TalentRouterPage />} />
          <Route path="/talent/portal/company" element={<div>Company Workspace</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(await findByText("Company Workspace")).toBeInTheDocument();
  });

  it("redirects freelancers to the canonical freelancer workspace", async () => {
    mockUseAuth.mockReturnValue({ loading: false, accountType: "freelancer", role: "individual", roles: ["individual"] } as any);
    const { findByText } = render(
      <MemoryRouter initialEntries={["/talent/portal"]}>
        <Routes>
          <Route path="/talent/portal" element={<TalentRouterPage />} />
          <Route path="/talent/portal/freelancer" element={<div>Freelancer Workspace</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(await findByText("Freelancer Workspace")).toBeInTheDocument();
  });
});
