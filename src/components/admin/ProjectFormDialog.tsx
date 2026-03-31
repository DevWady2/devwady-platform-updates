import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface ProjectFormData {
  id?: string;
  title_en: string;
  title_ar: string;
  subtitle_en: string;
  subtitle_ar: string;
  slug: string;
  description_en: string;
  description_ar: string;
  category: string;
  cover_image_url: string;
  img_key: string;
  tech: string[];
  is_featured: boolean;
  badge: string;
  badge_ar: string;
  external_url: string;
  sort_order: number;
  status: string;
  metrics: { icon: string; value: string; labelEn: string; labelAr: string }[];
  links: { labelEn: string; labelAr: string; url: string }[];
  channels: { name: string; nameAr: string; audience: string; audienceAr: string; capabilities: string[]; capabilitiesAr: string[] }[];
  core_modules: { titleEn: string; titleAr: string; items: string[]; itemsAr: string[] }[];
  brand_note: string;
  brand_note_ar: string;
  in_development: string;
  in_development_ar: string;
}

const empty: ProjectFormData = {
  title_en: "", title_ar: "", subtitle_en: "", subtitle_ar: "",
  slug: "", description_en: "", description_ar: "", category: "web",
  cover_image_url: "", img_key: "", tech: [], is_featured: false, badge: "", badge_ar: "",
  external_url: "", sort_order: 0, status: "draft",
  metrics: [], links: [], channels: [], core_modules: [],
  brand_note: "", brand_note_ar: "", in_development: "", in_development_ar: "",
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: ProjectFormData | null;
}

