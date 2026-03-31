import SEO from "@/components/SEO";
import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PaginationControls from "@/components/PaginationControls";
import { toast } from "sonner";
import { format, isPast, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Plus, LayoutGrid, List, MoreVertical, CalendarIcon } from "lucide-react";
import { Link } from "react-router-dom";

const STATUS_CONFIG: Record<string, { label: string; labelAr: string; color: string }> = {
  planning: { label: "Planning", labelAr: "تخطيط", color: "bg-blue-500/15 text-blue-600" },
  in_progress: { label: "In Progress", labelAr: "قيد التنفيذ", color: "bg-amber-500/15 text-amber-600" },
  review: { label: "Review", labelAr: "مراجعة", color: "bg-purple-500/15 text-purple-600" },
  delivered: { label: "Delivered", labelAr: "تم التسليم", color: "bg-teal-500/15 text-teal-600" },
  completed: { label: "Completed", labelAr: "مكتمل", color: "bg-green-500/15 text-green-600" },
  on_hold: { label: "On Hold", labelAr: "معلق", color: "bg-gray-500/15 text-gray-600" },
  cancelled: { label: "Cancelled", labelAr: "ملغي", color: "bg-red-500/15 text-red-600" },
};

const BOARD_COLUMNS = ["planning", "in_progress", "review", "delivered", "completed"];
const PER_PAGE = 15;

