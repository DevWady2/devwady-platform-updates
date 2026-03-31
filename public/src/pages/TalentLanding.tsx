import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import BusinessUnitHero from "@/components/landing/BusinessUnitHero";
import LandingTrustSection from "@/components/landing/LandingTrustSection";
import { Button } from "@/components/ui/button";
import GuestInquirySection from "@/components/landing/GuestInquirySection";
import { motion } from "framer-motion";
import {
  Users, Search, Briefcase, Star, UserCheck, Clock,
  Target, Handshake, TrendingUp, ArrowRight,
  Building2, Code2, Palette, Server, Smartphone, Shield,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.45 } }),
};

const talentCategories = [
  { icon: Code2, en: "Frontend Engineers", ar: "مهندسو واجهات" },
  { icon: Server, en: "Backend Engineers", ar: "مهندسو خلفية" },
  { icon: Smartphone, en: "Mobile Developers", ar: "مطورو جوال" },
  { icon: Palette, en: "UI/UX Designers", ar: "مصممو واجهات" },
  { icon: Shield, en: "DevOps & Security", ar: "DevOps وأمان" },
  { icon: Briefcase, en: "Project Managers", ar: "مدراء مشاريع" },
];

export default function TalentLanding() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <>
      <SEO
        title={isAr ? "ديف وادي تالنت — توظيف المواهب" : "DevWady Talent — Hire Top Talent"}
        description={isAr
          ? "وسّع فريقك الهندسي بمطورين معتمدين — عقود شهرية مرنة."
          : "Scale your engineering team with vetted developers — flexible monthly engagements."}
      />
      <BusinessUnitHero
        icon={Users}
        gradient="from-[#185FA5] to-[#378ADD]"
        accentColor="#185FA5"
        title_en="Hire Vetted Tech Talent"
        title_ar="وظّف مواهب تقنية معتمدة"
        subtitle_en="Access a curated pool of pre-screened developers, designers, and engineers. Scale your team in days, not months."
        subtitle_ar="احصل على مجموعة منتقاة من المطورين والمصممين والمهندسين المعتمدين. وسّع فريقك في أيام وليس أشهر."
        tagline_en="DevWady Talent"
        tagline_ar="ديف وادي تالنت"
        portalPath="/talent/portal"
        guestCtaPath="/auth/talent"
        ctaLabel_en="Browse Talent"
        ctaLabel_ar="تصفح المواهب"
        guestCtaLabel_en="Browse Talent"
        guestCtaLabel_ar="تصفح المواهب"
        authCtaLabel_en="Go to Talent Workspace"
        authCtaLabel_ar="انتقل لمساحة تالنت"
        guestBottomCtaLabel_en="Get Started with Talent"
        guestBottomCtaLabel_ar="ابدأ مع تالنت"
        authBottomCtaLabel_en="Open Workspace"
        authBottomCtaLabel_ar="افتح مساحة العمل"
        secondaryCta={{ path: "/hiring", label_en: "View Open Positions", label_ar: "الوظائف المتاحة" }}
        highlights_en={["Pre-Screened Talent", "Flexible Contracts", "Fast Matching", "Zero Risk Trial"]}
        highlights_ar={["مواهب معتمدة", "عقود مرنة", "مطابقة سريعة", "تجربة بدون مخاطر"]}
        features={[
          { icon: Search, title_en: "Smart Matching", title_ar: "مطابقة ذكية", desc_en: "AI-powered matching connects you with the right talent based on skills, experience, and availability.", desc_ar: "مطابقة ذكية بالذكاء الاصطناعي تربطك بالمواهب المناسبة حسب المهارات والخبرة والتوفر." },
          { icon: UserCheck, title_en: "Vetted Profiles", title_ar: "ملفات معتمدة", desc_en: "Every candidate goes through technical assessment and background verification.", desc_ar: "كل مرشح يمر بتقييم تقني وفحص خلفية." },
          { icon: Briefcase, title_en: "Flexible Hiring", title_ar: "توظيف مرن", desc_en: "Full-time, part-time, contract, or project-based — hire on your terms.", desc_ar: "دوام كامل أو جزئي أو عقد أو مشروع — وظّف بشروطك." },
          { icon: Star, title_en: "Quality Guarantee", title_ar: "ضمان الجودة", desc_en: "Not satisfied? Replace any hire within the first 2 weeks at no extra cost.", desc_ar: "غير راضٍ؟ استبدل أي توظيف خلال أول أسبوعين بدون تكلفة إضافية." },
          { icon: Clock, title_en: "48-Hour Delivery", title_ar: "تسليم خلال 48 ساعة", desc_en: "Get shortlisted candidates within 48 hours of posting your requirement.", desc_ar: "احصل على مرشحين مختارين خلال 48 ساعة من نشر متطلبك." },
          { icon: Users, title_en: "Team Augmentation", title_ar: "تعزيز الفرق", desc_en: "Scale entire teams up or down based on project needs and timelines.", desc_ar: "وسّع أو قلّص فرق كاملة حسب احتياجات المشروع والجداول الزمنية." },
        ]}
      >
        {/* ── Dual Audience Section ── */}
        <section className="py-20 lg:py-28">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <motion.h2 variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                {isAr ? "منصة واحدة. جمهوران." : "One Platform. Two Audiences."}
              </motion.h2>
              <motion.p variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-muted-foreground max-w-lg mx-auto">
                {isAr ? "سواء كنت تبحث عن مواهب أو تبحث عن فرص — ديف وادي تالنت يربطك بالمناسب." : "Whether you're looking to hire or looking for your next opportunity — DevWady Talent connects you."}
              </motion.p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* For Companies */}
              <motion.div variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="bg-card border border-border rounded-2xl p-8 hover:border-[#185FA5]/30 transition-colors group"
              >
                <div className="w-14 h-14 rounded-xl bg-[#185FA5]/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Building2 className="h-6 w-6" style={{ color: "#185FA5" }} />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {isAr ? "للشركات التي تحتاج مواهب" : "For Companies Hiring Talent"}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {isAr
                    ? "انشر وظائف، تصفح ملفات معتمدة، وأدر خط التوظيف الخاص بك. وفّر الوقت مع مرشحين تم فحصهم مسبقاً."
                    : "Post jobs, browse vetted profiles, and manage your hiring pipeline. Save time with pre-screened candidates."}
                </p>
                <ul className="space-y-2 mb-6">
                  {[
                    { en: "Post unlimited job listings", ar: "انشر وظائف بلا حدود" },
                    { en: "Access pre-vetted talent pool", ar: "وصول لمجموعة مواهب معتمدة" },
                    { en: "Manage hiring from one dashboard", ar: "أدر التوظيف من لوحة واحدة" },
                  ].map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-foreground">
                      <Star className="h-3.5 w-3.5 text-[#185FA5] flex-shrink-0" />
                      {isAr ? item.ar : item.en}
                    </li>
                  ))}
                </ul>
                <Link to="/auth/talent">
                  <Button className="rounded-full bg-gradient-to-r from-[#185FA5] to-[#378ADD] text-white border-0 group/btn">
                    {isAr ? "ابدأ التوظيف" : "Start Hiring"}
                    <ArrowRight className="icon-flip-rtl ms-2 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5 rtl:group-hover/btn:-translate-x-0.5" />
                  </Button>
                </Link>
              </motion.div>

              {/* For Talent */}
              <motion.div variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="bg-card border border-border rounded-2xl p-8 hover:border-[#185FA5]/30 transition-colors group"
              >
                <div className="w-14 h-14 rounded-xl bg-[#185FA5]/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <UserCheck className="h-6 w-6" style={{ color: "#185FA5" }} />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {isAr ? "للمواهب الباحثة عن فرص" : "For Talent Seeking Opportunities"}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {isAr
                    ? "ابنِ ملفك المهني، تقدم لفرص من شركات رائدة، واحصل على مطابقة ذكية تناسب مهاراتك."
                    : "Build your professional profile, apply to opportunities from top companies, and get smart-matched to roles that fit."}
                </p>
                <ul className="space-y-2 mb-6">
                  {[
                    { en: "Get matched with top companies", ar: "احصل على مطابقة مع أفضل الشركات" },
                    { en: "Showcase your portfolio & skills", ar: "اعرض معرض أعمالك ومهاراتك" },
                    { en: "Flexible: full-time, contract, or freelance", ar: "مرن: دوام كامل أو عقد أو مستقل" },
                  ].map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-foreground">
                      <Star className="h-3.5 w-3.5 text-[#185FA5] flex-shrink-0" />
                      {isAr ? item.ar : item.en}
                    </li>
                  ))}
                </ul>
                <Link to="/auth/talent">
                  <Button variant="outline" className="rounded-full border-[#185FA5]/30 hover:border-[#185FA5] group/btn" style={{ color: "#185FA5" }}>
                    {isAr ? "انضم كمستقل" : "Join as Talent"}
                    <ArrowRight className="icon-flip-rtl ms-2 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5 rtl:group-hover/btn:-translate-x-0.5" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Talent Categories ── */}
        <section className="py-16 border-t border-border/30 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-xl font-bold text-foreground mb-2">
                {isAr ? "التخصصات المتاحة" : "Available Specializations"}
              </h2>
            </div>
            <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
              {talentCategories.map((cat, i) => {
                const CatIcon = cat.icon;
                return (
                  <motion.div
                    key={i}
                    custom={i}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="flex items-center gap-2.5 px-5 py-3 rounded-xl border border-border/50 bg-card text-sm font-medium text-foreground hover:border-[#185FA5]/30 transition-colors"
                  >
                    <CatIcon className="h-4 w-4" style={{ color: "#185FA5" }} />
                    {isAr ? cat.ar : cat.en}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Guest Inquiry Section ── */}
        <GuestInquirySection
          icon={Users}
          gradient="from-[#185FA5] to-[#378ADD]"
          title_en="Need Help Hiring?"
          title_ar="تحتاج مساعدة في التوظيف؟"
          subtitle_en="Tell us about the roles you need to fill and we'll match you with the right talent."
          subtitle_ar="أخبرنا عن الأدوار التي تحتاج لشغلها وسنطابقك مع المواهب المناسبة."
          subject="Talent Hiring Inquiry"
          messagePlaceholder_en="What roles are you looking to fill? Skills, timeline, team size..."
          messagePlaceholder_ar="ما الأدوار التي تريد شغلها؟ المهارات، الجدول، حجم الفريق..."
        />

        <LandingTrustSection
          accentGradient="from-[#185FA5] to-[#378ADD]"
          stats={[
            { value: "200+", label_en: "Vetted Developers", label_ar: "مطور معتمد" },
            { value: "48h", label_en: "Average Match Time", label_ar: "متوسط وقت المطابقة" },
            { value: "95%", label_en: "Hire Success Rate", label_ar: "نسبة نجاح التوظيف" },
            { value: "30+", label_en: "Tech Stacks Covered", label_ar: "حزمة تقنية مغطاة" },
          ]}
          useCases={[
            { icon: Target, title_en: "Staff Augmentation", title_ar: "تعزيز الفريق", desc_en: "Embed pre-vetted engineers directly into your existing team with zero onboarding friction.", desc_ar: "ادمج مهندسين معتمدين مباشرة في فريقك الحالي بدون احتكاك." },
            { icon: Handshake, title_en: "Dedicated Squads", title_ar: "فرق مخصصة", desc_en: "Get a full cross-functional team — PM, designers, engineers — managed and delivered by DevWady.", desc_ar: "احصل على فريق متكامل — مدير مشروع ومصممون ومهندسون — يديره ويسلمه DevWady." },
            { icon: TrendingUp, title_en: "Direct Hire", title_ar: "توظيف مباشر", desc_en: "Find and hire permanent team members through our vetted talent pipeline.", desc_ar: "اعثر على أعضاء فريق دائمين ووظّفهم عبر خط المواهب المعتمد لدينا." },
          ]}
          sectionTitle_en="Hiring Models"
          sectionTitle_ar="نماذج التوظيف"
          testimonials={[
            { quote_en: "We scaled our engineering team from 3 to 12 in under a month with DevWady Talent.", quote_ar: "وسّعنا فريقنا الهندسي من 3 إلى 12 في أقل من شهر مع DevWady Talent.", author_en: "Mohammed A.", author_ar: "محمد أ.", role_en: "VP Engineering, SaaS Startup", role_ar: "نائب رئيس الهندسة، شركة SaaS" },
            { quote_en: "The quality of developers was exceptional. No wasted time on bad interviews.", quote_ar: "جودة المطورين كانت استثنائية. بدون إضاعة وقت على مقابلات سيئة.", author_en: "Lina T.", author_ar: "لينا ت.", role_en: "Tech Lead, E-commerce", role_ar: "قائدة تقنية، تجارة إلكترونية" },
          ]}
        />
      </BusinessUnitHero>
    </>
  );
}
