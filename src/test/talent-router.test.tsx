
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
    mockUseAuth.mockReturnValue({ loading: true, roles: [] } as any);
    const { container } = render(
      <MemoryRouter initialEntries={["/talent/portal"]}>
        <TalentRouterPage />
      </MemoryRouter>
    );
    expect(container.querySelector(".animate-spin")).toBeTruthy();
  });

  it("redirects company users to the company workspace", async () => {
    mockUseAuth.mockReturnValue({ loading: false, roles: ["company"], role: "company" } as any);
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

  it("redirects individuals to the freelancer workspace", async () => {
    mockUseAuth.mockReturnValue({ loading: false, roles: ["individual"], role: "individual" } as any);
    const { findByText } = render(
      <MemoryRouter initialEntries={["/talent/portal"]}>
        <Routes>
          <Route path="/talent/portal" element={<TalentRouterPage />} />
          <Route path="/talent/portal/company" element={<div>Company Workspace</div>} />
          <Route path="/talent/portal/freelancer" element={<div>Freelancer Workspace</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(await findByText("Freelancer Workspace")).toBeInTheDocument();
  });
});
