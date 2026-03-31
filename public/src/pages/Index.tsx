import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  ArrowRight, Users, GraduationCap,
  Lightbulb, Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import AuthenticatedHomepage from "@/components/landing/AuthenticatedHomepage";
import EnterpriseCredibility from "@/components/landing/EnterpriseCredibility";
import EngagementModels from "@/components/landing/EngagementModels";
import IndustriesSection from "@/components/landing/IndustriesSection";
import SupportingCapabilities from "@/components/landing/SupportingCapabilities";

import yozya from "@/assets/products/yozya.webp";
import atmodriveDark from "@/assets/products/atmodrive-dark.webp";
import atmodriveLight from "@/assets/products/atmodrive-light.webp";
import hamla from "@/assets/products/hamla.webp";
import hamlaLight from "@/assets/products/hamla-light.webp";
import nuutPos from "@/assets/clients/nuut-pos.webp";

// Orbit logos
import yozyaLogo from "@/assets/clients/yozya-logo.png";
import yozyaPartnerLogo from "@/assets/clients/yozya-partner-logo.png";
import atmodriveLogo from "@/assets/clients/atmodrive-logo.png";
import atmodrivePassengerLogo from "@/assets/clients/atmodrive-passenger-logo.png";
import majestyLogo from "@/assets/clients/majesty-logo.png";
import nuutLogo from "@/assets/clients/nuut-logo.png";
import hamlaLogo from "@/assets/clients/hamla-logo.png";
import devwadyMark from "@/assets/devwady-mark.png";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

// ── Business Line Cards ──
interface BusinessLine {
  id: string;
  icon: typeof Rocket;
  title_en: string;
  title_ar: string;
  desc_en: string;
  desc_ar: string;
  cta_en: string;
  cta_ar: string;
  ctaPath: string;
  tags_en: string[];
  tags_ar: string[];
  gradient: string;
  iconBgClass: string;
  accentColor: string;
}

const businessLines: BusinessLine[] = [
  {
    id: "enterprise",
    icon: Rocket,
    title_en: "Enterprise Solutions",
    title_ar: "حلول المؤسسات",
    desc_en: "Custom software, mobile apps, enterprise systems, and digital platforms — designed, built, and shipped end-to-end.",
    desc_ar: "برمجيات مخصصة، تطبيقات جوال، أنظمة مؤسسية ومنصات رقمية — تصميم وبناء وتسليم متكامل.",
    cta_en: "Explore Enterprise",
    cta_ar: "استكشف إنتربرايز",
    ctaPath: "/enterprise",
    tags_en: ["Mobile Apps", "Web Platforms", "ERP Systems", "UI/UX Design"],
    tags_ar: ["تطبيقات جوال", "منصات ويب", "أنظمة ERP", "تصميم واجهات"],
    gradient: "from-[#7D33FF] to-[#956EFA]",
    iconBgClass: "gradient-brand",
    accentColor: "#7D33FF",
  },
  {
    id: "talent",
    icon: Users,
    title_en: "Talent Solutions",
    title_ar: "حلول المواهب",
    desc_en: "Hire pre-vetted developers, designers, and engineers — staff augmentation, dedicated teams, or direct hire.",
    desc_ar: "وظّف مطورين ومصممين ومهندسين معتمدين — تعزيز الفريق، فرق مخصصة، أو توظيف مباشر.",
    cta_en: "Explore Talent",
    cta_ar: "استكشف تالنت",
    ctaPath: "/talent",
    tags_en: ["Staff Augmentation", "Dedicated Squads", "Direct Hire"],
    tags_ar: ["تعزيز الفريق", "فرق مخصصة", "توظيف مباشر"],
    gradient: "from-[#185FA5] to-[#378ADD]",
    iconBgClass: "bg-[#185FA5]/15",
    accentColor: "#185FA5",
  },
  {
    id: "consulting",
    icon: Lightbulb,
    title_en: "Expert Consulting",
    title_ar: "استشارات الخبراء",
    desc_en: "Book 1:1 sessions with specialists in product strategy, architecture, DevOps, security, and more.",
    desc_ar: "احجز جلسات فردية مع متخصصين في استراتيجية المنتج والهندسة و DevOps والأمان والمزيد.",
    cta_en: "Explore Consulting",
    cta_ar: "استكشف الاستشارات",
    ctaPath: "/consulting",
    tags_en: ["Product Strategy", "Architecture", "DevOps", "Security"],
    tags_ar: ["استراتيجية المنتج", "هندسة", "DevOps", "أمان"],
    gradient: "from-[#7D33FF] to-[#3333FF]",
    iconBgClass: "bg-[#7F77DD]/15",
    accentColor: "#7F77DD",
  },
  {
    id: "academy",
    icon: GraduationCap,
    title_en: "DevWady Academy",
    title_ar: "أكاديمية ديف وادي",
    desc_en: "Practical bootcamps, live mentoring, and professional certificates that employers recognize.",
    desc_ar: "معسكرات عملية وإرشاد مباشر وشهادات مهنية يعترف بها أصحاب العمل.",
    cta_en: "Explore Academy",
    cta_ar: "استكشف الأكاديمية",
    ctaPath: "/academy",
    tags_en: ["Bootcamps", "Live Mentoring", "Certificates"],
    tags_ar: ["معسكرات", "إرشاد مباشر", "شهادات"],
    gradient: "from-[#0F6E56] to-[#1D9E75]",
    iconBgClass: "bg-[#0F6E56]/15",
    accentColor: "#0F6E56",
  },
];

