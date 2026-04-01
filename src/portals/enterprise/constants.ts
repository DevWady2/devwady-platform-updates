/**
 * Enterprise Portal — Shared constants.
 * Single source of truth for status colors, service types, and select options.
 */

/** Project status → badge color classes */
export const PROJECT_STATUS_COLORS: Record<string, string> = {
  planning: "bg-blue-500/10 text-blue-600",
  in_progress: "bg-primary/10 text-primary",
  review: "bg-amber-500/10 text-amber-600",
  completed: "bg-emerald-500/10 text-emerald-600",
  on_hold: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

/** Service request status → badge color classes */
export const REQUEST_STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-600",
  in_review: "bg-amber-500/10 text-amber-600",
  quoted: "bg-primary/10 text-primary",
  approved: "bg-emerald-500/10 text-emerald-600",
  in_progress: "bg-violet-500/10 text-violet-600",
  completed: "bg-emerald-600/10 text-emerald-700",
  cancelled: "bg-destructive/10 text-destructive",
};

/** Quote status → badge color classes */
export const QUOTE_STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/10 text-blue-600",
  viewed: "bg-amber-500/10 text-amber-600",
  approved: "bg-emerald-500/10 text-emerald-600",
  rejected: "bg-destructive/10 text-destructive",
  expired: "bg-muted text-muted-foreground",
};

/** Payment status → badge color classes */
export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  paid: "bg-emerald-500/10 text-emerald-600",
  pending: "bg-amber-500/10 text-amber-600",
  failed: "bg-destructive/10 text-destructive",
  refunded: "bg-muted text-muted-foreground",
};

/** Service types for the new-request form */
export const SERVICE_TYPES = [
  { value: "web_app", en: "Web Application", ar: "تطبيق ويب" },
  { value: "mobile_app", en: "Mobile Application", ar: "تطبيق جوال" },
  { value: "enterprise_system", en: "Enterprise System", ar: "نظام مؤسسي" },
  { value: "uiux_design", en: "UI/UX Design", ar: "تصميم واجهات" },
  { value: "qa_testing", en: "QA & Testing", ar: "ضمان الجودة" },
  { value: "devops", en: "DevOps & Infrastructure", ar: "بنية تحتية" },
  { value: "consulting", en: "Technical Consulting", ar: "استشارات تقنية" },
  { value: "support", en: "Maintenance & Support", ar: "صيانة ودعم" },
  { value: "other", en: "Other", ar: "أخرى" },
] as const;

export const BUDGET_RANGES = [
  { value: "under_5k", en: "Under $5,000", ar: "أقل من 5,000$" },
  { value: "5k_15k", en: "$5,000 – $15,000", ar: "5,000$ – 15,000$" },
  { value: "15k_50k", en: "$15,000 – $50,000", ar: "15,000$ – 50,000$" },
  { value: "50k_plus", en: "$50,000+", ar: "أكثر من 50,000$" },
  { value: "undecided", en: "Not sure yet", ar: "لم أحدد بعد" },
] as const;

export const TIMELINES = [
  { value: "asap", en: "ASAP", ar: "في أقرب وقت" },
  { value: "1_month", en: "Within 1 month", ar: "خلال شهر" },
  { value: "1_3_months", en: "1–3 months", ar: "1–3 أشهر" },
  { value: "3_6_months", en: "3–6 months", ar: "3–6 أشهر" },
  { value: "flexible", en: "Flexible", ar: "مرن" },
] as const;

/** Human-readable label for a status string */
export function formatStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
