import { describe, it, expect } from "vitest";

/**
 * LP-16A — Invitation history profile loading behavior.
 * Tests the logic that determines which freelancer IDs are used for profile resolution.
 */

type Invitation = {
  id: string;
  freelancer_id: string;
  course_id: string | null;
  status: string;
};

/** Mirrors the fixed logic in InstructorAssistants */
function getProfileQueryIds(invitations: Invitation[]) {
  return [...new Set(invitations.map((i) => i.freelancer_id))];
}

function getAcceptedFreelancerIds(invitations: Invitation[]) {
  return [...new Set(invitations.filter((i) => i.status === "accepted").map((i) => i.freelancer_id))];
}

describe("Invitation history profile loading", () => {
  const pendingOnly: Invitation[] = [
    { id: "inv-1", freelancer_id: "f-1", course_id: "c-1", status: "pending" },
    { id: "inv-2", freelancer_id: "f-2", course_id: "c-1", status: "pending" },
  ];

  const declinedOnly: Invitation[] = [
    { id: "inv-3", freelancer_id: "f-3", course_id: "c-2", status: "declined" },
  ];

  const mixed: Invitation[] = [
    { id: "inv-4", freelancer_id: "f-1", course_id: "c-1", status: "accepted" },
    { id: "inv-5", freelancer_id: "f-4", course_id: "c-1", status: "pending" },
    { id: "inv-6", freelancer_id: "f-5", course_id: "c-2", status: "declined" },
  ];

  it("resolves profiles for pending-only invitations with zero accepted", () => {
    const ids = getProfileQueryIds(pendingOnly);
    const acceptedIds = getAcceptedFreelancerIds(pendingOnly);
    expect(acceptedIds).toHaveLength(0);
    expect(ids).toContain("f-1");
    expect(ids).toContain("f-2");
    expect(ids.length).toBeGreaterThan(0);
  });

  it("resolves profiles for declined-only invitations with zero accepted", () => {
    const ids = getProfileQueryIds(declinedOnly);
    const acceptedIds = getAcceptedFreelancerIds(declinedOnly);
    expect(acceptedIds).toHaveLength(0);
    expect(ids).toContain("f-3");
  });

  it("accepted-assistant profile loading remains unchanged in mixed state", () => {
    const allIds = getProfileQueryIds(mixed);
    const acceptedIds = getAcceptedFreelancerIds(mixed);
    expect(acceptedIds).toEqual(["f-1"]);
    // All freelancers are included for profile resolution
    expect(allIds).toContain("f-1");
    expect(allIds).toContain("f-4");
    expect(allIds).toContain("f-5");
  });

  it("deduplicates freelancer IDs across invitations", () => {
    const duped: Invitation[] = [
      { id: "inv-a", freelancer_id: "f-1", course_id: "c-1", status: "pending" },
      { id: "inv-b", freelancer_id: "f-1", course_id: "c-2", status: "declined" },
    ];
    const ids = getProfileQueryIds(duped);
    expect(ids).toEqual(["f-1"]);
  });

  it("returns empty when no invitations exist", () => {
    expect(getProfileQueryIds([])).toHaveLength(0);
    expect(getAcceptedFreelancerIds([])).toHaveLength(0);
  });
});
