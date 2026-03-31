/**
 * Consulting — Expert Earnings overview with correct date boundaries.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader, StatCardGrid } from "@/core/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Calendar, Download } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isWithinInterval } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { downloadCSV } from "@/lib/csvExport";
import { useExpertRecord } from "../hooks/useExpertRecord";

export default function ConsultingEarnings() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const { data: expert } = useExpertRecord();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["consulting-earnings-bookings", expert?.id],
    enabled: !!expert,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consulting_bookings")
        .select("id, booking_date, amount_usd, payment_status, status, guest_name, created_at")
        .eq("expert_id", expert!.id)
        .eq("payment_status", "paid")
        .order("booking_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { totalEarnings, thisMonthEarnings, monthlyData } = useMemo(() => {
    const total = bookings.reduce((s, b) => s + (Number(b.amount_usd) || 0), 0);
    const now = new Date();
    const currentInterval = { start: startOfMonth(now), end: endOfMonth(now) };
    const thisMonth = bookings
      .filter(b => isWithinInterval(parseISO(b.booking_date), currentInterval))
      .reduce((s, b) => s + (Number(b.amount_usd) || 0), 0);

    const months: { month: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(now, i);
      const interval = { start: startOfMonth(m), end: endOfMonth(m) };
      const amount = bookings
        .filter(b => isWithinInterval(parseISO(b.booking_date), interval))
        .reduce((s, b) => s + (Number(b.amount_usd) || 0), 0);
      months.push({ month: format(m, "MMM"), amount });
    }
    return { totalEarnings: total, thisMonthEarnings: thisMonth, monthlyData: months };
  }, [bookings]);

  const stats = [
    { label_en: "Total Earnings", label_ar: "إجمالي الأرباح", value: `$${totalEarnings.toLocaleString()}`, icon: "revenue" as const, color: "success" as const },
    { label_en: "This Month", label_ar: "هذا الشهر", value: `$${thisMonthEarnings.toLocaleString()}`, icon: "chart" as const, color: "primary" as const },
    { label_en: "Paid Sessions", label_ar: "جلسات مدفوعة", value: bookings.length, icon: "projects" as const, color: "warning" as const },
    { label_en: "Rate", label_ar: "السعر", value: `$${expert?.session_rate_usd ?? 0}`, icon: "revenue" as const, color: "muted" as const },
  ];

  const handleExport = () => {
    const rows = bookings.map(b => ({
      Date: b.booking_date,
      Client: b.guest_name ?? "—",
      Amount: b.amount_usd,
      Status: b.status,
      Payment: b.payment_status,
    }));
    downloadCSV(rows, "consulting-earnings");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title_en="Earnings"
        title_ar="الأرباح"
        description_en="Track your consulting session earnings"
        description_ar="تتبع أرباح جلساتك الاستشارية"
        actions={
          <Button variant="outline" size="sm" onClick={handleExport} disabled={bookings.length === 0}>
            <Download className="h-4 w-4 me-1.5" />{isAr ? "تصدير CSV" : "Export CSV"}
          </Button>
        }
      />

      <StatCardGrid stats={stats} loading={isLoading} />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {isAr ? "الأرباح الشهرية" : "Monthly Earnings"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip formatter={(v: number) => [`$${v}`, isAr ? "الأرباح" : "Earnings"]} />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{isAr ? "آخر المدفوعات" : "Recent Payments"}</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{isAr ? "لا توجد مدفوعات بعد" : "No payments yet"}</p>
          ) : (
            <div className="space-y-2">
              {bookings.slice(0, 10).map(b => (
                <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-lg border">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{b.guest_name ?? "Client"}</p>
                    <p className="text-[10px] text-muted-foreground">{b.booking_date}</p>
                  </div>
                  <span className="text-sm font-medium text-primary">${b.amount_usd}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
