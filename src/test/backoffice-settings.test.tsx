

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderAtPath } from "./backoffice-test-utils";

vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: () => ({ lang: "en" }) }));
vi.mock("@/core/components", () => ({
  PageHeader: ({ title_en, description_en }: any) => (<header><h1>{title_en}</h1><p>{description_en}</p></header>),
}));

const { default: BackofficeSettings } = await import("@/portals/backoffice/pages/BackofficeSettings");

describe("BackofficeSettings", () => {
  it("renders configuration sections with correct admin links", () => {
    renderAtPath(<BackofficeSettings />, "/admin/settings", "/admin/settings");

    expect(screen.getByRole("heading", { name: /Settings/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /User Management/i })).toHaveAttribute("href", "/admin/users");
    expect(screen.getByRole("link", { name: /Roles & Permissions/i })).toHaveAttribute("href", "/admin/roles");
    expect(screen.getByRole("link", { name: /Organizations/i })).toHaveAttribute("href", "/admin/organizations");
    expect(screen.getByRole("link", { name: /Notifications/i })).toHaveAttribute("href", "/admin/notifications");
    expect(screen.getByRole("link", { name: /Payments/i })).toHaveAttribute("href", "/admin/payments");
    expect(screen.getByRole("link", { name: /Contact Forms/i })).toHaveAttribute("href", "/admin/contacts");
    expect(screen.getByRole("link", { name: /Content/i })).toHaveAttribute("href", "/admin/blog");
    expect(screen.getByRole("link", { name: /System Info/i })).toHaveAttribute("href", "/admin");
  });
});
