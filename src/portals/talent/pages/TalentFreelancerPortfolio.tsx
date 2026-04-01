/**
 * Talent — Freelancer Portfolio page.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader, EmptyState } from "@/core/components";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FolderOpen, ExternalLink, Plus } from "lucide-react";

export default function TalentFreelancerPortfolio() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["talent-freelancer-portfolio", user?.id],
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
    <div className="space-y-6">
      <PageHeader
        title_en="My Portfolio"
        title_ar="أعمالي"
        description_en="Showcase your best work to employers"
        description_ar="اعرض أفضل أعمالك لأصحاب العمل"
        actions={
          <Link to="/profile/portfolio">
            <Button size="sm"><Plus className="h-4 w-4 me-1.5" />{isAr ? "إضافة مشروع" : "Add Project"}</Button>
          </Link>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => <div key={i} className="h-40 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="h-12 w-12" />}
          title_en="No portfolio items"
          title_ar="لا توجد أعمال"
          description_en="Add projects to showcase your expertise"
          description_ar="أضف مشاريع لعرض خبراتك"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-2">
                {p.thumbnail_url && (
                  <img src={p.thumbnail_url} alt={p.title} className="w-full h-32 object-cover rounded-lg" />
                )}
                <h3 className="font-medium text-sm">{p.title}</h3>
                {p.description && <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>}
                {p.technologies && p.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.technologies.map((t) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
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
  );
}
