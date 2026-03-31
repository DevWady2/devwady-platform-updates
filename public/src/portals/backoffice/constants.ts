/**
 * Backoffice — Shared constants for status colors and formatters.
 */
export const REQUEST_STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-600",
  in_review: "bg-amber-500/10 text-amber-600",
  quoted: "bg-violet-500/10 text-violet-600",
  in_progress: "bg-emerald-500/10 text-emerald-600",
  completed: "bg-emerald-500/10 text-emerald-600",
  cancelled: "bg-destructive/10 text-destructive",
  closed: "bg-muted text-muted-foreground",
};

/** @see PAYMENT_STATUS_COLORS in @/core/types for shared payment status colors */
export { PAYMENT_STATUS_COLORS } from "@/core/types";

export const ACCOUNT_STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600",
  pending_approval: "bg-amber-500/10 text-amber-600",
  suspended: "bg-destructive/10 text-destructive",
  blocked: "bg-destructive/10 text-destructive",
  deactivated: "bg-muted text-muted-foreground",
};

export function formatStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
