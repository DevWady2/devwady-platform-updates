/**
 * useWorkspaceEntry — Reads arrival context from route state.
 * Auto-clears after display so refresh doesn't re-show the hint.
 */
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { WorkspaceEntryState } from "@/lib/workspaceEntry";

const STALE_MS = 30_000; // ignore context older than 30s

export function useWorkspaceEntry() {
  const location = useLocation();
  const navigate = useNavigate();
  const cleared = useRef(false);

  const raw = location.state as WorkspaceEntryState | undefined;
  const isValid = raw?.from === "homepage" && raw.ts && Date.now() - raw.ts < STALE_MS;

  const [entry] = useState<WorkspaceEntryState | null>(isValid ? raw! : null);

  // Clear route state on mount so refresh won't re-show
  useEffect(() => {
    if (entry && !cleared.current) {
      cleared.current = true;
      navigate(location.pathname + location.search, { replace: true, state: undefined });
    }
  }, [entry, navigate, location.pathname, location.search]);

  return entry;
}
