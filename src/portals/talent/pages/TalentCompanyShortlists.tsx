/**
 * Talent — Company Shortlists.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader, EmptyState } from "@/core/components";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Trash2, Send, MapPin, Star } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function TalentCompanyShortlists() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: shortlists = [], isLoading } = useQuery({
    queryKey: ["talent-shortlists-full", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("freelancer_shortlists")
        .select("*, profiles:freelancer_user_id(full_name, avatar_url, skills, location, rating, hourly_rate, bio)")
        .eq("company_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("freelancer_shortlists").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["talent-shortlists-full"] });
      queryClient.invalidateQueries({ queryKey: ["talent-shortlist-ids"] });
      toast.success(isAr ? "تمت الإزالة" : "Removed");
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title_en="Shortlisted Candidates"
        title_ar="المرشحون المختصرون"
        description_en="Your saved candidates for quick access"
        description_ar="المرشحون المحفوظون للوصول السريع"
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-36 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : shortlists.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-12 w-12" />}
          title_en="No shortlisted candidates"
          title_ar="لا يوجد مرشحون مختصرون"
          description_en="Browse the talent pool to shortlist candidates"
          description_ar="تصفح المواهب لإضافة مرشحين"
          actionLabel_en="Browse Talent"
          actionLabel_ar="تصفح المواهب"
          onAction={() => navigate("/talent/portal/company/browse")}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shortlists.map((s: any) => (
            <Card key={s.id}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Avatar className="h-11 w-11">
                    <AvatarImage src={s.profiles?.avatar_url ?? ""} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {(s.profiles?.full_name ?? "?")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{s.profiles?.full_name ?? "—"}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      {s.profiles?.location && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{s.profiles.location}</span>}
                      {s.profiles?.rating && <span className="flex items-center gap-0.5"><Star className="h-3 w-3 text-amber-500" />{s.profiles.rating}</span>}
                      {s.profiles?.hourly_rate && <span>{s.profiles.hourly_rate}/hr</span>}
                    </div>
                  </div>
                </div>

                {s.profiles?.bio && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{s.profiles.bio}</p>}

                {s.profiles?.skills && s.profiles.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {s.profiles.skills.slice(0, 5).map((sk: string) => (
                      <Badge key={sk} variant="secondary" className="text-[10px]">{sk}</Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-2 border-t">
                  <span className="text-[10px] text-muted-foreground">
                    {isAr ? "أضيف" : "Added"} {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                  </span>
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => remove.mutate(s.id)}>
                      <Trash2 className="h-3 w-3 me-1" />{isAr ? "إزالة" : "Remove"}
                    </Button>
                    <Button size="sm" className="text-xs h-7">
                      <Send className="h-3 w-3 me-1" />{isAr ? "طلب توظيف" : "Hire"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
