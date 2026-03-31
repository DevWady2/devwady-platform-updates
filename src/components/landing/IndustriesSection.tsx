/**
 * IndustriesSection — Demonstrates DevWady's domain breadth.
 */
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Building2, Home, ShoppingBag, GraduationCap, Truck, Utensils, BarChart3, Cog } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
};

const industries = [
  { icon: Utensils, title_en: "Hospitality & F&B", title_ar: "الضيافة والمطاعم" },
  { icon: Home, title_en: "Real Estate", title_ar: "العقارات" },
  { icon: Truck, title_en: "Logistics & Delivery", title_ar: "اللوجستيات والتوصيل" },
  { icon: GraduationCap, title_en: "Education & EdTech", title_ar: "التعليم والتقنية التعليمية" },
  { icon: ShoppingBag, title_en: "Retail & E-Commerce", title_ar: "التجزئة والتجارة الإلكترونية" },
  { icon: Building2, title_en: "Enterprise Operations", title_ar: "عمليات المؤسسات" },
  { icon: BarChart3, title_en: "Financial Services", title_ar: "الخدمات المالية" },
  { icon: Cog, title_en: "Internal Business Systems", title_ar: "أنظمة الأعمال الداخلية" },
];

export default function IndustriesSection() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <section className="py-20 lg:py-28 bg-muted/30 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 start-1/3 w-96 h-96 bg-primary/4 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
          <motion.span variants={fadeUp} custom={0} className="inline-block text-xs font-semibold uppercase tracking-wider text-primary mb-3">
            {isAr ? "القطاعات" : "Industries We Serve"}
          </motion.span>
          <motion.div variants={fadeUp} custom={0.5} className="w-16 h-1 gradient-accent rounded-full mx-auto mb-5" />
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            {isAr ? "خبرة عبر قطاعات متعددة" : "Expertise Across Multiple Domains"}
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-muted-foreground max-w-2xl mx-auto">
            {isAr
              ? "نفهم تحديات كل قطاع ونصمم حلولاً تناسب سياق العمل الفعلي."
              : "We understand each industry's challenges and design solutions that fit real business contexts."}
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {industries.map((ind, i) => {
            const Icon = ind.icon;
            return (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i + 3}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="bg-card border border-border/50 rounded-xl p-5 text-center hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/15 group-hover:scale-110 transition-all">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {isAr ? ind.title_ar : ind.title_en}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
