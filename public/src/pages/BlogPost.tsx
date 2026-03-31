import { useParams, Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calendar, Clock, ArrowLeft, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function BlogPost() {
  const { slug } = useParams();
  const { t, lang } = useLanguage();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">{lang === "ar" ? "المقال غير موجود" : "Post Not Found"}</h1>
        <Link to="/blog">
          <Button variant="outline" className="rounded-full">
            <ArrowLeft className="icon-flip-rtl me-2 h-4 w-4" /> {lang === "ar" ? "العودة للمدونة" : "Back to Blog"}
          </Button>
        </Link>
      </div>
    );
  }

  const title = lang === "ar" ? (post.title_ar || post.title) : post.title;
  const content = lang === "ar" ? (post.content_ar || post.content) : post.content;
  const excerpt = lang === "ar" ? (post.excerpt_ar || post.excerpt) : post.excerpt;

  return (
    <>
      <SEO title={title} description={excerpt || undefined} ogImage={post.cover_image_url || undefined} />
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 gradient-brand opacity-5" />
        <div className="container mx-auto px-4 relative max-w-4xl">
          <Link to="/blog">
            <Button variant="ghost" size="sm" className="mb-6 text-muted-foreground">
              <ArrowLeft className="icon-flip-rtl me-2 h-4 w-4" /> {lang === "ar" ? "العودة للمدونة" : "Back to Blog"}
            </Button>
          </Link>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl lg:text-5xl font-bold mb-6 leading-tight"
            style={{ lineHeight: 1.15 }}
          >
            {title}
          </motion.h1>

          {excerpt && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-lg text-muted-foreground mb-6"
            >
              {excerpt}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-4 text-sm text-muted-foreground mb-8"
          >
            {post.author_name && (
              <span className="flex items-center gap-1.5">
                {post.author_avatar_url ? (
                  <img loading="lazy" src={post.author_avatar_url} alt={post.author_name} className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <User className="h-4 w-4" />
                )}
                {post.author_name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {post.published_at ? new Date(post.published_at).toLocaleDateString() : new Date(post.created_at).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> {post.read_time_minutes ?? 5} {t("blog.minRead")}
            </span>
          </motion.div>

          {post.cover_image_url && (
            <motion.img
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              src={post.cover_image_url}
              alt={title}
              className="w-full rounded-2xl mb-10 shadow-lg"
            />
          )}
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {content ? (
            <div className="prose prose-lg dark:prose-invert max-w-none">
              {content.split("\n").map((paragraph, i) => {
                const trimmed = paragraph.trim();
                if (!trimmed) return null;
                if (trimmed.startsWith("## ")) {
                  return <h2 key={i} className="text-2xl font-bold mt-10 mb-4">{trimmed.replace("## ", "")}</h2>;
                }
                if (trimmed.startsWith("### ")) {
                  return <h3 key={i} className="text-xl font-bold mt-8 mb-3">{trimmed.replace("### ", "")}</h3>;
                }
                if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
                  return <p key={i} className="font-bold my-4">{trimmed.replace(/\*\*/g, "")}</p>;
                }
                return <p key={i} className="text-muted-foreground leading-relaxed mb-4">{trimmed}</p>;
              })}
            </div>
          ) : (
            <p className="text-muted-foreground">{lang === "ar" ? "محتوى المقال غير متوفر" : "Content not available"}</p>
          )}

          <div className="mt-12 pt-8 border-t border-border">
            <Link to="/blog">
              <Button variant="outline" className="rounded-full">
                <ArrowLeft className="icon-flip-rtl me-2 h-4 w-4" /> {lang === "ar" ? "العودة للمدونة" : "Back to Blog"}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
