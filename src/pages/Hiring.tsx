import { useState, useMemo, lazy, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
const FreelancerBanner = lazy(() => import("@/components/hiring/FreelancerBanner"));
import SEO from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowRight, Briefcase, Users, Star, Shield, MapPin,
  Building2, GraduationCap, Zap, CheckCircle2, ExternalLink,
  Search, Heart, DollarSign, Send, Loader2, Filter
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

export default function Hiring() {
  const { lang, t } = useLanguage();
  const { user, accountType, role } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isAr = lang === "ar";

  const [activeTab, setActiveTab] = useState<"jobs" | "freelancers" | "recommended">("jobs");
  const [searchQuery, setSearchQuery] = useState("");
  const [trackFilter, setTrackFilter] = useState("all");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");

  // Job detail dialog
  const [detailJob, setDetailJob] = useState<any>(null);

  // Apply dialog
  const [applyJob, setApplyJob] = useState<any>(null);
  const [coverNote, setCoverNote] = useState("");
  const [applying, setApplying] = useState(false);

  // ── Data Queries ──

  const { data: jobs = [], isLoading: loadingJobs } = useQuery({
    queryKey: ["hiring-job-postings"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data: jobData, error } = await supabase
        .from("job_postings")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!jobData || jobData.length === 0) return [];
      const userIds = [...new Set(jobData.map((j: any) => j.company_user_id))];
      const { data: companies } = await supabase
        .from("company_profiles")
        .select("user_id, company_name, logo_url")
        .in("user_id", userIds);
      const companyMap = new Map((companies || []).map((c: any) => [c.user_id, c]));
      return jobData.map((j: any) => ({ ...j, company: companyMap.get(j.company_user_id) || null }));
    },
  });

  const { data: freelancers = [], isLoading: loadingFreelancers } = useQuery({
    queryKey: ["hiring-freelancers"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_profiles_browse" as any);
      if (error) throw error;
      return ((data as any[]) || []).filter((p: any) => p.skills && p.skills.length > 0);
    },
  });

  // Portfolio counts and hire stats for freelancers
  const { data: freelancerStats = {} } = useQuery({
    queryKey: ["hiring-freelancer-stats"],
    enabled: freelancers.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const userIds = freelancers.map((f: any) => f.user_id);
      const [portfolioRes, hiresRes] = await Promise.all([
        supabase.from("freelancer_portfolio").select("user_id").in("user_id", userIds),
        supabase.from("hire_requests")
          .select("freelancer_profile_id, status")
          .in("freelancer_profile_id", freelancers.map((f: any) => f.id))
          .eq("status", "completed"),
      ]);
      const portfolioCounts: Record<string, number> = {};
      (portfolioRes.data || []).forEach((p: any) => {
        portfolioCounts[p.user_id] = (portfolioCounts[p.user_id] || 0) + 1;
      });
      const hireCounts: Record<string, number> = {};
      (hiresRes.data || []).forEach((h: any) => {
        hireCounts[h.freelancer_profile_id] = (hireCounts[h.freelancer_profile_id] || 0) + 1;
      });
      return { portfolioCounts, hireCounts };
    },
  });

  // Current user's applications (to show "Applied" badge)
  const { data: myApplications = [] } = useQuery({
    queryKey: ["my-job-applications", user?.id],
    enabled: !!user && (accountType === "freelancer" || (!accountType && role === "individual")),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_applications")
        .select("job_id")
        .eq("applicant_user_id", user!.id);
      if (error) throw error;
      return (data || []).map((a: any) => a.job_id);
    },
  });

  // Company shortlists
  const { data: myShortlists = [] } = useQuery({
    queryKey: ["my-shortlists", user?.id],
    enabled: !!user && (accountType === "company" || (!accountType && role === "company")),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("freelancer_shortlists")
        .select("freelancer_user_id")
        .eq("company_user_id", user!.id);
      if (error) throw error;
      return (data || []).map((s: any) => s.freelancer_user_id);
    },
  });

  // ── Mutations ──

  const applyMutation = useMutation({
    mutationFn: async ({ jobId, note }: { jobId: string; note: string }) => {
      const { error } = await supabase.from("job_applications").insert({
        job_id: jobId,
        applicant_user_id: user!.id,
        cover_note: note || null,
        applicant_email: user!.email || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-job-applications"] });
      toast.success(isAr ? "تم تقديم طلبك بنجاح" : "Application submitted!");
      setApplyJob(null);
      setCoverNote("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const shortlistMutation = useMutation({
    mutationFn: async (freelancerUserId: string) => {
      const isShortlisted = myShortlists.includes(freelancerUserId);
      if (isShortlisted) {
        const { error } = await supabase
          .from("freelancer_shortlists")
          .delete()
          .eq("company_user_id", user!.id)
          .eq("freelancer_user_id", freelancerUserId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("freelancer_shortlists").insert({
          company_user_id: user!.id,
          freelancer_user_id: freelancerUserId,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-shortlists"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // ── Filtering ──

  const tracks = useMemo(() => {
    const set = new Set(freelancers.map((f: any) => f.track).filter(Boolean));
    return Array.from(set) as string[];
  }, [freelancers]);

  const filteredFreelancers = useMemo(() => {
    let list = freelancers;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((f: any) =>
        (f.full_name || "").toLowerCase().includes(q) ||
        (f.skills || []).some((s: string) => s.toLowerCase().includes(q))
      );
    }
    if (trackFilter !== "all") list = list.filter((f: any) => f.track === trackFilter);
    if (availableOnly) list = list.filter((f: any) => f.is_available);
    return list;
  }, [freelancers, searchQuery, trackFilter, availableOnly]);

  const recommended = useMemo(() => {
    return filteredFreelancers.filter((f: any) => f.is_devwady_alumni && f.rating && f.rating >= 4.5);
  }, [filteredFreelancers]);

  const filteredJobs = useMemo(() => {
    let list = jobs;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((j: any) =>
        (j.title || "").toLowerCase().includes(q) ||
        (j.title_ar || "").toLowerCase().includes(q) ||
        (j.tags || []).some((t: string) => t.toLowerCase().includes(q))
      );
    }
    if (typeFilter !== "all") list = list.filter((j: any) => j.type === typeFilter);
    return list;
  }, [jobs, searchQuery, typeFilter]);

  const handleApplyClick = (job: any) => {
    if (!user) { navigate("/login"); return; }
    setApplyJob(job);
    setCoverNote("");
  };

  const handleShortlistClick = (freelancerUserId: string) => {
    if (!user) { navigate("/login"); return; }
    shortlistMutation.mutate(freelancerUserId);
  };

  const tabs = [
    { key: "jobs" as const, label: isAr ? "الوظائف المتاحة" : "Open Positions", icon: Briefcase, count: filteredJobs.length },
    { key: "freelancers" as const, label: isAr ? "المستقلون" : "Freelancers", icon: Users, count: filteredFreelancers.length },
    { key: "recommended" as const, label: isAr ? "موصى بهم" : "Highly Recommended", icon: Star, count: recommended.length },
  ];

  // ── Render helpers ──

  const renderFreelancerCard = (f: any, i: number, showRecommended = false) => {
    const isShortlisted = myShortlists.includes(f.user_id);
    return (
      <motion.div key={f.id} custom={i} variants={fadeUp} initial="hidden" animate="visible" whileHover={{ y: -4 }}
        className={`bg-card rounded-2xl border p-6 hover:border-primary/30 transition-all relative ${showRecommended ? "border-2 border-primary/20" : "border-border"}`}>
        {showRecommended && (
          <div className="absolute -top-3 start-4 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1">
            <Zap className="h-3 w-3" /> {isAr ? "موصى به بشدة" : "Highly Recommended"}
          </div>
        )}
        {/* Shortlist button for companies */}
        {(role === "company" || !user) && (
          <button
            onClick={() => handleShortlistClick(f.user_id)}
            className="absolute top-4 end-4 p-2 rounded-full hover:bg-muted transition-colors"
            title={isAr ? "أضف للمفضلة" : "Shortlist"}
          >
            <Heart className={`h-5 w-5 transition-colors ${isShortlisted ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
          </button>
        )}
        <div className="flex items-center gap-3 mb-4">
          {f.avatar_url ? (
            <img loading="lazy" src={f.avatar_url} alt={f.full_name} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full gradient-brand flex items-center justify-center text-primary-foreground font-bold text-lg">
              {(f.full_name || "?")[0]}
            </div>
          )}
          <div>
            <Link to={`/freelancer/${f.slug || f.user_id}`} className="hover:text-primary transition-colors">
              <h3 className="font-bold flex items-center gap-1.5">
                {f.full_name || "Unknown"}
                {f.is_devwady_alumni && <Shield className="h-4 w-4 text-primary" />}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground">{f.track || ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm mb-4">
          {f.rating > 0 && (
            <span className="flex items-center gap-1 text-warning">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round(Number(f.rating)) ? "fill-current" : "text-muted-foreground/30"}`} />
              ))}
              <span className="ms-0.5">{Number(f.rating).toFixed(1)}</span>
            </span>
          )}
          <span className="text-muted-foreground">{f.projects_count || 0} {isAr ? "مشروع" : "projects"}</span>
          {(freelancerStats as any)?.portfolioCounts?.[f.user_id] > 0 && (
            <span className="text-muted-foreground">{(freelancerStats as any).portfolioCounts[f.user_id]} {isAr ? "عمل" : "portfolio"}</span>
          )}
          {(freelancerStats as any)?.hireCounts?.[f.id] > 0 && (
            <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> {(freelancerStats as any).hireCounts[f.id]} {isAr ? "مكتمل" : "completed"}</span>
          )}
          {f.hourly_rate && <span className="font-semibold text-primary">{f.hourly_rate}</span>}
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {(f.skills || []).slice(0, 6).map((s: string) => (
            <span key={s} className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs">{s}</span>
          ))}
          {(f.skills || []).length > 6 && (
            <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">+{f.skills.length - 6}</span>
          )}
        </div>
        {f.is_devwady_alumni && (
          <div className="text-xs text-primary bg-primary/5 rounded-lg px-3 py-2 flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" />
            {isAr ? "خريج أكاديمية DevWady" : "DevWady Academy Alumni"}
          </div>
        )}
        <div className="flex gap-2 mt-4">
          <Link to={`/freelancer/${f.slug || f.user_id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full rounded-full">
              {isAr ? "عرض الملف" : "View Profile"}
            </Button>
          </Link>
          <Link to="/contact" className="flex-1">
            <Button size="sm" className="w-full rounded-full gradient-brand text-primary-foreground">
              {isAr ? "تواصل" : "Contact"} <ExternalLink className="ms-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      <SEO title={t("seo.hiring.title")} description={t("seo.hiring.desc")} />
      {/* Freelancer authenticated banner */}
      <div className="container mx-auto px-4 pt-6">
        <Suspense fallback={null}><FreelancerBanner /></Suspense>
      </div>

      {/* Hero */}
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 gradient-brand opacity-5" />
        <div className="container mx-auto px-4 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
              {isAr ? "التوظيف والمستقلين" : "Hiring & Freelance Hub"}
            </span>
            <h1 className="text-4xl lg:text-6xl font-bold mb-4">
              {isAr ? "وظف أفضل الكفاءات التقنية" : "Hire Top Tech Talent"}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mb-8">
              {isAr
                ? "ابحث عن مطورين ومصممين ومختبرين من خريجي أكاديمية DevWady أو مستقلين معتمدين. جودة مضمونة."
                : "Find developers, designers & QA engineers from DevWady Academy alumni or vetted freelancers. Quality guaranteed."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Tabs */}
      <section className="py-6 border-b border-border sticky top-16 lg:top-20 bg-background/95 backdrop-blur-sm z-30">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? "gradient-brand text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4" /> {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="py-4 border-b border-border bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={activeTab === "jobs" ? (isAr ? "ابحث عن وظيفة..." : "Search jobs...") : (isAr ? "ابحث عن مستقل..." : "Search freelancers...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9 rounded-full"
              />
            </div>

            {activeTab !== "jobs" && (
              <>
                <Select value={trackFilter} onValueChange={setTrackFilter}>
                  <SelectTrigger className="w-[160px] rounded-full">
                    <Filter className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
                    <SelectValue placeholder={isAr ? "التخصص" : "Track"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? "الكل" : "All Tracks"}</SelectItem>
                    {tracks.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 text-sm">
                  <Switch checked={availableOnly} onCheckedChange={setAvailableOnly} />
                  <span className="text-muted-foreground">{isAr ? "متاح فقط" : "Available only"}</span>
                </div>
              </>
            )}

            {activeTab === "jobs" && (
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px] rounded-full">
                  <Filter className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
                  <SelectValue placeholder={isAr ? "النوع" : "Type"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "الكل" : "All Types"}</SelectItem>
                  {["full-time", "part-time", "contract", "remote"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Jobs Tab */}
          {activeTab === "jobs" && (
            <div className="space-y-4">
              {loadingJobs && <p className="text-center text-muted-foreground py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></p>}
              {!loadingJobs && filteredJobs.length === 0 && (
                <p className="text-center text-muted-foreground py-12">{isAr ? "لا توجد وظائف حالياً" : "No open positions at the moment"}</p>
              )}
              {filteredJobs.map((job: any, i: number) => {
                const company = job.company;
                const hasApplied = myApplications.includes(job.id);
                return (
                  <motion.div key={job.id} custom={i} variants={fadeUp} initial="hidden" animate="visible"
                    className="bg-card rounded-xl border border-border p-6 hover:border-primary/30 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {company?.logo_url && (
                            <img loading="lazy" src={company.logo_url} alt={company.company_name} className="w-10 h-10 rounded-lg object-cover border border-border" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-bold">{isAr ? job.title_ar || job.title : job.title}</h3>
                              {job.is_urgent && (
                                <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium flex items-center gap-1">
                                  <Zap className="h-3 w-3" /> {isAr ? "عاجل" : "Urgent"}
                                </span>
                              )}
                            </div>
                            {company?.company_name && (
                              <p className="text-sm text-muted-foreground">{company.company_name}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                          <Badge variant="secondary" className="rounded-full">{job.type}</Badge>
                          {job.location && (
                            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {isAr ? job.location_ar || job.location : job.location}</span>
                          )}
                          {job.salary_range && (
                            <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> {job.salary_range}</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {(job.tags || []).map((tag: string) => (
                            <span key={tag} className="px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-xs">{tag}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" className="rounded-full" onClick={() => setDetailJob(job)}>
                          {isAr ? "التفاصيل" : "Details"}
                        </Button>
                        {hasApplied ? (
                          <Badge variant="secondary" className="rounded-full px-4 py-2">
                            <CheckCircle2 className="h-3.5 w-3.5 me-1" /> {isAr ? "تم التقديم" : "Applied"}
                          </Badge>
                        ) : (
                          <Button className="rounded-full gradient-brand text-primary-foreground" size="sm" onClick={() => handleApplyClick(job)}>
                            <Send className="h-3.5 w-3.5 me-1" /> {isAr ? "قدم الآن" : "Apply"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Freelancers Tab */}
          {activeTab === "freelancers" && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {loadingFreelancers && <p className="text-center text-muted-foreground py-12 col-span-full"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></p>}
              {!loadingFreelancers && filteredFreelancers.length === 0 && (
                <p className="text-center text-muted-foreground py-12 col-span-full">{isAr ? "لا يوجد مستقلون حالياً" : "No freelancers available"}</p>
              )}
              {filteredFreelancers.map((f: any, i: number) => renderFreelancerCard(f, i))}
            </div>
          )}

          {/* Recommended Tab */}
          {activeTab === "recommended" && (
            <div className="space-y-6">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="h-6 w-6 text-primary" />
                  <h3 className="text-lg font-bold">{isAr ? "خريجون موصى بهم بشدة من DevWady" : "Highly Recommended DevWady Graduates"}</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isAr
                    ? "هؤلاء المتدربون تفوقوا في برامجنا التدريبية وأثبتوا جاهزيتهم للعمل من خلال شحن منتجات حقيقية."
                    : "These trainees excelled in our bootcamps and proved production-readiness by shipping real products."}
                </p>
              </div>
              {recommended.length === 0 && (
                <p className="text-center text-muted-foreground py-8">{isAr ? "لا يوجد خريجون موصى بهم حالياً" : "No recommended graduates yet"}</p>
              )}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommended.map((f: any, i: number) => renderFreelancerCard(f, i, true))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center max-w-2xl mx-auto">
            <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">
              {isAr ? "تحتاج فريق تقني كامل؟" : "Need a Full Tech Team?"}
            </h2>
            <p className="text-muted-foreground mb-8">
              {isAr
                ? "نقدم خدمة التعهيد الكامل — فرق جاهزة من المطورين والمصممين والمختبرين تحت إدارة DevWady."
                : "We offer full outsourcing — ready teams of developers, designers & QA under DevWady management."}
            </p>
            <Link to="/contact">
              <Button size="lg" className="rounded-full gradient-brand text-primary-foreground px-8">
                {isAr ? "تواصل معنا" : "Get in Touch"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Job Detail Dialog */}
      <Dialog open={!!detailJob} onOpenChange={() => setDetailJob(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          {detailJob && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{isAr ? detailJob.title_ar || detailJob.title : detailJob.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                {detailJob.company?.company_name && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" /> {detailJob.company.company_name}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="rounded-full">{detailJob.type}</Badge>
                  {detailJob.location && <Badge variant="outline" className="rounded-full"><MapPin className="h-3 w-3 me-1" />{isAr ? detailJob.location_ar || detailJob.location : detailJob.location}</Badge>}
                  {detailJob.salary_range && <Badge variant="outline" className="rounded-full"><DollarSign className="h-3 w-3 me-1" />{detailJob.salary_range}</Badge>}
                  {detailJob.is_urgent && <Badge variant="destructive" className="rounded-full"><Zap className="h-3 w-3 me-1" />{isAr ? "عاجل" : "Urgent"}</Badge>}
                </div>
                {(detailJob.description || detailJob.description_ar) && (
                  <div>
                    <h4 className="font-semibold mb-1">{isAr ? "الوصف" : "Description"}</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {isAr ? detailJob.description_ar || detailJob.description : detailJob.description}
                    </p>
                  </div>
                )}
                {detailJob.requirements && detailJob.requirements.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-1">{isAr ? "المتطلبات" : "Requirements"}</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {detailJob.requirements.map((r: string, idx: number) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {detailJob.tags && detailJob.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {detailJob.tags.map((t: string) => (
                      <span key={t} className="px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-xs">{t}</span>
                    ))}
                  </div>
                )}
                <div className="pt-2">
                  {myApplications.includes(detailJob.id) ? (
                    <Badge variant="secondary" className="rounded-full px-4 py-2">
                      <CheckCircle2 className="h-3.5 w-3.5 me-1" /> {isAr ? "تم التقديم" : "Already Applied"}
                    </Badge>
                  ) : (
                    <Button className="rounded-full gradient-brand text-primary-foreground w-full" onClick={() => { setDetailJob(null); handleApplyClick(detailJob); }}>
                      <Send className="h-4 w-4 me-2" /> {isAr ? "قدم الآن" : "Apply Now"}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Apply Dialog */}
      <Dialog open={!!applyJob} onOpenChange={() => setApplyJob(null)}>
        <DialogContent className="max-w-md">
          {applyJob && (
            <>
              <DialogHeader>
                <DialogTitle>{isAr ? "تقديم طلب" : "Apply for"}: {isAr ? applyJob.title_ar || applyJob.title : applyJob.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">{isAr ? "رسالة مرفقة (اختياري)" : "Cover Note (optional)"}</label>
                  <Textarea
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value.slice(0, 500))}
                    placeholder={isAr ? "اكتب رسالة قصيرة عن نفسك..." : "Write a short note about yourself..."}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-end">{coverNote.length}/500</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-full" onClick={() => setApplyJob(null)}>
                    {isAr ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button
                    className="flex-1 rounded-full gradient-brand text-primary-foreground"
                    disabled={applying}
                    onClick={() => {
                      setApplying(true);
                      applyMutation.mutate({ jobId: applyJob.id, note: coverNote }, {
                        onSettled: () => setApplying(false),
                      });
                    }}
                  >
                    {applying ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Send className="h-4 w-4 me-2" />}
                    {isAr ? "إرسال" : "Submit"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
