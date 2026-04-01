/**
 * GuestInquirySection — Inline lead-capture form for business-line landing pages.
 * Allows guests to submit lightweight inquiries without registration.
 */
import { useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Send, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { LucideIcon } from "lucide-react";

interface GuestInquirySectionProps {
  icon: LucideIcon;
  gradient: string;
  title_en: string;
  title_ar: string;
  subtitle_en: string;
  subtitle_ar: string;
  subject: string; // e.g. "Enterprise Inquiry", "Talent Request"
  messagePlaceholder_en?: string;
  messagePlaceholder_ar?: string;
}

export default function GuestInquirySection({
  icon: Icon,
  gradient,
  title_en,
  title_ar,
  subtitle_en,
  subtitle_ar,
  subject,
  messagePlaceholder_en = "Tell us about your needs...",
  messagePlaceholder_ar = "أخبرنا عن احتياجاتك...",
}: GuestInquirySectionProps) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const isAr = lang === "ar";
  const formRef = useRef<HTMLFormElement>(null);

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Don't show for authenticated users — they have workspace access
  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = formRef.current!;
    const fd = new FormData(form);
    const name = (fd.get("name") as string || "").trim();
    const email = (fd.get("email") as string || "").trim();
    const message = (fd.get("message") as string || "").trim();

    if (!name || name.length < 2) {
      toast.error(isAr ? "يرجى إدخال اسمك" : "Please enter your name");
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(isAr ? "يرجى إدخال بريد إلكتروني صحيح" : "Please enter a valid email");
      return;
    }
    if (!message || message.length < 10) {
      toast.error(isAr ? "يرجى كتابة رسالة (10 أحرف على الأقل)" : "Please write a message (at least 10 characters)");
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("submit-contact", {
        body: { name, email, phone: "", message, subject },
      });
      if (error) throw error;
      setSent(true);
      toast.success(isAr ? "تم إرسال طلبك بنجاح!" : "Inquiry submitted successfully!");
    } catch {
      toast.error(isAr ? "حدث خطأ، يرجى المحاولة مرة أخرى" : "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto text-center bg-card border border-border rounded-2xl p-8"
          >
            <div className="w-14 h-14 rounded-full bg-success/10 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-success" />
            </div>
            <h3 className="text-xl font-bold mb-2">
              {isAr ? "شكراً لتواصلك!" : "Thanks for reaching out!"}
            </h3>
            <p className="text-muted-foreground text-sm">
              {isAr
                ? "سيتواصل معك فريقنا خلال 24 ساعة."
                : "Our team will get back to you within 24 hours."}
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mx-auto mb-4`}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {isAr ? title_ar : title_en}
            </h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {isAr ? subtitle_ar : subtitle_en}
            </p>
          </div>

          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="bg-card border border-border rounded-2xl p-6 space-y-4"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                name="name"
                placeholder={isAr ? "اسمك الكامل" : "Full name"}
                className="rounded-xl h-11"
                maxLength={100}
                required
              />
              <Input
                name="email"
                type="email"
                placeholder={isAr ? "البريد الإلكتروني" : "Email address"}
                className="rounded-xl h-11"
                maxLength={255}
                required
              />
            </div>
            <Textarea
              name="message"
              placeholder={isAr ? messagePlaceholder_ar : messagePlaceholder_en}
              className="rounded-xl"
              rows={3}
              maxLength={1000}
              required
            />
            <Button
              type="submit"
              disabled={sending}
              className={`w-full sm:w-auto rounded-full px-8 bg-gradient-to-r ${gradient} text-white border-0`}
            >
              {sending ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="me-2 h-4 w-4" />
              )}
              {sending
                ? isAr ? "جاري الإرسال..." : "Sending..."
                : isAr ? "إرسال الاستفسار" : "Send Inquiry"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
