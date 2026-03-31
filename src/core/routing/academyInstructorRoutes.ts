/**
 * Academy + Instructor Route Map
 * ──────────────────────────────
 * Single source of truth for all routes owned by the Academy business unit
 * and the Instructor professional role.
 *
 * Four route families:
 *   1. Academy Public    — marketing / catalog pages (no auth)
 *   2. Academy Student   — student workspace portal (requires: student | admin)
 *   3. Instructor Pro    — website-first professional pages (requires: instructor | admin)
 *   4. Instructor Work   — internal workspace portal (requires: instructor | admin)
 */

// ─── 1. Academy Public Layer ────────────────────────────────────────────────
// Owner: public website — no authentication required.
// These pages expose the course catalog, landing content, and entry points.
export const ACADEMY_PUBLIC = {
  landing:          "/academy",
  courses:          "/academy/courses",
  courseDetail:     "/academy/courses/:slug",
  becomeInstructor: "/become-instructor",
  auth:             "/auth/academy",
} as const;

// ─── 2. Academy Student Workspace ───────────────────────────────────────────
// Owner: student portal — requires `student` or `admin` role.
// Provides enrolled-course management, progress tracking, and certificates.
export const ACADEMY_STUDENT = {
  dashboard:    "/academy/portal",
  courses:      "/academy/portal/courses",
  progress:     "/academy/portal/progress",
  certificates: "/academy/portal/certificates",
  settings:     "/academy/portal/settings",
  talentProfile: "/academy/portal/talent-profile",
  /** Course learning view (outside portal shell) */
  learn:        "/learn/:slug",
} as const;

// ─── 3. Instructor Professional Website Layer ───────────────────────────────
// Owner: instructor website-first pages — requires `instructor` or `admin` role.
// Lightweight operational pages that live in the public website shell,
// NOT inside a portal sidebar layout.
export const INSTRUCTOR_PRO = {
  dashboard:  "/instructor/dashboard",
  courses:    "/instructor/courses",
  courseDetail: "/instructor/courses/:slug",
  jobs:       "/instructor/jobs",
  questions:  "/instructor/questions",
  assistants: "/instructor/assistants",
} as const;

// ─── 4. Instructor Internal Workspace ───────────────────────────────────────
// Owner: instructor portal — requires `instructor` or `admin` role.
// Full workspace with sidebar for course creation, student management,
// lesson editing, and earnings.
export const INSTRUCTOR_WORKSPACE = {
  root:              "/instructor/workspace",
  courses:           "/instructor/workspace/courses",
  courseNew:          "/instructor/workspace/courses/new",
  courseEdit:         "/instructor/workspace/courses/:id/edit",
  courseStudents:     "/instructor/workspace/courses/:id/students",
  courseLessons:     "/instructor/workspace/courses/:id/lessons",
  courseStructure:    "/instructor/workspace/courses/:id/structure",
  courseDelivery:     "/instructor/workspace/courses/:id/delivery",
  students:          "/instructor/workspace/students",
  lessons:           "/instructor/workspace/lessons",
  earnings:          "/instructor/workspace/earnings",
  settings:          "/instructor/workspace/settings",
} as const;

// ─── Helpers ────────────────────────────────────────────────────────────────

/** All academy public paths (useful for navbar / footer config) */
export const ACADEMY_PUBLIC_PATHS = Object.values(ACADEMY_PUBLIC);

/** All student workspace paths */
export const ACADEMY_STUDENT_PATHS = Object.values(ACADEMY_STUDENT);

/** All instructor professional paths */
export const INSTRUCTOR_PRO_PATHS = Object.values(INSTRUCTOR_PRO);

/** All instructor workspace paths */
export const INSTRUCTOR_WORKSPACE_PATHS = Object.values(INSTRUCTOR_WORKSPACE);

/** Check if a path belongs to the instructor professional layer */
export function isInstructorProPath(path: string): boolean {
  return path.startsWith("/instructor/") && !path.startsWith("/instructor/workspace");
}

/** Check if a path belongs to the instructor workspace */
export function isInstructorWorkspacePath(path: string): boolean {
  return path.startsWith("/instructor/workspace");
}

/** Check if a path belongs to the academy student workspace */
export function isAcademyStudentPath(path: string): boolean {
  return path.startsWith("/academy/portal");
}

/** Check if a path belongs to the academy public layer */
export function isAcademyPublicPath(path: string): boolean {
  return (
    path === ACADEMY_PUBLIC.landing ||
    path.startsWith("/academy/courses") ||
    path === ACADEMY_PUBLIC.becomeInstructor ||
    path === ACADEMY_PUBLIC.auth
  );
}
