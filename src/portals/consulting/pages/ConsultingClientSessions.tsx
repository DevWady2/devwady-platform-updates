/**
 * Consulting — Client Sessions (My Bookings).
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader, EmptyState } from "@/core/components";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Clock, Video, Star, Search, DollarSign } from "lucide-react";
import { BOOKING_STATUS_COLORS, PAYMENT_STATUS_COLORS, formatStatus } from "../constants";

export default function ConsultingClientSessions() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const navigate = useNavigate();
  const [tab, setTab] = useState("all");

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["consulting-client-all-sessions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consulting_bookings")
        .select("*, consulting_experts(name, name_ar, initials, track, slug)")
        .eq("user_id", user!.id)
        .order("booking_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const upcomingCount = bookings.filter(b => ["confirmed", "pending", "payment_pending"].includes(b.status)).length;
  const completedCount = bookings.filter(b => b.status === "completed").length;

  const filtered = bookings.filter(b => {
    if (tab === "upcoming") return ["confirmed", "pending", "payment_pending"].includes(b.status);
    if (tab === "completed") return b.status === "completed";
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title_en="My Sessions"
        title_ar="جلساتي"
        description_en="All your consulting session bookings"
        description_ar="جميع حجوزات جلساتك الاستشارية"
        actions={
          <Link to="/consulting">
            <Button size="sm"><Search className="h-4 w-4 me-1.5" />{isAr ? "تصفح الخبراء" : "Browse Experts"}</Button>
          </Link>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">{isAr ? "الكل" : "All"} ({bookings.length})</TabsTrigger>
          <TabsTrigger value="upcoming">{isAr ? "القادمة" : "Upcoming"} ({upcomingCount})</TabsTrigger>
          <TabsTrigger value="completed">{isAr ? "مكتملة" : "Completed"} ({completedCount})</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-12 w-12" />}
          title_en="No sessions yet"
          title_ar="لا توجد جلسات بعد"
          description_en="Browse our experts and book your first consultation"
          description_ar="تصفح خبراءنا واحجز أول استشارة"
          actionLabel_en="Browse Experts"
          actionLabel_ar="تصفح الخبراء"
          onAction={() => navigate("/consulting")}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((b: any) => (
            <Card key={b.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                    {b.consulting_experts?.initials ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link to={`/consulting/${b.consulting_experts?.slug}`} className="text-sm font-medium hover:text-primary transition-colors">
                        {isAr ? b.consulting_experts?.name_ar : b.consulting_experts?.name ?? "Expert"}
                      </Link>
                      <span className="text-[10px] text-muted-foreground">{b.consulting_experts?.track}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{b.booking_date} · {String(b.start_time).slice(0, 5)}</span>
                      {b.amount_usd && <span className="flex items-center gap-0.5"><DollarSign className="h-3 w-3" />${b.amount_usd}</span>}
                    </div>
                    {b.meeting_url && b.status === "confirmed" && (
                      <a href={b.meeting_url} target="_blank" rel="noreferrer" className="mt-1 inline-block">
                        <Button variant="outline" size="sm" className="text-xs h-7"><Video className="h-3 w-3 me-1" />{isAr ? "انضم" : "Join"}</Button>
                      </a>
                    )}
                    {b.rating && (
                      <div className="flex items-center gap-0.5 mt-1">
                        {Array.from({ length: b.rating }).map((_, i) => <Star key={i} className="h-3 w-3 fill-primary text-primary" />)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <Badge variant="secondary" className={`text-[10px] ${BOOKING_STATUS_COLORS[b.status] ?? ""}`}>
                      {formatStatus(b.status)}
                    </Badge>
                    <Badge variant="outline" className={`text-[10px] ${PAYMENT_STATUS_COLORS[b.payment_status] ?? ""}`}>
                      {formatStatus(b.payment_status ?? "unpaid")}
                    </Badge>
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
