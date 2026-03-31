/**
 * Backoffice — Analytics & Reports with real page view and revenue data.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader, StatCardGrid } from "@/core/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Eye, Users, CreditCard } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays, parseISO } from "date-fns";
import { formatCurrency } from "../constants";

const CHART_DAYS = 14;
const STATS_DAYS = 30;
const STALE_TIME = 60_000;

export default function BackofficeAnalytics() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const since30d = useMemo(() => subDays(new Date(), STATS_DAYS).toISOString(), []);
  const since14d = useMemo(() => subDays(new Date(), CHART_DAYS).toISOString(), []);

  const { data: chartViews = [], isLoading } = useQuery({
    queryKey: ["bo-analytics-chart-views"],
    staleTime: STALE_TIME,
    queryFn: async () => {
      const { data } = await supabase
        .from("page_views")
        .select("created_at")
        .gte("created_at", since14d)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  const { data: totalViews30d = 0 } = useQuery({
    queryKey: ["bo-analytics-total-views"],
    staleTime: STALE_TIME,
    queryFn: async () => {
      const { count } = await supabase
        .from("page_views")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since30d);
      return count ?? 0;
    },
  });

  const { data: paymentStats = { total: 0, count: 0 } } = useQuery({
    queryKey: ["bo-analytics-payments"],
    staleTime: STALE_TIME,
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("amount_usd")
        .eq("status", "paid")
        .gte("created_at", since30d);
      const rows = data ?? [];
      return {
        total: rows.reduce((s, p) => s + (Number(p.amount_usd) || 0), 0),
        count: rows.length,
      };
    },
  });

  const { data: newUsers = 0 } = useQuery({
    queryKey: ["bo-analytics-new-users"],
    staleTime: STALE_TIME,
    queryFn: async () => {
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since30d);
      return count ?? 0;
    },
  });

  const dailyData = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = CHART_DAYS - 1; i >= 0; i--) {
      days[format(subDays(new Date(), i), "MMM dd")] = 0;
    }
    chartViews.forEach((v) => {
      const d = format(parseISO(v.created_at), "MMM dd");
      if (d in days) days[d]++;
    });
    return Object.entries(days).map(([day, views]) => ({ day, views }));
  }, [chartViews]);

  const stats = [
    { label_en: "Page Views (30d)", label_ar: "مشاهدات (30 يوم)", value: totalViews30d, icon: "chart" as const, color: "primary" as const },
    { label_en: "New Users (30d)", label_ar: "مستخدمون جدد", value: newUsers, icon: "users" as const, color: "success" as const },
    { label_en: "Revenue (30d)", label_ar: "الإيرادات (30 يوم)", value: formatCurrency(paymentStats.total), icon: "revenue" as const, color: "warning" as const },
    { label_en: "Transactions", label_ar: "المعاملات", value: paymentStats.count, icon: "revenue" as const, color: "muted" as const },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title_en="Analytics & Reports"
        title_ar="التحليلات والتقارير"
        description_en="Platform analytics across all business units"
        description_ar="تحليلات المنصة عبر جميع الوحدات"
      />

      <StatCardGrid stats={stats} loading={isLoading} />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4" />
            {isAr ? `مشاهدات الصفحات (${CHART_DAYS} يوم)` : `Page Views (${CHART_DAYS} Days)`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip formatter={(v: number) => [v, isAr ? "مشاهدات" : "Views"]} />
                <Bar dataKey="views" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { icon: Users, title_en: "User Growth Report", title_ar: "تقرير نمو المستخدمين" },
          { icon: CreditCard, title_en: "Revenue Breakdown", title_ar: "تفصيل الإيرادات" },
          { icon: BarChart3, title_en: "Conversion Funnel", title_ar: "قمع التحويل" },
          { icon: Eye, title_en: "Content Performance", title_ar: "أداء المحتوى" },
        ].map((r) => (
          <Card key={r.title_en} className="opacity-60">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                <r.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{isAr ? r.title_ar : r.title_en}</p>
                <p className="text-[10px] text-muted-foreground">{isAr ? "قريباً" : "Coming soon"}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
