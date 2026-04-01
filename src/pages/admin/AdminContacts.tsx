import SEO from "@/components/SEO";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/admin/EmptyState";
import ConfirmDeleteDialog from "@/components/admin/ConfirmDeleteDialog";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Mail, Eye, Trash2, CheckCircle2, Clock, Search } from "lucide-react";
import ExportCSVButton from "@/components/admin/ExportCSVButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import PaginationControls from "@/components/PaginationControls";

interface ContactSubmission {
  id: string; name: string; email: string; phone: string | null;
  subject: string | null; message: string; status: string;
  admin_notes: string | null; created_at: string;
}

export default function AdminContacts() {
  const { t, lang } = useLanguage();

  const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    new: { label: t("admin.newRequests"), color: "bg-primary/15 text-primary border-primary/20", icon: Mail },
    read: { label: t("admin.markRead"), color: "bg-blue-500/15 text-blue-600 border-blue-500/20", icon: Eye },
    replied: { label: t("admin.markReplied"), color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20", icon: CheckCircle2 },
    archived: { label: t("admin.archive"), color: "bg-muted text-muted-foreground border-border", icon: Clock } };

  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactSubmission | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const fetchSubmissions = async () => {
    let query = supabase.from("contact_submissions").select("*").order("created_at", { ascending: false });
    if (filterStatus !== "all") query = query.eq("status", filterStatus);
    const { data, error } = await query;
    if (!error && data) setSubmissions(data);
    setLoading(false);
  };

  useEffect(() => { fetchSubmissions(); setPage(1); }, [filterStatus]);

  const allFiltered = submissions.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || (s.subject?.toLowerCase().includes(q));
  });
  const totalPages = Math.ceil(allFiltered.length / PAGE_SIZE);
  const filtered = allFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openSubmission = async (sub: ContactSubmission) => {
    if (sub.status === "new") {
      await supabase.from("contact_submissions").update({ status: "read" }).eq("id", sub.id);
      fetchSubmissions();
    }
    setSelected(sub);
    setAdminNotes(sub.admin_notes || "");
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("contact_submissions").update({ status }).eq("id", id);
    if (selected?.id === id) setSelected({ ...selected, status });
    fetchSubmissions();
    toast.success(`${t("admin.status")}: ${status}`);
  };

  const saveNotes = async () => {
    if (!selected) return;
    setSavingNotes(true);
    await supabase.from("contact_submissions").update({ admin_notes: adminNotes }).eq("id", selected.id);
    setSavingNotes(false);
    toast.success(t("admin.saveNotes"));
    fetchSubmissions();
  };

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from("contact_submissions").delete().eq("id", deleteTarget);
    if (selected?.id === deleteTarget) setSelected(null);
    fetchSubmissions();
    toast.success(t("admin.delete"));
    setDeleting(false);
    setDeleteTarget(null);
  };

  const bulkUpdateStatus = async (status: string) => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    await supabase.from("contact_submissions").update({ status }).in("id", ids);
    setSelectedIds(new Set());
    fetchSubmissions();
    toast.success(`${ids.length} ${t("admin.selected")}`);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((s) => s.id)));
  };

  const counts = submissions.reduce((acc, s) => { acc[s.status] = (acc[s.status] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t("admin.contacts")}</h1>
        <p className="text-muted-foreground text-sm">{t("admin.manageContacts")}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {Object.entries(statusConfig).map(([key, cfg]) => (
          <button key={key} onClick={() => setFilterStatus(filterStatus === key ? "all" : key)}
            className={`p-3 rounded-xl border transition-all text-start ${filterStatus === key ? "ring-2 ring-primary border-primary" : "border-border hover:border-primary/30"} bg-card`}>
            <div className="flex items-center gap-2 mb-1">
              <cfg.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground capitalize">{cfg.label}</span>
            </div>
            <span className="text-xl font-bold">{counts[key] || 0}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("admin.searchContacts")} value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} className="ps-9" />
        </div>
        <ExportCSVButton data={allFiltered.map(s => ({ name: s.name, email: s.email, phone: s.phone, subject: s.subject, message: s.message, status: s.status, admin_notes: s.admin_notes, created_at: s.created_at }))} filename="contacts" />
        {selectedIds.size > 0 && (
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">{selectedIds.size} {t("admin.selected")}</span>
            <Button variant="outline" size="sm" onClick={() => bulkUpdateStatus("read")}>{t("admin.markRead")}</Button>
            <Button variant="outline" size="sm" onClick={() => bulkUpdateStatus("replied")}>{t("admin.markReplied")}</Button>
            <Button variant="outline" size="sm" onClick={() => bulkUpdateStatus("archived")}>{t("admin.archive")}</Button>
          </div>
        )}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="p-3 w-10"><Checkbox checked={filtered.length > 0 && selectedIds.size === filtered.length} onCheckedChange={toggleSelectAll} /></th>
              <th className="text-start p-3 text-xs font-medium text-muted-foreground">{t("admin.from")}</th>
              <th className="text-start p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">{t("admin.subject")}</th>
              <th className="text-start p-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">{t("admin.status")}</th>
              <th className="text-start p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">{t("admin.date")}</th>
              <th className="text-end p-3 text-xs font-medium text-muted-foreground">{t("admin.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-border"><td colSpan={6} className="p-3"><div className="h-6 bg-muted rounded animate-pulse" /></td></tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6}><EmptyState icon={Mail} title={lang === "ar" ? "لا توجد رسائل بعد" : "No messages yet"} description={lang === "ar" ? "ستظهر الرسائل هنا عند استلامها" : "Messages will appear here when received"} /></td></tr>
            ) : (
              filtered.map((sub) => {
                const cfg = statusConfig[sub.status] || statusConfig.new;
                return (
    <>
    <SEO title="Messages — Admin" noIndex />
                  <tr key={sub.id} className={`border-b border-border hover:bg-muted/30 transition-colors cursor-pointer ${sub.status === "new" ? "font-medium bg-primary/[0.02]" : ""}`} onClick={() => openSubmission(sub)}>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}><Checkbox checked={selectedIds.has(sub.id)} onCheckedChange={() => toggleSelect(sub.id)} /></td>
                    <td className="p-3 text-sm">
                      <div className="flex items-center gap-2">
                        {sub.status === "new" && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                        <div><div>{sub.name}</div><div className="text-xs text-muted-foreground font-normal">{sub.email}</div></div>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground hidden md:table-cell max-w-[200px] truncate">{sub.subject || "—"}</td>
                    <td className="p-3 hidden sm:table-cell"><Badge variant="outline" className={`${cfg.color} text-[10px]`}>{cfg.label}</Badge></td>
                    <td className="p-3 text-sm text-muted-foreground hidden lg:table-cell">{new Date(sub.created_at).toLocaleDateString()}</td>
                    <td className="p-3 text-end" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openSubmission(sub)}><Eye className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(sub.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
    </>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Mail className="h-4 w-4" />{t("admin.messageFrom")} {selected?.name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground text-xs">{t("admin.email")}</span><p className="font-medium">{selected.email}</p></div>
                <div><span className="text-muted-foreground text-xs">{t("admin.phone")}</span><p className="font-medium">{selected.phone || "—"}</p></div>
              </div>
              {selected.subject && <div className="text-sm"><span className="text-muted-foreground text-xs">{t("admin.subject")}</span><p className="font-medium">{selected.subject}</p></div>}
              <div className="text-sm"><span className="text-muted-foreground text-xs">{t("admin.message")}</span><p className="mt-1 bg-muted/50 p-3 rounded-lg text-sm leading-relaxed whitespace-pre-wrap">{selected.message}</p></div>
              <div>
                <span className="text-muted-foreground text-xs block mb-2">{t("admin.updateStatus")}</span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statusConfig).map(([key, cfg]) => (
                    <Button key={key} variant={selected.status === key ? "default" : "outline"} size="sm" className="text-xs" onClick={() => updateStatus(selected.id, key)}>
                      <cfg.icon className="h-3 w-3 me-1" />{cfg.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground text-xs block mb-2">{t("admin.adminNotes")}</span>
                <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder={t("admin.addNotes")} rows={3} className="text-sm" />
                <Button size="sm" className="mt-2" onClick={saveNotes} disabled={savingNotes}>{savingNotes ? t("admin.saving") : t("admin.saveNotes")}</Button>
              </div>
              <p className="text-[10px] text-muted-foreground">{t("admin.received")}: {new Date(selected.created_at).toLocaleString()}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDeleteDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }} onConfirm={confirmDelete} loading={deleting} />
    </div>
  );
}
