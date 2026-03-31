/**
 * Route configuration helpers.
 * Reduces route boilerplate by defining portal routes as data.
 */
import { lazy, ComponentType, LazyExoticComponent } from "react";

export interface PortalRouteConfig {
  path: string;
  component: LazyExoticComponent<ComponentType<any>>;
}

// ── Enterprise Portal ──
export const enterpriseRoutes: PortalRouteConfig[] = [
  { path: "/enterprise/portal", component: lazy(() => import("@/portals/enterprise/pages/EnterpriseDashboard")) },
  { path: "/enterprise/portal/requests/new", component: lazy(() => import("@/portals/enterprise/pages/EnterpriseNewRequest")) },
  { path: "/enterprise/portal/requests", component: lazy(() => import("@/portals/enterprise/pages/EnterpriseRequests")) },
  { path: "/enterprise/portal/projects", component: lazy(() => import("@/portals/enterprise/pages/EnterpriseProjects")) },
  { path: "/enterprise/portal/projects/:id", component: lazy(() => import("@/portals/enterprise/pages/EnterpriseProjectDetail")) },
  { path: "/enterprise/portal/quotes", component: lazy(() => import("@/portals/enterprise/pages/EnterpriseQuotes")) },
  { path: "/enterprise/portal/quotes/:id", component: lazy(() => import("@/portals/enterprise/pages/EnterpriseQuoteDetail")) },
  { path: "/enterprise/portal/billing", component: lazy(() => import("@/portals/enterprise/pages/EnterpriseBilling")) },
  { path: "/enterprise/portal/documents", component: lazy(() => import("@/portals/enterprise/pages/EnterpriseDocuments")) },
  { path: "/enterprise/portal/settings", component: lazy(() => import("@/portals/enterprise/pages/EnterpriseSettings")) },
  { path: "/enterprise/portal/company-profile", component: lazy(() => import("@/portals/enterprise/pages/EnterpriseCompanyProfile")) },
];

// ── Talent Portal (Company side) ──
export const talentCompanyRoutes: PortalRouteConfig[] = [
  { path: "/talent/portal/company", component: lazy(() => import("@/portals/talent/pages/TalentCompanyDashboard")) },
  { path: "/talent/portal/company/jobs", component: lazy(() => import("@/portals/talent/pages/TalentCompanyJobs")) },
  { path: "/talent/portal/company/jobs/:id", component: lazy(() => import("@/portals/talent/pages/TalentCompanyJobDetail")) },
  { path: "/talent/portal/company/applications", component: lazy(() => import("@/portals/talent/pages/TalentCompanyApplications")) },
  { path: "/talent/portal/company/browse", component: lazy(() => import("@/portals/talent/pages/TalentCompanyBrowse")) },
  { path: "/talent/portal/company/shortlists", component: lazy(() => import("@/portals/talent/pages/TalentCompanyShortlists")) },
  { path: "/talent/portal/company/hires", component: lazy(() => import("@/portals/talent/pages/TalentCompanyHires")) },
  { path: "/talent/portal/company/team", component: lazy(() => import("@/portals/talent/pages/TalentCompanyTeam")) },
  { path: "/talent/portal/company/settings", component: lazy(() => import("@/portals/talent/pages/TalentSettings")) },
];

// ── Talent Portal (Freelancer side) ──
export const talentFreelancerRoutes: PortalRouteConfig[] = [
  { path: "/talent/portal", component: lazy(() => import("@/portals/talent/pages/TalentRouterPage")) },
  { path: "/talent/portal/freelancer", component: lazy(() => import("@/portals/talent/pages/TalentFreelancerDashboard")) },
  { path: "/talent/portal/freelancer/jobs", component: lazy(() => import("@/portals/talent/pages/TalentFreelancerJobs")) },
  { path: "/talent/portal/freelancer/jobs/:id", component: lazy(() => import("@/portals/talent/pages/TalentFreelancerJobView")) },
  { path: "/talent/portal/freelancer/applications", component: lazy(() => import("@/portals/talent/pages/TalentFreelancerApplications")) },
  { path: "/talent/portal/freelancer/portfolio", component: lazy(() => import("@/portals/talent/pages/TalentFreelancerPortfolio")) },
  { path: "/talent/portal/freelancer/profile", component: lazy(() => import("@/portals/talent/pages/TalentFreelancerProfile")) },
  { path: "/talent/portal/freelancer/settings", component: lazy(() => import("@/portals/talent/pages/TalentSettings")) },
];

