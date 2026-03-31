import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

interface JobFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: any;
  onSave: (data: any) => void;
}

export default function JobFormDialog({ open, onOpenChange, job, onSave }: JobFormDialogProps) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    title: "", title_ar: "", type: "full-time",
    location: "", location_ar: "",
    description: "", description_ar: "",
    tags: [] as string[], is_urgent: false, is_active: true,
  });
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (job) {
      setForm({
        title: job.title || "", title_ar: job.title_ar || "",
        type: job.type || "full-time",
        location: job.location || "", location_ar: job.location_ar || "",
        description: job.description || "", description_ar: job.description_ar || "",
        tags: job.tags || [], is_urgent: job.is_urgent || false,
        is_active: job.is_active ?? true,
      });
    } else {
      setForm({ title: "", title_ar: "", type: "full-time", location: "", location_ar: "", description: "", description_ar: "", tags: [], is_urgent: false, is_active: true });
    }
  }, [job, open]);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      setForm(f => ({ ...f, tags: [...f.tags, t] }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{job ? "Edit Job" : "Add Job"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t("form.titleEn")}</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>{t("form.titleAr")}</Label><Input value={form.title_ar} onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))} dir="rtl" /></div>
          </div>
          <div>
            <Label>Type</Label>
            <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="full-time">Full-time</SelectItem>
                <SelectItem value="part-time">Part-time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="remote">Remote</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Location (EN)</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
            <div><Label>Location (AR)</Label><Input value={form.location_ar} onChange={e => setForm(f => ({ ...f, location_ar: e.target.value }))} dir="rtl" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t("form.descEn")}</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
            <div><Label>{t("form.descAr")}</Label><Textarea value={form.description_ar} onChange={e => setForm(f => ({ ...f, description_ar: e.target.value }))} dir="rtl" rows={3} /></div>
          </div>
          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mt-1">
              <Input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="Add tag..." />
              <Button type="button" variant="outline" size="sm" onClick={addTag}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {form.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs flex items-center gap-1">
                  {tag} <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Switch checked={form.is_urgent} onCheckedChange={v => setForm(f => ({ ...f, is_urgent: v }))} /><Label>Urgent</Label></div>
            <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} /><Label>{t("common.active")}</Label></div>
          </div>
          <Button className="w-full gradient-brand text-primary-foreground" onClick={() => onSave(form)}>{job ? "Update" : "Create"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
