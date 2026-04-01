
import { describe, it, expect, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { mockUseAuth, renderAtPath, resetTalentTestMocks, setTalentQueryMap } from "./talent-test-utils";
import TalentFreelancerProfile from "@/portals/talent/pages/TalentFreelancerProfile";
import TalentFreelancerPortfolio from "@/portals/talent/pages/TalentFreelancerPortfolio";
import TalentSettings from "@/portals/talent/pages/TalentSettings";

describe("Talent freelancer profile, portfolio, and shared settings", () => {
  beforeEach(() => {
    resetTalentTestMocks();
  });

  it("renders freelancer profile details and external links", () => {
    setTalentQueryMap({
      "talent-freelancer-full-profile": { data: { full_name: "Nour Emad", location: "Cairo", rating: 4.9, is_available: true, hourly_rate: "$30", bio: "Full-stack engineer", github_url: "https://github.com/nour", linkedin_url: "https://linkedin.com/in/nour", portfolio_url: "https://nour.dev", skills: ["React", "Laravel"], phone: "+201000000000" }, isLoading: false },
    });

    renderAtPath(<TalentFreelancerProfile />, "/talent/portal/freelancer/profile");

    expect(screen.getByText("Nour Emad")).toBeInTheDocument();
    expect(screen.getByText("Full-stack engineer")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /GitHub/i })).toHaveAttribute("href", "https://github.com/nour");
  });

  it("renders freelancer portfolio cards", () => {
    setTalentQueryMap({
      "talent-freelancer-portfolio": { data: [{ id: "p-1", title: "Commerce Dashboard", description: "B2B admin experience", technologies: ["React", "TypeScript"], project_url: "https://example.com" }], isLoading: false },
    });
    renderAtPath(<TalentFreelancerPortfolio />, "/talent/portal/freelancer/portfolio");
    expect(screen.getByText("Commerce Dashboard")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View/i })).toHaveAttribute("href", "https://example.com");
  });

  it("shows the freelancer portfolio empty state", () => {
    setTalentQueryMap({ "talent-freelancer-portfolio": { data: [], isLoading: false } });
    renderAtPath(<TalentFreelancerPortfolio />, "/talent/portal/freelancer/portfolio");
    expect(screen.getByText(/No portfolio items/i)).toBeInTheDocument();
  });

  it("shows company-specific settings tiles only for company account types", () => {
    mockUseAuth.mockReturnValue({ accountType: "company" } as any);
    renderAtPath(<TalentSettings />, "/talent/portal/company/settings");
    expect(screen.getByText("Company Profile")).toBeInTheDocument();
    expect(screen.getByText("Team Members")).toBeInTheDocument();

    mockUseAuth.mockReturnValue({ accountType: "freelancer" } as any);
    renderAtPath(<TalentSettings />, "/talent/portal/freelancer/settings");
    expect(screen.queryByText("Company Profile")).not.toBeInTheDocument();
    expect(screen.getByText("Profile Settings")).toBeInTheDocument();
    expect(screen.getByText("Account & Security")).toBeInTheDocument();
  });
});
