import SEO from "@/components/SEO";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/admin/EmptyState";
import ConfirmDeleteDialog from "@/components/admin/ConfirmDeleteDialog";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Users  } from "lucide-react";
import { toast } from "sonner";
import TeamFormDialog, { type TeamFormData } from "@/components/admin/TeamFormDialog";
import ExportCSVButton from "@/components/admin/ExportCSVButton";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { AdminTableCard, AdminTableHead, AdminTh, AdminTd, AdminTr, AdminStatusBadge } from "@/components/admin/AdminTableCard";

interface TeamMember {
  id: string; name_en: string; name_ar: string | null; role_en: string | null; role_ar: string | null;
  bio_en: string | null; bio_ar: string | null; avatar_url: string | null; email: string | null;
  linkedin_url: string | null; github_url: string | null; department: string | null;
  sort_order: number | null; is_active: boolean | null; created_at: string;
}

export default function AdminTeam() {
  const { t, lang } = useLanguage();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TeamFormData | null>(null);

  const fetchMembers = async () => {
    const { data, error } = await supabase.from("team_members").select("*").order("sort_order", { ascending: true });
    if (!error && data) setMembers(data);
    setLoading(false);
  };

  useEffect(() => { fetchMembers(); }, []);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("team_members").delete().eq("id", deleteTarget);
    if (error) { toast.error(error.message); setDeleting(false); return; }
    toast.success(t("admin.delete"));
    fetchMembers();
    setDeleting(false);
    setDeleteTarget(null);
  };

  const openCreate = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (m: TeamMember) => {
    setEditing({
      id: m.id, name_en: m.name_en, name_ar: m.name_ar || "",
      role_en: m.role_en || "", role_ar: m.role_ar || "",
      bio_en: m.bio_en || "", bio_ar: m.bio_ar || "",
      avatar_url: m.avatar_url || "", email: m.email || "",
      linkedin_url: m.linkedin_url || "", github_url: m.github_url || "",
      department: m.department || "", sort_order: m.sort_order || 0, is_active: m.is_active ?? true });
    setDialogOpen(true);
  };

  return (
    <>
    <SEO title="Team — Admin" noIndex />
    <div>
      <AdminPageHeader title={t("admin.teamMembers")} subtitle={t("admin.manageTeam")} icon={Users} action={{ label: t("admin.addMember"), icon: Plus, onClick: openCreate }}>
        <ExportCSVButton data={members.map(m => ({ name_en: m.name_en, role_en: m.role_en, department: m.department, email: m.email, is_active: m.is_active, sort_order: m.sort_order }))} filename="team" />
      </AdminPageHeader>
      <AdminTableCard>
        <table className="w-full">
          <AdminTableHead>
            <AdminTh>{t("admin.name")}</AdminTh>
            <AdminTh className="hidden md:table-cell">{t("admin.role")}</AdminTh>
            <AdminTh className="hidden sm:table-cell">{t("admin.department")}</AdminTh>
            <AdminTh className="hidden lg:table-cell">{t("admin.status")}</AdminTh>
            <AdminTh className="text-end">{t("admin.actions")}</AdminTh>
          </AdminTableHead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-border/50"><td colSpan={5} className="p-4"><div className="h-6 bg-muted rounded-lg animate-pulse" /></td></tr>
              ))
            ) : members.length === 0 ? (
              <tr><td colSpan={5}><EmptyState icon={Users} title={lang === "ar" ? "لا يوجد أعضاء فريق" : "No team members"} description={lang === "ar" ? "أضف أول عضو في الفريق" : "Add a team member to get started"} actionLabel={lang === "ar" ? "إضافة عضو" : "Add Member"} onAction={() => { setEditing(null); setDialogOpen(true); }} /></td></tr>
            ) : (
              members.map((m) => (
                <AdminTr key={m.id}>
                  <AdminTd className="font-medium">{m.name_en}</AdminTd>
                  <AdminTd className="text-muted-foreground hidden md:table-cell">{m.role_en || "—"}</AdminTd>
                  <AdminTd className="text-muted-foreground hidden sm:table-cell">{m.department || "—"}</AdminTd>
                  <AdminTd className="hidden lg:table-cell"><AdminStatusBadge status={m.is_active ? t("admin.active") : t("admin.inactive")} variant={m.is_active ? "success" : "muted"} /></AdminTd>
                  <AdminTd className="text-end">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openEdit(m)}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive" onClick={() => setDeleteTarget(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </AdminTd>
                </AdminTr>
              ))
            )}
          </tbody>
        </table>
      </AdminTableCard>
      <TeamFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSaved={fetchMembers} initial={editing} />
      <ConfirmDeleteDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }} onConfirm={confirmDelete} loading={deleting} />
    </div>
    </>
  );
}
