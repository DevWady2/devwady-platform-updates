/**
 * Consulting Portal — Shared constants.
 */

export const BOOKING_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600",
  payment_pending: "bg-orange-500/10 text-orange-600",
  confirmed: "bg-emerald-500/10 text-emerald-600",
  completed: "bg-blue-500/10 text-blue-600",
  cancelled: "bg-destructive/10 text-destructive",
  no_show: "bg-muted text-muted-foreground",
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  paid: "bg-emerald-500/10 text-emerald-600",
  unpaid: "bg-amber-500/10 text-amber-600",
  refunded: "bg-destructive/10 text-destructive",
};

export function formatStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const DAY_NAMES_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DAY_NAMES_AR = ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];
