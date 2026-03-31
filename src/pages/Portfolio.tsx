import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Smartphone, Globe, Monitor,
  Layers, ChevronRight, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getIcon } from "@/lib/iconMap";
import PaginationControls from "@/components/PaginationControls";

// Static marketing data (not project-specific)
import {
  similarProducts, deliverySteps, engagementModels, whyDevWady,
} from "@/data/portfolioData";

// Images
import yozya from "@/assets/products/yozya.webp";
import atmodriveDark from "@/assets/products/atmodrive-dark.webp";
import atmodriveLight from "@/assets/products/atmodrive-light.webp";
import hamla from "@/assets/products/hamla.webp";
import hamlaLight from "@/assets/products/hamla-light.webp";
import majesty from "@/assets/products/majesty.webp";
import nuutPos from "@/assets/clients/nuut-pos.webp";
import nuut from "@/assets/clients/nuut.webp";
import allianceLight from "@/assets/clients/alliance-light.webp";
import allianceDark from "@/assets/clients/alliance-dark.webp";
import maamourLight from "@/assets/clients/maamour-light.webp";
import maamourDark from "@/assets/clients/maamour-dark.webp";
import rissadLight from "@/assets/clients/rissad-light.webp";
import rissadDark from "@/assets/clients/rissad-dark.webp";

type Category = "all" | "mobile" | "web" | "enterprise";

const fullWidthProjects = ["atmodrive", "alliance", "maamour", "nuutPos", "majesty", "rissad"];

const imageMap: Record<string, string> = { yozya, hamla, majesty, nuutPos, nuut, rissad: rissadLight };

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

interface DbProject {
  id: string;
  slug: string;
  img_key: string | null;
  title_en: string;
  title_ar: string | null;
  subtitle_en: string | null;
  subtitle_ar: string | null;
  description_en: string | null;
  description_ar: string | null;
  badge: string | null;
  badge_ar: string | null;
  category: string | null;
  tech: string[] | null;
  is_featured: boolean | null;
  cover_image_url: string | null;
  external_url: string | null;
  metrics: any[] | null;
  links: any[] | null;
  channels: any[] | null;
  core_modules: any[] | null;
  brand_note: string | null;
  brand_note_ar: string | null;
  in_development: string | null;
  in_development_ar: string | null;
  sort_order: number | null;
  status: string;
}

