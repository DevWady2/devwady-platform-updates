import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import SEO from "@/components/SEO";
import { motion } from "framer-motion";

import {
  User, Building2, GraduationCap, BookOpen, Shield,
  CheckCircle2, Minus, ArrowRight, Star,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/* ─── account type card data ─── */
interface AccountTypeCardData {
  accountType: string;
  icon: LucideIcon;
  accentIcon?: LucideIcon;
  badgeColor: string;
  badgeBg: string;
  borderColor: string;
  title_en: string;
  title_ar: string;
  subtitle_en: string;
  subtitle_ar: string;
  desc_en: string;
  desc_ar: string;
  features_en: string[];
  features_ar: string[];
  howToJoin_en: string;
  howToJoin_ar: string;
  requiresApproval?: boolean;
  invitationOnly?: boolean;
  guestCta_en: string;
  guestCta_ar: string;
  guestPath: string;
  activeDashboard: string;
  onboardingPath?: string;
  selfAddable?: boolean;
  applicationPath?: string;
}

const accountTypeCards: AccountTypeCardData[] = [
  {
    accountType: "freelancer",
    icon: User,
    badgeColor: "text-green-600",
    badgeBg: "bg-green-500/15",
    borderColor: "border-green-500",
    title_en: "Freelancer",
    title_ar: "مستقل",
    subtitle_en: "Get hired, build your brand, grow your career",
    subtitle_ar: "احصل على توظيف، ابنِ علامتك التجارية، طوّر مسيرتك",
    desc_en: "Join as a freelancer to showcase your portfolio, apply to jobs from top companies, receive direct hire offers, and get rated by clients.",
    desc_ar: "انضم كمستقل لعرض معرض أعمالك، التقدم للوظائف من الشركات الكبرى، استقبال عروض توظيف مباشرة، والحصول على تقييمات من العملاء.",
    features_en: [
      "Create a professional portfolio",
      "Apply to job postings from companies",
      "Receive direct hire offers",
      "Get reviewed and rated by clients",
      "Book expert consulting sessions",
      "Track your earnings and invoices",
    ],
    features_ar: [
      "أنشئ معرض أعمال احترافي",
      "قدم على وظائف من الشركات",
      "استقبل عروض توظيف مباشرة",
      "احصل على تقييمات من العملاء",
      "احجز جلسات استشارية مع الخبراء",
      "تابع أرباحك وفواتيرك",
    ],
    howToJoin_en: "Sign up in 2 minutes — free forever",
    howToJoin_ar: "سجل في دقيقتين — مجاني للأبد",
    guestCta_en: "Join as Freelancer",
    guestCta_ar: "انضم كمستقل",
    guestPath: "/auth/talent",
    activeDashboard: "/profile",
    onboardingPath: "/onboarding/freelancer",
    selfAddable: true,
  },
  {
    accountType: "company",
    icon: Building2,
    badgeColor: "text-blue-600",
    badgeBg: "bg-blue-500/15",
    borderColor: "border-blue-500",
    title_en: "Company",
    title_ar: "شركة",
    subtitle_en: "Hire talent, build products, scale your team",
    subtitle_ar: "وظّف المواهب، ابنِ المنتجات، وسّع فريقك",
    desc_en: "Join as a company to post jobs, hire freelancers, request software development services, manage your team, and track projects.",
    desc_ar: "انضم كشركة لنشر الوظائف، توظيف المستقلين، طلب خدمات تطوير البرمجيات، إدارة فريقك، ومتابعة المشاريع.",
    features_en: [
      "Post job openings and attract talent",
      "Browse and hire verified freelancers",
      "Request development services & get quotes",
      "Track project progress with live updates",
      "Manage your company team members",
      "Build your company public profile",
    ],
    features_ar: [
      "انشر وظائف واجذب المواهب",
      "تصفح ووظّف مستقلين موثقين",
      "اطلب خدمات تطوير واحصل على عروض أسعار",
      "تابع تقدم المشاريع بتحديثات مباشرة",
      "أدر أعضاء فريق شركتك",
      "ابنِ صفحة شركتك العامة",
    ],
    howToJoin_en: "Sign up → Admin reviews within 48h → Full access",
    howToJoin_ar: "سجل ← مراجعة الإدارة خلال 48 ساعة ← وصول كامل",
    requiresApproval: true,
    guestCta_en: "Join as Company",
    guestCta_ar: "انضم كشركة",
    guestPath: "/auth/enterprise",
    activeDashboard: "/enterprise/portal",
    onboardingPath: "/onboarding/company",
    selfAddable: false,
  },
  {
    accountType: "student",
    icon: GraduationCap,
    badgeColor: "text-teal-600",
    badgeBg: "bg-teal-500/15",
    borderColor: "border-teal-500",
    title_en: "Student",
    title_ar: "طالب",
    subtitle_en: "Learn from experts, earn certificates, advance your skills",
    subtitle_ar: "تعلم من الخبراء، احصل على شهادات، طوّر مهاراتك",
    desc_en: "Join as a student to access recorded and live courses, track your learning progress, earn completion certificates, and connect with instructors.",
    desc_ar: "انضم كطالب للوصول إلى الدورات المسجلة والحية، متابعة تقدمك التعليمي، الحصول على شهادات إتمام، والتواصل مع المدربين.",
    features_en: [
      "Access recorded & live courses",
      "Track learning progress per lesson",
      "Earn completion certificates",
      "Rate and review courses",
      "Learn at your own pace",
    ],
    features_ar: [
      "ادخل على دورات مسجلة وحية",
      "تابع تقدمك درس بدرس",
      "احصل على شهادات إتمام",
      "قيّم وراجع الدورات",
      "تعلم بالوتيرة التي تناسبك",
    ],
    howToJoin_en: "Sign up — instant access to free courses",
    howToJoin_ar: "سجل — وصول فوري للدورات المجانية",
    guestCta_en: "Join as Student",
    guestCta_ar: "انضم كطالب",
    guestPath: "/auth/academy",
    activeDashboard: "/academy/portal",
    onboardingPath: "/onboarding/student",
    selfAddable: true,
  },
  {
    accountType: "instructor",
    icon: BookOpen,
    accentIcon: Star,
    badgeColor: "text-amber-600",
    badgeBg: "bg-amber-500/15",
    borderColor: "border-amber-500",
    title_en: "Instructor",
    title_ar: "مدرب",
    subtitle_en: "Teach what you know, earn from your expertise",
    subtitle_ar: "علّم ما تعرفه، واكسب من خبرتك",
    desc_en: "Apply to become an instructor, create courses, reach thousands of students, and earn up to 70% revenue on every sale.",
    desc_ar: "قدم لتصبح مدرباً، أنشئ دورات، تواصل مع آلاف الطلاب، واكسب حتى 70% من إيرادات كل عملية بيع.",
    features_en: [
      "Create and publish courses",
      "Earn 70% revenue share on sales",
      "Access instructor dashboard & analytics",
      "Manage students and track progress",
      "DevWady handles hosting & payments",
    ],
    features_ar: [
      "أنشئ وانشر دورات تدريبية",
      "اكسب 70% من إيرادات المبيعات",
      "ادخل على لوحة تحكم المدرب والتحليلات",
      "أدر الطلاب وتابع تقدمهم",
      "ديف وادي يتولى الاستضافة والمدفوعات",
    ],
    howToJoin_en: "Apply → Admin reviews → Start creating courses",
    howToJoin_ar: "قدم ← مراجعة الإدارة ← ابدأ إنشاء الدورات",
    requiresApproval: true,
    guestCta_en: "Apply as Instructor",
    guestCta_ar: "قدم كمدرب",
    guestPath: "/auth/academy",
    activeDashboard: "/instructor/workspace",
    applicationPath: "/become-instructor",
    selfAddable: false,
  },
  {
    accountType: "expert",
    icon: Shield,
    accentIcon: Star,
    badgeColor: "text-purple-600",
    badgeBg: "bg-purple-500/15",
    borderColor: "border-purple-500",
    title_en: "Consulting Expert",
    title_ar: "خبير استشاري",
    subtitle_en: "Share your expertise through paid consulting sessions",
    subtitle_ar: "شارك خبرتك من خلال جلسات استشارية مدفوعة",
    desc_en: "Become a consulting expert on DevWady. Get booked by clients for paid sessions, manage your own schedule, and track your earnings.",
    desc_ar: "كن خبيراً استشارياً على ديف وادي. احصل على حجوزات من العملاء لجلسات مدفوعة، أدر جدولك الخاص، وتابع أرباحك.",
    features_en: [
      "Get booked for paid consulting sessions",
      "Set your own availability & rates",
      "Expert dashboard with earnings analytics",
      "Public expert profile page",
      "Manage bookings and meeting links",
    ],
    features_ar: [
      "احصل على حجوزات لجلسات مدفوعة",
      "حدد مواعيدك وأسعارك",
      "لوحة تحكم الخبير مع تحليلات الأرباح",
      "صفحة ملف خبير عامة",
      "أدر الحجوزات وروابط الاجتماعات",
    ],
    howToJoin_en: "By invitation only — Contact us if you're interested",
    howToJoin_ar: "بالدعوة فقط — تواصل معنا إذا كنت مهتماً",
    invitationOnly: true,
    guestCta_en: "Contact Us to Apply",
    guestCta_ar: "تواصل معنا للتقديم",
    guestPath: "/contact?subject=Expert+Application",
    activeDashboard: "/consulting/portal",
    selfAddable: false,
  },
];

/* ─── comparison table ─── */
const comparisonRows: { label_en: string; label_ar: string; values: boolean[] }[] = [
  { label_en: "Browse courses", label_ar: "تصفح الدورات", values: [true, true, true, true, true] },
  { label_en: "Enroll in courses", label_ar: "التسجيل بالدورات", values: [true, true, true, true, true] },
  { label_en: "Apply to jobs", label_ar: "التقدم للوظائف", values: [true, false, false, true, false] },
  { label_en: "Post jobs", label_ar: "نشر الوظائف", values: [false, true, false, false, false] },
  { label_en: "Receive hire offers", label_ar: "استقبال عروض التوظيف", values: [true, false, false, false, false] },
  { label_en: "Build portfolio", label_ar: "بناء معرض أعمال", values: [true, false, false, false, false] },
  { label_en: "Request services", label_ar: "طلب خدمات", values: [true, true, true, true, true] },
  { label_en: "Create courses", label_ar: "إنشاء دورات", values: [false, false, false, true, false] },
  { label_en: "Give consultations", label_ar: "تقديم استشارات", values: [false, false, false, false, true] },
  { label_en: "Book consultations", label_ar: "حجز استشارات", values: [true, true, true, true, false] },
  { label_en: "Track project progress", label_ar: "تتبع تقدم المشاريع", values: [true, true, false, false, false] },
  { label_en: "Manage team", label_ar: "إدارة الفريق", values: [false, true, false, false, false] },
  { label_en: "Earn from platform", label_ar: "الربح من المنصة", values: [true, false, false, true, true] },
];


const accountTypeLabels: Record<string, { en: string; ar: string }> = {
  freelancer: { en: "Freelancer", ar: "مستقل" },
  company: { en: "Company", ar: "شركة" },
  student: { en: "Student", ar: "طالب" },
  instructor: { en: "Instructor", ar: "مدرب" },
  expert: { en: "Expert", ar: "خبير" },
  admin: { en: "Admin", ar: "مشرف" },
};

const columnHeaders = [
  { en: "Freelancer", ar: "مستقل" },
  { en: "Company", ar: "شركة" },
  { en: "Student", ar: "طالب" },
  { en: "Instructor", ar: "مدرب" },
  { en: "Expert", ar: "خبير" },
];

/* ─── FAQ ─── */
const faqs = [
  {
    q_en: "Can I change my account type?",
    q_ar: "هل يمكنني تغيير نوع حسابي؟",
    a_en: "Your account operates with a single account type. Contact support if you need to change it.",
    a_ar: "حسابك يعمل بنوع حساب واحد. تواصل مع الدعم إذا كنت تحتاج لتغييره.",
  },
  {
    q_en: "Is it free to join?",
    q_ar: "هل الانضمام مجاني؟",
    a_en: "Creating an account is free for all account types. Some features (courses, consulting) have their own pricing.",
    a_ar: "إنشاء حساب مجاني لجميع أنواع الحسابات. بعض الميزات (الدورات، الاستشارات) لها أسعارها الخاصة.",
  },
  {
    q_en: "How long does company approval take?",
    q_ar: "كم تستغرق موافقة الشركة؟",
    a_en: "24-48 hours. Our team reviews each company account manually.",
    a_ar: "24-48 ساعة. فريقنا يراجع كل حساب شركة يدوياً.",
  },
  {
    q_en: "How do I become an expert or instructor?",
    q_ar: "كيف أصبح خبيراً أو مدرباً؟",
    a_en: "Instructors apply through our application form. Experts are invited by the DevWady team.",
    a_ar: "المدربون يقدمون طلباً عبر نموذج التقديم. الخبراء تتم دعوتهم من فريق ديف وادي.",
  },
];

/* ─── Component ─── */
export default function Join() {
  const { lang } = useLanguage();
  const { user, accountType } = useAuth();
  const navigate = useNavigate();
  const isAr = lang === "ar";


  const profileName = user?.user_metadata?.full_name || user?.email?.split("@")[0];
  const currentAccountTypeLabel = accountType
    ? (isAr ? accountTypeLabels[accountType]?.ar : accountTypeLabels[accountType]?.en) ?? accountType
    : null;

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
    }),
  };

  return (
    <>
      <SEO
        title={isAr ? "انضم إلى ديف وادي — اختر نوع حسابك" : "Join DevWady — Choose Your Account Type"}
        description={isAr
          ? "اكتشف أنواع الحسابات المتاحة على منصة ديف وادي واختر ما يناسب أهدافك"
          : "Discover the available account types on DevWady and choose the one that fits your goals"}
      />

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden py-16 lg:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(264,100%,60%)] via-[hsl(264,88%,70%)] to-transparent opacity-[0.08] dark:opacity-[0.15]" />
        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="text-4xl lg:text-5xl font-bold text-foreground mb-4"
          >
            {isAr ? "اكتشف ديف وادي" : "Discover DevWady"}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            {isAr
              ? "منصة واحدة، إمكانيات متعددة. اختر نوع الحساب الذي يناسب أهدافك."
              : "One platform, many possibilities. Choose the account type that fits your goals."}
          </motion.p>

          {user && accountType && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="mt-6 space-y-2"
            >
              <p className="text-muted-foreground">
                {isAr ? `مرحباً مجدداً، ${profileName}! أنت حالياً ` : `Welcome back, ${profileName}! You're currently a `}
                <Badge variant="secondary" className="mx-1">{currentAccountTypeLabel}</Badge>
              </p>
              <p className="text-sm text-muted-foreground">
                {isAr ? "تعرف على ما يمكن أن تقدمه لك ديف وادي." : "Learn about what DevWady has to offer."}
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* ─── Account Type Cards ─── */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {accountTypeCards.map((card, i) => {
            const isCurrentAccountType = accountType === card.accountType;
            const Icon = card.icon;
            return (
              <motion.div
                key={card.accountType}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={cardVariants}
                className={cn(
                  i >= 3 && "md:col-span-1",
                  i === 3 && accountTypeCards.length === 5 && "lg:col-start-1 lg:col-end-2 lg:justify-self-end lg:max-w-[calc(100%-1.5rem)]",
                  i === 4 && "lg:col-start-2 lg:col-end-3 lg:justify-self-start lg:max-w-[calc(100%-1.5rem)]",
                )}
              >
                <Card className={cn(
                  "h-full flex flex-col border-2 transition-all hover:shadow-lg",
                  isCurrentAccountType ? `${card.borderColor} border-s-4` : "border-border hover:border-muted-foreground/30",
                )}>
                  <CardContent className="p-6 flex flex-col flex-1 gap-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2.5 rounded-xl", card.badgeBg)}>
                          <Icon className={cn("h-5 w-5", card.badgeColor)} />
                          {card.accentIcon && (
                            <card.accentIcon className={cn("h-3 w-3 absolute -top-1 -end-1", card.badgeColor)} />
                          )}
                        </div>
                        <Badge variant="secondary" className={cn("text-xs", card.badgeBg, card.badgeColor)}>
                          {isAr ? card.title_ar : card.title_en}
                        </Badge>
                      </div>
                      {isCurrentAccountType && (
                        <Badge className="bg-green-500/15 text-green-600 border-0 text-xs">
                          ✓ {isAr ? "مفعّل" : "Active"}
                        </Badge>
                      )}
                    </div>

                    {/* Title + Subtitle */}
                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        {isAr ? card.title_ar : card.title_en}
                      </h3>
                      <p className="text-[13px] text-muted-foreground mt-0.5">
                        {isAr ? card.subtitle_ar : card.subtitle_en}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {isAr ? card.desc_ar : card.desc_en}
                    </p>

                    {/* Features */}
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        {isAr ? "ما ستحصل عليه" : "What you get"}
                      </p>
                      <ul className="space-y-1.5">
                        {(isAr ? card.features_ar : card.features_en).map((f, fi) => (
                          <li key={fi} className="flex items-start gap-2 text-sm text-foreground">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* How to join */}
                    <div className="border-t pt-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        {isAr ? "كيفية الانضمام" : "How to join"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isAr ? card.howToJoin_ar : card.howToJoin_en}
                      </p>
                      {card.requiresApproval && (
                        <Badge variant="outline" className="mt-1.5 text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
                          {isAr ? "يتطلب موافقة" : "Requires approval"}
                        </Badge>
                      )}
                      {card.invitationOnly && (
                        <Badge variant="outline" className="mt-1.5 text-xs bg-purple-500/10 text-purple-600 border-purple-500/30">
                          {isAr ? "بالدعوة فقط" : "Invitation only"}
                        </Badge>
                      )}
                    </div>

                    {/* CTA */}
                    <div className="pt-2">
                      {!user ? (
                        /* Guest */
                        <Button className="w-full group" onClick={() => navigate(card.guestPath)}>
                          {isAr ? card.guestCta_ar : card.guestCta_en}
                          <ArrowRight className="icon-flip-rtl h-4 w-4 ms-1 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                        </Button>
                      ) : isCurrentAccountType ? (
                        /* Already has this account type */
                        <Button variant="outline" className="w-full border-green-500/40 text-green-600" onClick={() => navigate(card.activeDashboard)}>
                          {isAr ? "الذهاب للوحة التحكم" : "Go to Dashboard"} →
                        </Button>
                      ) : (
                        /* Different account type — read-only in single-account model */
                        <Button variant="outline" className="w-full" disabled>
                          {isAr ? "غير متاح — حساب بنوع واحد" : "Not available — single account type"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─── Comparison Table ─── */}
      <section className="container mx-auto px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto"
        >
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">
            {isAr ? "مقارنة أنواع الحسابات" : "Compare Account Types"}
          </h2>
          <div className="overflow-x-auto border rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-start p-3 font-semibold text-foreground min-w-[160px]">
                    {isAr ? "الميزة" : "Feature"}
                  </th>
                  {columnHeaders.map((h, hi) => (
                    <th key={hi} className="p-3 text-center font-semibold text-foreground min-w-[90px]">
                      {isAr ? h.ar : h.en}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, ri) => (
                  <tr key={ri} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3 text-foreground font-medium">
                      {isAr ? row.label_ar : row.label_en}
                    </td>
                    {row.values.map((v, vi) => (
                      <td key={vi} className="p-3 text-center">
                        {v ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <Minus className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="container mx-auto px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">
            {isAr ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
          </h2>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-4">
                <AccordionTrigger className="text-start font-medium text-foreground">
                  {isAr ? faq.q_ar : faq.q_en}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {isAr ? faq.a_ar : faq.a_en}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </section>

    </>
  );
}
