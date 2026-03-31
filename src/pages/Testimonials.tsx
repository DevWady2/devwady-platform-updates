import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { SectionHeader } from "@/components/SectionHeader";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Star, Quote, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

export default function Testimonials() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ["testimonials-all"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials" as any)
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data as any[];
    },
  });

  const grouped: Record<string, any[]> = {};
  testimonials.forEach((t: any) => {
    const section = t.section || "general";
    if (!grouped[section]) grouped[section] = [];
    grouped[section].push(t);
  });

  const sectionLabels: Record<string, { en: string; ar: string }> = {
    general: { en: "Client Testimonials", ar: "آراء العملاء" },
    delivery: { en: "Delivery & Engineering", ar: "التسليم والهندسة" },
    consulting: { en: "Consulting", ar: "الاستشارات" },
    training: { en: "Academy & Training", ar: "الأكاديمية والتدريب" },
    hiring: { en: "Hiring & Talent", ar: "التوظيف والمواهب" },
  };

  return (
    <>
      <SEO
        title={isAr ? "قصص النجاح | ديف وادي" : "Success Stories | DevWady"}
        description={isAr ? "اكتشف ما يقوله عملاؤنا وشركاؤنا عن ديف وادي" : "Discover what our clients and partners say about DevWady"}
      />

      {/* Hero */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 -right-32 w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative">
          <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            {isAr ? "قصص النجاح" : "Success Stories"}
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl lg:text-6xl font-extrabold leading-tight mb-6 max-w-3xl">
            {isAr ? "ثقة عملائنا هي أعظم إنجازاتنا" : "Our Clients' Trust is Our Greatest Achievement"}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-xl text-muted-foreground max-w-2xl">
            {isAr ? "اقرأ تجارب حقيقية من عملاء وشركاء عملوا معنا" : "Read real experiences from clients and partners who worked with us"}
          </motion.p>
        </div>
      </section>

      {/* Stats */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { val: "50+", label: isAr ? "عميل سعيد" : "Happy Clients" },
              { val: "4.9", label: isAr ? "متوسط التقييم" : "Avg Rating" },
              { val: "95%", label: isAr ? "معدل الرضا" : "Satisfaction Rate" },
              { val: "10+", label: isAr ? "منتج مُطلق" : "Products Shipped" },
            ].map((s, i) => (
              <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-card rounded-xl border border-border p-6 text-center">
                <div className="text-2xl font-bold text-primary">{s.val}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials by section */}
      {isLoading ? (
        <section className="pb-20">
          <div className="container mx-auto px-4 grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        </section>
      ) : (
        Object.entries(grouped).map(([section, items]) => (
          <section key={section} className="py-12">
            <div className="container mx-auto px-4">
              <SectionHeader
                eyebrow={section.toUpperCase()}
                title={sectionLabels[section]?.[isAr ? "ar" : "en"] || section}
              />
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((tm: any, i: number) => (
                  <motion.div key={tm.id} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} whileHover={{ y: -4 }} className="bg-card border border-border rounded-2xl p-7 relative group hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all">
                    <Quote className="h-8 w-8 text-primary/15 absolute top-5 end-5" />
                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: tm.rating || 5 }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 text-warning fill-warning" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5 italic">
                      "{isAr ? tm.quote_ar || tm.quote_en : tm.quote_en}"
                    </p>
                    <div className="flex items-center gap-3">
                      {tm.avatar_url ? (
                        <img src={tm.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                          {(isAr ? tm.name_ar || tm.name_en : tm.name_en)?.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-foreground text-sm">
                          {isAr ? tm.name_ar || tm.name_en : tm.name_en}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {isAr ? tm.role_ar || tm.role_en : tm.role_en}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        ))
      )}

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="gradient-brand rounded-3xl p-10 lg:p-16 text-center text-primary-foreground">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              {isAr ? "انضم لقائمة عملائنا السعداء" : "Join Our Happy Clients"}
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-md mx-auto">
              {isAr ? "ابدأ مشروعك معنا اليوم" : "Start your project with us today"}
            </p>
            <Link to="/get-started">
              <Button size="lg" variant="secondary" className="rounded-full px-8 text-base">
                {isAr ? "ابدأ الآن" : "Get Started"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
