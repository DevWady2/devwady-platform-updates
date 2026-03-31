/**
 * Academy Learning Model — Common Statuses
 *
 * Shared status vocabulary used across courses, enrollments, and content items.
 */

// ── Course lifecycle ──

export const COURSE_STATUSES = ["draft", "published", "archived", "scheduled"] as const;
export type CourseStatus = (typeof COURSE_STATUSES)[number];

export const COURSE_STATUS_LABELS: Record<CourseStatus, { en: string; ar: string }> = {
  draft: { en: "Draft", ar: "مسودة" },
  published: { en: "Published", ar: "منشور" },
  archived: { en: "Archived", ar: "مؤرشف" },
  scheduled: { en: "Scheduled", ar: "مجدول" },
};

export const COURSE_STATUS_COLORS: Record<CourseStatus, string> = {
  published: "bg-emerald-500/10 text-emerald-600",
  draft: "bg-amber-500/10 text-amber-600",
  archived: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-500/10 text-blue-600",
};

// ── Enrollment lifecycle ──

export const ENROLLMENT_STATUSES = ["active", "completed", "cancelled", "pending"] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, { en: string; ar: string }> = {
  active: { en: "Active", ar: "نشط" },
  completed: { en: "Completed", ar: "مكتمل" },
  cancelled: { en: "Cancelled", ar: "ملغي" },
  pending: { en: "Pending", ar: "قيد الانتظار" },
};

export const ENROLLMENT_STATUS_COLORS: Record<EnrollmentStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-600",
  completed: "bg-blue-500/10 text-blue-600",
  cancelled: "bg-destructive/10 text-destructive",
  pending: "bg-amber-500/10 text-amber-600",
};

// ── Content-item status (lessons, assessments, etc.) ──

export const CONTENT_STATUSES = ["draft", "published", "archived"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];
