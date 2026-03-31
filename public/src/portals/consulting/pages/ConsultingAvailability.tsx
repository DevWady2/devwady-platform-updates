/**
 * Consulting — Expert Availability management.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader } from "@/core/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { DAY_NAMES_EN, DAY_NAMES_AR } from "../constants";
import { useExpertRecord } from "../hooks/useExpertRecord";

const AVAILABILITY_KEY = "consulting-availability";

export default function ConsultingAvailability() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const queryClient = useQueryClient();
  const dayNames = isAr ? DAY_NAMES_AR : DAY_NAMES_EN;
  const [newSlot, setNewSlot] = useState({ day: 0, start: "09:00", end: "17:00" });

  const { data: expert } = useExpertRecord();

  const { data: slots = [] } = useQuery({
    queryKey: [AVAILABILITY_KEY, expert?.id],
    enabled: !!expert,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expert_availability")
        .select("*")
        .eq("expert_id", expert!.id)
        .order("day_of_week")
        .order("start_time");
      if (error) throw error;
      return data ?? [];
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [AVAILABILITY_KEY] });

  const addSlot = useMutation({
    mutationFn: async () => {
      if (newSlot.start >= newSlot.end) throw new Error(isAr ? "وقت البدء يجب أن يكون قبل وقت الانتهاء" : "Start time must be before end time");
      const { error } = await supabase.from("expert_availability").insert({
        expert_id: expert!.id,
        day_of_week: newSlot.day,
        start_time: newSlot.start,
        end_time: newSlot.end,
        is_recurring: true,
      });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success(isAr ? "تمت الإضافة" : "Slot added"); },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeSlot = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expert_availability").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success(isAr ? "تمت الإزالة" : "Removed"); },
  });

  const toggleSlot = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("expert_availability").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const grouped = Array.from({ length: 7 }, (_, i) => ({
    day: i,
    slots: slots.filter(s => s.day_of_week === i),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title_en="Availability"
        title_ar="التوافر"
        description_en="Set your weekly recurring availability for bookings"
        description_ar="حدد أوقات توافرك الأسبوعية للحجوزات"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {isAr ? "إضافة فترة توافر" : "Add Availability Slot"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">{isAr ? "اليوم" : "Day"}</label>
              <select
                value={newSlot.day}
                onChange={e => setNewSlot(p => ({ ...p, day: Number(e.target.value) }))}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {dayNames.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">{isAr ? "من" : "From"}</label>
              <Input type="time" value={newSlot.start} onChange={e => setNewSlot(p => ({ ...p, start: e.target.value }))} className="w-32 h-9" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">{isAr ? "إلى" : "To"}</label>
              <Input type="time" value={newSlot.end} onChange={e => setNewSlot(p => ({ ...p, end: e.target.value }))} className="w-32 h-9" />
            </div>
            <Button size="sm" onClick={() => addSlot.mutate()} disabled={addSlot.isPending || !expert}>
              <Plus className="h-3.5 w-3.5 me-1" />{isAr ? "إضافة" : "Add"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {grouped.map(({ day, slots: daySlots }) => (
          <Card key={day}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">{dayNames[day]}</h3>
                <Badge variant="secondary" className="text-[10px]">{daySlots.length} {isAr ? "فترة" : "slots"}</Badge>
              </div>
              {daySlots.length === 0 ? (
                <p className="text-xs text-muted-foreground">{isAr ? "لا توجد فترات" : "No slots configured"}</p>
              ) : (
                <div className="space-y-1.5">
                  {daySlots.map(s => (
                    <div key={s.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm flex-1">{String(s.start_time).slice(0, 5)} – {String(s.end_time).slice(0, 5)}</span>
                      <Switch
                        checked={s.is_active ?? true}
                        onCheckedChange={(checked) => toggleSlot.mutate({ id: s.id, is_active: checked })}
                      />
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeSlot.mutate(s.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
