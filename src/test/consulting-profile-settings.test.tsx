import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConsultingProfileEdit from "@/portals/consulting/pages/ConsultingProfileEdit";
import ConsultingSettings from "@/portals/consulting/pages/ConsultingSettings";
import { renderInRouter } from "./consulting-test-utils";

const mockUseMutation = vi.hoisted(() => vi.fn());
const mockUseQueryClient = vi.hoisted(() => ({ invalidateQueries: vi.fn() }));
const mockUseExpertRecord = vi.hoisted(() => vi.fn());
const mutateSpy = vi.hoisted(() => vi.fn());
const authState = vi.hoisted(() => ({ accountType: "expert" }));

vi.mock("@tanstack/react-query", () => ({
  useMutation: mockUseMutation,
  useQueryClient: () => mockUseQueryClient,
}));
vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: () => ({ lang: "en" }) }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => authState }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({ update: vi.fn(() => ({ eq: vi.fn() })) })),
    storage: { from: vi.fn(() => ({ upload: vi.fn(), getPublicUrl: vi.fn(() => ({ data: { publicUrl: "https://cdn.devwady/avatar.png" } })) })) },
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/portals/consulting/hooks/useExpertRecord", () => ({
  useExpertRecord: mockUseExpertRecord,
  EXPERT_RECORD_KEY: "consulting-expert-record",
}));

describe("Consulting profile and settings", () => {
  beforeEach(() => {
    mockUseMutation.mockReset();
    mutateSpy.mockReset();
    mockUseExpertRecord.mockReset();
    authState.accountType = "expert";
    mockUseExpertRecord.mockReturnValue({
      data: {
        id: "expert-1",
        slug: "john-doe",
        initials: "JD",
        avatar_url: null,
        name: "John Doe",
        name_ar: "جون دو",
        role: "Architecture Advisor",
        role_ar: "مستشار معماري",
        track: "Architecture",
        track_ar: "الهندسة",
        bio: "Senior architect",
        bio_ar: "خبير معماري",
        email: "john@devwady.com",
        linkedin_url: "https://linkedin.com/in/john",
        github_url: "https://github.com/john",
        session_rate_usd: 120,
        session_duration_minutes: 60,
      },
      isLoading: false,
    });
    mockUseMutation.mockReturnValue({ mutate: mutateSpy, isPending: false });
  });

  it("renders expert profile form and triggers save after changes", async () => {
    const user = userEvent.setup();
    renderInRouter(<ConsultingProfileEdit />);

    expect(screen.getByText("Edit Expert Profile")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view public profile/i })).toHaveAttribute("href", "/consulting/john-doe");

    const saveButton = screen.getByRole("button", { name: /save changes/i });
    expect(saveButton).toBeDisabled();

    await user.clear(screen.getByDisplayValue("Senior architect"));
    await user.type(screen.getByLabelText(/bio \(english\)/i), "Principal architect and advisor");
    expect(saveButton).not.toBeDisabled();

    await user.click(saveButton);
    expect(mutateSpy).toHaveBeenCalled();
  });

  it("shows expert-specific settings cards for expert accounts", () => {
    authState.accountType = "expert";
    renderInRouter(<ConsultingSettings />);
    expect(screen.getByText("Expert Profile")).toBeInTheDocument();
    expect(screen.getByText("Availability")).toBeInTheDocument();
    expect(screen.getByText("Notifications")).toBeInTheDocument();
  });

  it("hides expert-only cards for freelancer account types", () => {
    authState.accountType = "freelancer";
    renderInRouter(<ConsultingSettings />);
    expect(screen.queryByText("Expert Profile")).not.toBeInTheDocument();
    expect(screen.queryByText("Availability")).not.toBeInTheDocument();
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Account & Security")).toBeInTheDocument();
  });
});
