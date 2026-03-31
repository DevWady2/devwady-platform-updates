import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Clock, Star, Shield, Smartphone, Server, Palette, Users,
  ChevronRight, Video, Calendar, MessageSquare, MessageSquareMore,
  DollarSign, Layers, PlayCircle, CheckCircle2,
  Building2, UserCheck, Lightbulb, Target, Handshake,
} from "lucide-react";
import { motion } from "framer-motion";
import { consultingTracks } from "@/data/consultingData";
import PaginationControls from "@/components/PaginationControls";
import BusinessUnitHero from "@/components/landing/BusinessUnitHero";
import LandingTrustSection from "@/components/landing/LandingTrustSection";
import GuestInquirySection from "@/components/landing/GuestInquirySection";
import type { FeatureItem } from "@/components/landing/BusinessUnitHero";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const trackIcons: Record<string, React.ElementType> = {
  "Product Strategy & Architecture": Star,
  "UI/UX & Frontend Architecture": Palette,
  "Cybersecurity & DevOps": Shield,
  "Backend Engineering": Server,
  "Mobile Development": Smartphone,
};

const features: FeatureItem[] = [
  { icon: Video, title_en: "Live Video Sessions", title_ar: "جلسات فيديو مباشرة", desc_en: "One-on-one video calls with senior engineers and team leads.", desc_ar: "مكالمات فيديو فردية مع كبار المهندسين وقادة الفرق." },
  { icon: Calendar, title_en: "Flexible Scheduling", title_ar: "حجز مرن", desc_en: "Pick an available slot or submit a custom booking request.", desc_ar: "اختر موعداً متاحاً أو أرسل طلب حجز مخصص." },
  { icon: MessageSquare, title_en: "Actionable Advice", title_ar: "نصائح عملية", desc_en: "Walk away with a clear action plan tailored to your project.", desc_ar: "احصل على خطة عمل واضحة مصممة لمشروعك." },
  { icon: Layers, title_en: "Track-Based Expertise", title_ar: "خبرة حسب التخصص", desc_en: "Experts organised by specialization so you find the right fit fast.", desc_ar: "خبراء منظمون حسب التخصص لإيجاد الأنسب بسرعة." },
  { icon: DollarSign, title_en: "Transparent Pricing", title_ar: "أسعار شفافة", desc_en: "Per-session rates with no hidden fees — pay only for what you need.", desc_ar: "أسعار لكل جلسة بدون رسوم خفية — ادفع فقط ما تحتاجه." },
  { icon: PlayCircle, title_en: "Session Follow-Up", title_ar: "متابعة الجلسات", desc_en: "Receive notes and next-step recommendations after every session.", desc_ar: "احصل على ملاحظات وتوصيات بعد كل جلسة." },
];

