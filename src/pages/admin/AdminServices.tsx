import SEO from "@/components/SEO";
import { useState } from "react";
import { EmptyState } from "@/components/admin/EmptyState";
import ConfirmDeleteDialog from "@/components/admin/ConfirmDeleteDialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Wrench } from "lucide-react";
import { toast } from "sonner";
import { getIcon } from "@/lib/iconMap";
import ServiceFormDialog, { type ServiceFormData } from "@/components/admin/ServiceFormDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export default function AdminServices() {
  const { t, lang } = useLanguage();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceFormData | null>(null);

  const SECTIONS = [
    { key: "sector", label: t("admin.sectors") },
    { key: "service", label: t("admin.coreServices") },
    { key: "delivery_step", label: t("admin.deliverySteps") },
    { key: "engagement_model", label: t("admin.engagementModels") },
  ];

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["admin-services"],
    queryFn: async () => { const { data, error } = await supabase.from("services").select("*").order("section").order("sort_order"); if (error) throw error; return data; } });

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("services").delete().eq("id", deleteTarget);
    if (error) toast.error(error.message); else { toast.success(t("admin.delete")); qc.invalidateQueries({ queryKey: ["admin-services"] }); }
    setDeleting(false); setDeleteTarget(null);
  };

  const openEdit = (s: any) => {
    setEditing({ id: s.id, section: s.section, icon: s.icon, title_en: s.title_en, title_ar: s.title_ar || "", description_en: s.description_en || "", description_ar: s.description_ar || "", features_en: s.features_en || [], features_ar: s.features_ar || [], color: s.color || "", sort_order: s.sort_order || 0, is_active: s.is_active });
    setDialogOpen(true);
  };
  const openNew = () => { setEditing(null); setDialogOpen(true); };

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t("admin.services")} subtitle={t("admin.manageServices")} icon={Wrench} action={{ label: t("admin.addService"), icon: Plus, onClick: openNew }} />
      <Tabs defaultValue="sector">
        <TabsList>{SECTIONS.map(s => <TabsTrigger key={s.key} value={s.key}>{s.label} ({services.filter(x => x.section === s.key).length})</TabsTrigger>)}</TabsList>
        {SECTIONS.map(sec => (
          <TabsContent key={sec.key} value={sec.key}>
            <Card>
              <CardHeader><CardTitle>{sec.label}</CardTitle></CardHeader>
              <CardContent>
                {isLoading ? <p className="text-muted-foreground text-sm">{t("admin.loading")}</p> : (
                  <div className="overflow-x-auto"><Table>
                    <TableHeader><TableRow>
                      <TableHead className="w-12">{t("admin.icon")}</TableHead>
                      <TableHead>{t("admin.titleEN")}</TableHead>
                      <TableHead>{t("admin.titleAR")}</TableHead>
                      <TableHead className="w-16">{t("admin.order")}</TableHead>
                      <TableHead className="w-20">{t("admin.status")}</TableHead>
                      <TableHead className="w-24">{t("admin.actions")}</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {services.filter(x => x.section === sec.key).map(s => {
                        const IC = getIcon(s.icon);
                        return (
    <>
    <SEO title="Services — Admin" noIndex />
                          <TableRow key={s.id}>
                            <TableCell><IC className="h-5 w-5 text-primary" /></TableCell>
                            <TableCell className="font-medium">{s.title_en}</TableCell>
                            <TableCell dir="rtl">{s.title_ar}</TableCell>
                            <TableCell>{s.sort_order}</TableCell>
                            <TableCell><Badge variant={s.is_active ? "default" : "secondary"}>{s.is_active ? t("admin.active") : t("admin.inactive")}</Badge></TableCell>
                            <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div></TableCell>
                          </TableRow>
    </>
                        );
                      })}
                      {services.filter(x => x.section === sec.key).length === 0 && <TableRow><TableCell colSpan={6}><EmptyState icon={Wrench} title={lang === "ar" ? "لا توجد خدمات" : "No services configured"} description={lang === "ar" ? "أضف خدمة جديدة" : "Add services to this section"} actionLabel={lang === "ar" ? "إضافة خدمة" : "Add Service"} onAction={openNew} /></TableCell></TableRow>}
                    </TableBody>
                  </Table></div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
      <ServiceFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-services"] })} initial={editing} />
      <ConfirmDeleteDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }} onConfirm={confirmDelete} loading={deleting} />
    </div>
  );
}
