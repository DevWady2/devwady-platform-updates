/**
 * Core Types — Shared interfaces for the DevWady platform.
 * Re-exports database row types and adds domain-level abstractions.
 */

// ── Shared Core entities ──
export type {
  Profile, Notification, Payment, PageView, ProfileView,
  ProfileInsert, ProfileUpdate,
} from "@/types/database";

// ── Public Content entities ──
export type {
  BlogPost, PortfolioProject, Service, Testimonial,
  MediaItem, GalleryPhoto, GalleryTimeline, ContactSubmission,
  ContactSubmissionInsert,
} from "@/types/database";

// ── Delivery entities ──
export type {
  ServiceRequest, Quote, Project, ProjectUpdate,
  ServiceRequestInsert,
  ProjectTracking, // deprecated alias
} from "@/types/database";

// ── Hiring entities ──
export type {
  CompanyProfile, CompanyTeamMember, CompanyReview,
  JobPosting, FeaturedJob, JobApplication, HireRequest,
  TalentShortlist, TalentPortfolioItem, TalentReview,
  CompanyProfileUpdate, JobApplicationInsert,
  // deprecated aliases for backward compat
  JobListing, FreelancerShortlist, FreelancerPortfolio, FreelancerReview,
} from "@/types/database";

// ── Consulting entities ──
export type {
  Expert, ExpertAvailability, Booking,
  BookingInsert, BookingUpdate,
  ConsultingExpert, ConsultingBooking, // deprecated aliases
} from "@/types/database";

// ── Academy entities ──
export type {
  Course, CourseModule, CourseLesson, Enrollment,
  CourseReview, CourseWebinar, LessonProgress, InstructorApplication,
  CourseMilestone, CourseAssessment, CourseProject,
  CourseCohort, CohortMembership, CourseSession, SessionAttendance,
  AssessmentAttempt, ProjectSubmission, ProjectReview,
  TrainingCourse, CourseEnrollment, // deprecated aliases
} from "@/types/database";

// ── Academy Talent Bridge entities ──
export type {
  AcademyTalentProfile, AcademyRecommendation, AcademyNomination,
  AcademyTalentProfileInsert, AcademyTalentProfileUpdate,
  AcademyRecommendationInsert, AcademyRecommendationUpdate,
  AcademyNominationInsert, AcademyNominationUpdate,
} from "@/types/database";

/** Canonical account identity (prefer this) */
export type AccountType = "freelancer" | "company" | "admin" | "expert" | "student" | "instructor";

export type ApprovalStatus = "auto_approved" | "pending_review" | "approved" | "rejected";
export type AccountStatus = "pending_verification" | "pending_approval" | "active" | "suspended" | "banned" | "deactivated";

export type Capability =
  | "browse_courses" | "enroll_courses" | "apply_jobs" | "post_jobs"
  | "receive_hires" | "build_portfolio" | "request_services"
  | "create_courses" | "give_consultations" | "book_consultations"
  | "track_projects" | "manage_team" | "earn_from_platform"
  | "admin_backoffice";

export const ACCOUNT_TYPE_VALUES = ["freelancer", "company", "admin", "expert", "student", "instructor"] as const satisfies readonly AccountType[];
export function normalizeAccountType(value?: string | null): AccountType | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "individual") return "freelancer";
  if ((ACCOUNT_TYPE_VALUES as readonly string[]).includes(normalized)) {
    return normalized as AccountType;
  }
  return null;
}

export const accountTypeLabels: Record<AccountType, { en: string; ar: string }> = {
  freelancer: { en: "Freelancer", ar: "مستقل" },
  company: { en: "Company", ar: "شركة" },
  admin: { en: "Admin", ar: "مشرف" },
  expert: { en: "Expert", ar: "خبير" },
  student: { en: "Student", ar: "طالب" },
  instructor: { en: "Instructor", ar: "مدرب" },
};

export function getAccountTypeLabel(accountType?: string | null, lang: "en" | "ar" = "en") {
  const normalized = normalizeAccountType(accountType);
  return normalized ? accountTypeLabels[normalized][lang] : null;
}

/** Portal ID */
export type PortalId = "public" | "enterprise" | "talent" | "consulting" | "academy" | "instructor" | "backoffice";

/** Generic paginated response */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/** Search/filter params */
export interface SearchParams {
  query?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: Record<string, string | string[] | boolean | number | null>;
}

/** Activity log entry */
export interface ActivityEntry {
  id: string;
  type: string;
  title_en: string;
  title_ar?: string;
  description_en?: string;
  description_ar?: string;
  actor_id?: string;
  actor_name?: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

/** Dashboard stat card */
export interface StatCard {
  label_en: string;
  label_ar: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: string;
  color?: "primary" | "success" | "warning" | "destructive" | "muted";
}

/** File/media upload result */
export interface UploadResult {
  url: string;
  path: string;
  bucket: string;
  size: number;
  mimeType: string;
}

/** Contact/request intake form data */
export interface IntakeFormData {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  category?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Shared status color maps used by 2+ portals.
 * Portal-specific status colors stay in their own constants.ts.
 */
export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  paid: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  refunded: "bg-primary/10 text-primary",
  failed: "bg-destructive/10 text-destructive",
};
