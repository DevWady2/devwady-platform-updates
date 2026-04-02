import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type CanonicalAccountType =
  | "freelancer"
  | "company"
  | "student"
  | "instructor"
  | "expert"
  | "admin";

export const normalizeAccountType = (value?: string | null): CanonicalAccountType | null => {
  const normalized = (value || "").trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "individual") return "freelancer";
  if (["freelancer", "company", "student", "instructor", "expert", "admin"].includes(normalized)) {
    return normalized as CanonicalAccountType;
  }
  return null;
};

export const normalizeBroadcastTarget = (value?: string | null) => {
  const normalized = (value || "").trim().toLowerCase();
  switch (normalized) {
    case "individuals": case "individual": case "freelancer": case "freelancers": return "freelancers";
    case "companies": case "company": return "companies";
    case "admins": case "admin": return "admins";
    case "experts": case "expert": return "experts";
    case "students": case "student": return "students";
    case "instructors": case "instructor": return "instructors";
    default: return normalized || "all";
  }
};

export const accountTypeLabel = (value?: string | null) => normalizeAccountType(value);

const DEFAULT_CAPABILITIES: Record<string, string[]> = {
  freelancer: ["apply_jobs", "receive_hires", "build_portfolio", "book_consultations", "browse_courses", "enroll_courses", "earn_from_platform"],
  company: ["post_jobs", "request_services", "manage_team", "track_projects", "book_consultations", "browse_courses"],
  student: ["browse_courses", "enroll_courses", "apply_jobs", "book_consultations"],
  instructor: ["create_courses", "browse_courses", "enroll_courses", "earn_from_platform"],
  expert: ["give_consultations", "browse_courses", "enroll_courses", "earn_from_platform"],
  admin: ["admin_backoffice", "browse_courses", "enroll_courses", "post_jobs", "request_services"],
};

export async function isAdminUser(adminClient: SupabaseClient, userId: string) {
  const { data, error } = await adminClient
    .from("profiles")
    .select("account_type, capabilities")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return false;
  const isAdminType = data.account_type === "admin";
  const hasBackoffice = Array.isArray(data.capabilities) && data.capabilities.includes("admin_backoffice");
  // Also check user_roles table
  const { data: roleData } = await adminClient.rpc("has_role", { _user_id: userId, _role: "admin" });
  return Boolean(isAdminType || hasBackoffice || roleData);
}

export function getDefaultCapabilities(_adminClient: SupabaseClient, accountType: string): string[] {
  return DEFAULT_CAPABILITIES[accountType] || [];
}

export async function getAdminUserIds(adminClient: SupabaseClient) {
  const { data, error } = await adminClient
    .from("profiles")
    .select("user_id")
    .eq("account_type", "admin");
  if (error) throw error;
  return [...new Set((data || []).map((row: any) => row.user_id).filter(Boolean))] as string[];
}

export type EnsureCanonicalProfileResult = {
  userId: string;
  requestedAccountType: CanonicalAccountType | null;
  currentAccountType: CanonicalAccountType | null;
  resolvedAccountType: CanonicalAccountType | null;
  conflict: boolean;
  updated: boolean;
};

export const buildAccountTypeConflictPayload = (result: Pick<EnsureCanonicalProfileResult, "userId" | "currentAccountType" | "requestedAccountType">) => ({
  success: false,
  error: "account_type_conflict",
  current_account_type: result.currentAccountType,
  requested_account_type: result.requestedAccountType,
  user_id: result.userId,
});

export async function ensureCanonicalProfile(
  adminClient: SupabaseClient,
  userId: string,
  desiredAccountType?: string | null,
  options?: { allowOverwrite?: boolean },
): Promise<EnsureCanonicalProfileResult> {
  const normalized = normalizeAccountType(desiredAccountType);
  if (!normalized) {
    return { userId, requestedAccountType: null, currentAccountType: null, resolvedAccountType: null, conflict: false, updated: false };
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("user_id, account_type, capabilities")
    .eq("user_id", userId)
    .maybeSingle();
  if (profileError) throw profileError;

  const currentAccountType = normalizeAccountType(profile?.account_type);
  if (currentAccountType && currentAccountType !== normalized && !options?.allowOverwrite) {
    return { userId, requestedAccountType: normalized, currentAccountType, resolvedAccountType: currentAccountType, conflict: true, updated: false };
  }

  const currentCapabilities = Array.isArray(profile?.capabilities) ? profile.capabilities.filter(Boolean) : [];
  const payload: Record<string, unknown> = {};

  if (!currentAccountType || options?.allowOverwrite) {
    payload.account_type = normalized;
  }

  if (currentCapabilities.length === 0 || options?.allowOverwrite) {
    payload.capabilities = getDefaultCapabilities(adminClient, normalized);
  }

  if (Object.keys(payload).length === 0) {
    return { userId, requestedAccountType: normalized, currentAccountType, resolvedAccountType: currentAccountType || normalized, conflict: false, updated: false };
  }

  const { error: upsertError } = await adminClient.from("profiles").upsert(
    { user_id: userId, ...payload },
    { onConflict: "user_id" },
  );
  if (upsertError) throw upsertError;

  return {
    userId,
    requestedAccountType: normalized,
    currentAccountType,
    resolvedAccountType: ((payload.account_type as string | undefined) || currentAccountType || normalized) as CanonicalAccountType,
    conflict: false,
    updated: true,
  };
}

export async function getAudienceUserIds(adminClient: SupabaseClient, target?: string | null) {
  const normalizedTarget = normalizeBroadcastTarget(target);

  if (normalizedTarget === "all") {
    const { data, error } = await adminClient.from("profiles").select("user_id");
    if (error) throw error;
    return [...new Set((data || []).map((row: any) => row.user_id).filter(Boolean))] as string[];
  }

  if (normalizedTarget === "admins") {
    return getAdminUserIds(adminClient);
  }

  const targetAccountType = normalizedTarget.endsWith("s") ? normalizedTarget.slice(0, -1) : normalizedTarget;
  const canonicalAccountType = normalizeAccountType(targetAccountType);
  if (!canonicalAccountType) return [] as string[];

  const { data, error } = await adminClient
    .from("profiles")
    .select("user_id")
    .eq("account_type", canonicalAccountType);
  if (error) throw error;

  return [...new Set((data || []).map((row: any) => row.user_id).filter(Boolean))] as string[];
}
