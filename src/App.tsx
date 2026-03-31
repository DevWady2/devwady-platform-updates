import { lazy, Suspense, createElement } from "react"; // portal-routes-v2
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { toast } from "sonner";

import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ExperienceProvider } from "@/contexts/ExperienceContext";
import Layout from "@/components/layout/Layout";
import ScrollToTop from "@/components/ScrollToTop";
import LoadingFallback from "@/components/LoadingFallback";
import AuthGuard from "./components/auth/AuthGuard";
import RoleGuard from "./components/auth/RoleGuard";
import ErrorBoundary from "./components/ErrorBoundary";
import Index from "./pages/Index";

// ── Portal route configs & layouts ──
import {
  enterpriseRoutes, talentCompanyRoutes, talentFreelancerRoutes,
  consultingRoutes, academyRoutes, backofficeRoutes, instructorWorkspaceRoutes,
  type PortalRouteConfig,
} from "@/routes/portalRoutes";

const EnterpriseLayout = lazy(() => import("@/portals/enterprise/EnterpriseLayout"));
const TalentLayout = lazy(() => import("@/portals/talent/TalentLayout"));
const ConsultingLayout = lazy(() => import("@/portals/consulting/ConsultingLayout"));
const AcademyLayout = lazy(() => import("@/portals/academy/AcademyLayout"));
const InstructorWorkspaceLayout = lazy(() => import("@/portals/instructor/InstructorWorkspaceLayout"));
const BackofficeLayout = lazy(() => import("@/portals/backoffice/BackofficeLayout"));

