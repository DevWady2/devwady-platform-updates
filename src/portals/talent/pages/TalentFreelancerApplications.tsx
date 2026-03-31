/**
 * Talent — Freelancer: My Applications tracking (with status filter tabs).
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader, EmptyState } from "@/core/components";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "react-router-dom";
import { FileText, Briefcase, Clock, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { APPLICATION_STATUS_COLORS, formatStatus } from "../constants";

export default function TalentFreelancerApplications() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["talent-freelancer-all-applications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_applications")
        .select("*, job_postings(title, type, location)")
        .eq("applicant_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const pendingCount = applications.filter((a: any) => a.status === "pending").length;
  const activeCount = applications.filter((a: any) => ["reviewing", "shortlisted", "interview", "offered"].includes(a.status)).length;
  const closedCount = applications.filter((a: any) => ["accepted", "rejected", "withdrawn"].includes(a.status)).length;

  const filtered = statusFilter === "all"
    ? applications
    : statusFilter === "pending"
    ? applications.filter((a: any) => a.status === "pending")
    : statusFilter === "active"
    ? applications.filter((a: any) => ["reviewing", "shortlisted", "interview", "offered"].includes(a.status))
    : applications.filter((a: any) => ["accepted", "rejected", "withdrawn"].includes(a.status));

  return (
    <div className="space-y-6">
      <PageHeader
        title_en="My Applications"
        title_ar="طلباتي"
        description_en="Track the status of your job applications"
        description_ar="تتبع حالة طلبات التوظيف"
        actions={applications.length > 0 ? (
          <Link to="/talent/portal/freelancer/jobs">
            <Button size="sm"><Search className="h-4 w-4 me-1.5" />{isAr ? "تصفح الوظائف" : "Browse Jobs"}</Button>
          </Link>
        ) : undefined}
      />

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">{isAr ? "الكل" : "All"} ({applications.length})</TabsTrigger>
          <TabsTrigger value="pending">{isAr ? "قيد الانتظار" : "Pending"} ({pendingCount})</TabsTrigger>
          <TabsTrigger value="active">{isAr ? "نشطة" : "Active"} ({activeCount})</TabsTrigger>
          <TabsTrigger value="closed">{isAr ? "مغلقة" : "Closed"} ({closedCount})</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title_en="No applications yet"
          title_ar="لا توجد طلبات بعد"
          description_en="Browse available jobs and start applying"
          description_ar="تصفح الوظائف المتاحة وابدأ بالتقديم"
          actionLabel_en="Browse Jobs"
          actionLabel_ar="تصفح الوظائف"
          onAction={() => navigate("/talent/portal/freelancer/jobs")}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((a: any) => (
            <Card key={a.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.job_postings?.title ?? "Job"}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                      {a.job_postings?.type && <span>{formatStatus(a.job_postings.type)}</span>}
                      {a.job_postings?.location && <span>· {a.job_postings.location}</span>}
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary" className={`text-[10px] ${APPLICATION_STATUS_COLORS[a.status] ?? ""}`}>
                    {formatStatus(a.status)}
                  </Badge>
                </div>
                {a.cover_note && (
                  <p className="text-xs text-muted-foreground mt-2 ps-14 line-clamp-2">{a.cover_note}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
