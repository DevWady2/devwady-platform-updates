import SEO from "@/components/SEO";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/admin/EmptyState";
import ConfirmDeleteDialog from "@/components/admin/ConfirmDeleteDialog";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Star, Briefcase } from "lucide-react";
import { toast } from "sonner";
import ProjectFormDialog, { type ProjectFormData } from "@/components/admin/ProjectFormDialog";
import ExportCSVButton from "@/components/admin/ExportCSVButton";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { AdminTableCard, AdminTableHead, AdminTh, AdminTd, AdminTr, AdminStatusBadge } from "@/components/admin/AdminTableCard";

interface Project {
  id: string; title_en: string; title_ar: string | null; subtitle_en: string | null; subtitle_ar: string | null;
  slug: string; description_en: string | null; description_ar: string | null; category: string | null;
  cover_image_url: string | null; tech: string[] | null; is_featured: boolean | null; badge: string | null;
  badge_ar: string | null; external_url: string | null; sort_order: number | null; status: string; created_at: string;
}

export default function AdminPortfolio() {
  const { t, lang } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectFormData | null>(null);

  const fetchProjects = async () => {
    const { data, error } = await supabase.from("portfolio_projects").select("*").order("sort_order", { ascending: true });
    if (!error && data) setProjects(data);
    setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, []);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("portfolio_projects").delete().eq("id", deleteTarget);
    if (error) { toast.error(error.message); setDeleting(false); return; }
    toast.success(t("admin.delete"));
    fetchProjects();
    setDeleting(false);
    setDeleteTarget(null);
  };

  const openCreate = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (p: any) => {
    setEditing({
      id: p.id, title_en: p.title_en, title_ar: p.title_ar || "",
      subtitle_en: p.subtitle_en || "", subtitle_ar: p.subtitle_ar || "",
      slug: p.slug, description_en: p.description_en || "", description_ar: p.description_ar || "",
      category: p.category || "web", cover_image_url: p.cover_image_url || "",
      img_key: p.img_key || "",
      tech: p.tech || [], is_featured: p.is_featured || false,
      badge: p.badge || "", badge_ar: p.badge_ar || "",
      external_url: p.external_url || "", sort_order: p.sort_order || 0, status: p.status,
      metrics: p.metrics || [], links: p.links || [],
      channels: p.channels || [], core_modules: p.core_modules || [],
      brand_note: p.brand_note || "", brand_note_ar: p.brand_note_ar || "",
      in_development: p.in_development || "", in_development_ar: p.in_development_ar || "" });
    setDialogOpen(true);
  };

  return (
    <>
    <SEO title="Portfolio — Admin" noIndex />
    <div>
      <AdminPageHeader title={t("admin.portfolio")} subtitle={t("admin.managePortfolio")} icon={Briefcase} action={{ label: t("admin.newProject"), icon: Plus, onClick: openCreate }}>
        <ExportCSVButton data={projects.map(p => ({ title_en: p.title_en, slug: p.slug, category: p.category, status: p.status, is_featured: p.is_featured, created_at: p.created_at }))} filename="portfolio" />
      </AdminPageHeader>
      <AdminTableCard>
        <table className="w-full">
          <AdminTableHead>
            <AdminTh>{t("admin.title")}</AdminTh>
            <AdminTh className="hidden md:table-cell">{t("admin.category")}</AdminTh>
            <AdminTh className="hidden sm:table-cell">{t("admin.status")}</AdminTh>
            <AdminTh className="hidden lg:table-cell">{t("admin.featured")}</AdminTh>
            <AdminTh className="text-end">{t("admin.actions")}</AdminTh>
          </AdminTableHead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-border/50"><td colSpan={5} className="p-4"><div className="h-6 bg-muted rounded-lg animate-pulse" /></td></tr>
              ))
            ) : projects.length === 0 ? (
              <tr><td colSpan={5}><EmptyState icon={Briefcase} title={lang === "ar" ? "لا توجد مشاريع" : "No portfolio projects"} description={lang === "ar" ? "أضف أول مشروع لعرض أعمالك" : "Add a project to showcase your work"} actionLabel={lang === "ar" ? "إضافة مشروع" : "Add Project"} onAction={() => { setEditing(null); setDialogOpen(true); }} /></td></tr>
            ) : (
              projects.map((proj) => (
                <AdminTr key={proj.id}>
                  <AdminTd className="font-medium">{proj.title_en}</AdminTd>
                  <AdminTd className="text-muted-foreground hidden md:table-cell">{proj.category || "—"}</AdminTd>
                  <AdminTd className="hidden sm:table-cell"><AdminStatusBadge status={proj.status} variant={proj.status === "published" ? "success" : "warning"} /></AdminTd>
                  <AdminTd className="hidden lg:table-cell">{proj.is_featured && <Star className="h-4 w-4 text-warning fill-warning" />}</AdminTd>
                  <AdminTd className="text-end">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openEdit(proj)}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive" onClick={() => setDeleteTarget(proj.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </AdminTd>
                </AdminTr>
              ))
            )}
          </tbody>
        </table>
      </AdminTableCard>
      <ProjectFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSaved={fetchProjects} initial={editing} />
      <ConfirmDeleteDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }} onConfirm={confirmDelete} loading={deleting} />
    </div>
    </>
  );
}
