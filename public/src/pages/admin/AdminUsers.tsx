import SEO from "@/components/SEO";
import { useEffect, useState, useMemo, useCallback } from "react";
import { EmptyState } from "@/components/admin/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Users, Shield, ShieldCheck, UserCircle, Search, RefreshCw, CheckCircle2, PauseCircle, Ban, PlayCircle, Clock, ShieldX } from "lucide-react";
import ExportCSVButton from "@/components/admin/ExportCSVButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { getAccountTypeLabel, legacyRoleFromAccountType, normalizeAccountType, type CanonicalAccountType } from "@/lib/accountType";

interface UserRecord {
  id: string; email: string; created_at: string; last_sign_in_at: string | null;
  email_confirmed_at: string | null; full_name: string | null; avatar_url: string | null;
  account_type: CanonicalAccountType | null;
  capabilities: string[];
  approval_status: string | null;
  badges: unknown;
  entitlements: unknown;
  role: "individual" | "company" | "admin" | "expert" | "instructor" | "student" | null;
  roles?: string[];
  role_id: string | null;
  account_status: string; status_reason: string | null; status_changed_at: string | null; status_changed_by: string | null;
}

const PAGE_SIZE = 20;

const resolveUserAccountType = (user: Pick<UserRecord, "account_type" | "role">) => normalizeAccountType(user.account_type) ?? normalizeAccountType(user.role);
const countValue = (value: unknown) => Array.isArray(value) ? value.length : value && typeof value === "object" ? Object.keys(value as Record<string, unknown>).length : 0;

