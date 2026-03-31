import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CheckCircle2, Send } from "lucide-react";
import { motion } from "framer-motion";
import { consultingTracks } from "@/data/consultingData";
import { toast } from "sonner";
import { bookingFormSchema, extractErrors } from "@/lib/validations";

export default function ConsultingRequest() {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const isAr = lang === "ar";

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedExpertId, setSelectedExpertId] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) setFieldErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const { data: experts = [] } = useQuery({
    queryKey: ["consulting-experts-all"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_experts");
      if (error) throw error;
      return (data ?? []).map((e: any) => ({ id: e.id, name: e.name, name_ar: e.name_ar, track: e.track, track_ar: e.track_ar }));
    },
  });

  const handleSubmit = async () => {
    const expertId = selectedExpertId || experts[0]?.id || "";
    const raw = {
      expert_id: expertId,
      booking_date: preferredDate,
      start_time: preferredTime || "10:00",
      guest_name: user ? "" : guestName,
      guest_email: user ? "" : guestEmail,
      guest_phone: guestPhone,
      notes,
    };

    const result = bookingFormSchema.safeParse(raw);
    if (!result.success) {
      const errs = extractErrors(result.error);
      setFieldErrors(errs);
      toast.error(result.error.issues[0].message);
      return;
    }

    if (!user && (!guestName.trim() || !guestEmail.trim())) {
      toast.error(isAr ? "يرجى إدخال الاسم والبريد الإلكتروني" : "Please enter your name and email");
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const expert = experts.find((e) => e.id === selectedExpertId);
      const startTime = preferredTime ? preferredTime + ":00" : "10:00:00";
      const endTime = preferredTime
        ? `${String(parseInt(preferredTime.split(":")[0]) + 1).padStart(2, "0")}:00:00`
        : "11:00:00";

      const { data: resp, error } = await supabase.functions.invoke("create-booking", {
        body: {
          expert_id: expertId,
          user_id: user?.id || null,
          user_email: user?.email || null,
          guest_name: user ? null : guestName,
          guest_email: user ? null : guestEmail,
          guest_phone: guestPhone || null,
          booking_date: preferredDate,
          start_time: startTime,
          end_time: endTime,
          status: "pending",
          notes: notes || null,
          track: selectedTrack || expert?.track || "General",
          amount_usd: null,
          payment_status: "unpaid",
        },
      });

      if (error || (resp && resp.error)) throw new Error(resp?.error || "Booking failed");
      setIsSubmitted(true);
      toast.success(isAr ? "تم إرسال طلبك بنجاح!" : "Request submitted successfully!");
    } catch (err) {
      toast.error(isAr ? "حدث خطأ، يرجى المحاولة مرة أخرى" : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg mx-auto bg-card rounded-2xl border border-border p-8 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-success/10 mx-auto mb-4 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{isAr ? "تم إرسال طلبك!" : "Request Submitted!"}</h2>
          <p className="text-muted-foreground mb-6">
            {isAr
              ? "سيتواصل معك فريقنا خلال 24 ساعة لتأكيد الموعد والتفاصيل."
              : "Our team will contact you within 24 hours to confirm the schedule and details."}
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/consulting">
              <Button variant="outline" className="rounded-full">
                {isAr ? "عرض الخبراء" : "View Experts"}
              </Button>
            </Link>
            <Link to="/">
              <Button className="rounded-full">
                {isAr ? "الرئيسية" : "Home"}
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <SEO title={t("seo.consultingRequest.title")} />
      <section className="pt-8 pb-4">
        <div className="container mx-auto px-4">
          <Link to="/consulting" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="icon-flip-rtl h-4 w-4" />
            {isAr ? "العودة للخبراء" : "Back to Experts"}
          </Link>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <h1 className="text-3xl font-bold mb-2">
            {isAr ? "طلب حجز مخصص" : "Custom Booking Request"}
          </h1>
          <p className="text-muted-foreground mb-8">
            {isAr
              ? "لم تجد الموعد المناسب؟ أرسل طلبك وسنرتب الجلسة حسب جدولك."
              : "Couldn't find a suitable slot? Submit your request and we'll arrange a session around your schedule."}
          </p>

          <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
            {/* Guest details */}
            {!user && (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>{isAr ? "الاسم *" : "Name *"}</Label>
                    <Input value={guestName} onChange={(e) => { setGuestName(e.target.value); clearFieldError("guest_name"); }} placeholder={isAr ? "اسمك الكامل" : "Full name"} className="mt-1" />
                    {fieldErrors.guest_name && <p className="text-sm text-destructive mt-1">{fieldErrors.guest_name}</p>}
                  </div>
                  <div>
                    <Label>{isAr ? "البريد الإلكتروني *" : "Email *"}</Label>
                    <Input type="email" value={guestEmail} onChange={(e) => { setGuestEmail(e.target.value); clearFieldError("guest_email"); }} placeholder="your@email.com" className="mt-1" />
                    {fieldErrors.guest_email && <p className="text-sm text-destructive mt-1">{fieldErrors.guest_email}</p>}
                  </div>
                </div>
                <div>
                  <Label>{isAr ? "رقم الهاتف" : "Phone (optional)"}</Label>
                  <Input value={guestPhone} onChange={(e) => { setGuestPhone(e.target.value); clearFieldError("guest_phone"); }} placeholder="+20 xxx xxx xxxx" className="mt-1" />
                  {fieldErrors.guest_phone && <p className="text-sm text-destructive mt-1">{fieldErrors.guest_phone}</p>}
                </div>
              </>
            )}

            {/* Track & Expert */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>{isAr ? "المجال" : "Field / Track"}</Label>
                <Select value={selectedTrack} onValueChange={setSelectedTrack}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder={isAr ? "اختر المجال" : "Select track"} /></SelectTrigger>
                  <SelectContent>
                    {consultingTracks.filter((t) => t.key !== "all").map((t) => (
                      <SelectItem key={t.key} value={t.key}>{isAr ? t.labelAr : t.labelEn}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isAr ? "الخبير المفضل" : "Preferred Expert"}</Label>
                <Select value={selectedExpertId} onValueChange={setSelectedExpertId}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder={isAr ? "اختر خبير" : "Select expert"} /></SelectTrigger>
                  <SelectContent>
                    {experts.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{isAr ? e.name_ar : e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>{isAr ? "التاريخ المفضل *" : "Preferred Date *"}</Label>
                <Input type="date" value={preferredDate} onChange={(e) => { setPreferredDate(e.target.value); clearFieldError("booking_date"); }} className="mt-1" min={new Date().toISOString().split("T")[0]} />
                {fieldErrors.booking_date && <p className="text-sm text-destructive mt-1">{fieldErrors.booking_date}</p>}
              </div>
              <div>
                <Label>{isAr ? "الوقت المفضل" : "Preferred Time"}</Label>
                <Select value={preferredTime} onValueChange={setPreferredTime}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder={isAr ? "اختر الوقت" : "Select time"} /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => i + 9).map((h) => (
                      <SelectItem key={h} value={`${String(h).padStart(2, "0")}:00`}>{`${String(h).padStart(2, "0")}:00`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label>{isAr ? "ما الذي تريد مناقشته؟" : "What would you like to discuss?"}</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={isAr ? "وصف مختصر لاحتياجاتك..." : "Brief description of your needs..."} className="mt-1" rows={4} />
            </div>

            {/* Submit */}
            <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full rounded-xl text-base h-12" size="lg">
              <Send className="me-2 h-4 w-4" />
              {isSubmitting ? (isAr ? "جاري الإرسال..." : "Submitting...") : (isAr ? "إرسال الطلب" : "Submit Request")}
            </Button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
