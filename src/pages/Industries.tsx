import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { SectionHeader } from "@/components/SectionHeader";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Building2, ShoppingCart, Truck, GraduationCap,
  HeartPulse, Landmark, Factory, Plane, Utensils, Home,
  ShieldCheck, Zap, CheckCircle2,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

interface Industry {
  icon: typeof Building2;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  solutions: { en: string; ar: string }[];
}

const industries: Industry[] = [
  {
    icon: Truck,
    titleEn: "Transport & Logistics",
    titleAr: "النقل واللوجستيات",
    descEn: "Ride-hailing, fleet management, delivery tracking, and driver apps.",
    descAr: "تطبيقات النقل والتوصيل وإدارة الأساطيل وتتبع الشحنات.",
    solutions: [
      { en: "Ride-hailing Platforms", ar: "منصات النقل التشاركي" },
      { en: "Fleet Management", ar: "إدارة الأساطيل" },
      { en: "Last-mile Delivery", ar: "توصيل الميل الأخير" },
    ],
  },
  {
    icon: Home,
    titleEn: "Real Estate & PropTech",
    titleAr: "العقارات والتكنولوجيا العقارية",
    descEn: "Property listing platforms, CRM systems, and smart building solutions.",
    descAr: "منصات العقارات وأنظمة إدارة العملاء والحلول الذكية للمباني.",
    solutions: [
      { en: "Property Marketplaces", ar: "أسواق العقارات" },
      { en: "CRM Systems", ar: "أنظمة إدارة العلاقات" },
      { en: "Smart Building IoT", ar: "إنترنت الأشياء للمباني" },
    ],
  },
  {
    icon: Utensils,
    titleEn: "Food & Hospitality",
    titleAr: "الأغذية والضيافة",
    descEn: "POS systems, restaurant management, food delivery, and loyalty programs.",
    descAr: "أنظمة نقاط البيع وإدارة المطاعم والتوصيل وبرامج الولاء.",
    solutions: [
      { en: "POS Systems", ar: "أنظمة نقاط البيع" },
      { en: "Online Ordering", ar: "الطلب الإلكتروني" },
      { en: "Kitchen Display Systems", ar: "شاشات المطبخ" },
    ],
  },
  {
    icon: ShoppingCart,
    titleEn: "E-Commerce & Retail",
    titleAr: "التجارة الإلكترونية والتجزئة",
    descEn: "Multi-vendor marketplaces, inventory management, and omnichannel solutions.",
    descAr: "أسواق متعددة البائعين وإدارة المخزون وحلول القنوات المتعددة.",
    solutions: [
      { en: "Marketplaces", ar: "الأسواق الإلكترونية" },
      { en: "Inventory Systems", ar: "أنظمة المخزون" },
      { en: "Payment Gateways", ar: "بوابات الدفع" },
    ],
  },
  {
    icon: GraduationCap,
    titleEn: "Education & EdTech",
    titleAr: "التعليم والتكنولوجيا التعليمية",
    descEn: "LMS platforms, virtual classrooms, and student management systems.",
    descAr: "منصات التعلم والفصول الافتراضية وأنظمة إدارة الطلاب.",
    solutions: [
      { en: "LMS Platforms", ar: "منصات التعلم" },
      { en: "Virtual Classrooms", ar: "الفصول الافتراضية" },
      { en: "Assessment Tools", ar: "أدوات التقييم" },
    ],
  },
  {
    icon: HeartPulse,
    titleEn: "Healthcare & MedTech",
    titleAr: "الرعاية الصحية",
    descEn: "Telemedicine platforms, patient portals, and clinic management systems.",
    descAr: "منصات الطب عن بعد وبوابات المرضى وأنظمة إدارة العيادات.",
    solutions: [
      { en: "Telemedicine", ar: "الطب عن بعد" },
      { en: "EHR Systems", ar: "السجلات الصحية" },
      { en: "Clinic Management", ar: "إدارة العيادات" },
    ],
  },
  {
    icon: Landmark,
    titleEn: "FinTech & Banking",
    titleAr: "التكنولوجيا المالية",
    descEn: "Digital wallets, payment processing, and compliance platforms.",
    descAr: "المحافظ الرقمية ومعالجة المدفوعات ومنصات الامتثال.",
    solutions: [
      { en: "Digital Wallets", ar: "المحافظ الرقمية" },
      { en: "Payment Processing", ar: "معالجة المدفوعات" },
      { en: "KYC/AML Solutions", ar: "حلول الامتثال" },
    ],
  },
  {
    icon: Factory,
    titleEn: "Manufacturing & Industry",
    titleAr: "التصنيع والصناعة",
    descEn: "ERP systems, production tracking, and quality management platforms.",
    descAr: "أنظمة تخطيط الموارد وتتبع الإنتاج ومنصات إدارة الجودة.",
    solutions: [
      { en: "ERP Systems", ar: "أنظمة تخطيط الموارد" },
      { en: "Quality Control", ar: "مراقبة الجودة" },
      { en: "Supply Chain", ar: "سلسلة التوريد" },
    ],
  },
  {
    icon: Plane,
    titleEn: "Travel & Tourism",
    titleAr: "السفر والسياحة",
    descEn: "Booking engines, travel management, and tourism experience platforms.",
    descAr: "محركات الحجز وإدارة السفر ومنصات التجارب السياحية.",
    solutions: [
      { en: "Booking Engines", ar: "محركات الحجز" },
      { en: "Trip Planning", ar: "تخطيط الرحلات" },
      { en: "Experience Marketplaces", ar: "أسواق التجارب" },
    ],
  },
];

