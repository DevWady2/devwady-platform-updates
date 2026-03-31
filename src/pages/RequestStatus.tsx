import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Search, Loader2, FileText, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Clock, ArrowRight, Paperclip,
  AlertTriangle, Tag, Users, ShieldCheck, Wrench, UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { formatDistanceToNow, differenceInDays, isPast, parseISO } from "date-fns";
import { ar, enUS } from "date-fns/locale";


const statusColors: Record<string, string> = {
  new: "bg-blue-500/15 text-blue-600",
  reviewing: "bg-amber-500/15 text-amber-600",
  quoted: "bg-purple-500/15 text-purple-600",
  approved: "bg-green-500/15 text-green-600",
  in_progress: "bg-primary/15 text-primary",
  completed: "bg-emerald-500/15 text-emerald-600",
  closed: "bg-gray-500/15 text-gray-600",
  rejected: "bg-red-500/15 text-red-600",
  on_hold: "bg-gray-500/15 text-gray-600",
};

const statusLabels: Record<string, { en: string; ar: string }> = {
  new: { en: "New", ar: "جديد" },
  reviewing: { en: "Under Review", ar: "قيد المراجعة" },
  quoted: { en: "Quoted", ar: "تم التسعير" },
  approved: { en: "Approved", ar: "موافق عليه" },
  in_progress: { en: "In Progress", ar: "قيد التنفيذ" },
  completed: { en: "Completed", ar: "مكتمل" },
  closed: { en: "Closed", ar: "مغلق" },
  rejected: { en: "Rejected", ar: "مرفوض" },
  on_hold: { en: "On Hold", ar: "معلق" },
};

const serviceTypeLabels: Record<string, { en: string; ar: string }> = {
  mobile_app: { en: "Mobile App", ar: "تطبيق موبايل" },
  website: { en: "Website", ar: "موقع إلكتروني" },
  enterprise_system: { en: "Enterprise System", ar: "نظام مؤسسي" },
  uiux_design: { en: "UI/UX Design", ar: "تصميم UI/UX" },
  qa_testing: { en: "QA & Testing", ar: "اختبار الجودة" },
  it_services: { en: "IT Services", ar: "خدمات تقنية" },
  consulting: { en: "Consulting", ar: "استشارات" },
  team_augmentation: { en: "Team Augmentation", ar: "تعزيز الفريق" },
  dedicated_squad: { en: "Dedicated Squad", ar: "فريق مخصص" },
  other: { en: "Other", ar: "أخرى" },
  other_project: { en: "Other", ar: "أخرى" },
};

const SERVICE_TYPES = ["team_augmentation", "qa_testing", "it_services", "dedicated_squad"];

const SERVICE_TYPE_ICONS: Record<string, any> = {
  team_augmentation: Users,
  qa_testing: ShieldCheck,
  it_services: Wrench,
  dedicated_squad: UsersRound,
};

const budgetLabels: Record<string, string> = {
  under_5k: "< $5,000",
  "5k_15k": "$5,000–$15,000",
  "15k_50k": "$15,000–$50,000",
  "50k_100k": "$50,000–$100,000",
  "100k_plus": "$100,000+",
  not_sure: "Not sure",
};

const timelineLabels: Record<string, { en: string; ar: string }> = {
  urgent_1month: { en: "Urgent — within 1 month", ar: "عاجل — خلال شهر" },
  "1_3months": { en: "1–3 months", ar: "١–٣ أشهر" },
  "3_6months": { en: "3–6 months", ar: "٣–٦ أشهر" },
  "6_12months": { en: "6–12 months", ar: "٦–١٢ شهر" },
  flexible: { en: "Flexible", ar: "مرن" },
};

interface Quote {
  id: string;
  quote_number: string;
  title: string;
  description: string | null;
  line_items: any[];
  subtotal_usd: number;
  discount_pct: number;
  tax_pct: number;
  total_usd: number;
  currency: string;
  valid_until: string | null;
  payment_terms: string | null;
  estimated_duration: string | null;
  notes: string | null;
  status: string;
  sent_at: string | null;
  responded_at: string | null;
  created_at: string;
}

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  service_type: string;
  status: string;
  budget_range: string | null;
  timeline: string | null;
  preferred_start_date: string | null;
  attachments: string[];
  created_at: string;
  quotes: Quote[];
  category?: string | null;
  metadata?: Record<string, any> | null;
}

