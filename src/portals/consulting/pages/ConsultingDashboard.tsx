/**
 * Consulting — Dashboard router: renders expert or client dashboard based on role.
 */
import { useAuth } from "@/contexts/AuthContext";
import ConsultingExpertDashboard from "./ConsultingExpertDashboard";
import ConsultingClientDashboard from "./ConsultingClientDashboard";

export default function ConsultingDashboard() {
  const { role } = useAuth();
  const isExpert = role === "expert" || role === "admin";
  return isExpert ? <ConsultingExpertDashboard /> : <ConsultingClientDashboard />;
}
