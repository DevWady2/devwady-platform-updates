/**
 * Consulting — Expert Bookings management with status update actions.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader, SearchFilterBar, EmptyState } from "@/core/components";
import { useSearch } from "@/core/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Video, Clock, DollarSign, Star, Loader2, Check, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { BOOKING_STATUS_COLORS, PAYMENT_STATUS_COLORS, formatStatus } from "../constants";
import { useExpertRecord } from "../hooks/useExpertRecord";

const BOOKINGS_KEY = "consulting-bookings-all";

export default function ConsultingBookings() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const search = useSearch();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("all");
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [meetingUrl, setMeetingUrl] = useState("");

  const { data: expert } = useExpertRecord();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: [BOOKINGS_KEY, expert?.id],
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

  const invalidateBookings = () => queryClient.invalidateQueries({ queryKey: [BOOKINGS_KEY] });

  const saveMeeting = useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase.from("consulting_bookings").update({ meeting_url: meetingUrl }).eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateBookings();
      toast.success(isAr ? "تم حفظ الرابط" : "Meeting link saved");
      setEditingMeetingId(null);
      setMeetingUrl("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("consulting_bookings").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateBookings();
      toast.success(isAr ? "تم تحديث الحالة" : "Status updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const filtered = bookings.filter(b => {
    if (tab === "upcoming") return ["confirmed", "pending", "payment_pending"].includes(b.status);
    if (tab === "completed") return b.status === "completed";
    if (tab === "cancelled") return b.status === "cancelled";
    return true;
  }).filter(b => {
    if (!search.params.query) return true;
    const q = search.params.query.toLowerCase();
    return (b.guest_name ?? "").toLowerCase().includes(q) || (b.guest_email ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title_en="Session Bookings"
        title_ar="حجوزات الجلسات"
        description_en="Manage your consulting session bookings"
        description_ar="إدارة حجوزات جلساتك الاستشارية"
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">{isAr ? "الكل" : "All"} ({bookings.length})</TabsTrigger>
          <TabsTrigger value="upcoming">{isAr ? "القادمة" : "Upcoming"}</TabsTrigger>
          <TabsTrigger value="completed">{isAr ? "مكتملة" : "Completed"}</TabsTrigger>
          <TabsTrigger value="cancelled">{isAr ? "ملغاة" : "Cancelled"}</TabsTrigger>
        </TabsList>
      </Tabs>

      <SearchFilterBar
        query={search.params.query ?? ""}
        onQueryChange={search.setQuery}
        placeholder_en="Search by client name or email..."
        placeholder_ar="بحث بالاسم أو البريد..."
      />

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-12 w-12" />}
          title_en="No bookings found"
          title_ar="لا توجد حجوزات"
          description_en="Bookings will appear here when clients book sessions"
          description_ar="ستظهر الحجوزات عندما يحجز العملاء جلسات"
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(b => (
            <Card key={b.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">{b.guest_name ?? (isAr ? "عميل" : "Client")}</p>
                      {b.guest_email && <span className="text-[10px] text-muted-foreground">{b.guest_email}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{b.booking_date} · {String(b.start_time).slice(0, 5)} – {String(b.end_time).slice(0, 5)}</span>
                      {b.amount_usd && <span className="flex items-center gap-0.5"><DollarSign className="h-3 w-3" />${b.amount_usd}</span>}
                      {b.rating && <span className="flex items-center gap-0.5"><Star className="h-3 w-3" />{b.rating}/5</span>}
                    </div>

                    {/* Meeting URL management */}
                    {b.status === "confirmed" && !b.meeting_url && (
                      editingMeetingId === b.id ? (
                        <div className="flex gap-2 mt-2">
                          <Input placeholder="https://meet.google.com/..." value={meetingUrl} onChange={e => setMeetingUrl(e.target.value)} className="text-xs h-8 flex-1" />
                          <Button size="sm" className="h-8 text-xs" onClick={() => saveMeeting.mutate(b.id)} disabled={saveMeeting.isPending}>
                            {saveMeeting.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : (isAr ? "حفظ" : "Save")}
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" className="mt-1 text-xs h-7" onClick={() => { setEditingMeetingId(b.id); setMeetingUrl(""); }}>
                          <Video className="h-3 w-3 me-1" />{isAr ? "أضف رابط الاجتماع" : "Add meeting link"}
                        </Button>
                      )
                    )}
                    {b.meeting_url && (
                      <a href={b.meeting_url} target="_blank" rel="noreferrer" className="mt-1 inline-block">
                        <Button size="sm" variant="outline" className="text-xs h-7"><Video className="h-3 w-3 me-1" />{isAr ? "رابط الاجتماع" : "Meeting Link"}</Button>
                      </a>
                    )}

                    {/* Status actions */}
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {b.status === "pending" && (
                        <>
                          <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => updateStatus.mutate({ id: b.id, status: "confirmed" })} disabled={updateStatus.isPending}>
                            <Check className="h-3 w-3 me-1" />{isAr ? "تأكيد" : "Confirm"}
                          </Button>
                          <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => updateStatus.mutate({ id: b.id, status: "cancelled" })} disabled={updateStatus.isPending}>
                            <X className="h-3 w-3 me-1" />{isAr ? "رفض" : "Decline"}
                          </Button>
                        </>
                      )}
                      {b.status === "confirmed" && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateStatus.mutate({ id: b.id, status: "completed" })} disabled={updateStatus.isPending}>
                          <CheckCircle2 className="h-3 w-3 me-1" />{isAr ? "إكمال" : "Complete"}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <Badge variant="secondary" className={`text-[10px] ${BOOKING_STATUS_COLORS[b.status] ?? ""}`}>
                      {formatStatus(b.status)}
                    </Badge>
                    {b.payment_status && (
                      <Badge variant="outline" className={`text-[10px] ${PAYMENT_STATUS_COLORS[b.payment_status] ?? ""}`}>
                        {formatStatus(b.payment_status)}
                      </Badge>
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