export default function Index() {
  const { t, lang } = useLanguage();
  const { theme } = useTheme();
  const { user, role } = useAuth();
  const isAr = lang === "ar";

  const isAuthenticatedNonAdmin = !!(user && role && role !== "admin");

  const stats = [
    { val: t("hero.stat1"), label: t("hero.stat1Label") },
    { val: t("hero.stat2"), label: t("hero.stat2Label") },
    { val: t("hero.stat3"), label: t("hero.stat3Label") },
  ];

  const products = [
    { title: t("portfolio.yozya"), desc: t("portfolio.yozyaDesc"), img: yozya, flagship: true, slug: "yozya" },
    { title: t("portfolio.atmodrive"), desc: t("portfolio.atmodriveDesc"), img: theme === "dark" ? atmodriveDark : atmodriveLight, isPhoto: true, slug: "atmodrive" },
    { title: t("portfolio.hamla"), desc: t("portfolio.hamlaDesc"), img: theme === "dark" ? hamla : hamlaLight, isPhoto: theme !== "dark", slug: "hamla" },
    { title: isAr ? "nuut POS — نظام مطاعم متكامل" : "nuut POS — Restaurant System", desc: isAr ? "منصة متكاملة لإدارة المطاعم nuut.ai و nuut POS" : "Full Platform — nuut.ai & nuut POS", img: nuutPos, slug: "nuut-pos" },
  ];




  const orbitProducts = [
    { img: yozyaLogo, label: "Yozya", angle: 0, round: true },
    { img: yozyaPartnerLogo, label: "Yozya Partner", angle: 51.4, round: true },
    { img: atmodriveLogo, label: "AtmoDrive Captain", angle: 102.9, round: true },
    { img: atmodrivePassengerLogo, label: "AtmoDrive Passenger", angle: 154.3, round: true },
    { img: hamlaLogo, label: "Hamla", angle: 205.7, round: false },
    { img: majestyLogo, label: "MIS", angle: 257.1, round: true },
    { img: nuutLogo, label: "nuut", angle: 308.6, round: false, fullSize: true },
  ];

  // Authenticated non-admin users get the personalized homepage
  if (isAuthenticatedNonAdmin) {
    return <AuthenticatedHomepage />;
  }

  return (
    <>
      <SEO description={t("seo.home.desc")} />

      {/* ===== HERO — Gateway Landing ===== */}
      <section className="relative overflow-hidden min-h-[100vh] flex items-center hero-orbital-bg">
        <div className="absolute inset-0 pointer-events-none hero-radial-lines" />

        <div className="container mx-auto px-4 py-24 lg:py-28 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <div className={isAr ? "text-end lg:order-2" : ""}>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-6"
              >
                <Rocket className="h-3.5 w-3.5 text-[#956efa]" />
                <span className="text-xs font-medium text-white/70">
                  {isAr ? "نبني. نشحن. نكبر." : "We Build. We Ship. We Scale."}
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-extrabold leading-[1.1] tracking-tight text-white mb-3"
              >
                {isAr ? "شريك التكنولوجيا" : "Technology Partner for"}
              </motion.h1>
              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6"
              >
                <span className="text-gradient-brand">
                  {isAr ? "للشركات الطموحة." : "Ambitious Companies."}
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="text-base lg:text-lg text-white/45 max-w-lg mb-8 leading-relaxed"
              >
                {isAr
                  ? "من البرمجيات المخصصة إلى الفرق المتخصصة إلى التدريب المتقدم — ديف وادي تقدم حلول تكنولوجية متكاملة."
                  : "From custom software to expert teams to advanced training — DevWady delivers end-to-end technology solutions."}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="flex flex-wrap gap-3 mb-10"
              >
                <Link to="/start-project">
                  <Button size="lg" className="gradient-brand text-white rounded-full px-8 text-sm h-11 shadow-lg shadow-[#7d33ff]/25 border-0 group">
                    {isAr ? "ابدأ مشروعك" : "Start a Project"}
                    <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                  </Button>
                </Link>
                <Link to="/enterprise">
                  <Button size="lg" variant="outline" className="rounded-full px-8 text-sm h-11 border-white/15 bg-transparent text-white/70 hover:text-white hover:border-white/30 hover:bg-white/5 backdrop-blur-sm">
                    {isAr ? "استكشف إنتربرايز" : "Explore Enterprise"}
                    <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex gap-8"
              >
                {stats.map((s, i) => (
                  <div key={i}>
                    <div className="text-xl lg:text-2xl font-bold text-white">{s.val}</div>
                    <div className="text-[11px] text-white/35 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right — Orbital System */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
              className={`relative flex items-center justify-center ${isAr ? "lg:order-1" : ""}`}
            >
              <div className="relative w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] lg:w-[480px] lg:h-[480px] mx-auto">
                <div className="absolute inset-2 rounded-full border border-white/[0.06]" />
                <div className="absolute inset-12 rounded-full border border-white/[0.04]" />
                <div className="absolute inset-24 rounded-full border border-white/[0.03]" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-32 h-32 rounded-full blur-[60px] hero-logo-pulse" style={{ background: "#7d33ff" }} />
                </div>

                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center shadow-2xl shadow-[#7d33ff]/20 p-2">
                    <img src={devwadyMark} alt="DevWady" className="w-full h-full object-contain" />
                  </div>
                </div>

                <div className="absolute inset-0 hero-orbit-spin">
                  {orbitProducts.map((p, i) => {
                    const angleRad = (p.angle * Math.PI) / 180;
                    const radius = 42;
                    const top = 50 - radius * Math.cos(angleRad);
                    const left = 50 + radius * Math.sin(angleRad);
                    return (
                      <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ top: `${top}%`, left: `${left}%` }}>
                        <div className="hero-orbit-counter-spin">
                          <div className={`${p.round ? 'rounded-2xl' : 'rounded-xl'} overflow-hidden border border-white/10 bg-[#1a1530]/90 backdrop-blur-md shadow-xl w-[64px] h-[64px] sm:w-[76px] sm:h-[76px] lg:w-[88px] lg:h-[88px] hover:scale-110 transition-transform duration-300 cursor-default flex items-center justify-center ${(p as any).fullSize ? 'p-0' : 'p-2'}`}>
                            <img src={p.img} alt={p.label} className={`w-full h-full object-cover ${p.round ? 'rounded-xl' : 'rounded-lg'}`} />
                          </div>
                          <div className="text-center mt-1">
                            <span className="text-[8px] sm:text-[9px] font-medium text-white/40">{p.label}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {[25.7, 77.1, 128.6, 180, 231.4, 282.9, 334.3].map((angle) => (
                  <div
                    key={angle}
                    className="absolute w-1 h-1 rounded-full bg-[#956efa]/30"
                    style={{
                      top: `${50 + 46 * Math.sin((angle * Math.PI) / 180)}%`,
                      left: `${50 + 46 * Math.cos((angle * Math.PI) / 180)}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-5 h-8 rounded-full border border-white/15 flex items-start justify-center p-1"
          >
            <div className="w-1 h-1 rounded-full bg-white/40" />
          </motion.div>
        </div>
      </section>

      {/* ===== BUSINESS LINES — Core Gateway Section ===== */}
      <section className="py-20 lg:py-28 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-[120px]" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card/80 backdrop-blur-sm mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground">
                {isAr ? "أربع وحدات أعمال. منصة واحدة." : "Four business lines. One platform."}
              </span>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              {isAr ? "كل ما تحتاجه لبناء وتوسع أعمالك الرقمية" : "Everything You Need to Build & Scale Digitally"}
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground max-w-2xl mx-auto">
              {isAr
                ? "من إنتاج البرمجيات والفرق المتخصصة إلى الاستشارات والتدريب — اختر المسار الذي يناسبك."
                : "From software production and specialized teams to expert consulting and training — choose the path that fits you."}
            </motion.p>
          </motion.div>

          <div className="max-w-5xl mx-auto space-y-5">
            {/* Enterprise — dominant full-width card */}
            {(() => {
              const ent = businessLines[0];
              const EntIcon = ent.icon;
              const entTags = isAr ? ent.tags_ar : ent.tags_en;
              return (
                <motion.div
                  variants={fadeUp}
                  custom={0}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="relative bg-card border border-primary/20 rounded-2xl p-8 lg:p-10 group transition-all duration-300 overflow-hidden hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10"
                >
                  <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-primary to-secondary" />
                  <div className="absolute top-0 end-0 w-72 h-72 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6 relative z-10">
                    <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl gradient-brand flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-primary/20">
                      <EntIcon className="h-8 w-8 lg:h-9 lg:w-9 text-primary-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl lg:text-2xl font-bold text-foreground">
                          {isAr ? ent.title_ar : ent.title_en}
                        </h3>
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold uppercase tracking-wider">
                          {isAr ? "الخدمة الرئيسية" : "Core Service"}
                        </Badge>
                      </div>
                      <p className="text-sm lg:text-base text-muted-foreground leading-relaxed mb-4 max-w-2xl">
                        {isAr ? ent.desc_ar : ent.desc_en}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {entTags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="bg-muted text-muted-foreground text-[11px] rounded-full px-2.5 py-0.5 border border-border/50">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Link to="/start-project">
                          <Button className="gradient-brand text-primary-foreground rounded-full px-6 h-9 text-sm font-semibold shadow-md shadow-primary/20 group/btn">
                            {isAr ? "ابدأ مشروعك" : "Start a Project"}
                            <ArrowRight className="icon-flip-rtl ms-2 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5 rtl:group-hover/btn:-translate-x-0.5" />
                          </Button>
                        </Link>
                        <Link to={ent.ctaPath}>
                          <Button variant="outline" className="rounded-full px-6 h-9 text-sm border-primary/20 text-primary hover:border-primary/40">
                            {isAr ? ent.cta_ar : ent.cta_en}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {/* Other business lines — 3 columns */}
            <div className="grid md:grid-cols-3 gap-5">
              {businessLines.slice(1).map((line, i) => {
                const LineIcon = line.icon;
                const tags = isAr ? line.tags_ar : line.tags_en;
                return (
                  <motion.div
                    key={line.id}
                    variants={fadeUp}
                    custom={i + 1}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="relative bg-card border border-border rounded-2xl p-6 group transition-all duration-300 overflow-hidden hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/8"
                  >
                    <div className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r ${line.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    <div className={`w-12 h-12 rounded-xl ${line.iconBgClass} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <LineIcon className={`h-5 w-5 ${line.iconBgClass.includes("gradient") ? "text-primary-foreground" : ""}`} style={line.iconBgClass.includes("gradient") ? {} : { color: line.accentColor }} />
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-1.5">
                      {isAr ? line.title_ar : line.title_en}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {isAr ? line.desc_ar : line.desc_en}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="bg-muted text-muted-foreground text-[10px] rounded-full px-2 py-0.5 border border-border/50">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Link
                      to={line.ctaPath}
                      className="text-sm font-semibold inline-flex items-center gap-1.5 group/cta transition-colors"
                      style={{ color: line.accentColor }}
                    >
                      {isAr ? line.cta_ar : line.cta_en}
                      <ArrowRight className="icon-flip-rtl h-3.5 w-3.5 transition-transform group-hover/cta:translate-x-1 rtl:group-hover/cta:-translate-x-1" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ===== ENTERPRISE CREDIBILITY ===== */}
      <EnterpriseCredibility />

      {/* ===== ENGAGEMENT MODELS ===== */}
      <EngagementModels />

      {/* ===== PROOF — Curated Portfolio ===== */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.span variants={fadeUp} custom={0} className="inline-block text-xs font-semibold uppercase tracking-wider text-primary mb-3">
              {isAr ? "أعمالنا" : "Proven Track Record"}
            </motion.span>
            <motion.div variants={fadeUp} custom={0.5} className="w-16 h-1 gradient-accent rounded-full mx-auto mb-5" />
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              {t("portfolio.shipped")}
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground max-w-2xl mx-auto">
              {t("portfolio.subtitle")}
            </motion.p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {products.map((p, i) => (
              <Link key={i} to={`/portfolio/${p.slug}`}>
                <motion.div
                  variants={fadeUp}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  whileHover={{ y: -8 }}
                  className={`bg-card border border-border rounded-2xl overflow-hidden group hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 h-full ${p.flagship ? "sm:col-span-2 lg:col-span-2" : ""}`}
                >
                  <div className="relative h-48 bg-muted/50 flex items-center justify-center overflow-hidden">
                    <img loading="lazy" src={p.img} alt={p.title} className={`${p.isPhoto ? "w-full h-full object-cover" : "max-h-full max-w-full object-contain p-6"} group-hover:scale-110 transition-transform duration-500`} />
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-foreground mb-1">{p.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{p.desc}</p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mt-10">
            <Link to="/portfolio">
              <Button variant="outline" size="lg" className="rounded-full border-primary/30 hover:border-primary text-primary">
                {isAr ? "عرض جميع المشاريع" : "View All Projects"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===== INDUSTRIES ===== */}
      <IndustriesSection />

      {/* ===== SUPPORTING CAPABILITIES ===== */}
      <SupportingCapabilities />

      {/* ===== FINAL CTA ===== */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div variants={fadeUp} custom={0}>
              <Rocket className="h-12 w-12 text-primary mx-auto mb-6" />
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              {isAr ? "مستعد لبناء شيء مميز؟" : "Ready to Build Something Great?"}
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground mb-8 max-w-xl mx-auto">
              {isAr
                ? "تحدث مع فريقنا لاستكشاف كيف يمكن لديف وادي مساعدتك في تحقيق أهدافك التقنية."
                : "Talk to our team to explore how DevWady can help you achieve your technology goals."}
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-wrap justify-center gap-4">
              <Link to="/start-project">
                <Button size="lg" className="gradient-brand text-primary-foreground rounded-full px-10 shadow-xl shadow-primary/30">
                  {isAr ? "ابدأ مشروعك" : "Start a Project"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="rounded-full px-10 border-primary/30 hover:border-primary text-primary">
                  {isAr ? "تواصل معنا" : "Contact Us"}
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
