/**
 * Enterprise — Billing & Payments page.
 */
import { useLanguage } from "@/contexts/LanguageContext";
import { usePayments } from "@/core/hooks";
import { PageHeader, DataTable } from "@/core/components";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TableCell, TableRow } from "@/components/ui/table";
import { DollarSign, CreditCard } from "lucide-react";
import type { DataTableColumn } from "@/core/components";
import { PAYMENT_STATUS_COLORS, formatStatus } from "../constants";

const columns: DataTableColumn[] = [
  { key: "description", label_en: "Description", label_ar: "الوصف" },
  { key: "type", label_en: "Type", label_ar: "النوع" },
  { key: "amount", label_en: "Amount", label_ar: "المبلغ", className: "text-right" },
  { key: "status", label_en: "Status", label_ar: "الحالة" },
  { key: "date", label_en: "Date", label_ar: "التاريخ" },
];

export default function EnterpriseBilling() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const { payments, isLoading, totalPaid } = usePayments();

  const pendingTotal = payments
    .filter((p) => p.status === "pending")
    .reduce((s, p) => s + (p.amount_usd || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title_en="Billing & Payments"
        title_ar="الفواتير والمدفوعات"
        description_en="Track your payment history and invoices"
        description_ar="تتبع سجل مدفوعاتك وفواتيرك"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "إجمالي المدفوع" : "Total Paid"}</p>
              <p className="text-xl font-bold">${totalPaid.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "معلق" : "Pending"}</p>
              <p className="text-xl font-bold">${pendingTotal.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "عدد المعاملات" : "Transactions"}</p>
              <p className="text-xl font-bold">{payments.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        title_en="Payment History"
        title_ar="سجل المدفوعات"
        columns={columns}
        data={payments}
        loading={isLoading}
        emptyTitle_en="No payments"
        emptyTitle_ar="لا توجد مدفوعات"
        renderRow={(p) => (
          <TableRow key={p.id}>
            <TableCell className="text-sm">{p.description ?? p.type}</TableCell>
            <TableCell><Badge variant="outline" className="text-[10px]">{formatStatus(p.type)}</Badge></TableCell>
            <TableCell className="text-right font-medium">${p.amount_usd}</TableCell>
            <TableCell>
              <Badge variant="secondary" className={`text-[10px] ${PAYMENT_STATUS_COLORS[p.status] ?? ""}`}>
                {formatStatus(p.status)}
              </Badge>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : new Date(p.created_at).toLocaleDateString()}
            </TableCell>
          </TableRow>
        )}
      />
    </div>
  );
}
