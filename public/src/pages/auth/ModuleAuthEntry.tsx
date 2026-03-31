/**
 * ModuleAuthEntry — Shared module-specific auth entry page.
 * Shows module branding, role-aware entry options, and routes to existing auth flows.
 */
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

import SEO from "@/components/SEO";
import { motion } from "framer-motion";
import { ArrowRight, LogIn, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface AuthEntryOption {
  icon: LucideIcon;
  title_en: string;
  title_ar: string;
  desc_en: string;
  desc_ar: string;
  /** Where this option leads */
  path: string;
  /** Visual style variant */
  variant?: "primary" | "outline";
  /** Small badge text */
  badge_en?: string;
  badge_ar?: string;
}

export interface ModuleAuthEntryProps {
  icon: LucideIcon;
  gradient: string;
  module_en: string;
  module_ar: string;
  title_en: string;
  title_ar: string;
  subtitle_en: string;
  subtitle_ar: string;
  seoTitle_en: string;
  seoTitle_ar: string;
  /** Entry options (role-aware cards) */
  options: AuthEntryOption[];
  /** Existing client / sign-in link config */
  signInLabel_en?: string;
  signInLabel_ar?: string;
  signInPath?: string;
  /** Highlights shown below */
  highlights_en?: string[];
  highlights_ar?: string[];
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: "easeOut" as const },
  }),
};

export default function ModuleAuthEntry(props: ModuleAuthEntryProps) {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const Icon = props.icon;
  // (handled naturally by the option paths — they can click through)

  return (
    <>
      <SEO title={isAr ? props.seoTitle_ar : props.seoTitle_en} />
      <section className="min-h-[80vh] flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-center mb-10"
          >
            {/* Module badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/80 backdrop-blur-sm px-4 py-1.5 mb-6">
              <div className={`h-6 w-6 rounded-md bg-gradient-to-br ${props.gradient} flex items-center justify-center`}>
                <Icon className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {isAr ? props.module_ar : props.module_en}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3">
              {isAr ? props.title_ar : props.title_en}
            </h1>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
              {isAr ? props.subtitle_ar : props.subtitle_en}
            </p>
          </motion.div>

          {/* Entry options */}
          <div className="grid gap-4">
            {props.options.map((opt, i) => {
              const OptIcon = opt.icon;
              const isPrimary = opt.variant === "primary";
              return (
                <motion.div
                  key={i}
                  custom={i + 1}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                >
                  <Link to={opt.path}>
                    <div
                      className={`group relative w-full text-start rounded-2xl border p-5 transition-all duration-200 ${
                        isPrimary
                          ? `border-transparent bg-gradient-to-br ${props.gradient} text-white shadow-lg hover:shadow-xl hover:scale-[1.01]`
                          : "border-border bg-card hover:border-primary/30 hover:shadow-lg hover:scale-[1.01]"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${
                          isPrimary ? "bg-white/20" : "bg-primary/10"
                        }`}>
                          <OptIcon className={`h-5 w-5 ${isPrimary ? "text-white" : "text-primary"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`font-semibold text-base ${isPrimary ? "text-white" : "text-foreground"}`}>
                              {isAr ? opt.title_ar : opt.title_en}
                            </h3>
                            {opt.badge_en && (
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                isPrimary ? "bg-white/20 text-white" : "bg-accent text-accent-foreground"
                              }`}>
                                {isAr ? opt.badge_ar : opt.badge_en}
                              </span>
                            )}
                          </div>
                          <p className={`text-sm mt-1 leading-relaxed ${
                            isPrimary ? "text-white/80" : "text-muted-foreground"
                          }`}>
                            {isAr ? opt.desc_ar : opt.desc_en}
                          </p>
                        </div>
                        <ArrowRight className={`icon-flip-rtl h-4 w-4 mt-1 shrink-0 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-all ${
                          isPrimary ? "text-white" : "text-muted-foreground"
                        }`} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Highlights */}
          {props.highlights_en && props.highlights_en.length > 0 && (
            <motion.div
              custom={props.options.length + 1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-10"
            >
              {(isAr ? props.highlights_ar! : props.highlights_en).map((h, i) => (
                <span key={i} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  {h}
                </span>
              ))}
            </motion.div>
          )}

          {/* Sign in link */}
          <motion.div
            custom={props.options.length + 2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mt-8 text-center space-y-3"
          >
            <Link
              to={props.signInPath || "/login"}
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
            >
              <LogIn className="h-3.5 w-3.5" />
              {isAr
                ? (props.signInLabel_ar || "تسجيل الدخول كعميل حالي")
                : (props.signInLabel_en || "Sign in as an existing user")}
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
