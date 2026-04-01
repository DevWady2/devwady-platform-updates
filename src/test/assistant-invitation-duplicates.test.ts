import { describe, it, expect } from "vitest";
import {
  getExistingInvitationState,
  type ExistingInvitation,
} from "@/components/instructor/InviteAssistantDialog";

const inv = (overrides: Partial<ExistingInvitation> & { status: string; course_id: string; freelancer_id: string }): ExistingInvitation => ({
  id: crypto.randomUUID(),
  ...overrides,
});

describe("getExistingInvitationState — duplicate detection", () => {
  const fId = "freelancer-1";
  const cId = "course-1";

  it("returns null when no existing invitations", () => {
    expect(getExistingInvitationState([], fId, cId)).toBeNull();
  });

  it("returns null when invitations exist for different course", () => {
    const invitations = [inv({ status: "pending", freelancer_id: fId, course_id: "course-other" })];
    expect(getExistingInvitationState(invitations, fId, cId)).toBeNull();
  });

  it("returns null when invitations exist for different freelancer", () => {
    const invitations = [inv({ status: "accepted", freelancer_id: "other", course_id: cId })];
    expect(getExistingInvitationState(invitations, fId, cId)).toBeNull();
  });

  it("blocks on pending invitation", () => {
    const invitations = [inv({ status: "pending", freelancer_id: fId, course_id: cId })];
    const result = getExistingInvitationState(invitations, fId, cId);
    expect(result).not.toBeNull();
    expect(result!.status).toBe("pending");
  });

  it("blocks on accepted invitation", () => {
    const invitations = [inv({ status: "accepted", freelancer_id: fId, course_id: cId })];
    const result = getExistingInvitationState(invitations, fId, cId);
    expect(result).not.toBeNull();
    expect(result!.status).toBe("accepted");
  });

  it("accepted takes priority over pending", () => {
    const invitations = [
      inv({ status: "pending", freelancer_id: fId, course_id: cId }),
      inv({ status: "accepted", freelancer_id: fId, course_id: cId }),
    ];
    const result = getExistingInvitationState(invitations, fId, cId);
    expect(result!.status).toBe("accepted");
  });

  it("returns declined for re-invite awareness", () => {
    const invitations = [inv({ status: "declined", freelancer_id: fId, course_id: cId })];
    const result = getExistingInvitationState(invitations, fId, cId);
    expect(result).not.toBeNull();
    expect(result!.status).toBe("declined");
  });

  it("pending takes priority over declined", () => {
    const invitations = [
      inv({ status: "declined", freelancer_id: fId, course_id: cId }),
      inv({ status: "pending", freelancer_id: fId, course_id: cId }),
    ];
    const result = getExistingInvitationState(invitations, fId, cId);
    expect(result!.status).toBe("pending");
  });

  it("declined does not block — allows re-invite", () => {
    const invitations = [inv({ status: "declined", freelancer_id: fId, course_id: cId })];
    const result = getExistingInvitationState(invitations, fId, cId);
    // declined is returned for awareness but should not be treated as blocking
    expect(result!.status).toBe("declined");
    // The component treats only pending/accepted as blocking
    const isBlocked = result!.status === "pending" || result!.status === "accepted";
    expect(isBlocked).toBe(false);
  });
});
