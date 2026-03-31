import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { Calendar, Clock, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PaginationControls from "@/components/PaginationControls";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const categories = ["all", "tech", "product", "culture", "training"];

const PAGE_SIZE = 12;

export default function Blog() {
  const { t, lang } = useLanguage();
  const [active, setActive] = useState("all");
  const [page, setPage] = useState(1);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog-posts-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const allFiltered = active === "all" ? posts : posts.filter((p) => p.category === active);
  const totalPages = Math.ceil(allFiltered.length / PAGE_SIZE);
  const filtered = allFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <SEO title={t("seo.blog.title")} description={t("seo.blog.desc")} />
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 gradient-brand opacity-5" />
        <div className="container mx-auto px-4 relative">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl lg:text-6xl font-bold mb-4"
          >
            {t("blog.title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground max-w-2xl"
          >
            {t("blog.subtitle")}
          </motion.p>
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto px-4">
          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setActive(cat); setPage(1); }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  active === cat
                    ? "gradient-brand text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(`blog.${cat}`)}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              {lang === "ar" ? "لا توجد مقالات بعد" : "No blog posts yet"}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((post, i) => (
                <motion.article
                  key={post.id}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all group"
                >
                  <Link to={`/blog/${post.slug}`}>
                    {post.cover_image_url ? (
                      <img loading="lazy" src={post.cover_image_url} alt={post.title} className="h-40 w-full object-cover" />
                    ) : (
                      <div className="h-40 bg-gradient-to-br from-primary to-secondary opacity-80 flex items-center justify-center">
                        <span className="text-4xl font-black text-primary-foreground/20">DW</span>
                      </div>
                    )}
                  </Link>
                  <div className="p-6">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {post.published_at ? new Date(post.published_at).toLocaleDateString() : new Date(post.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {post.read_time_minutes ?? 5} {t("blog.minRead")}
                      </span>
                    </div>
                    <Link to={`/blog/${post.slug}`}>
                      <h3 className="font-bold mb-2 group-hover:text-primary transition-colors">
                        {lang === "ar" ? (post.title_ar || post.title) : post.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {lang === "ar" ? (post.excerpt_ar || post.excerpt) : post.excerpt}
                    </p>
                    <Link to={`/blog/${post.slug}`}>
                      <Button variant="ghost" size="sm" className="px-0 text-primary hover:text-primary/80">
                        {t("blog.readMore")} <ArrowRight className="icon-flip-rtl ms-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
          <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </section>
    </>
  );
}
