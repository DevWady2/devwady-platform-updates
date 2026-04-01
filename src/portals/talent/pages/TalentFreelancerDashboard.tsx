/**
 * Talent — Freelancer Dashboard.
 * First-screen: opportunity/application focus → profile readiness.
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
import { Search, FileText, Heart, Briefcase, ArrowRight, Clock, UserPen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { APPLICATION_STATUS_COLORS, formatStatus } from "../constants";
import { useWorkspaceEntry } from "@/hooks/useWorkspaceEntry";
import ArrivalHint from "@/components/portal/ArrivalHint";

export default function TalentFreelancerDashboard() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const entry = useWorkspaceEntry();

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["talent-freelancer-applications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_applications")
        .select("*, job_postings(title, type, location, company_user_id)")
        .eq("applicant_user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: shortlisted = [] } = useQuery({
    queryKey: ["talent-freelancer-shortlisted", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("freelancer_shortlists").select("*").eq("freelancer_user_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["talent-freelancer-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("full_name, skills, is_available, bio, avatar_url").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const interviews = applications.filter((a) => ["shortlisted", "interview"].includes(a.status));
  const profileComplete = !!(profile?.bio && profile?.skills?.length && profile?.avatar_url);

  const stats = [
    { label_en: "Applications", label_ar: "طلباتي", value: applications.length, icon: "chart", color: "primary" as const },
    { label_en: "Interviews", label_ar: "مقابلات", value: interviews.length, icon: "projects", color: "success" as const },
    { label_en: "Shortlisted By", label_ar: "مرشح من قبل", value: shortlisted.length, icon: "users", color: "warning" as const },
  ];

  return (
    <div className="space-y-6">
      <ArrivalHint entry={entry} />
      <PageHeader
        title_en={profile?.full_name ? `Welcome, ${profile.full_name}` : "Talent Dashboard"}
        title_ar={profile?.full_name ? `مرحباً، ${profile.full_name}` : "لوحة تحكم الموهبة"}
        description_en="Track opportunities, applications, and your professional presence"
        description_ar="تتبع الفرص والطلبات وحضورك المهني"
        actions={
          <Link to="/talent/portal/freelancer/jobs">
            <Button size="sm"><Search className="h-4 w-4 me-1.5" />{isAr ? "تصفح الوظائف" : "Browse Jobs"}</Button>
          </Link>
        }
      />

      {/* Dominant focus: profile incomplete, interview update, or browse jobs */}
      {!isLoading && (!profileComplete ? (
        <FocusBlock
          icon={UserPen}
          label_en="Complete Your Profile"
          label_ar="أكمل ملفك الشخصي"
          title_en="A complete profile helps companies find and shortlist you"
          title_ar="الملف المكتمل يساعد الشركات على إيجادك وترشيحك"
          action_en="Edit Profile"
          action_ar="تعديل الملف"
          actionHref="/talent/portal/freelancer/profile"
          accent="warning"
        />
      ) : interviews.length > 0 ? (
        <FocusBlock
          icon={Briefcase}
          label_en="Interview Stage"
          label_ar="مرحلة المقابلات"
          title_en={`${interviews.length} application${interviews.length > 1 ? "s" : ""} in interview stage`}
          title_ar={`${interviews.length} طلب في مرحلة المقابلات`}
          action_en="View Applications"
          action_ar="عرض الطلبات"
          actionHref="/talent/portal/freelancer/applications"
          accent="success"
        />
      ) : applications.length === 0 ? (
        <FocusBlock
          icon={Search}
          label_en="Get Started"
          label_ar="ابدأ الآن"
          title_en="Browse open positions and submit your first application"
          title_ar="تصفح الوظائف المتاحة وقدّم طلبك الأول"
          action_en="Browse Jobs"
          action_ar="تصفح الوظائف"
          actionHref="/talent/portal/freelancer/jobs"
          accent="primary"
        />
      ) : null)}

      <StatCardGrid stats={stats} loading={isLoading} columns={3} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {isAr ? "طلباتي الأخيرة" : "Recent Applications"}
              </CardTitle>
              <Link to="/talent/portal/freelancer/applications">
                <Button variant="ghost" size="sm" className="text-xs">
                  {isAr ? "عرض الكل" : "View All"}<ArrowRight className="h-3.5 w-3.5 ms-1 icon-flip-rtl" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)
              ) : applications.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{isAr ? "تصفح الوظائف المتاحة وقدّم طلبك الأول." : "Browse open positions and submit your first application."}</p>
                </div>
              ) : (
                applications.slice(0, 5).map((a: any) => (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.job_postings?.title ?? "Job"}</p>
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
        </div>

        <div className="space-y-4">
          {/* Profile readiness */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{isAr ? "ملفك الشخصي" : "Your Profile"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{isAr ? "الحالة" : "Availability"}</span>
                <Badge variant={profile?.is_available ? "default" : "secondary"}>
                  {profile?.is_available ? (isAr ? "متاح" : "Available") : (isAr ? "غير متاح" : "Not Available")}
                </Badge>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">{isAr ? "المهارات" : "Skills"}: </span>
                <span>{profile?.skills?.length ?? 0}</span>
              </div>
              <Link to="/talent/portal/freelancer/profile">
                <Button variant="outline" size="sm" className="w-full mt-2">{isAr ? "تعديل الملف" : "Edit Profile"}</Button>
              </Link>
            </CardContent>
          </Card>

          {shortlisted.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  {isAr ? "شركات مهتمة بك" : "Companies Interested"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{shortlisted.length}</p>
                <p className="text-xs text-muted-foreground">{isAr ? "شركة أضافتك للقائمة المختصرة" : "companies shortlisted you"}</p>
              </CardContent>
            </Card>
          )}

          <ActivityFeed limit={4} />
        </div>
      </div>
    </div>
  );
}
