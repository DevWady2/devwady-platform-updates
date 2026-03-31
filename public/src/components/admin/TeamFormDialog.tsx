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
import { Upload } from "lucide-react";
import { toast } from "sonner";

export interface TeamFormData {
  id?: string;
  name_en: string;
  name_ar: string;
  role_en: string;
  role_ar: string;
  bio_en: string;
  bio_ar: string;
  avatar_url: string;
  email: string;
  linkedin_url: string;
  github_url: string;
  department: string;
  sort_order: number;
  is_active: boolean;
}

const empty: TeamFormData = {
  name_en: "", name_ar: "", role_en: "", role_ar: "",
  bio_en: "", bio_ar: "", avatar_url: "", email: "",
  linkedin_url: "", github_url: "", department: "", sort_order: 0, is_active: true,
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: TeamFormData | null;
}

export default function TeamFormDialog({ open, onClose, onSaved, initial }: Props) {
  const { t } = useLanguage();
  const [form, setForm] = useState<TeamFormData>(initial ?? empty);
  const [saving, setSaving] = useState(false);
  const { upload, uploading } = useMediaUpload();
  const fileRef = useRef<HTMLInputElement>(null);
  const isEdit = !!initial?.id;

  const set = (key: keyof TeamFormData, val: any) => setForm(f => ({ ...f, [key]: val }));

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await upload(file, "team");
    if (url) set("avatar_url", url);
  };

  const handleSave = async () => {
    if (!form.name_en) { toast.error("Name (EN) is required"); return; }
    setSaving(true);
    const payload = {
      name_en: form.name_en, name_ar: form.name_ar || null,
      role_en: form.role_en || null, role_ar: form.role_ar || null,
      bio_en: form.bio_en || null, bio_ar: form.bio_ar || null,
      avatar_url: form.avatar_url || null, email: form.email || null,
      linkedin_url: form.linkedin_url || null, github_url: form.github_url || null,
      department: form.department || null, sort_order: form.sort_order, is_active: form.is_active,
    };

    const { error } = isEdit
      ? await supabase.from("team_members").update(payload).eq("id", initial!.id!)
      : await supabase.from("team_members").insert(payload);

    if (error) { toast.error(error.message); setSaving(false); return; }
    toast.success(isEdit ? "Member updated" : "Member added");
    setSaving(false);
    onSaved();
    onClose();
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) onClose();
    else setForm(initial ?? empty);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Member" : "Add Member"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Avatar */}
          <div>
            <Label>Avatar</Label>
            <div className="mt-1 flex items-center gap-3">
              {form.avatar_url ? (
                <img loading="lazy" src={form.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover border border-border" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-lg font-bold">
                  {form.name_en.charAt(0) || "?"}
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                <Upload className="h-3.5 w-3.5 me-1" /> {uploading ? "Uploading…" : "Upload"}
              </Button>
            </div>
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t("common.name")} (EN) *</Label><Input value={form.name_en} onChange={e => set("name_en", e.target.value)} /></div>
            <div><Label>{t("common.name")} (AR)</Label><Input value={form.name_ar} onChange={e => set("name_ar", e.target.value)} dir="rtl" /></div>
          </div>

          {/* Role */}
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Role (EN)</Label><Input value={form.role_en} onChange={e => set("role_en", e.target.value)} /></div>
            <div><Label>Role (AR)</Label><Input value={form.role_ar} onChange={e => set("role_ar", e.target.value)} dir="rtl" /></div>
          </div>

          {/* Bio */}
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Bio (EN)</Label><Textarea rows={3} value={form.bio_en} onChange={e => set("bio_en", e.target.value)} /></div>
            <div><Label>Bio (AR)</Label><Textarea rows={3} value={form.bio_ar} onChange={e => set("bio_ar", e.target.value)} dir="rtl" /></div>
          </div>

          {/* Email / Department */}
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t("common.email")}</Label><Input value={form.email} onChange={e => set("email", e.target.value)} /></div>
            <div>
              <Label>Department</Label>
              <Select value={form.department} onValueChange={v => set("department", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="management">Management</SelectItem>
                  <SelectItem value="qa">QA</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Social Links */}
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t("form.linkedin")}</Label><Input value={form.linkedin_url} onChange={e => set("linkedin_url", e.target.value)} /></div>
            <div><Label>{t("form.githubUrl")}</Label><Input value={form.github_url} onChange={e => set("github_url", e.target.value)} /></div>
          </div>

          {/* Sort / Active */}
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t("form.sortOrder")}</Label><Input type="number" value={form.sort_order} onChange={e => set("sort_order", parseInt(e.target.value) || 0)} /></div>
            <div className="flex items-end gap-2 pb-1">
              <Switch checked={form.is_active} onCheckedChange={v => set("is_active", v)} />
              <Label>{t("common.active")}</Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
            <Button className="gradient-brand text-primary-foreground" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Update" : "Add"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
