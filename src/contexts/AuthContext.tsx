import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { User, Session } from "@supabase/supabase-js";
import {
  normalizeAccountType,
  type AccountStatus,
  type AccountType,
  type ApprovalStatus,
  type Capability,
} from "@/core/types";

export type { AccountType, Capability } from "@/core/types";

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export const DEFAULT_CAPABILITIES: Record<AccountType, Capability[]> = {
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

  accountStatus: AccountStatus | null;
  isEmailVerified: boolean;

  signUp: (email: string, password: string, meta?: Record<string, string>) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;

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


  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          void fetchRoleAndStatus(session.user);
        }, 0);
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
        await fetchRoleAndStatus(session.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRoleAndStatus = async (authUser: User) => {
    const selection = "account_status, account_type, capabilities, approval_status, badges, entitlements";

    const readProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(selection)
        .eq("user_id", authUser.id)
        .maybeSingle();

      return { data, error };
    };

    let { data: profile } = await readProfile();

    if (!profile) {
      const metadata = (authUser.user_metadata ?? {}) as Record<string, unknown>;
      const fallbackAccountType = normalizeAccountType(
        typeof metadata.account_type === "string" ? metadata.account_type : null,
      );
      const fallbackFullName = typeof metadata.full_name === "string" ? metadata.full_name.trim() : "";
      const fallbackCapabilities = fallbackAccountType ? (DEFAULT_CAPABILITIES[fallbackAccountType] ?? []) : [];

      const { error: insertError } = await supabase.from("profiles").insert({
        user_id: authUser.id,
        full_name: fallbackFullName || null,
        account_type: fallbackAccountType,
        account_status: "active",
        capabilities: fallbackCapabilities,
      });

      if (!insertError) {
        const retry = await readProfile();
        profile = retry.data;
      }
    }

    const canonicalAccountType = normalizeAccountType(profile?.account_type);
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


  const hasCapability = useCallback((cap: Capability) => {
    return capabilities.includes(cap);
  }, [capabilities]);

  return (
    <AuthContext.Provider value={{
      user, session, loading,
      accountType, capabilities, approvalStatus, badges, entitlements,
      accountStatus, isEmailVerified,
      signUp, signIn, signOut, resetPassword, updatePassword,
      hasCapability,
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
