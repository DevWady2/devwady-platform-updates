/**
 * Typed interfaces extracted from Supabase Row types.
 * Grouped by domain boundary for clarity.
 *
 * Domain Map:
 *   Shared Core    — profiles, notifications, payments, page/profile views
 *   Public Content — blog, portfolio, services, testimonials, media, gallery, contacts
 *   Delivery       — service_requests, quotes, project_tracking, project_updates
 *   Hiring         — companies, jobs, applications, hires, shortlists, reviews
 *   Consulting     — experts, availability, bookings
 *   Academy        — courses, modules, lessons, enrollments, progress, instructor apps
 */
import type { Database } from "@/integrations/supabase/types";

// ── Shared Core ──────────────────────────────────────────────
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type PageView = Database["public"]["Tables"]["page_views"]["Row"];
export type ProfileView = Database["public"]["Tables"]["profile_views"]["Row"];

// ── Public Content (CMS) ────────────────────────────────────
export type BlogPost = Database["public"]["Tables"]["blog_posts"]["Row"];
export type PortfolioProject = Database["public"]["Tables"]["portfolio_projects"]["Row"];
export type Service = Database["public"]["Tables"]["services"]["Row"];
export type Testimonial = Database["public"]["Tables"]["testimonials"]["Row"];
export type MediaItem = Database["public"]["Tables"]["media_items"]["Row"];
export type GalleryPhoto = Database["public"]["Tables"]["gallery_photos"]["Row"];
export type GalleryTimeline = Database["public"]["Tables"]["gallery_timeline"]["Row"];
export type ContactSubmission = Database["public"]["Tables"]["contact_submissions"]["Row"];

// ── Delivery ─────────────────────────────────────────────────
export type ServiceRequest = Database["public"]["Tables"]["service_requests"]["Row"];
export type Quote = Database["public"]["Tables"]["quotes"]["Row"];
export type Project = Database["public"]["Tables"]["project_tracking"]["Row"];
export type ProjectUpdate = Database["public"]["Tables"]["project_updates"]["Row"];
/** @deprecated Use `Project` instead */
export type ProjectTracking = Project;

// ── Hiring ───────────────────────────────────────────────────
export type CompanyProfile = Database["public"]["Tables"]["company_profiles"]["Row"];
export type CompanyTeamMember = Database["public"]["Tables"]["company_team_members"]["Row"];
export type CompanyReview = Database["public"]["Tables"]["company_reviews"]["Row"];
export type JobPosting = Database["public"]["Tables"]["job_postings"]["Row"];
export type FeaturedJob = Database["public"]["Tables"]["job_listings"]["Row"];
/** @deprecated Use `FeaturedJob` instead */
export type JobListing = FeaturedJob;
export type JobApplication = Database["public"]["Tables"]["job_applications"]["Row"];
export type HireRequest = Database["public"]["Tables"]["hire_requests"]["Row"];
export type TalentShortlist = Database["public"]["Tables"]["freelancer_shortlists"]["Row"];
/** @deprecated Use `TalentShortlist` instead */
export type FreelancerShortlist = TalentShortlist;
export type TalentPortfolioItem = Database["public"]["Tables"]["freelancer_portfolio"]["Row"];
/** @deprecated Use `TalentPortfolioItem` instead */
export type FreelancerPortfolio = TalentPortfolioItem;
export type TalentReview = Database["public"]["Tables"]["freelancer_reviews"]["Row"];
/** @deprecated Use `TalentReview` instead */
export type FreelancerReview = TalentReview;

// ── Consulting ───────────────────────────────────────────────
export type Expert = Database["public"]["Tables"]["consulting_experts"]["Row"];
/** @deprecated Use `Expert` instead */
export type ConsultingExpert = Expert;
export type ExpertAvailability = Database["public"]["Tables"]["expert_availability"]["Row"];
export type Booking = Database["public"]["Tables"]["consulting_bookings"]["Row"];
/** @deprecated Use `Booking` instead */
export type ConsultingBooking = Booking;

