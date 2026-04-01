import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Play, Headphones, Mic, Monitor, Briefcase, Heart, ExternalLink } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const categoryIcons: Record<string, typeof Monitor> = {
  tech: Monitor,
  work: Heart,
  business: Briefcase,
  advising: Mic,
};

export default function Media() {
  const { t, lang } = useLanguage();

  const { data: allItems = [] } = useQuery({
    queryKey: ["media-items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("media_items").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const videos = allItems.filter((m: any) => m.type === "video" || m.type === "reel");
  const podcasts = allItems.filter((m: any) => m.type === "podcast");

  return (
    <>
      <SEO title={t("seo.media.title")} description={t("seo.media.desc")} />
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 gradient-brand opacity-5" />
        <div className="container mx-auto px-4 relative">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl lg:text-6xl font-bold mb-4">
            {t("media.title")}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-xl text-muted-foreground max-w-2xl">
            {t("media.subtitle")}
          </motion.p>
        </div>
      </section>

      {/* Videos & Reels */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <Play className="h-6 w-6 text-primary" />
            {t("media.videos")}
          </h2>
          {videos.length === 0 && <p className="text-center text-muted-foreground py-8">{lang === "ar" ? "لا توجد فيديوهات حالياً" : "No videos yet"}</p>}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((v: any, i: number) => {
              const Icon = categoryIcons[v.category] || Monitor;
              return (
                <motion.div key={v.id} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                  className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow group">
                  <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center relative overflow-hidden">
                    {v.thumbnail_url ? (
                      <img loading="lazy" src={v.thumbnail_url} alt={v.title_en} className="w-full h-full object-cover" />
                    ) : null}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {v.external_url ? (
                        <a href={v.external_url} target="_blank" rel="noopener noreferrer" className="w-14 h-14 rounded-full gradient-brand flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play className="h-6 w-6 text-primary-foreground ms-1" />
                        </a>
                      ) : (
                        <div className="w-14 h-14 rounded-full gradient-brand flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play className="h-6 w-6 text-primary-foreground ms-1" />
                        </div>
                      )}
                    </div>
                    {v.duration && (
                      <span className="absolute bottom-2 end-2 px-2 py-0.5 text-xs rounded bg-background/80 backdrop-blur-sm font-mono">{v.duration}</span>
                    )}
                    <span className="absolute top-2 start-2 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-medium uppercase">{v.type}</span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground capitalize">{v.category}</span>
                    </div>
                    <h3 className="font-semibold">{lang === "ar" ? v.title_ar || v.title_en : v.title_en}</h3>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Podcasts */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <Headphones className="h-6 w-6 text-primary" />
            {t("media.podcasts")}
          </h2>
          {podcasts.length === 0 && <p className="text-center text-muted-foreground py-8">{lang === "ar" ? "لا توجد حلقات حالياً" : "No podcasts yet"}</p>}
          <div className="space-y-4">
            {podcasts.map((p: any, i: number) => (
              <motion.div key={p.id} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="bg-card rounded-xl border border-border p-5 flex items-center justify-between gap-4 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mic className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{lang === "ar" ? p.title_ar || p.title_en : p.title_en}</h3>
                    <span className="text-xs text-muted-foreground">{p.duration}</span>
                  </div>
                </div>
                {p.external_url ? (
                  <a href={p.external_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="rounded-full flex-shrink-0">
                      {t("media.listenNow")} <ExternalLink className="ms-1 h-3 w-3" />
                    </Button>
                  </a>
                ) : (
                  <Button variant="outline" size="sm" className="rounded-full flex-shrink-0">
                    {t("media.listenNow")} <ExternalLink className="ms-1 h-3 w-3" />
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
