
import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import EnterpriseNewRequest from "@/portals/enterprise/pages/EnterpriseNewRequest";
import { renderInRouter } from "./enterprise-test-utils";

const { insertMock, navigateMock, toastSuccessMock, toastErrorMock } = vi.hoisted(() => ({
  insertMock: vi.fn(),
  navigateMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1", email: "enterprise@devwady.com" } }),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ lang: "en" }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      insert: insertMock,
    }),
  },
}));

vi.mock("sonner", () => ({ toast: { success: toastSuccessMock, error: toastErrorMock } }));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<any>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/components/ui/select", async () => {
  const React = await vi.importActual<typeof import("react")>("react");
  const Ctx = React.createContext<(value: string) => void>(() => {});
  return {
    Select: ({ onValueChange, children }: any) => <Ctx.Provider value={onValueChange}>{children}</Ctx.Provider>,
    SelectContent: ({ children }: any) => <div>{children}</div>,
    SelectItem: ({ value, children }: any) => {
      const onValueChange = React.useContext(Ctx);
      return <button type="button" onClick={() => onValueChange?.(value)}>{children}</button>;
    },
    SelectTrigger: ({ children }: any) => <div>{children}</div>,
    SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  };
});

describe("EnterpriseNewRequest", () => {
  beforeEach(() => {
    insertMock.mockReset();
    navigateMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
  });

  it("shows validation errors when required fields are missing", () => {
    renderInRouter(<EnterpriseNewRequest />);

    fireEvent.click(screen.getByRole("button", { name: /submit request/i }));

    expect(toastErrorMock).toHaveBeenCalled();
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("submits a valid enterprise request and redirects to the requests list", async () => {
    insertMock.mockResolvedValue({ error: null });

    const { container } = renderInRouter(<EnterpriseNewRequest />);

    const inputs = Array.from(container.querySelectorAll("input"));
    const textareas = Array.from(container.querySelectorAll("textarea"));

    fireEvent.change(inputs[0], { target: { value: "ERP Implementation" } });
    fireEvent.click(screen.getByRole("button", { name: /web application/i }));
    fireEvent.click(screen.getByRole("button", { name: /project/i }));
    fireEvent.change(textareas[0], { target: { value: "End-to-end ERP setup" } });
    fireEvent.change(inputs[2], { target: { value: "Kamal Wagdi" } });
    fireEvent.change(inputs[3], { target: { value: "kamal@example.com" } });

    fireEvent.click(screen.getByRole("button", { name: /submit request/i }));

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
        title: "ERP Implementation",
        service_type: "web_app",
        category: "project",
        description: "End-to-end ERP setup",
        contact_name: "Kamal Wagdi",
        contact_email: "kamal@example.com",
        user_id: "user-1",
        source: "delivery_portal",
      }));
      expect(toastSuccessMock).toHaveBeenCalled();
      expect(navigateMock).toHaveBeenCalledWith("/enterprise/portal/requests");
    });
  });
});
