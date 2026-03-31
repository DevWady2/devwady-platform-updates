/**
 * Guards barrel export.
 * AuthGuard and RoleGuard live in src/components/auth/ (single source of truth).
 * PortalGuard is the portal-level composite guard.
 */
export { default as AuthGuard } from "@/components/auth/AuthGuard";
export { default as RoleGuard } from "@/components/auth/RoleGuard";
export { default as PortalGuard } from "./PortalGuard";