// ── Public pages (lazy) ──
const About = lazy(() => import("./pages/About"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Training = lazy(() => import("./pages/Training"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const Hiring = lazy(() => import("./pages/Hiring"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Team = lazy(() => import("./pages/Team"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Media = lazy(() => import("./pages/Media"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));
const FreelancerProfile = lazy(() => import("./pages/FreelancerProfile"));
const Consulting = lazy(() => import("./pages/Consulting"));
const ExpertProfile = lazy(() => import("./pages/ExpertProfile"));
const ConsultingRequest = lazy(() => import("./pages/ConsultingRequest"));
const ConsultingTrack = lazy(() => import("./pages/ConsultingTrack"));
const MemberProfile = lazy(() => import("./pages/MemberProfile"));
const Companies = lazy(() => import("./pages/Companies"));
const CompanyPublicProfile = lazy(() => import("./pages/CompanyPublicProfile"));
const Join = lazy(() => import("./pages/Join"));
const GetStarted = lazy(() => import("./pages/GetStarted"));
const StartProject = lazy(() => import("./pages/StartProject"));
const RequestService = lazy(() => import("./pages/RequestService"));
const RequestStatus = lazy(() => import("./pages/RequestStatus"));
const BookingLookup = lazy(() => import("./pages/BookingLookup"));
const BecomeInstructor = lazy(() => import("./pages/BecomeInstructor"));
const Certificate = lazy(() => import("./pages/Certificate"));
const Testimonials = lazy(() => import("./pages/Testimonials"));
const Industries = lazy(() => import("./pages/Industries"));
const EnterpriseLanding = lazy(() => import("./pages/EnterpriseLanding"));
const TalentLanding = lazy(() => import("./pages/TalentLanding"));
const AcademyLanding = lazy(() => import("./pages/AcademyLanding"));

// ── Auth pages (lazy) ──
const Login = lazy(() => import("./pages/auth/Login"));
const Signup = lazy(() => import("./pages/auth/Signup"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/auth/VerifyEmail"));
const AccountPending = lazy(() => import("./pages/auth/AccountPending"));
const AccountSuspended = lazy(() => import("./pages/auth/AccountSuspended"));
const AccountBlocked = lazy(() => import("./pages/auth/AccountBlocked"));
const AccountReactivate = lazy(() => import("./pages/auth/AccountReactivate"));
const PostLoginRedirect = lazy(() => import("./components/auth/PostLoginRedirect"));

// ── Module-specific auth entry pages ──
const AuthEnterprise = lazy(() => import("./pages/auth/AuthEnterprise"));
const AuthTalent = lazy(() => import("./pages/auth/AuthTalent"));
const AuthConsulting = lazy(() => import("./pages/auth/AuthConsulting"));
const AuthAcademy = lazy(() => import("./pages/auth/AuthAcademy"));

// ── Authenticated user pages (lazy) ──
const Profile = lazy(() => import("./pages/Profile"));
const ProfileEdit = lazy(() => import("./pages/ProfileEdit"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const ProfileBookings = lazy(() => import("./pages/ProfileBookings"));
const ProfileApplications = lazy(() => import("./pages/ProfileApplications"));
const ProfileHires = lazy(() => import("./pages/ProfileHires"));
const ProfilePortfolio = lazy(() => import("./pages/ProfilePortfolio"));
const Notifications = lazy(() => import("./pages/Notifications"));
const PaymentHistory = lazy(() => import("./pages/PaymentHistory"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCancel = lazy(() => import("./pages/PaymentCancel"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const CompanyOnboarding = lazy(() => import("./pages/CompanyOnboarding"));
const ExpertOnboarding = lazy(() => import("./pages/onboarding/ExpertOnboarding"));
const InstructorOnboarding = lazy(() => import("./pages/onboarding/InstructorOnboarding"));
const FreelancerOnboarding = lazy(() => import("./pages/onboarding/FreelancerOnboarding"));
const StudentOnboarding = lazy(() => import("./pages/onboarding/StudentOnboarding"));
const MyProjects = lazy(() => import("./pages/MyProjects"));
const MyProjectDetail = lazy(() => import("./pages/MyProjectDetail"));

// ── Website-first "My" pages (freelancer + student) ──
const MyApplications = lazy(() => import("./pages/my/MyApplications"));
const MyPortfolioPage = lazy(() => import("./pages/my/MyPortfolio"));
const MyLearning = lazy(() => import("./pages/my/MyLearning"));
const MyCertificates = lazy(() => import("./pages/my/MyCertificates"));

// ── Legacy pages that still need their own routes (cross-portal links) ──
const CourseLearning = lazy(() => import("./pages/learn/CourseLearning"));
const InstructorJobs = lazy(() => import("./pages/instructor/InstructorJobs"));
const InstructorCoursesPage = lazy(() => import("./pages/instructor/InstructorCourses"));
const InstructorCourseDetail = lazy(() => import("./pages/instructor/InstructorCourseDetail"));
const InstructorQuestions = lazy(() => import("./pages/instructor/InstructorQuestions"));
const InstructorAssistants = lazy(() => import("./pages/instructor/InstructorAssistants"));

// ── Helper: render portal routes with a shared layout ──
function portalRoutes(
  LayoutComponent: React.LazyExoticComponent<React.ComponentType<{ children: React.ReactNode }>>,
  routes: PortalRouteConfig[]
) {
  return routes.map(({ path, component: Page }) => (
    <Route
      key={path}
      path={path}
      element={<LayoutComponent>{createElement(Page)}</LayoutComponent>}
    />
  ));
}

/** Redirect old /delivery/* paths to /enterprise/portal */
function DeliveryRedirect() {
  const location = useLocation();
  const rest = location.pathname.replace(/^\/delivery/, "");
  return <Navigate to={`/enterprise/portal${rest}`} replace />;
}

function JoinRoute() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return <Layout><Join /></Layout>;
}

/** Redirect old /training/* paths to /academy/courses */
function TrainingRedirect() {
  const location = useLocation();
  const rest = location.pathname.replace(/^\/training/, "");
  return <Navigate to={`/academy/courses${rest}`} replace />;
}

/** Redirect /instructor/courses/:id/* to /instructor/workspace/courses/:id/* */
function InstructorCourseRedirect() {
  const location = useLocation();
  const newPath = location.pathname.replace(/^\/instructor\/courses/, "/instructor/workspace/courses");
  return <Navigate to={newPath} replace />;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error: Error) => {
        toast.error(error.message || "Something went wrong");
      },
    },
  },
});

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <ExperienceProvider>
          <TooltipProvider>
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
              <Routes>

                {/* ── Portal routes (data-driven) ── */}
                {portalRoutes(BackofficeLayout, backofficeRoutes)}
                {portalRoutes(EnterpriseLayout, enterpriseRoutes)}
                {portalRoutes(TalentLayout, [...talentCompanyRoutes, ...talentFreelancerRoutes])}
                {portalRoutes(ConsultingLayout, consultingRoutes)}
                {portalRoutes(AcademyLayout, academyRoutes)}
                {portalRoutes(InstructorWorkspaceLayout, instructorWorkspaceRoutes)}

                {/* ── Public routes ── */}
                <Route path="/" element={<Layout><Index /></Layout>} />
                <Route path="/about" element={<Layout><About /></Layout>} />
                <Route path="/services" element={<Navigate to="/enterprise" replace />} />
                <Route path="/portfolio" element={<Layout><Portfolio /></Layout>} />
                <Route path="/portfolio/:slug" element={<Layout><ProjectDetail /></Layout>} />
                <Route path="/academy/courses" element={<Layout><Training /></Layout>} />
                <Route path="/academy/courses/:slug" element={<Layout><CourseDetail /></Layout>} />
                <Route path="/training/*" element={<TrainingRedirect />} />
                <Route path="/hiring" element={<Layout><Hiring /></Layout>} />
                <Route path="/blog" element={<Layout><Blog /></Layout>} />
                <Route path="/blog/:slug" element={<Layout><BlogPost /></Layout>} />
                <Route path="/team" element={<Layout><Team /></Layout>} />
                <Route path="/consulting" element={<Layout><Consulting /></Layout>} />
                <Route path="/consulting/request" element={<Layout><ConsultingRequest /></Layout>} />
                <Route path="/consulting/track" element={<Layout><ConsultingTrack /></Layout>} />
                <Route path="/consulting/:id" element={<Layout><ExpertProfile /></Layout>} />
                <Route path="/gallery" element={<Layout><Gallery /></Layout>} />
                <Route path="/media" element={<Layout><Media /></Layout>} />
                <Route path="/pricing" element={<Layout><Pricing /></Layout>} />
                <Route path="/contact" element={<Layout><Contact /></Layout>} />
                <Route path="/testimonials" element={<Layout><Testimonials /></Layout>} />
                <Route path="/industries" element={<Layout><Industries /></Layout>} />
                <Route path="/products" element={<Navigate to="/portfolio" replace />} />
                <Route path="/join" element={<JoinRoute />} />
                <Route path="/get-started" element={<Layout><GetStarted /></Layout>} />
                <Route path="/start-project" element={<Layout><StartProject /></Layout>} />
                <Route path="/request-service" element={<Layout><RequestService /></Layout>} />
                <Route path="/request-status" element={<Layout><RequestStatus /></Layout>} />
                <Route path="/freelancer/:id" element={<Layout><FreelancerProfile /></Layout>} />
                <Route path="/companies" element={<Layout><Companies /></Layout>} />
                <Route path="/companies/:slug" element={<Layout><CompanyPublicProfile /></Layout>} />
                <Route path="/member/:id" element={<Layout><MemberProfile /></Layout>} />
                <Route path="/booking/lookup" element={<Layout><BookingLookup /></Layout>} />
                <Route path="/become-instructor" element={<Layout><BecomeInstructor /></Layout>} />
                <Route path="/payment/success" element={<Layout><PaymentSuccess /></Layout>} />
                <Route path="/payment/cancel" element={<Layout><PaymentCancel /></Layout>} />
                <Route path="/certificate/:enrollmentId" element={<Certificate />} />
                <Route path="/enterprise" element={<Layout><EnterpriseLanding /></Layout>} />
                <Route path="/talent" element={<Layout><TalentLanding /></Layout>} />
                <Route path="/academy" element={<Layout><AcademyLanding /></Layout>} />

                {/* ── Module-specific auth entry routes ── */}
                <Route path="/auth/enterprise" element={<Layout><AuthEnterprise /></Layout>} />
                <Route path="/auth/talent" element={<Layout><AuthTalent /></Layout>} />
                <Route path="/auth/consulting" element={<Layout><AuthConsulting /></Layout>} />
                <Route path="/auth/academy" element={<Layout><AuthAcademy /></Layout>} />

                {/* ── Auth routes (shared fallback) ── */}
                <Route path="/login" element={<Layout><Login /></Layout>} />
                <Route path="/signup" element={<Layout><Signup /></Layout>} />
                <Route path="/forgot-password" element={<Layout><ForgotPassword /></Layout>} />
                <Route path="/reset-password" element={<Layout><ResetPassword /></Layout>} />
                <Route path="/verify-email" element={<Layout><VerifyEmail /></Layout>} />
                <Route path="/account-pending" element={<Layout><AccountPending /></Layout>} />
                <Route path="/account-suspended" element={<Layout><AccountSuspended /></Layout>} />
                <Route path="/account-blocked" element={<Layout><AccountBlocked /></Layout>} />
                <Route path="/account-reactivate" element={<Layout><AccountReactivate /></Layout>} />
                <Route path="/post-login" element={<PostLoginRedirect />} />

                {/* ── Authenticated user routes ── */}
                <Route path="/profile" element={<Layout><AuthGuard><Profile /></AuthGuard></Layout>} />
                <Route path="/profile/edit" element={<Layout><AuthGuard><ProfileEdit /></AuthGuard></Layout>} />
                <Route path="/profile/bookings" element={<Layout><AuthGuard><ProfileBookings /></AuthGuard></Layout>} />
                <Route path="/profile/applications" element={<Layout><AuthGuard><ProfileApplications /></AuthGuard></Layout>} />
                <Route path="/profile/hires" element={<Layout><AuthGuard><ProfileHires /></AuthGuard></Layout>} />
                <Route path="/profile/portfolio" element={<Layout><AuthGuard><ProfilePortfolio /></AuthGuard></Layout>} />
                <Route path="/profile/payments" element={<Layout><AuthGuard><PaymentHistory /></AuthGuard></Layout>} />
                <Route path="/my-bookings" element={<Layout><AuthGuard><MyBookings /></AuthGuard></Layout>} />
                <Route path="/notifications" element={<Layout><AuthGuard><Notifications /></AuthGuard></Layout>} />
                <Route path="/settings" element={<Layout><AuthGuard><AccountSettings /></AuthGuard></Layout>} />
                <Route path="/my-projects" element={<Layout><AuthGuard><MyProjects /></AuthGuard></Layout>} />
                <Route path="/my-projects/:id" element={<Layout><AuthGuard><MyProjectDetail /></AuthGuard></Layout>} />

                {/* ── Website-first "My" pages (freelancer + student) ── */}
                <Route path="/my/applications" element={<Layout><AuthGuard><MyApplications /></AuthGuard></Layout>} />
                <Route path="/my/portfolio" element={<Layout><AuthGuard><MyPortfolioPage /></AuthGuard></Layout>} />
                <Route path="/my/learning" element={<Layout><AuthGuard><MyLearning /></AuthGuard></Layout>} />
                <Route path="/my/certificates" element={<Layout><AuthGuard><MyCertificates /></AuthGuard></Layout>} />

                <Route path="/onboarding" element={<Layout><Onboarding /></Layout>} />
                <Route path="/onboarding/company" element={<Layout><CompanyOnboarding /></Layout>} />
                <Route path="/onboarding/expert" element={<Layout><AuthGuard><ExpertOnboarding /></AuthGuard></Layout>} />
                <Route path="/onboarding/instructor" element={<Layout><AuthGuard><InstructorOnboarding /></AuthGuard></Layout>} />
                <Route path="/onboarding/freelancer" element={<Layout><AuthGuard><FreelancerOnboarding /></AuthGuard></Layout>} />
                <Route path="/onboarding/student" element={<Layout><AuthGuard><StudentOnboarding /></AuthGuard></Layout>} />

                {/* ── Legacy role-specific redirects ── */}
                <Route path="/company" element={<Navigate to="/enterprise/portal" replace />} />
                <Route path="/company/profile" element={<Navigate to="/enterprise/portal/company-profile" replace />} />
                <Route path="/company/jobs" element={<Navigate to="/talent/portal/company/jobs" replace />} />
                <Route path="/company/jobs/:jobId/applicants" element={<Navigate to="/talent/portal/company/applications" replace />} />
                <Route path="/company/shortlists" element={<Navigate to="/talent/portal/company/shortlists" replace />} />
                <Route path="/company/talent" element={<Navigate to="/talent/portal/company/browse" replace />} />
                <Route path="/company/hires" element={<Navigate to="/talent/portal/company/hires" replace />} />
                <Route path="/company/team" element={<Navigate to="/talent/portal/company/team" replace />} />

                <Route path="/expert/dashboard" element={<Navigate to="/consulting/portal" replace />} />
                <Route path="/expert/availability" element={<Navigate to="/consulting/portal/availability" replace />} />
                <Route path="/expert/bookings" element={<Navigate to="/consulting/portal/bookings" replace />} />
                <Route path="/expert/profile" element={<Navigate to="/consulting/portal/profile" replace />} />
                <Route path="/expert/earnings" element={<Navigate to="/consulting/portal/earnings" replace />} />

                <Route path="/student/dashboard" element={<Navigate to="/academy" replace />} />

                {/* Instructor redirects → workspace */}
                <Route path="/instructor/dashboard" element={<Navigate to="/instructor/courses" replace />} />
                <Route path="/instructor/earnings" element={<Navigate to="/instructor/workspace/earnings" replace />} />

                {/* ── Instructor website-layer pages ── */}
                <Route path="/instructor/jobs" element={<Layout><AuthGuard><RoleGuard allowedRoles={['instructor', 'admin']}><InstructorJobs /></RoleGuard></AuthGuard></Layout>} />
                <Route path="/instructor/courses" element={<Layout><AuthGuard><RoleGuard allowedRoles={['instructor', 'admin']}><InstructorCoursesPage /></RoleGuard></AuthGuard></Layout>} />
                <Route path="/instructor/courses/:slug" element={<Layout><AuthGuard><RoleGuard allowedRoles={['instructor', 'admin']}><InstructorCourseDetail /></RoleGuard></AuthGuard></Layout>} />
                <Route path="/instructor/questions" element={<Layout><AuthGuard><RoleGuard allowedRoles={['instructor', 'admin']}><InstructorQuestions /></RoleGuard></AuthGuard></Layout>} />
                <Route path="/instructor/assistants" element={<Layout><AuthGuard><RoleGuard allowedRoles={['instructor', 'admin']}><InstructorAssistants /></RoleGuard></AuthGuard></Layout>} />

                {/* Cross-portal routes kept as-is + redirect old paths to workspace */}
                <Route path="/learn/:slug" element={<AuthGuard><CourseLearning /></AuthGuard>} />
                <Route path="/instructor/courses/new" element={<Navigate to="/instructor/workspace/courses/new" replace />} />
                <Route path="/instructor/courses/:id/edit" element={<InstructorCourseRedirect />} />
                <Route path="/instructor/courses/:id/students" element={<InstructorCourseRedirect />} />
                <Route path="/instructor/courses/:id/lessons" element={<InstructorCourseRedirect />} />

                {/* ── Backward compat redirects ── */}
                {/* Academy instructor paths → instructor workspace (redirect-only, not owned by academy) */}
                <Route path="/academy/portal/create" element={<Navigate to="/instructor/workspace/courses/new" replace />} />
                <Route path="/academy/portal/students" element={<Navigate to="/instructor/workspace/students" replace />} />
                <Route path="/academy/portal/lessons" element={<Navigate to="/instructor/workspace/lessons" replace />} />
                <Route path="/academy/portal/earnings" element={<Navigate to="/instructor/workspace/earnings" replace />} />
                <Route path="/delivery/*" element={<DeliveryRedirect />} />
                <Route path="/hiring/dashboard/*" element={<Navigate to="/talent/portal/company" replace />} />
                <Route path="/hiring/talent/*" element={<Navigate to="/hiring" replace />} />
                <Route path="/consulting/dashboard/*" element={<Navigate to="/consulting/portal" replace />} />
                <Route path="/academy/dashboard/*" element={<Navigate to="/academy/portal" replace />} />

                {/* ── 404 ── */}
                <Route path="*" element={<Layout><NotFound /></Layout>} />
              </Routes>
              </Suspense>
              </ErrorBoundary>
            </BrowserRouter>
          </TooltipProvider>
          </ExperienceProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
