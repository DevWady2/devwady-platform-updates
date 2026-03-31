import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function TalentRouterPage() {
  const { role, loading } = useAuth();
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  const isCompany = role === "company" || role === "admin";
  return <Navigate to={isCompany ? "/talent/portal/company" : "/hiring"} replace />;
}
