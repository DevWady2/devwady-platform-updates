/**
 * Consulting — Expert Profile Edit (portal version).
 */
import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader } from "@/core/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Camera, Save, Loader2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useExpertRecord, EXPERT_RECORD_KEY } from "../hooks/useExpertRecord";

export default function ConsultingProfileEdit() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const queryClient = useQueryClient();
  const avatarRef = useRef<HTMLInputElement>(null);

  const { data: expert, isLoading } = useExpertRecord();

  const [form, setForm] = useState<Record<string, any>>({});
  const merged = { ...expert, ...form };

  const update = useMutation({
    mutationFn: async () => {
      if (!expert) return;
      const { error } = await supabase.from("consulting_experts").update({
        bio: form.bio ?? expert.bio,
        bio_ar: form.bio_ar ?? expert.bio_ar,
        linkedin_url: form.linkedin_url ?? expert.linkedin_url,
        github_url: form.github_url ?? expert.github_url,
        email: form.email ?? expert.email,
        session_rate_usd: form.session_rate_usd ?? expert.session_rate_usd,
        session_duration_minutes: form.session_duration_minutes ?? expert.session_duration_minutes,
      }).eq("id", expert.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EXPERT_RECORD_KEY] });
      toast.success(isAr ? "تم الحفظ" : "Profile updated");
      setForm({});
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const uploadAvatar = async (file: File) => {
    if (!expert) return;
    const ext = file.name.split(".").pop();
    const path = `experts/${expert.id}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) { toast.error("Upload failed"); return; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("consulting_experts").update({ avatar_url: publicUrl }).eq("id", expert.id);
    queryClient.invalidateQueries({ queryKey: [EXPERT_RECORD_KEY] });
    toast.success(isAr ? "تم تحديث الصورة" : "Avatar updated");
  };

  if (isLoading) return <div className="h-60 bg-muted rounded-lg animate-pulse" />;
  if (!expert) return <p className="text-center py-20 text-muted-foreground">{isAr ? "لم يتم إعداد حساب الخبير" : "Expert account not configured"}</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title_en="Edit Expert Profile"
        title_ar="تعديل ملف الخبير"
        description_en="Update your public consulting profile"
        description_ar="حدّث ملفك الاستشاري العام"
      />

      <Card>
        <CardContent className="p-5 flex items-center gap-5">
          <div className="relative">
            <Avatar className="h-16 w-16">
              <AvatarImage src={expert.avatar_url ?? ""} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">{expert.initials}</AvatarFallback>
            </Avatar>
            <button
              onClick={() => avatarRef.current?.click()}
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
          </div>
          <div>
            <h2 className="font-semibold">{isAr ? expert.name_ar : expert.name}</h2>
            <p className="text-sm text-muted-foreground">{isAr ? expert.role_ar : expert.role}</p>
            <Badge variant="secondary" className="text-[10px] mt-1">{isAr ? expert.track_ar : expert.track}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">{isAr ? "السيرة الذاتية" : "Bio"}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bio-en">{isAr ? "السيرة (English)" : "Bio (English)"}</Label>
            <Textarea id="bio-en" rows={4} value={merged.bio ?? ""} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bio-ar">{isAr ? "السيرة (عربي)" : "Bio (Arabic)"}</Label>
            <Textarea id="bio-ar" rows={4} value={merged.bio_ar ?? ""} onChange={e => setForm(f => ({ ...f, bio_ar: e.target.value }))} dir="rtl" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">{isAr ? "إعدادات الجلسة" : "Session Settings"}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{isAr ? "سعر الجلسة (USD)" : "Session Rate (USD)"}</Label>
            <Input type="number" value={merged.session_rate_usd ?? ""} onChange={e => setForm(f => ({ ...f, session_rate_usd: Number(e.target.value) }))} />
          </div>
          <div className="space-y-1.5">
            <Label>{isAr ? "مدة الجلسة (دقيقة)" : "Duration (minutes)"}</Label>
            <Input type="number" value={merged.session_duration_minutes ?? ""} onChange={e => setForm(f => ({ ...f, session_duration_minutes: Number(e.target.value) }))} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">{isAr ? "الروابط" : "Links"}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={merged.email ?? ""} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>LinkedIn URL</Label>
            <Input value={merged.linkedin_url ?? ""} onChange={e => setForm(f => ({ ...f, linkedin_url: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>GitHub URL</Label>
            <Input value={merged.github_url ?? ""} onChange={e => setForm(f => ({ ...f, github_url: e.target.value }))} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Link to={`/consulting/${expert.slug}`} target="_blank" rel="noreferrer">
          <Button variant="outline"><ExternalLink className="h-4 w-4 me-1.5" />{isAr ? "عرض الملف العام" : "View Public Profile"}</Button>
        </Link>
        <Button onClick={() => update.mutate()} disabled={update.isPending || Object.keys(form).length === 0}>
          {update.isPending ? <Loader2 className="h-4 w-4 me-1.5 animate-spin" /> : <Save className="h-4 w-4 me-1.5" />}
          {isAr ? "حفظ التغييرات" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
