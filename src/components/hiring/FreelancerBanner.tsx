/**
 * Authenticated freelancer banner shown at top of /hiring page.
 * Shows application stats, profile completeness, and quick links.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProfileCompleteness } from "@/hooks/useProfileCompleteness";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, FolderOpen, User } from "lucide-react";
import { motion } from "framer-motion";

export default function FreelancerBanner() {
  const { user, accountType, role } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const { score, loading: scoreLoading } = useProfileCompleteness();

  const { data: appCount = 0 } = useQuery({
    queryKey: ["freelancer-banner-apps", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { count } = await supabase
        .from("job_applications")
        .select("id", { count: "exact", head: true })
        .eq("applicant_user_id", user!.id);
      return count ?? 0;
    },
  });

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["freelancer-banner-pending", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { count } = await supabase
        .from("job_applications")
        .select("id", { count: "exact", head: true })
        .eq("applicant_user_id", user!.id)
        .eq("status", "pending");
      return count ?? 0;
    },
  });

  const { data: shortlistedBy = 0 } = useQuery({
    queryKey: ["freelancer-banner-shortlisted", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { count } = await supabase
        .from("freelancer_shortlists")
        .select("id", { count: "exact", head: true })
        .eq("freelancer_user_id", user!.id);
      return count ?? 0;
    },
  });

  // Only show for logged-in freelancers
  if (!user || (accountType !== "freelancer" && !(accountType === null && role === "individual"))) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-primary/8 to-accent/8 border border-primary/15 rounded-2xl p-5 mb-8"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Stats */}
        <div className="flex items-center gap-6 flex-1">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{appCount}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "طلباتي" : "Applications"}</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "قيد المراجعة" : "Pending"}</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{shortlistedBy}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "مرشح من قبل" : "Shortlisted"}</p>
          </div>
        </div>

        {/* Profile completeness */}
        {!scoreLoading && score < 80 && (
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="flex-1">
              <p className="text-xs font-medium mb-1">{isAr ? "اكتمال الملف" : "Profile"} {score}%</p>
              <Progress value={score} className="h-1.5" />
            </div>
            <Link to="/profile/edit">
              <Button variant="outline" size="sm" className="text-xs h-7">
                <User className="h-3 w-3 me-1" />{isAr ? "أكمل" : "Complete"}
              </Button>
            </Link>
          </div>
        )}

        {/* Quick links */}
        <div className="flex items-center gap-2">
          <Link to="/my/applications">
            <Button variant="outline" size="sm" className="text-xs h-8 rounded-full">
              <FileText className="h-3.5 w-3.5 me-1" />{isAr ? "طلباتي" : "My Applications"}
            </Button>
          </Link>
          <Link to="/my/portfolio">
            <Button variant="ghost" size="sm" className="text-xs h-8 rounded-full">
              <FolderOpen className="h-3.5 w-3.5 me-1" />{isAr ? "أعمالي" : "Portfolio"}
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
