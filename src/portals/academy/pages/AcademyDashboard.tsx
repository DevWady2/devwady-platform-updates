/**
 * Academy — Dashboard: student-first workspace home.
 * In the single-account model, instructor accounts are redirected to /instructor/workspace.
 */
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import AcademyStudentDashboard from "./AcademyStudentDashboard";

export default function AcademyDashboard() {
  const { accountType } = useAuth();
  const hasStudentAccess = accountType === "student" || accountType === "admin";
  const hasInstructorAccess = accountType === "instructor";

  // Instructor accounts → redirect to instructor workspace
  if (!hasStudentAccess && hasInstructorAccess) {
    return <Navigate to="/instructor/workspace" replace />;
  }

  // No student access at all → redirect home
  if (!hasStudentAccess) {
    return <Navigate to="/" replace />;
  }

  return <AcademyStudentDashboard />;
}
