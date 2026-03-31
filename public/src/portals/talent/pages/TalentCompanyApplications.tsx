/**
 * Talent — All Applications for the company (with status filter tabs).
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader, SearchFilterBar, EmptyState } from "@/core/components";
import { useSearch } from "@/core/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { FileText, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { APPLICATION_STATUS_COLORS, formatStatus } from "../constants";

export default function TalentCompanyApplications() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const search = useSearch();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["talent-all-company-applications", user?.id, search.params.query],
    enabled: !!user,
    queryFn: async () => {
      const { data: jobs } = await supabase
        .from("job_postings")
        .select("id, title")
        .eq("company_user_id", user!.id);
      const jobIds = (jobs ?? []).map((j) => j.id);
      if (jobIds.length === 0) return [];
      let q = supabase
        .from("job_applications")
        .select("*, job_postings(title), profiles:applicant_user_id(full_name, skills)")
        .in("job_id", jobIds)
        .order("created_at", { ascending: false });
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const searchFiltered = search.params.query
    ? applications.filter((a: any) =>
        (a.profiles?.full_name ?? "").toLowerCase().includes(search.params.query!.toLowerCase()) ||
        (a.job_postings?.title ?? "").toLowerCase().includes(search.params.query!.toLowerCase())
      )
    : applications;

  const newCount = searchFiltered.filter((a: any) => a.status === "pending").length;
  const inReviewCount = searchFiltered.filter((a: any) => ["reviewing", "shortlisted", "interview"].includes(a.status)).length;
  const decidedCount = searchFiltered.filter((a: any) => ["offered", "accepted", "rejected"].includes(a.status)).length;

  const filtered = statusFilter === "all"
    ? searchFiltered
    : statusFilter === "new"
    ? searchFiltered.filter((a: any) => a.status === "pending")
    : statusFilter === "inReview"
    ? searchFiltered.filter((a: any) => ["reviewing", "shortlisted", "interview"].includes(a.status))
    : searchFiltered.filter((a: any) => ["offered", "accepted", "rejected"].includes(a.status));

  return (
    <div className="space-y-6">
      <PageHeader
        title_en="All Applications"
        title_ar="جميع الطلبات"
        description_en="Review applications across all your job listings"
        description_ar="مراجعة الطلبات عبر جميع وظائفك"
      />

      <SearchFilterBar
        query={search.params.query ?? ""}
        onQueryChange={search.setQuery}
        placeholder_en="Search by name or job..."
        placeholder_ar="بحث بالاسم أو الوظيفة..."
      />

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">{isAr ? "الكل" : "All"} ({searchFiltered.length})</TabsTrigger>
          <TabsTrigger value="new">{isAr ? "جديدة" : "New"} ({newCount})</TabsTrigger>
          <TabsTrigger value="inReview">{isAr ? "قيد المراجعة" : "In Review"} ({inReviewCount})</TabsTrigger>
          <TabsTrigger value="decided">{isAr ? "تم البت" : "Decided"} ({decidedCount})</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title_en="No applications"
          title_ar="لا توجد طلبات"
          description_en="Applications will appear here when candidates apply to your jobs"
          description_ar="ستظهر الطلبات هنا عندما يتقدم المرشحون لوظائفك"
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((a: any) => (
            <Card key={a.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                    {(a.profiles?.full_name ?? "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.profiles?.full_name ?? a.applicant_email ?? "Applicant"}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {isAr ? "تقدم لـ" : "Applied to"} <span className="font-medium">{a.job_postings?.title ?? "—"}</span>
                      {" · "}
                      <Clock className="h-3 w-3 inline" /> {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge variant="secondary" className={`text-[10px] ${APPLICATION_STATUS_COLORS[a.status] ?? ""}`}>
                    {formatStatus(a.status)}
                  </Badge>
                  <Link to={`/talent/portal/company/jobs/${a.job_id}`}>
                    <Button variant="outline" size="sm" className="text-xs">{isAr ? "عرض" : "View"}</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
