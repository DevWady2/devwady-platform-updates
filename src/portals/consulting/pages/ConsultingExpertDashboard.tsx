/**
 * Consulting — Expert Dashboard (portal version).
 * First-screen: next booking / availability focus → earnings secondary.
 */
import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { StatCardGrid, FocusBlock, ActivityFeed } from "@/core/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { Calendar, Video, ArrowRight, Clock, Eye, Check, X, CalendarPlus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { BOOKING_STATUS_COLORS, formatStatus } from "../constants";
import { useExpertRecord, EXPERT_RECORD_KEY } from "../hooks/useExpertRecord";
import { useWorkspaceEntry } from "@/hooks/useWorkspaceEntry";
import ArrivalHint from "@/components/portal/ArrivalHint";

export default function ConsultingExpertDashboard() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const queryClient = useQueryClient();
  const entry = useWorkspaceEntry();

  const { data: expert, isLoading: loadingExpert } = useExpertRecord();

  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ["consulting-expert-bookings", expert?.id],
    enabled: !!expert,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consulting_bookings")
        .select("*")
        .eq("expert_id", expert!.id)
        .order("booking_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const toggleActive = async () => {
    if (!expert) return;
    const { error } = await supabase.from("consulting_experts").update({ is_active: !expert.is_active }).eq("id", expert.id);
    if (error) toast.error("Failed");
    else {
      toast.success(isAr ? "تم التحديث" : "Updated");
      queryClient.invalidateQueries({ queryKey: [EXPERT_RECORD_KEY] });
    }
  };

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("consulting_bookings").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consulting-expert-bookings"] });
      toast.success(isAr ? "تم تحديث الحالة" : "Status updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const stats = useMemo(() => {
    const confirmed = bookings.filter(b => ["confirmed", "completed"].includes(b.status));
    const paid = bookings.filter(b => b.payment_status === "paid");
    const totalEarnings = paid.reduce((s, b) => s + (Number(b.amount_usd) || 0), 0);
    const rated = bookings.filter(b => b.rating != null);
    const avgRating = rated.length ? (rated.reduce((s, b) => s + (b.rating ?? 0), 0) / rated.length).toFixed(1) : "—";
    return { total: confirmed.length, earnings: totalEarnings, avgRating };
  }, [bookings]);

  const today = format(new Date(), "yyyy-MM-dd");
  const upcoming = bookings
    .filter(b => b.booking_date >= today && ["confirmed", "pending", "payment_pending"].includes(b.status))
    .sort((a, b) => a.booking_date.localeCompare(b.booking_date))
    .slice(0, 5);

  const nextBooking = upcoming[0];
  const pendingCount = upcoming.filter(b => b.status === "pending").length;
  const loading = loadingExpert || loadingBookings;

  const statCards = [
    { label_en: "Total Sessions", label_ar: "إجمالي الجلسات", value: stats.total, icon: "projects" as const, color: "primary" as const },
    { label_en: "Earnings", label_ar: "الأرباح", value: `$${stats.earnings.toLocaleString()}`, icon: "revenue" as const, color: "success" as const },
    { label_en: "Avg Rating", label_ar: "التقييم", value: stats.avgRating, icon: "rating" as const, color: "warning" as const },
  ];

  return (
    <div className="space-y-6">
      <ArrivalHint entry={entry} />

      {/* Expert identity card — compact */}
      {expert && (
        <Card>
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={expert.avatar_url ?? ""} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">{expert.initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold">{isAr ? expert.name_ar : expert.name}</h1>
              <p className="text-xs text-muted-foreground">{isAr ? expert.role_ar : expert.role} · <Badge variant="secondary" className="text-[10px]">{isAr ? expert.track_ar : expert.track}</Badge></p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-lg font-bold text-primary">${expert.session_rate_usd}<span className="text-[10px] text-muted-foreground font-normal">/{isAr ? "جلسة" : "session"}</span></span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">{expert.is_active ? (isAr ? "نشط" : "Active") : (isAr ? "غير نشط" : "Inactive")}</span>
                <Switch checked={expert.is_active ?? false} onCheckedChange={toggleActive} />
              </div>
              <Link to={`/consulting/${expert.slug}`}>
                <Button variant="ghost" size="sm" className="text-xs h-7"><Eye className="h-3.5 w-3.5 me-1" />{isAr ? "عام" : "Public"}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dominant focus: pending bookings or availability */}
      {!loading && (pendingCount > 0 ? (
        <FocusBlock
          icon={Calendar}
          label_en="Action Required"
          label_ar="بحاجة لإجراء"
          title_en={`${pendingCount} booking${pendingCount > 1 ? "s" : ""} awaiting confirmation`}
          title_ar={`${pendingCount} حجز بانتظار التأكيد`}
          action_en="Review Bookings"
          action_ar="مراجعة الحجوزات"
          actionHref="/consulting/portal/bookings"
          accent="warning"
        />
      ) : nextBooking ? (
        <FocusBlock
          icon={Video}
          label_en="Next Session"
          label_ar="الجلسة القادمة"
          title_en={`${nextBooking.guest_name ?? "Client"} — ${nextBooking.booking_date}`}
          title_ar={`${nextBooking.guest_name ?? "عميل"} — ${nextBooking.booking_date}`}
          subtitle_en={`${String(nextBooking.start_time).slice(0, 5)} – ${String(nextBooking.end_time).slice(0, 5)}`}
          subtitle_ar={`${String(nextBooking.start_time).slice(0, 5)} – ${String(nextBooking.end_time).slice(0, 5)}`}
          action_en="View Bookings"
          action_ar="عرض الحجوزات"
          actionHref="/consulting/portal/bookings"
          accent="primary"
        />
      ) : (
        <FocusBlock
          icon={CalendarPlus}
          label_en="Set Availability"
          label_ar="حدد أوقاتك"
          title_en="Configure your available time slots so clients can book sessions"
          title_ar="حدد أوقاتك المتاحة ليتمكن العملاء من حجز الجلسات"
          action_en="Add Availability"
          action_ar="إضافة أوقات"
          actionHref="/consulting/portal/availability"
          accent="primary"
        />
      ))}

      <StatCardGrid stats={statCards} loading={loading} columns={3} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {isAr ? "الجلسات القادمة" : "Upcoming Sessions"}
              </CardTitle>
              <Link to="/consulting/portal/bookings">
                <Button variant="ghost" size="sm" className="text-xs">
                  {isAr ? "عرض الكل" : "View All"}<ArrowRight className="h-3.5 w-3.5 ms-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcoming.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{isAr ? "لا توجد جلسات قادمة" : "No upcoming sessions"}</p>
                </div>
              ) : (
                upcoming.map(b => (
                  <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{b.guest_name ?? (isAr ? "عميل" : "Client")}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {b.booking_date} · {String(b.start_time).slice(0, 5)} – {String(b.end_time).slice(0, 5)}
                      </p>
                    </div>
                    <Badge variant="secondary" className={`text-[10px] ${BOOKING_STATUS_COLORS[b.status] ?? ""}`}>
                      {formatStatus(b.status)}
                    </Badge>
                    {b.meeting_url && b.status === "confirmed" && (
                      <a href={b.meeting_url} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm" className="h-7 text-xs"><Video className="h-3 w-3 me-1" />{isAr ? "انضم" : "Join"}</Button>
                      </a>
                    )}
                    {b.status === "pending" && (
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline" size="sm"
                          className="h-7 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          onClick={(e) => { e.preventDefault(); updateStatus.mutate({ id: b.id, status: "confirmed" }); }}
                          disabled={updateStatus.isPending}
                        >
                          <Check className="h-3 w-3 me-1" />{isAr ? "تأكيد" : "Confirm"}
                        </Button>
                        <Button
                          variant="outline" size="sm"
                          className="h-7 text-xs text-destructive border-destructive/20 hover:bg-destructive/5"
                          onClick={(e) => { e.preventDefault(); updateStatus.mutate({ id: b.id, status: "cancelled" }); }}
                          disabled={updateStatus.isPending}
                        >
                          <X className="h-3 w-3 me-1" />{isAr ? "رفض" : "Decline"}
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <ActivityFeed limit={5} />
        </div>
      </div>
    </div>
  );
}
