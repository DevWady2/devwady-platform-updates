import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function TalentRouterPage() {
  const { accountType, loading } = useAuth();
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  const isCompany = accountType === "company" || accountType === "admin";
  const isFreelancer = accountType === "freelancer";

  if (isCompany) return <Navigate to="/talent/portal/company" replace />;
  if (isFreelancer) return <Navigate to="/talent/portal/freelancer" replace />;

  return <Navigate to="/hiring" replace />;
}
