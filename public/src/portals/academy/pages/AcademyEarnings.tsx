/**
 * Academy — Instructor Earnings overview.
 * Uses shared useInstructorCourses hook. Removed invalid revenue_share_pct reference.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader, StatCardGrid } from "@/core/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Download } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isWithinInterval } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { downloadCSV } from "@/lib/csvExport";
import { useInstructorCourses } from "../hooks/useInstructorCourses";

const DEFAULT_SHARE_PCT = 70;

export default function AcademyEarnings() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const { data: courses = [] } = useInstructorCourses();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["academy-earn-payments", courses.map(c => c.id)],
    enabled: courses.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, amount_usd, paid_at, reference_id, created_at")
        .eq("type", "course")
        .eq("status", "paid")
        .in("reference_id", courses.map(c => c.id))
        .order("paid_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const shareFraction = DEFAULT_SHARE_PCT / 100;

  const { totalEarnings, thisMonthEarnings, monthlyData } = useMemo(() => {
    const total = payments.reduce((s, p) => s + (Number(p.amount_usd) || 0) * shareFraction, 0);
    const now = new Date();
    const interval = { start: startOfMonth(now), end: endOfMonth(now) };
    const thisMonth = payments
      .filter(p => p.paid_at && isWithinInterval(parseISO(p.paid_at), interval))
      .reduce((s, p) => s + (Number(p.amount_usd) || 0) * shareFraction, 0);

    const months: { month: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(now, i);
      const mInterval = { start: startOfMonth(m), end: endOfMonth(m) };
      const amount = payments
        .filter(p => p.paid_at && isWithinInterval(parseISO(p.paid_at), mInterval))
        .reduce((s, p) => s + (Number(p.amount_usd) || 0) * shareFraction, 0);
      months.push({ month: format(m, "MMM"), amount: Math.round(amount) });
    }
    return { totalEarnings: Math.round(total), thisMonthEarnings: Math.round(thisMonth), monthlyData: months };
  }, [payments, shareFraction]);

  const stats = [
    { label_en: "Total Earnings", label_ar: "إجمالي الأرباح", value: `$${totalEarnings.toLocaleString()}`, icon: "revenue" as const, color: "success" as const },
    { label_en: "This Month", label_ar: "هذا الشهر", value: `$${thisMonthEarnings.toLocaleString()}`, icon: "chart" as const, color: "primary" as const },
    { label_en: "Paid Enrollments", label_ar: "تسجيلات مدفوعة", value: payments.length, icon: "courses" as const, color: "warning" as const },
    { label_en: "Courses", label_ar: "الدورات", value: courses.length, icon: "courses" as const, color: "muted" as const },
  ];

  const handleExport = () => {
    const rows = payments.map(p => ({
      Date: p.paid_at ?? p.created_at,
      Amount: p.amount_usd,
      Share: `${DEFAULT_SHARE_PCT}%`,
      Earnings: ((Number(p.amount_usd) || 0) * shareFraction).toFixed(2),
    }));
    downloadCSV(rows, "academy-earnings");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title_en="Earnings"
        title_ar="الأرباح"
        description_en="Track your course revenue and payouts"
        description_ar="تتبع إيرادات الدورات والمدفوعات"
        actions={
          <Button variant="outline" size="sm" onClick={handleExport} disabled={payments.length === 0}>
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
    </div>
  );
}
