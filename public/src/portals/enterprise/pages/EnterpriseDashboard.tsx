/**
 * Enterprise Portal Dashboard — Client workspace overview.
 * First-screen: active work focus → requests/projects → quotes sidebar.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader, StatCardGrid, FocusBlock, ActivityFeed } from "@/core/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Plus, FolderKanban, FileInput, Receipt, Clock, ArrowRight, Rocket,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { PROJECT_STATUS_COLORS, formatStatus } from "../constants";
import { useWorkspaceEntry } from "@/hooks/useWorkspaceEntry";
import ArrivalHint from "@/components/portal/ArrivalHint";

export default function EnterpriseDashboard() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const entry = useWorkspaceEntry();

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ["enterprise-projects", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_tracking")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: requests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ["enterprise-requests", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  const requestIds = requests.map((r) => r.id);
  const { data: quotes = [] } = useQuery({
    queryKey: ["enterprise-quotes", user?.id, requestIds],
    enabled: !!user && requestIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .in("service_request_id", requestIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: companyProfile } = useQuery({
    queryKey: ["enterprise-company-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_profiles")
        .select("id, company_name, logo_url, industry")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: userProfile } = useQuery({
    queryKey: ["enterprise-user-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const activeProjects = projects.filter((p) => !["completed", "cancelled"].includes(p.status));
  const pendingRequests = requests.filter((r) => ["new", "in_review"].includes(r.status));
  const pendingQuotes = quotes.filter((q) => q.status === "sent");
  const loading = loadingProjects || loadingRequests;

  const dashboardName = companyProfile?.company_name || userProfile?.full_name || "";

  const stats = [
    { label_en: "Active Projects", label_ar: "مشاريع نشطة", value: activeProjects.length, icon: "projects", color: "primary" as const },
    { label_en: "Pending Requests", label_ar: "طلبات معلقة", value: pendingRequests.length, icon: "chart", color: "warning" as const },
    { label_en: pendingQuotes.length > 0 ? "Action Required" : "Quotes", label_ar: pendingQuotes.length > 0 ? "بحاجة لإجراء" : "عروض الأسعار", value: pendingQuotes.length, icon: "revenue", color: "success" as const },
  ];

  // Pick the dominant focus item
  const topProject = activeProjects[0];
  const topRequest = pendingRequests[0];
  const topQuote = pendingQuotes[0];
  const hasWork = topProject || topRequest || topQuote;

  return (
    <div className="space-y-6">
      <ArrivalHint entry={entry} />
      <PageHeader
        title_en={dashboardName ? `${dashboardName} Dashboard` : "Enterprise Dashboard"}
        title_ar={dashboardName ? `لوحة تحكم ${dashboardName}` : "لوحة تحكم إنتربرايز"}
        description_en="Your projects, requests, and deliverables at a glance"
        description_ar="مشاريعك وطلباتك ومخرجاتك في نظرة واحدة"
        actions={
          <Link to="/enterprise/portal/requests/new">
            <Button size="sm">
              <Plus className="h-4 w-4 me-1.5" />
              {isAr ? "طلب جديد" : "New Request"}
            </Button>
          </Link>
        }
      />

      {/* Dominant focus block */}
      {!loading && hasWork ? (
        topQuote ? (
          <FocusBlock
            icon={Receipt}
            label_en="Action Required"
            label_ar="بحاجة لإجراء"
            title_en={`Quote ${topQuote.quote_number} — $${topQuote.total_usd}`}
            title_ar={`عرض سعر ${topQuote.quote_number} — $${topQuote.total_usd}`}
            subtitle_en={topQuote.title}
            subtitle_ar={topQuote.title}
            action_en="Review Quote"
            action_ar="مراجعة العرض"
            actionHref={`/enterprise/portal/quotes/${topQuote.id}`}
            accent="warning"
          />
        ) : topProject ? (
          <FocusBlock
            icon={FolderKanban}
            label_en="Active Project"
            label_ar="مشروع نشط"
            title_en={topProject.title}
            title_ar={topProject.title}
            subtitle_en={`${formatStatus(topProject.status)}${topProject.progress_pct != null ? ` · ${topProject.progress_pct}% complete` : ""}`}
            subtitle_ar={`${formatStatus(topProject.status)}${topProject.progress_pct != null ? ` · ${topProject.progress_pct}% مكتمل` : ""}`}
            action_en="View Project"
            action_ar="عرض المشروع"
            actionHref={`/enterprise/portal/projects/${topProject.id}`}
            accent="primary"
          />
        ) : topRequest ? (
          <FocusBlock
            icon={FileInput}
            label_en="Pending Request"
            label_ar="طلب معلق"
            title_en={topRequest.title}
            title_ar={topRequest.title}
            subtitle_en={formatStatus(topRequest.status)}
            subtitle_ar={formatStatus(topRequest.status)}
            action_en="View Request"
            action_ar="عرض الطلب"
            actionHref={`/enterprise/portal/requests`}
            accent="warning"
          />
        ) : null
      ) : !loading && !hasWork ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col sm:flex-row items-center gap-6 p-8">
            <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center flex-shrink-0">
              <Rocket className="h-7 w-7 text-primary-foreground" />
            </div>
            <div className="text-center sm:text-start flex-1">
              <h3 className="text-base font-semibold text-foreground mb-1">
                {isAr ? "مرحباً بك في إنتربرايز" : "Welcome to Enterprise"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {isAr
                  ? "ابدأ بتقديم طلب خدمة جديد — سنعد لك عرض سعر مخصص ونبدأ في بناء مشروعك."
                  : "Start by submitting a new service request — we'll prepare a custom quote and begin building your project."}
              </p>
            </div>
            <Link to="/enterprise/portal/requests/new" className="flex-shrink-0">
              <Button className="gradient-brand text-primary-foreground rounded-full group">
                {isAr ? "قدّم طلبك الأول" : "Submit Your First Request"}
                <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <StatCardGrid stats={stats} loading={loading} columns={3} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FolderKanban className="h-4 w-4" />
                {isAr ? "مشاريع نشطة" : "Active Projects"}
              </CardTitle>
              <Link to="/enterprise/portal/projects">
                <Button variant="ghost" size="sm" className="text-xs">
                  {isAr ? "عرض الكل" : "View All"}
                  <ArrowRight className="h-3.5 w-3.5 ms-1 icon-flip-rtl" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingProjects ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                ))
              ) : activeProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {isAr ? "لا توجد مشاريع نشطة بعد" : "No active projects yet"}
                </p>
              ) : (
                activeProjects.slice(0, 4).map((p) => (
                  <Link key={p.id} to={`/enterprise/portal/projects/${p.id}`} className="block">
                    <div className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className={`text-[10px] ${PROJECT_STATUS_COLORS[p.status] ?? ""}`}>
                            {formatStatus(p.status)}
                          </Badge>
                          {p.target_end_date && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(p.target_end_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      {p.progress_pct != null && (
                        <div className="text-right flex-shrink-0">
                          <span className="text-lg font-bold text-foreground">{p.progress_pct}%</span>
                          <div className="w-16 h-1.5 bg-muted rounded-full mt-1">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${p.progress_pct}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Requests — compact */}
          {pendingRequests.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileInput className="h-4 w-4" />
                  {isAr ? "طلبات معلقة" : "Pending Requests"}
                </CardTitle>
                <Link to="/enterprise/portal/requests">
                  <Button variant="ghost" size="sm" className="text-xs">
                    {isAr ? "عرض الكل" : "View All"} <ArrowRight className="h-3.5 w-3.5 ms-1 icon-flip-rtl" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingRequests.slice(0, 3).map((r) => (
                  <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-lg border">
                    <FileInput className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{r.title}</p>
                      <p className="text-[10px] text-muted-foreground">{formatStatus(r.service_type)} · {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{formatStatus(r.status)}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {pendingQuotes.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  {isAr ? "عروض أسعار" : "Quotes"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingQuotes.map((q) => (
                  <Link key={q.id} to={`/enterprise/portal/quotes/${q.id}`} className="block">
                    <div className="p-2.5 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-muted-foreground">{q.quote_number}</span>
                        <span className="text-sm font-semibold">${q.total_usd}</span>
                      </div>
                      <p className="text-sm truncate mt-1">{q.title}</p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          <ActivityFeed limit={6} />
        </div>
      </div>
    </div>
  );
}