export default function Portfolio() {
  const { t, lang } = useLanguage();
  const { theme } = useTheme();
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;
  const isAr = lang === "ar";

  const { data: projects = [] } = useQuery<DbProject[]>({
    queryKey: ["portfolio-projects-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolio_projects")
        .select("*")
        .eq("status", "published")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as DbProject[];
    },
  });

  const categories: { key: Category; label: string; icon: React.ElementType }[] = [
    { key: "all", label: isAr ? "الكل" : "All Projects", icon: Layers },
    { key: "mobile", label: isAr ? "تطبيقات الموبايل" : "Mobile Apps", icon: Smartphone },
    { key: "web", label: isAr ? "المواقع" : "Websites", icon: Globe },
    { key: "enterprise", label: isAr ? "أنظمة المؤسسات" : "Enterprise", icon: Monitor },
  ];

  const getImage = (imgKey: string | null) => {
    if (!imgKey) return yozya;
    if (imgKey === "atmodrive") return theme === "dark" ? atmodriveDark : atmodriveLight;
    if (imgKey === "hamla") return theme === "dark" ? hamla : hamlaLight;
    if (imgKey === "alliance") return theme === "dark" ? allianceDark : allianceLight;
    if (imgKey === "maamour") return theme === "dark" ? maamourDark : maamourLight;
    if (imgKey === "rissad") return theme === "dark" ? rissadDark : rissadLight;
    return imageMap[imgKey] || yozya;
  };

  const isFullWidth = (imgKey: string | null) => imgKey ? fullWidthProjects.includes(imgKey) : false;

  const featured = projects.find((p) => p.is_featured);
  const allFiltered = projects.filter(
    (p) => !p.is_featured && (activeCategory === "all" || p.category === activeCategory)
  );
  const totalPages = Math.ceil(allFiltered.length / PAGE_SIZE);
  const filtered = allFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <SEO title={t("seo.portfolio.title")} description={t("seo.portfolio.desc")} />
      {/* Hero */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 -right-32 w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] rounded-full bg-secondary/5 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6"
          >
            {t("portfolio.title")}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl lg:text-6xl font-extrabold leading-tight mb-6 max-w-3xl"
          >
            {isAr ? "منتجات حقيقية في الأسواق الحقيقية" : "Real Products in Real Markets"}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl leading-relaxed"
          >
            {t("portfolio.subtitle")}
          </motion.p>
        </div>
      </section>

      {/* Featured */}
      {featured && (
        <section className="pb-16">
          <div className="container mx-auto px-4">
            <Link to={`/portfolio/${featured.slug}`}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="brand-card-interactive rounded-3xl overflow-hidden cursor-pointer group"
              >
                <div className="absolute inset-0 gradient-brand opacity-[0.03]" />
                <div className="relative p-8 lg:p-12 flex flex-col lg:flex-row items-start gap-8">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                      {featured.badge && (
                        <span className="px-3 py-1 text-xs font-bold rounded-full gradient-brand text-primary-foreground uppercase tracking-wider">
                          {isAr ? featured.badge_ar || featured.badge : featured.badge}
                        </span>
                      )}
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                        {categories.find((c) => c.key === featured.category)?.label}
                      </span>
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-bold mb-4 group-hover:text-primary transition-colors">
                      {isAr ? featured.title_ar || featured.title_en : featured.title_en}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-6 max-w-xl">
                      {isAr ? featured.description_ar || featured.description_en : featured.description_en}
                    </p>
                    {featured.metrics && (featured.metrics as any[]).length > 0 && (
                      <div className="flex flex-wrap gap-6 mb-6">
                        {(featured.metrics as any[]).map((m: any, i: number) => {
                          const Icon = getIcon(m.icon);
                          return (
                            <div key={i} className="text-center">
                              <Icon className="h-5 w-5 text-primary mx-auto mb-1" />
                              <div className="text-lg font-bold">{m.value}</div>
                              <div className="text-xs text-muted-foreground">{isAr ? m.labelAr : m.labelEn}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {(featured.tech || []).map((techItem, i) => (
                        <span key={i} className="px-2.5 py-1 text-xs font-medium rounded-md bg-muted text-muted-foreground border border-border">
                          {techItem}
                        </span>
                      ))}
                    </div>
                    <div className="inline-flex items-center gap-2 text-sm text-primary font-medium group-hover:gap-3 transition-all">
                      {isAr ? "عرض التفاصيل" : "View Details"} <ChevronRight className="icon-flip-rtl h-4 w-4" />
                    </div>
                  </div>
                  <div className="w-full lg:w-80 flex-shrink-0">
                    <div className="bg-muted rounded-2xl overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                      {featured.cover_image_url ? (
                        <img loading="lazy" src={featured.cover_image_url} alt={isAr ? featured.title_ar || featured.title_en : featured.title_en} className="w-full h-48 object-cover" />
                      ) : (
                        <img loading="lazy" src={getImage(featured.img_key)} alt={isAr ? featured.title_ar || featured.title_en : featured.title_en} className={`${isFullWidth(featured.img_key) || (featured.img_key === "hamla" && theme !== "dark") ? "w-full h-48 object-cover" : "w-32 h-32 lg:w-40 lg:h-40 object-contain p-6"}`} />
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
        </section>
      )}

      {/* Category Filter */}
      <section className="pb-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label={isAr ? "تصفية المشاريع" : "Filter projects"}>
            {categories.map((cat) => (
              <button
                key={cat.key}
                role="tab"
                aria-selected={activeCategory === cat.key}
                onClick={() => { setActiveCategory(cat.key); setPage(1); }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.key
                    ? "gradient-brand text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <cat.icon className="h-4 w-4" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Project Grid */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            >
              {filtered.map((p, i) => (
                <Link key={p.slug} to={`/portfolio/${p.slug}`}>
                  <motion.div
                    custom={i}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    whileHover={{ y: -6, transition: { duration: 0.2 } }}
                    className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all group cursor-pointer h-full"
                  >
                    <div className="bg-muted/50 flex items-center justify-center h-32 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      {p.cover_image_url ? (
                        <img loading="lazy" src={p.cover_image_url} alt={isAr ? p.title_ar || p.title_en : p.title_en} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      ) : (
                        <img loading="lazy"
                          src={getImage(p.img_key)}
                          alt={isAr ? p.title_ar || p.title_en : p.title_en}
                          className={`${isFullWidth(p.img_key) || (p.img_key === "hamla" && theme !== "dark") ? "w-full h-full object-cover" : "h-16 w-16 object-contain"} group-hover:scale-110 transition-transform duration-300`}
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <span className="text-[10px] uppercase font-semibold text-primary tracking-wider">
                        {isAr ? p.subtitle_ar || p.subtitle_en : p.subtitle_en}
                      </span>
                      <h3 className="text-sm font-bold mt-1 mb-1 group-hover:text-primary transition-colors line-clamp-1">
                        {isAr ? p.title_ar || p.title_en : p.title_en}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                        {isAr ? p.description_ar || p.description_en : p.description_en}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {(p.tech || []).slice(0, 3).map((techItem, j) => (
                          <span key={j} className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-muted text-muted-foreground">
                            {techItem}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-primary font-medium pt-2 border-t border-border group-hover:gap-2 transition-all">
                        {isAr ? "عرض التفاصيل" : "View Details"} <ChevronRight className="icon-flip-rtl h-3.5 w-3.5" />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </motion.div>
          </AnimatePresence>
          <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </section>

      {/* Similar Products We Can Build */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
              {isAr ? "منتجات مشابهة" : "Similar Products"}
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              {isAr ? "منتجات مشابهة يمكننا بناؤها" : "Similar Products We Can Build"}
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              {isAr
                ? "بناءً على خبرتنا في المنصات المتعددة عبر YOZYA و AtmoDrive و HAMLA و Majesty، نحن مؤهلون لبناء أنواع المنتجات التالية:"
                : "Based on our modular platform experience across YOZYA, AtmoDrive, HAMLA, and Majesty, we are well-positioned to build the following product types:"}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {similarProducts.map((sp, i) => (
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
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center text-primary-foreground">
                    <sp.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold">{isAr ? sp.titleAr : sp.titleEn}</h3>
                </div>
                <ul className="space-y-1.5">
                  {(isAr ? sp.itemsAr : sp.items).slice(0, 5).map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="mt-1 h-1 w-1 rounded-full bg-primary flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                  {(isAr ? sp.itemsAr : sp.items).length > 5 && (
                    <li className="text-xs text-primary font-medium">
                      +{(isAr ? sp.itemsAr : sp.items).length - 5} {isAr ? "المزيد" : "more"}
                    </li>
                  )}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery Approach */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
              {isAr ? "كيف نعمل" : "How We Work"}
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              {isAr ? "منهجية التسليم" : "Delivery Approach"}
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              {isAr
                ? "عملية تسليم شاملة لضمان تقدم متوقع وجودة عالية وإطلاقات ناجحة."
                : "A structured end-to-end delivery process to ensure predictable progress, quality, and successful launches."}
            </p>
          </motion.div>

          <div className="space-y-4">
            {deliverySteps.map((step, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="flex items-start gap-6 bg-card rounded-2xl border border-border p-6 hover:border-primary/30 transition-colors"
              >
                <div className="h-12 w-12 rounded-xl gradient-brand flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">
                  {step.step}
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">{isAr ? step.titleAr : step.titleEn}</h3>
                  <p className="text-sm text-muted-foreground">{isAr ? step.descAr : step.descEn}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Engagement Models */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
              {isAr ? "نماذج التعاون" : "Engagement Models"}
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              {isAr ? "نماذج التعاون" : "Engagement Models"}
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              {isAr
                ? "نماذج تعاون مرنة مصممة لتناسب أهداف وميزانيات وجداول زمنية مختلفة."
                : "Flexible collaboration models designed to fit different goals, budgets, and delivery timelines."}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {engagementModels.map((model, i) => (
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
                <h3 className="text-base font-bold text-primary mb-2">{isAr ? model.titleAr : model.titleEn}</h3>
                <p className="text-sm text-muted-foreground">{isAr ? model.descAr : model.descEn}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why DevWady */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
              {isAr ? "لماذا نحن" : "Why Us"}
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              {isAr ? "لماذا DevWady" : "Why DevWady"}
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              {isAr
                ? "تميزنا مبني على عقلية المنتج وانضباط التسليم وسجل حافل في بناء المنظومات."
                : "Our differentiation is built on product mindset, delivery discipline, and a proven ecosystem-building track record."}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyDevWady.map((item, i) => (
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
                <div className="h-8 w-8 rounded-lg gradient-brand flex items-center justify-center text-primary-foreground mb-3">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold mb-2">{isAr ? item.titleAr : item.titleEn}</h3>
                <p className="text-sm text-muted-foreground">{isAr ? item.descAr : item.descEn}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: "10+", label: isAr ? "منتج مُطلق" : "Products Shipped" },
              { value: "20+", label: isAr ? "تطبيق موبايل" : "Mobile Apps" },
              { value: "3", label: isAr ? "قطاعات" : "Sectors" },
              { value: "2", label: isAr ? "أسواق" : "Markets" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="gradient-brand rounded-3xl p-10 lg:p-16 text-center text-primary-foreground"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              {isAr ? "لديك فكرة منتج؟ لنحولها لواقع." : "Have a Product Idea? Let's Ship It."}
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-md mx-auto">
              {t("contact.subtitle")}
            </p>
            <Link to="/contact">
              <Button size="lg" variant="secondary" className="rounded-full px-8 text-base">
                {t("hero.cta1")} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
