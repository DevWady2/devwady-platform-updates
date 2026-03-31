/**
 * Sign Up — Legacy redirect resolver only.
 * This page is NOT part of the active public journey.
 * - Valid ?role= params redirect to the correct module auth flow.
 * - Bare /signup with no context redirects to homepage.
 */
import { Navigate, useSearchParams } from "react-router-dom";

type LegacySignupRole = "individual" | "company" | "student" | "instructor" | "expert";
const legacyRoleRedirects: Record<LegacySignupRole, string> = {
  individual: "/auth/talent?role=individual",
  company: "/auth/talent?role=company",
  student: "/auth/academy?role=student",
  instructor: "/auth/academy?role=instructor",
  expert: "/auth/consulting?role=expert",
};

export default function Signup() {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get("role") as LegacySignupRole | null;

  if (roleParam && roleParam in legacyRoleRedirects) {
    return <Navigate to={legacyRoleRedirects[roleParam]} replace />;
  }

  // No valid context — send to homepage
  return <Navigate to="/" replace />;
}
