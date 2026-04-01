import { useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format, parseISO, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, DollarSign, Calendar, Send, Tag,
  Flag, Package, MessageSquare, AlertTriangle, StickyNote, Paperclip,
  Users, ShieldCheck, Wrench, UsersRound
} from "lucide-react";

const PROJECT_STATUS: Record<string, { color: string; en: string; ar: string }> = {
  planning: { color: "bg-blue-500/15 text-blue-600", en: "Planning", ar: "تخطيط" },
  in_progress: { color: "bg-amber-500/15 text-amber-600", en: "In Progress", ar: "قيد التنفيذ" },
  review: { color: "bg-purple-500/15 text-purple-600", en: "Review", ar: "مراجعة" },
  delivered: { color: "bg-teal-500/15 text-teal-600", en: "Delivered", ar: "تم التسليم" },
  completed: { color: "bg-green-500/15 text-green-600", en: "Completed", ar: "مكتمل" },
  on_hold: { color: "bg-gray-500/15 text-gray-600", en: "On Hold", ar: "معلق" },
};

const UPDATE_ICONS: Record<string, any> = {
  milestone: Flag,
  deliverable: Package,
  update: MessageSquare,
  issue: AlertTriangle,
  note: StickyNote,
};

const SERVICE_TYPES = ["team_augmentation", "qa_testing", "it_services", "dedicated_squad"];

const SERVICE_TYPE_ICONS: Record<string, any> = {
  team_augmentation: Users,
  qa_testing: ShieldCheck,
  it_services: Wrench,
  dedicated_squad: UsersRound,
};

const SERVICE_TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  team_augmentation: { en: "Team Augmentation", ar: "تعزيز الفريق" },
  qa_testing: { en: "QA & Testing", ar: "اختبار الجودة" },
  it_services: { en: "IT Services", ar: "خدمات تقنية" },
  dedicated_squad: { en: "Dedicated Squad", ar: "فريق مخصص" },
};

const fmtCurrency = (v: number | null) =>
  v != null ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v) : "—";

