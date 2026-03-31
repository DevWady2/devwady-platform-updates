import { formatCurrency } from "@/lib/format";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ArrowLeft, Plus, Trash2, GripVertical, Loader2, Send, Save, Eye,
  Calendar as CalendarIcon, User, Mail, Building2, Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import SEO from "@/components/SEO";

interface LineItem {
  id: string;
  description: string;
  hours: number;
  rate: number;
}


export default function AdminQuoteBuilder() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get("request_id") || "";
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const [title, setTitle] = useState("");
  const [validUntil, setValidUntil] = useState<Date>(addDays(new Date(), 30));
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("50% upfront upon approval, 50% upon delivery");
  const [notes, setNotes] = useState("");
  const [discountPct, setDiscountPct] = useState(0);
  const [taxPct, setTaxPct] = useState(0);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: "", hours: 0, rate: 0 },
  ]);
  const [templateApplied, setTemplateApplied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmSendOpen, setConfirmSendOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Fetch linked service request
  const { data: request } = useQuery({
    queryKey: ["admin-sr", requestId],
    queryFn: async () => {
      if (!requestId) return null;
      const { data } = await supabase.from("service_requests").select("*").eq("id", requestId).maybeSingle();
      return data;
    },
    enabled: Boolean(requestId),
  });

  // Fetch existing quote for edit
  const { data: existingQuote } = useQuery({
    queryKey: ["admin-quote", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await supabase.from("quotes").select("*, service_requests(*)").eq("id", id).maybeSingle();
      return data;
    },
    enabled: isEdit,
  });

  // Default line item templates by category
  const PROJECT_TEMPLATE: LineItem[] = [
    { id: crypto.randomUUID(), description: "Discovery & Requirements", hours: 0, rate: 0 },
    { id: crypto.randomUUID(), description: "UI/UX Design", hours: 0, rate: 0 },
    { id: crypto.randomUUID(), description: "Development", hours: 0, rate: 0 },
    { id: crypto.randomUUID(), description: "QA & Testing", hours: 0, rate: 0 },
    { id: crypto.randomUUID(), description: "Deployment & Launch", hours: 0, rate: 0 },
  ];
  const SERVICE_TEMPLATE: LineItem[] = [
    { id: crypto.randomUUID(), description: "Monthly rate per resource", hours: 0, rate: 0 },
    { id: crypto.randomUUID(), description: "Setup fee", hours: 0, rate: 0 },
    { id: crypto.randomUUID(), description: "Tools / infrastructure", hours: 0, rate: 0 },
  ];

  // Pre-fill from request or existing quote
  useEffect(() => {
    if (existingQuote) {
      setTitle(existingQuote.title);
      setValidUntil(existingQuote.valid_until ? new Date(existingQuote.valid_until) : addDays(new Date(), 30));
      setEstimatedDuration(existingQuote.estimated_duration || "");
      setPaymentTerms(existingQuote.payment_terms || "");
      setNotes(existingQuote.notes || "");
      setDiscountPct(Number(existingQuote.discount_pct) || 0);
      setTaxPct(Number(existingQuote.tax_pct) || 0);
      const items = (existingQuote.line_items as any[]) || [];
      setLineItems(items.length ? items.map((i: any) => ({ ...i, id: i.id || crypto.randomUUID() })) : [{ id: crypto.randomUUID(), description: "", hours: 0, rate: 0 }]);
    } else if (request && !isEdit && !templateApplied) {
      setTitle(`Quote for ${request.title}`);
      const SERVICE_TYPES = ["team_augmentation", "qa_testing", "it_services", "dedicated_squad"];
      const category = (request as any).category || (SERVICE_TYPES.includes(request.service_type) ? "service" : "project");
      setLineItems(category === "service" ? SERVICE_TEMPLATE : PROJECT_TEMPLATE);
      if (category === "service") {
        setPaymentTerms("Monthly billing, NET 15");
      }
      setTemplateApplied(true);
    }
  }, [existingQuote, request, isEdit, templateApplied]);

  const srData = isEdit ? (existingQuote as any)?.service_requests : request;

  // Calculations
  const subtotal = useMemo(() => lineItems.reduce((s, i) => s + i.hours * i.rate, 0), [lineItems]);
  const discountAmt = subtotal * (discountPct / 100);
  const taxAmt = (subtotal - discountAmt) * (taxPct / 100);
  const grandTotal = subtotal - discountAmt + taxAmt;

  const updateItem = (idx: number, field: keyof LineItem, value: any) => {
    setLineItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };
  const addItem = () => {
    if (lineItems.length >= 20) return;
    setLineItems((prev) => [...prev, { id: crypto.randomUUID(), description: "", hours: 0, rate: 0 }]);
  };
  const removeItem = (idx: number) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const buildPayload = () => ({
    service_request_id: srData?.id || requestId,
    title,
    valid_until: format(validUntil, "yyyy-MM-dd"),
    estimated_duration: estimatedDuration || null,
    payment_terms: paymentTerms || null,
    notes: notes || null,
    discount_pct: discountPct,
    tax_pct: taxPct,
    subtotal_usd: subtotal,
    total_usd: grandTotal,
    line_items: lineItems.map(({ description, hours, rate }) => ({ description, hours, rate, total: hours * rate })),
  });

  const handleSave = async (status = "draft") => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!srData?.id && !requestId) { toast.error("No service request linked"); return; }
    setSaving(true);
    try {
      const payload = { ...buildPayload(), status };
      if (isEdit) {
        const { error } = await supabase.from("quotes").update(payload).eq("id", id!);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("quotes").insert(payload);
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["admin-quotes"] });
      toast.success(lang === "ar" ? "تم الحفظ" : "Quote saved");
      if (!isEdit) navigate("/admin/quotes");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const payload = { ...buildPayload(), status: "sent", sent_at: new Date().toISOString() };
      if (isEdit) {
        const { error } = await supabase.from("quotes").update(payload).eq("id", id!);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("quotes").insert(payload);
        if (error) throw error;
      }
      // Update service request status
      if (srData?.id || requestId) {
        await supabase.from("service_requests").update({ status: "quoted" }).eq("id", srData?.id || requestId);
      }
      // Send email
      const siteUrl = window.location.origin;
      const emailUrl = srData?.user_id ? `${siteUrl}/my-projects` : `${siteUrl}/request-status?email=${encodeURIComponent(srData?.contact_email || "")}`;
      await supabase.functions.invoke("send-email", {
        body: {
          to: srData?.contact_email,
          template: "generic",
          data: {
            title: "Your quote from DevWady",
            body: `We prepared a quote for your project: "${title}". Total: ${formatCurrency(grandTotal, lang)}. Valid until: ${format(validUntil, "PPP")}.`,
            cta_text: "View & approve your quote",
            cta_url: emailUrl,
          },
        },
      });
      queryClient.invalidateQueries({ queryKey: ["admin-service-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-quotes"] });
      toast.success(lang === "ar" ? "تم إرسال عرض السعر" : "Quote sent to client");
      navigate("/admin/service-requests");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
      setConfirmSendOpen(false);
    }
  };

  return (
    <div className="min-h-screen">
      <SEO title={isEdit ? "Edit Quote" : "Create Quote"} />
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 text-muted-foreground">
          <ArrowLeft className="icon-flip-rtl h-4 w-4 me-1" /> {lang === "ar" ? "رجوع" : "Back"}
        </Button>

        <h1 className="text-2xl font-bold mb-6">{isEdit ? (lang === "ar" ? "تعديل عرض السعر" : "Edit Quote") : (lang === "ar" ? "إنشاء عرض سعر" : "Create Quote")}</h1>

        <div className="flex gap-6">
          {/* Left sidebar */}
          {srData && (
            <div className="w-72 shrink-0 sticky top-6 self-start space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{lang === "ar" ? "معلومات العميل" : "Client Info"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-muted-foreground" />{srData.contact_name}</div>
                  <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{srData.contact_email}</div>
                  {srData.company_name && <div className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-muted-foreground" />{srData.company_name}</div>}
                  <div className="flex items-center gap-2"><Briefcase className="h-3.5 w-3.5 text-muted-foreground" /><Badge variant="outline" className="text-xs">{srData.service_type}</Badge></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{lang === "ar" ? "ملخص الطلب" : "Request Summary"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{srData.title}</p>
                  {srData.budget_range && <p>Budget: {srData.budget_range}</p>}
                  {srData.timeline && <p>Timeline: {srData.timeline}</p>}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main content */}
          <div className="flex-1 space-y-6 min-w-0">
            {/* Quote header */}
            <Card>
              <CardHeader><CardTitle>{lang === "ar" ? "تفاصيل عرض السعر" : "Quote Details"}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">{lang === "ar" ? "العنوان" : "Title"}</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">{lang === "ar" ? "صالح حتى" : "Valid Until"}</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-start font-normal", !validUntil && "text-muted-foreground")}>
                          <CalendarIcon className="me-2 h-4 w-4" />
                          {validUntil ? format(validUntil, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={validUntil} onSelect={(d) => d && setValidUntil(d)} initialFocus className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">{lang === "ar" ? "المدة المتوقعة" : "Estimated Duration"}</label>
                    <Input value={estimatedDuration} onChange={(e) => setEstimatedDuration(e.target.value)} placeholder="e.g. 8-10 weeks" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">{lang === "ar" ? "شروط الدفع" : "Payment Terms"}</label>
                  <Textarea value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} rows={2} />
                </div>
              </CardContent>
            </Card>

            {/* Line items */}
            <Card>
              <CardHeader><CardTitle>{lang === "ar" ? "بنود التسعير" : "Line Items"}</CardTitle></CardHeader>
              <CardContent>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 text-muted-foreground">
                        <th className="w-8 p-2"></th>
                        <th className="text-start p-2 font-medium">{lang === "ar" ? "الوصف" : "Description"}</th>
                        <th className="w-24 text-end p-2 font-medium">{lang === "ar" ? "ساعات" : "Hours"}</th>
                        <th className="w-28 text-end p-2 font-medium">{lang === "ar" ? "السعر/ساعة" : "Rate/hr"}</th>
                        <th className="w-28 text-end p-2 font-medium">{lang === "ar" ? "المجموع" : "Total"}</th>
                        <th className="w-10 p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item, idx) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2 text-center text-muted-foreground"><GripVertical className="h-4 w-4 mx-auto" /></td>
                          <td className="p-2">
                            <Input value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)} placeholder="e.g. UI/UX Design" className="border-0 bg-transparent shadow-none p-0 h-8" />
                          </td>
                          <td className="p-2">
                            <Input type="number" min={0} value={item.hours || ""} onChange={(e) => updateItem(idx, "hours", Number(e.target.value))} className="text-end border-0 bg-transparent shadow-none p-0 h-8" />
                          </td>
                          <td className="p-2">
                            <div className="flex items-center justify-end">
                              <span className="text-muted-foreground me-1">$</span>
                              <Input type="number" min={0} value={item.rate || ""} onChange={(e) => updateItem(idx, "rate", Number(e.target.value))} className="text-end border-0 bg-transparent shadow-none p-0 h-8 w-20" />
                            </div>
                          </td>
                          <td className="p-2 text-end font-medium">{formatCurrency(item.hours * item.rate, lang)}</td>
                          <td className="p-2">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeItem(idx)} disabled={lineItems.length <= 1}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button variant="outline" size="sm" className="mt-3" onClick={addItem} disabled={lineItems.length >= 20}>
                  <Plus className="h-3.5 w-3.5 me-1" /> {lang === "ar" ? "إضافة بند" : "Add Line Item"}
                </Button>

                {/* Totals */}
                <div className="mt-6 flex justify-end">
                  <div className="w-72 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">{lang === "ar" ? "المجموع الفرعي" : "Subtotal"}</span><span>{formatCurrency(subtotal, lang)}</span></div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-muted-foreground">{lang === "ar" ? "خصم" : "Discount"}</span>
                      <div className="flex items-center gap-1">
                        <Input type="number" min={0} max={100} value={discountPct || ""} onChange={(e) => setDiscountPct(Number(e.target.value))} className="w-16 h-7 text-xs text-end" />
                        <span className="text-xs text-muted-foreground">%</span>
                        <span className="text-red-500 ms-2">-{formatCurrency(discountAmt, lang)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-muted-foreground">{lang === "ar" ? "ضريبة" : "Tax"}</span>
                      <div className="flex items-center gap-1">
                        <Input type="number" min={0} max={100} value={taxPct || ""} onChange={(e) => setTaxPct(Number(e.target.value))} className="w-16 h-7 text-xs text-end" />
                        <span className="text-xs text-muted-foreground">%</span>
                        <span className="ms-2">+{formatCurrency(taxAmt, lang)}</span>
                      </div>
                    </div>
                    <div className="border-t pt-2 flex justify-between items-center">
                      <span className="font-semibold">{lang === "ar" ? "الإجمالي" : "Grand Total"}</span>
                      <span className="text-2xl font-bold">{formatCurrency(grandTotal, lang)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader><CardTitle>{lang === "ar" ? "ملاحظات" : "Notes"}</CardTitle></CardHeader>
              <CardContent>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder={lang === "ar" ? "شروط إضافية أو توضيحات..." : "Additional terms, scope clarifications, or exclusions..."} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sticky action bar */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t mt-6 -mx-6 px-6 py-3 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => handleSave("draft")} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin me-1" /> : <Save className="h-4 w-4 me-1" />}
            {lang === "ar" ? "حفظ كمسودة" : "Save as Draft"}
          </Button>
          <Button variant="outline" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-4 w-4 me-1" /> {lang === "ar" ? "معاينة" : "Preview"}
          </Button>
          <Button className="gradient-brand" onClick={() => setConfirmSendOpen(true)} disabled={sending || !title.trim()}>
            <Send className="h-4 w-4 me-1" /> {lang === "ar" ? "إرسال للعميل" : "Send to Client"}
          </Button>
        </div>
      </div>

      {/* Confirm send dialog */}
      <Dialog open={confirmSendOpen} onOpenChange={setConfirmSendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang === "ar" ? "تأكيد الإرسال" : "Confirm Send"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {lang === "ar"
              ? `سيتم إرسال عرض السعر بالبريد الإلكتروني إلى ${srData?.contact_email}. هل تريد المتابعة؟`
              : `This will email the quote to ${srData?.contact_email}. Continue?`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmSendOpen(false)}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button className="gradient-brand" onClick={handleSend} disabled={sending}>
              {sending && <Loader2 className="h-4 w-4 animate-spin me-1" />}
              {lang === "ar" ? "إرسال" : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{lang === "ar" ? "معاينة عرض السعر" : "Quote Preview"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 p-6 border rounded-xl bg-white text-black">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold">DevWady</h2>
                <p className="text-sm text-gray-500">www.devwady.com</p>
              </div>
              <div className="text-end text-sm text-gray-500">
                <p>Valid until: {format(validUntil, "PPP")}</p>
                {estimatedDuration && <p>Duration: {estimatedDuration}</p>}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              {srData && <p className="text-sm text-gray-500 mt-1">Prepared for: {srData.contact_name} — {srData.contact_email}</p>}
            </div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-start py-2 font-medium">Description</th>
                  <th className="text-end py-2 font-medium">Hours</th>
                  <th className="text-end py-2 font-medium">Rate</th>
                  <th className="text-end py-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.filter(i => i.description).map((item) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-2">{item.description}</td>
                    <td className="text-end py-2">{item.hours}</td>
                    <td className="text-end py-2">{formatCurrency(item.rate, lang)}</td>
                    <td className="text-end py-2 font-medium">{formatCurrency(item.hours * item.rate, lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end">
              <div className="w-64 space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal, lang)}</span></div>
                {discountPct > 0 && <div className="flex justify-between text-red-600"><span>Discount ({discountPct}%)</span><span>-{formatCurrency(discountAmt, lang)}</span></div>}
                {taxPct > 0 && <div className="flex justify-between"><span>Tax ({taxPct}%)</span><span>+{formatCurrency(taxAmt, lang)}</span></div>}
                <div className="border-t pt-1 flex justify-between font-bold text-base"><span>Total</span><span>{formatCurrency(grandTotal, lang)}</span></div>
              </div>
            </div>
            {paymentTerms && <div><h4 className="font-medium text-sm mb-1">Payment Terms</h4><p className="text-sm text-gray-600">{paymentTerms}</p></div>}
            {notes && <div><h4 className="font-medium text-sm mb-1">Notes</h4><p className="text-sm text-gray-600">{notes}</p></div>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
