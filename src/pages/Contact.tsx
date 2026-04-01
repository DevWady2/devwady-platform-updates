import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { contactFormSchema, extractErrors } from "@/lib/validations";

export default function Contact() {
  const { t, lang } = useLanguage();
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const clearError = (field: string) => {
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = formRef.current!;
    const fd = new FormData(form);
    const raw = {
      name: (fd.get("name") as string) || "",
      email: (fd.get("email") as string) || "",
      phone: (fd.get("phone") as string) || "",
      message: (fd.get("message") as string) || "",
    };

    const result = contactFormSchema.safeParse(raw);
    if (!result.success) {
      const fieldErrors = extractErrors(result.error);
      setErrors(fieldErrors);
      toast.error(result.error.issues[0].message);
      return;
    }

    setErrors({});
    setSending(true);
    const { data: resp, error } = await supabase.functions.invoke("submit-contact", {
      body: {
        name: result.data.name,
        email: result.data.email,
        phone: result.data.phone || "",
        message: result.data.message,
      },
    });

    setSending(false);
    if (error || (resp && resp.error)) {
      const msg = resp?.error || "Failed to send message. Please try again.";
      if (msg.includes("Too many")) {
        toast.error(msg);
      } else {
        toast.error(msg);
      }
      return;
    }
    toast.success("Message sent! We'll get back to you within 48 hours.");
    form.reset();
  };

  return (
    <>
      <SEO title={t("seo.contact.title")} description={t("seo.contact.desc")} />
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4 mb-8">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-sm flex items-center gap-2 flex-wrap">
            <span>{lang === "ar" ? "هل تريد بدء مشروع؟ استخدم نموذج طلب الخدمة لوصف مشروعك بالتفصيل." : "Looking to start a project? Use our service request form for a detailed brief."}</span>
            <Link to="/get-started" className="text-primary font-medium hover:underline">
              {lang === "ar" ? "ابدأ الآن →" : "Get started →"}
            </Link>
          </div>
        </div>
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">{t("contact.title")}</h1>
              <p className="text-muted-foreground mb-8">{t("contact.subtitle")}</p>
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Input name="name" placeholder={t("contact.name")} className="rounded-xl h-12" maxLength={100} onChange={() => clearError("name")} />
                  {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                </div>
                <div>
                  <Input name="email" type="email" placeholder={t("contact.email")} className="rounded-xl h-12" maxLength={255} onChange={() => clearError("email")} />
                  {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                </div>
                <div>
                  <Input name="phone" placeholder={t("contact.phone")} className="rounded-xl h-12" maxLength={20} onChange={() => clearError("phone")} />
                  {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <Textarea name="message" placeholder={t("contact.message")} rows={5} className="rounded-xl" maxLength={2000} onChange={() => clearError("message")} />
                  {errors.message && <p className="text-sm text-destructive mt-1">{errors.message}</p>}
                </div>
                <Button type="submit" size="lg" disabled={sending} className="gradient-brand text-primary-foreground rounded-full px-8 w-full sm:w-auto">
                  <Send className="me-2 h-4 w-4" /> {t("contact.send")}
                </Button>
              </form>
            </div>

            <div className="flex flex-col justify-center">
              <h3 className="text-lg font-semibold mb-6">{t("contact.or")}</h3>
              <div className="space-y-6">
                <a href="mailto:info@devwady.com" className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center group-hover:gradient-brand transition-all">
                    <Mail className="h-5 w-5 text-accent-foreground group-hover:text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">info@devwady.com</p>
                  </div>
                </a>
                <a href="tel:+201096464521" className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center group-hover:gradient-brand transition-all">
                    <Phone className="h-5 w-5 text-accent-foreground group-hover:text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">+20 109 646 4521</p>
                  </div>
                </a>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">Cairo, Egypt · Serving Egypt & KSA</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
