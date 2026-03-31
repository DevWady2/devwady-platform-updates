import SEO from "@/components/SEO";
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
// AdminPageHeader not needed here - custom header used
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format, isPast, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Flag, Package, MessageSquare, AlertTriangle, StickyNote, Plus, ArrowLeft, EyeOff,
  DollarSign, Calendar
} from "lucide-react";
import ReactMarkdown from "react-markdown";

const STATUS_CONFIG: Record<string, { label: string; labelAr: string; color: string }> = {
  planning: { label: "Planning", labelAr: "تخطيط", color: "bg-blue-500/15 text-blue-600" },
  in_progress: { label: "In Progress", labelAr: "قيد التنفيذ", color: "bg-amber-500/15 text-amber-600" },
  review: { label: "Review", labelAr: "مراجعة", color: "bg-purple-500/15 text-purple-600" },
  delivered: { label: "Delivered", labelAr: "تم التسليم", color: "bg-teal-500/15 text-teal-600" },
  completed: { label: "Completed", labelAr: "مكتمل", color: "bg-green-500/15 text-green-600" },
  on_hold: { label: "On Hold", labelAr: "معلق", color: "bg-gray-500/15 text-gray-600" },
  cancelled: { label: "Cancelled", labelAr: "ملغي", color: "bg-red-500/15 text-red-600" },
};

const UPDATE_TYPE_ICONS: Record<string, any> = {
  milestone: Flag,
  deliverable: Package,
  update: MessageSquare,
  issue: AlertTriangle,
  note: StickyNote,
};