// ── Consulting Portal ──
export const consultingRoutes: PortalRouteConfig[] = [
  { path: "/consulting/portal", component: lazy(() => import("@/portals/consulting/pages/ConsultingDashboard")) },
  { path: "/consulting/portal/bookings", component: lazy(() => import("@/portals/consulting/pages/ConsultingBookings")) },
  { path: "/consulting/portal/availability", component: lazy(() => import("@/portals/consulting/pages/ConsultingAvailability")) },
  { path: "/consulting/portal/earnings", component: lazy(() => import("@/portals/consulting/pages/ConsultingEarnings")) },
  { path: "/consulting/portal/profile", component: lazy(() => import("@/portals/consulting/pages/ConsultingProfileEdit")) },
  { path: "/consulting/portal/sessions", component: lazy(() => import("@/portals/consulting/pages/ConsultingClientSessions")) },
  { path: "/consulting/portal/history", component: lazy(() => import("@/portals/consulting/pages/ConsultingHistory")) },
  { path: "/consulting/portal/settings", component: lazy(() => import("@/portals/consulting/pages/ConsultingSettings")) },
];

// ── Academy Portal (student workspace only) ──
// NOTE: /academy/portal/create, /students, /lessons, /earnings are NOT owned here.
// They exist as redirect-only compat routes in App.tsx → /instructor/workspace/*.
export const academyRoutes: PortalRouteConfig[] = [
  { path: "/academy/portal", component: lazy(() => import("@/portals/academy/pages/AcademyDashboard")) },
  { path: "/academy/portal/courses", component: lazy(() => import("@/portals/academy/pages/AcademyCourses")) },
  { path: "/academy/portal/progress", component: lazy(() => import("@/portals/academy/pages/AcademyProgress")) },
  { path: "/academy/portal/certificates", component: lazy(() => import("@/portals/academy/pages/AcademyCertificates")) },
  { path: "/academy/portal/settings", component: lazy(() => import("@/portals/academy/pages/AcademySettings")) },
  { path: "/academy/portal/talent-profile", component: lazy(() => import("@/portals/academy/pages/AcademyTalentProfile")) },
];

// ── Instructor Workspace (canonical instructor operations) ──
export const instructorWorkspaceRoutes: PortalRouteConfig[] = [
  { path: "/instructor/workspace", component: lazy(() => import("@/portals/academy/pages/AcademyInstructorDashboard")) },
  { path: "/instructor/workspace/courses", component: lazy(() => import("@/portals/academy/pages/InstructorWorkspaceCourses")) },
  { path: "/instructor/workspace/courses/new", component: lazy(() => import("@/portals/academy/pages/AcademyCourseCreate")) },
  { path: "/instructor/workspace/students", component: lazy(() => import("@/portals/academy/pages/AcademyStudents")) },
  { path: "/instructor/workspace/lessons", component: lazy(() => import("@/portals/academy/pages/AcademyLessons")) },
  { path: "/instructor/workspace/earnings", component: lazy(() => import("@/portals/academy/pages/AcademyEarnings")) },
  { path: "/instructor/workspace/settings", component: lazy(() => import("@/portals/academy/pages/AcademySettings")) },
  { path: "/instructor/workspace/courses/:id/edit", component: lazy(() => import("@/pages/instructor/InstructorCourseEdit")) },
  { path: "/instructor/workspace/courses/:id/students", component: lazy(() => import("@/pages/instructor/InstructorStudents")) },
  { path: "/instructor/workspace/courses/:id/lessons", component: lazy(() => import("@/pages/instructor/InstructorLessons")) },
  { path: "/instructor/workspace/courses/:id/structure", component: lazy(() => import("@/pages/instructor/InstructorCourseStructure")) },
  { path: "/instructor/workspace/courses/:id/delivery", component: lazy(() => import("@/pages/instructor/InstructorCourseDelivery")) },
];

