/**
 * EnterpriseCredibility — Reinforces DevWady's core software delivery strength.
 */
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { ArrowRight, Server, Smartphone, ShieldCheck, BarChart3, Layers, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.45 } }),
};

const capabilities = [
  {
    icon: Smartphone,
    title_en: "Mobile & Web Applications",
    title_ar: "تطبيقات الجوال والويب",
    desc_en: "Native iOS/Android apps, cross-platform solutions, and responsive web platforms built for scale.",
    desc_ar: "تطبيقات iOS/Android أصلية، حلول متعددة المنصات، ومنصات ويب متجاوبة مبنية للتوسع.",
  },
  {
    icon: Server,
    title_en: "Enterprise Systems & ERP",
    title_ar: "أنظمة المؤسسات و ERP",
    desc_en: "Custom ERP, CRM, and business management systems tailored to your operations and workflows.",
    desc_ar: "أنظمة ERP و CRM وإدارة أعمال مخصصة لعملياتك وسير عملك.",
  },
  {
    icon: Layers,
    title_en: "Digital Platforms & SaaS",
    title_ar: "المنصات الرقمية و SaaS",
    desc_en: "Multi-tenant platforms, marketplace systems, and SaaS products from architecture to launch.",
    desc_ar: "منصات متعددة المستأجرين وأنظمة سوق ومنتجات SaaS من الهندسة إلى الإطلاق.",
  },
  {
    icon: Cpu,
    title_en: "System Integration & APIs",
    title_ar: "تكامل الأنظمة و APIs",
    desc_en: "Connecting legacy systems, third-party services, and payment gateways into unified workflows.",
    desc_ar: "ربط الأنظمة القديمة والخدمات الخارجية وبوابات الدفع في سير عمل موحد.",
  },
  {
    icon: ShieldCheck,
    title_en: "Quality Assurance & Security",
    title_ar: "ضمان الجودة والأمان",
    desc_en: "Automated testing, security audits, and performance optimization built into every delivery cycle.",
    desc_ar: "اختبار آلي وتدقيق أمني وتحسين الأداء مدمج في كل دورة تسليم.",
  },
  {
    icon: BarChart3,
    title_en: "Post-Launch & Growth",
    title_ar: "ما بعد الإطلاق والنمو",
    desc_en: "Ongoing maintenance, monitoring, feature expansion, and scaling support after go-live.",
    desc_ar: "صيانة مستمرة ومراقبة وتوسيع الميزات ودعم التوسع بعد الإطلاق.",
  },
];

export default function EnterpriseCredibility() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 start-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 end-1/4 w-[400px] h-[400px] bg-secondary/3 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-3xl mx-auto text-center mb-16">
          <motion.span variants={fadeUp} custom={0} className="inline-block text-xs font-semibold uppercase tracking-wider text-primary mb-3">
            {isAr ? "القدرة الأساسية" : "Core Capability"}
          </motion.span>
          <motion.div variants={fadeUp} custom={0.5} className="w-16 h-1 gradient-accent rounded-full mx-auto mb-5" />
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            {isAr ? "إنتاج وتسليم برمجيات حقيقي" : "Real Software Production & Delivery"}
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground leading-relaxed">
            {isAr
              ? "ديف وادي ليست مجرد وكالة — نحن فريق هندسي متكامل يبني أنظمة حقيقية تعمل في بيئات الإنتاج، من التصميم والهندسة إلى الاختبار والتسليم والدعم."
              : "DevWady isn't just an agency — we're a full engineering operation that builds real systems running in production, from design and architecture to testing, delivery, and ongoing support."}
          </motion.p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto mb-12">
          {capabilities.map((cap, i) => {
            const Icon = cap.icon;
            return (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i + 3}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="bg-card border border-border/50 rounded-2xl p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group"
              >
                <div className="w-11 h-11 rounded-xl gradient-brand flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2 text-sm">
                  {isAr ? cap.title_ar : cap.title_en}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isAr ? cap.desc_ar : cap.desc_en}
                </p>
              </motion.div>
            );
          })}
        </div>

        <motion.div variants={fadeUp} custom={9} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center">
          <Link to="/enterprise">
            <Button size="lg" className="gradient-brand text-primary-foreground rounded-full px-8 shadow-lg shadow-primary/25 border-0 group">
              {isAr ? "استكشف حلول المؤسسات" : "Explore Enterprise Solutions"}
              <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
