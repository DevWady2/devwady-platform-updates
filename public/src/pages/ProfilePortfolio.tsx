import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ExternalLink, Github, Star, FolderOpen, Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import ConfirmDeleteDialog from "@/components/admin/ConfirmDeleteDialog";

const CATEGORIES = [
  { value: "web_app", en: "Web App", ar: "تطبيق ويب" },
  { value: "mobile_app", en: "Mobile App", ar: "تطبيق جوال" },
  { value: "uiux_design", en: "UI/UX Design", ar: "تصميم واجهات" },
  { value: "api_backend", en: "API/Backend", ar: "واجهة خلفية" },
  { value: "devops", en: "DevOps", ar: "ديف أوبس" },
  { value: "ecommerce", en: "E-commerce", ar: "تجارة إلكترونية" },
  { value: "other", en: "Other", ar: "أخرى" },
];

interface PortfolioItem {
  id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  category: string | null;
  technologies: string[] | null;
  thumbnail_url: string | null;
  images: string[] | null;
  project_url: string | null;
  github_url: string | null;
  client_name: string | null;
  is_featured: boolean | null;
  sort_order: number | null;
}

const emptyForm = {
  title: "", title_ar: "", description: "", description_ar: "",
  category: "web_app", technologies: [] as string[], thumbnail_url: "",
  images: [] as string[], project_url: "", github_url: "",
  client_name: "", is_featured: false, sort_order: 0,
};

