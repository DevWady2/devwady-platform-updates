import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MediaItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: any;
  onSave: (data: any) => void;
}

export default function MediaItemFormDialog({ open, onOpenChange, item, onSave }: MediaItemFormDialogProps) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    title_en: "", title_ar: "", type: "video", category: "tech",
    duration: "", thumbnail_url: "", external_url: "",
    description_en: "", description_ar: "",
    is_active: true, sort_order: 0,
  });

  useEffect(() => {
    if (item) {
      setForm({
        title_en: item.title_en || "", title_ar: item.title_ar || "",
        type: item.type || "video", category: item.category || "tech",
        duration: item.duration || "", thumbnail_url: item.thumbnail_url || "",
        external_url: item.external_url || "",
        description_en: item.description_en || "", description_ar: item.description_ar || "",
        is_active: item.is_active ?? true, sort_order: item.sort_order || 0,
      });
    } else {
      setForm({ title_en: "", title_ar: "", type: "video", category: "tech", duration: "", thumbnail_url: "", external_url: "", description_en: "", description_ar: "", is_active: true, sort_order: 0 });
    }
  }, [item, open]);

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Media Item" : "Add Media Item"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t("form.titleEn")}</Label><Input value={form.title_en} onChange={e => set("title_en", e.target.value)} /></div>
            <div><Label>{t("form.titleAr")}</Label><Input value={form.title_ar} onChange={e => set("title_ar", e.target.value)} dir="rtl" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => set("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="reel">Reel</SelectItem>
                  <SelectItem value="podcast">Podcast</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("form.category")}</Label>
              <Select value={form.category} onValueChange={v => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tech">Tech</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="advising">Advising</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t("form.duration")}</Label><Input value={form.duration} onChange={e => set("duration", e.target.value)} placeholder="e.g. 12:34 or 45 min" /></div>
            <div><Label>{t("form.sortOrder")}</Label><Input type="number" value={form.sort_order} onChange={e => set("sort_order", parseInt(e.target.value) || 0)} /></div>
          </div>
          <div><Label>Thumbnail URL</Label><Input value={form.thumbnail_url} onChange={e => set("thumbnail_url", e.target.value)} placeholder="https://..." /></div>
          <div><Label>External URL (YouTube, Spotify, etc.)</Label><Input value={form.external_url} onChange={e => set("external_url", e.target.value)} placeholder="https://..." /></div>
          <div><Label>{t("form.descEn")}</Label><Textarea value={form.description_en} onChange={e => set("description_en", e.target.value)} rows={2} /></div>
          <div><Label>{t("form.descAr")}</Label><Textarea value={form.description_ar} onChange={e => set("description_ar", e.target.value)} rows={2} dir="rtl" /></div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_active} onCheckedChange={v => set("is_active", v)} />
            <Label>{t("common.active")}</Label>
          </div>
          <Button className="w-full gradient-brand text-primary-foreground" onClick={() => onSave(form)}>
            {item ? "Update" : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
