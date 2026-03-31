/**
 * Talent Portal — Shared constants.
 */

export const JOB_STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600",
  draft: "bg-muted text-muted-foreground",
  paused: "bg-amber-500/10 text-amber-600",
  closed: "bg-destructive/10 text-destructive",
};

export const APPLICATION_STATUS_COLORS: Record<string, string> = {
  pending: "bg-blue-500/10 text-blue-600",
  reviewing: "bg-amber-500/10 text-amber-600",
  shortlisted: "bg-violet-500/10 text-violet-600",
  interview: "bg-primary/10 text-primary",
  offered: "bg-emerald-500/10 text-emerald-600",
  accepted: "bg-emerald-600/10 text-emerald-700",
  rejected: "bg-destructive/10 text-destructive",
  withdrawn: "bg-muted text-muted-foreground",
};

export const HIRE_STATUS_COLORS: Record<string, string> = {
  pending: "bg-blue-500/10 text-blue-600",
  accepted: "bg-emerald-500/10 text-emerald-600",
  rejected: "bg-destructive/10 text-destructive",
  in_progress: "bg-primary/10 text-primary",
  completed: "bg-emerald-600/10 text-emerald-700",
  cancelled: "bg-muted text-muted-foreground",
};

export const JOB_TYPES = [
  { value: "full-time", en: "Full-time", ar: "دوام كامل" },
  { value: "part-time", en: "Part-time", ar: "دوام جزئي" },
  { value: "contract", en: "Contract", ar: "عقد" },
  { value: "freelance", en: "Freelance", ar: "عمل حر" },
  { value: "internship", en: "Internship", ar: "تدريب" },
] as const;

export const EXPERIENCE_LEVELS = [
  { value: "junior", en: "Junior (0-2 yrs)", ar: "مبتدئ (0-2 سنوات)" },
  { value: "mid", en: "Mid-level (2-5 yrs)", ar: "متوسط (2-5 سنوات)" },
  { value: "senior", en: "Senior (5+ yrs)", ar: "خبير (5+ سنوات)" },
  { value: "lead", en: "Lead / Principal", ar: "قائد فريق" },
] as const;

export function formatStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