export default function AdminProjectDetail() {
  const { id } = useParams();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const isAr = lang === "ar";
  const queryClient = useQueryClient();
  const [progressVal, setProgressVal] = useState<number | null>(null);
  const [addUpdateOpen, setAddUpdateOpen] = useState(false);
  const [updateType, setUpdateType] = useState("update");
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateBody, setUpdateBody] = useState("");
  const [updateVisible, setUpdateVisible] = useState(true);
  const [savingUpdate, setSavingUpdate] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);

  const { data: project, isLoading } = useQuery({
    queryKey: ["admin-project", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_tracking")
        .select("*, service_requests(contact_name, contact_email, title, service_type, budget_range), quotes(quote_number, total_usd, line_items)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      if (data && progressVal === null) setProgressVal(data.progress_pct || 0);
      return data;
    },
    enabled: !!id,
  });

  const { data: updates = [] } = useQuery({
    queryKey: ["project-updates", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_updates")
        .select("*")
        .eq("project_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const fmtCurrency = (v: number | null) =>
    v != null ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v) : "—";

  const saveProgress = async () => {
    if (!id || progressVal === null) return;
    setSavingProgress(true);
    const payload: any = { progress_pct: progressVal };
    if (progressVal === 100) payload.status = "completed";
    const { error } = await supabase.from("project_tracking").update(payload).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(isAr ? "تم التحديث" : "Progress saved");
      queryClient.invalidateQueries({ queryKey: ["admin-project", id] });
    }
    setSavingProgress(false);
  };

  const handleAddUpdate = async () => {
    if (!updateTitle.trim()) return toast.error("Title required");
    setSavingUpdate(true);
    const { error } = await supabase.from("project_updates").insert({
      project_id: id!,
      author_id: user?.id || null,
      type: updateType,
      title: updateTitle,
      body: updateBody || null,
      is_visible_to_client: updateVisible,
    });
    if (error) toast.error(error.message);
    else {
      toast.success(isAr ? "تم إضافة التحديث" : "Update added");
      queryClient.invalidateQueries({ queryKey: ["project-updates", id] });
      setAddUpdateOpen(false);
      setUpdateTitle(""); setUpdateBody(""); setUpdateType("update"); setUpdateVisible(true);
    }
    setSavingUpdate(false);
  };

  if (isLoading) return <div className="p-6 text-center text-muted-foreground">Loading...</div>;
  if (!project) return <div className="p-6 text-center text-muted-foreground">Project not found</div>;

  const cfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.planning;
  const overdue = project.target_end_date && isPast(parseISO(project.target_end_date)) && !["completed", "cancelled"].includes(project.status);
  const remaining = (Number(project.total_budget_usd) || 0) - (Number(project.paid_usd) || 0);
  const paidPct = project.total_budget_usd ? Math.round(((Number(project.paid_usd) || 0) / Number(project.total_budget_usd)) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link to="/admin/projects"><ArrowLeft className="icon-flip-rtl h-4 w-4" /></Link></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{project.title}</h1>
            <Badge className={cn(cfg.color)}>{isAr ? cfg.labelAr : cfg.label}</Badge>
            {overdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {project.service_requests?.contact_name || "—"} · {project.start_date ? format(parseISO(project.start_date), "MMM d") : "—"} → {project.target_end_date ? format(parseISO(project.target_end_date), "MMM d, yyyy") : "—"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress */}
          <Card className="p-5 space-y-4">
            <h3 className="font-semibold">{isAr ? "التقدم" : "Progress"}</h3>
            <div className="flex items-center gap-4">
              <Progress value={progressVal ?? 0} className="h-3 flex-1" />
              <span className="text-lg font-bold w-14 text-end">{progressVal ?? 0}%</span>
            </div>
            <Slider value={[progressVal ?? 0]} min={0} max={100} step={5} onValueChange={([v]) => setProgressVal(v)} />
            <Button onClick={saveProgress} disabled={savingProgress} size="sm">{savingProgress ? "..." : isAr ? "حفظ التقدم" : "Save Progress"}</Button>
          </Card>

          {/* Updates Timeline */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{isAr ? "التحديثات" : "Updates"}</h3>
              <Button size="sm" onClick={() => setAddUpdateOpen(true)} className="gap-1"><Plus className="h-3.5 w-3.5" />{isAr ? "إضافة" : "Add"}</Button>
            </div>
            {updates.length === 0 ? (
              <p className="text-sm text-muted-foreground">{isAr ? "لا توجد تحديثات بعد" : "No updates yet"}</p>
            ) : (
              <div className="space-y-4">
                {updates.map((u: any) => {
                  const Icon = UPDATE_TYPE_ICONS[u.type] || MessageSquare;
                  return (
    <>
    <SEO title="Project — Admin" noIndex />
                    <div key={u.id} className="flex gap-3">
                      <div className="mt-1">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center",
                          u.type === "milestone" ? "bg-amber-500/15 text-amber-600" :
                          u.type === "deliverable" ? "bg-green-500/15 text-green-600" :
                          u.type === "issue" ? "bg-red-500/15 text-red-600" :
                          u.type === "note" ? "bg-gray-500/15 text-gray-600" :
                          "bg-blue-500/15 text-blue-600"
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{u.title}</span>
                          {!u.is_visible_to_client && (
                            <Badge variant="outline" className="text-[10px] gap-1 text-red-500 border-red-200">
                              <EyeOff className="h-3 w-3" /> Internal
                            </Badge>
                          )}
                        </div>
                        {u.body && (
                          <div className="text-sm text-muted-foreground mt-1 prose prose-sm max-w-none">
                            <ReactMarkdown>{u.body}</ReactMarkdown>
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(parseISO(u.created_at), "MMM d, yyyy · h:mm a")}
                        </div>
                      </div>
                    </div>
    </>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Linked Data */}
          {project.service_requests && (
            <Card className="p-5 space-y-3">
              <h3 className="font-semibold">{isAr ? "طلب الخدمة المرتبط" : "Linked Service Request"}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">{isAr ? "العنوان" : "Title"}:</span> {project.service_requests.title}</div>
                <div><span className="text-muted-foreground">{isAr ? "النوع" : "Type"}:</span> {project.service_requests.service_type}</div>
                <div><span className="text-muted-foreground">{isAr ? "الميزانية" : "Budget"}:</span> {project.service_requests.budget_range || "—"}</div>
                <div><span className="text-muted-foreground">{isAr ? "العميل" : "Client"}:</span> {project.service_requests.contact_name}</div>
              </div>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Budget */}
          <Card className="p-5 space-y-3">
            <h3 className="font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4" />{isAr ? "الميزانية" : "Budget"}</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">{isAr ? "الإجمالي" : "Total"}</span><span className="font-bold">{fmtCurrency(project.total_budget_usd)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">{isAr ? "المدفوع" : "Paid"}</span><span className="text-green-600">{fmtCurrency(project.paid_usd)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">{isAr ? "المتبقي" : "Remaining"}</span><span>{fmtCurrency(remaining)}</span></div>
              <Separator />
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground"><span>{isAr ? "المدفوع" : "Paid"}</span><span>{paidPct}%</span></div>
                <Progress value={paidPct} className="h-1.5" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground"><span>{isAr ? "التقدم" : "Progress"}</span><span>{project.progress_pct || 0}%</span></div>
                <Progress value={project.progress_pct || 0} className="h-1.5" />
              </div>
            </div>
          </Card>

          {/* Dates */}
          <Card className="p-5 space-y-2">
            <h3 className="font-semibold flex items-center gap-2"><Calendar className="h-4 w-4" />{isAr ? "التواريخ" : "Dates"}</h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? "البدء" : "Start"}</span><span>{project.start_date ? format(parseISO(project.start_date), "MMM d, yyyy") : "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? "المستهدف" : "Target"}</span><span className={cn(overdue && "text-red-500 font-medium")}>{project.target_end_date ? format(parseISO(project.target_end_date), "MMM d, yyyy") : "—"}</span></div>
              {project.actual_end_date && <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? "الفعلي" : "Actual"}</span><span>{format(parseISO(project.actual_end_date), "MMM d, yyyy")}</span></div>}
            </div>
          </Card>

          {/* Quote summary */}
          {project.quotes && (
            <Card className="p-5 space-y-2">
              <h3 className="font-semibold">{isAr ? "عرض السعر" : "Quote"}</h3>
              <div className="text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">#</span><span>{project.quotes.quote_number}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? "الإجمالي" : "Total"}</span><span className="font-bold">{fmtCurrency(project.quotes.total_usd)}</span></div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Add Update Dialog */}
      <Dialog open={addUpdateOpen} onOpenChange={setAddUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAr ? "إضافة تحديث" : "Add Update"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{isAr ? "النوع" : "Type"}</label>
              <Select value={updateType} onValueChange={(v) => {
                setUpdateType(v);
                if (v === "note") setUpdateVisible(false);
                else setUpdateVisible(true);
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="milestone">Milestone</SelectItem>
                  <SelectItem value="deliverable">Deliverable</SelectItem>
                  <SelectItem value="issue">Issue</SelectItem>
                  <SelectItem value="note">Internal Note</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">{isAr ? "العنوان" : "Title"} *</label>
              <Input value={updateTitle} onChange={(e) => setUpdateTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">{isAr ? "التفاصيل" : "Body"}</label>
              <Textarea value={updateBody} onChange={(e) => setUpdateBody(e.target.value)} rows={4} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={updateVisible} onCheckedChange={setUpdateVisible} />
              <span className="text-sm">{isAr ? "مرئي للعميل" : "Visible to client"}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddUpdateOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleAddUpdate} disabled={savingUpdate}>{savingUpdate ? "..." : isAr ? "إضافة" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