export default function ProjectFormDialog({ open, onClose, onSaved, initial }: Props) {
  const safeInitial = initial ? {
    ...empty,
    ...initial,
    tech: Array.isArray(initial.tech) ? initial.tech : [],
    metrics: Array.isArray(initial.metrics) ? initial.metrics : [],
    links: Array.isArray(initial.links) ? initial.links : [],
    channels: Array.isArray(initial.channels) ? initial.channels : [],
    core_modules: Array.isArray(initial.core_modules) ? initial.core_modules : [],
  } : empty;
  const { t } = useLanguage();
  const [form, setForm] = useState<ProjectFormData>(safeInitial);
  const [saving, setSaving] = useState(false);
  const [techInput, setTechInput] = useState("");
  const { upload, uploading } = useMediaUpload();
  const fileRef = useRef<HTMLInputElement>(null);
  const isEdit = !!initial?.id;

  const set = (key: keyof ProjectFormData, val: any) => setForm(f => ({ ...f, [key]: val }));

  const autoSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await upload(file, "portfolio");
    if (url) set("cover_image_url", url);
  };

  const addTech = () => {
    if (techInput.trim() && !form.tech.includes(techInput.trim())) {
      set("tech", [...form.tech, techInput.trim()]);
      setTechInput("");
    }
  };

  const removeTech = (t: string) => set("tech", form.tech.filter(x => x !== t));

  // Metrics helpers
  const addMetric = () => set("metrics", [...form.metrics, { icon: "Layers", value: "", labelEn: "", labelAr: "" }]);
  const updateMetric = (i: number, field: string, val: string) => {
    const updated = [...form.metrics];
    (updated[i] as any)[field] = val;
    set("metrics", updated);
  };
  const removeMetric = (i: number) => set("metrics", form.metrics.filter((_, j) => j !== i));

  // Links helpers
  const addLink = () => set("links", [...form.links, { labelEn: "", labelAr: "", url: "" }]);
  const updateLink = (i: number, field: string, val: string) => {
    const updated = [...form.links];
    (updated[i] as any)[field] = val;
    set("links", updated);
  };
  const removeLink = (i: number) => set("links", form.links.filter((_, j) => j !== i));

  const handleSave = async () => {
    if (!form.title_en || !form.slug) { toast.error("Title and slug are required"); return; }
    setSaving(true);
    const payload: any = {
      title_en: form.title_en, title_ar: form.title_ar || null,
      subtitle_en: form.subtitle_en || null, subtitle_ar: form.subtitle_ar || null,
      slug: form.slug, description_en: form.description_en || null,
      description_ar: form.description_ar || null, category: form.category,
      cover_image_url: form.cover_image_url || null, img_key: form.img_key || null,
      tech: form.tech, is_featured: form.is_featured, badge: form.badge || null,
      badge_ar: form.badge_ar || null, external_url: form.external_url || null,
      sort_order: form.sort_order, status: form.status,
      metrics: form.metrics.length > 0 ? form.metrics : [],
      links: form.links.length > 0 ? form.links : [],
      channels: form.channels.length > 0 ? form.channels : [],
      core_modules: form.core_modules.length > 0 ? form.core_modules : [],
      brand_note: form.brand_note || null, brand_note_ar: form.brand_note_ar || null,
      in_development: form.in_development || null, in_development_ar: form.in_development_ar || null,
    };

    const { error } = isEdit
      ? await supabase.from("portfolio_projects").update(payload).eq("id", initial!.id!)
      : await supabase.from("portfolio_projects").insert(payload);

    if (error) { toast.error(error.message); setSaving(false); return; }
    toast.success(isEdit ? "Project updated" : "Project created");
    setSaving(false);
    onSaved();
    onClose();
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) onClose();
    else setForm(safeInitial);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Project" : "New Project"}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="metrics">Metrics & Links</TabsTrigger>
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="extra">Extra</TabsTrigger>
          </TabsList>

          {/* === BASIC TAB === */}
          <TabsContent value="basic" className="space-y-4">
            {/* Image */}
            <div>
              <Label>Cover Image</Label>
              <div className="mt-1 flex items-center gap-3">
                {form.cover_image_url && (
                  <img loading="lazy" src={form.cover_image_url} alt="" className="h-20 w-20 rounded-lg object-cover border border-border" />
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <Upload className="h-3.5 w-3.5 me-1" /> {uploading ? "Uploading…" : "Upload"}
                </Button>
              </div>
            </div>

            {/* Title EN/AR */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("form.titleEn")} *</Label>
                <Input value={form.title_en} onChange={e => { set("title_en", e.target.value); if (!isEdit) set("slug", autoSlug(e.target.value)); }} />
              </div>
              <div>
                <Label>{t("form.titleAr")}</Label>
                <Input value={form.title_ar} onChange={e => set("title_ar", e.target.value)} dir="rtl" />
              </div>
            </div>

            {/* Slug + Img Key */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("form.slug")} *</Label>
                <Input value={form.slug} onChange={e => set("slug", e.target.value)} />
              </div>
              <div>
                <Label>Image Key</Label>
                <Input value={form.img_key} onChange={e => set("img_key", e.target.value)} placeholder="e.g. yozya, atmodrive" />
              </div>
            </div>

            {/* Subtitle */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Subtitle (EN)</Label>
                <Input value={form.subtitle_en} onChange={e => set("subtitle_en", e.target.value)} />
              </div>
              <div>
                <Label>Subtitle (AR)</Label>
                <Input value={form.subtitle_ar} onChange={e => set("subtitle_ar", e.target.value)} dir="rtl" />
              </div>
            </div>

            {/* Description */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("form.descEn")}</Label>
                <Textarea rows={3} value={form.description_en} onChange={e => set("description_en", e.target.value)} />
              </div>
              <div>
                <Label>{t("form.descAr")}</Label>
                <Textarea rows={3} value={form.description_ar} onChange={e => set("description_ar", e.target.value)} dir="rtl" />
              </div>
            </div>

            {/* Category / Status / Featured */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>{t("form.category")}</Label>
                <Select value={form.category} onValueChange={v => set("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="web">Web</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Switch checked={form.is_featured} onCheckedChange={v => set("is_featured", v)} />
                <Label>Featured</Label>
              </div>
            </div>

            {/* Tech */}
            <div>
              <Label>Tech Stack</Label>
              <div className="flex gap-2 mt-1">
                <Input value={techInput} onChange={e => setTechInput(e.target.value)} placeholder="e.g. Flutter" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTech())} />
                <Button variant="outline" size="sm" onClick={addTech}>Add</Button>
              </div>
              {form.tech.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {form.tech.map(t => (
                    <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-xs">
                      {t} <X className="h-3 w-3 cursor-pointer" onClick={() => removeTech(t)} />
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Badge / Sort */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Badge (EN)</Label>
                <Input value={form.badge} onChange={e => set("badge", e.target.value)} />
              </div>
              <div>
                <Label>Badge (AR)</Label>
                <Input value={form.badge_ar} onChange={e => set("badge_ar", e.target.value)} dir="rtl" />
              </div>
              <div>
                <Label>{t("form.sortOrder")}</Label>
                <Input type="number" value={form.sort_order} onChange={e => set("sort_order", parseInt(e.target.value) || 0)} />
              </div>
            </div>

            <div>
              <Label>External URL</Label>
              <Input value={form.external_url} onChange={e => set("external_url", e.target.value)} placeholder="https://..." />
            </div>
          </TabsContent>

          {/* === METRICS & LINKS TAB === */}
          <TabsContent value="metrics" className="space-y-6">
            {/* Metrics */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Metrics</Label>
                <Button variant="outline" size="sm" onClick={addMetric}><Plus className="h-3 w-3 me-1" /> Add</Button>
              </div>
              {form.metrics.map((m, i) => (
                <div key={i} className="grid grid-cols-5 gap-2 mb-2 items-end">
                  <div>
                    <Label className="text-xs">Icon</Label>
                    <Input value={m.icon} onChange={e => updateMetric(i, "icon", e.target.value)} placeholder="Smartphone" />
                  </div>
                  <div>
                    <Label className="text-xs">Value</Label>
                    <Input value={m.value} onChange={e => updateMetric(i, "value", e.target.value)} placeholder="4" />
                  </div>
                  <div>
                    <Label className="text-xs">Label EN</Label>
                    <Input value={m.labelEn} onChange={e => updateMetric(i, "labelEn", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Label AR</Label>
                    <Input value={m.labelAr} onChange={e => updateMetric(i, "labelAr", e.target.value)} dir="rtl" />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeMetric(i)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Links */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Links</Label>
                <Button variant="outline" size="sm" onClick={addLink}><Plus className="h-3 w-3 me-1" /> Add</Button>
              </div>
              {form.links.map((l, i) => (
                <div key={i} className="grid grid-cols-4 gap-2 mb-2 items-end">
                  <div>
                    <Label className="text-xs">Label EN</Label>
                    <Input value={l.labelEn} onChange={e => updateLink(i, "labelEn", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Label AR</Label>
                    <Input value={l.labelAr} onChange={e => updateLink(i, "labelAr", e.target.value)} dir="rtl" />
                  </div>
                  <div>
                    <Label className="text-xs">URL</Label>
                    <Input value={l.url} onChange={e => updateLink(i, "url", e.target.value)} placeholder="https://..." />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeLink(i)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* === CHANNELS TAB === */}
          <TabsContent value="channels" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Channels / Product Breakdown</Label>
              <Button variant="outline" size="sm" onClick={() => set("channels", [...form.channels, { name: "", nameAr: "", audience: "", audienceAr: "", capabilities: [], capabilitiesAr: [] }])}>
                <Plus className="h-3 w-3 me-1" /> Add Channel
              </Button>
            </div>
            {form.channels.map((ch, i) => (
              <div key={i} className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Channel {i + 1}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => set("channels", form.channels.filter((_, j) => j !== i))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Name (EN)</Label>
                    <Input value={ch.name} onChange={e => { const u = [...form.channels]; u[i] = { ...u[i], name: e.target.value }; set("channels", u); }} />
                  </div>
                  <div>
                    <Label className="text-xs">Name (AR)</Label>
                    <Input value={ch.nameAr} onChange={e => { const u = [...form.channels]; u[i] = { ...u[i], nameAr: e.target.value }; set("channels", u); }} dir="rtl" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Audience (EN)</Label>
                    <Input value={ch.audience} onChange={e => { const u = [...form.channels]; u[i] = { ...u[i], audience: e.target.value }; set("channels", u); }} />
                  </div>
                  <div>
                    <Label className="text-xs">Audience (AR)</Label>
                    <Input value={ch.audienceAr} onChange={e => { const u = [...form.channels]; u[i] = { ...u[i], audienceAr: e.target.value }; set("channels", u); }} dir="rtl" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Capabilities EN (one per line)</Label>
                    <Textarea rows={3} value={ch.capabilities.join("\n")} onChange={e => { const u = [...form.channels]; u[i] = { ...u[i], capabilities: e.target.value.split("\n").filter(Boolean) }; set("channels", u); }} />
                  </div>
                  <div>
                    <Label className="text-xs">Capabilities AR (one per line)</Label>
                    <Textarea rows={3} value={ch.capabilitiesAr.join("\n")} onChange={e => { const u = [...form.channels]; u[i] = { ...u[i], capabilitiesAr: e.target.value.split("\n").filter(Boolean) }; set("channels", u); }} dir="rtl" />
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* === EXTRA TAB === */}
          <TabsContent value="extra" className="space-y-4">
            {/* Core Modules */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Core Modules</Label>
                <Button variant="outline" size="sm" onClick={() => set("core_modules", [...form.core_modules, { titleEn: "", titleAr: "", items: [], itemsAr: [] }])}>
                  <Plus className="h-3 w-3 me-1" /> Add Module
                </Button>
              </div>
              {form.core_modules.map((mod, i) => (
                <div key={i} className="border border-border rounded-lg p-4 space-y-3 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Module {i + 1}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => set("core_modules", form.core_modules.filter((_, j) => j !== i))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Title EN</Label>
                      <Input value={mod.titleEn} onChange={e => { const u = [...form.core_modules]; u[i] = { ...u[i], titleEn: e.target.value }; set("core_modules", u); }} />
                    </div>
                    <div>
                      <Label className="text-xs">Title AR</Label>
                      <Input value={mod.titleAr} onChange={e => { const u = [...form.core_modules]; u[i] = { ...u[i], titleAr: e.target.value }; set("core_modules", u); }} dir="rtl" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Items EN (one per line)</Label>
                      <Textarea rows={3} value={mod.items.join("\n")} onChange={e => { const u = [...form.core_modules]; u[i] = { ...u[i], items: e.target.value.split("\n").filter(Boolean) }; set("core_modules", u); }} />
                    </div>
                    <div>
                      <Label className="text-xs">Items AR (one per line)</Label>
                      <Textarea rows={3} value={mod.itemsAr.join("\n")} onChange={e => { const u = [...form.core_modules]; u[i] = { ...u[i], itemsAr: e.target.value.split("\n").filter(Boolean) }; set("core_modules", u); }} dir="rtl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Brand Note */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Brand Note (EN)</Label>
                <Textarea rows={2} value={form.brand_note} onChange={e => set("brand_note", e.target.value)} />
              </div>
              <div>
                <Label>Brand Note (AR)</Label>
                <Textarea rows={2} value={form.brand_note_ar} onChange={e => set("brand_note_ar", e.target.value)} dir="rtl" />
              </div>
            </div>

            {/* In Development */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>In Development (EN)</Label>
                <Textarea rows={2} value={form.in_development} onChange={e => set("in_development", e.target.value)} />
              </div>
              <div>
                <Label>In Development (AR)</Label>
                <Textarea rows={2} value={form.in_development_ar} onChange={e => set("in_development_ar", e.target.value)} dir="rtl" />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button className="gradient-brand text-primary-foreground" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Update" : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
