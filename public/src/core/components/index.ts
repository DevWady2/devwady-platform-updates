/**
 * Core components barrel export.
 * Import from "@/core/components" for shared UI modules.
 */
export { default as StatCardGrid } from "./StatCardGrid";
export { default as NotificationCenter } from "./NotificationCenter";
export { default as ActivityFeed } from "./ActivityFeed";
export { default as SearchFilterBar } from "./SearchFilterBar";
export { default as ProfileCard } from "./ProfileCard";
export { default as MediaManager } from "./MediaManager";
export { default as ContactIntakeForm } from "./ContactIntakeForm";
export { default as EmptyState } from "./EmptyState";
export { default as PageHeader } from "./PageHeader";
export { default as DataTable } from "./DataTable";
export { default as StatusBadge } from "./StatusBadge";
export { default as DashboardSection } from "./DashboardSection";
export { default as PortalDashboardPlaceholder } from "./PortalDashboardPlaceholder";
export { default as PortalSkeleton } from "./PortalSkeleton";
export { default as PortalErrorBoundary } from "./PortalErrorBoundary";
export { default as PortalBreadcrumb } from "./PortalBreadcrumb";
export { default as PortalNotificationBell } from "./PortalNotificationBell";
export { default as PortalQuickBar } from "./PortalQuickBar";
export { default as FocusBlock } from "./FocusBlock";

// Re-export types used by consumers
export type { DataTableColumn } from "./DataTable";
