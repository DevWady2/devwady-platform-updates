import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Clock, User, Loader2, ArrowRight, MessageSquare, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  track: string | null;
  notes: string | null;
  admin_notes: string | null;
  amount_usd: number | null;
  payment_status: string | null;
  created_at: string;
  expert: { name: string; name_ar: string; role: string; role_ar: string; avatar_url: string | null } | null;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string; labelAr: string }> = {
  pending: { icon: AlertCircle, color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", label: "Pending", labelAr: "قيد الانتظار" },
  confirmed: { icon: CheckCircle2, color: "bg-green-500/10 text-green-600 border-green-500/20", label: "Confirmed", labelAr: "مؤكد" },
  completed: { icon: CheckCircle2, color: "bg-blue-500/10 text-blue-600 border-blue-500/20", label: "Completed", labelAr: "مكتمل" },
  cancelled: { icon: XCircle, color: "bg-red-500/10 text-red-600 border-red-500/20", label: "Cancelled", labelAr: "ملغي" },
};

export default function MyBookings() {
  const { user, loading: authLoading } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }
    fetchBookings();
  }, [user, authLoading]);

  const fetchBookings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("consulting_bookings")
      .select("*, expert:consulting_experts(name, name_ar, role, role_ar, avatar_url)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setBookings((data as any[]) || []);
    setLoading(false);
  };

  const filtered = filter === "all" ? bookings : bookings.filter(b => b.status === filter);
  const isAr = lang === "ar";

  if (authLoading || loading) {
    return (
      <section className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </section>
    );
  }

  return (
    <section className="py-24 min-h-[80vh]">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">{isAr ? "حجوزاتي" : "My Bookings"}</h1>
              <p className="text-muted-foreground">{isAr ? "تتبع جلسات الاستشارات الخاصة بك" : "Track your consulting sessions"}</p>
            </div>
            <Link to="/consulting">
              <Button className="gradient-brand text-primary-foreground rounded-full">
                {isAr ? "حجز جلسة جديدة" : "Book New Session"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {["all", "pending", "confirmed", "completed", "cancelled"].map(f => (
              <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" className="rounded-full whitespace-nowrap" onClick={() => setFilter(f)}>
                {f === "all" ? (isAr ? "الكل" : "All") : (isAr ? statusConfig[f]?.labelAr : statusConfig[f]?.label)}
                {f === "all" && <span className="ms-1.5 text-xs opacity-70">({bookings.length})</span>}
              </Button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{isAr ? "لا توجد حجوزات" : "No bookings yet"}</h3>
              <p className="text-muted-foreground mb-4">{isAr ? "ابدأ بحجز جلسة استشارية" : "Start by booking a consulting session"}</p>
              <Link to="/consulting">
                <Button className="rounded-full">{isAr ? "تصفح الخبراء" : "Browse Experts"}</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((b, i) => {
                const sc = statusConfig[b.status] || statusConfig.pending;
                const Icon = sc.icon;
                const expert = b.expert as any;
                return (
    <>
      <SEO title={t("seo.profileBookings.title")} />
                  <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Expert info */}
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                          {expert?.avatar_url ? (
                            <img loading="lazy" src={expert.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">{isAr ? expert?.name_ar : expert?.name}</p>
                          <p className="text-sm text-muted-foreground">{isAr ? expert?.role_ar : expert?.role}</p>
                        </div>
                      </div>

                      {/* Date & Time */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {format(new Date(b.booking_date), "MMM d, yyyy")}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {b.start_time?.slice(0, 5)}</span>
                      </div>

                      {/* Status */}
                      <Badge variant="outline" className={`${sc.color} rounded-full`}>
                        <Icon className="h-3 w-3 me-1" />
                        {isAr ? sc.labelAr : sc.label}
                      </Badge>
                    </div>

                    {/* Details row */}
                    <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-4 text-sm">
                      {b.track && <span className="text-muted-foreground">{isAr ? "المسار:" : "Track:"} <span className="text-foreground">{b.track}</span></span>}
                      {b.amount_usd && <span className="text-muted-foreground">{isAr ? "المبلغ:" : "Amount:"} <span className="text-foreground font-medium">${b.amount_usd}</span></span>}
                      {b.payment_status && <Badge variant="outline" className="text-xs rounded-full">{b.payment_status}</Badge>}
                    </div>

                    {/* Notes */}
                    {(b.notes || b.admin_notes) && (
                      <div className="mt-3 space-y-1">
                        {b.notes && (
                          <p className="text-sm text-muted-foreground flex items-start gap-1.5">
                            <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                            {b.notes}
                          </p>
                        )}
                        {b.admin_notes && (
                          <p className="text-sm text-primary/80 flex items-start gap-1.5">
                            <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                            {isAr ? "ملاحظات الإدارة:" : "Admin:"} {b.admin_notes}
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
    </>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
