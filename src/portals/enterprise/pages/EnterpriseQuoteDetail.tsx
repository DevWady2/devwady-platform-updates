/**
 * Enterprise — Quote detail with accept/reject actions.
 * Ownership is validated via RLS (quotes linked to user's service_requests).
 */
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader } from "@/core/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, CheckCircle2, XCircle, Loader2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { QUOTE_STATUS_COLORS, formatStatus } from "../constants";

interface LineItem {
  description: string;
  qty: number;
  unit_price: number;
  total: number;
}

export default function EnterpriseQuoteDetail() {
  const { id } = useParams();
  const { lang } = useLanguage();
  const queryClient = useQueryClient();
  const isAr = lang === "ar";

  const { data: quote, isLoading } = useQuery({
    queryKey: ["enterprise-quote", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const respond = useMutation({
    mutationFn: async (status: "approved" | "rejected") => {
      const { error } = await supabase
        .from("quotes")
        .update({ status, responded_at: new Date().toISOString() })
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ["enterprise-quote", id] });
      queryClient.invalidateQueries({ queryKey: ["enterprise-quotes-all"] });
      toast.success(status === "approved" ? (isAr ? "تم قبول العرض" : "Quote approved") : (isAr ? "تم رفض العرض" : "Quote rejected"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!quote) return (
    <div className="text-center py-20">
      <AlertCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-muted-foreground">{isAr ? "العرض غير موجود" : "Quote not found"}</p>
      <Link to="/enterprise/portal/quotes"><Button variant="outline" className="mt-3">{isAr ? "رجوع" : "Back"}</Button></Link>
    </div>
  );

  const lineItems = (Array.isArray(quote.line_items) ? quote.line_items : []) as unknown as LineItem[];
  const canRespond = quote.status === "sent" || quote.status === "viewed";

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title_en={`Quote ${quote.quote_number ?? ""}`}
        title_ar={`عرض سعر ${quote.quote_number ?? ""}`}
        badge={<Badge variant="secondary" className={QUOTE_STATUS_COLORS[quote.status] ?? ""}>{formatStatus(quote.status)}</Badge>}
        actions={
          <Link to="/enterprise/portal/quotes"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 me-1 icon-flip-rtl" />{isAr ? "رجوع" : "Back"}</Button></Link>
        }
      />

      <Card>
        <CardHeader><CardTitle className="text-base">{quote.title}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {quote.description && <p className="text-sm text-muted-foreground">{quote.description}</p>}

          <div className="flex flex-wrap gap-4 text-sm">
            {quote.estimated_duration && (
              <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-4 w-4" />{quote.estimated_duration}</span>
            )}
            {quote.valid_until && (
              <span className="text-muted-foreground">{isAr ? "صالح حتى" : "Valid until"} {new Date(quote.valid_until).toLocaleDateString()}</span>
            )}
          </div>

          <Separator />

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isAr ? "البند" : "Item"}</TableHead>
                  <TableHead className="text-right">{isAr ? "الكمية" : "Qty"}</TableHead>
                  <TableHead className="text-right">{isAr ? "سعر الوحدة" : "Unit Price"}</TableHead>
                  <TableHead className="text-right">{isAr ? "الإجمالي" : "Total"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{item.qty}</TableCell>
                    <TableCell className="text-right">${item.unit_price}</TableCell>
                    <TableCell className="text-right font-medium">${item.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Separator />

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? "المجموع الفرعي" : "Subtotal"}</span><span>${quote.subtotal_usd}</span></div>
            {(quote.discount_pct ?? 0) > 0 && (
              <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? "خصم" : "Discount"}</span><span>-{quote.discount_pct}%</span></div>
            )}
            {(quote.tax_pct ?? 0) > 0 && (
              <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? "ضريبة" : "Tax"}</span><span>+{quote.tax_pct}%</span></div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>{isAr ? "الإجمالي" : "Total"}</span>
              <span className="text-primary">${quote.total_usd.toLocaleString()}</span>
            </div>
          </div>

          {quote.notes && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">{isAr ? "ملاحظات" : "Notes"}</p>
                <p className="text-sm">{quote.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {canRespond && (
        <div className="flex gap-3">
          <Button size="lg" onClick={() => respond.mutate("approved")} disabled={respond.isPending} className="flex-1 sm:flex-none">
            {respond.isPending ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 me-2" />}
            {isAr ? "قبول العرض" : "Approve Quote"}
          </Button>
          <Button size="lg" variant="outline" onClick={() => respond.mutate("rejected")} disabled={respond.isPending} className="flex-1 sm:flex-none">
            <XCircle className="h-4 w-4 me-2" />
            {isAr ? "رفض العرض" : "Reject Quote"}
          </Button>
        </div>
      )}
    </div>
  );
}
