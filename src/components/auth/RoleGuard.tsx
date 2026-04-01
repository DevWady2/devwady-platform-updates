import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import type { AccountType, Capability } from "@/core/types";

interface Props {
  children: ReactNode;
  /** Canonical access list (preferred) */
  allowedAccountTypes?: AccountType[];
  /** Optional capability hints for transition-safe access checks */
  allowedCapabilities?: Capability[];
  fallbackPath?: string;
}

export default function RoleGuard({
  children,
  allowedAccountTypes = [],
  allowedCapabilities = [],
  fallbackPath = "/",
}: Props) {
  const { accountType, capabilities, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }


  const hasCanonicalAccess = Boolean(
    accountType && allowedAccountTypes.includes(accountType)
  );

  const hasCapabilityAccess = allowedCapabilities.some((cap) => capabilities.includes(cap));


  if (!hasCanonicalAccess && !hasCapabilityAccess) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}
