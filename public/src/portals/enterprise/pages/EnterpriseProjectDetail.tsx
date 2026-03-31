/**
 * Enterprise — Project Workspace detail page.
 */
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/core/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Calendar, DollarSign, Clock, CheckCircle2,
  FileText, MessageSquare, Paperclip, BarChart3, Loader2,
  AlertCircle, Target, PauseCircle, XCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { PROJECT_STATUS_COLORS, PAYMENT_STATUS_COLORS, formatStatus } from "../constants";

const PROJECT_STAGES = [
  { key: "planning", label_en: "Planning", label_ar: "التخطيط" },
  { key: "in_progress", label_en: "In Progress", label_ar: "قيد التنفيذ" },
  { key: "review", label_en: "Review", label_ar: "المراجعة" },
  { key: "completed", label_en: "Completed", label_ar: "مكتمل" },
];

function stageIndex(status: string): number {
  const i = PROJECT_STAGES.findIndex((s) => s.key === status);
  return i >= 0 ? i : -1;
}

const updateTypeIcons: Record<string, React.ElementType> = {
  milestone: Target,
  progress: BarChart3,
  deliverable: CheckCircle2,
  note: MessageSquare,
  document: FileText,
};

export default function EnterpriseProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const { data: project, isLoading } = useQuery({
    queryKey: ["enterprise-project", id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_tracking")
        .select("*")
        .eq("id", id!)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: updates = [] } = useQuery({
    queryKey: ["enterprise-project-updates", id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_updates")
        .select("*")
        .eq("project_id", id!)
        .eq("is_visible_to_client", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["enterprise-project-payments", id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user!.id)
        .eq("reference_id", id!)
        .eq("reference_type", "project")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">{isAr ? "المشروع غير موجود" : "Project not found"}</p>
        <Link to="/enterprise/portal/projects"><Button variant="outline" className="mt-3">{isAr ? "رجوع" : "Back"}</Button></Link>
      </div>
    );
  }

  const totalBudget = project.total_budget_usd ?? 0;
  const totalPaid = project.paid_usd ?? 0;
  const remaining = totalBudget - totalPaid;

  return (
    <div className="space-y-6">
      <PageHeader
        title_en={project.title}
        title_ar={project.title}
        description_en={project.description ?? ""}
        description_ar={project.description ?? ""}
        badge={
          <Badge variant="secondary" className={PROJECT_STATUS_COLORS[project.status] ?? ""}>
            {formatStatus(project.status)}
          </Badge>
        }
        actions={
          <Link to="/enterprise/portal/projects">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 me-1 icon-flip-rtl" />{isAr ? "رجوع" : "Back"}</Button>
          </Link>
        }
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{project.progress_pct ?? 0}%</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "التقدم" : "Progress"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">${totalBudget.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "الميزانية" : "Budget"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            <p className="text-sm font-bold">{project.start_date ? new Date(project.start_date).toLocaleDateString() : "—"}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "تاريخ البدء" : "Start Date"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 text-amber-600 mx-auto mb-1" />
            <p className="text-sm font-bold">{project.target_end_date ? new Date(project.target_end_date).toLocaleDateString() : "—"}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "تاريخ التسليم" : "Deadline"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Timeline Stepper */}
      <Card>
        <CardContent className="py-6 px-4">
          <div className="flex items-center justify-between">
            {PROJECT_STAGES.map((stage, i) => {
              const currentIdx = stageIndex(project.status);
              const isPast = currentIdx > i;
              const isCurrent = currentIdx === i;
              return (
                <div key={stage.key} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={cn(
                        "h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors",
                        isPast && "bg-primary border-primary text-primary-foreground",
                        isCurrent && "border-primary text-primary bg-primary/10",
                        !isPast && !isCurrent && "border-muted-foreground/25 text-muted-foreground/50 bg-muted/30",
                      )}
                    >
                      {isPast ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium text-center whitespace-nowrap",
                        (isPast || isCurrent) ? "text-foreground" : "text-muted-foreground/60",
                      )}
                    >
                      {isAr ? stage.label_ar : stage.label_en}
                    </span>
                  </div>
                  {i < PROJECT_STAGES.length - 1 && (
                    <div
                      className={cn(
                        "flex-1 h-0.5 mx-2 mt-[-1.25rem] rounded-full",
                        isPast ? "bg-primary" : "bg-muted-foreground/15",
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
          {(project.status === "on_hold" || project.status === "cancelled") && (
            <div className={cn(
              "mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
              project.status === "on_hold" ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" : "bg-destructive/10 text-destructive",
            )}>
              {project.status === "on_hold"
                ? <><PauseCircle className="h-4 w-4 flex-shrink-0" />{isAr ? "هذا المشروع معلّق حالياً" : "This project is currently on hold"}</>
                : <><XCircle className="h-4 w-4 flex-shrink-0" />{isAr ? "تم إلغاء هذا المشروع" : "This project has been cancelled"}</>
              }
            </div>
          )}
        </CardContent>
      </Card>

      {project.progress_pct != null && <Progress value={project.progress_pct} className="h-2" />}

      {/* Tabs */}
      <Tabs defaultValue="updates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="updates">{isAr ? "التحديثات" : "Updates"}</TabsTrigger>
          <TabsTrigger value="billing">{isAr ? "الفواتير" : "Billing"}</TabsTrigger>
        </TabsList>

        <TabsContent value="updates">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {isAr ? "تحديثات المشروع" : "Project Updates"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {updates.length === 0 ? (
                <div className="text-center py-10">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{isAr ? "لا توجد تحديثات بعد" : "No updates yet"}</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="relative">
                    <div className="absolute start-[9px] top-3 bottom-3 w-px bg-border" />
                    <div className="space-y-5">
                      {updates.map((u) => {
                        const Icon = updateTypeIcons[u.type] ?? MessageSquare;
                        return (
                          <div key={u.id} className="flex gap-4 relative">
                            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 z-10 mt-0.5">
                              <Icon className="h-3 w-3 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-sm font-medium">{u.title}</p>
                                <Badge variant="outline" className="text-[10px]">{u.type}</Badge>
                              </div>
                              {u.body && <p className="text-sm text-muted-foreground">{u.body}</p>}
                              {u.attachments && u.attachments.length > 0 && (
                                <div className="flex gap-2 mt-1.5">
                                  {u.attachments.map((a: string, i: number) => (
                                    <a key={i} href={a} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                                      <Paperclip className="h-3 w-3" />
                                      {isAr ? `مرفق ${i + 1}` : `Attachment ${i + 1}`}
                                    </a>
                                  ))}
                                </div>
                              )}
                              <p className="text-[10px] text-muted-foreground/50 mt-1">
                                {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {isAr ? "ملخص الفواتير" : "Billing Summary"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground">{isAr ? "الميزانية" : "Budget"}</p>
                  <p className="text-lg font-bold">${totalBudget.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/10 text-center">
                  <p className="text-xs text-muted-foreground">{isAr ? "مدفوع" : "Paid"}</p>
                  <p className="text-lg font-bold text-emerald-600">${totalPaid.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-500/10 text-center">
                  <p className="text-xs text-muted-foreground">{isAr ? "متبقي" : "Remaining"}</p>
                  <p className="text-lg font-bold text-amber-600">${remaining.toLocaleString()}</p>
                </div>
              </div>

              <Separator />

              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">{isAr ? "لا توجد مدفوعات" : "No payments recorded"}</p>
              ) : (
                <div className="space-y-2">
                  {payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg border">
                      <div>
                        <p className="text-sm">{p.description ?? p.type}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">${p.amount_usd}</p>
                        <Badge variant="secondary" className={`text-[10px] ${PAYMENT_STATUS_COLORS[p.status] ?? ""}`}>
                          {formatStatus(p.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
