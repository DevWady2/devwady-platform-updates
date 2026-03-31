import SEO from "@/components/SEO";
import { useState } from "react";
import { EmptyState } from "@/components/admin/EmptyState";
import ConfirmDeleteDialog from "@/components/admin/ConfirmDeleteDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Calendar, Clock, Mail, Link2, Search, Loader2, UserCheck , UserPlus } from "lucide-react";
import { toast } from "sonner";
import ExpertFormDialog, { type ExpertFormData } from "@/components/admin/ExpertFormDialog";
import { dayNames } from "@/data/consultingData";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getAccountTypeLabel, normalizeAccountType } from "@/lib/accountType";

export default function AdminExperts() {
  const { t, lang } = useLanguage();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ExpertFormData | null>(null);
  const [availDialog, setAvailDialog] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<any>(null);

  // Invite dialog state
  const [inviteDialog, setInviteDialog] = useState(false);
  const [inviteExpert, setInviteExpert] = useState<any>(null);
  const [inviting, setInviting] = useState(false);

  // Link dialog state
  const [linkDialog, setLinkDialog] = useState(false);
  const [linkExpert, setLinkExpert] = useState<any>(null);
  const [linkSearch, setLinkSearch] = useState("");
  const [linking, setLinking] = useState(false);

  const { data: experts = [], isLoading } = useQuery({
    queryKey: ["admin-experts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("consulting_experts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    } });

  // Fetch users for linking
  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users-for-link"],
    enabled: linkDialog,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("list-users");
      if (error) throw error;
      return data as any[];
    } });

  const filteredUsers = (linkSearch.trim()
    ? allUsers.filter((u: any) => {
        const q = linkSearch.toLowerCase();
        return (u.email?.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q));
      })
    : allUsers
  ).sort((a: any, b: any) => Number(normalizeAccountType(b.account_type) === "expert") - Number(normalizeAccountType(a.account_type) === "expert"));

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("consulting_experts").delete().eq("id", deleteTarget);
    if (error) { toast.error(error.message); setDeleting(false); return; }
    toast.success(t("admin.delete"));
    qc.invalidateQueries({ queryKey: ["admin-experts"] });
    setDeleting(false);
    setDeleteTarget(null);
  };

  const openCreate = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (e: any) => {
    setEditing({
      id: e.id, name: e.name, name_ar: e.name_ar, role: e.role, role_ar: e.role_ar,
      bio: e.bio || "", bio_ar: e.bio_ar || "", avatar_url: e.avatar_url || "",
      initials: e.initials, track: e.track, track_ar: e.track_ar,
      specializations: e.specializations || [], specializations_ar: e.specializations_ar || [],
      email: e.email || "", linkedin_url: e.linkedin_url || "", github_url: e.github_url || "",
      years_experience: e.years_experience || 0, session_rate_usd: e.session_rate_usd,
      session_duration_minutes: e.session_duration_minutes, is_active: e.is_active ?? true,
      user_id: e.user_id || undefined });
    setDialogOpen(true);
  };

  const handleInvite = async () => {
    if (!inviteExpert) return;
    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-expert", {
        body: { expert_id: inviteExpert.id } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Invitation sent to ${inviteExpert.email}`);
      qc.invalidateQueries({ queryKey: ["admin-experts"] });
      setInviteDialog(false);
      setInviteExpert(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  const handleLink = async (userId: string) => {
    if (!linkExpert) return;
    setLinking(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-expert", {
        body: { expert_id: linkExpert.id, existing_user_id: userId } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Expert linked to account successfully");
      qc.invalidateQueries({ queryKey: ["admin-experts"] });
      setLinkDialog(false);
      setLinkExpert(null);
      setLinkSearch("");
    } catch (e: any) {
      toast.error(e.message || "Failed to link account");
    } finally {
      setLinking(false);
    }
  };

  const { data: availability = [] } = useQuery({
    queryKey: ["admin-availability", selectedExpert?.id],
    enabled: !!selectedExpert,
    queryFn: async () => { const { data, error } = await supabase.from("expert_availability").select("*").eq("expert_id", selectedExpert.id).order("day_of_week"); if (error) throw error; return data; } });

  const [newAvail, setNewAvail] = useState({ day_of_week: 0, start_time: "09:00", end_time: "17:00", is_recurring: true, specific_date: "" });

  const addAvailMutation = useMutation({
    mutationFn: async () => {
      const payload: any = { expert_id: selectedExpert.id, start_time: newAvail.start_time, end_time: newAvail.end_time, is_active: true, is_recurring: newAvail.is_recurring };
      if (newAvail.is_recurring) { payload.day_of_week = newAvail.day_of_week; } else { payload.specific_date = newAvail.specific_date || null; payload.day_of_week = newAvail.specific_date ? new Date(newAvail.specific_date).getDay() : 0; }
      const { error } = await supabase.from("expert_availability").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-availability", selectedExpert?.id] }); toast.success(t("admin.save")); },
    onError: (e: any) => toast.error(e.message) });

  const deleteAvailMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("expert_availability").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-availability", selectedExpert?.id] }); toast.success(t("admin.delete")); },
    onError: (e: any) => toast.error(e.message) });

  const { data: expertBookings = [] } = useQuery({
    queryKey: ["admin-expert-bookings", selectedExpert?.id],
    enabled: !!selectedExpert,
    queryFn: async () => { const { data, error } = await supabase.from("consulting_bookings").select("*").eq("expert_id", selectedExpert.id).order("booking_date", { ascending: false }); if (error) throw error; return data; } });

  return (
    <>
    <SEO title="Experts — Admin" noIndex />
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("admin.experts")}</h1>
          <p className="text-muted-foreground text-sm">{t("admin.manageExperts")}</p>
        </div>
        <Button className="gradient-brand text-primary-foreground" onClick={openCreate}><Plus className="h-4 w-4 me-2" /> {t("admin.addExpert")}</Button>
      </div>

      <div className="overflow-x-auto"><Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("admin.expert")}</TableHead>
            <TableHead className="hidden md:table-cell">{lang === "ar" ? "نوع الحساب" : "Account Type"}</TableHead>
            <TableHead className="hidden sm:table-cell">{t("admin.track")}</TableHead>
            <TableHead className="hidden lg:table-cell">{t("admin.rate")}</TableHead>
            <TableHead className="hidden lg:table-cell">Account</TableHead>
            <TableHead>{t("admin.status")}</TableHead>
            <TableHead className="w-40">{t("admin.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (<TableRow key={i}><TableCell colSpan={7}><div className="h-6 bg-muted rounded animate-pulse" /></TableCell></TableRow>))
          ) : experts.length === 0 ? (
            <TableRow><TableCell colSpan={7}><EmptyState icon={UserPlus} title={lang === "ar" ? "لا يوجد خبراء بعد" : "No experts added"} description={lang === "ar" ? "أضف خبيرًا جديدًا للاستشارات" : "Add an expert to start offering consultations"} actionLabel={lang === "ar" ? "إضافة خبير" : "Add Expert"} onAction={() => setDialogOpen(true)} /></TableCell></TableRow>
          ) : (
            experts.map((exp: any) => (
              <TableRow key={exp.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {exp.avatar_url ? <img loading="lazy" src={exp.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" /> : <div className="h-9 w-9 rounded-full gradient-brand flex items-center justify-center text-primary-foreground text-xs font-bold">{exp.initials}</div>}
                    <div><div className="font-medium">{exp.name}</div><div className="text-xs text-muted-foreground">{exp.email || "—"}</div></div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{getAccountTypeLabel("expert", lang as "en" | "ar")}</TableCell>
                <TableCell className="hidden sm:table-cell"><Badge variant="secondary" className="text-xs">{exp.track}</Badge></TableCell>
                <TableCell className="hidden lg:table-cell">${exp.session_rate_usd}</TableCell>
                <TableCell className="hidden lg:table-cell">
                  {exp.user_id ? (
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1">
                          <UserCheck className="h-3 w-3" /> Linked
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>Account ID: {exp.user_id.slice(0, 8)}…</TooltipContent>
                    </Tooltip>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-amber-600 border-amber-500/20 bg-amber-500/5 text-xs">Not linked</Badge>
                    </div>
                  )}
                </TableCell>
                <TableCell><Badge variant={exp.is_active ? "default" : "outline"}>{exp.is_active ? t("admin.active") : t("admin.inactive")}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {!exp.user_id && (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="icon" variant="ghost" onClick={() => { setInviteExpert(exp); setInviteDialog(true); }} disabled={!exp.email}>
                              <Mail className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Invite to platform</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="icon" variant="ghost" onClick={() => { setLinkExpert(exp); setLinkDialog(true); setLinkSearch(""); }}>
                              <Link2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Link existing account</TooltipContent>
                        </Tooltip>
                      </>
                    )}
                    <Button size="icon" variant="ghost" title={t("admin.availability")} onClick={() => { setSelectedExpert(exp); setAvailDialog(true); }}><Calendar className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(exp)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteTarget(exp.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table></div>

      <ExpertFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-experts"] })} initial={editing} />

      {/* Invite Dialog */}
      <Dialog open={inviteDialog} onOpenChange={setInviteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Expert to Platform</DialogTitle>
            <DialogDescription>Create a new account and send an invitation email to this expert.</DialogDescription>
          </DialogHeader>
          {inviteExpert && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-4">
                {inviteExpert.avatar_url ? (
                  <img loading="lazy" src={inviteExpert.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded-full gradient-brand flex items-center justify-center text-primary-foreground font-bold">{inviteExpert.initials}</div>
                )}
                <div>
                  <div className="font-medium">{inviteExpert.name}</div>
                  <div className="text-sm text-muted-foreground">{inviteExpert.email || "No email"}</div>
                </div>
              </div>
              {!inviteExpert.email && (
                <p className="text-sm text-destructive">This expert has no email address. Please add one first.</p>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setInviteDialog(false)}>Cancel</Button>
                <Button className="gradient-brand text-primary-foreground" onClick={handleInvite} disabled={inviting || !inviteExpert.email}>
                  {inviting ? <><Loader2 className="h-4 w-4 me-2 animate-spin" /> Sending…</> : <><Mail className="h-4 w-4 me-2" /> Send Invitation</>}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Link Existing Account Dialog */}
      <Dialog open={linkDialog} onOpenChange={(o) => { setLinkDialog(o); if (!o) setLinkSearch(""); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Link to Existing Account</DialogTitle>
            <DialogDescription>Search for an existing user to link as {linkExpert?.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email…"
                value={linkSearch}
                onChange={e => setLinkSearch(e.target.value)}
                className="ps-9"
              />
            </div>
            {usersLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm">No users found</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {filteredUsers.slice(0, 20).map((u: any) => (
                  <button
                    key={u.id}
                    onClick={() => handleLink(u.id)}
                    disabled={linking}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors text-start"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={u.avatar_url} />
                      <AvatarFallback className="text-xs">{(u.full_name || u.email || "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{u.full_name || "—"}</div>
                      <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                    </div>
                    {getAccountTypeLabel(u.account_type || u.role, lang as "en" | "ar") && <Badge variant="secondary" className="text-xs">{getAccountTypeLabel(u.account_type || u.role, lang as "en" | "ar")}</Badge>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Availability / Bookings Dialog */}
      <Dialog open={availDialog} onOpenChange={setAvailDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedExpert?.avatar_url ? <img loading="lazy" src={selectedExpert.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" /> : <div className="h-8 w-8 rounded-full gradient-brand flex items-center justify-center text-primary-foreground text-xs font-bold">{selectedExpert?.initials}</div>}
              {selectedExpert?.name} — {t("admin.scheduleBookings")}
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="availability">
            <TabsList className="w-full">
              <TabsTrigger value="availability" className="flex-1 gap-1.5"><Clock className="h-4 w-4" /> {t("admin.availability")} ({availability.length})</TabsTrigger>
              <TabsTrigger value="bookings" className="flex-1 gap-1.5"><Calendar className="h-4 w-4" /> {t("admin.bookings")} ({expertBookings.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="availability" className="space-y-4 mt-4">
              <div className="space-y-3 bg-muted/50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Label className="text-xs whitespace-nowrap">{t("admin.type")}</Label>
                  <Select value={newAvail.is_recurring ? "recurring" : "specific"} onValueChange={v => setNewAvail(a => ({ ...a, is_recurring: v === "recurring" }))}>
                    <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="recurring">{t("admin.recurringWeekly")}</SelectItem><SelectItem value="specific">{t("admin.specificDate")}</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-2 items-end">
                  {newAvail.is_recurring ? (
                    <div><Label className="text-xs">{t("admin.day")}</Label>
                      <Select value={String(newAvail.day_of_week)} onValueChange={v => setNewAvail(a => ({ ...a, day_of_week: parseInt(v) }))}>
                        <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>{dayNames.en.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div><Label className="text-xs">{t("admin.date")}</Label><Input type="date" value={newAvail.specific_date} onChange={e => setNewAvail(a => ({ ...a, specific_date: e.target.value }))} className="w-40 h-9" /></div>
                  )}
                  <div><Label className="text-xs">{t("admin.start")}</Label><Input type="time" value={newAvail.start_time} onChange={e => setNewAvail(a => ({ ...a, start_time: e.target.value }))} className="w-28 h-9" /></div>
                  <div><Label className="text-xs">{t("admin.end")}</Label><Input type="time" value={newAvail.end_time} onChange={e => setNewAvail(a => ({ ...a, end_time: e.target.value }))} className="w-28 h-9" /></div>
                  <Button size="sm" className="gradient-brand text-primary-foreground" onClick={() => addAvailMutation.mutate()}><Plus className="h-3.5 w-3.5 me-1" /> {t("admin.add")}</Button>
                </div>
              </div>
              {availability.length === 0 ? <p className="text-center text-muted-foreground py-4">{t("admin.noAvailability")}</p> : (
                <div className="overflow-x-auto"><Table>
                  <TableHeader><TableRow>
                    <TableHead>{t("admin.type")}</TableHead><TableHead>{t("admin.day")} / {t("admin.date")}</TableHead><TableHead>{t("admin.start")}</TableHead><TableHead>{t("admin.end")}</TableHead><TableHead>{t("admin.status")}</TableHead><TableHead className="w-16">{t("admin.action")}</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {availability.map((a: any) => (
                      <TableRow key={a.id}>
                        <TableCell><Badge variant={a.is_recurring !== false ? "secondary" : "outline"} className="text-xs">{a.is_recurring !== false ? t("admin.recurring") : t("admin.oneTime")}</Badge></TableCell>
                        <TableCell className="font-medium">{a.specific_date ? a.specific_date : dayNames.en[a.day_of_week]}</TableCell>
                        <TableCell>{a.start_time}</TableCell><TableCell>{a.end_time}</TableCell>
                        <TableCell><Badge variant={a.is_active ? "default" : "outline"}>{a.is_active ? t("admin.active") : t("admin.inactive")}</Badge></TableCell>
                        <TableCell><Button size="icon" variant="ghost" className="text-destructive h-7 w-7" onClick={() => deleteAvailMutation.mutate(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              )}
            </TabsContent>
            <TabsContent value="bookings" className="space-y-4 mt-4">
              {expertBookings.length === 0 ? <p className="text-center text-muted-foreground py-4">{t("admin.noExpertBookings")}</p> : (
                <div className="overflow-x-auto"><Table>
                  <TableHeader><TableRow><TableHead>{t("admin.client")}</TableHead><TableHead>{t("admin.date")}</TableHead><TableHead>{t("admin.time")}</TableHead><TableHead>{t("admin.status")}</TableHead><TableHead>{t("admin.payment")}</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {expertBookings.map((b: any) => (
                      <TableRow key={b.id}>
                        <TableCell><div className="font-medium">{b.guest_name || "—"}</div><div className="text-xs text-muted-foreground">{b.guest_email || "—"}</div></TableCell>
                        <TableCell>{b.booking_date}</TableCell><TableCell>{b.start_time} - {b.end_time}</TableCell>
                        <TableCell><Badge variant={b.status === "confirmed" ? "default" : b.status === "pending" ? "secondary" : "outline"}>{b.status}</Badge></TableCell>
                        <TableCell><Badge variant={b.payment_status === "paid" ? "default" : "destructive"}>{b.payment_status || "unpaid"}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      <ConfirmDeleteDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }} onConfirm={confirmDelete} loading={deleting} />
    </div>
    </>
  );
}
