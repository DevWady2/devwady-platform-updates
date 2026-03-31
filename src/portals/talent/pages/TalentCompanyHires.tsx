/**
 * Talent — Hire Requests (staffing requests from company).
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader, EmptyState } from "@/core/components";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Clock, DollarSign } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { HIRE_STATUS_COLORS, formatStatus } from "../constants";

export default function TalentCompanyHires() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const { data: companyProfile } = useQuery({
    queryKey: ["talent-company-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("company_profiles").select("id").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: hires = [], isLoading } = useQuery({
    queryKey: ["talent-hire-requests", companyProfile?.id],
    enabled: !!companyProfile,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hire_requests")
        .select("*, profiles:freelancer_profile_id(full_name, avatar_url)")
        .eq("company_id", companyProfile!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title_en="Hire Requests"
        title_ar="طلبات التوظيف"
        description_en="Track your staffing and hire requests"
        description_ar="تتبع طلبات التوظيف والتعاقد"
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : hires.length === 0 ? (
        <EmptyState
          icon={<Send className="h-12 w-12" />}
          title_en="No hire requests"
          title_ar="لا توجد طلبات توظيف"
          description_en="Send hire requests from the talent pool or shortlist"
          description_ar="أرسل طلبات توظيف من المواهب أو القائمة المختصرة"
        />
      ) : (
        <div className="space-y-3">
          {hires.map((h: any) => (
            <Card key={h.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                    {(h.profiles?.full_name ?? "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{h.title ?? (isAr ? "طلب توظيف" : "Hire Request")}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {h.profiles?.full_name ?? "—"} · {formatDistanceToNow(new Date(h.created_at), { addSuffix: true })}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                      {h.budget_range && <span className="flex items-center gap-0.5"><DollarSign className="h-3 w-3" />{h.budget_range}</span>}
                      {h.duration && <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{h.duration}</span>}
                    </div>
                  </div>
                  <Badge variant="secondary" className={`text-[10px] ${HIRE_STATUS_COLORS[h.status] ?? ""}`}>
                    {formatStatus(h.status)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
