/**
 * SupportingCapabilities — Positions Talent, Consulting, Academy as secondary strengths.
 */
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { ArrowRight, Users, Lightbulb, GraduationCap } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.45 } }),
};

const capabilities = [
  {
    icon: Users,
    title_en: "Talent Solutions",
    title_ar: "حلول المواهب",
    desc_en: "Access pre-vetted developers and designers through staff augmentation, dedicated teams, or direct hire.",
    desc_ar: "وصول لمطورين ومصممين معتمدين عبر تعزيز الفريق أو فرق مخصصة أو توظيف مباشر.",
    path: "/talent",
    cta_en: "Explore Talent",
    cta_ar: "استكشف المواهب",
    gradient: "from-[#185FA5] to-[#378ADD]",
  },
  {
    icon: Lightbulb,
    title_en: "Expert Consulting",
    title_ar: "استشارات الخبراء",
    desc_en: "Book 1:1 sessions with specialists in architecture, product strategy, DevOps, and security.",
    desc_ar: "احجز جلسات فردية مع متخصصين في الهندسة واستراتيجية المنتج و DevOps والأمان.",
    path: "/consulting",
    cta_en: "Browse Experts",
    cta_ar: "تصفح الخبراء",
    gradient: "from-[#7D33FF] to-[#3333FF]",
  },
  {
    icon: GraduationCap,
    title_en: "DevWady Academy",
    title_ar: "أكاديمية ديف وادي",
    desc_en: "Practical bootcamps, live mentoring, and professional certificates that employers recognize.",
    desc_ar: "معسكرات عملية وإرشاد مباشر وشهادات مهنية يعترف بها أصحاب العمل.",
    path: "/academy",
    cta_en: "Explore Academy",
    cta_ar: "استكشف الأكاديمية",
    gradient: "from-[#0F6E56] to-[#1D9E75]",
  },
];

export default function SupportingCapabilities() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 end-0 w-96 h-96 bg-secondary/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
          <motion.span variants={fadeUp} custom={0} className="inline-block text-xs font-semibold uppercase tracking-wider text-primary mb-3">
            {isAr ? "قدرات داعمة" : "Beyond Software Delivery"}
          </motion.span>
          <motion.div variants={fadeUp} custom={0.5} className="w-16 h-1 gradient-accent rounded-full mx-auto mb-5" />
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            {isAr ? "منظومة متكاملة لدعم نموك" : "A Complete Ecosystem for Growth"}
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-muted-foreground max-w-2xl mx-auto">
            {isAr
              ? "إلى جانب تسليم البرمجيات، توفر ديف وادي قدرات مكمّلة تدعم أعمالك من كل الجوانب."
              : "Beyond project delivery, DevWady offers complementary capabilities that support your business from every angle."}
          </motion.p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
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
                className="bg-card border border-border/50 rounded-2xl p-7 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group flex flex-col"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cap.gradient} flex items-center justify-center mb-5 group-hover:scale-105 transition-transform`}>
                  <Icon className="h-5.5 w-5.5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {isAr ? cap.title_ar : cap.title_en}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-1">
                  {isAr ? cap.desc_ar : cap.desc_en}
                </p>
                <Link
                  to={cap.path}
                  className="text-sm font-semibold inline-flex items-center gap-1.5 text-primary group/cta"
                >
                  {isAr ? cap.cta_ar : cap.cta_en}
                  <ArrowRight className="icon-flip-rtl h-3.5 w-3.5 transition-transform group-hover/cta:translate-x-1 rtl:group-hover/cta:-translate-x-1" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
