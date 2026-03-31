import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Clock, Shield,
  Video, CheckCircle2, Linkedin, Github
} from "lucide-react";
import { motion } from "framer-motion";
import {
  format, addDays,
  isAfter
} from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { toast } from "sonner";
import BookingCalendar from "@/components/consulting/BookingCalendar";
import CheckoutDialog from "@/components/consulting/CheckoutDialog";

export default function ExpertProfile() {
  const { id: slug } = useParams();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const isAr = lang === "ar";
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookingStep, setBookingStep] = useState<"select" | "confirmed">("select");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: expert, isLoading } = useQuery({
    queryKey: ["expert", slug],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_expert_by_slug", { p_slug: slug! });
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Expert not found");
      return data[0];
    },
  });

  const expertId = expert?.id;

  const { data: availability = [] } = useQuery({
    queryKey: ["expert-availability", expertId],
    enabled: !!expertId,
    queryFn: async () => {
      const { data, error } = await supabase.from("expert_availability").select("*").eq("expert_id", expertId!).eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: existingBookings = [] } = useQuery({
    queryKey: ["expert-bookings", expertId],
    enabled: !!expertId,
    queryFn: async () => {
      const { data, error } = await supabase.from("consulting_bookings").select("booking_date, start_time").eq("expert_id", expertId!).in("status", ["pending", "confirmed"]);
      if (error) throw error;
      return data;
    },
  });

  // Count completed sessions
  const { data: completedCount = 0 } = useQuery({
    queryKey: ["expert-completed", expertId],
    enabled: !!expertId,
    queryFn: async () => {
      const { count, error } = await supabase.from("consulting_bookings").select("*", { count: "exact", head: true }).eq("expert_id", expertId!).eq("status", "confirmed");
      if (error) throw error;
      return count || 0;
    },
  });

  const dayHasSlots = (day: Date) => {
    if (!isAfter(day, addDays(new Date(), -1))) return false;
    const dow = day.getDay();
    const dateStr = format(day, "yyyy-MM-dd");
    // Check recurring slots for this day of week, or specific-date slots matching this date
    return availability.some((a) => {
      if (a.specific_date) {
        return a.specific_date === dateStr;
      }
      return a.day_of_week === dow;
    });
  };

  const canGoPrevMonth = (() => {
    const now = new Date();
    return currentMonth.getFullYear() > now.getFullYear() ||
      (currentMonth.getFullYear() === now.getFullYear() && currentMonth.getMonth() > now.getMonth());
  })();

  const availableSlots = useMemo(() => {
    if (!selectedDate || !availability.length) return [];
    const dow = selectedDate.getDay();
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    // Match recurring slots by day_of_week OR specific-date slots
    const daySlots = availability.filter((a) => {
      if (a.specific_date) return a.specific_date === dateStr;
      return a.day_of_week === dow && (a.is_recurring !== false);
    });
    const slots: { start: string; end: string }[] = [];
    daySlots.forEach((slot) => {
      const startHour = parseInt(slot.start_time.split(":")[0]);
      const endHour = parseInt(slot.end_time.split(":")[0]);
      for (let h = startHour; h < endHour; h++) {
        const startStr = `${String(h).padStart(2, "0")}:00`;
        const endStr = `${String(h + 1).padStart(2, "0")}:00`;
        const isBooked = existingBookings.some(
          (b) => b.booking_date === dateStr && b.start_time === startStr + ":00"
        );
        const slotTime = new Date(selectedDate);
        slotTime.setHours(h, 0, 0, 0);
        if (!isBooked && isAfter(slotTime, new Date())) {
          slots.push({ start: startStr, end: endStr });
        }
      }
    });
    return slots;
  }, [selectedDate, availability, existingBookings]);

  const handleSelectDate = (day: Date) => { setSelectedDate(day); setSelectedSlot(null); };
  const handleSelectSlot = (slot: string) => { setSelectedSlot(slot); setCheckoutOpen(true); };

  const handleSubmitBooking = async (guest: { name: string; email: string; phone: string; notes: string }) => {
    if (!selectedDate || !selectedSlot || !expert) return;
    if (!user && (!guest.name || !guest.email)) {
      toast.error(isAr ? "يرجى إدخال الاسم والبريد الإلكتروني" : "Please enter your name and email");
      return;
    }
    setIsSubmitting(true);
    try {
      const endSlot = `${String(parseInt(selectedSlot.split(":")[0]) + 1).padStart(2, "0")}:00:00`;
      const bookingDate = format(selectedDate, "yyyy-MM-dd");

      // 1. Create booking
      const { data: resp, error } = await supabase.functions.invoke("create-booking", {
        body: {
          expert_id: expert.id, user_id: user?.id || null,
          user_email: user?.email || null,
          guest_name: user ? null : guest.name, guest_email: user ? null : guest.email,
          guest_phone: guest.phone || null,
          booking_date: bookingDate,
          start_time: selectedSlot + ":00",
          end_time: endSlot,
          status: "payment_pending", notes: guest.notes || null,
          track: expert.track, amount_usd: expert.session_rate_usd, payment_status: "unpaid",
        },
      });
      if (error || (resp && resp.error)) throw new Error(resp?.error || "Booking failed");

      const bookingId = resp?.booking_id;

      // 2. If free session, skip payment
      if (!expert.session_rate_usd || expert.session_rate_usd <= 0) {
        setCheckoutOpen(false);
        setBookingStep("confirmed");
        toast.success(isAr ? "تم الحجز بنجاح!" : "Booking submitted successfully!");
        return;
      }

      // 3. Create Stripe checkout session
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke("create-checkout", {
        body: {
          type: "consulting_session",
          reference_id: bookingId,
          amount_usd: expert.session_rate_usd,
          description: `${isAr ? "جلسة استشارية مع" : "Consulting session with"} ${isAr ? expert.name_ar : expert.name} — ${format(selectedDate, "MMM d, yyyy")} ${selectedSlot}`,
          customer_email: user?.email || guest.email,
          user_id: user?.id || null,
          metadata: {
            guest_name: guest.name || user?.user_metadata?.full_name,
            expert_name: expert.name,
            booking_date: bookingDate,
            start_time: selectedSlot,
            end_time: endSlot,
          },
          success_path: "/payment/success",
          cancel_path: "/payment/cancel",
        },
      });

      if (checkoutError || !checkoutData) {
        toast.error(isAr ? "فشل إنشاء جلسة الدفع" : "Failed to create payment session");
        return;
      }

      // Dev mode: Stripe not configured
      if (checkoutData.dev_mode) {
        setCheckoutOpen(false);
        setBookingStep("confirmed");
        toast.success(isAr ? "تم الحجز (وضع التطوير — الدفع غير مفعل)" : "Booking submitted (dev mode — payment skipped)");
        return;
      }

      // 4. Redirect to Stripe
      window.location.href = checkoutData.checkout_url;
    } catch {
      toast.error(isAr ? "حدث خطأ في الحجز" : "Booking failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="animate-pulse max-w-4xl mx-auto">
          <div className="h-8 bg-muted rounded w-1/3 mb-4" />
          <div className="h-6 bg-muted rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">{isAr ? "الخبير غير موجود" : "Expert Not Found"}</h1>
        <Link to="/consulting">
          <Button variant="outline" className="rounded-full">
            <ArrowLeft className="icon-flip-rtl me-2 h-4 w-4" /> {isAr ? "العودة للخبراء" : "Back to Experts"}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <SEO title={isAr ? (expert?.name_ar || expert?.name) : expert?.name} />
      <section className="pt-8 pb-4">
        <div className="container mx-auto px-4">
          <Link to="/consulting" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="icon-flip-rtl h-4 w-4" />
            {isAr ? "العودة للخبراء" : "Back to Experts"}
          </Link>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-20">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Expert Info - Left Column */}
          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl border border-border p-6 sticky top-24">
              {/* Avatar */}
              <div className="text-center mb-6">
                {expert.avatar_url ? (
                  <img loading="lazy" src={expert.avatar_url} alt={expert.name} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-primary/20" />
                ) : (
                  <div className="w-24 h-24 rounded-full gradient-brand mx-auto mb-4 flex items-center justify-center text-primary-foreground text-2xl font-bold">
                    {expert.initials}
                  </div>
                )}
                <h1 className="text-xl font-bold mb-1">{isAr ? expert.name_ar : expert.name}</h1>
                <p className="text-sm text-muted-foreground mb-3">{isAr ? expert.role_ar : expert.role}</p>
                <Badge variant="outline" className="text-primary border-primary/30">
                  {isAr ? expert.track_ar : expert.track}
                </Badge>
              </div>

              {/* Bio */}
              {(isAr ? expert.bio_ar : expert.bio) && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {isAr ? expert.bio_ar : expert.bio}
                </p>
              )}

              {/* Specializations */}
              {((isAr ? expert.specializations_ar : expert.specializations) || []).length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2">{isAr ? "التخصصات" : "Specializations"}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {((isAr ? expert.specializations_ar : expert.specializations) || []).map((s: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-primary">{expert.years_experience}+</div>
                  <div className="text-[10px] text-muted-foreground">{isAr ? "سنوات" : "Years"}</div>
                </div>
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-primary">{completedCount}</div>
                  <div className="text-[10px] text-muted-foreground">{isAr ? "جلسات" : "Sessions"}</div>
                </div>
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-primary">{expert.session_duration_minutes}</div>
                  <div className="text-[10px] text-muted-foreground">{isAr ? "دقيقة" : "Min"}</div>
                </div>
              </div>

              {/* Meta */}
              <div className="space-y-2 text-sm text-muted-foreground border-t border-border pt-4">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-primary" />
                  {isAr ? "جلسة فيديو مباشرة" : "Live video session"}
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  {isAr ? "محمي بواسطة DevWady" : "Protected by DevWady"}
                </div>
              </div>

              {/* Price */}
              <div className="mt-4 pt-4 border-t border-border text-center">
                <div className="text-2xl font-bold text-primary">${expert.session_rate_usd}</div>
                <div className="text-xs text-muted-foreground">{isAr ? "لكل جلسة" : "per session"}</div>
              </div>

              {/* Social Links */}
              {(expert.linkedin_url || expert.github_url) && (
                <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-border">
                  {expert.linkedin_url && (
                    <a href={expert.linkedin_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                        <Linkedin className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                  {expert.github_url && (
                    <a href={expert.github_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                        <Github className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* Booking Flow - Right Column */}
          <div className="lg:col-span-2">
            {bookingStep === "confirmed" ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-card rounded-2xl border border-border p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-success/10 mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
                <h2 className="text-2xl font-bold mb-2">{isAr ? "تم الحجز بنجاح!" : "Booking Submitted!"}</h2>
                <p className="text-muted-foreground mb-2">
                  {isAr
                    ? `جلستك مع ${expert.name_ar} في ${selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""} الساعة ${selectedSlot}`
                    : `Your session with ${expert.name} on ${selectedDate ? format(selectedDate, "MMM dd, yyyy") : ""} at ${selectedSlot}`}
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  {isAr ? "سنتواصل معك قريباً لتأكيد الدفع وتفاصيل الجلسة." : "We'll contact you shortly to confirm payment and session details."}
                </p>
                <div className="flex justify-center gap-3">
                  <Link to="/consulting"><Button variant="outline" className="rounded-full">{isAr ? "عرض الخبراء" : "View Experts"}</Button></Link>
                  <Button onClick={() => { setBookingStep("select"); setSelectedDate(null); setSelectedSlot(null); }} className="rounded-full">
                    {isAr ? "حجز آخر" : "Book Another"}
                  </Button>
                </div>
              </motion.div>
            ) : (
              <>
                <BookingCalendar
                  currentMonth={currentMonth}
                  setCurrentMonth={setCurrentMonth}
                  selectedDate={selectedDate}
                  onSelectDate={handleSelectDate}
                  dayHasSlots={dayHasSlots}
                  canGoPrevMonth={canGoPrevMonth}
                />

                {selectedDate && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-2xl border border-border p-6 mt-6">
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      {isAr ? "المواعيد المتاحة" : "Available Slots"} — {format(selectedDate, "EEEE, d MMMM", { locale: isAr ? ar : enUS })}
                    </h3>
                    {availableSlots.length === 0 ? (
                      <p className="text-sm text-muted-foreground bg-muted/50 rounded-xl p-4 text-center">
                        {isAr ? "لا توجد مواعيد متاحة في هذا اليوم" : "No available slots on this day"}
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                        {availableSlots.map((slot, i) => {
                          const h = parseInt(slot.start.split(":")[0]);
                          const ap = h >= 12 ? (isAr ? "م" : "PM") : (isAr ? "ص" : "AM");
                          const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                          return (
                            <button key={i} onClick={() => handleSelectSlot(slot.start)}
                              className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl text-sm font-medium transition-all bg-muted hover:bg-primary hover:text-primary-foreground">
                              <Clock className="h-3.5 w-3.5" />
                              {h12}:00 {ap}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {selectedDate && selectedSlot && (
                  <CheckoutDialog
                    open={checkoutOpen} onOpenChange={setCheckoutOpen}
                    expert={expert} selectedDate={selectedDate} selectedSlot={selectedSlot}
                    onSubmit={handleSubmitBooking} isSubmitting={isSubmitting}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
