/**
 * Consulting — Session History (completed sessions for clients).
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader, EmptyState } from "@/core/components";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Clock, Star, DollarSign } from "lucide-react";

export default function ConsultingHistory() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["consulting-client-history", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consulting_bookings")
        .select("*, consulting_experts(name, name_ar, initials, track)")
        .eq("user_id", user!.id)
        .eq("status", "completed")
        .order("booking_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title_en="Session History"
        title_ar="سجل الجلسات"
        description_en="Your past completed consulting sessions"
        description_ar="جلساتك الاستشارية المكتملة السابقة"
      />

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={<History className="h-12 w-12" />}
          title_en="No session history"
          title_ar="لا يوجد سجل جلسات"
          description_en="Completed sessions will appear here"
          description_ar="ستظهر الجلسات المكتملة هنا"
        />
      ) : (
        <div className="space-y-3">
          {sessions.map((b: any) => (
            <Card key={b.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                    {b.consulting_experts?.initials ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{isAr ? b.consulting_experts?.name_ar : b.consulting_experts?.name}</p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{b.booking_date}</span>
                      {b.amount_usd && <span className="flex items-center gap-0.5"><DollarSign className="h-3 w-3" />${b.amount_usd}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-600">
                      {isAr ? "مكتمل" : "Completed"}
                    </Badge>
                    {b.rating && (
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: b.rating }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {b.review && (
                  <p className="text-xs text-muted-foreground mt-2 ps-14 line-clamp-2">{b.review}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