export default function ProfilePortfolio() {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { upload, uploading } = useMediaUpload();
  const isAr = lang === "ar";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [techInput, setTechInput] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["my-portfolio", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("freelancer_portfolio")
        .select("*")
        .eq("user_id", user!.id)
        .order("sort_order");
      if (error) throw error;
      return data as PortfolioItem[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: user!.id,
        title: form.title,
        title_ar: form.title_ar || null,
        description: form.description || null,
        description_ar: form.description_ar || null,
        category: form.category,
        technologies: form.technologies,
        thumbnail_url: form.thumbnail_url || null,
        images: form.images,
        project_url: form.project_url || null,
        github_url: form.github_url || null,
        client_name: form.client_name || null,
        is_featured: form.is_featured,
        sort_order: form.sort_order,
      };
      if (editingId) {
        const { error } = await supabase.from("freelancer_portfolio").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("freelancer_portfolio").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-portfolio"] });
      setDialogOpen(false);
      toast.success(isAr ? "تم الحفظ" : "Saved successfully");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("freelancer_portfolio").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-portfolio"] });
      setDeleteId(null);
      toast.success(isAr ? "تم الحذف" : "Deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setTechInput("");
    setDialogOpen(true);
  };

  const openEdit = (item: PortfolioItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      title_ar: item.title_ar || "",
      description: item.description || "",
      description_ar: item.description_ar || "",
      category: item.category || "web_app",
      technologies: item.technologies || [],
      thumbnail_url: item.thumbnail_url || "",
      images: item.images || [],
      project_url: item.project_url || "",
      github_url: item.github_url || "",
      client_name: item.client_name || "",
      is_featured: item.is_featured || false,
      sort_order: item.sort_order || 0,
    });
    setTechInput("");
    setDialogOpen(true);
  };

  const addTech = () => {
    const val = techInput.trim();
    if (val && !form.technologies.includes(val)) {
      setForm((p) => ({ ...p, technologies: [...p.technologies, val] }));
      setTechInput("");
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Max 10MB"); return; }
    const url = await upload(file, `${user!.id}`);
    if (url) setForm((p) => ({ ...p, thumbnail_url: url }));
  };

  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (form.images.length + files.length > 6) { toast.error(isAr ? "6 صور كحد أقصى" : "Max 6 images"); return; }
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { toast.error("Max 10MB per file"); continue; }
      const url = await upload(file, `${user!.id}`);
      if (url) setForm((p) => ({ ...p, images: [...p.images, url] }));
    }
  };

  const catLabel = (val: string | null) => {
    const c = CATEGORIES.find((c) => c.value === val);
    return c ? (isAr ? c.ar : c.en) : val;
  };

  return (
    <>
      <SEO title={isAr ? "معرض أعمالي" : "My Portfolio"} />
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold">{isAr ? "معرض أعمالي" : "My Portfolio"}</h1>
            <Button onClick={openAdd} className="gradient-brand text-primary-foreground rounded-full">
              <Plus className="h-4 w-4 me-1.5" /> {isAr ? "إضافة مشروع" : "Add Project"}
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <FolderOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">{isAr ? "لا توجد مشاريع بعد" : "No projects yet"}</h2>
              <p className="text-muted-foreground text-sm mb-6">
                {isAr ? "أضف أول مشروع لعرض أعمالك!" : "Add your first project to showcase your work!"}
              </p>
              <Button onClick={openAdd} variant="outline" className="rounded-full">
                <Plus className="h-4 w-4 me-1.5" /> {isAr ? "إضافة مشروع" : "Add Project"}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map((item) => (
                <div key={item.id} className="bg-card rounded-2xl border border-border overflow-hidden group">
                  {/* Thumbnail */}
                  <div className="aspect-video relative bg-muted">
                    {item.thumbnail_url ? (
                      <img loading="lazy" src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-accent">
                        <span className="text-sm font-medium text-accent-foreground">
                          {item.technologies?.[0] || <ImageIcon className="h-8 w-8 text-muted-foreground/40" />}
                        </span>
                      </div>
                    )}
                    {item.is_featured && (
                      <Star className="absolute top-2 end-2 h-5 w-5 text-warning fill-warning" />
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate flex-1">{isAr && item.title_ar ? item.title_ar : item.title}</h3>
                      {item.category && (
                        <Badge variant="secondary" className="text-[10px] shrink-0">{catLabel(item.category)}</Badge>
                      )}
                    </div>
                    {item.technologies && item.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.technologies.slice(0, 4).map((t) => (
                          <span key={t} className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px]">{t}</span>
                        ))}
                        {item.technologies.length > 4 && (
                          <span className="text-[10px] text-muted-foreground">+{item.technologies.length - 4}</span>
                        )}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {isAr && item.description_ar ? item.description_ar : item.description}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      {item.project_url && (
                        <a href={item.project_url} target="_blank" rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary"><ExternalLink className="h-4 w-4" /></a>
                      )}
                      {item.github_url && (
                        <a href={item.github_url} target="_blank" rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary"><Github className="h-4 w-4" /></a>
                      )}
                      <div className="ms-auto flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(item)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? (isAr ? "تعديل المشروع" : "Edit Project") : (isAr ? "إضافة مشروع" : "Add Project")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{isAr ? "العنوان (EN)" : "Title (EN)"} *</Label>
                <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} maxLength={100} /></div>
              <div><Label>{isAr ? "العنوان (AR)" : "Title (AR)"}</Label>
                <Input value={form.title_ar} onChange={(e) => setForm((p) => ({ ...p, title_ar: e.target.value }))} maxLength={100} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{isAr ? "الوصف (EN)" : "Description (EN)"}</Label>
                <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} maxLength={500} rows={3} /></div>
              <div><Label>{isAr ? "الوصف (AR)" : "Description (AR)"}</Label>
                <Textarea value={form.description_ar} onChange={(e) => setForm((p) => ({ ...p, description_ar: e.target.value }))} maxLength={500} rows={3} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{isAr ? "التصنيف" : "Category"}</Label>
                <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{isAr ? c.ar : c.en}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>{isAr ? "اسم العميل" : "Client Name"}</Label>
                <Input value={form.client_name} onChange={(e) => setForm((p) => ({ ...p, client_name: e.target.value }))} /></div>
            </div>

            {/* Technologies */}
            <div>
              <Label>{isAr ? "التقنيات" : "Technologies"}</Label>
              <div className="flex gap-2 mt-1">
                <Input value={techInput} onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTech(); } }}
                  placeholder={isAr ? "اكتب واضغط Enter" : "Type and press Enter"} />
                <Button type="button" variant="outline" size="sm" onClick={addTech}>{isAr ? "أضف" : "Add"}</Button>
              </div>
              {form.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.technologies.map((t) => (
                    <span key={t} className="px-2 py-1 rounded-full bg-accent text-accent-foreground text-xs flex items-center gap-1">
                      {t}
                      <button onClick={() => setForm((p) => ({ ...p, technologies: p.technologies.filter((x) => x !== t) }))}
                        className="hover:text-destructive"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail */}
            <div>
              <Label>{isAr ? "صورة مصغرة" : "Thumbnail"}</Label>
              <div className="flex items-center gap-3 mt-1">
                {form.thumbnail_url && (
                  <img loading="lazy" src={form.thumbnail_url} alt="" className="w-20 h-14 rounded-lg object-cover border border-border" />
                )}
                <label className="cursor-pointer">
                  <input type="file" className="hidden" accept="image/*" onChange={handleThumbnailUpload} />
                  <Button variant="outline" size="sm" asChild><span><Upload className="h-3.5 w-3.5 me-1" /> {isAr ? "رفع" : "Upload"}</span></Button>
                </label>
                {form.thumbnail_url && (
                  <Button variant="ghost" size="sm" onClick={() => setForm((p) => ({ ...p, thumbnail_url: "" }))}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Screenshots */}
            <div>
              <Label>{isAr ? "لقطات شاشة" : "Screenshots"} ({form.images.length}/6)</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {form.images.map((url, i) => (
                  <div key={i} className="relative w-20 h-14 rounded-lg overflow-hidden border border-border">
                    <img loading="lazy" src={url} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => setForm((p) => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }))}
                      className="absolute top-0.5 end-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {form.images.length < 6 && (
                  <label className="w-20 h-14 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    <input type="file" className="hidden" accept="image/*" multiple onChange={handleImagesUpload} />
                    <Plus className="h-5 w-5 text-muted-foreground" />
                  </label>
                )}
              </div>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{isAr ? "رابط المشروع" : "Project URL"}</Label>
                <Input value={form.project_url} onChange={(e) => setForm((p) => ({ ...p, project_url: e.target.value }))} placeholder="https://..." /></div>
              <div><Label>{t("form.githubUrl")}</Label>
                <Input value={form.github_url} onChange={(e) => setForm((p) => ({ ...p, github_url: e.target.value }))} placeholder="https://github.com/..." /></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_featured} onCheckedChange={(v) => setForm((p) => ({ ...p, is_featured: v }))} />
                <Label>{isAr ? "مشروع مميز" : "Featured"}</Label>
              </div>
              <div><Label>{isAr ? "الترتيب" : "Sort Order"}</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.title || saveMutation.isPending || uploading}
              className="gradient-brand text-primary-foreground">
              {(saveMutation.isPending || uploading) && <Loader2 className="h-4 w-4 me-1 animate-spin" />}
              {isAr ? "حفظ" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDeleteDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title={isAr ? "حذف المشروع" : "Delete Project"}
        description={isAr ? "هل أنت متأكد من حذف هذا المشروع؟" : "Are you sure you want to delete this project?"}
      />
    </>
  );
}