export default function Industries() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <>
      <SEO
        title={isAr ? "القطاعات التي نخدمها | ديف وادي" : "Industries We Serve | DevWady"}
        description={isAr ? "حلول برمجية متخصصة لمختلف القطاعات" : "Specialized software solutions across industries"}
      />

      {/* Hero */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 -right-32 w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative">
          <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            {isAr ? "القطاعات" : "Industries"}
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl lg:text-6xl font-extrabold leading-tight mb-6 max-w-3xl">
            {isAr ? "حلول لكل قطاع" : "Solutions for Every Industry"}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-xl text-muted-foreground max-w-2xl">
            {isAr
              ? "نبني منتجات رقمية متخصصة تناسب احتياجات قطاعك بخبرة حقيقية في السوق"
              : "We build specialized digital products tailored to your sector with real market expertise"}
          </motion.p>
        </div>
      </section>

      {/* Why domain expertise matters */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: ShieldCheck, titleEn: "Domain Expertise", titleAr: "خبرة قطاعية", descEn: "Deep understanding of industry regulations, workflows, and user needs.", descAr: "فهم عميق للوائح القطاع وسير العمل واحتياجات المستخدمين." },
              { icon: Zap, titleEn: "Faster Time-to-Market", titleAr: "وصول أسرع للسوق", descEn: "Pre-built modules and patterns from real-world projects accelerate delivery.", descAr: "وحدات جاهزة وأنماط من مشاريع حقيقية تُسرّع التسليم." },
              { icon: Building2, titleEn: "Scalable Architecture", titleAr: "بنية قابلة للتوسع", descEn: "Solutions designed to grow with your business from MVP to enterprise scale.", descAr: "حلول مصممة لتنمو مع عملك من النموذج الأولي إلى مستوى المؤسسات." },
            ].map((item, i) => (
              <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-card rounded-2xl p-8 border border-border">
                <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center mb-4">
                  <item.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-bold mb-2">{isAr ? item.titleAr : item.titleEn}</h3>
                <p className="text-sm text-muted-foreground">{isAr ? item.descAr : item.descEn}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Industry Grid */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <SectionHeader
            eyebrow={isAr ? "تخصصاتنا" : "OUR SPECIALIZATIONS"}
            title={isAr ? "القطاعات التي نخدمها" : "Industries We Serve"}
            subtitle={isAr ? "خبرة حقيقية في مشاريع منتجة في هذه القطاعات" : "Real experience from production projects across these sectors"}
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {industries.map((ind, i) => (
              <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} whileHover={{ y: -6 }} className="bg-card rounded-2xl border border-border p-7 group hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:gradient-brand transition-all">
                    <ind.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-bold">{isAr ? ind.titleAr : ind.titleEn}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{isAr ? ind.descAr : ind.descEn}</p>
                <ul className="space-y-1.5">
                  {ind.solutions.map((sol, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                      {isAr ? sol.ar : sol.en}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="gradient-brand rounded-3xl p-10 lg:p-16 text-center text-primary-foreground">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              {isAr ? "لا ترى قطاعك؟ تواصل معنا" : "Don't See Your Industry? Talk to Us"}
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-md mx-auto">
              {isAr ? "نبني حلول مخصصة لأي قطاع" : "We build custom solutions for any sector"}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/get-started">
                <Button size="lg" variant="secondary" className="rounded-full px-8 text-base">
                  {isAr ? "ابدأ مشروعك" : "Start Your Project"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/consulting">
                <Button size="lg" variant="outline" className="rounded-full px-8 text-base border-white/30 text-white hover:bg-white/10 hover:text-white">
                  {isAr ? "احجز استشارة" : "Book Consultation"}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
