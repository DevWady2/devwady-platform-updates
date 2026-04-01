import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft, FileText, Clock, CheckCircle2, XCircle, Eye,
  Briefcase, MapPin, DollarSign, Loader2, Building2, Zap, ArrowRight
} from "lucide-react";

const statusConfig: Record<string, { color: string; icon: typeof Clock }> = {
  pending: { color: "bg-warning/10 text-warning", icon: Clock },
  reviewed: { color: "bg-primary/10 text-primary", icon: Eye },
  shortlisted: { color: "bg-green-500/10 text-green-600", icon: CheckCircle2 },
  rejected: { color: "bg-destructive/10 text-destructive", icon: XCircle },
};

export default function ProfileApplications() {
  const { user, loading: authLoading, accountType } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const isAr = lang === "ar";
  const [tab, setTab] = useState("all");
  const [detailApp, setDetailApp] = useState<any>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }
    if (!(accountType === "freelancer" || accountType === "admin")) { navigate("/"); return; }
  }, [user, authLoading, accountType]);

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["my-applications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: apps, error } = await supabase
        .from("job_applications")
        .select("*")
        .eq("applicant_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!apps || apps.length === 0) return [];

      // Fetch job details
      const jobIds = [...new Set(apps.map((a: any) => a.job_id))];
      const { data: jobs } = await supabase
        .from("job_postings")
        .select("id, title, title_ar, type, location, location_ar, description, description_ar, requirements, salary_range, tags, is_urgent, company_user_id")
        .in("id", jobIds);

      const jobMap = new Map((jobs || []).map((j: any) => [j.id, j]));

      // Fetch company profiles
      const companyUserIds = [...new Set((jobs || []).map((j: any) => j.company_user_id).filter(Boolean))];
      const { data: companies } = companyUserIds.length > 0
        ? await supabase.from("company_profiles").select("user_id, company_name, logo_url").in("user_id", companyUserIds)
        : { data: [] };
      const companyMap = new Map((companies || []).map((c: any) => [c.user_id, c]));

      return apps.map((a: any) => {
        const job = jobMap.get(a.job_id);
        return { ...a, job, company: job ? companyMap.get(job.company_user_id) || null : null };
      });
    },
  });

  const filtered = useMemo(() => {
    if (tab === "all") return applications;
    return applications.filter((a: any) => a.status === tab);
  }, [applications, tab]);

  const counts = useMemo(() => ({
    all: applications.length,
    pending: applications.filter((a: any) => a.status === "pending").length,
    shortlisted: applications.filter((a: any) => a.status === "shortlisted").length,
    rejected: applications.filter((a: any) => a.status === "rejected").length,
  }), [applications]);

  if (authLoading || isLoading) {
    return <section className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></section>;
  }

  return (
    <section className="py-24">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link to="/profile" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="icon-flip-rtl h-4 w-4" /> {isAr ? "العودة للملف" : "Back to Profile"}
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <h1 className="text-2xl font-bold">{isAr ? "طلباتي" : "My Applications"}</h1>
            <p className="text-muted-foreground">{isAr ? "تتبع حالة طلبات التوظيف" : "Track your job application status"}</p>
          </div>

          <Tabs value={tab} onValueChange={setTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">{isAr ? "الكل" : "All"} ({counts.all})</TabsTrigger>
              <TabsTrigger value="pending">{isAr ? "معلق" : "Pending"} ({counts.pending})</TabsTrigger>
              <TabsTrigger value="shortlisted">{isAr ? "مرشح" : "Shortlisted"} ({counts.shortlisted})</TabsTrigger>
              <TabsTrigger value="rejected">{isAr ? "مرفوض" : "Rejected"} ({counts.rejected})</TabsTrigger>
            </TabsList>
          </Tabs>

          {filtered.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border py-16 text-center">
              <FileText className="h-14 w-14 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="font-semibold text-lg mb-1">{isAr ? "لا توجد طلبات بعد" : "No applications yet"}</h3>
              <p className="text-sm text-muted-foreground mb-4">{isAr ? "ابحث عن وظائف وقدم طلبك" : "Browse open positions and apply"}</p>
              <Link to="/hiring">
                <Button className="rounded-full gradient-brand text-primary-foreground">
                  <Briefcase className="h-4 w-4 me-2" /> {isAr ? "تصفح الوظائف" : "Browse Jobs"} <ArrowRight className="icon-flip-rtl h-4 w-4 ms-1" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((app: any, i: number) => {
                const cfg = statusConfig[app.status] || statusConfig.pending;
                const StatusIcon = cfg.icon;
                return (
    <>
      <SEO title={t("seo.profileApplications.title")} />
                  <motion.div key={app.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {app.company?.logo_url ? (
                          <img loading="lazy" src={app.company.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-border shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold">{app.job ? (isAr ? app.job.title_ar || app.job.title : app.job.title) : (isAr ? "وظيفة محذوفة" : "Deleted job")}</h3>
                          {app.company?.company_name && <p className="text-sm text-muted-foreground">{app.company.company_name}</p>}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            {app.job?.type && <Badge variant="secondary" className="text-xs rounded-full">{app.job.type}</Badge>}
                            {app.job?.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{isAr ? app.job.location_ar || app.job.location : app.job.location}</span>}
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={`rounded-full gap-1 ${cfg.color}`}>
                          <StatusIcon className="h-3 w-3" /> {app.status}
                        </Badge>
                        {app.job && (
                          <Button variant="outline" size="sm" className="rounded-full text-xs" onClick={() => setDetailApp(app)}>
                            {isAr ? "التفاصيل" : "View Job"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
    </>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Job Detail Dialog */}
        <Dialog open={!!detailApp} onOpenChange={() => setDetailApp(null)}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            {detailApp?.job && (
              <>
                <DialogHeader>
                  <DialogTitle>{isAr ? detailApp.job.title_ar || detailApp.job.title : detailApp.job.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  {detailApp.company?.company_name && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" /> {detailApp.company.company_name}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="rounded-full">{detailApp.job.type}</Badge>
                    {detailApp.job.location && <Badge variant="outline" className="rounded-full"><MapPin className="h-3 w-3 me-1" />{detailApp.job.location}</Badge>}
                    {detailApp.job.salary_range && <Badge variant="outline" className="rounded-full"><DollarSign className="h-3 w-3 me-1" />{detailApp.job.salary_range}</Badge>}
                    {detailApp.job.is_urgent && <Badge variant="destructive" className="rounded-full"><Zap className="h-3 w-3 me-1" />{isAr ? "عاجل" : "Urgent"}</Badge>}
                  </div>
                  {detailApp.job.description && (
                    <div>
                      <h4 className="font-semibold mb-1">{isAr ? "الوصف" : "Description"}</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{isAr ? detailApp.job.description_ar || detailApp.job.description : detailApp.job.description}</p>
                    </div>
                  )}
                  {detailApp.job.requirements?.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-1">{isAr ? "المتطلبات" : "Requirements"}</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {detailApp.job.requirements.map((r: string, idx: number) => <li key={idx}>{r}</li>)}
                      </ul>
                    </div>
                  )}
                  {detailApp.job.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {detailApp.job.tags.map((t: string) => <span key={t} className="px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-xs">{t}</span>)}
                    </div>
                  )}
                  <div className="pt-2 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      {isAr ? "حالة طلبك:" : "Your application status:"}{" "}
                      <Badge className={`rounded-full ${(statusConfig[detailApp.status] || statusConfig.pending).color}`}>{detailApp.status}</Badge>
                    </p>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
