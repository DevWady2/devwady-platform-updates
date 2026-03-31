import SEO from "@/components/SEO";
import { useState, useMemo } from "react";
import { EmptyState } from "@/components/admin/EmptyState";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, CheckCircle, XCircle, Clock, Search, UserCheck, RefreshCw, Calendar } from "lucide-react";
import ExportCSVButton from "@/components/admin/ExportCSVButton";
import { toast } from "sonner";
import PaginationControls from "@/components/PaginationControls";

export default function AdminBookings() {
  const { t, lang } = useLanguage();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const [tab, setTab] = useState("all");

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("consulting_bookings").select("*, consulting_experts(id, name, name_ar, initials, avatar_url, track)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    } });

  const { data: experts = [] } = useQuery({
    queryKey: ["admin-experts-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("consulting_experts").select("id, name, name_ar, initials, track, is_active").order("name");
      if (error) throw error;
      return data;
    } });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase.from("consulting_bookings").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-bookings"] }); toast.success(t("admin.save")); },
    onError: (e: any) => toast.error(e.message) });

  const allFiltered = useMemo(() => {
    let list = bookings;
    if (tab === "requests") list = list.filter((b: any) => b.status === "pending" || b.status === "payment_pending");
    if (tab === "confirmed") list = list.filter((b: any) => b.status === "confirmed");
    if (tab === "completed") list = list.filter((b: any) => b.status === "completed");
    if (tab === "cancelled") list = list.filter((b: any) => b.status === "cancelled");
    if (statusFilter !== "all") list = list.filter((b: any) => b.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((b: any) => (b.guest_name || "").toLowerCase().includes(q) || (b.guest_email || "").toLowerCase().includes(q) || (b.consulting_experts?.name || "").toLowerCase().includes(q) || (b.track || "").toLowerCase().includes(q));
    }
    return list;
  }, [bookings, tab, statusFilter, search]);
  const totalPages = Math.ceil(allFiltered.length / PAGE_SIZE);
  const filtered = allFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);


  const statusColor = (s: string) => { if (s === "confirmed") return "default" as const; if (s === "pending" || s === "payment_pending") return "secondary" as const; if (s === "cancelled") return "destructive" as const; return "outline" as const; };
  const paymentColor = (s: string | null) => (s === "paid" ? "default" as const : "destructive" as const);

  const counts = {
    all: bookings.length,
    requests: bookings.filter((b: any) => b.status === "pending" || b.status === "payment_pending").length,
    confirmed: bookings.filter((b: any) => b.status === "confirmed").length,
    completed: bookings.filter((b: any) => b.status === "completed").length,
    cancelled: bookings.filter((b: any) => b.status === "cancelled").length };

  const handleAssignExpert = (expertId: string) => {
    if (!selected) return;
    updateMutation.mutate({ id: selected.id, updates: { expert_id: expertId } });
    const expert = experts.find((e: any) => e.id === expertId);
    setSelected((s: any) => ({ ...s, expert_id: expertId, consulting_experts: expert ? { id: expert.id, name: expert.name, initials: expert.initials, avatar_url: null, track: expert.track } : s.consulting_experts }));
  };

  const handleSaveNotes = () => { if (!selected) return; updateMutation.mutate({ id: selected.id, updates: { admin_notes: selected.admin_notes } }); };

  return (
    <>
    <SEO title="Bookings — Admin" noIndex />
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("admin.bookingsRequests")}</h1>
          <p className="text-muted-foreground text-sm">{t("admin.manageBookings")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["admin-bookings"] })}><RefreshCw className="h-3.5 w-3.5 me-1" /> {t("admin.refresh")}</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { labelKey: "admin.total", value: counts.all, icon: Clock, color: "text-foreground" },
          { labelKey: "admin.newRequests", value: counts.requests, icon: Clock, color: "text-warning" },
          { labelKey: "admin.confirmed", value: counts.confirmed, icon: CheckCircle, color: "text-success" },
          { labelKey: "admin.completed", value: counts.completed, icon: CheckCircle, color: "text-primary" },
          { labelKey: "admin.cancelled", value: counts.cancelled, icon: XCircle, color: "text-destructive" },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-3">
            <div className="flex items-center gap-2 mb-1"><s.icon className={`h-3.5 w-3.5 ${s.color}`} /><span className="text-xs text-muted-foreground">{t(s.labelKey)}</span></div>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">{t("admin.total")} ({counts.all})</TabsTrigger>
            <TabsTrigger value="requests">{t("admin.requests")} ({counts.requests})</TabsTrigger>
            <TabsTrigger value="confirmed">{t("admin.confirmed")} ({counts.confirmed})</TabsTrigger>
            <TabsTrigger value="completed">{t("admin.done")} ({counts.completed})</TabsTrigger>
            <TabsTrigger value="cancelled">{t("admin.cancelled")} ({counts.cancelled})</TabsTrigger>
          </TabsList>
          <div className="relative w-full sm:w-64">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t("admin.searchBookings")} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9 h-9" />
          </div>
          <ExportCSVButton data={allFiltered.map((b: any) => ({ guest_name: b.guest_name, guest_email: b.guest_email, booking_date: b.booking_date, start_time: b.start_time, end_time: b.end_time, status: b.status, payment_status: b.payment_status, amount_usd: b.amount_usd, track: b.track, notes: b.notes, created_at: b.created_at }))} filename="bookings" />
        </div>

        <TabsContent value={tab} className="mt-4">
          <div className="overflow-x-auto"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.client")}</TableHead>
                <TableHead>{t("admin.expert")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("admin.date")}</TableHead>
                <TableHead className="hidden sm:table-cell">{t("admin.time")}</TableHead>
                <TableHead>{t("admin.status")}</TableHead>
                <TableHead className="hidden lg:table-cell">{t("admin.payment")}</TableHead>
                <TableHead className="hidden lg:table-cell">{t("admin.amount")}</TableHead>
                <TableHead className="w-16">{t("admin.view")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (<TableRow key={i}><TableCell colSpan={8}><div className="h-6 bg-muted rounded animate-pulse" /></TableCell></TableRow>))
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8}><EmptyState icon={Calendar} title={lang === "ar" ? "لا توجد حجوزات بعد" : "No bookings yet"} description={lang === "ar" ? "ستظهر الحجوزات هنا" : "Bookings will appear here when clients book sessions"} /></TableCell></TableRow>
              ) : (
                filtered.map((b: any) => (
                  <TableRow key={b.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelected(b)}>
                    <TableCell><div className="font-medium text-sm">{b.guest_name || "—"}</div><div className="text-xs text-muted-foreground">{b.guest_email || "—"}</div></TableCell>
                    <TableCell><div className="flex items-center gap-2"><div className="h-6 w-6 rounded-full gradient-brand flex items-center justify-center text-primary-foreground text-[9px] font-bold">{b.consulting_experts?.initials || "?"}</div><span className="text-sm">{b.consulting_experts?.name || "—"}</span></div></TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{b.booking_date}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{b.start_time?.slice(0, 5)} - {b.end_time?.slice(0, 5)}</TableCell>
                    <TableCell><Badge variant={statusColor(b.status)} className="text-[10px]">{b.status}</Badge></TableCell>
                    <TableCell className="hidden lg:table-cell"><Badge variant={paymentColor(b.payment_status)} className="text-[10px]">{b.payment_status || "unpaid"}</Badge></TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{b.amount_usd ? `$${b.amount_usd}` : "—"}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setSelected(b); }}><Eye className="h-3.5 w-3.5" /></Button></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table></div>
        </TabsContent>
      </Tabs>
      <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t("admin.bookingDetails")}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">{t("admin.client")}:</span><p className="font-medium">{selected.guest_name || "—"}</p></div>
                <div><span className="text-muted-foreground">{t("admin.email")}:</span><p className="font-medium">{selected.guest_email || "—"}</p></div>
                <div><span className="text-muted-foreground">{t("admin.phone")}:</span><p className="font-medium">{selected.guest_phone || "—"}</p></div>
                <div><span className="text-muted-foreground">{t("admin.track")}:</span><p className="font-medium">{selected.track || "—"}</p></div>
                <div><span className="text-muted-foreground">{t("admin.date")}:</span><p className="font-medium">{selected.booking_date}</p></div>
                <div><span className="text-muted-foreground">{t("admin.time")}:</span><p className="font-medium">{selected.start_time?.slice(0, 5)} - {selected.end_time?.slice(0, 5)}</p></div>
                <div><span className="text-muted-foreground">{t("admin.amount")}:</span><p className="font-medium">${selected.amount_usd || 0}</p></div>
                <div><span className="text-muted-foreground">{t("admin.created")}:</span><p className="font-medium">{new Date(selected.created_at).toLocaleDateString()}</p></div>
              </div>
              {selected.notes && <div><span className="text-sm text-muted-foreground">{t("admin.clientNotes")}:</span><p className="mt-1 bg-muted/50 p-3 rounded-lg text-sm">{selected.notes}</p></div>}
              <div className="pt-2 border-t border-border">
                <Label className="text-xs flex items-center gap-1 mb-1"><UserCheck className="h-3 w-3" /> {t("admin.assignExpert")}</Label>
                <Select value={selected.expert_id || ""} onValueChange={handleAssignExpert}>
                  <SelectTrigger className="h-9"><SelectValue placeholder={t("admin.selectExpert")} /></SelectTrigger>
                  <SelectContent>{experts.map((e: any) => (<SelectItem key={e.id} value={e.id}>{e.name} — {e.track}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{t("admin.status")}</Label>
                  <Select value={selected.status} onValueChange={v => { updateMutation.mutate({ id: selected.id, updates: { status: v } }); setSelected((s: any) => ({ ...s, status: v })); }}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{t("admin.pending")}</SelectItem>
                      <SelectItem value="payment_pending">{t("admin.payment")} {t("admin.pending")}</SelectItem>
                      <SelectItem value="confirmed">{t("admin.confirmed")}</SelectItem>
                      <SelectItem value="completed">{t("admin.completed")}</SelectItem>
                      <SelectItem value="cancelled">{t("admin.cancelled")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">{t("admin.payment")}</Label>
                  <Select value={selected.payment_status || "unpaid"} onValueChange={v => { updateMutation.mutate({ id: selected.id, updates: { payment_status: v } }); setSelected((s: any) => ({ ...s, payment_status: v })); }}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">{t("admin.adminNotes")}</Label>
                <Textarea value={selected.admin_notes || ""} onChange={(e) => setSelected((s: any) => ({ ...s, admin_notes: e.target.value }))} placeholder={t("admin.addNotes")} rows={3} className="mt-1" />
                <Button size="sm" variant="outline" className="mt-2" onClick={handleSaveNotes}>{t("admin.saveNotes")}</Button>
              </div>
              <div className="flex gap-2 pt-2 border-t border-border">
                {selected.status === "pending" && (
                  <>
                    <Button size="sm" onClick={() => { updateMutation.mutate({ id: selected.id, updates: { status: "confirmed" } }); setSelected((s: any) => ({ ...s, status: "confirmed" })); }}><CheckCircle className="h-3.5 w-3.5 me-1" /> {t("admin.confirm")}</Button>
                    <Button size="sm" variant="destructive" onClick={() => { updateMutation.mutate({ id: selected.id, updates: { status: "cancelled" } }); setSelected((s: any) => ({ ...s, status: "cancelled" })); }}><XCircle className="h-3.5 w-3.5 me-1" /> {t("admin.cancel")}</Button>
                  </>
                )}
                {selected.status === "confirmed" && (
                  <Button size="sm" onClick={() => { updateMutation.mutate({ id: selected.id, updates: { status: "completed" } }); setSelected((s: any) => ({ ...s, status: "completed" })); }}><CheckCircle className="h-3.5 w-3.5 me-1" /> {t("admin.markComplete")}</Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
