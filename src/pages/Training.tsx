import { lazy, Suspense } from "react";
import { PRODUCT_TYPE_BADGE, isProductType } from "@/features/academy/learningModel";
import { Link } from "react-router-dom";
const StudentBanner = lazy(() => import("@/components/training/StudentBanner"));
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getIcon } from "@/lib/iconMap";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import {
  ArrowRight, BookOpen, Code, Briefcase,
  GraduationCap, Users, Repeat, Rocket, CheckCircle2, Star,
  Zap, Shield, TrendingUp, Award
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

export default function Training() {
  const { t, lang } = useLanguage();

  const { data: tracks = [], isLoading } = useQuery({
    queryKey: ["training-courses-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_courses")
        .select("*")
        .eq("is_active", true)
        .eq("status", "published")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const title = (c: any) => lang === "ar" ? (c.title_ar || c.title_en) : c.title_en;
  const desc = (c: any) => lang === "ar" ? (c.description_ar || c.description_en) : c.description_en;
  const outcomes = (c: any) => lang === "ar" ? (c.outcomes_ar?.length ? c.outcomes_ar : c.outcomes_en) : c.outcomes_en;
  const dur = (c: any) => lang === "ar" ? (c.duration_ar || c.duration_en) : c.duration_en;
  const lvl = (c: any) => lang === "ar" ? (c.level_ar || c.level_en) : c.level_en;

  const steps = [
    { icon: BookOpen, num: "01", title: t("training.step1"), desc: t("training.step1Desc") },
    { icon: Code, num: "02", title: t("training.step2"), desc: t("training.step2Desc") },
    { icon: Rocket, num: "03", title: t("training.step3"), desc: t("training.step3Desc") },
    { icon: Repeat, num: "04", title: t("training.step4"), desc: t("training.step4Desc") },
  ];

  const whoFor = [
    { icon: GraduationCap, label: t("training.freshGrads") },
    { icon: Code, label: t("training.juniorDevs") },
    { icon: Repeat, label: t("training.careerSwitchers") },
    { icon: Users, label: t("training.corporateTeams") },
    { icon: Briefcase, label: t("training.freelancers") },
  ];

  const stats = [
    { value: String(tracks.length || "12"), label: lang === "ar" ? "مسارات تدريبية" : "Training Tracks" },
    { value: String(tracks.reduce((s, t) => s + (t.total_lessons || 0), 0) || "500+"), label: lang === "ar" ? "درس" : "Total Lessons" },
    { value: "95%", label: lang === "ar" ? "معدل التوظيف" : "Hire Rate" },
    { value: "15+", label: lang === "ar" ? "منتج حقيقي" : "Real Products" },
  ];

  const { data: testimonials = [] } = useQuery({
    queryKey: ["testimonials-training"],
    queryFn: async () => {
      const { data, error } = await supabase.from("testimonials" as any).select("*").eq("section", "training").eq("is_active", true).order("sort_order");
      if (error) throw error;
      return (data as any[]).map((t: any) => ({
        name: lang === "ar" ? t.name_ar || t.name_en : t.name_en,
        role: lang === "ar" ? t.role_ar || t.role_en : t.role_en,
        quote: lang === "ar" ? t.quote_ar || t.quote_en : t.quote_en,
        rating: t.rating || 5,
      }));
    },
  });

  const advantages = [
    { icon: Rocket, title: lang === "ar" ? "تعلم بالبناء" : "Learn by Building", desc: lang === "ar" ? "اعمل على منتجات حقيقية من اليوم الأول" : "Work on real products from day one" },
    { icon: Award, title: lang === "ar" ? "شهادة معتمدة" : "Certified", desc: lang === "ar" ? "شهادة إتمام من DevWady" : "Completion certificate from DevWady" },
    { icon: Users, title: lang === "ar" ? "إرشاد مباشر" : "Live Mentoring", desc: lang === "ar" ? "جلسات مباشرة مع مطورين محترفين" : "Live sessions with senior developers" },
    { icon: TrendingUp, title: lang === "ar" ? "فرصة توظيف" : "Job Pipeline", desc: lang === "ar" ? "أفضل الخريجين ينضمون لفريق DevWady" : "Top graduates join the DevWady team" },
    { icon: Zap, title: lang === "ar" ? "منهج عملي" : "Practical Curriculum", desc: lang === "ar" ? "لا نظريات مملة — كل شيء تطبيقي" : "No boring theory — everything is hands-on" },
    { icon: Shield, title: lang === "ar" ? "دعم مستمر" : "Ongoing Support", desc: lang === "ar" ? "مجتمع خريجين ودعم ما بعد الدورة" : "Alumni community & post-course support" },
  ];

  return (
    <>
      <SEO title={t("seo.training.title")} description={t("seo.training.desc")} />
      {/* Student authenticated banner */}
      <div className="container mx-auto px-4 pt-6">
        <Suspense fallback={null}><StudentBanner /></Suspense>
      </div>
      {/* Hero */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 -right-32 w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] rounded-full bg-secondary/5 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              DevWady Academy
            </span>
            <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight mb-4 max-w-3xl">{t("training.subtitle")}</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mb-8 leading-relaxed">{t("training.description")}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-wrap gap-4">
            <Link to="/contact"><Button size="lg" className="gradient-brand text-primary-foreground rounded-full px-8 shadow-lg shadow-primary/25">{t("training.enrollNow")} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" /></Button></Link>
            <Link to="/hiring"><Button size="lg" variant="outline" className="rounded-full px-8">{lang === "ar" ? "فرص العمل" : "Hiring Hub"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" /></Button></Link>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {stats.map((stat, i) => (
              <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Methodology */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl lg:text-4xl font-bold mb-3">{t("training.methodology")}</motion.h2>
            <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-muted-foreground max-w-2xl mx-auto">{t("training.methodDesc")}</motion.p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} whileHover={{ y: -4 }}
                className="brand-card-interactive p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-es-full" />
                <span className="text-4xl font-bold text-primary/15 relative">{s.num}</span>
                <div className="w-10 h-10 rounded-lg gradient-brand flex items-center justify-center mt-3 mb-3"><s.icon className="h-5 w-5 text-primary-foreground" /></div>
                <h3 className="text-lg font-bold mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why DevWady Academy */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl lg:text-4xl font-bold mb-3">{lang === "ar" ? "لماذا أكاديمية DevWady؟" : "Why DevWady Academy?"}</motion.h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {advantages.map((adv, i) => (
              <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} whileHover={{ y: -4 }}
                className="brand-card-interactive p-6">
                <div className="w-10 h-10 rounded-lg gradient-brand flex items-center justify-center mb-4"><adv.icon className="h-5 w-5 text-primary-foreground" /></div>
                <h3 className="font-semibold mb-1">{adv.title}</h3>
                <p className="text-sm text-muted-foreground">{adv.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bootcamp Tracks */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl lg:text-4xl font-bold mb-3">{t("training.viewCourses")}</motion.h2>
            <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-muted-foreground">
              {lang === "ar" ? "اختر المسار الذي يناسبك وابدأ رحلتك" : "Choose the track that fits you and start your journey"}
            </motion.p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-80 rounded-2xl" />)}
            </div>
          ) : tracks.length === 0 ? (
            <div className="text-center py-16">
              <GraduationCap className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-1">{lang === "ar" ? "الدورات قادمة قريباً" : "Courses Coming Soon"}</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">{lang === "ar" ? "نعمل على إعداد المنهج — تابعنا للتحديثات." : "We're preparing the curriculum — stay tuned for updates."}</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tracks.map((track, i) => {
                const IC = getIcon(track.icon);
                const outs = outcomes(track) || [];
                const tls = Array.isArray(track.tools) ? track.tools : [];
                return (
                  <motion.div key={track.id} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                    whileHover={{ y: -6, transition: { duration: 0.2 } }}
                    className="brand-card-interactive overflow-hidden group flex flex-col">
                    <div className={`h-2 bg-gradient-to-r ${track.color || 'from-primary to-secondary'}`} />
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center">
                          <IC className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div className="text-end">
                          <span className="text-xs text-muted-foreground block">{lvl(track)}</span>
                          {isProductType((track as any).learning_product_type) && (
                            <span className="px-2 py-0.5 rounded-full bg-secondary/80 text-secondary-foreground text-[10px] font-semibold inline-block mt-1">
                              {lang === "ar" ? PRODUCT_TYPE_BADGE[(track as any).learning_product_type as keyof typeof PRODUCT_TYPE_BADGE].ar : PRODUCT_TYPE_BADGE[(track as any).learning_product_type as keyof typeof PRODUCT_TYPE_BADGE].en}
                            </span>
                          )}
                          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold inline-block mt-1">{dur(track)}</span>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold mb-2">{title(track)}</h3>
                      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{desc(track)}</p>

                      {(track.total_lessons ?? 0) > 0 && (
                        <div className="flex gap-4 mb-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5 text-primary" /><span className="font-semibold text-foreground">{track.total_lessons}</span> {lang === "ar" ? "درس" : "lessons"}</span>
                          <span className="flex items-center gap-1"><Rocket className="h-3.5 w-3.5 text-primary" /><span className="font-semibold text-foreground">{track.total_projects}</span> {lang === "ar" ? "مشاريع" : "projects"}</span>
                        </div>
                      )}

                      <div className="space-y-2 mb-4 flex-1">
                        {outs.map((outcome: string, j: number) => (
                          <div key={j} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{outcome}</span>
                          </div>
                        ))}
                      </div>

                      {tls.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {tls.map((tool: string, j: number) => (
                            <span key={j} className="px-2 py-0.5 text-[10px] font-medium rounded bg-muted text-muted-foreground">{tool}</span>
                          ))}
                        </div>
                      )}

                      <Link to={`/academy/courses/${track.slug}`} className="mt-auto">
                        <Button variant="outline" size="sm" className="rounded-full w-full group-hover:gradient-brand group-hover:text-primary-foreground group-hover:border-transparent transition-all">
                          {lang === "ar" ? "عرض المحتوى والتسجيل" : "View Content & Enroll"} <ArrowRight className="icon-flip-rtl ms-1 h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Who Is This For */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-2xl font-bold mb-8">{t("training.whoFor")}</motion.h2>
          <div className="flex flex-wrap justify-center gap-4">
            {whoFor.map((w, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 bg-card px-5 py-3 rounded-full border transition-all cursor-default">
                <w.icon className="h-4 w-4 text-primary" /><span className="text-sm font-medium">{w.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl lg:text-4xl font-bold mb-3">{lang === "ar" ? "قصص نجاح خريجينا" : "Graduate Success Stories"}</motion.h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((test, i) => (
              <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="brand-card p-6">
                <div className="flex gap-0.5 mb-4">{Array.from({ length: test.rating }).map((_, j) => <Star key={j} className="h-4 w-4 fill-primary text-primary" />)}</div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 italic">"{test.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-primary-foreground text-sm font-bold">{test.name.split(" ").map(n => n[0]).join("")}</div>
                  <div><div className="font-semibold text-sm">{test.name}</div><div className="text-xs text-muted-foreground">{test.role}</div></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="gradient-brand rounded-3xl p-10 lg:p-16 text-center text-primary-foreground">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">{lang === "ar" ? "جاهز لبدء مسيرتك المهنية؟" : "Ready to Launch Your Career?"}</h2>
            <p className="text-lg opacity-90 mb-8 max-w-md mx-auto">{lang === "ar" ? "سجل الآن وابدأ التعلم ببناء منتجات حقيقية مع فريق محترف" : "Enroll now and start learning by building real products with a professional team"}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/contact"><Button size="lg" variant="secondary" className="rounded-full px-8 text-base">{t("training.enrollNow")} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" /></Button></Link>
              <Link to="/pricing"><Button size="lg" variant="outline" className="rounded-full px-8 text-base border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">{lang === "ar" ? "عرض الأسعار" : "View Pricing"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" /></Button></Link>
            </div>
            <p className="mt-6 text-sm opacity-80">
              <Link to="/become-instructor" className="underline underline-offset-4 hover:opacity-100">
                {lang === "ar" ? "هل تريد التدريس على DevWady؟" : "Want to teach on DevWady?"}
              </Link>
            </p>
          </motion.div>
        </div>
      </section>
    </>
  );
}
