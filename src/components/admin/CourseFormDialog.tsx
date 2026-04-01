import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Plus, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { availableIcons, getIcon } from "@/lib/iconMap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: any;
}

export default function CourseFormDialog({ open, onClose, onSaved, initial }: Props) {
  const isEdit = !!initial?.id;
  const qc = useQueryClient();

  const { t } = useLanguage();
  const [form, setForm] = useState({
    slug: "", icon: "Layers", emoji: "", color: "",
    title_en: "", title_ar: "", description_en: "", description_ar: "",
    duration_en: "", duration_ar: "", level_en: "", level_ar: "",
    total_lessons: 0, total_projects: 0,
    outcomes_en: [] as string[], outcomes_ar: [] as string[],
    tools: [] as string[],
    sort_order: 0, is_active: true,
  });
  const [modules, setModules] = useState<{ id?: string; title_en: string; title_ar: string; lessons: number; duration: string; sort_order: number }[]>([]);
  const [webinars, setWebinars] = useState<{ id?: string; title_en: string; title_ar: string; schedule: string; speaker: string; sort_order: number }[]>([]);
  const [saving, setSaving] = useState(false);
  const [outcomeEnInput, setOutcomeEnInput] = useState("");
  const [outcomeArInput, setOutcomeArInput] = useState("");
  const [toolInput, setToolInput] = useState("");

  // Load modules & webinars when editing
  const { data: existingModules } = useQuery({
    queryKey: ["course-modules", initial?.id],
    queryFn: async () => {
      if (!initial?.id) return [];
      const { data } = await supabase.from("course_modules").select("*").eq("course_id", initial.id).order("sort_order");
      return data ?? [];
    },
    enabled: !!initial?.id && open,
  });

  const { data: existingWebinars } = useQuery({
    queryKey: ["course-webinars", initial?.id],
    queryFn: async () => {
      if (!initial?.id) return [];
      const { data } = await supabase.from("course_webinars").select("*").eq("course_id", initial.id).order("sort_order");
      return data ?? [];
    },
    enabled: !!initial?.id && open,
  });

  useEffect(() => {
    if (open && initial) {
      setForm({
        slug: initial.slug || "", icon: initial.icon || "Layers", emoji: initial.emoji || "",
        color: initial.color || "", title_en: initial.title_en || "", title_ar: initial.title_ar || "",
        description_en: initial.description_en || "", description_ar: initial.description_ar || "",
        duration_en: initial.duration_en || "", duration_ar: initial.duration_ar || "",
        level_en: initial.level_en || "", level_ar: initial.level_ar || "",
        total_lessons: initial.total_lessons || 0, total_projects: initial.total_projects || 0,
        outcomes_en: initial.outcomes_en || [], outcomes_ar: initial.outcomes_ar || [],
        tools: initial.tools || [], sort_order: initial.sort_order || 0, is_active: initial.is_active ?? true,
      });
    } else if (open) {
      setForm({
        slug: "", icon: "Layers", emoji: "", color: "", title_en: "", title_ar: "",
        description_en: "", description_ar: "", duration_en: "", duration_ar: "",
        level_en: "", level_ar: "", total_lessons: 0, total_projects: 0,
        outcomes_en: [], outcomes_ar: [], tools: [], sort_order: 0, is_active: true,
      });
      setModules([]);
      setWebinars([]);
    }
  }, [open, initial]);

  useEffect(() => {
    if (existingModules) setModules(existingModules.map(m => ({ id: m.id, title_en: m.title_en, title_ar: m.title_ar || "", lessons: m.lessons || 0, duration: m.duration || "", sort_order: m.sort_order || 0 })));
  }, [existingModules]);

  useEffect(() => {
    if (existingWebinars) setWebinars(existingWebinars.map(w => ({ id: w.id, title_en: w.title_en, title_ar: w.title_ar || "", schedule: w.schedule || "", speaker: w.speaker || "", sort_order: w.sort_order || 0 })));
  }, [existingWebinars]);

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));
  const autoSlug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleSave = async () => {
    if (!form.title_en || !form.slug) { toast.error("Title and slug required"); return; }
    setSaving(true);

    const payload = {
      slug: form.slug, icon: form.icon, emoji: form.emoji || null, color: form.color || null,
      title_en: form.title_en, title_ar: form.title_ar || null,
      description_en: form.description_en || null, description_ar: form.description_ar || null,
      duration_en: form.duration_en || null, duration_ar: form.duration_ar || null,
      level_en: form.level_en || null, level_ar: form.level_ar || null,
      total_lessons: form.total_lessons, total_projects: form.total_projects,
      outcomes_en: form.outcomes_en, outcomes_ar: form.outcomes_ar, tools: form.tools,
      sort_order: form.sort_order, is_active: form.is_active,
    };

    let courseId = initial?.id;

    if (isEdit) {
      const { error } = await supabase.from("training_courses").update(payload).eq("id", courseId);
      if (error) { toast.error(error.message); setSaving(false); return; }
    } else {
      const { data, error } = await supabase.from("training_courses").insert(payload).select("id").single();
      if (error) { toast.error(error.message); setSaving(false); return; }
      courseId = data.id;
    }

    // Sync modules: delete all then re-insert
    await supabase.from("course_modules").delete().eq("course_id", courseId);
    if (modules.length > 0) {
      await supabase.from("course_modules").insert(modules.map((m, i) => ({
        course_id: courseId, title_en: m.title_en, title_ar: m.title_ar || null,
        lessons: m.lessons, duration: m.duration || null, sort_order: i + 1,
      })));
    }

    // Sync webinars
    await supabase.from("course_webinars").delete().eq("course_id", courseId);
    if (webinars.length > 0) {
      await supabase.from("course_webinars").insert(webinars.map((w, i) => ({
        course_id: courseId, title_en: w.title_en, title_ar: w.title_ar || null,
        schedule: w.schedule || null, speaker: w.speaker || null, sort_order: i + 1,
      })));
    }

    toast.success(isEdit ? "Course updated" : "Course created");
    setSaving(false);
    qc.invalidateQueries({ queryKey: ["course-modules"] });
    qc.invalidateQueries({ queryKey: ["course-webinars"] });
    onSaved();
    onClose();
  };

  const IconComp = getIcon(form.icon);

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Course" : "New Course"}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="outcomes">Outcomes & Tools</TabsTrigger>
            <TabsTrigger value="modules">Modules ({modules.length})</TabsTrigger>
            <TabsTrigger value="webinars">Webinars ({webinars.length})</TabsTrigger>
          </TabsList>

          {/* Basic */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>{t("form.icon")}</Label>
                <Select value={form.icon} onValueChange={v => set("icon", v)}>
                  <SelectTrigger><div className="flex items-center gap-2"><IconComp className="h-4 w-4" />{form.icon}</div></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {availableIcons.map(name => { const IC = getIcon(name); return <SelectItem key={name} value={name}><div className="flex items-center gap-2"><IC className="h-4 w-4" />{name}</div></SelectItem>; })}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Emoji</Label><Input value={form.emoji} onChange={e => set("emoji", e.target.value)} placeholder="📱" /></div>
              <div><Label>Color</Label><Input value={form.color} onChange={e => set("color", e.target.value)} placeholder="from-green-500 to-emerald-600" /></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label>{t("form.titleEn")} *</Label><Input value={form.title_en} onChange={e => { set("title_en", e.target.value); if (!isEdit) set("slug", autoSlug(e.target.value)); }} /></div>
              <div><Label>{t("form.titleAr")}</Label><Input value={form.title_ar} onChange={e => set("title_ar", e.target.value)} dir="rtl" /></div>
            </div>

            <div><Label>{t("form.slug")} *</Label><Input value={form.slug} onChange={e => set("slug", e.target.value)} /></div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label>{t("form.descEn")}</Label><Textarea rows={2} value={form.description_en} onChange={e => set("description_en", e.target.value)} /></div>
              <div><Label>{t("form.descAr")}</Label><Textarea rows={2} value={form.description_ar} onChange={e => set("description_ar", e.target.value)} dir="rtl" /></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label>Duration (EN)</Label><Input value={form.duration_en} onChange={e => set("duration_en", e.target.value)} placeholder="10 Weeks" /></div>
              <div><Label>Duration (AR)</Label><Input value={form.duration_ar} onChange={e => set("duration_ar", e.target.value)} dir="rtl" placeholder="10 أسابيع" /></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label>Level (EN)</Label><Input value={form.level_en} onChange={e => set("level_en", e.target.value)} /></div>
              <div><Label>Level (AR)</Label><Input value={form.level_ar} onChange={e => set("level_ar", e.target.value)} dir="rtl" /></div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div><Label>Total Lessons</Label><Input type="number" value={form.total_lessons} onChange={e => set("total_lessons", parseInt(e.target.value) || 0)} /></div>
              <div><Label>Total Projects</Label><Input type="number" value={form.total_projects} onChange={e => set("total_projects", parseInt(e.target.value) || 0)} /></div>
              <div><Label>{t("form.sortOrder")}</Label><Input type="number" value={form.sort_order} onChange={e => set("sort_order", parseInt(e.target.value) || 0)} /></div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => set("is_active", v)} />
              <Label>{t("common.active")}</Label>
            </div>
          </TabsContent>

          {/* Outcomes & Tools */}
          <TabsContent value="outcomes" className="space-y-4">
            <div>
              <Label>Outcomes (EN)</Label>
              <div className="flex gap-2 mt-1">
                <Input value={outcomeEnInput} onChange={e => setOutcomeEnInput(e.target.value)} placeholder="Add outcome"
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (outcomeEnInput.trim()) { set("outcomes_en", [...form.outcomes_en, outcomeEnInput.trim()]); setOutcomeEnInput(""); } } }} />
                <Button variant="outline" size="sm" onClick={() => { if (outcomeEnInput.trim()) { set("outcomes_en", [...form.outcomes_en, outcomeEnInput.trim()]); setOutcomeEnInput(""); } }}><Plus className="h-3 w-3" /></Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {form.outcomes_en.map((o, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-xs">
                    {o} <X className="h-3 w-3 cursor-pointer" onClick={() => set("outcomes_en", form.outcomes_en.filter((_, j) => j !== i))} />
                  </span>
                ))}
              </div>
            </div>

            <div>
              <Label>Outcomes (AR)</Label>
              <div className="flex gap-2 mt-1">
                <Input value={outcomeArInput} onChange={e => setOutcomeArInput(e.target.value)} placeholder="أضف نتيجة" dir="rtl"
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (outcomeArInput.trim()) { set("outcomes_ar", [...form.outcomes_ar, outcomeArInput.trim()]); setOutcomeArInput(""); } } }} />
                <Button variant="outline" size="sm" onClick={() => { if (outcomeArInput.trim()) { set("outcomes_ar", [...form.outcomes_ar, outcomeArInput.trim()]); setOutcomeArInput(""); } }}><Plus className="h-3 w-3" /></Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {form.outcomes_ar.map((o, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-xs" dir="rtl">
                    {o} <X className="h-3 w-3 cursor-pointer" onClick={() => set("outcomes_ar", form.outcomes_ar.filter((_, j) => j !== i))} />
                  </span>
                ))}
              </div>
            </div>

            <div>
              <Label>Tools</Label>
              <div className="flex gap-2 mt-1">
                <Input value={toolInput} onChange={e => setToolInput(e.target.value)} placeholder="e.g. Flutter"
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (toolInput.trim()) { set("tools", [...form.tools, toolInput.trim()]); setToolInput(""); } } }} />
                <Button variant="outline" size="sm" onClick={() => { if (toolInput.trim()) { set("tools", [...form.tools, toolInput.trim()]); setToolInput(""); } }}><Plus className="h-3 w-3" /></Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {form.tools.map((t, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-xs">
                    {t} <X className="h-3 w-3 cursor-pointer" onClick={() => set("tools", form.tools.filter((_, j) => j !== i))} />
                  </span>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Modules */}
          <TabsContent value="modules" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Course Modules</Label>
              <Button variant="outline" size="sm" onClick={() => setModules([...modules, { title_en: "", title_ar: "", lessons: 0, duration: "", sort_order: modules.length + 1 }])}>
                <Plus className="h-3 w-3 me-1" /> Add Module
              </Button>
            </div>
            {modules.map((m, i) => (
              <div key={i} className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Module {i + 1}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setModules(modules.filter((_, j) => j !== i))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Title (EN)" value={m.title_en} onChange={e => { const u = [...modules]; u[i] = { ...u[i], title_en: e.target.value }; setModules(u); }} />
                  <Input placeholder="Title (AR)" value={m.title_ar} onChange={e => { const u = [...modules]; u[i] = { ...u[i], title_ar: e.target.value }; setModules(u); }} dir="rtl" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" placeholder="Lessons" value={m.lessons} onChange={e => { const u = [...modules]; u[i] = { ...u[i], lessons: parseInt(e.target.value) || 0 }; setModules(u); }} />
                  <Input placeholder="Duration (e.g. 2 weeks)" value={m.duration} onChange={e => { const u = [...modules]; u[i] = { ...u[i], duration: e.target.value }; setModules(u); }} />
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Webinars */}
          <TabsContent value="webinars" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Webinars & Live Sessions</Label>
              <Button variant="outline" size="sm" onClick={() => setWebinars([...webinars, { title_en: "", title_ar: "", schedule: "", speaker: "", sort_order: webinars.length + 1 }])}>
                <Plus className="h-3 w-3 me-1" /> Add Webinar
              </Button>
            </div>
            {webinars.map((w, i) => (
              <div key={i} className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Webinar {i + 1}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setWebinars(webinars.filter((_, j) => j !== i))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Title (EN)" value={w.title_en} onChange={e => { const u = [...webinars]; u[i] = { ...u[i], title_en: e.target.value }; setWebinars(u); }} />
                  <Input placeholder="Title (AR)" value={w.title_ar} onChange={e => { const u = [...webinars]; u[i] = { ...u[i], title_ar: e.target.value }; setWebinars(u); }} dir="rtl" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Schedule (e.g. Weekly)" value={w.schedule} onChange={e => { const u = [...webinars]; u[i] = { ...u[i], schedule: e.target.value }; setWebinars(u); }} />
                  <Input placeholder="Speaker" value={w.speaker} onChange={e => { const u = [...webinars]; u[i] = { ...u[i], speaker: e.target.value }; setWebinars(u); }} />
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? t("common.saving") : t("common.save")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
