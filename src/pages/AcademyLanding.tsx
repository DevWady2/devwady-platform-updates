import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import BusinessUnitHero from "@/components/landing/BusinessUnitHero";
import LandingTrustSection from "@/components/landing/LandingTrustSection";
import { Button } from "@/components/ui/button";
import GuestInquirySection from "@/components/landing/GuestInquirySection";
import { motion } from "framer-motion";
import {
  GraduationCap, BookOpen, Award, Video, Users2, Lightbulb,
  Laptop, Trophy, Globe, ArrowRight, CheckCircle2,
  Code2, Database, Smartphone, Shield,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.45 } }),
};

const learningPaths = [
  { icon: Code2, en: "Full-Stack Web Development", ar: "تطوير ويب شامل" },
  { icon: Smartphone, en: "Mobile App Development", ar: "تطوير تطبيقات جوال" },
  { icon: Database, en: "Backend & APIs", ar: "خلفية وواجهات برمجة" },
  { icon: Shield, en: "Cybersecurity Fundamentals", ar: "أساسيات الأمن السيبراني" },
];

export default function AcademyLanding() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const { role } = useAuth();

  const portalPath = role === "student"
    ? "/my/learning"
    : role === "instructor"
      ? "/instructor/courses"
      : "/academy/courses";

  const authCtaEn = role === "student"
    ? "Continue Learning"
    : role === "instructor"
      ? "View My Listed Courses"
      : "Browse Academy";

  const authCtaAr = role === "student"
    ? "أكمل التعلم"
    : role === "instructor"
      ? "عرض دوراتي"
      : "تصفح الأكاديمية";

  return (
    <>
      <SEO
        title={isAr ? "أكاديمية ديف وادي — تعلم البرمجة" : "DevWady Academy — Learn to Code"}
        description={isAr
          ? "تعلم ببناء منتجات حقيقية — معسكرات تدريبية عملية ومتقدمة."
          : "Learn by building real products — practical bootcamps and advanced training."}
      />
      <BusinessUnitHero
        icon={GraduationCap}
        gradient="from-[#0F6E56] to-[#1D9E75]"
        accentColor="#0F6E56"
        title_en="Learn by Building Real Products"
        title_ar="تعلّم ببناء منتجات حقيقية"
        subtitle_en="Practical bootcamps, expert-led courses, and hands-on projects that prepare you for real-world software development."
        subtitle_ar="معسكرات عملية ودورات بإشراف خبراء ومشاريع تطبيقية تجهزك لعالم تطوير البرمجيات الحقيقي."
        tagline_en="DevWady Academy"
        tagline_ar="أكاديمية ديف وادي"
        portalPath={portalPath}
        guestCtaPath="/auth/academy"
        ctaLabel_en="Explore Courses"
        ctaLabel_ar="استكشف الدورات"
        guestCtaLabel_en="Explore Courses"
        guestCtaLabel_ar="استكشف الدورات"
        authCtaLabel_en={authCtaEn}
        authCtaLabel_ar={authCtaAr}
        guestBottomCtaLabel_en="Start Learning"
        guestBottomCtaLabel_ar="ابدأ التعلم"
        authBottomCtaLabel_en={authCtaEn}
        authBottomCtaLabel_ar={authCtaAr}
        secondaryCta={{ path: "/academy/courses", label_en: "Browse Catalog", label_ar: "تصفح الكتالوج" }}
        highlights_en={["Project-Based Learning", "Industry Certificates", "Expert Instructors", "Job-Ready Skills"]}
        highlights_ar={["تعلم قائم على المشاريع", "شهادات صناعية", "مدربون خبراء", "مهارات جاهزة للعمل"]}
        features={[
          { icon: BookOpen, title_en: "Structured Curriculum", title_ar: "منهج منظم", desc_en: "Step-by-step learning paths from beginner to advanced, covering full-stack development.", desc_ar: "مسارات تعلم خطوة بخطوة من المبتدئ إلى المتقدم تغطي التطوير الشامل." },
          { icon: Video, title_en: "Live & On-Demand", title_ar: "مباشر وعند الطلب", desc_en: "Attend live sessions or learn at your own pace with recorded content.", desc_ar: "احضر جلسات مباشرة أو تعلم بسرعتك مع محتوى مسجل." },
          { icon: Lightbulb, title_en: "Hands-On Projects", title_ar: "مشاريع عملية", desc_en: "Build real applications from scratch — not toy examples, real products.", desc_ar: "ابنِ تطبيقات حقيقية من الصفر — ليست أمثلة نظرية بل منتجات حقيقية." },
          { icon: Award, title_en: "Certificates", title_ar: "شهادات", desc_en: "Earn recognized certificates that validate your skills to employers.", desc_ar: "احصل على شهادات معتمدة تثبت مهاراتك لأصحاب العمل." },
          { icon: Users2, title_en: "Community", title_ar: "مجتمع", desc_en: "Join a community of learners, mentors, and alumni for networking and support.", desc_ar: "انضم لمجتمع من المتعلمين والمرشدين والخريجين للتواصل والدعم." },
          { icon: GraduationCap, title_en: "Career Support", title_ar: "دعم مهني", desc_en: "Resume reviews, mock interviews, and job placement assistance.", desc_ar: "مراجعة السيرة الذاتية ومقابلات تجريبية ومساعدة في التوظيف." },
        ]}
      >
        {/* ── Dual Audience: Learners & Corporate ── */}
        <section className="py-20 lg:py-28">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <motion.h2 variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                {isAr ? "تعلّم بالطريقة التي تناسبك" : "Learn the Way That Suits You"}
              </motion.h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* For Freelancers & independent learners */}
              <motion.div variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="bg-card border border-border rounded-2xl p-8 hover:border-[#0F6E56]/30 transition-colors group"
              >
                <div className="w-14 h-14 rounded-xl bg-[#0F6E56]/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <GraduationCap className="h-6 w-6" style={{ color: "#0F6E56" }} />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {isAr ? "للمستقلين والمتعلمين الأفراد" : "For Freelancers & Independent Learners"}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {isAr
                    ? "سواء كنت تبدأ من الصفر أو تطوّر مهاراتك — تعلم من خلال مشاريع حقيقية واحصل على شهادات معتمدة."
                    : "Whether starting from scratch or upskilling — learn through real projects and earn recognized certificates."}
                </p>
                <ul className="space-y-2 mb-6">
                  {[
                    { en: "Self-paced & live bootcamps", ar: "معسكرات ذاتية ومباشرة" },
                    { en: "Portfolio-ready projects", ar: "مشاريع جاهزة لمعرض الأعمال" },
                    { en: "Career placement support", ar: "دعم التوظيف المهني" },
                  ].map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#0F6E56" }} />
                      {isAr ? item.ar : item.en}
                    </li>
                  ))}
                </ul>
                <Link to="/auth/academy">
                  <Button className="rounded-full bg-gradient-to-r from-[#0F6E56] to-[#1D9E75] text-white border-0 group/btn">
                    {isAr ? "ابدأ التعلم" : "Start Learning"}
                    <ArrowRight className="icon-flip-rtl ms-2 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5 rtl:group-hover/btn:-translate-x-0.5" />
                  </Button>
                </Link>
              </motion.div>

              {/* For Corporate Training */}
              <motion.div variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="bg-card border border-border rounded-2xl p-8 hover:border-[#0F6E56]/30 transition-colors group"
              >
                <div className="w-14 h-14 rounded-xl bg-[#0F6E56]/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Globe className="h-6 w-6" style={{ color: "#0F6E56" }} />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {isAr ? "للشركات وفرق العمل" : "For Companies & Teams"}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {isAr
                    ? "طوّر مهارات فريقك الهندسي ببرامج تدريب مخصصة مصممة لاحتياجات مؤسستك."
                    : "Upskill your engineering team with customized training programs designed for your organization's needs."}
                </p>
                <ul className="space-y-2 mb-6">
                  {[
                    { en: "Custom curriculum for your stack", ar: "منهج مخصص لتقنياتك" },
                    { en: "Group discounts & reporting", ar: "خصومات جماعية وتقارير" },
                    { en: "On-site or remote delivery", ar: "تدريب حضوري أو عن بُعد" },
                  ].map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#0F6E56" }} />
                      {isAr ? item.ar : item.en}
                    </li>
                  ))}
                </ul>
                <Link to="/contact">
                  <Button variant="outline" className="rounded-full border-[#0F6E56]/30 hover:border-[#0F6E56]" style={{ color: "#0F6E56" }}>
                    {isAr ? "تواصل معنا" : "Contact Us"}
                    <ArrowRight className="icon-flip-rtl ms-2 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Learning Paths ── */}
        <section className="py-16 border-t border-border/30 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-xl font-bold text-foreground mb-2">
                {isAr ? "مسارات التعلم" : "Learning Paths"}
              </h2>
            </div>
            <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
              {learningPaths.map((path, i) => {
                const PathIcon = path.icon;
                return (
                  <motion.div
                    key={i}
                    custom={i}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="flex items-center gap-2.5 px-5 py-3 rounded-xl border border-border/50 bg-card text-sm font-medium text-foreground hover:border-[#0F6E56]/30 transition-colors"
                  >
                    <PathIcon className="h-4 w-4" style={{ color: "#0F6E56" }} />
                    {isAr ? path.ar : path.en}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Guest Inquiry Section ── */}
        <GuestInquirySection
          icon={GraduationCap}
          gradient="from-[#0F6E56] to-[#1D9E75]"
          title_en="Interested in Our Courses?"
          title_ar="مهتم بدوراتنا؟"
          subtitle_en="Tell us about your learning goals and we'll help you choose the right path."
          subtitle_ar="أخبرنا عن أهداف تعلمك وسنساعدك في اختيار المسار المناسب."
          subject="Academy Interest"
          messagePlaceholder_en="What skills do you want to learn? Your current experience level..."
          messagePlaceholder_ar="ما المهارات التي تريد تعلمها؟ مستوى خبرتك الحالي..."
        />

        <LandingTrustSection
          accentGradient="from-[#0F6E56] to-[#1D9E75]"
          stats={[
            { value: "1,000+", label_en: "Students Enrolled", label_ar: "طالب مسجل" },
            { value: "50+", label_en: "Courses Available", label_ar: "دورة متاحة" },
            { value: "92%", label_en: "Completion Rate", label_ar: "نسبة إكمال" },
            { value: "85%", label_en: "Got Hired After", label_ar: "حصلوا على عمل" },
          ]}
          useCases={[
            { icon: Laptop, title_en: "Career Changers", title_ar: "تغيير المسار المهني", desc_en: "Start from zero and become a job-ready developer in months with structured bootcamps.", desc_ar: "ابدأ من الصفر وأصبح مطوراً جاهزاً للعمل في أشهر مع معسكرات منظمة." },
            { icon: Trophy, title_en: "Skill Upgraders", title_ar: "تطوير المهارات", desc_en: "Level up your existing skills with advanced courses in React, cloud, and system design.", desc_ar: "طوّر مهاراتك الحالية مع دورات متقدمة في React والسحابة وتصميم الأنظمة." },
            { icon: Globe, title_en: "Corporate Training", title_ar: "تدريب الشركات", desc_en: "Upskill your engineering team with customized group training programs.", desc_ar: "طوّر مهارات فريقك الهندسي ببرامج تدريب جماعية مخصصة." },
          ]}
          sectionTitle_en="Who Is This For?"
          sectionTitle_ar="لمن هذا؟"
          testimonials={[
            { quote_en: "I went from knowing nothing about code to landing my first developer job in 4 months.", quote_ar: "انتقلت من عدم معرفة أي شيء عن البرمجة إلى الحصول على أول وظيفة مطور في 4 أشهر.", author_en: "Omar S.", author_ar: "عمر س.", role_en: "Junior Developer", role_ar: "مطور مبتدئ" },
            { quote_en: "The hands-on approach made all the difference. Real projects, real skills.", quote_ar: "النهج العملي صنع كل الفرق. مشاريع حقيقية، مهارات حقيقية.", author_en: "Nour A.", author_ar: "نور أ.", role_en: "Full-Stack Developer", role_ar: "مطور شامل" },
          ]}
        />
      </BusinessUnitHero>
    </>
  );
}
