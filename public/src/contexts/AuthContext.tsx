import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { User, Session } from "@supabase/supabase-js";

/* ── Legacy role type (preserved for compatibility) ── */
type AppRole = "individual" | "company" | "admin" | "expert" | "student" | "instructor";

/* ── Canonical account model ── */
export type AccountType = "freelancer" | "company" | "admin" | "expert" | "student" | "instructor";
export type Capability =
  | "browse_courses" | "enroll_courses" | "apply_jobs" | "post_jobs"
  | "receive_hires" | "build_portfolio" | "request_services"
  | "create_courses" | "give_consultations" | "book_consultations"
  | "track_projects" | "manage_team" | "earn_from_platform"
  | "admin_backoffice";
export type ApprovalStatus = "auto_approved" | "pending_review" | "approved" | "rejected";
type AccountStatus = "pending_verification" | "pending_approval" | "active" | "suspended" | "banned" | "deactivated";

/* ── Mapping helpers ── */
function accountTypeFrom(legacyRole: AppRole): AccountType {
  if (legacyRole === "individual") return "freelancer";
  return legacyRole;
}

/** Convert canonical accountType back to legacy AppRole */
export function legacyRoleFrom(accountType: AccountType): AppRole {
  if (accountType === "freelancer") return "individual";
  return accountType;
}


function normalizeAccountType(value: string | null | undefined): AccountType | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized === "individual") return "freelancer";
  if (["freelancer", "company", "admin", "expert", "student", "instructor"].includes(normalized)) {
    return normalized as AccountType;
  }
  return null;
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

const DEFAULT_CAPABILITIES: Record<AccountType, Capability[]> = {
  freelancer: ["browse_courses", "enroll_courses", "apply_jobs", "receive_hires", "build_portfolio", "request_services", "book_consultations", "track_projects", "earn_from_platform"],
  company: ["browse_courses", "enroll_courses", "post_jobs", "request_services", "book_consultations", "track_projects", "manage_team"],
  student: ["browse_courses", "enroll_courses", "request_services", "book_consultations"],
  instructor: ["browse_courses", "create_courses", "earn_from_platform"],
  expert: ["browse_courses", "give_consultations", "earn_from_platform"],
  admin: ["admin_backoffice", "browse_courses", "enroll_courses", "apply_jobs", "post_jobs", "request_services", "book_consultations", "track_projects", "manage_team"],
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;

  /* ── Canonical fields (prefer these) ── */
  accountType: AccountType | null;
  capabilities: Capability[];
  approvalStatus: ApprovalStatus | null;
  badges: string[];
  entitlements: string[];

  /* ── Legacy fields (temporary compatibility shim) ── */
  /** @deprecated Use accountType instead. Maps: freelancer→individual, others 1:1 */
  role: AppRole | null;
  /** @deprecated Single-account model — this is always [role] or []. */
  roles: AppRole[];

  accountStatus: AccountStatus | null;
  isEmailVerified: boolean;

  signUp: (email: string, password: string, meta?: Record<string, string>) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;

  /** @deprecated Role switching is disabled in single-account model. Always throws. */
  switchRole: (newRole: AppRole) => Promise<void>;
  /** @deprecated Adding roles is disabled in single-account model. Always returns error. */
  addRole: (newRole: AppRole) => Promise<{ error: any }>;

  /** Check if user has a specific capability */
  hasCapability: (cap: Capability) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | null>(null);
  const [badges, setBadges] = useState<string[]>([]);
  const [entitlements, setEntitlements] = useState<string[]>([]);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const queryClient = useQueryClient();

  const role: AppRole | null = accountType ? legacyRoleFrom(accountType) : null;
  const roles: AppRole[] = role ? [role] : [];

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchRoleAndStatus(session.user.id), 0);
      } else {
        setAccountType(null);
        setCapabilities([]);
        setApprovalStatus(null);
        setBadges([]);
        setEntitlements([]);
        setAccountStatus(null);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchRoleAndStatus(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRoleAndStatus = async (userId: string): Promise<{ primaryRole: AppRole | null; roleList: AppRole[]; accountStatus: AccountStatus }> => {
    const [rolesResult, profileResult] = await Promise.all([
      supabase
        .from("user_roles")
        .select("role, is_primary")
        .eq("user_id", userId)
        .order("is_primary", { ascending: false }),
      supabase
        .from("profiles")
        .select("account_status, account_type, capabilities, approval_status, badges, entitlements")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    const allRoles = (rolesResult.data ?? []) as { role: AppRole; is_primary: boolean }[];
    const roleList = allRoles.map((r) => r.role);
    const primaryRole = allRoles.find((r) => r.is_primary)?.role ?? roleList[0] ?? null;

    const profile = profileResult.data;
    const canonicalAccountType = normalizeAccountType(profile?.account_type) ?? (primaryRole ? accountTypeFrom(primaryRole) : null);
    const status = (profile?.account_status as AccountStatus) ?? "active";
    const canonicalCapabilities = normalizeStringArray(profile?.capabilities) as Capability[];
    const resolvedCapabilities = canonicalCapabilities.length > 0
      ? canonicalCapabilities
      : (canonicalAccountType ? (DEFAULT_CAPABILITIES[canonicalAccountType] ?? []) : []);
    const resolvedApprovalStatus = (profile?.approval_status as ApprovalStatus | null) ?? (
      status === "pending_approval"
        ? "pending_review"
        : (status === "active" && canonicalAccountType)
          ? "approved"
          : null
    );

    setAccountType(canonicalAccountType);
    setCapabilities(resolvedCapabilities);
    setApprovalStatus(resolvedApprovalStatus);
    setBadges(normalizeStringArray(profile?.badges));
    setEntitlements(normalizeStringArray(profile?.entitlements));
    setAccountStatus(status);

    return { primaryRole, roleList, accountStatus: status };
  };

  const isEmailVerified = Boolean(user?.email_confirmed_at);

  const signUp = async (email: string, password: string, meta?: Record<string, string>) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: meta, emailRedirectTo: window.location.origin },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    setAccountType(null);
    setCapabilities([]);
    setApprovalStatus(null);
    setBadges([]);
    setEntitlements([]);
    setAccountStatus(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };

  /** @deprecated Hard-disabled in single-account model */
  const switchRole = useCallback(async (_newRole: AppRole) => {
    throw new Error("Role switching is disabled. The platform now uses a single canonical account model.");
  }, []);

  /** @deprecated Hard-disabled in single-account model */
  const addRole = useCallback(async (_newRole: AppRole) => {
    return { error: new Error("Adding roles is disabled. The platform now uses a single canonical account model.") };
  }, []);

  const hasCapability = useCallback((cap: Capability) => {
    return capabilities.includes(cap);
  }, [capabilities]);

  return (
    <AuthContext.Provider value={{
      user, session, loading,
      accountType, capabilities, approvalStatus, badges, entitlements,
      role, roles, accountStatus, isEmailVerified,
      signUp, signIn, signOut, resetPassword, updatePassword,
      switchRole, addRole, hasCapability,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
