/**
 * Standalone "My Portfolio" page for freelancers (website-first UX).
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FolderOpen, ExternalLink, Plus, ArrowLeft } from "lucide-react";

export default function MyPortfolio() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["my-portfolio-page", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("freelancer_portfolio")
        .select("*")
        .eq("user_id", user!.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <>
      <SEO title={isAr ? "أعمالي" : "My Portfolio"} description={isAr ? "اعرض أفضل أعمالك" : "Showcase your best work"} />
      <section className="py-10">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link to="/hiring" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
                <ArrowLeft className="h-3 w-3 icon-flip-rtl" /> {isAr ? "العودة للوظائف" : "Back to Jobs"}
              </Link>
              <h1 className="text-2xl font-bold">{isAr ? "أعمالي" : "My Portfolio"}</h1>
              <p className="text-sm text-muted-foreground mt-1">{isAr ? "اعرض أفضل أعمالك لأصحاب العمل" : "Showcase your best work to employers"}</p>
            </div>
            <Link to="/profile/portfolio">
              <Button size="sm" className="rounded-full">
                <Plus className="h-4 w-4 me-1.5" />{isAr ? "إضافة مشروع" : "Add Project"}
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => <div key={i} className="h-40 bg-muted rounded-lg animate-pulse" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <FolderOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-medium">{isAr ? "لا توجد أعمال" : "No portfolio items"}</p>
              <p className="text-sm text-muted-foreground mt-1">{isAr ? "أضف مشاريع لعرض خبراتك" : "Add projects to showcase your expertise"}</p>
              <Link to="/profile/portfolio">
                <Button variant="outline" size="sm" className="mt-4 rounded-full">
                  <Plus className="h-3.5 w-3.5 me-1" />{isAr ? "إضافة مشروع" : "Add Project"}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((p: any) => (
                <Card key={p.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5 space-y-2">
                    {p.thumbnail_url && (
                      <img src={p.thumbnail_url} alt={p.title} className="w-full h-32 object-cover rounded-lg" />
                    )}
                    <h3 className="font-medium text-sm">{isAr ? (p.title_ar || p.title) : p.title}</h3>
                    {p.description && <p className="text-xs text-muted-foreground line-clamp-2">{isAr ? (p.description_ar || p.description) : p.description}</p>}
                    {p.technologies && p.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {p.technologies.map((t: string) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      {p.project_url && (
                        <a href={p.project_url} target="_blank" rel="noreferrer">
                          <Button variant="outline" size="sm" className="text-xs h-7">
                            <ExternalLink className="h-3 w-3 me-1" />{isAr ? "عرض" : "View"}
                          </Button>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
