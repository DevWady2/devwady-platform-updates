import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import BusinessUnitHero from "@/components/landing/BusinessUnitHero";
import LandingTrustSection from "@/components/landing/LandingTrustSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Rocket, Code2, Smartphone, Database, Cloud, BarChart3, Shield,
  Building, Zap, RefreshCcw, ArrowRight, CheckCircle2,
  Layers, FileSearch, Cog, Package, HeadphonesIcon,
} from "lucide-react";
import GuestInquirySection from "@/components/landing/GuestInquirySection";

import yozya from "@/assets/products/yozya.webp";
import atmodriveDark from "@/assets/products/atmodrive-dark.webp";
import atmodriveLight from "@/assets/products/atmodrive-light.webp";
import hamla from "@/assets/products/hamla.webp";
import hamlaLight from "@/assets/products/hamla-light.webp";
import nuutPos from "@/assets/clients/nuut-pos.webp";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.45 } }),
};

const processSteps = [
  { icon: FileSearch, title_en: "Discovery & Scoping", title_ar: "اكتشاف وتحديد النطاق", desc_en: "We analyze your requirements, define scope, and create a clear roadmap with timelines and milestones.", desc_ar: "نحلل متطلباتك ونحدد النطاق وننشئ خارطة طريق واضحة بمواعيد ومعالم محددة." },
  { icon: Layers, title_en: "Design & Architecture", title_ar: "التصميم والهندسة", desc_en: "UI/UX design, system architecture, and technical planning — validated before a single line of code is written.", desc_ar: "تصميم واجهات، هندسة الأنظمة، وتخطيط تقني — يُعتمد قبل كتابة أي سطر كود." },
  { icon: Cog, title_en: "Agile Development", title_ar: "تطوير أجايل", desc_en: "2-week sprint cycles with demos, feedback loops, and full transparency into progress and velocity.", desc_ar: "دورات سبرنت أسبوعين مع عروض وحلقات تغذية راجعة وشفافية كاملة." },
  { icon: Package, title_en: "Testing & Launch", title_ar: "اختبار وإطلاق", desc_en: "Rigorous QA, performance testing, security audits, and managed deployment to production.", desc_ar: "اختبار جودة صارم، اختبار أداء، تدقيق أمني، ونشر مُدار للإنتاج." },
  { icon: HeadphonesIcon, title_en: "Support & Growth", title_ar: "دعم ونمو", desc_en: "Post-launch monitoring, maintenance, feature iterations, and scaling support.", desc_ar: "مراقبة بعد الإطلاق، صيانة، تطوير ميزات، ودعم التوسع." },
];

const industries = [
  { en: "FinTech", ar: "تقنية مالية" },
  { en: "Healthcare", ar: "رعاية صحية" },
  { en: "E-Commerce", ar: "تجارة إلكترونية" },
  { en: "Logistics", ar: "لوجستيات" },
  { en: "Education", ar: "تعليم" },
  { en: "Real Estate", ar: "عقارات" },
  { en: "Hospitality", ar: "ضيافة" },
  { en: "Government", ar: "حكومي" },
];

