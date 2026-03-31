/**
 * Academy Talent Bridge — Nomination Scopes & Statuses
 *
 * A "nomination" is a structured referral of a student toward
 * an opportunity. The scope defines the target audience;
 * the status tracks the lifecycle.
 */

// ── Nomination scopes ────────────────────────────────────────

export const NOMINATION_SCOPES = [
  "general_opportunity",
  "role_specific",
  "company_specific",
  "internal_pool",
] as const;

export type NominationScope = (typeof NOMINATION_SCOPES)[number];

export const NOMINATION_SCOPE_LABELS: Record<NominationScope, { en: string; ar: string }> = {
  general_opportunity: { en: "General Opportunity", ar: "فرصة عامة" },
  role_specific:       { en: "Role-Specific",       ar: "وظيفة محددة" },
  company_specific:    { en: "Company-Specific",    ar: "شركة محددة" },
  internal_pool:       { en: "Internal Pool",       ar: "مجموعة داخلية" },
};

export const NOMINATION_SCOPE_DESCRIPTIONS: Record<NominationScope, { en: string; ar: string }> = {
  general_opportunity: { en: "Open to any matching opportunity.",                ar: "مفتوح لأي فرصة مناسبة." },
  role_specific:       { en: "Targeted at a specific role or job posting.",      ar: "موجّه لوظيفة أو منصب محدد." },
  company_specific:    { en: "Directed to a particular company.",               ar: "موجّه لشركة بعينها." },
  internal_pool:       { en: "Added to an internal talent pool for later matching.", ar: "مضاف لمجموعة مواهب داخلية للمطابقة لاحقًا." },
};

// ── Nomination statuses ──────────────────────────────────────

export const NOMINATION_STATUSES = [
  "draft",
  "submitted",
  "accepted",
  "declined",
  "withdrawn",
  "archived",
] as const;

export type NominationStatus = (typeof NOMINATION_STATUSES)[number];

export const NOMINATION_STATUS_LABELS: Record<NominationStatus, { en: string; ar: string }> = {
  draft:     { en: "Draft",     ar: "مسودة" },
  submitted: { en: "Submitted", ar: "مُقدَّم" },
  accepted:  { en: "Accepted",  ar: "مقبول" },
  declined:  { en: "Declined",  ar: "مرفوض" },
  withdrawn: { en: "Withdrawn", ar: "مسحوب" },
  archived:  { en: "Archived",  ar: "مؤرشف" },
};

export const NOMINATION_STATUS_COLORS: Record<NominationStatus, string> = {
  draft:     "bg-muted text-muted-foreground",
  submitted: "bg-blue-500/10 text-blue-600",
  accepted:  "bg-emerald-500/10 text-emerald-600",
  declined:  "bg-destructive/10 text-destructive",
  withdrawn: "bg-amber-500/10 text-amber-600",
  archived:  "bg-muted text-muted-foreground",
};

/** True when the nomination is in a terminal (non-editable) state. */
export function isTerminalNominationStatus(status: NominationStatus): boolean {
  return status === "accepted" || status === "declined" || status === "archived";
}

/** Allowed transitions from each status. */
export const NOMINATION_STATUS_TRANSITIONS: Record<NominationStatus, NominationStatus[]> = {
  draft:     ["submitted", "archived"],
  submitted: ["accepted", "declined", "withdrawn"],
  accepted:  ["archived"],
  declined:  ["archived"],
  withdrawn: ["draft", "archived"],
  archived:  [],
};
