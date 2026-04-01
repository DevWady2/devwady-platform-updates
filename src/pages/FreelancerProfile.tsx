import { useParams, Link } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import {
  ArrowLeft, Star, Shield, GraduationCap, MapPin, Globe, Github, Linkedin,
  Briefcase, Heart, ExternalLink, UserX, ChevronLeft, ChevronRight, Send,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function FreelancerProfile() {
  const { id: slug } = useParams<{ id: string }>();
  const { lang, t } = useLanguage();
  const { user, accountType } = useAuth();
  const qc = useQueryClient();
  const isAr = lang === "ar";
  const viewTracked = useRef(false);

  // Fetch profile by slug
  const { data: profile, isLoading } = useQuery({
    queryKey: ["freelancer-profile", slug],
    enabled: !!slug,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_public_profile_by_slug", { p_slug: slug! });
      if (error) throw error;
      return (data as any[])?.[0] ?? null;
    },
  });

  const profileUserId = profile?.user_id;

  // Hire stats
  const { data: hireStatsData } = useQuery({
    queryKey: ["freelancer-hire-stats", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("hire_requests")
        .select("status")
        .eq("freelancer_profile_id", profile!.id);
      const all = data || [];
      return {
        completed: all.filter((h: any) => h.status === "completed").length,
        total: all.length,
      };
    },
  });

  const { data: reviewCount = 0 } = useQuery({
    queryKey: ["freelancer-review-count", profileUserId],
    enabled: !!profileUserId,
    queryFn: async () => {
      const { count } = await supabase
        .from("freelancer_reviews")
        .select("id", { count: "exact", head: true })
        .eq("freelancer_user_id", profileUserId!)
        .eq("is_approved", true);
      return count || 0;
    },
  });

  // Company profile for hire request
  const { data: companyProfile } = useQuery({
    queryKey: ["my-company-profile", user?.id],
    enabled: !!user && accountType === "company",
    queryFn: async () => {
      const { data } = await supabase.from("company_profiles").select("id, company_name").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  // Hire dialog state
  const [hireOpen, setHireOpen] = useState(false);
  const [hireTitle, setHireTitle] = useState("");
  const [hireBudget, setHireBudget] = useState("");
  const [hireDuration, setHireDuration] = useState("");
  const [hireMessage, setHireMessage] = useState("");
  const [hireRequirements, setHireRequirements] = useState("");
  const [hiring, setHiring] = useState(false);

  // Track profile view
  const viewMutation = useMutation({
    mutationFn: async () => {
      await supabase.from("profile_views").insert({
        profile_user_id: profileUserId!,
        viewer_user_id: user!.id,
      });
    },
  });

  useEffect(() => {
    if (user && profileUserId && user.id !== profileUserId && !viewTracked.current) {
      viewTracked.current = true;
      viewMutation.mutate();
    }
  }, [user, profileUserId]);

  // Shortlist state for company users
  const { data: isShortlisted = false } = useQuery({
    queryKey: ["shortlist-check", user?.id, profileUserId],
    enabled: !!user && accountType === "company" && !!profileUserId,
    queryFn: async () => {
      const { data } = await supabase
        .from("freelancer_shortlists")
        .select("id")
        .eq("company_user_id", user!.id)
        .eq("freelancer_user_id", profileUserId!)
        .maybeSingle();
      return !!data;
    },
  });

  const shortlistMutation = useMutation({
    mutationFn: async () => {
      if (isShortlisted) {
        await supabase.from("freelancer_shortlists").delete()
          .eq("company_user_id", user!.id).eq("freelancer_user_id", profileUserId!);
      } else {
        await supabase.from("freelancer_shortlists").insert({
          company_user_id: user!.id,
          freelancer_user_id: profileUserId!,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shortlist-check", user?.id, profileUserId] });
      qc.invalidateQueries({ queryKey: ["my-shortlists"] });
      toast.success(isShortlisted ? (isAr ? "تمت الإزالة" : "Removed from shortlist") : (isAr ? "تمت الإضافة" : "Added to shortlist"));
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Loading
  if (isLoading) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl space-y-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </section>
    );
  }

  // Not found
  if (!profile) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <UserX className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">{isAr ? "لم يتم العثور على الملف" : "Profile Not Found"}</h2>
          <p className="text-muted-foreground mb-6">{isAr ? "هذا الملف غير موجود أو تم حذفه" : "This profile doesn't exist or has been removed"}</p>
          <Link to="/hiring">
            <Button variant="outline" className="rounded-full">
              <ArrowLeft className="icon-flip-rtl me-2 h-4 w-4" /> {isAr ? "العودة للتوظيف" : "Back to Hiring"}
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  const f = profile;

  return (
    <>
      <SEO title={profile?.full_name || t("seo.hiring.title")} />
    <section className="py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link to="/hiring" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="icon-flip-rtl h-4 w-4" /> {isAr ? "العودة للتوظيف" : "Back to Hiring"}
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Header */}
          <div className="bg-card rounded-2xl border border-border p-8">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {f.avatar_url ? (
                <img loading="lazy" src={f.avatar_url} alt={f.full_name || ""} className="w-[100px] h-[100px] rounded-2xl object-cover shrink-0" />
              ) : (
                <div className="w-[100px] h-[100px] rounded-2xl gradient-brand flex items-center justify-center text-primary-foreground text-4xl font-bold shrink-0">
                  {(f.full_name || "?")[0]}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-2xl font-bold">{f.full_name}</h1>
                  {f.is_devwady_alumni && <Shield className="h-5 w-5 text-primary" />}
                  <Badge variant={f.is_available ? "default" : "secondary"} className="rounded-full">
                    {f.is_available ? (isAr ? "متاح" : "Available") : (isAr ? "غير متاح" : "Unavailable")}
                  </Badge>
                </div>
                {f.track && <p className="text-lg text-muted-foreground">{f.track}{f.batch ? ` · ${f.batch}` : ""}</p>}
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                  {(f.rating ?? 0) > 0 && <span className="flex items-center gap-1 text-warning"><Star className="h-4 w-4 fill-current" /> {f.rating}</span>}
                  <span className="flex items-center gap-1 text-muted-foreground"><Briefcase className="h-4 w-4" /> {f.projects_count || 0} {isAr ? "مشروع" : "projects"}</span>
                  {f.location && <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-4 w-4" /> {f.location}</span>}
                  {f.hourly_rate && <span className="font-semibold text-primary">{f.hourly_rate}</span>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {(accountType === "company" || !user) && (
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => {
                      if (!user) { window.location.href = "/login"; return; }
                      shortlistMutation.mutate();
                    }}
                  >
                    <Heart className={`h-4 w-4 me-1.5 ${isShortlisted ? "fill-destructive text-destructive" : ""}`} />
                    {isShortlisted ? (isAr ? "في المفضلة" : "Shortlisted") : (isAr ? "أضف للمفضلة" : "Shortlist")}
                  </Button>
                )}
                {accountType === "company" && user && companyProfile ? (
                  <Button
                    className="gradient-brand text-primary-foreground rounded-full px-6"
                    onClick={() => setHireOpen(true)}
                  >
                    <Send className="h-4 w-4 me-1.5" /> {isAr ? "أرسل عرض توظيف" : "Send Hire Request"}
                  </Button>
                ) : (
                  <Link to={`/contact?subject=Hiring: ${f.full_name}`}>
                    <Button className="gradient-brand text-primary-foreground rounded-full px-6">
                      {isAr ? "توظيف" : "Hire Now"}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {f.bio && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl border border-border p-6">
              <h2 className="font-bold text-lg mb-3">{isAr ? "نبذة" : "About"}</h2>
              <p className="text-muted-foreground leading-relaxed">{f.bio}</p>
            </motion.div>
          )}

          {/* Skills */}
          {f.skills && f.skills.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-card rounded-2xl border border-border p-6">
              <h2 className="font-bold text-lg mb-3">{isAr ? "المهارات" : "Skills"}</h2>
              <div className="flex flex-wrap gap-2">
                {f.skills.map((s: string) => (
                  <span key={s} className="px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm">{s}</span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Professional */}
          {(f.portfolio_url || f.linkedin_url || f.github_url) && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-card rounded-2xl border border-border p-6">
              <h2 className="font-bold text-lg mb-3">{isAr ? "الروابط المهنية" : "Professional Links"}</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {f.portfolio_url && (
                  <a href={f.portfolio_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted">
                    <Globe className="h-4 w-4" /> {isAr ? "الموقع الشخصي" : "Portfolio"} <ExternalLink className="h-3 w-3 ms-auto" />
                  </a>
                )}
                {f.linkedin_url && (
                  <a href={f.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted">
                    <Linkedin className="h-4 w-4" /> LinkedIn <ExternalLink className="h-3 w-3 ms-auto" />
                  </a>
                )}
                {f.github_url && (
                  <a href={f.github_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted">
                    <Github className="h-4 w-4" /> GitHub <ExternalLink className="h-3 w-3 ms-auto" />
                  </a>
                )}
              </div>
            </motion.div>
          )}

          {/* DevWady Alumni */}
          {f.is_devwady_alumni && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <GraduationCap className="h-6 w-6 text-primary" />
                <h2 className="font-bold text-lg">{isAr ? "خريج أكاديمية DevWady" : "DevWady Academy Alumni"}</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {f.track}{f.batch ? ` · ${f.batch}` : ""}
              </p>
            </motion.div>
          )}

          {/* Hire Statistics */}
          {(hireStatsData?.completed || 0) > 0 || reviewCount > 0 ? (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.27 }}
              className="bg-card rounded-2xl border border-border p-6">
              <h2 className="font-bold text-lg mb-3">{isAr ? "إحصائيات" : "Statistics"}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {hireStatsData && hireStatsData.completed > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{hireStatsData.completed}</div>
                    <div className="text-xs text-muted-foreground">{isAr ? "مشاريع مكتملة" : "Completed Hires"}</div>
                  </div>
                )}
                {(f.rating ?? 0) > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-warning flex items-center justify-center gap-1"><Star className="h-5 w-5 fill-current" /> {Number(f.rating).toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">{isAr ? "التقييم" : "Rating"}</div>
                  </div>
                )}
                {reviewCount > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold">{reviewCount}</div>
                    <div className="text-xs text-muted-foreground">{isAr ? "تقييمات" : "Reviews"}</div>
                  </div>
                )}
                <div className="text-center">
                  <div className="text-2xl font-bold text-muted-foreground">{formatDistanceToNow(new Date(f.created_at), { addSuffix: false })}</div>
                  <div className="text-xs text-muted-foreground">{isAr ? "عضو منذ" : "Member for"}</div>
                </div>
              </div>
            </motion.div>
          ) : null}

          {/* Portfolio Section */}
          <PortfolioSection userId={profileUserId} isAr={isAr} />

          {/* Reviews Section */}
          <ReviewsSection userId={profileUserId} isAr={isAr} />
        </motion.div>
      </div>
    </section>

    {/* Hire Request Dialog */}
    {accountType === "company" && companyProfile && (
      <Dialog open={hireOpen} onOpenChange={setHireOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isAr ? "إرسال عرض توظيف" : "Send Hire Request"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>{isAr ? "عنوان المشروع" : "Project Title"}</Label>
              <Input value={hireTitle} onChange={(e) => setHireTitle(e.target.value)} placeholder={isAr ? "مثال: مطور React لمتجر إلكتروني" : "e.g. React Developer for E-commerce"} />
            </div>
            <div>
              <Label>{isAr ? "الميزانية" : "Budget Range"}</Label>
              <Select value={hireBudget} onValueChange={setHireBudget}>
                <SelectTrigger><SelectValue placeholder={isAr ? "اختر" : "Select"} /></SelectTrigger>
                <SelectContent>
                  {["Under $1,000", "$1,000–$5,000", "$5,000–$15,000", "$15,000–$50,000", "$50,000+", "Negotiable"].map(b => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isAr ? "المدة" : "Duration"}</Label>
              <Select value={hireDuration} onValueChange={setHireDuration}>
                <SelectTrigger><SelectValue placeholder={isAr ? "اختر" : "Select"} /></SelectTrigger>
                <SelectContent>
                  {[
                    { v: "less_1month", l: isAr ? "أقل من شهر" : "Less than 1 month" },
                    { v: "1_3months", l: isAr ? "1-3 أشهر" : "1–3 months" },
                    { v: "3_6months", l: isAr ? "3-6 أشهر" : "3–6 months" },
                    { v: "6_12months", l: isAr ? "6-12 شهر" : "6–12 months" },
                    { v: "ongoing", l: isAr ? "مستمر" : "Ongoing" },
                  ].map(d => <SelectItem key={d.v} value={d.v}>{d.l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isAr ? "المتطلبات" : "Requirements"}</Label>
              <Textarea value={hireRequirements} onChange={(e) => setHireRequirements(e.target.value)} placeholder={isAr ? "مهارات أو خبرة مطلوبة..." : "Specific skills or experience needed..."} rows={2} />
            </div>
            <div>
              <Label>{isAr ? "رسالة" : "Message"}</Label>
              <Textarea value={hireMessage} onChange={(e) => setHireMessage(e.target.value)} placeholder={isAr ? "أخبر المستقل عن مشروعك..." : "Tell the freelancer about your project..."} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHireOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button
              disabled={hiring || !hireMessage.trim()}
              onClick={async () => {
                setHiring(true);
                try {
                  const { error } = await supabase.from("hire_requests").insert({
                    company_id: companyProfile.id,
                    freelancer_profile_id: f.id,
                    title: hireTitle || null,
                    budget_range: hireBudget || null,
                    duration: hireDuration || null,
                    requirements: hireRequirements || null,
                    message: hireMessage,
                  });
                  if (error) throw error;
                  toast.success(isAr ? "تم إرسال عرض التوظيف" : "Hire request sent!");
                  setHireOpen(false);
                  setHireTitle(""); setHireBudget(""); setHireDuration(""); setHireMessage(""); setHireRequirements("");
                } catch (err: any) {
                  toast.error(err.message);
                } finally {
                  setHiring(false);
                }
              }}
            >
              {hiring && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {isAr ? "إرسال" : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )}
    </>
  );
}

/* ---------- Portfolio Section Component ---------- */
function PortfolioSection({ userId, isAr }: { userId: string | undefined; isAr: boolean }) {
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  const { data: portfolioItems = [] } = useQuery({
    queryKey: ["freelancer-portfolio-public", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("freelancer_portfolio")
        .select("*")
        .eq("user_id", userId!)
        .order("is_featured", { ascending: false })
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  if (!portfolioItems.length) return null;

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-card rounded-2xl border border-border p-6">
        <h2 className="font-bold text-lg mb-4">{isAr ? "معرض الأعمال" : "Portfolio"}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {portfolioItems.map((item) => (
            <div key={item.id}
              className="rounded-xl border border-border overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => {
                const imgs = [item.thumbnail_url, ...(item.images || [])].filter(Boolean) as string[];
                if (imgs.length) setLightbox({ images: imgs, index: 0 });
              }}
            >
              {item.thumbnail_url ? (
                <img loading="lazy" src={item.thumbnail_url} alt={item.title} className="w-full aspect-video object-cover" />
              ) : (
                <div className="w-full aspect-video bg-accent flex items-center justify-center">
                  <span className="text-sm text-accent-foreground">{(item.technologies as string[])?.[0] || "Project"}</span>
                </div>
              )}
              <div className="p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm truncate flex-1">
                    {isAr && item.title_ar ? item.title_ar : item.title}
                  </h3>
                  {item.is_featured && <Star className="h-4 w-4 text-warning fill-warning shrink-0" />}
                </div>
                {item.technologies && (item.technologies as string[]).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(item.technologies as string[]).slice(0, 3).map((t) => (
                      <span key={t} className="px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px]">{t}</span>
                    ))}
                  </div>
                )}
                {item.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {isAr && item.description_ar ? item.description_ar : item.description}
                  </p>
                )}
                <div className="flex gap-2 pt-1">
                  {item.project_url && (
                    <a href={item.project_url} target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-primary">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {item.github_url && (
                    <a href={item.github_url} target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-primary">
                      <Github className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Lightbox */}
      <Dialog open={!!lightbox} onOpenChange={() => setLightbox(null)}>
        <DialogContent className="max-w-3xl p-2 bg-background/95">
          {lightbox && (
            <div className="relative">
              <img loading="lazy" src={lightbox.images[lightbox.index]} alt="" className="w-full max-h-[75vh] object-contain rounded-lg" />
              {lightbox.images.length > 1 && (
                <>
                  <button onClick={() => setLightbox((l) => l ? { ...l, index: (l.index - 1 + l.images.length) % l.images.length } : null)}
                    className="absolute start-2 top-1/2 -translate-y-1/2 bg-background/80 rounded-full p-1.5 hover:bg-background">
                    <ChevronLeft className="icon-flip-rtl h-5 w-5" />
                  </button>
                  <button onClick={() => setLightbox((l) => l ? { ...l, index: (l.index + 1) % l.images.length } : null)}
                    className="absolute end-2 top-1/2 -translate-y-1/2 bg-background/80 rounded-full p-1.5 hover:bg-background">
                    <ChevronRight className="icon-flip-rtl h-5 w-5" />
                  </button>
                </>
              )}
              <div className="text-center text-sm text-muted-foreground mt-2">
                {lightbox.index + 1} / {lightbox.images.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ---------- Reviews Section Component ---------- */
function ReviewsSection({ userId, isAr }: { userId: string | undefined; isAr: boolean }) {
  const { data: reviews = [] } = useQuery({
    queryKey: ["freelancer-reviews-public", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("freelancer_reviews")
        .select("*")
        .eq("freelancer_user_id", userId!)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (!reviews.length) return null;

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
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
              <span className="text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString()}
              </span>
            </div>
            {r.title && <p className="font-medium text-sm">{r.title}</p>}
            {r.review && <p className="text-sm text-muted-foreground mt-1">{r.review}</p>}
            {r.skills_demonstrated && (r.skills_demonstrated as string[]).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {(r.skills_demonstrated as string[]).map((sk) => (
                  <span key={sk} className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px]">{sk}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
