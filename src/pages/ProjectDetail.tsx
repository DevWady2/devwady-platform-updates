import { useParams, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ExternalLink, ArrowLeft, ArrowRight, ChevronRight, Rocket, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { getIcon } from "@/lib/iconMap";

// Image imports for legacy img_key mapping
import yozya from "@/assets/products/yozya.webp";
import atmodriveDark from "@/assets/products/atmodrive-dark.webp";
import atmodriveLight from "@/assets/products/atmodrive-light.webp";
import hamla from "@/assets/products/hamla.webp";
import hamlaLight from "@/assets/products/hamla-light.webp";
import majesty from "@/assets/products/majesty.webp";
import nuutPos from "@/assets/clients/nuut-pos.webp";
import nuut from "@/assets/clients/nuut.webp";
import alliance from "@/assets/clients/alliance.webp";
import maamour from "@/assets/clients/maamour.webp";
import rissadLight from "@/assets/clients/rissad-light.webp";
import rissadDark from "@/assets/clients/rissad-dark.webp";

const imageMap: Record<string, string> = { yozya, hamla, majesty, nuutPos, nuut, alliance, maamour, rissad: rissadLight };

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.45 } }),
};

export default function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLanguage();
  const { theme } = useTheme();
  const isAr = lang === "ar";

  const { data: project, isLoading } = useQuery({
    queryKey: ["portfolio-project", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolio_projects")
        .select("*")
        .eq("slug", slug!)
        .eq("status", "published")
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <section className="py-32 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </section>
    );
  }

  if (!project) {
    return (
      <section className="py-32 text-center">
        <h1 className="text-3xl font-bold mb-4">{isAr ? "المشروع غير موجود" : "Project Not Found"}</h1>
        <Link to="/portfolio">
          <Button variant="outline" className="rounded-full">
            <ArrowLeft className="icon-flip-rtl me-2 h-4 w-4" />
            {isAr ? "العودة للأعمال" : "Back to Portfolio"}
          </Button>
        </Link>
      </section>
    );
  }

  const getImage = () => {
    if (project.cover_image_url) return project.cover_image_url;
    const key = project.img_key;
    if (!key) return yozya;
    if (key === "atmodrive") return theme === "dark" ? atmodriveDark : atmodriveLight;
    if (key === "hamla") return theme === "dark" ? hamla : hamlaLight;
    if (key === "rissad") return theme === "dark" ? rissadDark : rissadLight;
    return imageMap[key] || yozya;
  };

  const title = isAr ? project.title_ar || project.title_en : project.title_en;
  const subtitle = isAr ? project.subtitle_ar || project.subtitle_en : project.subtitle_en;
  const desc = isAr ? project.description_ar || project.description_en : project.description_en;
  const metrics = (project as any).metrics as any[] || [];
  const links = (project as any).links as any[] || [];
  const channels = (project as any).channels as any[] || [];
  const coreModules = (project as any).core_modules as any[] || [];
  const brandNote = isAr ? (project as any).brand_note_ar : (project as any).brand_note;
  const inDev = isAr ? (project as any).in_development_ar : (project as any).in_development;

  return (
    <>
      <SEO title={isAr ? (project.title_ar || project.title_en) : project.title_en} />
      <div className="container mx-auto px-4 pt-8">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/portfolio" className="hover:text-primary transition-colors">
            {isAr ? "أعمالنا" : "Portfolio"}
          </Link>
          <ChevronRight className="icon-flip-rtl h-3.5 w-3.5" />
          <span className="text-foreground font-medium">{title}</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-start gap-10">
            <motion.div
              initial={{ opacity: 0, x: isAr ? 30 : -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex-1 min-w-0"
            >
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                {project.badge && (
                  <span className="px-3 py-1 text-xs font-bold rounded-full gradient-brand text-primary-foreground uppercase tracking-wider">
                    {isAr ? project.badge_ar || project.badge : project.badge}
                  </span>
                )}
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
                  {subtitle}
                </span>
              </div>

              <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-4">{title}</h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6 max-w-2xl">{desc}</p>

              {brandNote && (
                <p className="text-sm italic text-muted-foreground mb-4 px-3 py-2 bg-muted/50 rounded-lg border border-border">
                  {brandNote}
                </p>
              )}

              {/* Metrics */}
              {metrics.length > 0 && (
                <div className="flex flex-wrap gap-8 mb-6">
                  {metrics.map((m: any, i: number) => {
                    const Icon = getIcon(m.icon);
                    return (
                      <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" animate="visible" className="text-center">
                        <Icon className="h-5 w-5 text-primary mx-auto mb-1" />
                        <div className="text-2xl font-bold">{m.value}</div>
                        <div className="text-xs text-muted-foreground">{isAr ? m.labelAr : m.labelEn}</div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Tech */}
              <div className="flex flex-wrap gap-2 mb-6">
                {(project.tech || []).map((t, i) => (
                  <span key={i} className="px-3 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground border border-border">
                    {t}
                  </span>
                ))}
              </div>

              {/* Links */}
              {links.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {links.map((link: any, j: number) => (
                    <a key={j} href={link.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="rounded-full text-xs">
                        {isAr ? link.labelAr : link.labelEn}
                        <ExternalLink className="ms-1 h-3 w-3" />
                      </Button>
                    </a>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-full lg:w-80 flex-shrink-0"
            >
              <div className="bg-muted rounded-2xl overflow-hidden flex items-center justify-center border border-border">
                <img loading="lazy" src={getImage()} alt={title} className="w-full h-48 lg:h-56 object-cover" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Channels / Product Breakdown */}
      {channels.length > 0 && (
        <section className="pb-16">
          <div className="container mx-auto px-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl lg:text-3xl font-bold mb-8"
            >
              {isAr ? "تفاصيل المنتج" : "Product Breakdown"}
            </motion.h2>

            <div className="grid md:grid-cols-2 gap-6">
              {channels.map((ch: any, i: number) => (
                <motion.div
                  key={i}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg hover:shadow-primary/5 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-foreground">{isAr ? ch.nameAr : ch.name}</h3>
                  </div>
                  <p className="text-xs text-primary font-medium mb-4 px-2 py-1 bg-primary/5 rounded-full inline-block">
                    {isAr ? ch.audienceAr : ch.audience}
                  </p>
                  <ul className="space-y-2">
                    {(isAr ? ch.capabilitiesAr : ch.capabilities)?.map((cap: string, j: number) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                        {cap}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Core Modules */}
      {coreModules.length > 0 && (
        <section className="pb-16">
          <div className="container mx-auto px-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl lg:text-3xl font-bold mb-8"
            >
              {isAr ? "الوحدات الأساسية" : "Core Modules"}
            </motion.h2>
            <div className="grid md:grid-cols-3 gap-6">
              {coreModules.map((mod: any, i: number) => (
                <motion.div
                  key={i}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="bg-card rounded-2xl border border-border p-6"
                >
                  <h3 className="text-base font-bold mb-3">{isAr ? mod.titleAr : mod.titleEn}</h3>
                  <ul className="space-y-2">
                    {(isAr ? mod.itemsAr : mod.items)?.map((item: string, j: number) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* In Development */}
      {inDev && (
        <section className="pb-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex items-center gap-4"
            >
              <Rocket className="h-6 w-6 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-bold text-sm mb-1">{isAr ? "قيد التطوير" : "In Development"}</h3>
                <p className="text-sm text-muted-foreground">{inDev}</p>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="gradient-brand rounded-3xl p-10 lg:p-14 text-center text-primary-foreground"
          >
            <h2 className="text-2xl lg:text-3xl font-bold mb-4">
              {isAr ? "هل لديك فكرة مشابهة؟ لنبنيها معاً." : "Have a Similar Idea? Let's Build It Together."}
            </h2>
            <p className="text-base opacity-90 mb-6 max-w-md mx-auto">
              {isAr ? "احصل على عرض أسعار تفصيلي لمشروعك خلال 48 ساعة." : "Get a detailed quote for your project within 48 hours."}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/get-started">
                <Button size="lg" variant="secondary" className="rounded-full px-8">
                  {isAr ? "ابدأ مشروعك" : "Start Your Project"}
                  <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/portfolio">
                <Button size="lg" variant="outline" className="rounded-full px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  {isAr ? "عرض جميع الأعمال" : "View All Projects"}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
