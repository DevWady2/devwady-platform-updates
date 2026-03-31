import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { ArrowLeft, Calendar, Clock, CheckCircle2, DollarSign, Video, Star } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import RatingDialog from "@/components/consulting/RatingDialog";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4 } }) };

const statusStyles: Record<string, { bg: string; text: string }> = {
  pending: { bg: "bg-warning/10", text: "text-warning" },
  confirmed: { bg: "bg-emerald-500/10", text: "text-emerald-500" },
  cancelled: { bg: "bg-destructive/10", text: "text-destructive" },
  completed: { bg: "bg-primary/10", text: "text-primary" },
  payment_pending: { bg: "bg-warning/10", text: "text-warning" },
};

const paymentStyles: Record<string, { bg: string; text: string }> = {
  paid: { bg: "bg-emerald-500/10", text: "text-emerald-500" },
  unpaid: { bg: "bg-destructive/10", text: "text-destructive" },
};

export default function ProfileBookings() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const [tab, setTab] = useState("all");
  const [ratingBooking, setRatingBooking] = useState<any | null>(null);
  const qc = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["profile-bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consulting_bookings")
        .select("*, consulting_experts(id, name, name_ar, avatar_url, initials, track, track_ar, role, role_ar, session_rate_usd)")
        .eq("user_id", user!.id)
        .order("booking_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const today = new Date().toISOString().split("T")[0];

  const upcoming = useMemo(() => bookings.filter(b => b.booking_date >= today && b.status !== "cancelled"), [bookings, today]);
  const completed = useMemo(() => bookings.filter(b => b.status === "completed" || (b.booking_date < today && b.status !== "cancelled")), [bookings, today]);
  const cancelled = useMemo(() => bookings.filter(b => b.status === "cancelled"), [bookings]);

  const filtered = useMemo(() => {
    if (tab === "upcoming") return upcoming;
    if (tab === "completed") return completed;
    if (tab === "cancelled") return cancelled;
    return bookings;
  }, [tab, bookings, upcoming, completed, cancelled]);

  const stats = [
    { icon: Calendar, label: isAr ? "إجمالي الحجوزات" : "Total Bookings", value: bookings.length },
    { icon: Clock, label: isAr ? "القادمة" : "Upcoming", value: upcoming.length },
    { icon: CheckCircle2, label: isAr ? "المكتملة" : "Completed", value: completed.length },
  ];

  const expert = (b: any) => b.consulting_experts as any;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Back link */}
        <Link to="/profile" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="icon-flip-rtl h-4 w-4" />
          {t("profile.backToProfile")}
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{t("profile.myBookings")}</h1>
          <p className="text-muted-foreground mt-1">{t("profile.bookingsSubtitle")}</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab} className="mb-6">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="all">{isAr ? "الكل" : "All"}</TabsTrigger>
            <TabsTrigger value="upcoming">{isAr ? "القادمة" : "Upcoming"}</TabsTrigger>
            <TabsTrigger value="completed">{isAr ? "المكتملة" : "Completed"}</TabsTrigger>
            <TabsTrigger value="cancelled">{isAr ? "الملغاة" : "Cancelled"}</TabsTrigger>
          </TabsList>

          {["all", "upcoming", "completed", "cancelled"].map(tabVal => (
            <TabsContent key={tabVal} value={tabVal}>
              {isLoading ? (
                <div className="space-y-4">
                  {[0, 1, 2].map(i => (
                    <Skeleton key={i} className="h-48 w-full rounded-2xl" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState tab={tabVal} isAr={isAr} />
              ) : (
                <div className="space-y-4">
                  {filtered.map((b, i) => {
                    const exp = expert(b);
                    const st = statusStyles[b.status] ?? statusStyles.pending;
                    const pt = paymentStyles[b.payment_status ?? "unpaid"] ?? paymentStyles.unpaid;
                    return (
                      <motion.div key={b.id} custom={i} initial="hidden" animate="visible" variants={fadeUp} className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow">
                        {/* Top row */}
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Avatar className="h-11 w-11 shrink-0">
                              {exp?.avatar_url ? <AvatarImage src={exp.avatar_url} /> : null}
                              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-sm font-bold">
                                {exp?.initials ?? "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-bold text-foreground truncate">{isAr ? exp?.name_ar : exp?.name}</p>
                              <p className="text-sm text-muted-foreground truncate">{isAr ? exp?.role_ar : exp?.role}</p>
                              {exp?.track && (
                                <span className="inline-block mt-1 bg-accent text-accent-foreground text-xs rounded-full px-2 py-0.5">
                                  {isAr ? exp.track_ar : exp.track}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 md:flex-col md:items-end shrink-0">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${st.bg} ${st.text}`}>
                              {b.status}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${pt.bg} ${pt.text}`}>
                              {b.payment_status ?? "unpaid"}
                            </span>
                          </div>
                        </div>

                        {/* Middle row */}
                        <div className="flex flex-wrap gap-4 md:gap-6 text-sm text-muted-foreground mt-3">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(parseISO(b.booking_date), "MMM dd, yyyy", { locale: lang === "ar" ? ar : enUS })}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {b.start_time?.slice(0, 5)} — {b.end_time?.slice(0, 5)}
                          </span>
                          <span className="hidden md:inline-flex items-center gap-1.5">
                            <DollarSign className="h-3.5 w-3.5" />
                            {b.amount_usd != null ? `$${b.amount_usd}` : "—"}
                          </span>
                        </div>

                        {b.notes && (
                          <p className="text-sm text-muted-foreground italic mt-2">
                            {b.notes.length > 120 ? b.notes.slice(0, 120) + "..." : b.notes}
                          </p>
                        )}

                        {/* Meeting link */}
                        {b.status === "confirmed" && b.meeting_url && (
                          <div className="mt-3">
                            <a href={b.meeting_url} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
                                <Video className="h-4 w-4 me-1" />{isAr ? "انضم للاجتماع" : "Join Meeting"}
                              </Button>
                            </a>
                            <p className="text-xs text-muted-foreground mt-1">
                              {isAr ? `جلستك تبدأ الساعة ${b.start_time?.slice(0,5)} في ${format(parseISO(b.booking_date), "MMM d, yyyy", { locale: ar })}` : `Your session starts at ${b.start_time?.slice(0,5)} on ${format(parseISO(b.booking_date), "MMM d, yyyy", { locale: enUS })}`}
                            </p>
                          </div>
                        )}

                        {/* Rating */}
                        {b.status === "completed" && !b.rating && (
                          <div className="mt-3">
                            <Button variant="outline" size="sm" onClick={() => setRatingBooking(b)}>
                              <Star className="h-4 w-4 me-1" />{isAr ? "قيّم الجلسة" : "Rate this session"}
                            </Button>
                          </div>
                        )}
                        {b.rating && (
                          <div className="flex items-center gap-1 mt-3">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} className={`h-4 w-4 ${s <= (b.rating ?? 0) ? "fill-warning text-warning" : "text-muted-foreground/30"}`} />
                            ))}
                            {b.review && <span className="text-xs text-muted-foreground ms-2 truncate max-w-[200px]">{b.review}</span>}
                          </div>
                        )}

                        {/* Bottom row */}
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-4 pt-4 border-t border-border gap-2">
                          <span className="text-xs text-muted-foreground">
                            {isAr ? "تم الحجز" : "Booked"} {formatDistanceToNow(new Date(b.created_at), { addSuffix: true })}
                          </span>
                          <div className="flex flex-col md:flex-row gap-2">
                            {exp?.id && (
                              <>
                                <Button variant="outline" size="sm" asChild>
                                  <Link to={`/consulting/${exp.slug || exp.id}`}>{isAr ? "عرض الخبير" : "View expert"}</Link>
                                </Button>
                                <Button size="sm" className="bg-gradient-to-r from-primary to-secondary text-primary-foreground" asChild>
                                  <Link to={`/consulting/${exp.slug || exp.id}`}>{isAr ? "حجز جديد" : "Book again"}</Link>
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {ratingBooking && (
        <RatingDialog
          open={!!ratingBooking}
          onClose={() => setRatingBooking(null)}
          bookingId={ratingBooking.id}
          onSaved={() => {
            setRatingBooking(null);
            qc.invalidateQueries({ queryKey: ["profile-bookings"] });
          }}
        />
      )}
    </div>
  );
}

function EmptyState({ tab, isAr }: { tab: string; isAr: boolean }) {
  const msgs: Record<string, { en: string; ar: string }> = {
    all: { en: "No bookings yet", ar: "لا توجد حجوزات بعد" },
    upcoming: { en: "No upcoming bookings", ar: "لا توجد حجوزات قادمة" },
    completed: { en: "No completed bookings", ar: "لا توجد حجوزات مكتملة" },
    cancelled: { en: "No cancelled bookings", ar: "لا توجد حجوزات ملغاة" },
  };
  const msg = msgs[tab] ?? msgs.all;
  return (
    <>
      <SEO title={isAr ? "حجوزاتي" : "My Bookings"} />
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Calendar className="h-16 w-16 text-muted-foreground/30 mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-1">{isAr ? msg.ar : msg.en}</h3>
      <p className="text-sm text-muted-foreground mb-6">
        {isAr ? "استكشف خبراءنا واحجز جلستك الأولى" : "Explore our experts and book your first session"}
      </p>
      <Button className="bg-gradient-to-r from-primary to-secondary text-primary-foreground" asChild>
        <Link to="/consulting">{isAr ? "تصفح الخبراء" : "Browse Experts"}</Link>
      </Button>
    </div>
    </>
  );
}
