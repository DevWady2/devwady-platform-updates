import { formatCurrency } from "@/lib/format";
import SEO from "@/components/SEO";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDistanceToNow, parseISO, startOfMonth, subMonths, format, endOfMonth } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DollarSign, Search, CreditCard, BookOpen, FileText, Copy,
  TrendingUp, Clock, RefreshCcw, BarChart3,
} from "lucide-react";
import ExportCSVButton from "@/components/admin/ExportCSVButton";
import PaginationControls from "@/components/PaginationControls";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";


const statusStyle: Record<string, { badge: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  paid: { badge: "default", color: "text-green-600" },
  pending: { badge: "secondary", color: "text-yellow-600" },
  failed: { badge: "destructive", color: "text-red-600" },
  refunded: { badge: "outline", color: "text-blue-600" },
  cancelled: { badge: "outline", color: "text-muted-foreground" },
};

const typeIcon: Record<string, typeof CreditCard> = {
  consulting_session: CreditCard,
  course_purchase: BookOpen,
  service_invoice: FileText,
};

export default function AdminPayments() {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch profiles for user names
  const userIds = useMemo(() => [...new Set(payments.filter(p => p.user_id).map(p => p.user_id!))], [payments]);
  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-payment-profiles", userIds],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);
      return data ?? [];
    },
  });
  const profileMap = useMemo(() => new Map(profiles.map(p => [p.user_id, p])), [profiles]);

  // Stats
  const totalRevenue = payments.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount_usd), 0);
  const now = new Date();
  const monthStart = startOfMonth(now).toISOString();
  const thisMonthRevenue = payments.filter(p => p.status === "paid" && p.paid_at && p.paid_at >= monthStart).reduce((s, p) => s + Number(p.amount_usd), 0);
  const pendingAmount = payments.filter(p => p.status === "pending").reduce((s, p) => s + Number(p.amount_usd), 0);
  const refundedAmount = payments.filter(p => p.status === "refunded").reduce((s, p) => s + Number(p.amount_usd), 0);

  // Chart data: last 6 months revenue
  const chartData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => subMonths(now, 5 - i));
    return months.map(m => {
      const start = startOfMonth(m);
      const end = endOfMonth(m);
      const revenue = payments
        .filter(p => p.status === "paid" && p.paid_at && parseISO(p.paid_at) >= start && parseISO(p.paid_at) <= end)
        .reduce((s, p) => s + Number(p.amount_usd), 0);
      return { month: format(m, "MMM"), revenue };
    });
  }, [payments]);

  // Filtering
  const filtered = useMemo(() => {
    let list = payments;
    if (statusFilter !== "all") list = list.filter(p => p.status === statusFilter);
    if (typeFilter !== "all") list = list.filter(p => p.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        (p.guest_email || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        (profileMap.get(p.user_id ?? "")?.full_name || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [payments, statusFilter, typeFilter, search, profileMap]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(isAr ? "تم النسخ" : "Copied");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("admin.payments")}</h1>
          <p className="text-muted-foreground text-sm">
            {isAr ? "إدارة ومتابعة جميع المدفوعات" : "Manage and track all payments"}
          </p>
        </div>
        <ExportCSVButton
          data={payments.map(p => ({
            type: p.type,
            description: p.description,
            amount_usd: p.amount_usd,
            status: p.status,
            guest_email: p.guest_email,
            stripe_payment_intent_id: p.stripe_payment_intent_id,
            paid_at: p.paid_at,
            created_at: p.created_at,
          }))}
          filename="payments"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: t("admin.totalRevenue"), value: formatCurrency(totalRevenue, lang), icon: DollarSign, color: "text-green-500" },
          { label: t("admin.monthlyRevenue"), value: formatCurrency(thisMonthRevenue, lang), icon: TrendingUp, color: "text-primary" },
          { label: t("admin.pendingPayments"), value: formatCurrency(pendingAmount, lang), icon: Clock, color: "text-yellow-500" },
          { label: t("admin.refunded"), value: formatCurrency(refundedAmount, lang), icon: RefreshCcw, color: "text-red-500" },
          { label: t("admin.transactions"), value: String(payments.length), icon: BarChart3, color: "text-foreground" },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-3">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold mb-3">{t("admin.monthlyRevenue")}</h2>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tickFormatter={v => `$${v}`} className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                formatter={(v: number) => [formatCurrency(v, lang), isAr ? "الإيرادات" : "Revenue"]}
                contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={isAr ? "بحث..." : "Search..."} value={search} onChange={e => setSearch(e.target.value)} className="ps-9 h-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
            <SelectItem value="paid">{isAr ? "مدفوع" : "Paid"}</SelectItem>
            <SelectItem value="pending">{isAr ? "معلق" : "Pending"}</SelectItem>
            <SelectItem value="refunded">{isAr ? "مسترد" : "Refunded"}</SelectItem>
            <SelectItem value="failed">{isAr ? "فشل" : "Failed"}</SelectItem>
            <SelectItem value="cancelled">{isAr ? "ملغى" : "Cancelled"}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
            <SelectItem value="consulting_session">{isAr ? "استشارة" : "Consulting"}</SelectItem>
            <SelectItem value="course_purchase">{isAr ? "دورة" : "Course"}</SelectItem>
            <SelectItem value="service_invoice">{isAr ? "فاتورة" : "Invoice"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{isAr ? "المستخدم" : "User"}</TableHead>
            <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
            <TableHead className="hidden md:table-cell">{isAr ? "الوصف" : "Description"}</TableHead>
            <TableHead>{isAr ? "المبلغ" : "Amount"}</TableHead>
            <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
            <TableHead className="hidden lg:table-cell">Stripe ID</TableHead>
            <TableHead className="hidden sm:table-cell">{isAr ? "التاريخ" : "Date"}</TableHead>
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}><TableCell colSpan={8}><div className="h-6 bg-muted rounded animate-pulse" /></TableCell></TableRow>
            ))
          ) : paginated.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                {isAr ? "لا توجد مدفوعات" : "No payments found"}
              </TableCell>
            </TableRow>
          ) : (
            paginated.map(p => {
              const profile = profileMap.get(p.user_id ?? "");
              const Icon = typeIcon[p.type] || CreditCard;
              const style = statusStyle[p.status] ?? statusStyle.cancelled;
              return (
    <>
    <SEO title="Payments — Admin" noIndex />
                <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelected(p)}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {profile?.avatar_url ? (
                        <img loading="lazy" src={profile.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold">
                          {(profile?.full_name?.[0] || p.guest_email?.[0] || "?").toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{profile?.full_name || p.guest_email || "—"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs capitalize">{p.type.replace(/_/g, " ")}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-muted-foreground truncate max-w-[200px] block">{p.description || "—"}</span>
                  </TableCell>
                  <TableCell className="font-semibold text-sm">${Number(p.amount_usd).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={style.badge} className="text-[10px] capitalize">{p.status}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {p.stripe_payment_intent_id ? (
                      <button
                        onClick={e => { e.stopPropagation(); copyToClipboard(p.stripe_payment_intent_id!); }}
                        className="text-xs font-mono text-muted-foreground hover:text-foreground truncate max-w-[120px] block"
                        title={p.stripe_payment_intent_id}
                      >
                        {p.stripe_payment_intent_id.slice(0, 16)}…
                      </button>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                    {formatDistanceToNow(parseISO(p.created_at), { addSuffix: true, locale: lang === "ar" ? ar : enUS })}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); setSelected(p); }}>
                      <Search className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
    </>
              );
            })
          )}
        </TableBody>
      </Table>
      <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isAr ? "تفاصيل الدفعة" : "Payment Details"}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">{isAr ? "النوع" : "Type"}:</span>
                  <p className="font-medium capitalize">{selected.type.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{isAr ? "الحالة" : "Status"}:</span>
                  <Badge variant={statusStyle[selected.status]?.badge ?? "outline"} className="ms-1 capitalize">{selected.status}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">{isAr ? "المبلغ" : "Amount"}:</span>
                  <p className="font-bold text-lg">${Number(selected.amount_usd).toFixed(2)} {selected.currency?.toUpperCase()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{isAr ? "المستخدم" : "User"}:</span>
                  <p className="font-medium">{profileMap.get(selected.user_id ?? "")?.full_name || selected.guest_email || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{isAr ? "الوصف" : "Description"}:</span>
                  <p className="font-medium">{selected.description || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{isAr ? "تاريخ الإنشاء" : "Created"}:</span>
                  <p className="font-medium">{new Date(selected.created_at).toLocaleString()}</p>
                </div>
                {selected.paid_at && (
                  <div>
                    <span className="text-muted-foreground">{isAr ? "تاريخ الدفع" : "Paid at"}:</span>
                    <p className="font-medium">{new Date(selected.paid_at).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* Stripe IDs */}
              <div className="border-t border-border pt-3 space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase">Stripe</h3>
                {[
                  { label: "Session ID", value: selected.stripe_session_id },
                  { label: "Payment Intent", value: selected.stripe_payment_intent_id },
                  { label: "Customer ID", value: selected.stripe_customer_id },
                ].map(item => item.value && (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{item.label}:</span>
                    <button
                      onClick={() => copyToClipboard(item.value!)}
                      className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground"
                    >
                      {item.value.slice(0, 24)}… <Copy className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Metadata */}
              {selected.metadata && Object.keys(selected.metadata).length > 0 && (
                <div className="border-t border-border pt-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Metadata</h3>
                  <pre className="bg-muted/50 rounded-lg p-3 text-xs overflow-auto max-h-32">
                    {JSON.stringify(selected.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {/* Refund button (disabled) */}
              {selected.status === "paid" && (
                <div className="border-t border-border pt-3">
                  <Button variant="outline" size="sm" disabled className="w-full" title={isAr ? "قريباً" : "Coming soon"}>
                    <RefreshCcw className="h-3.5 w-3.5 me-1.5" />
                    {isAr ? "استرداد — قريباً" : "Refund — Coming soon"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
