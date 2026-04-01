import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Rocket, Users, Lightbulb, ArrowRight,
  Smartphone, Globe, Server, Palette, Code2,
  UserPlus, TestTube, HardDrive, UsersRound,
  Video, MessageCircle, CalendarCheck,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.12, duration: 0.5 } }),
};

interface PathCard {
  icon: typeof Rocket;
  title: string;
  desc: string;
  cta: string;
  href: string;
  ctaVariant: "default" | "outline";
  badges: { label: string }[];
  items: { icon: typeof Smartphone; label: string }[];
  accent: string;
  accentBg: string;
}

export default function GetStarted() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const isAr = lang === "ar";

  const cards: PathCard[] = [
    {
      icon: Rocket,
      title: isAr ? "ابنِ منتجاً" : "Build a Product",
      desc: isAr
        ? "نصمم ونبني تطبيقات الجوال والمواقع والأنظمة المؤسسية والبرمجيات المخصصة من الفكرة إلى الإطلاق."
        : "We design and build mobile apps, websites, enterprise systems, and custom software from concept to launch.",
      cta: isAr ? "ابدأ مشروعك" : "Start Your Project",
      href: "/start-project",
      ctaVariant: "default",
      badges: [
        { label: isAr ? "سعر ثابت" : "Fixed Price" },
        { label: isAr ? "تتبع المراحل" : "Milestone Tracking" },
      ],
      items: [
        { icon: Smartphone, label: isAr ? "تطبيقات الجوال" : "Mobile Apps" },
        { icon: Globe, label: isAr ? "المواقع الإلكترونية" : "Websites" },
        { icon: Server, label: isAr ? "الأنظمة المؤسسية" : "Enterprise Systems" },
        { icon: Palette, label: isAr ? "تصميم UI/UX" : "UI/UX Design" },
        { icon: Code2, label: isAr ? "برمجيات مخصصة" : "Custom Software" },
      ],
      accent: "text-purple-600 dark:text-purple-400",
      accentBg: "bg-purple-500/10 border-purple-500/20",
    },
    {
      icon: Users,
      title: isAr ? "استأجر خدمة" : "Hire a Service",
      desc: isAr
        ? "وسّع فريقك بمطورين مخصصين ومهندسي جودة وإدارة بنية تحتية وخدمات تقنية مستمرة."
        : "Scale your team with dedicated developers, QA engineers, IT infrastructure management, and ongoing technical services.",
      cta: isAr ? "استكشف الخدمات" : "Explore Services",
      href: "/request-service",
      ctaVariant: "outline",
      badges: [
        { label: isAr ? "فوترة شهرية" : "Monthly Billing" },
        { label: isAr ? "عقد مرن" : "Flexible Engagement" },
      ],
      items: [
        { icon: UserPlus, label: isAr ? "تعزيز الفريق" : "Team Augmentation" },
        { icon: TestTube, label: isAr ? "الجودة والاختبار" : "QA & Testing" },
        { icon: HardDrive, label: isAr ? "البنية التحتية" : "IT Infrastructure" },
        { icon: UsersRound, label: isAr ? "فرق مخصصة" : "Dedicated Squads" },
      ],
      accent: "text-teal-600 dark:text-teal-400",
      accentBg: "bg-teal-500/10 border-teal-500/20",
    },
    {
      icon: Lightbulb,
      title: isAr ? "احجز استشارة" : "Book a Consultation",
      desc: isAr
        ? "احصل على نصائح الخبراء في استراتيجية المنتج والهندسة المعمارية وتجربة المستخدم و DevOps والمزيد."
        : "Get expert advice from our specialized consultants on product strategy, architecture, UX, DevOps, and more.",
      cta: isAr ? "تصفح الخبراء" : "Browse Experts",
      href: "/consulting",
      ctaVariant: "outline",
      badges: [
        { label: isAr ? "لكل جلسة" : "Per Session" },
        { label: isAr ? "احجز فوراً" : "Book Instantly" },
      ],
      items: [
        { icon: Video, label: isAr ? "جلسات فردية" : "1:1 Expert Sessions" },
        { icon: MessageCircle, label: isAr ? "حسب التخصص" : "Track-based Experts" },
        { icon: CalendarCheck, label: isAr ? "فيديو أو حضوري" : "Video or In-person" },
      ],
      accent: "text-amber-600 dark:text-amber-400",
      accentBg: "bg-amber-500/10 border-amber-500/20",
    },
  ];

  return (
    <>
      <SEO
        title={isAr ? "ابدأ مع DevWady" : "Get Started with DevWady"}
        description={isAr ? "أخبرنا بما تحتاجه — سنتولى الباقي" : "Tell us what you need — we'll take it from here"}
      />

      {/* Hero */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl lg:text-5xl font-bold mb-4"
          >
            {isAr ? "ابدأ مع DevWady" : "Get Started with DevWady"}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            {isAr ? "أخبرنا بما تحتاجه — سنتولى الباقي" : "Tell us what you need — we'll take it from here"}
          </motion.p>
          {user && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-primary mt-3"
            >
              {isAr ? "مرحباً بعودتك! اختر المسار المناسب أدناه." : "Welcome back! Choose the right path below."}
            </motion.p>
          )}
        </div>
      </section>

      {/* Cards */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {cards.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={i}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="brand-card-interactive p-6 lg:p-8 flex flex-col"
                >
                  {/* Icon + Badges */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${card.accentBg}`}>
                      <Icon className={`h-6 w-6 ${card.accent}`} />
                    </div>
                    <div className="flex gap-1.5">
                      {card.badges.map((b, j) => (
                        <Badge key={j} variant="secondary" className="text-[10px] font-medium">
                          {b.label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Title + Desc */}
                  <h2 className="text-xl font-bold mb-2">{card.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    {card.desc}
                  </p>

                  {/* Sub-items */}
                  <ul className="space-y-2 mb-6 flex-1">
                    {card.items.map((item, j) => {
                      const ItemIcon = item.icon;
                      return (
                        <li key={j} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                          <ItemIcon className={`h-4 w-4 shrink-0 ${card.accent}`} />
                          {item.label}
                        </li>
                      );
                    })}
                  </ul>

                  {/* CTA */}
                  <Link to={card.href}>
                    <Button
                      variant={card.ctaVariant}
                      className={`rounded-full w-full group ${card.ctaVariant === "default" ? "gradient-brand text-primary-foreground" : ""}`}
                    >
                      {card.cta}
                      <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                    </Button>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="pb-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-muted/50 rounded-2xl border border-border p-8"
          >
            <p className="text-muted-foreground mb-4">
              {isAr ? "لست متأكداً أي مسار يناسب احتياجاتك؟" : "Not sure which path fits your needs?"}
            </p>
            <Link to="/contact">
              <Button variant="outline" className="rounded-full px-8 group">
                {isAr ? "تواصل معنا للحصول على استشارة مجانية" : "Contact us for a free consultation"}
                <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
