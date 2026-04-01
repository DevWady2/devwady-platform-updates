import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { AccountType } from "@/core/types";

/** The five focus areas a user can select */
export type ActiveFocus = "enterprise" | "talent" | "consulting" | "academy" | "explore";

/** How the user arrived / what they intend */
export type UserIntent = "build" | "hire" | "consult" | "learn" | "browse";

/** Where the user entered the site from */
export type EntryPoint = "direct" | "landing" | "referral" | "portal-return";

/** Maps focus → intent for convenience */
const FOCUS_INTENT_MAP: Record<ActiveFocus, UserIntent> = {
  enterprise: "build",
  talent: "hire",
  consulting: "consult",
  academy: "learn",
  explore: "browse",
};

const STORAGE_KEY = "devwady_experience";

const accountTypeToFocus: Partial<Record<AccountType, ActiveFocus>> = {
  company: "enterprise",
  freelancer: "talent",
  expert: "consulting",
  student: "academy",
  instructor: "academy",
  admin: "explore",
};

interface PersistedState {
  activeFocus: ActiveFocus;
  hasSelectedFocus: boolean;
}

function loadPersistedState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

function persistState(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable — silently fail
  }
}

export interface ExperienceContextType {
  /** Current active focus area */
  activeFocus: ActiveFocus;
  /** Derived intent from focus */
  userIntent: UserIntent;
  /** Entry point detection */
  entryPoint: EntryPoint;
  /** Whether the user has explicitly selected a focus */
  hasSelectedFocus: boolean;
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Whether this user is an admin (goes straight to backoffice) */
  isAdmin: boolean;
  /** Set the active focus and persist */
  setFocus: (focus: ActiveFocus) => void;
  /** Clear the selection (reset to explore) */
  clearFocus: () => void;
}

const ExperienceContext = createContext<ExperienceContextType | undefined>(undefined);

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const { user, accountType } = useAuth();

  // Load persisted state once
  const persisted = loadPersistedState();
  const [activeFocus, setActiveFocus] = useState<ActiveFocus>(persisted?.activeFocus ?? "explore");
  const [hasSelectedFocus, setHasSelectedFocus] = useState(persisted?.hasSelectedFocus ?? false);

  // Detect entry point (simple heuristic)
  const [entryPoint] = useState<EntryPoint>(() => {
    const ref = document.referrer;
    if (!ref) return "direct";
    try {
      const refHost = new URL(ref).hostname;
      if (refHost === window.location.hostname) return "portal-return";
      return "referral";
    } catch {
      return "direct";
    }
  });

  // For logged-in users, derive focus from accountType if they haven't chosen one
  useEffect(() => {
    if (!user || !accountType) return;
    if (hasSelectedFocus) return; // user already chose — respect that

    const derived = accountTypeToFocus[accountType] ?? "explore";
    setActiveFocus(derived);
  }, [user, accountType, hasSelectedFocus]);

  const setFocus = useCallback((focus: ActiveFocus) => {
    setActiveFocus(focus);
    setHasSelectedFocus(true);
    persistState({ activeFocus: focus, hasSelectedFocus: true });
  }, []);

  const clearFocus = useCallback(() => {
    setActiveFocus("explore");
    setHasSelectedFocus(false);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value: ExperienceContextType = {
    activeFocus,
    userIntent: FOCUS_INTENT_MAP[activeFocus],
    entryPoint,
    hasSelectedFocus,
    isAuthenticated: !!user,
    isAdmin: accountType === "admin",
    setFocus,
    clearFocus,
  };

  return (
    <ExperienceContext.Provider value={value}>
      {children}
    </ExperienceContext.Provider>
  );
}

export function useExperience() {
  const ctx = useContext(ExperienceContext);
  if (!ctx) throw new Error("useExperience must be used within ExperienceProvider");
  return ctx;
}
