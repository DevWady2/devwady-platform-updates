/**
 * PortalGuard — Checks authentication & account access for a portal.
 * Wraps portal layouts to enforce access rules from the registry.
 *
 * Logic:
 *  1. If requiresAuth and no user → redirect to login
 *  2. Access is evaluated canonically via accountType first, then optional capability hints.
 *     Legacy role fallback is used only when canonical identity is unavailable.
 *  3. Authenticated users pass through AccountStatusGate
 *  4. Public access (no auth required) → pass through
 */
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { canAccessPortal, type PortalConfig } from "@/core/portals/registry";
import AccountStatusGate from "@/components/auth/AccountStatusGate";

interface PortalGuardProps {
  portal: PortalConfig;
  children: ReactNode;
}

export default function PortalGuard({ portal, children }: PortalGuardProps) {
  const { user, loading, accountType, capabilities, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 1. Auth required but user not logged in
  if (portal.requiresAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Canonical-first access check
  const portalDefinesAccess =
    portal.allowedAccountTypes.length > 0 ||
    (portal.allowedCapabilities?.length ?? 0) > 0 ||
    portal.allowedRoles.length > 0;

  if (user && portalDefinesAccess && !canAccessPortal(portal, { accountType, capabilities, role })) {
    return <Navigate to="/" replace />;
  }

  // 3. Authenticated users go through account status check
  if (user) {
    return <AccountStatusGate>{children}</AccountStatusGate>;
  }

  // 4. Public access (no auth required, no user)
  return <>{children}</>;
}
