/**
 * Standalone "My Applications" page for freelancers (website-first UX).
 * Same data as TalentFreelancerApplications but rendered in standard Layout.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { FileText, Briefcase, Clock, Search, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  reviewing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  shortlisted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  interview: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  offered: "bg-primary/10 text-primary",
  accepted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  rejected: "bg-destructive/10 text-destructive",
  withdrawn: "bg-muted text-muted-foreground",
};

const formatStatus = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");

export default function MyApplications() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["my-applications-page", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_applications")
        .select("*, job_postings(title, title_ar, type, location, company_user_id)")
        .eq("applicant_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const pendingCount = applications.filter((a: any) => a.status === "pending").length;
  const activeCount = applications.filter((a: any) => ["reviewing", "shortlisted", "interview", "offered"].includes(a.status)).length;
  const closedCount = applications.filter((a: any) => ["accepted", "rejected", "withdrawn"].includes(a.status)).length;

  const filtered = statusFilter === "all" ? applications
    : statusFilter === "pending" ? applications.filter((a: any) => a.status === "pending")
    : statusFilter === "active" ? applications.filter((a: any) => ["reviewing", "shortlisted", "interview", "offered"].includes(a.status))
    : applications.filter((a: any) => ["accepted", "rejected", "withdrawn"].includes(a.status));

  return (
    <>
      <SEO title={isAr ? "طلباتي" : "My Applications"} description={isAr ? "تتبع حالة طلبات التوظيف" : "Track your job applications"} />
      <section className="py-10">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link to="/hiring" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
                <ArrowLeft className="h-3 w-3 icon-flip-rtl" /> {isAr ? "العودة للوظائف" : "Back to Jobs"}
              </Link>
              <h1 className="text-2xl font-bold">{isAr ? "طلباتي" : "My Applications"}</h1>
              <p className="text-sm text-muted-foreground mt-1">{isAr ? "تتبع حالة طلبات التوظيف" : "Track the status of your job applications"}</p>
            </div>
            <Link to="/hiring">
              <Button size="sm" className="rounded-full">
                <Search className="h-4 w-4 me-1.5" />{isAr ? "تصفح الوظائف" : "Browse Jobs"}
              </Button>
            </Link>
          </div>

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
            <div className="text-center py-16">
              <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-medium">{isAr ? "لا توجد طلبات بعد" : "No applications yet"}</p>
              <p className="text-sm text-muted-foreground mt-1">{isAr ? "تصفح الوظائف المتاحة وابدأ بالتقديم" : "Browse available jobs and start applying"}</p>
              <Link to="/hiring">
                <Button variant="outline" size="sm" className="mt-4 rounded-full">
                  <Search className="h-3.5 w-3.5 me-1" />{isAr ? "تصفح الوظائف" : "Browse Jobs"}
                </Button>
              </Link>
            </div>
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
                        <p className="text-sm font-medium truncate">
                          {isAr ? (a.job_postings?.title_ar || a.job_postings?.title) : a.job_postings?.title ?? "Job"}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          {a.job_postings?.type && <span>{formatStatus(a.job_postings.type)}</span>}
                          {a.job_postings?.location && <span>· {a.job_postings.location}</span>}
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <Badge variant="secondary" className={`text-[10px] ${STATUS_COLORS[a.status] ?? ""}`}>
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
      </section>
    </>
  );
}
