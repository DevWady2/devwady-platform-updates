import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import {
  Target, Eye, Sparkles, Shield, TrendingUp, ArrowRight,
  MapPin, Calendar, Users, Building2, Rocket, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

export default function About() {
  const { t, lang } = useLanguage();

  const values = [
    { icon: Target, title: t("about.value1"), desc: t("about.value1Desc") },
    { icon: Sparkles, title: t("about.value2"), desc: t("about.value2Desc") },
    { icon: Eye, title: t("about.value3"), desc: t("about.value3Desc") },
    { icon: Shield, title: t("about.value4"), desc: t("about.value4Desc") },
    { icon: TrendingUp, title: t("about.value5"), desc: t("about.value5Desc") },
  ];

  const companyFacts = [
    { icon: Calendar, label: lang === "ar" ? "تأسست" : "Founded", value: "2025" },
    { icon: MapPin, label: lang === "ar" ? "المقر" : "Headquarters", value: lang === "ar" ? "القاهرة، مصر" : "Cairo, Egypt" },
    { icon: Building2, label: lang === "ar" ? "مناطق العمل" : "Operating In", value: lang === "ar" ? "مصر والسعودية" : "Egypt & KSA" },
    { icon: Users, label: lang === "ar" ? "حجم الفريق" : "Team Size", value: "25+" },
    { icon: Rocket, label: lang === "ar" ? "مشاريع مُطلقة" : "Products Shipped", value: "10+" },
    { icon: Award, label: lang === "ar" ? "القطاعات" : "Sectors", value: "3" },
  ];

  const milestones = [
    {
      year: "2025 Q1",
      title: lang === "ar" ? "تأسيس ديف وادي" : "DevWady Founded",
      desc: lang === "ar" ? "انطلقنا كمنظومة بناء — وليس شركة برمجيات تقليدية." : "Launched as a builder ecosystem — not a typical software company.",
    },
    {
      year: "2025 Q2",
      title: lang === "ar" ? "أول منتج — YOZYA" : "First Product — YOZYA",
      desc: lang === "ar" ? "أطلقنا أول منظومة متعددة الوحدات تشمل العقارات والنقل." : "Shipped our first multi-module platform spanning real estate & transport.",
    },
    {
      year: "2025 Q3",
      title: lang === "ar" ? "التوسع للسعودية" : "Expanded to KSA",
      desc: lang === "ar" ? "بدأنا خدمة عملاء في المملكة العربية السعودية." : "Started serving clients in Saudi Arabia.",
    },
    {
      year: "2025 Q4",
      title: lang === "ar" ? "أكاديمية ديف وادي" : "DevWady Academy",
      desc: lang === "ar" ? "أطلقنا برنامج التعلم بالشحن — أول دفعة تخرجت وانضمت للفريق." : "Launched the Learning-by-Shipping program — first batch graduated and joined the team.",
    },
  ];

  const leadership = [
    { name: "Kamal Wagdi", role: "CEO & Founder — Software Engineer", initials: "KW" },
    { name: "Mohamed El Bana", role: "Software Architect — UI/UX Team Lead", initials: "ME" },
    { name: "Kamal Osman", role: "Chief Information Security Officer", initials: "KO" },
  ];


  return (
    <>
      <SEO title={t("seo.about.title")} description={t("seo.about.desc")} />
      {/* Hero */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 -right-32 w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] rounded-full bg-secondary/5 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6"
            >
              {t("about.title")}
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl lg:text-6xl font-extrabold leading-tight mb-6"
            >
              {t("about.promise")}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-muted-foreground leading-relaxed mb-4"
            >
              {t("about.subtitle")}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground leading-relaxed"
            >
              {t("about.description")}
            </motion.p>
          </div>
        </div>
      </section>

      {/* Company Facts Grid */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {companyFacts.map((fact, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="bg-card rounded-xl p-5 border border-border text-center"
              >
                <fact.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                <div className="text-lg font-bold">{fact.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{fact.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-20">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-2xl p-8 border border-border relative overflow-hidden"
          >
            <div className="absolute top-0 start-0 w-1 h-full gradient-brand rounded-s-2xl" />
            <h3 className="text-2xl font-bold text-primary mb-4">{t("about.vision")}</h3>
            <p className="text-muted-foreground leading-relaxed">{t("about.visionText")}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-2xl p-8 border border-border relative overflow-hidden"
          >
            <div className="absolute top-0 start-0 w-1 h-full gradient-brand rounded-s-2xl" />
            <h3 className="text-2xl font-bold text-primary mb-4">{t("about.mission")}</h3>
            <p className="text-muted-foreground leading-relaxed">{t("about.missionText")}</p>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl lg:text-4xl font-bold mb-3"
            >
              {lang === "ar" ? "قيمنا الأساسية" : "Our Core Values"}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground"
            >
              {lang === "ar" ? "المبادئ التي تقود كل قرار نتخذه" : "The principles that drive every decision we make"}
            </motion.p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="bg-card rounded-xl p-6 border border-border hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="w-10 h-10 rounded-lg gradient-brand flex items-center justify-center mb-4">
                  <v.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-semibold mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline / Milestones */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl lg:text-4xl font-bold mb-3"
            >
              {lang === "ar" ? "رحلتنا" : "Our Journey"}
            </motion.h2>
          </div>

          <div className="max-w-3xl mx-auto relative">
            {/* Timeline line */}
            <div className="absolute start-4 lg:start-1/2 top-0 bottom-0 w-px bg-border lg:-translate-x-px" />

            {milestones.map((m, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className={`relative flex items-start gap-6 mb-10 ${
                  i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                }`}
              >
                {/* Dot */}
                <div className="absolute start-4 lg:start-1/2 w-3 h-3 rounded-full gradient-brand -translate-x-1.5 lg:-translate-x-1.5 mt-1.5 z-10" />

                {/* Content */}
                <div className={`ms-10 lg:ms-0 lg:w-1/2 ${i % 2 === 0 ? "lg:pe-10 lg:text-end" : "lg:ps-10"}`}>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
                    {m.year}
                  </span>
                  <h3 className="text-lg font-bold mb-1">{m.title}</h3>
                  <p className="text-sm text-muted-foreground">{m.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Preview */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl lg:text-4xl font-bold mb-3"
            >
              {t("team.title")}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground"
            >
              {t("team.subtitle")}
            </motion.p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto mb-10">
            {leadership.map((m, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="bg-card rounded-2xl p-6 border border-border text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-16 h-16 rounded-full gradient-brand mx-auto mb-4 flex items-center justify-center text-primary-foreground text-lg font-bold">
                  {m.initials}
                </div>
                <h3 className="font-bold">{m.name}</h3>
                <p className="text-sm text-muted-foreground">{m.role}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Link to="/team">
              <Button variant="outline" className="rounded-full px-8">
                {lang === "ar" ? "تعرف على الفريق بالكامل" : "Meet the Full Team"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>


      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="gradient-brand rounded-3xl p-10 lg:p-16 text-center text-primary-foreground"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              {lang === "ar" ? "جاهز لبناء شيء عظيم؟" : "Ready to Build Something Great?"}
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-md mx-auto">{t("contact.subtitle")}</p>
            <Link to="/contact">
              <Button size="lg" variant="secondary" className="rounded-full px-8 text-base">
                {t("hero.cta1")} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