export default function AdminProjects() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const queryClient = useQueryClient();
  const [view, setView] = useState<"board" | "table">(() => (localStorage.getItem("admin-projects-view") as any) || "board");
  const [search, setSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [page, setPage] = useState(1);

  // Form state
  const [formRequestId, setFormRequestId] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formStart, setFormStart] = useState<Date | undefined>();
  const [formEnd, setFormEnd] = useState<Date | undefined>();
  const [formBudget, setFormBudget] = useState("");
  const [formPM, setFormPM] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: projects = [] } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_tracking")
        .select("*, service_requests(contact_name, contact_email, title), quotes(quote_number, total_usd)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });

  const { data: approvedRequests = [] } = useQuery({
    queryKey: ["approved-requests-no-project"],
    queryFn: async () => {
      const { data: existingProjectRequestIds } = await supabase
        .from("project_tracking")
        .select("service_request_id")
        .not("service_request_id", "is", null);
      const usedIds = (existingProjectRequestIds || []).map((r: any) => r.service_request_id).filter(Boolean);

      let q = supabase.from("service_requests").select("id, title, contact_name, user_id").eq("status", "approved").or("category.eq.project,category.is.null");
      if (usedIds.length > 0) {
        q = q.not("id", "in", `(${usedIds.join(",")})`);
      }
      const { data } = await q;
      return data || [];
    },
    staleTime: 60000,
  });

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    let activeBudget = 0;
    for (const p of projects) {
      counts[p.status] = (counts[p.status] || 0) + 1;
      if (!["completed", "cancelled"].includes(p.status)) {
        activeBudget += Number(p.total_budget_usd) || 0;
      }
    }
    return { counts, activeBudget };
  }, [projects]);

  const filtered = useMemo(() => {
    if (!search) return projects;
    const s = search.toLowerCase();
    return projects.filter(
      (p: any) =>
        p.title?.toLowerCase().includes(s) ||
        p.service_requests?.contact_name?.toLowerCase().includes(s)
    );
  }, [projects, search]);

  const toggleView = (v: "board" | "table") => {
    setView(v);
    localStorage.setItem("admin-projects-view", v);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("project_tracking").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
    }
  };

  const handleCreate = async () => {
    if (!formTitle.trim()) return toast.error("Title is required");
    setSaving(true);
    const payload: any = {
      title: formTitle,
      description: formDesc || null,
      start_date: formStart ? format(formStart, "yyyy-MM-dd") : null,
      target_end_date: formEnd ? format(formEnd, "yyyy-MM-dd") : null,
      total_budget_usd: formBudget ? parseFloat(formBudget) : null,
      project_manager_id: formPM || null,
      service_request_id: formRequestId || null,
    };
    if (formRequestId) {
      const req = approvedRequests.find((r: any) => r.id === formRequestId);
      if (req) payload.user_id = req.user_id;
    }
    const { error } = await supabase.from("project_tracking").insert(payload);
    if (error) {
      toast.error(error.message);
    } else {
      if (formRequestId) {
        await supabase.from("service_requests").update({ status: "in_progress" }).eq("id", formRequestId);
      }
      toast.success("Project created");
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      queryClient.invalidateQueries({ queryKey: ["approved-requests-no-project"] });
      setNewOpen(false);
      setFormTitle(""); setFormDesc(""); setFormStart(undefined); setFormEnd(undefined); setFormBudget(""); setFormPM(""); setFormRequestId("");
    }
    setSaving(false);
  };

  const fmtCurrency = (v: number | null) =>
    v != null ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v) : "—";

  const statCards = [
    { label: "Planning", count: stats.counts.planning || 0, color: "text-blue-600" },
    { label: isAr ? "قيد التنفيذ" : "In Progress", count: stats.counts.in_progress || 0, color: "text-amber-600" },
    { label: isAr ? "مراجعة" : "Review", count: stats.counts.review || 0, color: "text-purple-600" },
    { label: isAr ? "تم التسليم" : "Delivered", count: stats.counts.delivered || 0, color: "text-teal-600" },
    { label: isAr ? "مكتمل" : "Completed", count: stats.counts.completed || 0, color: "text-green-600" },
  ];

  const paginatedTable = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="space-y-6">
      <AdminPageHeader title={isAr ? "المشاريع" : "Projects"} subtitle={isAr ? "إدارة المشاريع النشطة" : "Manage active projects"} />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((s) => (
          <Card key={s.label} className="p-4 text-center">
            <div className={cn("text-2xl font-bold", s.color)}>{s.count}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </Card>
        ))}
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{fmtCurrency(stats.activeBudget)}</div>
          <div className="text-xs text-muted-foreground mt-1">{isAr ? "الميزانية النشطة" : "Active Budget"}</div>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder={isAr ? "بحث..." : "Search..."} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <div className="flex gap-1 border rounded-lg p-0.5">
          <Button variant={view === "board" ? "default" : "ghost"} size="sm" onClick={() => toggleView("board")}><LayoutGrid className="h-4 w-4" /></Button>
          <Button variant={view === "table" ? "default" : "ghost"} size="sm" onClick={() => toggleView("table")}><List className="h-4 w-4" /></Button>
        </div>
        <div className="flex-1" />
        <Button onClick={() => setNewOpen(true)} className="gap-2"><Plus className="h-4 w-4" />{isAr ? "مشروع جديد" : "New Project"}</Button>
      </div>

      {/* Board View */}
      {view === "board" && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {BOARD_COLUMNS.map((col) => {
            const colProjects = filtered.filter((p: any) => p.status === col);
            const cfg = STATUS_CONFIG[col];
            return (
              <div key={col} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className={cn(cfg.color, "text-xs")}>{isAr ? cfg.labelAr : cfg.label}</Badge>
                  <span className="text-xs text-muted-foreground">{colProjects.length}</span>
                </div>
                <div className="space-y-2 min-h-[100px]">
                  {colProjects.map((p: any) => (
                    <ProjectCard key={p.id} project={p} isAr={isAr} fmtCurrency={fmtCurrency} onStatusChange={updateStatus} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {view === "table" && (
        <>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isAr ? "العنوان" : "Title"}</TableHead>
                  <TableHead>{isAr ? "العميل" : "Client"}</TableHead>
                  <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{isAr ? "التقدم" : "Progress"}</TableHead>
                  <TableHead>{isAr ? "الميزانية" : "Budget"}</TableHead>
                  <TableHead>{isAr ? "المدفوع" : "Paid"}</TableHead>
                  <TableHead>{isAr ? "التاريخ المستهدف" : "Target Date"}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTable.map((p: any) => {
                  const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.planning;
                  const overdue = p.target_end_date && isPast(parseISO(p.target_end_date)) && !["completed", "cancelled"].includes(p.status);
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link to={`/admin/projects/${p.id}`} className="font-medium hover:underline">{p.title}</Link>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.service_requests?.contact_name || "—"}</TableCell>
                      <TableCell><Badge className={cn(cfg.color, "text-xs")}>{isAr ? cfg.labelAr : cfg.label}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={p.progress_pct || 0} className="h-1.5 w-16" />
                          <span className="text-xs">{p.progress_pct || 0}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{fmtCurrency(p.total_budget_usd)}</TableCell>
                      <TableCell className="text-sm">{fmtCurrency(p.paid_usd)}</TableCell>
                      <TableCell className={cn("text-sm", overdue && "text-red-500 font-medium")}>
                        {p.target_end_date ? format(parseISO(p.target_end_date), "MMM d, yyyy") : "—"}
                      </TableCell>
                      <TableCell>
                        <StatusDropdown project={p} isAr={isAr} onStatusChange={updateStatus} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table></div>
          </Card>
          {filtered.length > PER_PAGE && (
            <PaginationControls page={page} totalPages={Math.ceil(filtered.length / PER_PAGE)} onPageChange={setPage} />
          )}
        </>
      )}

      {/* New Project Dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isAr ? "مشروع جديد" : "New Project"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{isAr ? "ربط بطلب خدمة" : "Link to service request"}</label>
              <Select value={formRequestId} onValueChange={(v) => {
                setFormRequestId(v);
                const req = approvedRequests.find((r: any) => r.id === v);
                if (req) setFormTitle(req.title);
              }}>
                <SelectTrigger><SelectValue placeholder={isAr ? "اختياري" : "Optional"} /></SelectTrigger>
                <SelectContent>
                  {approvedRequests.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>{r.title} — {r.contact_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">{isAr ? "العنوان" : "Title"} *</label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">{isAr ? "الوصف" : "Description"}</label>
              <Textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">{isAr ? "تاريخ البدء" : "Start date"}</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start", !formStart && "text-muted-foreground")}>
                      <CalendarIcon className="me-2 h-4 w-4" />
                      {formStart ? format(formStart, "PPP") : isAr ? "اختر" : "Pick"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formStart} onSelect={setFormStart} className="p-3 pointer-events-auto" /></PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-sm font-medium">{isAr ? "التاريخ المستهدف" : "Target end"}</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start", !formEnd && "text-muted-foreground")}>
                      <CalendarIcon className="me-2 h-4 w-4" />
                      {formEnd ? format(formEnd, "PPP") : isAr ? "اختر" : "Pick"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formEnd} onSelect={setFormEnd} className="p-3 pointer-events-auto" /></PopoverContent>
                </Popover>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">{isAr ? "الميزانية ($)" : "Budget ($)"}</label>
              <Input type="number" value={formBudget} onChange={(e) => setFormBudget(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? "..." : isAr ? "إنشاء" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProjectCard({ project: p, isAr, fmtCurrency, onStatusChange }: any) {
  const overdue = p.target_end_date && isPast(parseISO(p.target_end_date)) && !["completed", "cancelled"].includes(p.status);

  return (
    <Card className="p-3 space-y-2 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <Link to={`/admin/projects/${p.id}`} className="font-medium text-sm truncate flex-1 hover:underline">{p.title}</Link>
        <StatusDropdown project={p} isAr={isAr} onStatusChange={onStatusChange} />
      </div>
      <div className="text-xs text-muted-foreground truncate">{p.service_requests?.contact_name || "—"}</div>
      <Progress value={p.progress_pct || 0} className="h-1.5" />
      <div className="flex items-center justify-between text-xs">
        <span className={cn(overdue && "text-red-500 font-medium")}>
          {p.target_end_date ? format(parseISO(p.target_end_date), "MMM d") : "—"}
        </span>
        <span className="font-medium">{fmtCurrency(p.total_budget_usd)}</span>
      </div>
    </Card>
  );
}

function StatusDropdown({ project, isAr, onStatusChange }: any) {
  return (
    <>
    <SEO title="Projects — Admin" noIndex />
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6"><MoreVertical className="h-3.5 w-3.5" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>{isAr ? "تغيير الحالة" : "Change Status"}</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <DropdownMenuItem key={key} onClick={() => onStatusChange(project.id, key)} disabled={project.status === key}>
                {isAr ? cfg.labelAr : cfg.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem asChild>
          <Link to={`/admin/projects/${project.id}`}>{isAr ? "عرض التفاصيل" : "View Details"}</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </>
  );
}
