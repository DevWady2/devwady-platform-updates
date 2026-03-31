/**
 * EngagementModels — Clarifies how DevWady works with clients.
 */
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Rocket, Users, Lightbulb, GraduationCap } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.45 } }),
};

const models = [
  {
    icon: Rocket,
    title_en: "Project Delivery",
    title_ar: "تسليم المشاريع",
    desc_en: "End-to-end product development — from discovery and design through engineering, QA, and launch. Fixed-scope or agile.",
    desc_ar: "تطوير منتجات متكامل — من الاستكشاف والتصميم إلى الهندسة والاختبار والإطلاق. نطاق ثابت أو أجايل.",
    gradient: "from-primary to-secondary",
  },
  {
    icon: Users,
    title_en: "Dedicated Teams",
    title_ar: "فرق مخصصة",
    desc_en: "Embedded engineering squads that work as an extension of your team — managed, accountable, and aligned with your roadmap.",
    desc_ar: "فرق هندسية مدمجة تعمل كامتداد لفريقك — مُدارة ومسؤولة ومتوافقة مع خطتك.",
    gradient: "from-[#185FA5] to-[#378ADD]",
  },
  {
    icon: Lightbulb,
    title_en: "Expert Consulting",
    title_ar: "الاستشارات",
    desc_en: "On-demand access to specialists in architecture, product strategy, DevOps, and security for focused engagements.",
    desc_ar: "وصول عند الطلب لمتخصصين في الهندسة واستراتيجية المنتج و DevOps والأمان.",
    gradient: "from-[#7D33FF] to-[#3333FF]",
  },
  {
    icon: GraduationCap,
    title_en: "Training & Upskilling",
    title_ar: "التدريب والتأهيل",
    desc_en: "Structured bootcamps and corporate training programs to build internal engineering capability.",
    desc_ar: "معسكرات منظمة وبرامج تدريب مؤسسي لبناء القدرات الهندسية الداخلية.",
    gradient: "from-[#0F6E56] to-[#1D9E75]",
  },
];

export default function EngagementModels() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <section className="py-20 lg:py-28 bg-muted/30 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 end-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
          <motion.span variants={fadeUp} custom={0} className="inline-block text-xs font-semibold uppercase tracking-wider text-primary mb-3">
            {isAr ? "نماذج التعاون" : "How We Work"}
          </motion.span>
          <motion.div variants={fadeUp} custom={0.5} className="w-16 h-1 gradient-accent rounded-full mx-auto mb-5" />
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            {isAr ? "اختر نموذج التعاون المناسب" : "Choose the Right Engagement Model"}
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-muted-foreground max-w-2xl mx-auto">
            {isAr
              ? "سواء كنت تحتاج مشروعاً كاملاً أو فريقاً مخصصاً أو استشارة متخصصة — لدينا النموذج المناسب."
              : "Whether you need a full project, a dedicated team, or focused expertise — we have the right model for you."}
          </motion.p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {models.map((model, i) => {
            const Icon = model.icon;
            return (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i + 3}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="bg-card border border-border/50 rounded-2xl p-7 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${model.gradient} flex items-center justify-center mb-5 group-hover:scale-105 transition-transform`}>
                  <Icon className="h-5.5 w-5.5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {isAr ? model.title_ar : model.title_en}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isAr ? model.desc_ar : model.desc_en}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