// ── Academy ──────────────────────────────────────────────────
export type Course = Database["public"]["Tables"]["training_courses"]["Row"];
/** @deprecated Use `Course` instead */
export type TrainingCourse = Course;
export type CourseModule = Database["public"]["Tables"]["course_modules"]["Row"];
export type CourseLesson = Database["public"]["Tables"]["course_lessons"]["Row"];
export type Enrollment = Database["public"]["Tables"]["course_enrollments"]["Row"];
/** @deprecated Use `Enrollment` instead */
export type CourseEnrollment = Enrollment;
export type CourseReview = Database["public"]["Tables"]["course_reviews"]["Row"];
export type CourseWebinar = Database["public"]["Tables"]["course_webinars"]["Row"];
export type LessonProgress = Database["public"]["Tables"]["lesson_progress"]["Row"];
export type InstructorApplication = Database["public"]["Tables"]["instructor_applications"]["Row"];
export type CourseMilestone = Database["public"]["Tables"]["course_milestones"]["Row"];
export type CourseAssessment = Database["public"]["Tables"]["course_assessments"]["Row"];
export type CourseProject = Database["public"]["Tables"]["course_projects"]["Row"];
export type CourseCohort = Database["public"]["Tables"]["course_cohorts"]["Row"];
export type CohortMembership = Database["public"]["Tables"]["cohort_memberships"]["Row"];
export type CourseSession = Database["public"]["Tables"]["course_sessions"]["Row"];
export type SessionAttendance = Database["public"]["Tables"]["session_attendance"]["Row"];

export type AssessmentAttempt = Database["public"]["Tables"]["assessment_attempts"]["Row"];
export type ProjectSubmission = Database["public"]["Tables"]["project_submissions"]["Row"];
export type ProjectReview = Database["public"]["Tables"]["project_reviews"]["Row"];

// ── Academy Talent Bridge ────────────────────────────────────
export type AcademyTalentProfile = Database["public"]["Tables"]["academy_talent_profiles"]["Row"];
export type AcademyRecommendation = Database["public"]["Tables"]["academy_recommendations"]["Row"];
export type AcademyNomination = Database["public"]["Tables"]["academy_nominations"]["Row"];

export type AcademyTalentProfileInsert = Database["public"]["Tables"]["academy_talent_profiles"]["Insert"];
export type AcademyTalentProfileUpdate = Database["public"]["Tables"]["academy_talent_profiles"]["Update"];
export type AcademyRecommendationInsert = Database["public"]["Tables"]["academy_recommendations"]["Insert"];
export type AcademyRecommendationUpdate = Database["public"]["Tables"]["academy_recommendations"]["Update"];
export type AcademyNominationInsert = Database["public"]["Tables"]["academy_nominations"]["Insert"];
export type AcademyNominationUpdate = Database["public"]["Tables"]["academy_nominations"]["Update"];

// ── Insert Types ─────────────────────────────────────────────
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type BookingInsert = Database["public"]["Tables"]["consulting_bookings"]["Insert"];
/** @deprecated Use `BookingInsert` */
export type ConsultingBookingInsert = BookingInsert;
export type JobApplicationInsert = Database["public"]["Tables"]["job_applications"]["Insert"];
export type ServiceRequestInsert = Database["public"]["Tables"]["service_requests"]["Insert"];
export type ContactSubmissionInsert = Database["public"]["Tables"]["contact_submissions"]["Insert"];
export type TalentPortfolioItemInsert = Database["public"]["Tables"]["freelancer_portfolio"]["Insert"];
/** @deprecated Use `TalentPortfolioItemInsert` */
export type FreelancerPortfolioInsert = TalentPortfolioItemInsert;

// ── Update Types ─────────────────────────────────────────────
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
export type CompanyProfileUpdate = Database["public"]["Tables"]["company_profiles"]["Update"];
export type BookingUpdate = Database["public"]["Tables"]["consulting_bookings"]["Update"];
/** @deprecated Use `BookingUpdate` */
export type ConsultingBookingUpdate = BookingUpdate;
export type ProjectUpdate_ = Database["public"]["Tables"]["project_tracking"]["Update"];
/** @deprecated Use `ProjectUpdate_` */
export type ProjectTrackingUpdate = ProjectUpdate_;
