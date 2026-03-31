/**
 * Shared social-proof / trust section for business-unit landing pages.
 */
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface Stat { value: string; label_en: string; label_ar: string }
interface Testimonial { quote_en: string; quote_ar: string; author_en: string; author_ar: string; role_en: string; role_ar: string }
interface UseCase { icon: LucideIcon; title_en: string; title_ar: string; desc_en: string; desc_ar: string }

interface Props {
  stats: Stat[];
  testimonials?: Testimonial[];
  useCases?: UseCase[];
  sectionTitle_en?: string;
  sectionTitle_ar?: string;
  accentGradient: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.45, ease: "easeOut" as const } }),
};

export default function LandingTrustSection({ stats, testimonials, useCases, sectionTitle_en, sectionTitle_ar, accentGradient }: Props) {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <>
      {/* Stats strip */}
      <section className="py-16 border-b border-border/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-8 max-w-4xl mx-auto text-center">
            {stats.map((s, i) => (
              <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="min-w-[120px]">
                <div className={`text-3xl md:text-4xl font-bold bg-gradient-to-r ${accentGradient} bg-clip-text text-transparent mb-1`}>
                  {s.value}
                </div>
                <p className="text-sm text-muted-foreground">{isAr ? s.label_ar : s.label_en}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      {useCases && useCases.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                {isAr ? (sectionTitle_ar ?? "حالات الاستخدام") : (sectionTitle_en ?? "Use Cases")}
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {useCases.map((uc, i) => {
                const Icon = uc.icon;
                return (
                  <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                    className="rounded-2xl border border-border/40 bg-card p-6 card-hover"
                  >
                    <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${accentGradient} flex items-center justify-center mb-4`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{isAr ? uc.title_ar : uc.title_en}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{isAr ? uc.desc_ar : uc.desc_en}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials && testimonials.length > 0 && (
        <section className="py-16 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {isAr ? "ماذا يقول عملاؤنا" : "What Our Clients Say"}
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {testimonials.map((t, i) => (
                <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                  className="rounded-2xl border border-border/40 bg-card p-6"
                >
                  <p className="text-sm text-foreground italic leading-relaxed mb-4">
                    "{isAr ? t.quote_ar : t.quote_en}"
                  </p>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{isAr ? t.author_ar : t.author_en}</p>
                    <p className="text-xs text-muted-foreground">{isAr ? t.role_ar : t.role_en}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