const statusConfig: Record<string, { label_en: string; label_ar: string; color: string }> = {
  active: { label_en: "Active", label_ar: "نشط", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20" },
  pending_approval: { label_en: "Pending approval", label_ar: "بانتظار الموافقة", color: "bg-amber-500/15 text-amber-600 border-amber-500/20" },
  pending_verification: { label_en: "Unverified", label_ar: "غير موثق", color: "bg-blue-500/15 text-blue-600 border-blue-500/20" },
  suspended: { label_en: "Suspended", label_ar: "معلق", color: "bg-orange-500/15 text-orange-600 border-orange-500/20" },
  banned: { label_en: "Banned", label_ar: "محظور", color: "bg-red-500/15 text-red-600 border-red-500/20" },
  deactivated: { label_en: "Deactivated", label_ar: "معطل", color: "bg-muted text-muted-foreground border-border" } };

export default function AdminUsers() {
  const { t, lang } = useLanguage();

  const accountTypeConfig: Record<CanonicalAccountType, { label: string; color: string; icon: React.ElementType }> = {
    admin: { label: t("admin.administrator"), color: "bg-red-500/15 text-red-600 border-red-500/20", icon: ShieldCheck },
    company: { label: "Company", color: "bg-blue-500/15 text-blue-600 border-blue-500/20", icon: Shield },
    freelancer: { label: lang === "ar" ? "مستقل" : "Freelancer", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20", icon: UserCircle },
    expert: { label: "Expert", color: "bg-purple-500/15 text-purple-600 border-purple-500/20", icon: ShieldCheck },
    instructor: { label: "Instructor", color: "bg-teal-500/15 text-teal-600 border-teal-500/20", icon: ShieldCheck },
    student: { label: "Student", color: "bg-cyan-500/15 text-cyan-600 border-cyan-500/20", icon: UserCircle } };

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selected, setSelected] = useState<UserRecord | null>(null);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [page, setPage] = useState(0);

  // Action dialog state
  const [actionDialog, setActionDialog] = useState<{ type: "suspend" | "ban"; user: UserRecord } | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try { const { data, error } = await supabase.functions.invoke("list-users"); if (error) throw error; setUsers(data || []); } catch { toast.error("Failed to load users"); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(0); }, [searchQuery, filterRole, filterStatus]);

  const pendingCount = useMemo(() => users.filter(u => u.account_status === "pending_approval").length, [users]);

  const filtered = useMemo(() => users.filter((u) => {
    const resolvedAccountType = resolveUserAccountType(u);
    if (filterRole !== "all" && (filterRole === "none" ? resolvedAccountType !== null : resolvedAccountType !== filterRole)) return false;
    if (filterStatus !== "all" && u.account_status !== filterStatus) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return u.email?.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q);
  }), [users, filterRole, filterStatus, searchQuery]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = useMemo(() => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [filtered, page]);

  const assignAccountType = useCallback(async (userId: string, newAccountType: string) => {
    if (newAccountType === "unresolved") return;
    setUpdatingRole(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-account", {
        body: { user_id: userId, account_type: newAccountType },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const canonicalAccountType = normalizeAccountType(newAccountType);
      const compatibilityRole = legacyRoleFromAccountType(canonicalAccountType);
      toast.success(`${lang === "ar" ? "نوع الحساب" : "Account type"}: ${getAccountTypeLabel(canonicalAccountType, lang as "en" | "ar") ?? newAccountType}`);
      setUsers(prev => prev.map(u => u.id !== userId ? u : {
        ...u,
        account_type: canonicalAccountType,
        role: compatibilityRole as UserRecord["role"],
        roles: compatibilityRole ? [compatibilityRole] : [],
        capabilities: Array.isArray(data?.capabilities) ? data.capabilities : u.capabilities,
        approval_status: data?.approval_status ?? u.approval_status,
      }));
      if (selected?.id === userId) {
        setSelected(prev => prev ? {
          ...prev,
          account_type: canonicalAccountType,
          role: compatibilityRole as UserRecord["role"],
          roles: compatibilityRole ? [compatibilityRole] : [],
          capabilities: Array.isArray(data?.capabilities) ? data.capabilities : prev.capabilities,
          approval_status: data?.approval_status ?? prev.approval_status,
        } : null);
      }
    } catch (err: any) { toast.error(err.message || "Failed"); }
    setUpdatingRole(false);
  }, [selected, lang]);

  const executeAccountAction = useCallback(async (action: string, userId: string, reason?: string) => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-account", {
        body: { action, user_id: userId, reason } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(lang === "ar" ? "تم تحديث حالة الحساب" : "Account status updated");
      setUsers(prev => prev.map(u => u.id !== userId ? u : {
        ...u,
        account_status: data.new_status,
        status_reason: reason || null,
        status_changed_at: new Date().toISOString() }));
      if (selected?.id === userId) {
        setSelected(prev => prev ? { ...prev, account_status: data.new_status, status_reason: reason || null, status_changed_at: new Date().toISOString() } : null);
      }
      setActionDialog(null);
      setActionReason("");
      setConfirmEmail("");
    } catch (err: any) { toast.error(err.message || "Failed"); }
    setActionLoading(false);
  }, [selected, lang]);

  const getInitials = (user: UserRecord) => user.full_name ? user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : user.email?.slice(0, 2).toUpperCase() || "??";

  const getStatusBadge = (status: string) => {
    const cfg = statusConfig[status] || statusConfig.active;
    const label = lang === "ar" ? cfg.label_ar : cfg.label_en;
    return <Badge variant="outline" className={`${cfg.color} text-[10px]`}>{label}</Badge>;
  };

  const counts = useMemo(() => ({
    total: users.length,
    admin: users.filter((u) => resolveUserAccountType(u) === "admin").length,
    company: users.filter((u) => resolveUserAccountType(u) === "company").length,
    freelancer: users.filter((u) => resolveUserAccountType(u) === "freelancer").length,
    none: users.filter((u) => !resolveUserAccountType(u)).length }), [users]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("admin.userManagement")}</h1>
          <p className="text-muted-foreground text-sm">{counts.total} {t("admin.registeredUsers")}</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportCSVButton data={filtered.map(u => ({ email: u.email, full_name: u.full_name, account_type: resolveUserAccountType(u), legacy_role: u.role, account_status: u.account_status, approval_status: u.approval_status, capabilities: u.capabilities?.join(", "), created_at: u.created_at, last_sign_in_at: u.last_sign_in_at }))} filename="users" />
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}><RefreshCw className={`h-3.5 w-3.5 me-1.5 ${loading ? "animate-spin" : ""}`} /> {t("admin.refresh")}</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-3 rounded-xl border border-border bg-card"><div className="flex items-center gap-2 mb-1"><Users className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-xs font-medium text-muted-foreground">{t("admin.total")}</span></div><span className="text-xl font-bold">{counts.total}</span></div>
        {Object.entries(accountTypeConfig).slice(0, 3).map(([key, cfg]) => (
          <div key={key} className="p-3 rounded-xl border border-border bg-card"><div className="flex items-center gap-2 mb-1"><cfg.icon className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-xs font-medium text-muted-foreground">{cfg.label}</span></div><span className="text-xl font-bold">{counts[key as keyof typeof counts]}</span></div>
        ))}
        <div className="p-3 rounded-xl border border-border bg-card"><div className="flex items-center gap-2 mb-1"><UserCircle className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-xs font-medium text-muted-foreground">{lang === "ar" ? "غير محسوم" : "Unresolved"}</span></div><span className="text-xl font-bold">{counts.none}</span></div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder={t("admin.searchUsers")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="ps-9 h-9" /></div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder={lang === "ar" ? "التصفية حسب نوع الحساب" : "Filter by account type"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang === "ar" ? "كل أنواع الحساب" : "All account types"}</SelectItem>
            <SelectItem value="admin">{t("admin.administrator")}</SelectItem>
            <SelectItem value="company">Company</SelectItem>
            <SelectItem value="freelancer">Freelancer</SelectItem>
            <SelectItem value="expert">Expert</SelectItem>
            <SelectItem value="instructor">Instructor</SelectItem>
            <SelectItem value="student">Student</SelectItem>
            <SelectItem value="none">{lang === "ar" ? "غير محسوم" : "Unresolved"}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[170px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang === "ar" ? "كل الحالات" : "All statuses"}</SelectItem>
            <SelectItem value="active">{lang === "ar" ? "نشط" : "Active"}</SelectItem>
            <SelectItem value="pending_approval">
              {lang === "ar" ? "بانتظار الموافقة" : "Pending approval"} {pendingCount > 0 && `(${pendingCount})`}
            </SelectItem>
            <SelectItem value="suspended">{lang === "ar" ? "معلق" : "Suspended"}</SelectItem>
            <SelectItem value="banned">{lang === "ar" ? "محظور" : "Banned"}</SelectItem>
            <SelectItem value="deactivated">{lang === "ar" ? "معطل" : "Deactivated"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pending approval quick tab */}
      {pendingCount > 0 && filterStatus !== "pending_approval" && (
        <button onClick={() => setFilterStatus("pending_approval")} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-colors w-full sm:w-auto">
          <Clock className="h-4 w-4" />
          {lang === "ar" ? `${pendingCount} حساب بانتظار الموافقة` : `${pendingCount} account${pendingCount > 1 ? "s" : ""} pending approval`}
        </button>
      )}

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-border bg-muted/50">
            <th className="text-start p-3 text-xs font-medium text-muted-foreground">{t("admin.user")}</th>
            <th className="text-start p-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">{lang === "ar" ? "نوع الحساب" : "Account type"}</th>
            <th className="text-start p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">{lang === "ar" ? "الحالة" : "Status"}</th>
            <th className="text-start p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">{t("admin.lastSignIn")}</th>
            <th className="text-end p-3 text-xs font-medium text-muted-foreground">{lang === "ar" ? "تحديث نوع الحساب" : "Update account type"}</th>
          </tr></thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (<tr key={i} className="border-b border-border"><td colSpan={5} className="p-3"><div className="h-8 bg-muted rounded animate-pulse" /></td></tr>))
            ) : paginated.length === 0 ? (
              <tr><td colSpan={5}><EmptyState icon={Users} title={lang === "ar" ? "لا يوجد مستخدمون" : "No users registered yet"} description={lang === "ar" ? "سيظهر المستخدمون هنا عند التسجيل" : "Users will appear here when they sign up"} /></td></tr>
            ) : (
              paginated.map((user) => {
                const resolvedAccountType = resolveUserAccountType(user);
                const cfg = resolvedAccountType ? accountTypeConfig[resolvedAccountType] : null;
                return (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelected(user)}>
                    <td className="p-3"><div className="flex items-center gap-3"><Avatar className="h-8 w-8"><AvatarImage src={user.avatar_url || undefined} /><AvatarFallback className="text-xs bg-primary/10 text-primary">{getInitials(user)}</AvatarFallback></Avatar><div className="min-w-0"><div className="text-sm font-medium truncate">{user.full_name || "—"}</div><div className="text-xs text-muted-foreground truncate">{user.email}</div></div></div></td>
                    <td className="p-3 hidden sm:table-cell">{cfg ? <Badge variant="outline" className={`${cfg.color} text-[10px]`}>{cfg.label}</Badge> : <span className="text-xs text-muted-foreground">—</span>}</td>
                    <td className="p-3 hidden md:table-cell">{getStatusBadge(user.account_status)}</td>
                    <td className="p-3 text-xs text-muted-foreground hidden lg:table-cell">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : t("admin.never")}</td>
                    <td className="p-3 text-end" onClick={(e) => e.stopPropagation()}>
                      <Select value={resolveUserAccountType(user) || "unresolved"} onValueChange={(val) => assignAccountType(user.id, val)} disabled={updatingRole}>
                        <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unresolved" disabled>{lang === "ar" ? "غير محسوم" : "Unresolved"}</SelectItem>
                          <SelectItem value="admin">{t("admin.administrator")}</SelectItem>
                          <SelectItem value="company">Company</SelectItem>
                          <SelectItem value="freelancer">Freelancer</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                          <SelectItem value="instructor">Instructor</SelectItem>
                          <SelectItem value="student">Student</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-border bg-muted/30">
            <span className="text-xs text-muted-foreground">{t("admin.showing")} {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} {t("admin.of")} {filtered.length}</span>
            <div className="flex gap-1"><Button variant="outline" size="sm" className="h-7 text-xs" disabled={page === 0} onClick={() => setPage(p => p - 1)}>{t("admin.prev")}</Button><Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>{t("admin.next")}</Button></div>
          </div>
        )}
      </div>

      {/* User detail dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t("admin.userDetails")}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-4"><Avatar className="h-14 w-14"><AvatarImage src={selected.avatar_url || undefined} /><AvatarFallback className="bg-primary/10 text-primary text-lg">{getInitials(selected)}</AvatarFallback></Avatar><div><h3 className="font-semibold">{selected.full_name || t("admin.unnamedUser")}</h3><p className="text-sm text-muted-foreground">{selected.email}</p><div className="mt-1">{getStatusBadge(selected.account_status)}</div></div></div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground text-xs">{lang === "ar" ? "نوع الحساب" : "Account type"}</span><div className="mt-1">
                  <Select value={resolveUserAccountType(selected) || "unresolved"} onValueChange={(val) => assignAccountType(selected.id, val)} disabled={updatingRole}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unresolved" disabled>{lang === "ar" ? "غير محسوم" : "Unresolved"}</SelectItem>
                      <SelectItem value="admin">{t("admin.administrator")}</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                      <SelectItem value="freelancer">Freelancer</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                      <SelectItem value="instructor">Instructor</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                    </SelectContent>
                  </Select>
                </div></div>
                <div><span className="text-muted-foreground text-xs">{lang === "ar" ? "الدور القديم" : "Legacy role"}</span><p className="font-medium mt-1">{selected.role ? (selected.role === "individual" ? (lang === "ar" ? "مستقل (قديم)" : "Freelancer (legacy)") : selected.role) : "—"}</p></div>
                <div><span className="text-muted-foreground text-xs">{lang === "ar" ? "حالة الموافقة" : "Approval status"}</span><p className="font-medium mt-1">{selected.approval_status || "—"}</p></div>
                <div><span className="text-muted-foreground text-xs">{lang === "ar" ? "حالة البريد" : "Email status"}</span><p className="font-medium mt-1">{selected.email_confirmed_at ? `✓ ${t("admin.verified")}` : `⏳ ${t("admin.pending")}`}</p></div>
                <div><span className="text-muted-foreground text-xs">{t("admin.joined")}</span><p className="font-medium">{new Date(selected.created_at).toLocaleDateString()}</p></div>
                <div><span className="text-muted-foreground text-xs">{t("admin.lastSignIn")}</span><p className="font-medium">{selected.last_sign_in_at ? new Date(selected.last_sign_in_at).toLocaleDateString() : t("admin.never")}</p></div>
                <div><span className="text-muted-foreground text-xs">{lang === "ar" ? "القدرات" : "Capabilities"}</span><p className="font-medium">{selected.capabilities?.length || 0}</p></div>
                <div><span className="text-muted-foreground text-xs">{lang === "ar" ? "الشارات" : "Badges"}</span><p className="font-medium">{countValue(selected.badges)}</p></div>
                <div><span className="text-muted-foreground text-xs">{lang === "ar" ? "الاستحقاقات" : "Entitlements"}</span><p className="font-medium">{countValue(selected.entitlements)}</p></div>
              </div>

              {/* Activity log */}
              {selected.status_changed_at && (
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <span className="text-xs font-medium text-muted-foreground">{lang === "ar" ? "آخر إجراء" : "Last action"}</span>
                  <p className="text-sm mt-1">
                    {lang === "ar" ? "الحالة: " : "Status: "}<span className="font-medium">{statusConfig[selected.account_status]?.[lang === "ar" ? "label_ar" : "label_en"] || selected.account_status}</span>
                    {" · "}{new Date(selected.status_changed_at).toLocaleDateString()}
                  </p>
                  {selected.status_reason && <p className="text-xs text-muted-foreground mt-1">{lang === "ar" ? "السبب: " : "Reason: "}{selected.status_reason}</p>}
                </div>
              )}

              <Separator />

              {/* Hiring activity */}
              <HiringActivitySection user={selected} lang={lang} />

              <Separator />

              {/* Account actions */}
              <div>
                <span className="text-xs font-medium text-muted-foreground">{lang === "ar" ? "إجراءات الحساب" : "Account actions"}</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selected.account_status === "pending_approval" && (
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => executeAccountAction("approve", selected.id)} disabled={actionLoading}>
                      <CheckCircle2 className="h-3.5 w-3.5 me-1.5" />{lang === "ar" ? "الموافقة على الحساب" : "Approve account"}
                    </Button>
                  )}
                  {selected.account_status === "suspended" && (
                    <Button size="sm" variant="outline" onClick={() => executeAccountAction("activate", selected.id)} disabled={actionLoading}>
                      <PlayCircle className="h-3.5 w-3.5 me-1.5" />{lang === "ar" ? "إلغاء التعليق" : "Unsuspend"}
                    </Button>
                  )}
                  {selected.account_status === "active" && (
                    <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-600 hover:bg-amber-500/10" onClick={() => setActionDialog({ type: "suspend", user: selected })} disabled={actionLoading}>
                      <PauseCircle className="h-3.5 w-3.5 me-1.5" />{lang === "ar" ? "تعليق الحساب" : "Suspend account"}
                    </Button>
                  )}
                  {selected.account_status === "banned" ? (
                    <Button size="sm" variant="outline" onClick={() => executeAccountAction("unban", selected.id)} disabled={actionLoading}>
                      <ShieldX className="h-3.5 w-3.5 me-1.5" />{lang === "ar" ? "إلغاء الحظر" : "Unban"}
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="border-red-500/30 text-red-600 hover:bg-red-500/10" onClick={() => setActionDialog({ type: "ban", user: selected })} disabled={actionLoading}>
                      <Ban className="h-3.5 w-3.5 me-1.5" />{lang === "ar" ? "حظر الحساب" : "Ban account"}
                    </Button>
                  )}
                  {selected.account_status === "deactivated" && (
                    <Button size="sm" variant="outline" onClick={() => executeAccountAction("activate", selected.id)} disabled={actionLoading}>
                      <PlayCircle className="h-3.5 w-3.5 me-1.5" />{lang === "ar" ? "إعادة التفعيل" : "Reactivate"}
                    </Button>
                  )}
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground font-mono break-all">ID: {selected.id}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Suspend / Ban confirmation dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => { setActionDialog(null); setActionReason(""); setConfirmEmail(""); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionDialog?.type === "ban" ? <Ban className="h-5 w-5 text-red-500" /> : <PauseCircle className="h-5 w-5 text-amber-500" />}
              {actionDialog?.type === "ban"
                ? (lang === "ar" ? "حظر الحساب" : "Ban account")
                : (lang === "ar" ? "تعليق الحساب" : "Suspend account")}
            </DialogTitle>
            <DialogDescription>
              {actionDialog?.user.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">{lang === "ar" ? "السبب (مطلوب)" : "Reason (required)"}</label>
              <Textarea value={actionReason} onChange={e => setActionReason(e.target.value)} placeholder={lang === "ar" ? "أدخل السبب..." : "Enter reason..."} className="mt-1" />
            </div>
            {actionDialog?.type === "ban" && (
              <div>
                <label className="text-sm font-medium text-red-600">{lang === "ar" ? "أدخل البريد الإلكتروني للتأكيد" : "Type the user's email to confirm"}</label>
                <Input value={confirmEmail} onChange={e => setConfirmEmail(e.target.value)} placeholder={actionDialog.user.email} className="mt-1" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionDialog(null); setActionReason(""); setConfirmEmail(""); }}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button
              variant="destructive"
              disabled={actionLoading || !actionReason.trim() || (actionDialog?.type === "ban" && confirmEmail !== actionDialog.user.email)}
              onClick={() => actionDialog && executeAccountAction(actionDialog.type, actionDialog.user.id, actionReason)}
            >
              {actionLoading ? "..." : actionDialog?.type === "ban" ? (lang === "ar" ? "حظر" : "Ban") : (lang === "ar" ? "تعليق" : "Suspend")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function HiringActivitySection({ user, lang }: { user: UserRecord; lang: string }) {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const resolvedAccountType = resolveUserAccountType(user);
        if (resolvedAccountType === "freelancer") {
          const profileRes = await supabase.from("profiles").select("id").eq("user_id", user.id).maybeSingle();
          if (!profileRes.data) { setStats(null); setLoading(false); return; }
          const [received, accepted, completed, reviews] = await Promise.all([
            supabase.from("hire_requests").select("id", { count: "exact", head: true }).eq("freelancer_profile_id", profileRes.data.id),
            supabase.from("hire_requests").select("id", { count: "exact", head: true }).eq("freelancer_profile_id", profileRes.data.id).in("status", ["accepted", "in_progress"]),
            supabase.from("hire_requests").select("id", { count: "exact", head: true }).eq("freelancer_profile_id", profileRes.data.id).eq("status", "completed"),
            supabase.from("freelancer_reviews").select("rating").eq("freelancer_user_id", user.id),
          ]);
          const ratings = reviews.data || [];
          const avg = ratings.length ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length) : 0;
          if (!cancelled) setStats({ received: received.count || 0, accepted: accepted.count || 0, completed: completed.count || 0, avgRating: parseFloat(avg.toFixed(1)) });
        } else if (resolvedAccountType === "company") {
          const [sent, jobs, applicants, reviews] = await Promise.all([
            supabase.from("hire_requests").select("id", { count: "exact", head: true }).eq("company_id", user.id),
            supabase.from("job_postings").select("id", { count: "exact", head: true }).eq("company_user_id", user.id),
            supabase.from("job_applications").select("id, job_postings!inner(company_user_id)", { count: "exact", head: true }).eq("job_postings.company_user_id", user.id),
            supabase.from("company_reviews").select("rating").eq("company_user_id", user.id),
          ]);
          const ratings = reviews.data || [];
          const avg = ratings.length ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length) : 0;
          if (!cancelled) setStats({ sent: sent.count || 0, jobs: jobs.count || 0, applicants: applicants.count || 0, avgRating: parseFloat(avg.toFixed(1)) });
        } else {
          if (!cancelled) setStats(null);
        }
      } catch { if (!cancelled) setStats(null); }
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [user.id, user.account_type, user.role]);

  if (loading) return <div className="h-16 bg-muted rounded-lg animate-pulse" />;
  if (!stats) return null;

  return (
    <>
    <SEO title="Users — Admin" noIndex />
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <span className="text-xs font-medium text-muted-foreground">{lang === "ar" ? "نشاط التوظيف" : "Hiring Activity"}</span>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {Object.entries(stats).map(([key, val]) => (
          <div key={key} className="text-sm">
            <span className="text-muted-foreground text-xs capitalize">{key === "avgRating" ? (lang === "ar" ? "متوسط التقييم" : "Avg Rating") : key}</span>
            <p className="font-medium">{val}</p>
          </div>
        ))}
      </div>
    </div>
    </>
  );
}
