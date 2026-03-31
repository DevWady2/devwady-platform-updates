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

export const legacyRoleFromAccountType = (value?: string | null): string | null => {
  const normalized = normalizeAccountType(value);
  if (!normalized) return null;
  return normalized === "freelancer" ? "individual" : normalized;
};

export const normalizeBroadcastTarget = (value?: string | null) => {
  const normalized = (value || "").trim().toLowerCase();
  switch (normalized) {
    case "individuals":
    case "individual":
    case "freelancer":
    case "freelancers":
      return "freelancers";
    case "companies":
    case "company":
      return "companies";
    case "admins":
    case "admin":
      return "admins";
    case "experts":
    case "expert":
      return "experts";
    case "students":
    case "student":
      return "students";
    case "instructors":
    case "instructor":
      return "instructors";
    default:
      return normalized || "all";
  }
};

export const accountTypeLabel = (value?: string | null) => normalizeAccountType(value);

export async function isAdminUser(adminClient: SupabaseClient, userId: string) {
  const { data, error } = await adminClient.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });

  if (error) throw error;
  return !!data;
}

export async function getDefaultCapabilities(adminClient: SupabaseClient, accountType: string) {
  const { data, error } = await adminClient.rpc("default_capabilities_for_account_type", {
    _account_type: accountType,
  });

  if (error) throw error;
  return Array.isArray(data) ? data.filter(Boolean) : [];
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
    return {
      userId,
      requestedAccountType: null,
      currentAccountType: null,
      resolvedAccountType: null,
      conflict: false,
      updated: false,
    };
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("user_id, account_type, capabilities")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) throw profileError;

  const currentAccountType = normalizeAccountType(profile?.account_type);
  if (currentAccountType && currentAccountType !== normalized && !options?.allowOverwrite) {
    return {
      userId,
      requestedAccountType: normalized,
      currentAccountType,
      resolvedAccountType: currentAccountType,
      conflict: true,
      updated: false,
    };
  }

  const currentCapabilities = Array.isArray(profile?.capabilities) ? profile.capabilities.filter(Boolean) : [];
  const payload: Record<string, unknown> = {};

  if (!currentAccountType || options?.allowOverwrite) {
    payload.account_type = normalized;
  }

  if (currentCapabilities.length === 0 || options?.allowOverwrite) {
    payload.capabilities = await getDefaultCapabilities(adminClient, normalized);
  }

  if (Object.keys(payload).length === 0) {
    return {
      userId,
      requestedAccountType: normalized,
      currentAccountType,
      resolvedAccountType: currentAccountType || normalized,
      conflict: false,
      updated: false,
    };
  }

  const { error: upsertError } = await adminClient.from("profiles").upsert(
    {
      user_id: userId,
      ...payload,
    },
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

export async function syncLegacyRoleBridge(
  adminClient: SupabaseClient,
  userId: string,
  desiredAccountType?: string | null,
) {
  const legacyRole = legacyRoleFromAccountType(desiredAccountType);
  if (!legacyRole) {
    return { synced: false, reason: "no_legacy_role" };
  }

  const { data: roleRows, error: roleError } = await adminClient
    .from("user_roles")
    .select("id, role")
    .eq("user_id", userId);

  if (roleError) throw roleError;

  const nonAdminRoles = (roleRows || []).filter((row: any) => row.role !== "admin");
  const distinctRoles = [...new Set(nonAdminRoles.map((row: any) => row.role))];

  if (distinctRoles.length > 1) {
    return { synced: false, reason: "multiple_legacy_roles" };
  }

  if (distinctRoles.length === 0) {
    const { error: insertError } = await adminClient.from("user_roles").insert({
      user_id: userId,
      role: legacyRole as any,
    });

    if (insertError) throw insertError;
    return { synced: true, reason: "inserted" };
  }

  const currentRow = nonAdminRoles[0];
  if (currentRow?.role === legacyRole) {
    return { synced: true, reason: "already_synced" };
  }

  const { error: updateError } = await adminClient
    .from("user_roles")
    .update({ role: legacyRole as any })
    .eq("id", currentRow.id);

  if (updateError) throw updateError;
  return { synced: true, reason: "updated" };
}

async function getLegacyFallbackUserIds(
  adminClient: SupabaseClient,
  legacyRole: string,
) {
  const { data: roleRows, error: roleError } = await adminClient
    .from("user_roles")
    .select("user_id")
    .eq("role", legacyRole as any);

  if (roleError) throw roleError;

  const candidateIds = [...new Set((roleRows || []).map((row: any) => row.user_id).filter(Boolean))];
  if (candidateIds.length === 0) return [] as string[];

  const { data: profiles, error: profileError } = await adminClient
    .from("profiles")
    .select("user_id, account_type")
    .in("user_id", candidateIds);

  if (profileError) throw profileError;

  const profileMap = new Map((profiles || []).map((row: any) => [row.user_id, normalizeAccountType(row.account_type)]));

  return candidateIds.filter((userId) => {
    const canonical = profileMap.get(userId);
    return !canonical;
  });
}

export async function getAudienceUserIds(adminClient: SupabaseClient, target?: string | null) {
  const normalizedTarget = normalizeBroadcastTarget(target);

  if (normalizedTarget === "all") {
    const { data: profiles, error: profileError } = await adminClient.from("profiles").select("user_id");
    if (profileError) throw profileError;

    const { data: roleRows, error: roleError } = await adminClient.from("user_roles").select("user_id");
    if (roleError) throw roleError;

    return [...new Set([...(profiles || []).map((row: any) => row.user_id), ...(roleRows || []).map((row: any) => row.user_id)].filter(Boolean))];
  }

  if (normalizedTarget === "admins") {
    const { data: profiles, error: profileError } = await adminClient
      .from("profiles")
      .select("user_id")
      .eq("account_type", "admin");
    if (profileError) throw profileError;

    const fallbackIds = await getLegacyFallbackUserIds(adminClient, "admin");
    return [...new Set([...(profiles || []).map((row: any) => row.user_id), ...fallbackIds].filter(Boolean))];
  }

  const targetAccountType = normalizedTarget.endsWith("s") ? normalizedTarget.slice(0, -1) : normalizedTarget;
  const canonicalAccountType = normalizeAccountType(targetAccountType);
  if (!canonicalAccountType) return [] as string[];

  const { data: profiles, error: profileError } = await adminClient
    .from("profiles")
    .select("user_id")
    .eq("account_type", canonicalAccountType);

  if (profileError) throw profileError;

  const fallbackLegacyRole = legacyRoleFromAccountType(canonicalAccountType);
  const fallbackIds = fallbackLegacyRole
    ? await getLegacyFallbackUserIds(adminClient, fallbackLegacyRole)
    : [];

  return [...new Set([...(profiles || []).map((row: any) => row.user_id), ...fallbackIds].filter(Boolean))];
}