export default function EnterpriseLanding() {
  const { lang } = useLanguage();
  const { theme } = useTheme();
  const isAr = lang === "ar";

  const portfolioItems = [
    { title: isAr ? "Yozya — منصة توصيل" : "Yozya — Delivery Platform", img: yozya, slug: "yozya", tags: ["Mobile", "Web", "API"] },
    { title: isAr ? "AtmoDrive — نقل ذكي" : "AtmoDrive — Smart Mobility", img: theme === "dark" ? atmodriveDark : atmodriveLight, slug: "atmodrive", tags: ["iOS", "Android", "Backend"] },
    { title: isAr ? "Hamla — منصة حملات" : "Hamla — Campaign Platform", img: theme === "dark" ? hamla : hamlaLight, slug: "hamla", tags: ["SaaS", "Dashboard"] },
    { title: isAr ? "nuut POS — نظام مطاعم" : "nuut POS — Restaurant System", img: nuutPos, slug: "nuut-pos", tags: ["POS", "Cloud", "IoT"] },
  ];

  return (
    <>
      <SEO
        title={isAr ? "ديف وادي إنتربرايز — برمجيات مخصصة" : "DevWady Enterprise — Custom Software"}
        description={isAr
          ? "برمجيات مخصصة، تطبيقات جوال، أنظمة مؤسسية ومنصات — من الفكرة إلى الإطلاق."
          : "Custom software, mobile apps, enterprise systems, and platforms — from concept to launch."}
      />
      <BusinessUnitHero
        icon={Rocket}
        gradient="from-[#7D33FF] to-[#956EFA]"
        accentColor="#7D33FF"
        title_en="Build Software That Scales"
        title_ar="ابنِ برمجيات تنمو معك"
        subtitle_en="From MVPs to enterprise platforms — we design, develop, and deliver custom software solutions that drive real business outcomes."
        subtitle_ar="من النماذج الأولية إلى المنصات المؤسسية — نصمم ونطور ونسلم حلول برمجية مخصصة تحقق نتائج أعمال حقيقية."
        tagline_en="DevWady Enterprise"
        tagline_ar="ديف وادي إنتربرايز"
        portalPath="/enterprise/portal"
        guestCtaPath="/auth/enterprise"
        ctaLabel_en="Start a Project"
        ctaLabel_ar="ابدأ مشروعك"
        guestCtaLabel_en="Start a Project"
        guestCtaLabel_ar="ابدأ مشروعك"
        authCtaLabel_en="Go to Enterprise Workspace"
        authCtaLabel_ar="انتقل لمساحة إنتربرايز"
        guestBottomCtaLabel_en="Start Your Project"
        guestBottomCtaLabel_ar="ابدأ مشروعك الآن"
        authBottomCtaLabel_en="Open Workspace"
        authBottomCtaLabel_ar="افتح مساحة العمل"
        secondaryCta={{ path: "/portfolio", label_en: "View Our Work", label_ar: "شاهد أعمالنا" }}
        highlights_en={["End-to-End Delivery", "Agile Sprints", "Transparent Pricing", "Post-Launch Support"]}
        highlights_ar={["تسليم شامل", "سباقات أجايل", "تسعير شفاف", "دعم بعد الإطلاق"]}
        features={[
          { icon: Code2, title_en: "Web Applications", title_ar: "تطبيقات ويب", desc_en: "Modern, responsive web apps built with React, Next.js, and cutting-edge technologies.", desc_ar: "تطبيقات ويب حديثة ومتجاوبة مبنية بأحدث التقنيات." },
          { icon: Smartphone, title_en: "Mobile Apps", title_ar: "تطبيقات جوال", desc_en: "Native and cross-platform mobile applications for iOS and Android.", desc_ar: "تطبيقات جوال أصلية ومتعددة المنصات لـ iOS و Android." },
          { icon: Database, title_en: "Enterprise Systems", title_ar: "أنظمة مؤسسية", desc_en: "ERP, CRM, and custom business systems tailored to your workflows.", desc_ar: "أنظمة ERP و CRM وحلول أعمال مخصصة حسب سير عملك." },
          { icon: Cloud, title_en: "Cloud & DevOps", title_ar: "السحابة و DevOps", desc_en: "Cloud architecture, CI/CD pipelines, and infrastructure automation.", desc_ar: "هندسة سحابية وأنابيب CI/CD وأتمتة البنية التحتية." },
          { icon: BarChart3, title_en: "Data & Analytics", title_ar: "بيانات وتحليلات", desc_en: "Dashboards, BI tools, and data pipelines that turn data into decisions.", desc_ar: "لوحات تحكم وأدوات BI وأنابيب بيانات تحول البيانات لقرارات." },
          { icon: Shield, title_en: "Security & Compliance", title_ar: "أمان وامتثال", desc_en: "Security audits, penetration testing, and compliance-ready architecture.", desc_ar: "تدقيق أمني واختبار اختراق وهندسة جاهزة للامتثال." },
        ]}
      >
        {/* ── How We Work — Process Section ── */}
        <section className="py-20 lg:py-28 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <motion.h2 variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                {isAr ? "كيف نعمل" : "How We Work"}
              </motion.h2>
              <motion.p variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-muted-foreground max-w-lg mx-auto">
                {isAr ? "عملية واضحة من اليوم الأول إلى الإطلاق وما بعده" : "A clear process from day one to launch and beyond"}
              </motion.p>
            </div>
            <div className="max-w-4xl mx-auto relative">
              {/* Vertical line */}
              <div className="absolute start-6 top-0 bottom-0 w-px bg-border/50 hidden md:block" />
              <div className="space-y-8">
                {processSteps.map((step, i) => {
                  const StepIcon = step.icon;
                  return (
                    <motion.div
                      key={i}
                      custom={i}
                      variants={fadeUp}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      className="flex items-start gap-5 md:gap-8"
                    >
                      <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-xl gradient-brand flex items-center justify-center shadow-md shadow-primary/20">
                        <StepIcon className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div className="pt-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                            {isAr ? `خطوة ${i + 1}` : `Step ${i + 1}`}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-1">
                          {isAr ? step.title_ar : step.title_en}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                          {isAr ? step.desc_ar : step.desc_en}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── Portfolio Proof ── */}
        <section className="py-20 lg:py-28">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <motion.h2 variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                {isAr ? "مشاريع نفتخر بها" : "Projects We're Proud Of"}
              </motion.h2>
              <motion.p variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-muted-foreground max-w-lg mx-auto">
                {isAr ? "من الفكرة إلى الإنتاج — حلول حقيقية تعمل" : "From concept to production — real solutions that work"}
              </motion.p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {portfolioItems.map((p, i) => (
                <Link key={i} to={`/portfolio/${p.slug}`}>
                  <motion.div
                    custom={i}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    whileHover={{ y: -6 }}
                    className="bg-card border border-border rounded-2xl overflow-hidden group hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 h-full"
                  >
                    <div className="relative h-40 bg-muted/50 flex items-center justify-center overflow-hidden">
                      <img loading="lazy" src={p.img} alt={p.title} className="max-h-full max-w-full object-contain p-4 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground text-sm mb-2">{p.title}</h3>
                      <div className="flex flex-wrap gap-1">
                        {p.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] rounded-full px-2 py-0 border border-border/50">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
            <motion.div variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mt-10">
              <Link to="/portfolio">
                <Button variant="outline" className="rounded-full border-primary/30 hover:border-primary text-primary">
                  {isAr ? "عرض جميع المشاريع" : "View All Projects"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── Industries ── */}
        <section className="py-16 border-t border-border/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-xl font-bold text-foreground mb-2">
                {isAr ? "القطاعات التي نخدمها" : "Industries We Serve"}
              </h2>
            </div>
            <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
              {industries.map((ind, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-card text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  {isAr ? ind.ar : ind.en}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Guest Inquiry Section ── */}
        <GuestInquirySection
          icon={Rocket}
          gradient="from-[#7D33FF] to-[#956EFA]"
          title_en="Request a Discovery Call"
          title_ar="اطلب مكالمة استكشافية"
          subtitle_en="Tell us about your project idea and we'll schedule a free consultation to discuss scope, timeline, and budget."
          subtitle_ar="أخبرنا عن فكرة مشروعك وسنحدد موعد استشارة مجانية لمناقشة النطاق والجدول والميزانية."
          subject="Enterprise Discovery Call"
          messagePlaceholder_en="Describe your project idea or challenge..."
          messagePlaceholder_ar="صف فكرة مشروعك أو التحدي الذي تواجهه..."
        />

        <LandingTrustSection
          accentGradient="from-[#7D33FF] to-[#956EFA]"
          stats={[
            { value: "50+", label_en: "Projects Delivered", label_ar: "مشروع تم تسليمه" },
            { value: "98%", label_en: "Client Satisfaction", label_ar: "رضا العملاء" },
            { value: "15+", label_en: "Industries Served", label_ar: "قطاع خُدم" },
            { value: "24/7", label_en: "Support Available", label_ar: "دعم متاح" },
          ]}
          useCases={[
            { icon: Building, title_en: "Startup MVPs", title_ar: "نماذج أولية للشركات الناشئة", desc_en: "Go from idea to market-ready product in weeks with our rapid delivery sprints.", desc_ar: "انتقل من الفكرة إلى منتج جاهز للسوق في أسابيع مع سباقات التسليم السريع." },
            { icon: Zap, title_en: "Digital Transformation", title_ar: "التحول الرقمي", desc_en: "Modernize legacy systems and digitize operations with custom enterprise solutions.", desc_ar: "حدّث الأنظمة القديمة ورقمن العمليات بحلول مؤسسية مخصصة." },
            { icon: RefreshCcw, title_en: "Ongoing Development", title_ar: "تطوير مستمر", desc_en: "Dedicated engineering teams for continuous product evolution and scaling.", desc_ar: "فرق هندسية مخصصة لتطوير المنتج المستمر والتوسع." },
          ]}
          sectionTitle_en="Who Is This For?"
          sectionTitle_ar="لمن هذا؟"
          testimonials={[
            { quote_en: "DevWady delivered our platform ahead of schedule with exceptional quality.", quote_ar: "DevWady سلمت منصتنا قبل الموعد بجودة استثنائية.", author_en: "Ahmed K.", author_ar: "أحمد ك.", role_en: "CTO, FinTech Startup", role_ar: "مدير تقني، شركة تقنية مالية" },
            { quote_en: "The team understood our vision and built exactly what we needed.", quote_ar: "الفريق فهم رؤيتنا وبنى بالضبط ما نحتاج.", author_en: "Sara M.", author_ar: "سارة م.", role_en: "Product Manager, E-commerce", role_ar: "مديرة منتج، تجارة إلكترونية" },
            { quote_en: "From architecture to deployment, their process was flawless and transparent.", quote_ar: "من الهندسة إلى النشر، عمليتهم كانت سلسة وشفافة.", author_en: "Khalid R.", author_ar: "خالد ر.", role_en: "CEO, SaaS Platform", role_ar: "الرئيس التنفيذي، منصة SaaS" },
          ]}
        />
      </BusinessUnitHero>
    </>
  );
}
