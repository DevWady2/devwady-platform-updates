import { formatCurrency } from "@/lib/format";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { formatDistanceToNow, startOfMonth, parseISO } from "date-fns";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, CreditCard, BookOpen, FileText, Loader2,
  ChevronDown, ChevronUp,
} from "lucide-react";

const statusStyle: Record<string, string> = {
  paid: "bg-green-500/15 text-green-600",
  pending: "bg-yellow-500/15 text-yellow-700",
  failed: "bg-red-500/15 text-red-600",
  refunded: "bg-blue-500/15 text-blue-600",
  cancelled: "bg-muted text-muted-foreground",
};

const typeIcon: Record<string, typeof CreditCard> = {
  consulting_session: CreditCard,
  course_purchase: BookOpen,
  service_invoice: FileText,
};


export default function PaymentHistory() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const isAr = lang === "ar";
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: payments, isLoading } = useQuery({
    queryKey: ["payment-history", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const all = payments ?? [];
  const filtered = filter === "all" ? all : all.filter((p) => p.status === filter);

  const totalPaid = all
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + Number(p.amount_usd), 0);

  const pendingCount = all.filter((p) => p.status === "pending").length;

  const monthStart = startOfMonth(new Date()).toISOString();
  const thisMonth = all
    .filter((p) => p.status === "paid" && p.paid_at && p.paid_at >= monthStart)
    .reduce((s, p) => s + Number(p.amount_usd), 0);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SEO title={t("payments.history")} />
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/profile">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ArrowLeft className="icon-flip-rtl h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">{t("payments.history")}</h1>
            </div>
            {totalPaid > 0 && (
              <Badge variant="secondary" className="text-sm">
                {isAr ? "إجمالي" : "Total"}: {formatCurrency(totalPaid, lang)}
              </Badge>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: t("payments.totalPaid"), value: formatCurrency(totalPaid, lang), color: "text-green-500" },
              { label: t("payments.pending"), value: String(pendingCount), color: "text-yellow-500" },
              { label: t("payments.thisMonth"), value: formatCurrency(thisMonth, lang), color: "text-primary" },
            ].map((m) => (
              <div key={m.label} className="bg-card rounded-xl border border-border p-4 text-center">
                <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="w-full justify-start">
              {["all", "paid", "pending", "refunded"].map((s) => (
                <TabsTrigger key={s} value={s} className="capitalize">
                  {s === "all" ? (isAr ? "الكل" : "All") : s}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* List */}
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <CreditCard className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
              <h3 className="text-lg font-semibold">{t("payments.noPayments")}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {isAr
                  ? "سيظهر سجل المدفوعات هنا بعد أول معاملة."
                  : "Your payment history will appear here after your first transaction."}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {filtered.map((p, i) => {
                const Icon = typeIcon[p.type] || CreditCard;
                const isOpen = expanded === p.id;
                const meta = (p.metadata as Record<string, any>) ?? {};

                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-card rounded-xl border border-border overflow-hidden"
                  >
                    <button
                      onClick={() => setExpanded(isOpen ? null : p.id)}
                      className="w-full flex items-center gap-4 p-4 text-start"
                    >
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {p.description || meta.expert_name || p.type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(parseISO(p.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="text-end shrink-0">
                        <p className="text-sm font-bold">{formatCurrency(Number(p.amount_usd), lang)}</p>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                            statusStyle[p.status] ?? "bg-muted text-muted-foreground"
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                      {p.status === "paid" && (
                        isOpen
                          ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                          : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </button>

                    {isOpen && p.status === "paid" && (
                      <div className="px-4 pb-4 pt-0 border-t border-border space-y-2 text-xs text-muted-foreground">
                        {p.stripe_payment_intent_id && (
                          <p>
                            <span className="font-medium text-foreground">Payment ID:</span>{" "}
                            <span className="font-mono">{p.stripe_payment_intent_id.slice(0, 24)}…</span>
                          </p>
                        )}
                        {p.paid_at && (
                          <p>
                            <span className="font-medium text-foreground">{isAr ? "تاريخ الدفع" : "Paid at"}:</span>{" "}
                            {new Date(p.paid_at).toLocaleString(isAr ? "ar-EG" : "en-US")}
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
