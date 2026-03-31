/**
 * Talent — Company Dashboard.
 * First-screen: hiring pipeline focus → applicants → jobs.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader, StatCardGrid, FocusBlock, ActivityFeed } from "@/core/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, Briefcase, Users, ArrowRight, Clock, UserCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { APPLICATION_STATUS_COLORS, formatStatus } from "../constants";
import { useWorkspaceEntry } from "@/hooks/useWorkspaceEntry";
import ArrivalHint from "@/components/portal/ArrivalHint";

export default function TalentCompanyDashboard() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const entry = useWorkspaceEntry();

  const { data: companyProfile } = useQuery({
    queryKey: ["talent-company-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("company_profiles").select("id, company_name").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: jobs = [], isLoading: loadingJobs } = useQuery({
    queryKey: ["talent-company-jobs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("job_postings").select("*").eq("company_user_id", user!.id).order("created_at", { ascending: false }).limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  const jobIds = jobs.map((j) => j.id);
  const { data: applications = [], isLoading: loadingApps } = useQuery({
    queryKey: ["talent-company-apps", jobIds],
    enabled: jobIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("job_applications").select("*").in("job_id", jobIds).order("created_at", { ascending: false }).limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: shortlists = [] } = useQuery({
    queryKey: ["talent-company-shortlists", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("freelancer_shortlists").select("*").eq("company_user_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const activeJobs = jobs.filter((j) => j.is_active);
  const pendingApps = applications.filter((a) => a.status === "pending");
  const loading = loadingJobs || loadingApps;

  const stats = [
    { label_en: "Active Jobs", label_ar: "وظائف نشطة", value: activeJobs.length, icon: "projects", color: "primary" as const },
    { label_en: "New Applications", label_ar: "طلبات جديدة", value: pendingApps.length, icon: "chart", color: "warning" as const },
    { label_en: "Shortlisted", label_ar: "مرشحون", value: shortlists.length, icon: "users", color: "success" as const },
  ];

  return (
    <div className="space-y-6">
      <ArrivalHint entry={entry} />
      <PageHeader
        title_en={companyProfile?.company_name ? `${companyProfile.company_name} — Talent` : "Talent Dashboard"}
        title_ar={companyProfile?.company_name ? `${companyProfile.company_name} — المواهب` : "لوحة تحكم المواهب"}
        description_en="Manage recruitment, talent pipeline, and team staffing"
        description_ar="إدارة التوظيف وخط المواهب وتعزيز الفريق"
        actions={
          <Link to="/talent/portal/company/jobs?new=true">
            <Button size="sm"><Plus className="h-4 w-4 me-1.5" />{isAr ? "نشر وظيفة" : "Post Job"}</Button>
          </Link>
        }
      />

      {/* Dominant focus: applicants needing review or post first job */}
      {!loading && (pendingApps.length > 0 ? (
        <FocusBlock
          icon={UserCheck}
          label_en="Needs Review"
          label_ar="بحاجة للمراجعة"
          title_en={`${pendingApps.length} new application${pendingApps.length > 1 ? "s" : ""} awaiting review`}
          title_ar={`${pendingApps.length} طلب${pendingApps.length > 1 ? "ات" : ""} جديد بانتظار المراجعة`}
          action_en="Review Applicants"
          action_ar="مراجعة المتقدمين"
          actionHref="/talent/portal/company/applications"
          accent="warning"
        />
      ) : activeJobs.length === 0 ? (
        <FocusBlock
          icon={Briefcase}
          label_en="Get Started"
          label_ar="ابدأ الآن"
          title_en="Post your first position to start building your talent pipeline"
          title_ar="انشر وظيفتك الأولى لبدء بناء خط المواهب"
          action_en="Post a Job"
          action_ar="نشر وظيفة"
          actionHref="/talent/portal/company/jobs?new=true"
          accent="primary"
        />
      ) : null)}

      <StatCardGrid stats={stats} loading={loading} columns={3} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Recent Applications — primary block */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                {isAr ? "الطلبات الأخيرة" : "Recent Applications"}
              </CardTitle>
              <Link to="/talent/portal/company/applications">
                <Button variant="ghost" size="sm" className="text-xs">
                  {isAr ? "عرض الكل" : "View All"}<ArrowRight className="h-3.5 w-3.5 ms-1 icon-flip-rtl" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)
              ) : applications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">{isAr ? "ستظهر الطلبات هنا عندما يتقدم المرشحون لوظائفك." : "Applications will appear here as candidates apply to your positions."}</p>
              ) : (
                applications.slice(0, 5).map((a) => (
                  <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-lg border">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{a.applicant_email ?? "Applicant"}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge variant="secondary" className={`text-[10px] ${APPLICATION_STATUS_COLORS[a.status] ?? ""}`}>
                      {formatStatus(a.status)}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Active Jobs — secondary */}
          {activeJobs.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  {isAr ? "الوظائف النشطة" : "Open Positions"}
                </CardTitle>
                <Link to="/talent/portal/company/jobs">
                  <Button variant="ghost" size="sm" className="text-xs">
                    {isAr ? "عرض الكل" : "View All"}<ArrowRight className="h-3.5 w-3.5 ms-1 icon-flip-rtl" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-2">
                {activeJobs.slice(0, 4).map((j) => (
                  <Link key={j.id} to={`/talent/portal/company/jobs/${j.id}`} className="block">
                    <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{j.title}</p>
                        <p className="text-[10px] text-muted-foreground">{j.type} · {j.location ?? "Remote"}</p>
                      </div>
                      {j.is_urgent && <Badge variant="destructive" className="text-[10px]">{isAr ? "عاجل" : "Urgent"}</Badge>}
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <ActivityFeed limit={5} />
        </div>
      </div>
    </div>
  );
}
