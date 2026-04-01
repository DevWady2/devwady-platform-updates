import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TestimonialFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testimonial?: any;
  onSave: (data: any) => void;
}

const empty = {
  name_en: "", name_ar: "", role_en: "", role_ar: "",
  quote_en: "", quote_ar: "", rating: 5, section: "general",
  avatar_url: "", sort_order: 0, is_active: true,
};

export default function TestimonialFormDialog({ open, onOpenChange, testimonial, onSave }: TestimonialFormDialogProps) {
  const { t } = useLanguage();
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (testimonial) {
      setForm({
        name_en: testimonial.name_en || "", name_ar: testimonial.name_ar || "",
        role_en: testimonial.role_en || "", role_ar: testimonial.role_ar || "",
        quote_en: testimonial.quote_en || "", quote_ar: testimonial.quote_ar || "",
        rating: testimonial.rating ?? 5, section: testimonial.section || "general",
        avatar_url: testimonial.avatar_url || "", sort_order: testimonial.sort_order || 0,
        is_active: testimonial.is_active ?? true,
      });
    } else {
      setForm(empty);
    }
  }, [testimonial, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{testimonial ? "Edit Testimonial" : "Add Testimonial"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t("common.name")} (EN)</Label><Input value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} /></div>
            <div><Label>{t("common.name")} (AR)</Label><Input value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))} dir="rtl" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Role (EN)</Label><Input value={form.role_en} onChange={e => setForm(f => ({ ...f, role_en: e.target.value }))} /></div>
            <div><Label>Role (AR)</Label><Input value={form.role_ar} onChange={e => setForm(f => ({ ...f, role_ar: e.target.value }))} dir="rtl" /></div>
          </div>
          <div><Label>Quote (EN)</Label><Textarea value={form.quote_en} onChange={e => setForm(f => ({ ...f, quote_en: e.target.value }))} rows={3} /></div>
          <div><Label>Quote (AR)</Label><Textarea value={form.quote_ar} onChange={e => setForm(f => ({ ...f, quote_ar: e.target.value }))} dir="rtl" rows={3} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>{t("form.section")}</Label>
              <Select value={form.section} onValueChange={v => setForm(f => ({ ...f, section: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General (Homepage)</SelectItem>
                  <SelectItem value="training">DevWady Academy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Rating (1-5)</Label><Input type="number" min={1} max={5} value={form.rating} onChange={e => setForm(f => ({ ...f, rating: parseInt(e.target.value) || 5 }))} /></div>
            <div><Label>{t("form.sortOrder")}</Label><Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} /></div>
          </div>
          <div><Label>Avatar URL</Label><Input value={form.avatar_url} onChange={e => setForm(f => ({ ...f, avatar_url: e.target.value }))} placeholder="https://..." /></div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
            <Label>{t("common.active")}</Label>
          </div>
          <Button className="w-full gradient-brand text-primary-foreground" onClick={() => onSave(form)}>
            {testimonial ? "Update" : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
