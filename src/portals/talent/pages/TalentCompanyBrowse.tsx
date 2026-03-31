/**
 * Talent — Browse Talent pool.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader, SearchFilterBar, EmptyState } from "@/core/components";
import { useSearch } from "@/core/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Heart, MapPin, Star } from "lucide-react";
import { toast } from "sonner";

export default function TalentCompanyBrowse() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const search = useSearch();
  const queryClient = useQueryClient();

  const { data: talents = [], isLoading } = useQuery({
    queryKey: ["talent-browse-pool", search.params.query],
    queryFn: async () => {
      const query = search.params.query || null;
      const { data, error } = await supabase.rpc("get_public_profiles_browse" as any, { p_search: query });
      if (error) throw error;
      return ((data as any[]) ?? []).filter((t: any) => t.is_available === true);
    },
  });

  const { data: shortlistedIds = [] } = useQuery({
    queryKey: ["talent-shortlist-ids", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("freelancer_shortlists")
        .select("freelancer_user_id")
        .eq("company_user_id", user!.id);
      return (data ?? []).map((s) => s.freelancer_user_id);
    },
  });

  const toggleShortlist = useMutation({
    mutationFn: async (talentUserId: string) => {
      const isShortlisted = shortlistedIds.includes(talentUserId);
      if (isShortlisted) {
        await supabase.from("freelancer_shortlists")
          .delete()
          .eq("company_user_id", user!.id)
          .eq("freelancer_user_id", talentUserId);
      } else {
        await supabase.from("freelancer_shortlists")
          .insert({ company_user_id: user!.id, freelancer_user_id: talentUserId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["talent-shortlist-ids"] });
      toast.success(isAr ? "تم التحديث" : "Updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title_en="Browse Talent"
        title_ar="تصفح المواهب"
        description_en="Find and shortlist candidates for your positions"
        description_ar="ابحث عن مرشحين وأضفهم للقائمة المختصرة"
      />

      <SearchFilterBar
        query={search.params.query ?? ""}
        onQueryChange={search.setQuery}
        placeholder_en="Search by name or skill..."
        placeholder_ar="بحث بالاسم أو المهارة..."
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-40 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : talents.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title_en="No talent found"
          title_ar="لم يتم العثور على مواهب"
          description_en="Try adjusting your search criteria"
          description_ar="حاول تعديل معايير البحث"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {talents.map((t) => {
            const isShortlisted = shortlistedIds.includes(t.user_id);
            return (
              <Card key={t.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={t.avatar_url ?? ""} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {(t.full_name ?? "?")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{t.full_name ?? "—"}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        {t.location && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{t.location}</span>}
                        {t.rating && <span className="flex items-center gap-0.5"><Star className="h-3 w-3 text-amber-500" />{t.rating}</span>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => toggleShortlist.mutate(t.user_id)}
                    >
                      <Heart className={`h-4 w-4 ${isShortlisted ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
                    </Button>
                  </div>

                  {t.bio && <p className="text-xs text-muted-foreground line-clamp-2">{t.bio}</p>}

                  {t.skills && t.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {t.skills.slice(0, 5).map((s) => (
                        <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                      ))}
                      {t.skills.length > 5 && <Badge variant="outline" className="text-[10px]">+{t.skills.length - 5}</Badge>}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    {t.hourly_rate && <span className="text-xs font-medium text-primary">{t.hourly_rate}/hr</span>}
                    <Badge variant={t.is_available ? "default" : "secondary"} className="text-[10px]">
                      {t.is_available ? (isAr ? "متاح" : "Available") : (isAr ? "غير متاح" : "Unavailable")}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
