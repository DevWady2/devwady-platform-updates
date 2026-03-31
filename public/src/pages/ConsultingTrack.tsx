import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Clock, CheckCircle2, XCircle, CreditCard, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const statusMap: Record<string, { label: string; labelAr: string; icon: React.ElementType; color: string }> = {
  pending: { label: "Pending Review", labelAr: "قيد المراجعة", icon: Clock, color: "bg-warning/10 text-warning" },
  payment_pending: { label: "Awaiting Payment", labelAr: "بانتظار الدفع", icon: CreditCard, color: "bg-orange-500/10 text-orange-500" },
  confirmed: { label: "Confirmed", labelAr: "مؤكد", icon: CheckCircle2, color: "bg-success/10 text-success" },
  completed: { label: "Completed", labelAr: "مكتمل", icon: CheckCircle2, color: "bg-primary/10 text-primary" },
  cancelled: { label: "Cancelled", labelAr: "ملغي", icon: XCircle, color: "bg-destructive/10 text-destructive" },
};

export default function ConsultingTrack() {
  const { lang, t } = useLanguage();
  const isAr = lang === "ar";
  const [email, setEmail] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!email.trim()) {
      toast.error(isAr ? "يرجى إدخال البريد الإلكتروني" : "Please enter your email");
      return;
    }
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from("consulting_bookings")
        .select("*, consulting_experts(name, name_ar, initials, track, track_ar)")
        .eq("guest_email", email.trim())
        .order("created_at", { ascending: false });
      if (error) throw error;
      setBookings(data || []);
      setSearched(true);
    } catch {
      toast.error(isAr ? "حدث خطأ" : "Something went wrong");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <>
      <section className="pt-8 pb-4">
        <div className="container mx-auto px-4">
          <Link to="/consulting" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="icon-flip-rtl h-4 w-4" />
            {isAr ? "العودة للاستشارات" : "Back to Consulting"}
          </Link>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">{isAr ? "تتبع طلبك" : "Track Your Booking"}</h1>
          <p className="text-muted-foreground mb-8">
            {isAr ? "أدخل بريدك الإلكتروني لعرض حالة حجوزاتك." : "Enter your email to view your booking status."}
          </p>

          {/* Search */}
          <div className="bg-card rounded-2xl border border-border p-6 mb-8">
            <Label>{isAr ? "البريد الإلكتروني" : "Email Address"}</Label>
            <div className="flex gap-3 mt-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isSearching} className="rounded-xl px-6">
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="ms-2 hidden sm:inline">{isAr ? "بحث" : "Search"}</span>
              </Button>
            </div>
          </div>

          {/* Results */}
          {searched && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {bookings.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-2xl border border-border">
                  <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">{isAr ? "لم يتم العثور على حجوزات" : "No bookings found for this email"}</p>
                </div>
              ) : (
                bookings.map((b) => {
                  const st = statusMap[b.status] || statusMap.pending;
                  const StIcon = st.icon;
                  return (
    <>
      <SEO title={t("seo.consultingTrack.title")} />
                    <div key={b.id} className="bg-card rounded-2xl border border-border p-5 hover:border-primary/30 transition-colors">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h3 className="font-semibold">
                            {isAr ? b.consulting_experts?.name_ar : b.consulting_experts?.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {isAr ? b.consulting_experts?.track_ar : b.consulting_experts?.track}
                          </p>
                        </div>
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${st.color}`}>
                          <StIcon className="h-3.5 w-3.5" />
                          {isAr ? st.labelAr : st.label}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground text-xs">{isAr ? "التاريخ" : "Date"}</span>
                          <p className="font-medium">{b.booking_date}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">{isAr ? "الوقت" : "Time"}</span>
                          <p className="font-medium">{b.start_time?.slice(0, 5)} - {b.end_time?.slice(0, 5)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">{isAr ? "الدفع" : "Payment"}</span>
                          <Badge variant={b.payment_status === "paid" ? "default" : "destructive"} className="text-[10px]">
                            {b.payment_status || "unpaid"}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">{isAr ? "المبلغ" : "Amount"}</span>
                          <p className="font-medium">{b.amount_usd ? `$${b.amount_usd}` : "—"}</p>
                        </div>
                      </div>
                      {b.notes && (
                        <p className="mt-3 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">{b.notes}</p>
                      )}
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        ID: {b.id.slice(0, 8)}… • {new Date(b.created_at).toLocaleDateString()}
                      </p>
                    </div>
    </>
                  );
                })
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </>
  );
}