export default function Consulting() {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const [activeTrack, setActiveTrack] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 9;

  const { data: experts = [], isLoading } = useQuery({
    queryKey: ["consulting-experts"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_experts");
      if (error) throw error;
      return data;
    },
  });

  const allFiltered = activeTrack === "all"
    ? experts
    : experts.filter((e) => e.track === activeTrack);
  const totalPages = Math.ceil(allFiltered.length / PAGE_SIZE);
  const filtered = allFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <SEO title={t("seo.consulting.title")} description={t("seo.consulting.desc")} />

      <BusinessUnitHero
        icon={MessageSquareMore}
        gradient="from-[#7D33FF] to-[#3333FF]"
        accentColor="#7D33FF"
        title_en="Book a Live Session with Our Experts"
        title_ar="احجز جلسة مع خبرائنا"
        subtitle_en="Get personalized consulting from DevWady's senior engineers and team leaders. Choose the right expert for your field and book your session now."
        subtitle_ar="احصل على استشارة متخصصة من كبار المهندسين وقادة الفرق في DevWady. اختر الخبير المناسب لمجالك واحجز جلستك الآن."
        tagline_en="Expert Consulting"
        tagline_ar="استشارات الخبراء"
        features={features}
        highlights_en={["Live Video Sessions", "Flexible Scheduling", "Actionable Advice", "Custom Requests"]}
        highlights_ar={["جلسات فيديو مباشرة", "حجز مرن", "نصائح عملية", "طلبات مخصصة"]}
        portalPath="/consulting/portal"
        guestCtaPath="/auth/consulting"
        ctaLabel_en="Submit Custom Request"
        ctaLabel_ar="طلب حجز مخصص"
        guestCtaLabel_en="Request a Consultation"
        guestCtaLabel_ar="اطلب استشارة"
        authCtaLabel_en="Go to Consulting Workspace"
        authCtaLabel_ar="انتقل لمساحة الاستشارات"
        guestBottomCtaLabel_en="Book a Session"
        guestBottomCtaLabel_ar="احجز جلسة"
        authBottomCtaLabel_en="Manage Sessions"
        authBottomCtaLabel_ar="إدارة الجلسات"
        secondaryCta={{ path: "/consulting/track", label_en: "Track Your Order", label_ar: "تتبع طلبك" }}
      >
        {/* ── Expert Listing ── */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl lg:text-3xl font-bold mb-6">
              {isAr ? "خبراؤنا" : "Our Experts"}
            </h2>

            {/* Track Filter */}
            <div className="flex flex-wrap gap-2 mb-8">
              {consultingTracks.map((track) => (
                <button
                  key={track.key}
                  onClick={() => { setActiveTrack(track.key); setPage(1); }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeTrack === track.key
                      ? "bg-gradient-to-r from-[#7D33FF] to-[#3333FF] text-white shadow-md"
                      : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {isAr ? track.labelAr : track.labelEn}
                </button>
              ))}
            </div>

            {/* Expert Cards */}
            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-2xl border border-border/50 bg-card p-6 animate-pulse">
                    <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4" />
                    <div className="h-5 bg-muted rounded w-2/3 mx-auto mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((expert, i) => {
                  const TrackIcon = trackIcons[expert.track] || Users;
                  return (
                    <Link key={expert.id} to={`/consulting/${expert.slug}`}>
                      <motion.div
                        custom={i}
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        whileHover={{ y: -6, transition: { duration: 0.2 } }}
                        className="rounded-2xl border border-border/50 bg-card overflow-hidden group cursor-pointer h-full hover:border-border transition-colors"
                      >
                        <div className="p-6 text-center">
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#7D33FF] to-[#3333FF] mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold group-hover:scale-110 transition-transform">
                            {expert.initials}
                          </div>
                          <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">
                            {isAr ? expert.name_ar : expert.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            {isAr ? expert.role_ar : expert.role}
                          </p>

                          <div className="flex items-center justify-center gap-1.5 mb-4">
                            <TrackIcon className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs text-primary font-medium">
                              {isAr ? expert.track_ar : expert.track}
                            </span>
                          </div>

                          <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                            {((isAr ? expert.specializations_ar : expert.specializations) || []).slice(0, 3).map((s: string, j: number) => (
                              <Badge key={j} variant="secondary" className="text-[10px] font-medium">
                                {s}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mb-4">
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-primary" /> {expert.years_experience}+ {isAr ? "سنوات" : "years"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-primary" /> {expert.session_duration_minutes} {isAr ? "دقيقة" : "min"}
                            </span>
                          </div>

                          <div className="pt-4 border-t border-border">
                            <div className="text-lg font-bold text-primary mb-2">
                              ${expert.session_rate_usd}/{isAr ? "جلسة" : "session"}
                            </div>
                            <div className="inline-flex items-center gap-2 text-sm text-primary font-medium group-hover:gap-3 transition-all">
                              {isAr ? "احجز الآن" : "Book Now"} <ChevronRight className="icon-flip-rtl h-4 w-4" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-8">
                <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </div>
        </section>

        {/* ── Dual Audience ── */}
        <section className="py-20 lg:py-28 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <motion.h2 custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                {isAr ? "للعملاء والخبراء" : "For Clients & Experts"}
              </motion.h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <motion.div custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="bg-card border border-border rounded-2xl p-8 hover:border-primary/30 transition-colors group"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {isAr ? "للعملاء الباحثين عن خبراء" : "For Clients Seeking Expertise"}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  {isAr
                    ? "احصل على استشارة متخصصة من خبراء في مجالك — من جلسة واحدة إلى مشورة مستمرة."
                    : "Get specialized advice from domain experts — from a single session to ongoing advisory."}
                </p>
                <ul className="space-y-2">
                  {[
                    { en: "1:1 live video sessions", ar: "جلسات فيديو فردية مباشرة" },
                    { en: "Actionable deliverables after each session", ar: "مخرجات عملية بعد كل جلسة" },
                    { en: "Per-session pricing, no commitments", ar: "تسعير لكل جلسة بدون التزامات" },
                  ].map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      {isAr ? item.ar : item.en}
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div custom={1} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="bg-card border border-border rounded-2xl p-8 hover:border-primary/30 transition-colors group"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <UserCheck className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {isAr ? "للخبراء الراغبين بالانضمام" : "For Experts Joining the Network"}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  {isAr
                    ? "انضم لشبكة خبراء DevWady — أدر جدولك واكسب من خبرتك."
                    : "Join the DevWady expert network — manage your schedule and earn from your expertise."}
                </p>
                <ul className="space-y-2">
                  {[
                    { en: "Set your own availability & rates", ar: "حدد توفرك وأسعارك" },
                    { en: "Get matched with relevant clients", ar: "احصل على مطابقة مع عملاء مناسبين" },
                    { en: "Transparent earnings dashboard", ar: "لوحة أرباح شفافة" },
                  ].map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      {isAr ? item.ar : item.en}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Guest Inquiry Section ── */}
        <GuestInquirySection
          icon={MessageSquareMore}
          gradient="from-[#7D33FF] to-[#3333FF]"
          title_en="Not Sure Which Expert?"
          title_ar="لست متأكداً أي خبير يناسبك؟"
          subtitle_en="Describe your challenge and we'll recommend the right expert and arrange a session for you."
          subtitle_ar="صف التحدي الذي تواجهه وسنرشح لك الخبير المناسب ونرتب لك جلسة."
          subject="Consulting Inquiry"
          messagePlaceholder_en="What technical challenge or decision do you need help with?"
          messagePlaceholder_ar="ما التحدي التقني أو القرار الذي تحتاج مساعدة فيه؟"
        />

        <LandingTrustSection
          accentGradient="from-[#7D33FF] to-[#3333FF]"
          stats={[
            { value: "25+", label_en: "Active Experts", label_ar: "خبير نشط" },
            { value: "500+", label_en: "Sessions Completed", label_ar: "جلسة مكتملة" },
            { value: "4.9", label_en: "Average Rating", label_ar: "متوسط التقييم" },
            { value: "5", label_en: "Specialization Tracks", label_ar: "مسارات تخصص" },
          ]}
          useCases={[
            { icon: Target, title_en: "Technical Due Diligence", title_ar: "العناية التقنية الواجبة", desc_en: "Get an expert review of your tech stack, architecture, or code before major decisions.", desc_ar: "احصل على مراجعة خبير لتقنياتك وهندستك قبل القرارات الكبرى." },
            { icon: Lightbulb, title_en: "Product Strategy", title_ar: "استراتيجية المنتج", desc_en: "Validate your product roadmap and prioritize features with senior product thinkers.", desc_ar: "تحقق من خارطة منتجك وحدد أولويات الميزات مع كبار المفكرين." },
            { icon: Handshake, title_en: "Team Mentoring", title_ar: "إرشاد الفرق", desc_en: "Ongoing advisory for your engineering team on best practices and growth.", desc_ar: "مشورة مستمرة لفريقك الهندسي حول أفضل الممارسات والنمو." },
          ]}
          sectionTitle_en="Common Use Cases"
          sectionTitle_ar="حالات الاستخدام الشائعة"
          testimonials={[
            { quote_en: "The consulting session saved us months of wrong architectural decisions.", quote_ar: "الجلسة الاستشارية وفرت علينا أشهراً من القرارات المعمارية الخاطئة.", author_en: "Fahad M.", author_ar: "فهد م.", role_en: "CTO, Health Tech", role_ar: "مدير تقني، تقنية صحية" },
            { quote_en: "Clear, actionable advice. We implemented the recommendations the same week.", quote_ar: "نصائح واضحة وعملية. طبقنا التوصيات في نفس الأسبوع.", author_en: "Reem K.", author_ar: "ريم ك.", role_en: "Engineering Manager", role_ar: "مديرة هندسة" },
          ]}
        />
      </BusinessUnitHero>
    </>
  );
}