export default function MyProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgSubject, setMsgSubject] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [sending, setSending] = useState(false);

  // Try loading as project_tracking first
  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ["my-project-detail", id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("project_tracking")
        .select("*")
        .eq("id", id!)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  // If not a project_tracking record, try service_requests
  const { data: serviceRequest, isLoading: loadingSR } = useQuery({
    queryKey: ["my-service-request-detail", id],
    enabled: !!id && !!user && !project && !loadingProject,
    queryFn: async () => {
      const { data } = await supabase
        .from("service_requests")
        .select("*")
        .eq("id", id!)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: updates = [] } = useQuery({
    queryKey: ["my-project-updates-detail", id],
    enabled: !!id && !!project,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_updates")
        .select("*")
        .eq("project_id", id!)
        .eq("is_visible_to_client", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const handleSendMessage = async () => {
    if (!msgBody.trim()) return toast.error(isAr ? "الرسالة مطلوبة" : "Message is required");
    setSending(true);

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("user_id", user!.id)
      .maybeSingle();

    const title = project?.title || serviceRequest?.title || "";

    const { error } = await supabase.from("contact_submissions").insert({
      name: profile?.full_name || user!.email || "Client",
      email: user!.email!,
      phone: profile?.phone || null,
      subject: msgSubject || `Re: ${title}`,
      message: msgBody,
    });

    if (error) toast.error(error.message);
    else {
      toast.success(isAr ? "تم إرسال الرسالة" : "Message sent!");
      setMsgOpen(false);
      setMsgSubject("");
      setMsgBody("");
    }
    setSending(false);
  };

  const isLoading = loadingProject || loadingSR;

  if (isLoading) return <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">Loading...</div>;

  // If it's a service request (not project_tracking)
  if (serviceRequest && !project) {
    return <ServiceRequestDetailView request={serviceRequest} isAr={isAr} lang={lang} user={user} />;
  }

  if (!project) return <Navigate to="/my-projects" replace />;

  const ps = PROJECT_STATUS[project.status] || PROJECT_STATUS.planning;
  const overdue = project.target_end_date && isPast(parseISO(project.target_end_date)) && !["completed", "cancelled"].includes(project.status);
  const remaining = (Number(project.total_budget_usd) || 0) - (Number(project.paid_usd) || 0);
  const paidPct = project.total_budget_usd ? Math.round(((Number(project.paid_usd) || 0) / Number(project.total_budget_usd)) * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <SEO title={`${project.title} | DevWady`} description="Project details and updates" />

      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild><Link to="/my-projects"><ArrowLeft className="icon-flip-rtl h-4 w-4" /></Link></Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">{project.title}</h1>
            <Badge className={cn(ps.color)}>{isAr ? ps.ar : ps.en}</Badge>
            {overdue && <Badge variant="destructive" className="text-xs">{isAr ? "متأخر" : "Overdue"}</Badge>}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setMsgOpen(true); setMsgSubject(`Re: ${project.title}`); }} className="gap-1.5">
          <Send className="h-3.5 w-3.5" />{isAr ? "إرسال رسالة" : "Send Message"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{isAr ? "التقدم" : "Progress"}</h3>
              <span className="text-lg font-bold">{project.progress_pct || 0}%</span>
            </div>
            <Progress value={project.progress_pct || 0} className="h-3" />
          </Card>

          {/* Updates Timeline */}
          <Card className="p-5">
            <h3 className="font-semibold mb-4">{isAr ? "تحديثات المشروع" : "Project Updates"}</h3>
            {updates.length === 0 ? (
              <p className="text-sm text-muted-foreground">{isAr ? "لا توجد تحديثات بعد" : "No updates yet"}</p>
            ) : (
              <div className="space-y-5">
                {updates.map((u: any) => {
                  const Icon = UPDATE_ICONS[u.type] || MessageSquare;
                  return (
                    <div key={u.id} className="flex gap-3">
                      <div className="mt-0.5">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center",
                          u.type === "milestone" ? "bg-amber-500/15 text-amber-600" :
                          u.type === "deliverable" ? "bg-green-500/15 text-green-600" :
                          u.type === "issue" ? "bg-red-500/15 text-red-600" :
                          "bg-blue-500/15 text-blue-600"
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{u.title}</p>
                        {u.body && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{u.body}</p>}
                        {u.attachments?.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {u.attachments.map((url: string, i: number) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                                <Paperclip className="h-3 w-3" />{url.split("/").pop()}
                              </a>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">{format(parseISO(u.created_at), "MMM d, yyyy · h:mm a")}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-5 space-y-3">
            <h3 className="font-semibold flex items-center gap-2"><Calendar className="h-4 w-4" />{isAr ? "التواريخ" : "Dates"}</h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? "البدء" : "Start"}</span><span>{project.start_date ? format(parseISO(project.start_date), "MMM d, yyyy") : "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? "المستهدف" : "Target"}</span><span className={cn(overdue && "text-destructive font-medium")}>{project.target_end_date ? format(parseISO(project.target_end_date), "MMM d, yyyy") : "—"}</span></div>
              {project.actual_end_date && <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? "الفعلي" : "Actual"}</span><span>{format(parseISO(project.actual_end_date), "MMM d, yyyy")}</span></div>}
            </div>
          </Card>

          <Card className="p-5 space-y-3">
            <h3 className="font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4" />{isAr ? "الميزانية" : "Budget"}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? "الإجمالي" : "Total"}</span><span className="font-bold">{fmtCurrency(project.total_budget_usd)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? "المدفوع" : "Paid"}</span><span className="text-green-600">{fmtCurrency(project.paid_usd)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? "المتبقي" : "Remaining"}</span><span>{fmtCurrency(remaining)}</span></div>
              <Separator />
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground"><span>{isAr ? "المدفوع" : "Paid"}</span><span>{paidPct}%</span></div>
                <Progress value={paidPct} className="h-1.5" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Message Dialog */}
      <Dialog open={msgOpen} onOpenChange={setMsgOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{isAr ? "إرسال رسالة للفريق" : "Send Message to Team"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{isAr ? "الموضوع" : "Subject"}</label>
              <Input value={msgSubject} onChange={(e) => setMsgSubject(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">{isAr ? "الرسالة" : "Message"} *</label>
              <Textarea value={msgBody} onChange={(e) => setMsgBody(e.target.value)} rows={4} placeholder={isAr ? "اكتب رسالتك هنا..." : "Type your message..."} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMsgOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleSendMessage} disabled={sending} className="gap-1.5">
              <Send className="h-3.5 w-3.5" />{sending ? "..." : isAr ? "إرسال" : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Service Request Detail View ─── */
function ServiceRequestDetailView({ request: r, isAr, user }: { request: any; isAr: boolean; lang: string; user: any }) {
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgSubject, setMsgSubject] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [sending, setSending] = useState(false);

  const meta = (r.metadata || {}) as Record<string, any>;
  const isService = SERVICE_TYPES.includes(r.service_type);
  const TypeIcon = isService ? (SERVICE_TYPE_ICONS[r.service_type] || Wrench) : null;
  const typeLabel = isService
    ? SERVICE_TYPE_LABELS[r.service_type] || { en: r.service_type, ar: r.service_type }
    : { en: r.service_type?.replace(/_/g, " "), ar: r.service_type?.replace(/_/g, " ") };

  const STATUS_STEPS = ["new", "reviewing", "quoted", "approved", "in_progress", "completed"];
  const STATUS_LABELS: Record<string, { en: string; ar: string }> = {
    new: { en: "Submitted", ar: "مقدم" },
    reviewing: { en: "Under Review", ar: "قيد المراجعة" },
    quoted: { en: isService ? "Proposal Sent" : "Quoted", ar: isService ? "تم إرسال العرض" : "تم التسعير" },
    approved: { en: "Approved", ar: "موافق عليه" },
    in_progress: { en: isService ? "Active" : "In Progress", ar: isService ? "نشط" : "قيد التنفيذ" },
    completed: { en: "Completed", ar: "مكتمل" },
    rejected: { en: "Rejected", ar: "مرفوض" },
    on_hold: { en: "On Hold", ar: "معلق" },
  };

  const currentStep = STATUS_STEPS.indexOf(r.status);
  const statusLabel = STATUS_LABELS[r.status] || { en: r.status, ar: r.status };

  const handleSendMessage = async () => {
    if (!msgBody.trim()) return toast.error(isAr ? "الرسالة مطلوبة" : "Message is required");
    setSending(true);
    const { data: profile } = await supabase.from("profiles").select("full_name, phone").eq("user_id", user!.id).maybeSingle();
    const { error } = await supabase.from("contact_submissions").insert({
      name: profile?.full_name || user!.email || "Client",
      email: user!.email!,
      phone: profile?.phone || null,
      subject: msgSubject || `Re: ${r.title}`,
      message: msgBody,
    });
    if (error) toast.error(error.message);
    else { toast.success(isAr ? "تم إرسال الرسالة" : "Message sent!"); setMsgOpen(false); setMsgSubject(""); setMsgBody(""); }
    setSending(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <SEO title={`${r.title} | DevWady`} description="Request details" />

      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild><Link to="/my-projects"><ArrowLeft className="icon-flip-rtl h-4 w-4" /></Link></Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">{r.title}</h1>
            <Badge variant="outline" className="text-xs gap-1">
              {TypeIcon && <TypeIcon className="h-3 w-3" />}
              {isAr ? typeLabel.ar : typeLabel.en}
            </Badge>
            <Badge className={cn(
              r.status === "approved" || r.status === "in_progress" ? "bg-green-500/15 text-green-600" :
              r.status === "rejected" ? "bg-red-500/15 text-red-600" :
              "bg-blue-500/15 text-blue-600"
            )}>
              {isAr ? statusLabel.ar : statusLabel.en}
            </Badge>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setMsgOpen(true); setMsgSubject(`Re: ${r.title}`); }} className="gap-1.5">
          <Send className="h-3.5 w-3.5" />{isAr ? "إرسال رسالة" : "Send Message"}
        </Button>
      </div>

      {/* Status stepper */}
      {currentStep >= 0 && (
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-1">
            {STATUS_STEPS.map((step, i) => {
              const done = i <= currentStep;
              const label = STATUS_LABELS[step] || { en: step, ar: step };
              return (
                <div key={step} className="flex flex-col items-center gap-1 flex-1">
                  <div className={cn("h-2 rounded-full w-full transition-colors", done ? "bg-primary" : "bg-muted")} />
                  <span className={cn("text-[10px]", done ? "text-foreground font-medium" : "text-muted-foreground")}>{isAr ? label.ar : label.en}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card className="p-5">
            <h3 className="font-semibold mb-3">{isAr ? "الوصف" : "Description"}</h3>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">{r.description}</p>
            {r.requirements && (
              <>
                <h4 className="font-medium text-sm mt-4 mb-2">{isAr ? "المتطلبات" : "Requirements"}</h4>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">{r.requirements}</p>
              </>
            )}
          </Card>

          {/* Metadata */}
          {Object.keys(meta).length > 0 && (
            <Card className="p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                {isAr ? (isService ? "تفاصيل الخدمة" : "تفاصيل المشروع") : (isService ? "Service Details" : "Project Details")}
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {Object.entries(meta).map(([key, value]) => {
                  if (!value || (Array.isArray(value) && (value as any[]).length === 0)) return null;
                  return (
                    <div key={key}>
                      <span className="text-muted-foreground capitalize text-xs">{key.replace(/_/g, " ")}</span>
                      <div className="font-medium mt-0.5">
                        {Array.isArray(value) ? (
                          <div className="flex flex-wrap gap-1">
                            {(value as string[]).map((v) => (
                              <Badge key={v} variant="outline" className="text-xs">{v}</Badge>
                            ))}
                          </div>
                        ) : (
                          String(value)
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Attachments */}
          {r.attachments?.length > 0 && (
            <Card className="p-5">
              <h3 className="font-semibold mb-3">{isAr ? "المرفقات" : "Attachments"}</h3>
              <div className="space-y-2">
                {r.attachments.map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                    <Paperclip className="h-3.5 w-3.5" />{url.split("/").pop()}
                  </a>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-5 space-y-3">
            <h3 className="font-semibold">{isAr ? "معلومات الطلب" : "Request Info"}</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? "الفئة" : "Category"}</span><Badge variant="outline" className="text-xs">{isService ? (isAr ? "خدمة" : "Service") : (isAr ? "مشروع" : "Project")}</Badge></div>
              {r.budget_range && <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? "الميزانية" : "Budget"}</span><span>{r.budget_range.replace(/_/g, " ")}</span></div>}
              {r.timeline && <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? "الجدول" : "Timeline"}</span><span>{r.timeline.replace(/_/g, " ")}</span></div>}
              {r.preferred_start_date && <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? "تاريخ البدء" : "Start Date"}</span><span>{format(parseISO(r.preferred_start_date), "MMM d, yyyy")}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? "تاريخ التقديم" : "Submitted"}</span><span>{format(parseISO(r.created_at), "MMM d, yyyy")}</span></div>
            </div>
          </Card>
        </div>
      </div>

      {/* Message Dialog */}
      <Dialog open={msgOpen} onOpenChange={setMsgOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{isAr ? "إرسال رسالة للفريق" : "Send Message to Team"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{isAr ? "الموضوع" : "Subject"}</label>
              <Input value={msgSubject} onChange={(e) => setMsgSubject(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">{isAr ? "الرسالة" : "Message"} *</label>
              <Textarea value={msgBody} onChange={(e) => setMsgBody(e.target.value)} rows={4} placeholder={isAr ? "اكتب رسالتك هنا..." : "Type your message..."} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMsgOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleSendMessage} disabled={sending} className="gap-1.5">
              <Send className="h-3.5 w-3.5" />{sending ? "..." : isAr ? "إرسال" : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
