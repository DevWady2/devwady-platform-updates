/**
 * Consulting — Dashboard router: renders expert or client dashboard based on account type.
 */
import { useAuth } from "@/contexts/AuthContext";
import ConsultingExpertDashboard from "./ConsultingExpertDashboard";
import ConsultingClientDashboard from "./ConsultingClientDashboard";

export default function ConsultingDashboard() {
  const { accountType } = useAuth();
  const isExpert = accountType === "expert" || accountType === "admin";
  return isExpert ? <ConsultingExpertDashboard /> : <ConsultingClientDashboard />;
}
