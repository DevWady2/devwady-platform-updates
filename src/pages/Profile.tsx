import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin, Globe, Github, Linkedin, DollarSign, Pencil,
  Users, Calendar, Loader2, ExternalLink, CreditCard,
} from "lucide-react";
import ProfileCompletenessBanner from "@/components/profile/ProfileCompletenessBanner";
import MyRolesSection from "@/components/profile/MyRolesSection";

const t = (lang: string, en: string, ar: string) => (lang === "ar" ? ar : en);

export default function Profile() {
  const { user, role: authRole } = useAuth();
  const { lang: uiLang } = useLanguage();

  /* ── profile ── */
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  /* ── company (only when role is company) ── */
  const { data: company } = useQuery({
    queryKey: ["my-company", user?.id],
    enabled: !!user && authRole === "company",
    queryFn: async () => {
      const { data } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  /* ── recent bookings ── */
  const { data: bookings } = useQuery({
    queryKey: ["my-recent-bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("consulting_bookings")
        .select("id, booking_date, status, expert_id")
        .eq("user_id", user!.id)
        .order("booking_date", { ascending: false })
        .limit(3);
      if (!data || data.length === 0) return [];
      const expertIds = [...new Set(data.map((b) => b.expert_id))];
      const { data: experts } = await supabase
        .from("consulting_experts")
        .select("id, name, name_ar")
        .in("id", expertIds);
      const expertMap = new Map(experts?.map((e) => [e.id, e]) ?? []);
      return data.map((b) => ({ ...b, expert: expertMap.get(b.expert_id) }));
    },
  });

  /* ── recent payments ── */
  const { data: recentPayments } = useQuery({
    queryKey: ["my-recent-payments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("id, amount_usd, status, type, description, created_at, metadata")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });

  if (profileLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  const statusColor: Record<string, string> = {
    confirmed: "bg-green-500/15 text-green-600",
    pending: "bg-yellow-500/15 text-yellow-700",
    cancelled: "bg-red-500/15 text-red-600",
    completed: "bg-blue-500/15 text-blue-600",
  };

  return (
    <>
      <SEO title={uiLang === "ar" ? "ملفي الشخصي" : "My Profile"} />
    <section className="py-20">
      <div className="container mx-auto px-4 max-w-3xl space-y-6">
        <ProfileCompletenessBanner />
        {/* ── Header Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-8 relative"
        >
          <Link to="/profile/edit" className="absolute top-6 right-6 rtl:left-6 rtl:right-auto">
            <Button size="sm" className="gradient-brand text-primary-foreground rounded-full gap-1.5">
              <Pencil className="h-3.5 w-3.5" />
              {t(uiLang, "Edit Profile", "تعديل الملف")}
            </Button>
          </Link>

          <div className="flex flex-col sm:flex-row items-start gap-6">
            {profile?.avatar_url ? (
              <img loading="lazy"
                src={profile.avatar_url}
                alt={profile?.full_name || "Profile photo"}
                className="w-20 h-20 rounded-full object-cover border-2 border-border shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-full gradient-brand flex items-center justify-center text-primary-foreground text-2xl font-bold shrink-0">
                {initials}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold truncate">
                {profile?.full_name || t(uiLang, "Unnamed User", "مستخدم بلا اسم")}
              </h1>
              {profile?.bio && (
                <p className="text-muted-foreground mt-1 line-clamp-3">{profile.bio}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
                {profile?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {profile.location}
                  </span>
                )}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    profile?.is_available
                      ? "bg-green-500/15 text-green-600"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {profile?.is_available
                    ? t(uiLang, "Available", "متاح")
                    : t(uiLang, "Unavailable", "غير متاح")}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── My Roles ── */}
        <MyRolesSection />

        {/* ── Skills Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <h2 className="font-bold text-lg mb-3">{t(uiLang, "Skills", "المهارات")}</h2>
          {profile?.skills && profile.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s: string) => (
                <span
                  key={s}
                  className="px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm"
                >
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t(uiLang, "Add your skills in edit profile", "أضف مهاراتك من تعديل الملف")}
            </p>
          )}
        </motion.div>

        {/* ── Professional Info Card ── */}
        {(profile?.hourly_rate || profile?.portfolio_url || profile?.linkedin_url || profile?.github_url) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <h2 className="font-bold text-lg mb-4">
              {t(uiLang, "Professional Info", "المعلومات المهنية")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profile.hourly_rate && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.hourly_rate}</span>
                </div>
              )}
              {profile.portfolio_url && (
                <a
                  href={profile.portfolio_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  {t(uiLang, "Portfolio", "الأعمال")}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {profile.github_url && (
                <a
                  href={profile.github_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Company Card ── */}
        {authRole === "company" && company && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <h2 className="font-bold text-lg mb-4">
              {t(uiLang, "Company", "الشركة")}
            </h2>
            <div className="flex items-start gap-4">
              {company.logo_url && (
                <img loading="lazy"
                  src={company.logo_url}
                  alt={`${company.company_name} logo`}
                  className="w-14 h-14 rounded-xl object-cover border border-border shrink-0"
                />
              )}
              <div className="flex-1 min-w-0 space-y-2">
                <p className="font-semibold text-lg">{company.company_name}</p>
                <div className="flex flex-wrap gap-2">
                  {company.industry && (
                    <Badge variant="secondary">{company.industry}</Badge>
                  )}
                  {company.employee_count && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-3.5 w-3.5" /> {company.employee_count}
                    </span>
                  )}
                  {company.location && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" /> {company.location}
                    </span>
                  )}
                </div>
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    {company.website}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {company.description && (
                  <p className="text-sm text-muted-foreground mt-2">{company.description}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Bookings Preview Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">
              {t(uiLang, "Recent Bookings", "آخر الحجوزات")}
            </h2>
            <Link to="/my-bookings" className="text-sm text-primary hover:underline">
              {t(uiLang, "View all", "عرض الكل")} →
            </Link>
          </div>

          {!bookings || bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t(uiLang, "No bookings yet", "لا توجد حجوزات بعد")}
            </p>
          ) : (
            <div className="space-y-3">
              {bookings.map((b: any) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {uiLang === "ar"
                          ? b.expert?.name_ar || b.expert?.name || "—"
                          : b.expert?.name || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">{b.booking_date}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      statusColor[b.status] ?? "bg-muted text-muted-foreground"
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Payments Preview Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">
              {t(uiLang, "Recent Payments", "آخر المدفوعات")}
            </h2>
            <Link to="/profile/payments" className="text-sm text-primary hover:underline">
              {t(uiLang, "View all", "عرض الكل")} →
            </Link>
          </div>

          {!recentPayments || recentPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t(uiLang, "No payments yet", "لا توجد مدفوعات بعد")}
            </p>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((p: any) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium truncate max-w-[200px]">
                        {p.description || p.type}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className="text-sm font-bold">${Number(p.amount_usd).toFixed(2)}</p>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        statusColor[p.status] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
    </>
  );
}
