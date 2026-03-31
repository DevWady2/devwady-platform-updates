/**
 * BusinessUnitHero — Reusable hero + features + CTA section for business-unit landing pages.
 * Each page passes its own branding, features, and content.
 */
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface FeatureItem {
  icon: LucideIcon;
  title_en: string;
  title_ar: string;
  desc_en: string;
  desc_ar: string;
}

export interface BusinessUnitHeroProps {
  icon: LucideIcon;
  gradient: string;
  accentColor: string;
  title_en: string;
  title_ar: string;
  subtitle_en: string;
  subtitle_ar: string;
  tagline_en: string;
  tagline_ar: string;
  features: FeatureItem[];
  highlights_en: string[];
  highlights_ar: string[];
  portalPath: string;
  ctaLabel_en: string;
  ctaLabel_ar: string;
  /** Where the primary CTA links for guests (default: home) */
  guestCtaPath?: string;
  /** Guest-specific CTA label overrides */
  guestCtaLabel_en?: string;
  guestCtaLabel_ar?: string;
  /** Logged-in CTA label overrides (shown instead of portal-oriented label) */
  authCtaLabel_en?: string;
  authCtaLabel_ar?: string;
  /** Guest-specific bottom CTA label overrides */
  guestBottomCtaLabel_en?: string;
  guestBottomCtaLabel_ar?: string;
  /** Logged-in bottom CTA label overrides */
  authBottomCtaLabel_en?: string;
  authBottomCtaLabel_ar?: string;
  secondaryCta?: { path: string; label_en: string; label_ar: string };
  children?: React.ReactNode;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: "easeOut" as const },
  }),
};

export default function BusinessUnitHero(props: BusinessUnitHeroProps) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const isAr = lang === "ar";
  const Icon = props.icon;

  const ctaPath = user ? props.portalPath : (props.guestCtaPath || "/");
  const ctaLabel = user
    ? (isAr ? (props.authCtaLabel_ar || props.ctaLabel_ar) : (props.authCtaLabel_en || props.ctaLabel_en))
    : (isAr ? (props.guestCtaLabel_ar || props.ctaLabel_ar) : (props.guestCtaLabel_en || props.ctaLabel_en));

  return (
    <div className="relative overflow-hidden">
      {/* ── Hero Section ── */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28">
        {/* Background gradient glow */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${props.gradient} opacity-[0.04] dark:opacity-[0.08]`}
        />
        <div
          className={`absolute top-0 start-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b ${props.gradient} opacity-[0.06] blur-[100px] rounded-full`}
        />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/80 backdrop-blur-sm px-4 py-1.5 mb-6"
            >
              <div
                className={`h-6 w-6 rounded-md bg-gradient-to-br ${props.gradient} flex items-center justify-center`}
              >
                <Icon className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {isAr ? props.tagline_ar : props.tagline_en}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-5 leading-[1.1]"
            >
              {isAr ? props.title_ar : props.title_en}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed"
            >
              {isAr ? props.subtitle_ar : props.subtitle_en}
            </motion.p>

            {/* CTAs */}
            <motion.div
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <Link to={ctaPath}>
                <Button
                  size="lg"
                  className={`rounded-full px-8 bg-gradient-to-r ${props.gradient} text-white border-0 shadow-lg hover:opacity-90 transition-all duration-200`}
                >
                  {ctaLabel}
                  <ArrowRight className="ms-2 h-4 w-4 icon-flip-rtl" />
                </Button>
              </Link>
              {props.secondaryCta && (
                <Link to={props.secondaryCta.path}>
                  <Button variant="outline" size="lg" className="rounded-full px-8">
                    {isAr ? props.secondaryCta.label_ar : props.secondaryCta.label_en}
                  </Button>
                </Link>
              )}
            </motion.div>
          </div>

          {/* Highlight pills */}
          <motion.div
            custom={4}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-14"
          >
            {(isAr ? props.highlights_ar : props.highlights_en).map((h, i) => (
              <span key={i} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CheckCircle2
                  className="h-4 w-4 shrink-0"
                  style={{ color: props.accentColor }}
                />
                {h}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              {isAr ? "ما نقدمه" : "What We Offer"}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              {isAr
                ? "حلول متكاملة مصممة لتسريع نموك الرقمي"
                : "End-to-end solutions designed to accelerate your digital growth"}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {props.features.map((f, i) => {
              const FIcon = f.icon;
              return (
                <motion.div
                  key={i}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  className="group rounded-2xl border border-border/40 bg-card p-6 card-hover"
                >
                  <div
                    className={`h-11 w-11 rounded-xl bg-gradient-to-br ${props.gradient} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}
                  >
                    <FIcon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    {isAr ? f.title_ar : f.title_en}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {isAr ? f.desc_ar : f.desc_en}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Children (page-specific content) ── */}
      {props.children}

      {/* ── CTA Banner ── */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div
            className={`relative rounded-3xl bg-gradient-to-br ${props.gradient} p-10 md:p-16 text-center overflow-hidden`}
          >
            {/* Decorative circles */}
            <div className="absolute top-0 end-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 start-0 w-40 h-40 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4" />

            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                {isAr ? "مستعد للبدء؟" : "Ready to Get Started?"}
              </h2>
              <p className="text-white/80 max-w-lg mx-auto mb-8">
                {isAr
                  ? "انضم إلى مئات الشركات والأفراد الذين يثقون بخدماتنا"
                  : "Join hundreds of companies and individuals who trust our services"}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to={ctaPath}>
                  <Button
                    size="lg"
                    className="rounded-full px-8 bg-white text-foreground hover:bg-white/90 shadow-lg transition-all duration-200"
                  >
                    {user
                      ? (isAr ? (props.authBottomCtaLabel_ar || props.ctaLabel_ar) : (props.authBottomCtaLabel_en || props.ctaLabel_en))
                      : isAr ? (props.guestBottomCtaLabel_ar || "أنشئ حساب مجاناً") : (props.guestBottomCtaLabel_en || "Create Free Account")}
                    <ArrowRight className="ms-2 h-4 w-4 icon-flip-rtl" />
                  </Button>
                </Link>
                {!user && (
                  <Link to="/contact">
                    <Button
                      variant="outline"
                      size="lg"
                      className="rounded-full px-8 border-white/30 text-white hover:bg-white/10 transition-colors"
                    >
                      {isAr ? "تواصل معنا" : "Contact Us"}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
