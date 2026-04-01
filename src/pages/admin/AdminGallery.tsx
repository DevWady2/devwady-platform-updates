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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Calendar, Camera   } from "lucide-react";
import { toast } from "sonner";
import { iconMap } from "@/lib/iconMap";

function TimelineFormDialog({ open, onOpenChange, item, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; item?: any; onSave: (d: any) => void }) {
  const [form, setForm] = useState<any>({});
  const resetForm = () => ({ year_label: "", title_en: "", title_ar: "", description_en: "", description_ar: "", icon: "Rocket", sort_order: 0, is_active: true });
  useState(() => { setForm(item ? { ...resetForm(), ...item } : resetForm()); });
  const key = item?.id || "new";
  const [prevKey, setPrevKey] = useState(key);
  if (key !== prevKey) { setPrevKey(key); setForm(item ? { ...resetForm(), ...item } : resetForm()); }
  const set = (k: string, v: string | number | boolean) => setForm((f: any) => ({ ...f, [k]: v }));
  const iconKeys = Object.keys(iconMap);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{item ? "Edit Timeline Event" : "Add Timeline Event"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Year Label</Label><Input value={form.year_label || ""} onChange={e => set("year_label", e.target.value)} placeholder="e.g. 2025 Q1" /></div>
            <div><Label>Icon</Label><select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.icon || "Rocket"} onChange={e => set("icon", e.target.value)}>{iconKeys.map(k => <option key={k} value={k}>{k}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Title (EN)</Label><Input value={form.title_en || ""} onChange={e => set("title_en", e.target.value)} /></div>
            <div><Label>Title (AR)</Label><Input value={form.title_ar || ""} onChange={e => set("title_ar", e.target.value)} dir="rtl" /></div>
          </div>
          <div><Label>Description (EN)</Label><Textarea value={form.description_en || ""} onChange={e => set("description_en", e.target.value)} rows={2} /></div>
          <div><Label>Description (AR)</Label><Textarea value={form.description_ar || ""} onChange={e => set("description_ar", e.target.value)} rows={2} dir="rtl" /></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Switch checked={form.is_active ?? true} onCheckedChange={v => set("is_active", v)} /><Label>Active</Label></div>
            <div className="w-24"><Label>Order</Label><Input type="number" value={form.sort_order || 0} onChange={e => set("sort_order", parseInt(e.target.value) || 0)} /></div>
          </div>
          <Button className="w-full gradient-brand text-primary-foreground" onClick={() => { const { id, created_at, updated_at, ...rest } = form; onSave(rest); }}>{item ? "Update" : "Create"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PhotoFormDialog({ open, onOpenChange, item, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; item?: any; onSave: (d: any) => void }) {
  const [form, setForm] = useState<any>({});
  const resetForm = () => ({ label_en: "", label_ar: "", image_url: "", gradient: "from-primary/20 to-secondary/20", sort_order: 0, is_active: true });
  useState(() => { setForm(item ? { ...resetForm(), ...item } : resetForm()); });
  const key = item?.id || "new";
  const [prevKey, setPrevKey] = useState(key);
  if (key !== prevKey) { setPrevKey(key); setForm(item ? { ...resetForm(), ...item } : resetForm()); }
  const set = (k: string, v: string | number | boolean) => setForm((f: any) => ({ ...f, [k]: v }));
  const gradients = ["from-primary/20 to-secondary/20", "from-secondary/20 to-primary/20", "from-destructive/20 to-warning/20", "from-warning/20 to-primary/20", "from-primary/20 to-destructive/20", "from-secondary/20 to-warning/20", "from-primary/30 to-secondary/30", "from-warning/20 to-destructive/20"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{item ? "Edit Photo" : "Add Photo"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Label (EN)</Label><Input value={form.label_en || ""} onChange={e => set("label_en", e.target.value)} /></div>
            <div><Label>Label (AR)</Label><Input value={form.label_ar || ""} onChange={e => set("label_ar", e.target.value)} dir="rtl" /></div>
          </div>
          <div><Label>Image URL</Label><Input value={form.image_url || ""} onChange={e => set("image_url", e.target.value)} placeholder="https://..." /></div>
          <div><Label>Gradient</Label><select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.gradient || gradients[0]} onChange={e => set("gradient", e.target.value)}>{gradients.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Switch checked={form.is_active ?? true} onCheckedChange={v => set("is_active", v)} /><Label>Active</Label></div>
            <div className="w-24"><Label>Order</Label><Input type="number" value={form.sort_order || 0} onChange={e => set("sort_order", parseInt(e.target.value) || 0)} /></div>
          </div>
          <Button className="w-full gradient-brand text-primary-foreground" onClick={() => { const { id, created_at, updated_at, ...rest } = form; onSave(rest); }}>{item ? "Update" : "Create"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminGallery() {
  const { t, lang } = useLanguage();
  const qc = useQueryClient();
  const [timelineDialog, setTimelineDialog] = useState(false);
  const [photoDialog, setPhotoDialog] = useState(false);
  const [editingTimeline, setEditingTimeline] = useState<any>(null);
  const [editingPhoto, setEditingPhoto] = useState<any>(null);

  const { data: timeline = [], isLoading: loadingT } = useQuery({ queryKey: ["admin-gallery-timeline"], queryFn: async () => { const { data, error } = await supabase.from("gallery_timeline").select("*").order("sort_order"); if (error) throw error; return data; } });
  const { data: photos = [], isLoading: loadingP } = useQuery({ queryKey: ["admin-gallery-photos"], queryFn: async () => { const { data, error } = await supabase.from("gallery_photos").select("*").order("sort_order"); if (error) throw error; return data; } });

  const saveTimeline = useMutation({
    mutationFn: async (form: any) => { if (editingTimeline) { const { error } = await supabase.from("gallery_timeline").update(form).eq("id", editingTimeline.id); if (error) throw error; } else { const { error } = await supabase.from("gallery_timeline").insert(form); if (error) throw error; } },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-gallery-timeline"] }); setTimelineDialog(false); setEditingTimeline(null); toast.success(t("admin.save")); },
    onError: (e: any) => toast.error(e.message) });

  const deleteTimeline = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("gallery_timeline").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-gallery-timeline"] }); toast.success(t("admin.delete")); },
    onError: (e: any) => toast.error(e.message) });

  const savePhoto = useMutation({
    mutationFn: async (form: any) => { if (editingPhoto) { const { error } = await supabase.from("gallery_photos").update(form).eq("id", editingPhoto.id); if (error) throw error; } else { const { error } = await supabase.from("gallery_photos").insert(form); if (error) throw error; } },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-gallery-photos"] }); setPhotoDialog(false); setEditingPhoto(null); toast.success(t("admin.save")); },
    onError: (e: any) => toast.error(e.message) });

  const deletePhoto = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("gallery_photos").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-gallery-photos"] }); toast.success(t("admin.delete")); },
    onError: (e: any) => toast.error(e.message) });

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: "timeline" | "photo" } | null>(null);
  const confirmDelete = () => { if (!deleteTarget) return; if (deleteTarget.type === "timeline") deleteTimeline.mutate(deleteTarget.id); else deletePhoto.mutate(deleteTarget.id); setDeleteTarget(null); };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">{t("admin.galleryManagement")}</h1><p className="text-muted-foreground text-sm">{t("admin.manageGallery")}</p></div>

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline" className="gap-1.5"><Calendar className="h-4 w-4" /> {t("admin.timeline")} ({timeline.length})</TabsTrigger>
          <TabsTrigger value="photos" className="gap-1.5"><Camera className="h-4 w-4" /> {t("admin.photos")} ({photos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <div className="flex justify-end"><Button onClick={() => { setEditingTimeline(null); setTimelineDialog(true); }} className="gradient-brand text-primary-foreground"><Plus className="h-4 w-4 me-1" /> {t("admin.addEvent")}</Button></div>
          {loadingT ? <p className="text-muted-foreground">{t("admin.loading")}</p> : (
            <div className="overflow-x-auto"><Table>
              <TableHeader><TableRow><TableHead>{t("admin.period")}</TableHead><TableHead>{t("admin.title")}</TableHead><TableHead>{t("admin.icon")}</TableHead><TableHead>{t("admin.status")}</TableHead><TableHead className="w-24">{t("admin.actions")}</TableHead></TableRow></TableHeader>
              <TableBody>
                {timeline.map((tt: any) => { const Icon = iconMap[tt.icon as keyof typeof iconMap]; return (
    <>
    <SEO title="Gallery — Admin" noIndex />
                  <TableRow key={tt.id}>
                    <TableCell><Badge variant="secondary">{tt.year_label}</Badge></TableCell>
                    <TableCell className="font-medium">{tt.title_en}</TableCell>
                    <TableCell>{Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : tt.icon}</TableCell>
                    <TableCell><Badge variant={tt.is_active ? "default" : "outline"}>{tt.is_active ? t("admin.active") : t("admin.inactive")}</Badge></TableCell>
                    <TableCell><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => { setEditingTimeline(tt); setTimelineDialog(true); }}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteTarget({ id: tt.id, type: "timeline" })}><Trash2 className="h-4 w-4" /></Button></div></TableCell>
                  </TableRow>
    </>
                ); })}
                {timeline.length === 0 && <TableRow><TableCell colSpan={5}><EmptyState icon={Calendar} title={lang === "ar" ? "لا توجد أحداث" : "No gallery events"} description={lang === "ar" ? "أضف حدثًا في الجدول الزمني" : "Add timeline events to showcase your journey"} actionLabel={lang === "ar" ? "إضافة حدث" : "Add Event"} onAction={() => { setEditingTimeline(null); setTimelineDialog(true); }} /></TableCell></TableRow>}
              </TableBody>
            </Table></div>
          )}
        </TabsContent>

        <TabsContent value="photos" className="space-y-4">
          <div className="flex justify-end"><Button onClick={() => { setEditingPhoto(null); setPhotoDialog(true); }} className="gradient-brand text-primary-foreground"><Plus className="h-4 w-4 me-1" /> {t("admin.addPhoto")}</Button></div>
          {loadingP ? <p className="text-muted-foreground">{t("admin.loading")}</p> : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {photos.map((p: any) => (
                <div key={p.id} className="relative group">
                  <div className={`aspect-square rounded-2xl flex items-center justify-center border border-border overflow-hidden ${p.image_url ? "" : `bg-gradient-to-br ${p.gradient}`}`}>
                    {p.image_url ? <img loading="lazy" src={p.image_url} alt={p.label_en} className="w-full h-full object-cover" /> : <span className="text-sm font-medium text-foreground/60">{p.label_en}</span>}
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-2">
                    <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => { setEditingPhoto(p); setPhotoDialog(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => setDeleteTarget({ id: p.id, type: "photo" })}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{p.label_en}</p>
                </div>
              ))}
              {photos.length === 0 && <div className="col-span-full"><EmptyState icon={Camera} title={lang === "ar" ? "لا توجد صور" : "No photos yet"} description={lang === "ar" ? "أضف صورًا للمعرض" : "Add photos to the gallery"} actionLabel={lang === "ar" ? "إضافة صورة" : "Add Photo"} onAction={() => { setEditingPhoto(null); setPhotoDialog(true); }} /></div>}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <TimelineFormDialog open={timelineDialog} onOpenChange={setTimelineDialog} item={editingTimeline} onSave={d => saveTimeline.mutate(d)} />
      <PhotoFormDialog open={photoDialog} onOpenChange={setPhotoDialog} item={editingPhoto} onSave={d => savePhoto.mutate(d)} />
      <ConfirmDeleteDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }} onConfirm={confirmDelete} />
    </div>
  );
}