export default function RequestStatus() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<ServiceRequest[] | null>(null);
  const [expandedDesc, setExpandedDesc] = useState<Record<string, boolean>>({});
  const [expandedQuote, setExpandedQuote] = useState<Record<string, boolean>>({});
  const [rejectDialog, setRejectDialog] = useState<{ quoteId: string; open: boolean }>({ quoteId: "", open: false });
  const [rejectMessage, setRejectMessage] = useState("");
  const [approveDialog, setApproveDialog] = useState<{ quoteId: string; open: boolean }>({ quoteId: "", open: false });
  const [responding, setResponding] = useState(false);

  const lookup = async (lookupEmail?: string) => {
    const target = lookupEmail || email;
    if (!target || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
      toast.error(isAr ? "يرجى إدخال بريد إلكتروني صحيح" : "Please enter a valid email");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("lookup-requests", {
      body: { email: target },
    });
    setLoading(false);
    if (error || data?.error) {
      toast.error(data?.error || (isAr ? "فشل البحث" : "Lookup failed"));
      return;
    }
    setRequests(data.requests || []);
  };

  useEffect(() => {
    const paramEmail = searchParams.get("email");
    if (paramEmail) {
      setEmail(paramEmail);
      lookup(paramEmail);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const respondToQuote = async (quoteId: string, action: "approve" | "reject", message?: string) => {
    setResponding(true);
    const { data, error } = await supabase.functions.invoke("respond-to-quote", {
      body: { quote_id: quoteId, action, email, message },
    });
    setResponding(false);
    if (error || data?.error) {
      toast.error(data?.error || (isAr ? "فشل الإرسال" : "Failed to respond"));
      return;
    }
    toast.success(
      action === "approve"
        ? (isAr ? "تم الموافقة على العرض!" : "Quote approved!")
        : (isAr ? "تم رفض العرض" : "Quote declined")
    );
    setApproveDialog({ quoteId: "", open: false });
    setRejectDialog({ quoteId: "", open: false });
    setRejectMessage("");
    lookup();
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString(isAr ? "ar-EG" : "en-US", {
        year: "numeric", month: "short", day: "numeric",
      });
    } catch { return d; }
  };

  const getCategory = (r: ServiceRequest) => {
    if (r.category) return r.category;
    return SERVICE_TYPES.includes(r.service_type) ? "service" : "project";
  };

  return (
    <>
      <SEO
        title={isAr ? "تتبع طلب الخدمة" : "Track Service Request"}
        description={isAr ? "تتبع حالة طلب الخدمة والرد على عروض الأسعار" : "Track your service request status and respond to quotes"}
      />
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Lookup Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border p-6 lg:p-8 mb-8"
          >
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">
              {isAr ? "تتبع طلبك" : "Track Your Request"}
            </h1>
            <p className="text-muted-foreground mb-6">
              {isAr ? "أدخل بريدك الإلكتروني لعرض حالة طلباتك" : "Enter your email to view your request status"}
            </p>
            <form
              onSubmit={(e) => { e.preventDefault(); lookup(); }}
              className="flex gap-3"
            >
              <Input
                type="email"
                placeholder={isAr ? "بريدك الإلكتروني" : "Your email address"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl h-12 flex-1"
              />
              <Button type="submit" disabled={loading} className="gradient-brand text-primary-foreground rounded-xl h-12 px-6">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="ms-2 hidden sm:inline">{isAr ? "بحث" : "Search"}</span>
              </Button>
            </form>
          </motion.div>

          {/* Results */}
          {requests !== null && (
            <div className="space-y-6">
              {requests.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {isAr ? "لا توجد طلبات" : "No requests found"}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {isAr ? "لم نجد طلبات مرتبطة بهذا البريد الإلكتروني" : "No requests found for this email address"}
                  </p>
                  <Link to="/get-started">
                    <Button className="rounded-full px-6">
                      {isAr ? "تقديم طلب جديد" : "Submit a new request"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
                    </Button>
                  </Link>
                </motion.div>
              ) : (
                requests.map((req, i) => {
                  const category = getCategory(req);
                  const isService = category === "service";
                  const meta = (req.metadata || {}) as Record<string, any>;
                  const TypeIcon = SERVICE_TYPE_ICONS[req.service_type];

                  return (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-card rounded-2xl border border-border p-5 lg:p-6"
                    >
                      {/* Header */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge className={statusColors[req.status] || "bg-muted text-muted-foreground"}>
                          {statusLabels[req.status]?.[isAr ? "ar" : "en"] || req.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs gap-1">
                          {TypeIcon && <TypeIcon className="h-3 w-3" />}
                          {serviceTypeLabels[req.service_type]?.[isAr ? "ar" : "en"] || req.service_type}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {isService ? (isAr ? "خدمة" : "Service") : (isAr ? "مشروع" : "Project")}
                        </Badge>
                        <span className="text-xs text-muted-foreground ms-auto">
                          {formatDate(req.created_at)}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold mb-2">{req.title}</h3>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground mb-4">
                        {expandedDesc[req.id] ? req.description : req.description.slice(0, 200)}
                        {req.description.length > 200 && (
                          <button
                            onClick={() => setExpandedDesc((p) => ({ ...p, [req.id]: !p[req.id] }))}
                            className="text-primary ms-1 font-medium text-xs"
                          >
                            {expandedDesc[req.id]
                              ? (isAr ? "أقل" : "Show less")
                              : (isAr ? "المزيد" : "Show more")}
                          </button>
                        )}
                      </p>

                      {/* Category-specific details */}
                      {isService && Object.keys(meta).length > 0 ? (
                        <div className="border rounded-lg p-3 bg-muted/20 mb-4">
                          <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                            <Tag className="h-3 w-3" /> {isAr ? "تفاصيل الخدمة" : "Service Details"}
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                            {Object.entries(meta).map(([key, value]) => {
                              if (!value || (Array.isArray(value) && (value as any[]).length === 0)) return null;
                              const displayValue = Array.isArray(value) ? (value as string[]).join(", ") : String(value);
                              return (
                                <div key={key}>
                                  <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}: </span>
                                  <span className="font-medium">{displayValue}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : !isService ? (
                        /* Project details grid */
                        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                          {req.budget_range && (
                            <div>
                              <span className="text-muted-foreground">{isAr ? "الميزانية:" : "Budget:"}</span>{" "}
                              <span className="font-medium">{budgetLabels[req.budget_range] || req.budget_range}</span>
                            </div>
                          )}
                          {req.timeline && (
                            <div>
                              <span className="text-muted-foreground">{isAr ? "الجدول:" : "Timeline:"}</span>{" "}
                              <span className="font-medium">{timelineLabels[req.timeline]?.[isAr ? "ar" : "en"] || req.timeline}</span>
                            </div>
                          )}
                          {req.preferred_start_date && (
                            <div>
                              <span className="text-muted-foreground">{isAr ? "تاريخ البدء:" : "Start date:"}</span>{" "}
                              <span className="font-medium">{formatDate(req.preferred_start_date)}</span>
                            </div>
                          )}
                          {/* Project metadata if available */}
                          {Object.keys(meta).length > 0 && Object.entries(meta).map(([key, value]) => {
                            if (!value || (Array.isArray(value) && (value as any[]).length === 0)) return null;
                            const displayValue = Array.isArray(value) ? (value as string[]).join(", ") : String(value);
                            return (
                              <div key={key}>
                                <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}:</span>{" "}
                                <span className="font-medium">{displayValue}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* Fallback for services without metadata */
                        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                          {req.budget_range && (
                            <div>
                              <span className="text-muted-foreground">{isAr ? "الميزانية:" : "Budget:"}</span>{" "}
                              <span className="font-medium">{budgetLabels[req.budget_range] || req.budget_range}</span>
                            </div>
                          )}
                          {req.timeline && (
                            <div>
                              <span className="text-muted-foreground">{isAr ? "الجدول:" : "Timeline:"}</span>{" "}
                              <span className="font-medium">{timelineLabels[req.timeline]?.[isAr ? "ar" : "en"] || req.timeline}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Attachments */}
                      {req.attachments && req.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {req.attachments.map((a, j) => {
                            const name = a.split("/").pop() || `file-${j + 1}`;
                            return (
                              <span key={j} className="flex items-center gap-1 text-xs bg-muted rounded-lg px-2 py-1">
                                <Paperclip className="h-3 w-3" /> {name}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Quotes */}
                      {req.quotes.map((quote) => (
                        <QuoteCard
                          key={quote.id}
                          quote={quote}
                          isAr={isAr}
                          expanded={!!expandedQuote[quote.id]}
                          onToggle={() => setExpandedQuote((p) => ({ ...p, [quote.id]: !p[quote.id] }))}
                          onApprove={() => setApproveDialog({ quoteId: quote.id, open: true })}
                          onReject={() => setRejectDialog({ quoteId: quote.id, open: true })}
                          lang={lang}
                          isService={isService}
                        />
                      ))}
                    </motion.div>
                  );
                })
              )}

              {/* CTA */}
              {requests.length > 0 && (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-3">
                    {isAr ? "أنشئ حسابًا مجانيًا لإدارة جميع مشاريعك" : "Create a free account to manage all your projects"}
                  </p>
                  <Link to="/auth/enterprise">
                    <Button variant="outline" className="rounded-full px-6">
                      {isAr ? "إنشاء حساب" : "Create Account"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Approve Dialog */}
      <Dialog open={approveDialog.open} onOpenChange={(o) => setApproveDialog((p) => ({ ...p, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAr ? "تأكيد الموافقة" : "Confirm Approval"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {isAr
              ? "بالموافقة، أنت توافق على شروط العرض المذكورة. سيتواصل فريقنا معك لبدء المشروع."
              : "By approving, you agree to the quoted terms. Our team will contact you to begin the project."}
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setApproveDialog({ quoteId: "", open: false })}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              disabled={responding}
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => respondToQuote(approveDialog.quoteId, "approve")}
            >
              {responding ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <CheckCircle2 className="h-4 w-4 me-2" />}
              {isAr ? "موافقة" : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(o) => setRejectDialog((p) => ({ ...p, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAr ? "طلب تعديلات" : "Request Changes"}</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder={isAr ? "ملاحظاتك أو سبب الرفض..." : "Your feedback or reason for declining..."}
            value={rejectMessage}
            onChange={(e) => setRejectMessage(e.target.value)}
            rows={4}
            className="rounded-xl"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setRejectDialog({ quoteId: "", open: false }); setRejectMessage(""); }}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              disabled={responding}
              variant="destructive"
              onClick={() => respondToQuote(rejectDialog.quoteId, "reject", rejectMessage)}
            >
              {responding ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <XCircle className="h-4 w-4 me-2" />}
              {isAr ? "رفض العرض" : "Decline Quote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ---- QuoteCard sub-component ---- */
function QuoteCard({
  quote, isAr, expanded, onToggle, onApprove, onReject, lang, isService,
}: {
  quote: Quote;
  isAr: boolean;
  lang: string;
  expanded: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onReject: () => void;
  isService?: boolean;
}) {
  const canRespond = ["sent", "viewed"].includes(quote.status);
  const isExpired = quote.valid_until && isPast(parseISO(quote.valid_until));
  const daysLeft = quote.valid_until ? differenceInDays(parseISO(quote.valid_until), new Date()) : null;

  const quoteStatusBadge = () => {
    if (quote.status === "approved") return <Badge className="bg-green-500/15 text-green-600">{isAr ? "موافق عليه" : "Approved"}</Badge>;
    if (quote.status === "rejected") return <Badge className="bg-red-500/15 text-red-600">{isAr ? "مرفوض" : "Declined"}</Badge>;
    if (quote.status === "expired") return <Badge className="bg-gray-500/15 text-gray-600">{isAr ? "منتهي" : "Expired"}</Badge>;
    return null;
  };

  const quoteLabel = isService ? (isAr ? "عرض الخدمة" : "Service Proposal") : (isAr ? "عرض السعر" : "Quote");

  return (
    <div className="border-s-2 border-s-primary bg-primary/5 p-4 rounded-xl mt-4">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="font-mono text-sm font-bold">{quote.quote_number}</span>
        <span className="text-lg font-bold text-primary">${Number(quote.total_usd).toLocaleString()}</span>
        {quoteStatusBadge()}
        <Badge variant="secondary" className="text-xs">{quoteLabel}</Badge>
        {quote.responded_at && (
          <span className="text-xs text-muted-foreground ms-auto">
            {isAr ? "تم الرد" : "Responded"} {formatDistanceToNow(parseISO(quote.responded_at), { addSuffix: true, locale: lang === "ar" ? ar : enUS })}
          </span>
        )}
      </div>

      {quote.valid_until && canRespond && (
        <div className="flex items-center gap-1 text-xs mb-3">
          {isExpired ? (
            <span className="text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> {isAr ? "منتهي الصلاحية" : "Expired"}
            </span>
          ) : (
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {isAr ? `ينتهي خلال ${daysLeft} يوم` : `Expires in ${daysLeft} days`}
            </span>
          )}
        </div>
      )}

      {/* Toggle details */}
      <button onClick={onToggle} className="flex items-center gap-1 text-sm text-primary font-medium mb-3">
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        {expanded ? (isAr ? "إخفاء التفاصيل" : "Hide details") : (isAr ? "عرض التفاصيل" : "View full quote")}
      </button>

      {expanded && (
        <div className="space-y-4">
          {/* Line items table */}
          {Array.isArray(quote.line_items) && quote.line_items.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-start py-2">{isAr ? "الوصف" : "Description"}</th>
                    <th className="text-end py-2">{isAr ? "ساعات" : "Hours"}</th>
                    <th className="text-end py-2">{isAr ? "السعر/ساعة" : "Rate/hr"}</th>
                    <th className="text-end py-2">{isAr ? "المجموع" : "Total"}</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.line_items.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b border-border/50">
                      <td className="py-2">{item.description}</td>
                      <td className="text-end py-2">{item.hours}</td>
                      <td className="text-end py-2">${item.rate}</td>
                      <td className="text-end py-2 font-medium">${Number(item.total).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{isAr ? "المجموع الفرعي" : "Subtotal"}</span>
              <span>${Number(quote.subtotal_usd).toLocaleString()}</span>
            </div>
            {Number(quote.discount_pct) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isAr ? "خصم" : "Discount"} ({quote.discount_pct}%)</span>
                <span className="text-green-600">-${(Number(quote.subtotal_usd) * Number(quote.discount_pct) / 100).toLocaleString()}</span>
              </div>
            )}
            {Number(quote.tax_pct) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isAr ? "ضريبة" : "Tax"} ({quote.tax_pct}%)</span>
                <span>${(Number(quote.subtotal_usd) * Number(quote.tax_pct) / 100).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
              <span>{isAr ? "الإجمالي" : "Grand Total"}</span>
              <span className="text-primary">${Number(quote.total_usd).toLocaleString()}</span>
            </div>
          </div>

          {/* Terms */}
          {(quote.payment_terms || quote.estimated_duration) && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              {quote.payment_terms && (
                <div>
                  <span className="text-muted-foreground">{isAr ? "شروط الدفع:" : "Payment terms:"}</span>
                  <p className="font-medium">{quote.payment_terms}</p>
                </div>
              )}
              {quote.estimated_duration && (
                <div>
                  <span className="text-muted-foreground">{isAr ? "المدة المقدرة:" : "Est. duration:"}</span>
                  <p className="font-medium">{quote.estimated_duration}</p>
                </div>
              )}
            </div>
          )}
          {quote.notes && (
            <div className="text-sm">
              <span className="text-muted-foreground">{isAr ? "ملاحظات:" : "Notes:"}</span>
              <p className="mt-1">{quote.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      {canRespond && !isExpired && (
        <div className="flex gap-3 mt-4">
          <Button
            onClick={onApprove}
            className="bg-green-600 hover:bg-green-700 text-white rounded-full flex-1 sm:flex-none"
          >
            <CheckCircle2 className="h-4 w-4 me-2" /> {isAr ? "موافقة على العرض" : `Approve ${isService ? "Proposal" : "Quote"}`}
          </Button>
          <Button variant="outline" onClick={onReject} className="rounded-full flex-1 sm:flex-none">
            {isAr ? "طلب تعديلات" : "Request Changes"}
          </Button>
        </div>
      )}
    </div>
  );
}
