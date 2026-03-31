import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import type { AccountType, AppRole, Capability } from "@/core/types";
import { toAccountType } from "@/core/types";

interface Props {
  children: ReactNode;
  /** Canonical access list (preferred) */
  allowedAccountTypes?: AccountType[];
  /** Optional capability hints for transition-safe access checks */
  allowedCapabilities?: Capability[];
  /** @deprecated Legacy alias — fallback only when canonical identity is unavailable */
  allowedRoles?: AppRole[];
  fallbackPath?: string;
}

export default function RoleGuard({
  children,
  allowedAccountTypes = [],
  allowedCapabilities = [],
  allowedRoles = [],
  fallbackPath = "/",
}: Props) {
  const { accountType, capabilities, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const canonicalAllowedAccountTypes = Array.from(new Set([
    ...allowedAccountTypes,
    ...allowedRoles.map((legacyRole) => toAccountType(legacyRole)),
  ]));

  const hasCanonicalAccess = Boolean(
    accountType && canonicalAllowedAccountTypes.includes(accountType)
  );

  const hasCapabilityAccess = allowedCapabilities.some((cap) => capabilities.includes(cap));

  const hasLegacyFallbackAccess = Boolean(
    !accountType && role && allowedRoles.includes(role)
  );

  if (!hasCanonicalAccess && !hasCapabilityAccess && !hasLegacyFallbackAccess) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}
