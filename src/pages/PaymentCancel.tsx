import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function PaymentCancel() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <SEO title={isAr ? "تم إلغاء الدفع" : "Payment Cancelled"} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-card rounded-2xl border border-border p-8 text-center"
      >
        <XCircle className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />

        <h1 className="text-2xl font-bold mb-2">
          {isAr ? "تم إلغاء الدفع" : "Payment Cancelled"}
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          {isAr
            ? "لم تتم عملية الدفع. لم يتم خصم أي مبلغ. حجزك محفوظ ويمكنك إكمال الدفع لاحقاً."
            : "Your payment was not completed. No charges were made. Your booking is saved and you can complete the payment later."}
        </p>

        <div className="flex flex-col gap-2">
          <Button asChild className="rounded-full gradient-brand text-primary-foreground">
            <Link to="/consulting">{isAr ? "حاول مرة أخرى" : "Try Again"}</Link>
          </Button>
          <Button variant="outline" asChild className="rounded-full">
            <Link to="/contact">{isAr ? "تواصل مع الدعم" : "Contact Support"}</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
