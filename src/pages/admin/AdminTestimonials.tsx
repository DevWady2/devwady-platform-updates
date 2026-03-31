import SEO from "@/components/SEO";
import { useState } from "react";
import { EmptyState } from "@/components/admin/EmptyState";
import ConfirmDeleteDialog from "@/components/admin/ConfirmDeleteDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Star , MessageSquare } from "lucide-react";
import { toast } from "sonner";
import TestimonialFormDialog from "@/components/admin/TestimonialFormDialog";

export default function AdminTestimonials() {
  const { t, lang } = useLanguage();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: async () => { const { data, error } = await supabase.from("testimonials" as any).select("*").order("section").order("sort_order"); if (error) throw error; return data as any[]; } });

  const saveMutation = useMutation({
    mutationFn: async (form: any) => {
      if (editing) { const { error } = await supabase.from("testimonials" as any).update(form).eq("id", editing.id); if (error) throw error; }
      else { const { error } = await supabase.from("testimonials" as any).insert(form); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-testimonials"] }); setDialogOpen(false); setEditing(null); toast.success(t("admin.save")); },
    onError: (e: any) => toast.error(e.message) });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("testimonials" as any).delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-testimonials"] }); toast.success(t("admin.delete")); },
    onError: (e: any) => toast.error(e.message) });

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const confirmDelete = () => { if (deleteTarget) { deleteMutation.mutate(deleteTarget); setDeleteTarget(null); } };

  return (
    <>
    <SEO title="Testimonials — Admin" noIndex />
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">{t("admin.testimonials")}</h1><p className="text-muted-foreground">{t("admin.manageTestimonials")}</p></div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gradient-brand text-primary-foreground"><Plus className="h-4 w-4 me-1" /> {t("admin.addTestimonial")}</Button>
      </div>

      {isLoading ? <p className="text-muted-foreground">{t("admin.loading")}</p> : (
        <div className="overflow-x-auto"><Table>
          <TableHeader><TableRow>
            <TableHead>{t("admin.name")}</TableHead><TableHead>{t("admin.role")}</TableHead><TableHead>{t("admin.section")}</TableHead><TableHead>{t("admin.rating")}</TableHead><TableHead>{t("admin.status")}</TableHead><TableHead className="w-24">{t("admin.actions")}</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {testimonials.map((tt: any) => (
              <TableRow key={tt.id}>
                <TableCell className="font-medium">{tt.name_en}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{tt.role_en}</TableCell>
                <TableCell><Badge variant="secondary">{tt.section === "training" ? t("admin.training") : "General"}</Badge></TableCell>
                <TableCell><div className="flex gap-0.5">{Array.from({ length: tt.rating || 0 }).map((_, j) => <Star key={j} className="h-3.5 w-3.5 text-warning fill-warning" />)}</div></TableCell>
                <TableCell><Badge variant={tt.is_active ? "default" : "outline"}>{tt.is_active ? t("admin.active") : t("admin.inactive")}</Badge></TableCell>
                <TableCell><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => { setEditing(tt); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteTarget(tt.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell>
              </TableRow>
            ))}
            {testimonials.length === 0 && <TableRow><TableCell colSpan={6}><EmptyState icon={MessageSquare} title={lang === "ar" ? "لا توجد شهادات" : "No testimonials"} description={lang === "ar" ? "أضف شهادات العملاء" : "Add client testimonials to build trust"} actionLabel={lang === "ar" ? "إضافة شهادة" : "Add Testimonial"} onAction={() => { setEditing(null); setDialogOpen(true); }} /></TableCell></TableRow>}
          </TableBody>
        </Table></div>
      )}
      <TestimonialFormDialog open={dialogOpen} onOpenChange={setDialogOpen} testimonial={editing} onSave={(data) => saveMutation.mutate(data)} />
      <ConfirmDeleteDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }} onConfirm={confirmDelete} />
    </div>
    </>
  );
}
