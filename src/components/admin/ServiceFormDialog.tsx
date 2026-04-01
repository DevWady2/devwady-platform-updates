import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { availableIcons, getIcon } from "@/lib/iconMap";

export interface ServiceFormData {
  id?: string;
  section: string;
  icon: string;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  features_en: string[];
  features_ar: string[];
  color: string;
  sort_order: number;
  is_active: boolean;
}

const empty: ServiceFormData = {
  section: "service", icon: "Layers", title_en: "", title_ar: "",
  description_en: "", description_ar: "", features_en: [], features_ar: [],
  color: "", sort_order: 0, is_active: true,
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: ServiceFormData | null;
}

export default function ServiceFormDialog({ open, onClose, onSaved, initial }: Props) {
  const safeInitial = initial ? {
    ...empty, ...initial,
    features_en: Array.isArray(initial.features_en) ? initial.features_en : [],
    features_ar: Array.isArray(initial.features_ar) ? initial.features_ar : [],
  } : empty;

  const { t } = useLanguage();
  const [form, setForm] = useState<ServiceFormData>(safeInitial);
  const [saving, setSaving] = useState(false);
  const [featureEnInput, setFeatureEnInput] = useState("");
  const [featureArInput, setFeatureArInput] = useState("");
  const isEdit = !!initial?.id;

  const set = (key: keyof ServiceFormData, val: any) => setForm(f => ({ ...f, [key]: val }));

  const addFeatureEn = () => {
    if (featureEnInput.trim()) {
      set("features_en", [...form.features_en, featureEnInput.trim()]);
      setFeatureEnInput("");
    }
  };

  const addFeatureAr = () => {
    if (featureArInput.trim()) {
      set("features_ar", [...form.features_ar, featureArInput.trim()]);
      setFeatureArInput("");
    }
  };

  const handleSave = async () => {
    if (!form.title_en) { toast.error("Title (EN) is required"); return; }
    setSaving(true);
    const payload = {
      section: form.section, icon: form.icon,
      title_en: form.title_en, title_ar: form.title_ar || null,
      description_en: form.description_en || null, description_ar: form.description_ar || null,
      features_en: form.features_en, features_ar: form.features_ar,
      color: form.color || null, sort_order: form.sort_order, is_active: form.is_active,
    };

    const { error } = isEdit
      ? await supabase.from("services").update(payload).eq("id", initial!.id!)
      : await supabase.from("services").insert(payload);

    if (error) { toast.error(error.message); setSaving(false); return; }
    toast.success(isEdit ? "Service updated" : "Service created");
    setSaving(false);
    onSaved();
    onClose();
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) onClose();
    else setForm(safeInitial);
  };

  const IconComp = getIcon(form.icon);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Service" : "New Service"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Section & Icon */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("form.section")}</Label>
              <Select value={form.section} onValueChange={v => set("section", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sector">Sector</SelectItem>
                  <SelectItem value="service">Core Service</SelectItem>
                  <SelectItem value="delivery_step">Delivery Step</SelectItem>
                  <SelectItem value="engagement_model">Engagement Model</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("form.icon")}</Label>
              <Select value={form.icon} onValueChange={v => set("icon", v)}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <IconComp className="h-4 w-4" />
                    <span>{form.icon}</span>
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {availableIcons.map(name => {
                    const IC = getIcon(name);
                    return (
                      <SelectItem key={name} value={name}>
                        <div className="flex items-center gap-2">
                          <IC className="h-4 w-4" /> {name}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Title */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("form.titleEn")} *</Label>
              <Input value={form.title_en} onChange={e => set("title_en", e.target.value)} />
            </div>
            <div>
              <Label>{t("form.titleAr")}</Label>
              <Input value={form.title_ar} onChange={e => set("title_ar", e.target.value)} dir="rtl" />
            </div>
          </div>

          {/* Description */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("form.descEn")}</Label>
              <Textarea rows={2} value={form.description_en} onChange={e => set("description_en", e.target.value)} />
            </div>
            <div>
              <Label>{t("form.descAr")}</Label>
              <Textarea rows={2} value={form.description_ar} onChange={e => set("description_ar", e.target.value)} dir="rtl" />
            </div>
          </div>

          {/* Features EN */}
          {(form.section === "service") && (
            <>
              <div>
                <Label>{t("form.featuresEn")}</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={featureEnInput} onChange={e => setFeatureEnInput(e.target.value)}
                    placeholder="Add feature" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addFeatureEn())} />
                  <Button variant="outline" size="sm" onClick={addFeatureEn}><Plus className="h-3 w-3" /></Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {form.features_en.map((f, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-xs">
                      {f} <X className="h-3 w-3 cursor-pointer" onClick={() => set("features_en", form.features_en.filter((_, j) => j !== i))} />
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <Label>{t("form.featuresAr")}</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={featureArInput} onChange={e => setFeatureArInput(e.target.value)}
                    placeholder="أضف ميزة" dir="rtl" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addFeatureAr())} />
                  <Button variant="outline" size="sm" onClick={addFeatureAr}><Plus className="h-3 w-3" /></Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {form.features_ar.map((f, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-xs" dir="rtl">
                      {f} <X className="h-3 w-3 cursor-pointer" onClick={() => set("features_ar", form.features_ar.filter((_, j) => j !== i))} />
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Color (for sectors) */}
          {form.section === "sector" && (
            <div>
              <Label>{t("form.gradientColor")}</Label>
              <Input value={form.color} onChange={e => set("color", e.target.value)} placeholder="from-primary to-secondary" />
            </div>
          )}

          {/* Sort / Active */}
          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <Label>{t("form.sortOrder")}</Label>
              <Input type="number" value={form.sort_order} onChange={e => set("sort_order", parseInt(e.target.value) || 0)} />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <Switch checked={form.is_active} onCheckedChange={v => set("is_active", v)} />
              <Label>{t("common.active")}</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? t("common.saving") : t("common.save")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