// ── Backoffice Portal ──
const AdminBlog = lazy(() => import("@/pages/admin/AdminBlog"));
const AdminPortfolio = lazy(() => import("@/pages/admin/AdminPortfolio"));
const AdminTeam = lazy(() => import("@/pages/admin/AdminTeam"));
const AdminContacts = lazy(() => import("@/pages/admin/AdminContacts"));
const AdminExperts = lazy(() => import("@/pages/admin/AdminExperts"));
const AdminBookings = lazy(() => import("@/pages/admin/AdminBookings"));
const AdminMedia = lazy(() => import("@/pages/admin/AdminMedia"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));
const AdminServices = lazy(() => import("@/pages/admin/AdminServices"));
const AdminTraining = lazy(() => import("@/pages/admin/AdminTraining"));
const AdminHiring = lazy(() => import("@/pages/admin/AdminHiring"));
const AdminGallery = lazy(() => import("@/pages/admin/AdminGallery"));
const AdminTestimonials = lazy(() => import("@/pages/admin/AdminTestimonials"));
const AdminNotifications = lazy(() => import("@/pages/admin/AdminNotifications"));
const AdminPayments = lazy(() => import("@/pages/admin/AdminPayments"));
const AdminInstructorApps = lazy(() => import("@/pages/admin/AdminInstructorApps"));
const AdminServiceRequests = lazy(() => import("@/pages/admin/AdminServiceRequests"));
const AdminQuotes = lazy(() => import("@/pages/admin/AdminQuotes"));
const AdminQuoteBuilder = lazy(() => import("@/pages/admin/AdminQuoteBuilder"));
const AdminProjects = lazy(() => import("@/pages/admin/AdminProjects"));
const AdminProjectDetail = lazy(() => import("@/pages/admin/AdminProjectDetail"));
const AdminEngagements = lazy(() => import("@/pages/admin/AdminEngagements"));

export const backofficeRoutes: PortalRouteConfig[] = [
  { path: "/admin", component: lazy(() => import("@/portals/backoffice/pages/BackofficeDashboard")) },
  { path: "/admin/analytics", component: lazy(() => import("@/portals/backoffice/pages/BackofficeAnalytics")) },
  { path: "/admin/organizations", component: lazy(() => import("@/portals/backoffice/pages/BackofficeOrganizations")) },
  { path: "/admin/roles", component: lazy(() => import("@/portals/backoffice/pages/BackofficeRoles")) },
  { path: "/admin/settings", component: lazy(() => import("@/portals/backoffice/pages/BackofficeSettings")) },
  { path: "/admin/blog", component: AdminBlog },
  { path: "/admin/portfolio", component: AdminPortfolio },
  { path: "/admin/team", component: AdminTeam },
  { path: "/admin/contacts", component: AdminContacts },
  { path: "/admin/experts", component: AdminExperts },
  { path: "/admin/bookings", component: AdminBookings },
  { path: "/admin/media", component: AdminMedia },
  { path: "/admin/users", component: AdminUsers },
  { path: "/admin/services", component: AdminServices },
  { path: "/admin/training", component: AdminTraining },
  { path: "/admin/hiring", component: AdminHiring },
  { path: "/admin/gallery", component: AdminGallery },
  { path: "/admin/testimonials", component: AdminTestimonials },
  { path: "/admin/notifications", component: AdminNotifications },
  { path: "/admin/payments", component: AdminPayments },
  { path: "/admin/instructor-applications", component: AdminInstructorApps },
  { path: "/admin/service-requests", component: AdminServiceRequests },
  { path: "/admin/quotes", component: AdminQuotes },
  { path: "/admin/quotes/new", component: AdminQuoteBuilder },
  { path: "/admin/quotes/:id/edit", component: AdminQuoteBuilder },
  { path: "/admin/projects", component: AdminProjects },
  { path: "/admin/projects/:id", component: AdminProjectDetail },
  { path: "/admin/engagements", component: AdminEngagements },
];
