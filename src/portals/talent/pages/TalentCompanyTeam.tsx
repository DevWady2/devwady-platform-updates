/**
 * Talent — Company Team management.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader, EmptyState } from "@/core/components";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { formatStatus } from "../constants";

export default function TalentCompanyTeam() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["talent-team", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_team_members")
        .select("*, profiles:member_user_id(full_name, avatar_url, location)")
        .eq("company_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title_en="Team Members"
        title_ar="أعضاء الفريق"
        description_en="Manage your company team and invitations"
        description_ar="إدارة فريق الشركة والدعوات"
        actions={
          <Button size="sm"><Plus className="h-4 w-4 me-1.5" />{isAr ? "دعوة عضو" : "Invite Member"}</Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : members.length === 0 ? (
        <EmptyState
          icon={<UserPlus className="h-12 w-12" />}
          title_en="No team members"
          title_ar="لا يوجد أعضاء فريق"
          description_en="Invite team members to collaborate"
          description_ar="ادعُ أعضاء فريق للتعاون"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map((m: any) => (
            <Card key={m.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-11 w-11">
                  <AvatarImage src={m.profiles?.avatar_url ?? ""} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {(m.profiles?.full_name ?? "?")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.profiles?.full_name ?? "—"}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">{formatStatus(m.role)}</Badge>
                    {m.accepted_at ? (
                      <span>{isAr ? "انضم" : "Joined"} {formatDistanceToNow(new Date(m.accepted_at), { addSuffix: true })}</span>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-600">{isAr ? "بانتظار القبول" : "Pending"}</Badge>
                    )}
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
