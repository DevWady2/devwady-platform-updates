import { useSearchParams, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, Calendar, Clock, DollarSign, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";

export default function PaymentSuccess() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const isAr = lang === "ar";
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const { data: payment, isLoading, isError } = useQuery({
    queryKey: ["payment-success", sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_payment_success", { p_session_id: sessionId! });
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Payment not found");
      return data[0];
    },
  });

  if (!sessionId) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <SEO title={isAr ? "فشل التحقق من الدفع" : "Payment Verification Failed"} />
        <div className="max-w-md bg-card rounded-2xl border border-border p-8 text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">{isAr ? "فشل التحقق من الدفع" : "Payment Verification Failed"}</h1>
          <p className="text-muted-foreground mb-6">{isAr ? "يرجى التواصل مع الدعم" : "Please contact support for assistance."}</p>
          <Button asChild className="rounded-full">
            <Link to="/contact">{isAr ? "تواصل معنا" : "Contact Support"}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <SEO title={isAr ? "التحقق من الدفع..." : "Verifying Payment..."} />
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{isAr ? "جاري التحقق من الدفع..." : "Verifying payment..."}</p>
        </div>
      </div>
    );
  }

  if (isError || !payment) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <SEO title={isAr ? "فشل التحقق من الدفع" : "Payment Verification Failed"} />
        <div className="max-w-md bg-card rounded-2xl border border-border p-8 text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">{isAr ? "فشل التحقق من الدفع" : "Payment Verification Failed"}</h1>
          <p className="text-muted-foreground mb-6">{isAr ? "يرجى التواصل مع الدعم" : "Please contact support for assistance."}</p>
          <Button asChild className="rounded-full">
            <Link to="/contact">{isAr ? "تواصل معنا" : "Contact Support"}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <SEO title={isAr ? "تمت عملية الدفع بنجاح" : "Payment Successful"} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="max-w-md w-full bg-card rounded-2xl border border-border p-8 text-center"
      >
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}>
          <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
        </motion.div>

        <h1 className="text-2xl font-bold mb-2">
          {isAr ? "تمت عملية الدفع بنجاح!" : "Payment Successful!"}
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          {isAr
            ? "تم تأكيد جلستك. ستصلك رسالة تأكيد عبر البريد الإلكتروني قريباً."
            : "Your session is confirmed. You will receive a confirmation email shortly."}
        </p>

        {/* Payment details */}
        <div className="bg-muted/30 rounded-xl p-4 text-start space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" /> {isAr ? "المبلغ" : "Amount"}
            </span>
            <span className="text-lg font-bold text-foreground">${payment.amount_usd}</span>
          </div>

          {payment.expert_name && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{isAr ? "الخبير" : "Expert"}</span>
              <span className="text-sm font-medium">{isAr ? payment.expert_name_ar : payment.expert_name}</span>
            </div>
          )}

          {payment.booking_date && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> {isAr ? "التاريخ" : "Date"}
              </span>
              <span className="text-sm font-medium">{format(parseISO(String(payment.booking_date)), "MMM d, yyyy")}</span>
            </div>
          )}

          {payment.start_time && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> {isAr ? "الوقت" : "Time"}
              </span>
              <span className="text-sm font-medium">{String(payment.start_time).slice(0, 5)} — {String(payment.end_time).slice(0, 5)}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{isAr ? "الحالة" : "Status"}</span>
            <Badge className="bg-success/10 text-success border-0">{isAr ? "مدفوع" : "Paid"}</Badge>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {user ? (
            <Button asChild className="rounded-full gradient-brand text-primary-foreground">
              <Link to="/profile/bookings">{isAr ? "عرض حجوزاتي" : "View My Bookings"}</Link>
            </Button>
          ) : (
            <Button asChild className="rounded-full gradient-brand text-primary-foreground">
              <Link to="/">{isAr ? "العودة للرئيسية" : "Back to Home"}</Link>
            </Button>
          )}
          <Button variant="outline" asChild className="rounded-full">
            <Link to="/consulting">{isAr ? "حجز جلسة أخرى" : "Book Another Session"}</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
