import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Building2, MapPin, Star, CheckCircle2, Briefcase } from "lucide-react";

export default function Companies() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["companies-directory"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("is_public", true)
        .order("total_hires", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <>
      <SEO title={isAr ? "الشركات" : "Companies"} description={isAr ? "تصفح الشركات على المنصة" : "Browse companies on the platform"} />
      <section className="max-w-6xl mx-auto py-10 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Building2 className="h-7 w-7 text-primary" />
            {isAr ? "الشركات" : "Companies"}
          </h1>
          <p className="text-muted-foreground mb-8">{isAr ? "تصفح الشركات الموثوقة على المنصة" : "Browse verified companies on the platform"}</p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>{isAr ? "لا توجد شركات بعد" : "No companies yet"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((c, i) => {
              const avg = Number(c.avg_rating) || 0;
              return (
                <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link to={`/companies/${c.slug || c.id}`}>
                    <Card className="p-5 hover:border-primary/30 transition-colors h-full">
                      <div className="flex items-start gap-3 mb-3">
                        {c.logo_url ? (
                          <img loading="lazy" src={c.logo_url} alt={c.company_name} className="h-12 w-12 rounded-xl object-cover border border-border" />
                        ) : (
                          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold truncate">{c.company_name}</h3>
                            {c.is_verified && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                          </div>
                          {c.industry && <p className="text-xs text-muted-foreground">{c.industry}</p>}
                        </div>
                      </div>
                      {(isAr ? c.tagline_ar : c.tagline) && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{isAr ? c.tagline_ar : c.tagline}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {c.location && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{c.location}</span>}
                        {avg > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" /> {avg.toFixed(1)}
                          </span>
                        )}
                        {(c.total_hires || 0) > 0 && (
                          <span className="flex items-center gap-0.5"><Briefcase className="h-3 w-3" />{c.total_hires} {isAr ? "توظيف" : "hires"}</span>
                        )}
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
