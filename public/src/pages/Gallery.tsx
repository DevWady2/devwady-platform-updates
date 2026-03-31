import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import { iconMap } from "@/lib/iconMap";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

export default function Gallery() {
  const { t, lang } = useLanguage();

  const { data: timeline = [] } = useQuery({
    queryKey: ["gallery-timeline"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("gallery_timeline").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: photos = [] } = useQuery({
    queryKey: ["gallery-photos"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("gallery_photos").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <SEO title={t("seo.gallery.title")} description={t("seo.gallery.desc")} />
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 gradient-brand opacity-5" />
        <div className="container mx-auto px-4 relative">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl lg:text-6xl font-bold mb-4">
            {t("gallery.title")}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-xl text-muted-foreground max-w-2xl">
            {t("gallery.subtitle")}
          </motion.p>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-10">{t("gallery.timeline")}</h2>
          <div className="relative">
            <div className="absolute start-4 lg:start-1/2 top-0 bottom-0 w-0.5 bg-border" />
            <div className="space-y-10">
              {timeline.map((item: any, i: number) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap] || iconMap.Rocket;
                return (
                  <motion.div key={item.id} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                    className={`relative flex items-start gap-6 ${i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"}`}>
                    <div className="hidden lg:block lg:w-[calc(50%-2rem)]">
                      <div className={`bg-card rounded-xl p-6 border border-border ${i % 2 === 0 ? "text-end" : ""}`}>
                        <span className="text-xs text-primary font-bold">{item.year_label}</span>
                        <h3 className="font-bold mt-1">{lang === "ar" ? item.title_ar || item.title_en : item.title_en}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{lang === "ar" ? item.description_ar || item.description_en : item.description_en}</p>
                      </div>
                    </div>
                    <div className="relative z-10 w-8 h-8 rounded-full gradient-brand flex items-center justify-center flex-shrink-0 lg:absolute lg:start-1/2 lg:-translate-x-1/2">
                      <Icon className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="lg:hidden bg-card rounded-xl p-5 border border-border flex-1">
                      <span className="text-xs text-primary font-bold">{item.year_label}</span>
                      <h3 className="font-bold mt-1">{lang === "ar" ? item.title_ar || item.title_en : item.title_en}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{lang === "ar" ? item.description_ar || item.description_en : item.description_en}</p>
                    </div>
                    <div className="hidden lg:block lg:w-[calc(50%-2rem)]" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Photo Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <Camera className="h-6 w-6 text-primary" />
            {t("gallery.photos")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo: any, i: number) => (
              <motion.div key={photo.id} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className={`aspect-square rounded-2xl flex items-center justify-center border border-border hover:scale-105 transition-transform cursor-pointer overflow-hidden ${
                  photo.image_url ? "" : `bg-gradient-to-br ${photo.gradient}`
                }`}>
                {photo.image_url ? (
                  <img loading="lazy" src={photo.image_url} alt={lang === "ar" ? photo.label_ar || photo.label_en : photo.label_en} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-medium text-foreground/60">{lang === "ar" ? photo.label_ar || photo.label_en : photo.label_en}</span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
