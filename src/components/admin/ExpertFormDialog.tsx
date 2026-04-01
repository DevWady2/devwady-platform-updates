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
import { Upload, X, UserCheck } from "lucide-react";
import { toast } from "sonner";

export interface ExpertFormData {
  id?: string;
  name: string;
  name_ar: string;
  role: string;
  role_ar: string;
  bio: string;
  bio_ar: string;
  avatar_url: string;
  initials: string;
  track: string;
  track_ar: string;
  specializations: string[];
  specializations_ar: string[];
  email: string;
  linkedin_url: string;
  github_url: string;
  years_experience: number;
  session_rate_usd: number;
  session_duration_minutes: number;
  is_active: boolean;
  user_id?: string;
}

const empty: ExpertFormData = {
  name: "", name_ar: "", role: "", role_ar: "", bio: "", bio_ar: "",
  avatar_url: "", initials: "", track: "", track_ar: "",
  specializations: [], specializations_ar: [], email: "",
  linkedin_url: "", github_url: "", years_experience: 0,
  session_rate_usd: 50, session_duration_minutes: 60, is_active: true,
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: ExpertFormData | null;
}

export default function ExpertFormDialog({ open, onClose, onSaved, initial }: Props) {
  const { t } = useLanguage();
  const [form, setForm] = useState<ExpertFormData>(initial ?? empty);
  const [saving, setSaving] = useState(false);
  const [specInput, setSpecInput] = useState("");
  const [specArInput, setSpecArInput] = useState("");
  const { upload, uploading } = useMediaUpload();
  const fileRef = useRef<HTMLInputElement>(null);
  const isEdit = !!initial?.id;

  const set = (key: keyof ExpertFormData, val: any) => setForm(f => ({ ...f, [key]: val }));

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await upload(file, "experts");
    if (url) set("avatar_url", url);
  };

  const addSpec = () => {
    if (specInput.trim()) { set("specializations", [...form.specializations, specInput.trim()]); setSpecInput(""); }
  };
  const addSpecAr = () => {
    if (specArInput.trim()) { set("specializations_ar", [...form.specializations_ar, specArInput.trim()]); setSpecArInput(""); }
  };

  const handleSave = async () => {
    if (!form.name || !form.name_ar || !form.initials) { toast.error("Name, Name (AR) and Initials are required"); return; }
    setSaving(true);
    const slug = form.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
    const payload: Record<string, unknown> = {
      name: form.name, name_ar: form.name_ar, role: form.role, role_ar: form.role_ar,
      bio: form.bio || null, bio_ar: form.bio_ar || null, avatar_url: form.avatar_url || null,
      initials: form.initials, track: form.track, track_ar: form.track_ar,
      specializations: form.specializations, specializations_ar: form.specializations_ar,
      email: form.email || null, linkedin_url: form.linkedin_url || null,
      github_url: form.github_url || null, years_experience: form.years_experience,
      session_rate_usd: form.session_rate_usd, session_duration_minutes: form.session_duration_minutes,
      is_active: form.is_active, slug,
    };

    const { error } = isEdit
      ? await supabase.from("consulting_experts").update(payload as any).eq("id", initial!.id!)
      : await supabase.from("consulting_experts").insert(payload as any);

    if (error) { toast.error(error.message); setSaving(false); return; }
    toast.success(isEdit ? "Expert updated" : "Expert added");
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Expert" : "Add Expert"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Linked account info */}
          {isEdit && initial?.user_id && (
            <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
              <UserCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                This expert is linked to a user account <span className="font-mono text-xs">({initial.user_id.slice(0, 8)}…)</span>
              </p>
            </div>
          )}

          {/* Avatar */}
          <div>
            <Label>Avatar</Label>
            <div className="mt-1 flex items-center gap-3">
              {form.avatar_url ? (
                <img loading="lazy" src={form.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover border border-border" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-bold">
                  {form.initials || "?"}
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                <Upload className="h-3.5 w-3.5 me-1" /> {uploading ? "Uploading…" : "Upload"}
              </Button>
            </div>
          </div>

          {/* Name / Initials */}
          <div className="grid grid-cols-3 gap-3">
            <div><Label>{t("common.name")} (EN) *</Label><Input value={form.name} onChange={e => set("name", e.target.value)} /></div>
            <div><Label>{t("common.name")} (AR) *</Label><Input value={form.name_ar} onChange={e => set("name_ar", e.target.value)} dir="rtl" /></div>
            <div><Label>Initials *</Label><Input value={form.initials} onChange={e => set("initials", e.target.value)} maxLength={3} /></div>
          </div>

          {/* Role */}
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Role (EN)</Label><Input value={form.role} onChange={e => set("role", e.target.value)} /></div>
            <div><Label>Role (AR)</Label><Input value={form.role_ar} onChange={e => set("role_ar", e.target.value)} dir="rtl" /></div>
          </div>

          {/* Track */}
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Track (EN)</Label><Input value={form.track} onChange={e => set("track", e.target.value)} /></div>
            <div><Label>Track (AR)</Label><Input value={form.track_ar} onChange={e => set("track_ar", e.target.value)} dir="rtl" /></div>
          </div>

          {/* Bio */}
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Bio (EN)</Label><Textarea rows={3} value={form.bio} onChange={e => set("bio", e.target.value)} /></div>
            <div><Label>Bio (AR)</Label><Textarea rows={3} value={form.bio_ar} onChange={e => set("bio_ar", e.target.value)} dir="rtl" /></div>
          </div>

          {/* Specializations EN */}
          <div>
            <Label>Specializations (EN)</Label>
            <div className="flex gap-2 mt-1">
              <Input value={specInput} onChange={e => setSpecInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSpec())} />
              <Button variant="outline" size="sm" onClick={addSpec}>Add</Button>
            </div>
            {form.specializations.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {form.specializations.map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-xs">
                    {s} <X className="h-3 w-3 cursor-pointer" onClick={() => set("specializations", form.specializations.filter((_, j) => j !== i))} />
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Specializations AR */}
          <div>
            <Label>Specializations (AR)</Label>
            <div className="flex gap-2 mt-1">
              <Input value={specArInput} onChange={e => setSpecArInput(e.target.value)} dir="rtl" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSpecAr())} />
              <Button variant="outline" size="sm" onClick={addSpecAr}>Add</Button>
            </div>
            {form.specializations_ar.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {form.specializations_ar.map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-xs">
                    {s} <X className="h-3 w-3 cursor-pointer" onClick={() => set("specializations_ar", form.specializations_ar.filter((_, j) => j !== i))} />
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Session config */}
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Rate (USD)</Label><Input type="number" value={form.session_rate_usd} onChange={e => set("session_rate_usd", parseFloat(e.target.value) || 0)} /></div>
            <div><Label>Duration (min)</Label><Input type="number" value={form.session_duration_minutes} onChange={e => set("session_duration_minutes", parseInt(e.target.value) || 60)} /></div>
            <div><Label>Experience (yrs)</Label><Input type="number" value={form.years_experience} onChange={e => set("years_experience", parseInt(e.target.value) || 0)} /></div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-3 gap-3">
            <div><Label>{t("common.email")}</Label><Input value={form.email} onChange={e => set("email", e.target.value)} /></div>
            <div><Label>{t("form.linkedin")}</Label><Input value={form.linkedin_url} onChange={e => set("linkedin_url", e.target.value)} /></div>
            <div><Label>{t("form.github")}</Label><Input value={form.github_url} onChange={e => set("github_url", e.target.value)} /></div>
          </div>

          {/* Active */}
          <div className="flex items-center gap-2">
            <Switch checked={form.is_active} onCheckedChange={v => set("is_active", v)} />
            <Label>{t("common.active")}</Label>
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
