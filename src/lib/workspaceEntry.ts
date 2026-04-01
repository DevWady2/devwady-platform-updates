/**
 * workspaceEntry — Workspace arrival context model.
 *
 * Provides typed route state for seamless homepage → portal transitions.
 * Components pass WorkspaceEntryState via react-router `state`,
 * and portal dashboards read it with useWorkspaceEntry().
 */

export interface WorkspaceEntryState {
  /** Where the user came from */
  from: "homepage";
  /** Contextual label shown briefly on arrival (EN) */
  context_en?: string;
  /** Contextual label shown briefly on arrival (AR) */
  context_ar?: string;
  /** Suggested tab/filter to activate */
  activeTab?: string;
  /** Entity type for context */
  entityType?: "project" | "quote" | "request" | "job" | "application" | "booking" | "course" | "lesson";
  /** Entity ID if deep-linking */
  entityId?: string;
  /** Timestamp to auto-dismiss arrival hints */
  ts?: number;
}

/** Build a WorkspaceEntryState for Link `state` prop */
export function buildEntryState(
  opts: Omit<WorkspaceEntryState, "from" | "ts">,
): WorkspaceEntryState {
  return { from: "homepage", ts: Date.now(), ...opts };
}
