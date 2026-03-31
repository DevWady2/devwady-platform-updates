import { useParams, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import {
  Building2, MapPin, Globe, Users, Calendar, Star, CheckCircle2,
  Briefcase, ExternalLink, ArrowLeft, Linkedin, Twitter,
} from "lucide-react";

export default function CompanyPublicProfile() {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const { data: company, isLoading } = useQuery({
    queryKey: ["company-public", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["company-jobs-public", company?.user_id],
    enabled: !!company?.user_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_postings")
        .select("*")
        .eq("company_user_id", company!.user_id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["company-reviews-public", company?.user_id],
    enabled: !!company?.user_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_reviews")
        .select("*")
        .eq("company_user_id", company!.user_id)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <section className="max-w-4xl mx-auto py-10 px-4 space-y-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-20 w-full" />
      </section>
    );
  }

  if (!company) {
    return (
      <section className="max-w-4xl mx-auto py-20 px-4 text-center">
        <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">{isAr ? "الشركة غير موجودة" : "Company not found"}</h1>
        <Link to="/companies"><Button variant="outline">{isAr ? "عرض الشركات" : "Browse companies"}</Button></Link>
      </section>
    );
  }

  const socialLinks = (company.social_links || {}) as Record<string, string>;
  const avgRating = Number(company.avg_rating) || 0;

  return (
    <>
      <SEO title={company.company_name} description={company.tagline || company.description?.slice(0, 160) || ""} />
      <section className="max-w-4xl mx-auto py-6 px-4 space-y-6">
        <Link to="/companies" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="icon-flip-rtl h-4 w-4" /> {isAr ? "الشركات" : "Companies"}
        </Link>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden border border-border">
          {/* Cover */}
          <div className={`h-36 ${company.cover_image_url ? "" : "bg-gradient-to-br from-primary/20 to-accent/30"}`}>
            {company.cover_image_url && (
              <img loading="lazy" src={company.cover_image_url} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          {/* Info */}
          <div className="p-6 pt-0 -mt-10 relative">
            <div className="flex items-end gap-4 mb-4">
              {company.logo_url ? (
                <img loading="lazy" src={company.logo_url} alt={company.company_name}
                  className="h-20 w-20 rounded-xl border-4 border-background object-cover shadow-lg bg-background" />
              ) : (
                <div className="h-20 w-20 rounded-xl border-4 border-background bg-primary/10 flex items-center justify-center shadow-lg">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold">{company.company_name}</h1>
                  {company.is_verified && (
                    <Badge className="bg-emerald-500/15 text-emerald-600 border-0 gap-1">
                      <CheckCircle2 className="h-3 w-3" /> {isAr ? "موثّقة" : "Verified"}
                    </Badge>
                  )}
                </div>
                {(isAr ? company.tagline_ar : company.tagline) && (
                  <p className="text-muted-foreground text-sm mt-0.5">
                    {isAr ? company.tagline_ar : company.tagline}
                  </p>
                )}
              </div>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {company.industry && (
                <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {company.industry}</span>
              )}
              {company.location && (
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {company.location}</span>
              )}
              {company.employee_count && (
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {company.employee_count}</span>
              )}
              {company.founded_year && (
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {isAr ? `تأسست ${company.founded_year}` : `Est. ${company.founded_year}`}</span>
              )}
            </div>

            {/* Social */}
            <div className="flex gap-2 mt-3">
              {company.website && (
                <a href={company.website} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="gap-1"><Globe className="h-3.5 w-3.5" /> {isAr ? "الموقع" : "Website"}</Button>
                </a>
              )}
              {socialLinks.linkedin && (
                <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="ghost"><Linkedin className="h-4 w-4" /></Button>
                </a>
              )}
              {socialLinks.twitter && (
                <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="ghost"><Twitter className="h-4 w-4" /></Button>
                </a>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center">
            <Briefcase className="h-5 w-5 mx-auto text-primary" />
            <p className="text-2xl font-bold mt-1">{company.total_hires || 0}</p>
            <p className="text-xs text-muted-foreground">{isAr ? "توظيفات" : "Hires"}</p>
          </Card>
          <Card className="p-4 text-center">
            <Star className="h-5 w-5 mx-auto text-amber-500" />
            <p className="text-2xl font-bold mt-1">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</p>
            <p className="text-xs text-muted-foreground">{isAr ? "التقييم" : "Rating"}</p>
          </Card>
          <Card className="p-4 text-center">
            <Building2 className="h-5 w-5 mx-auto text-emerald-600" />
            <p className="text-2xl font-bold mt-1">{jobs.length}</p>
            <p className="text-xs text-muted-foreground">{isAr ? "وظائف مفتوحة" : "Open Jobs"}</p>
          </Card>
        </div>

        {/* About */}
        {company.description && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-bold text-lg mb-3">{isAr ? "عن الشركة" : "About"}</h2>
            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{company.description}</p>
          </motion.div>
        )}

        {/* Open Positions */}
        {jobs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-bold text-lg mb-4">{isAr ? "الوظائف المفتوحة" : "Open Positions"} ({jobs.length})</h2>
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm">{isAr && job.title_ar ? job.title_ar : job.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-[10px]">{job.type}</Badge>
                      {job.location && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{isAr && job.location_ar ? job.location_ar : job.location}</span>}
                      {job.salary_range && <span>{job.salary_range}</span>}
                    </div>
                    {job.tags && (job.tags as string[]).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {(job.tags as string[]).slice(0, 4).map((tag) => (
                          <span key={tag} className="px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px]">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Link to="/hiring">
                    <Button size="sm" variant="outline" className="shrink-0 gap-1">
                      <ExternalLink className="h-3 w-3" /> {isAr ? "تقديم" : "Apply"}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">{isAr ? "التقييمات" : "Reviews"}</h2>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"}`} />
                  ))}
                </div>
                <span className="text-sm font-semibold">{avgRating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({reviews.length})</span>
              </div>
            </div>
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="border-t border-border/50 pt-4 first:border-0 first:pt-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`h-3.5 w-3.5 ${s <= r.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"}`} />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  {r.title && <p className="font-medium text-sm">{r.title}</p>}
                  {r.review && <p className="text-sm text-muted-foreground mt-1">{r.review}</p>}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </section>
    </>
  );
}
