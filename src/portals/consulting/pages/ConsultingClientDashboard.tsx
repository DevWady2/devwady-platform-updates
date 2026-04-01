/**
 * Consulting — Client Dashboard.
 * First-screen: next session focus → booking continuity → browse experts.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader, StatCardGrid, FocusBlock, ActivityFeed } from "@/core/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, Clock, Star, ArrowRight, Search, Video } from "lucide-react";
import { BOOKING_STATUS_COLORS, formatStatus } from "../constants";
import { useWorkspaceEntry } from "@/hooks/useWorkspaceEntry";
import ArrivalHint from "@/components/portal/ArrivalHint";

export default function ConsultingClientDashboard() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const entry = useWorkspaceEntry();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["consulting-client-bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consulting_bookings")
        .select("*, consulting_experts(name, name_ar, avatar_url, initials, track)")
        .eq("user_id", user!.id)
        .order("booking_date", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const upcoming = bookings.filter(b => ["confirmed", "pending", "payment_pending"].includes(b.status));
  const completed = bookings.filter(b => b.status === "completed");
  const nextSession = upcoming.sort((a, b) => a.booking_date.localeCompare(b.booking_date))[0];

  const stats = [
    { label_en: "Upcoming", label_ar: "القادمة", value: upcoming.length, icon: "calendar" as const, color: "primary" as const },
    { label_en: "Completed", label_ar: "مكتملة", value: completed.length, icon: "chart" as const, color: "success" as const },
    { label_en: "Total Sessions", label_ar: "إجمالي الجلسات", value: bookings.length, icon: "projects" as const, color: "muted" as const },
  ];

  return (
    <div className="space-y-6">
      <ArrivalHint entry={entry} />
      <PageHeader
        title_en="My Consulting"
        title_ar="استشاراتي"
        description_en="Your expert consulting sessions and history"
        description_ar="جلساتك الاستشارية مع الخبراء وسجلك"
        actions={
          <Link to="/consulting">
            <Button size="sm"><Search className="h-4 w-4 me-1.5" />{isAr ? "تصفح الخبراء" : "Browse Experts"}</Button>
          </Link>
        }
      />

      {/* Dominant focus: next session or book first */}
      {!isLoading && (nextSession ? (
        <FocusBlock
          icon={Video}
          label_en="Upcoming Session"
          label_ar="الجلسة القادمة"
          title_en={`${isAr ? (nextSession as any).consulting_experts?.name_ar : (nextSession as any).consulting_experts?.name} — ${nextSession.booking_date}`}
          title_ar={`${(nextSession as any).consulting_experts?.name_ar ?? (nextSession as any).consulting_experts?.name} — ${nextSession.booking_date}`}
          subtitle_en={`${String(nextSession.start_time).slice(0, 5)} · ${formatStatus(nextSession.status)}`}
          subtitle_ar={`${String(nextSession.start_time).slice(0, 5)} · ${formatStatus(nextSession.status)}`}
          action_en="View Session"
          action_ar="عرض الجلسة"
          actionHref="/consulting/portal/sessions"
          accent="primary"
        />
      ) : bookings.length === 0 ? (
        <FocusBlock
          icon={Calendar}
          label_en="Get Started"
          label_ar="ابدأ الآن"
          title_en="Book your first expert consultation"
          title_ar="احجز أول استشارة مع خبير"
          subtitle_en="Browse available specialists and find the right advisor"
          subtitle_ar="تصفح المتخصصين المتاحين وجد المستشار المناسب"
          action_en="Browse Experts"
          action_ar="تصفح الخبراء"
          actionHref="/consulting"
          accent="primary"
        />
      ) : null)}

      <StatCardGrid stats={stats} loading={isLoading} columns={3} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {isAr ? "جلساتي القادمة" : "Upcoming Sessions"}
              </CardTitle>
              <Link to="/consulting/portal/sessions">
                <Button variant="ghost" size="sm" className="text-xs">
                  {isAr ? "عرض الكل" : "View All"}<ArrowRight className="h-3.5 w-3.5 ms-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {isAr ? "لا توجد جلسات قادمة" : "No upcoming sessions"}
                </p>
              ) : (
                upcoming.slice(0, 5).map((b: any) => (
                  <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                      {b.consulting_experts?.initials ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {isAr ? b.consulting_experts?.name_ar : b.consulting_experts?.name ?? "Expert"}
                      </p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {b.booking_date} · {String(b.start_time).slice(0, 5)}
                      </p>
                    </div>
                    <Badge variant="secondary" className={`text-[10px] ${BOOKING_STATUS_COLORS[b.status] ?? ""}`}>
                      {formatStatus(b.status)}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {completed.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  {isAr ? "آخر الجلسات المكتملة" : "Recent Completed"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {completed.slice(0, 3).map((b: any) => (
                  <div key={b.id} className="p-2.5 rounded-lg border">
                    <p className="text-sm font-medium truncate">{isAr ? b.consulting_experts?.name_ar : b.consulting_experts?.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">{b.booking_date}</span>
                      {b.rating && (
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: b.rating }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          <ActivityFeed limit={5} />
        </div>
      </div>
    </div>
  );
}
