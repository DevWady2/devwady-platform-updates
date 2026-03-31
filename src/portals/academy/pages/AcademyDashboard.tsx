/**
 * Academy — Dashboard: student-first workspace home.
 * Instructor-only users are redirected to /instructor/workspace.
 * Multi-role users (student + instructor) see the student dashboard.
 */
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import AcademyStudentDashboard from "./AcademyStudentDashboard";

export default function AcademyDashboard() {
  const { roles } = useAuth();
  const hasStudentAccess = roles.includes("student") || roles.includes("admin");
  const hasInstructorAccess = roles.includes("instructor");

  // Instructor-only users (no student role) → redirect to instructor workspace
  if (!hasStudentAccess && hasInstructorAccess) {
    return <Navigate to="/instructor/workspace" replace />;
  }

  // No student access at all → redirect home
  if (!hasStudentAccess) {
    return <Navigate to="/" replace />;
  }

  return <AcademyStudentDashboard />;
}
