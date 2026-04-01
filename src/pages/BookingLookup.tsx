import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Loader2, Search, Calendar, Clock, DollarSign, Video,
  Star, UserPlus, Mail,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import RatingDialog from "@/components/consulting/RatingDialog";

const statusStyles: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  confirmed: "bg-emerald-500/10 text-emerald-500",
  cancelled: "bg-destructive/10 text-destructive",
  completed: "bg-primary/10 text-primary",
  payment_pending: "bg-warning/10 text-warning",
};

export default function BookingLookup() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<any[] | null>(null);
  const [ratingBooking, setRatingBooking] = useState<any | null>(null);

  const handleLookup = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("lookup-bookings", {
        body: { email: email.trim() },
      });
      if (error) throw error;
      setBookings(data.bookings ?? []);
      if (!data.bookings?.length) {
        toast.info(isAr ? "لم يتم العثور على حجوزات" : "No bookings found for this email");
      }
    } catch (e: any) {
      toast.error(e?.message || (isAr ? "فشل البحث" : "Lookup failed"));
    } finally {
      setLoading(false);
    }
  };

  const onRated = () => {
    setRatingBooking(null);
    // Re-fetch
    handleLookup();
  };

  return (
    <>
      <SEO title={isAr ? "تتبع حجزك" : "Track Your Booking"} />
      <div className="min-h-screen bg-background py-12" dir={isAr ? "rtl" : "ltr"}>
        <div className="container max-w-2xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold mb-2">{isAr ? "تتبع حجزك" : "Track Your Booking"}</h1>
            <p className="text-muted-foreground mb-8">
              {isAr ? "أدخل بريدك الإلكتروني للبحث عن حجوزاتك" : "Enter your email to look up your bookings"}
            </p>

            <Card className="mb-8">
              <CardContent className="pt-6">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder={isAr ? "أدخل بريدك الإلكتروني" : "Enter your email"}
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleLookup()}
                      className="ps-9"
                    />
                  </div>
                  <Button onClick={handleLookup} disabled={loading || !email.trim()}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 me-1" />}
                    {isAr ? "بحث" : "Look up"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {bookings !== null && bookings.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-14 w-14 text-muted-foreground/20 mx-auto mb-4" />
                <p className="font-medium mb-1">{isAr ? "لم يتم العثور على حجوزات" : "No bookings found"}</p>
                <p className="text-sm text-muted-foreground mb-6">
                  {isAr ? "تحقق من البريد الإلكتروني أو تواصل معنا" : "Check the email or contact us"}
                </p>
                <Button variant="outline" asChild>
                  <Link to="/auth/consulting">
                    <UserPlus className="h-4 w-4 me-1" />
                    {isAr ? "أنشئ حسابًا لإدارة حجوزاتك" : "Create an account to manage bookings"}
                  </Link>
                </Button>
              </div>
            )}

            {bookings && bookings.length > 0 && (
              <div className="space-y-4">
                {bookings.map((b: any, i: number) => {
                  const exp = b.consulting_experts;
                  return (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-card rounded-2xl border border-border p-5"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-11 w-11">
                          {exp?.avatar_url && <AvatarImage src={exp.avatar_url} />}
                          <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-sm font-bold">
                            {exp?.initials ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{isAr ? exp?.name_ar : exp?.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{isAr ? exp?.role_ar : exp?.role}</p>
                        </div>
                        <Badge variant="secondary" className={statusStyles[b.status] || ""}>{b.status}</Badge>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                        <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{format(parseISO(b.booking_date), "MMM d, yyyy")}</span>
                        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{b.start_time?.slice(0, 5)} — {b.end_time?.slice(0, 5)}</span>
                        {b.amount_usd != null && <span className="inline-flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />${b.amount_usd}</span>}
                      </div>

                      {/* Meeting link */}
                      {b.status === "confirmed" && b.meeting_url && (
                        <a href={b.meeting_url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="bg-gradient-to-r from-primary to-secondary text-primary-foreground mb-3">
                            <Video className="h-4 w-4 me-1" />{isAr ? "انضم للاجتماع" : "Join Meeting"}
                          </Button>
                        </a>
                      )}

                      {/* Rating */}
                      {b.status === "completed" && !b.rating && (
                        <Button variant="outline" size="sm" onClick={() => setRatingBooking(b)}>
                          <Star className="h-4 w-4 me-1" />{isAr ? "قيّم الجلسة" : "Rate this session"}
                        </Button>
                      )}
                      {b.rating && (
                        <div className="flex items-center gap-1 mt-2">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={`h-4 w-4 ${s <= b.rating ? "fill-warning text-warning" : "text-muted-foreground/30"}`} />
                          ))}
                          {b.review && <span className="text-xs text-muted-foreground ms-2 truncate">{b.review}</span>}
                        </div>
                      )}
                    </motion.div>
                  );
                })}

                <div className="text-center pt-4">
                  <Button variant="outline" asChild>
                    <Link to="/auth/consulting">
                      <UserPlus className="h-4 w-4 me-1" />
                      {isAr ? "أنشئ حسابًا لإدارة حجوزاتك" : "Create an account to manage all bookings"}
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {ratingBooking && (
        <RatingDialog
          open={!!ratingBooking}
          onClose={() => setRatingBooking(null)}
          bookingId={ratingBooking.id}
          onSaved={onRated}
        />
      )}
    </>
  );
}
