import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  User, Phone, MapPin, Globe, Github, Linkedin, Camera, Loader2,
  DollarSign, X, Building2, Save, Sparkles,
} from "lucide-react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useProfileCompleteness } from "@/hooks/useProfileCompleteness";

// Module-level helper kept for FieldHint reference

/** Small hint shown below empty fields in onboarding mode */
function FieldHint({ show, pts, lang }: { show: boolean; pts: number; lang: string }) {
  if (!show) return null;
  return (
    <p className="mt-1 text-[11px] font-medium text-warning">
      {lang === "ar" ? `إكمال هذا الحقل يضيف ${pts} نقاط` : `Completing this adds ${pts} pts to your profile`}
    </p>
  );
}

export default function ProfileEdit() {
  const { user, role: authRole } = useAuth();
  const { lang, t } = useLanguage();
  const tt = (_l: string, en: string, ar: string) => _l === "ar" ? ar : en;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isOnboarding = searchParams.get("onboarding") === "true";
  const qc = useQueryClient();
  const avatarRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const isAr = lang === "ar";

  // ── personal profile ──
  const [form, setForm] = useState({
    full_name: "", bio: "", phone: "", location: "",
    skills: [] as string[], hourly_rate: "", portfolio_url: "",
    linkedin_url: "", github_url: "", avatar_url: "", is_available: true,
  });
  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // ── company ──
  const [comp, setComp] = useState({
    company_name: "", industry: "", employee_count: "", website: "",
    description: "", location: "", founded_year: "", logo_url: "",
  });
  const [logoUploading, setLogoUploading] = useState(false);

  const { isLoading: profileLoading } = useQuery({
    queryKey: ["edit-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle();
      if (data) {
        setForm({
          full_name: data.full_name || "", bio: data.bio || "", phone: data.phone || "",
          location: data.location || "", skills: data.skills || [], hourly_rate: data.hourly_rate || "",
          portfolio_url: data.portfolio_url || "", linkedin_url: data.linkedin_url || "",
          github_url: data.github_url || "", avatar_url: data.avatar_url || "",
          is_available: data.is_available ?? true,
        });
      }
      return data;
    },
  });

  const { isLoading: companyLoading } = useQuery({
    queryKey: ["edit-company", user?.id],
    enabled: !!user && authRole === "company",
    queryFn: async () => {
      const { data } = await supabase.from("company_profiles").select("*").eq("user_id", user!.id).maybeSingle();
      if (data) {
        setComp({
          company_name: data.company_name || "", industry: data.industry || "",
          employee_count: data.employee_count || "", website: data.website || "",
          description: data.description || "", location: data.location || "",
          founded_year: data.founded_year?.toString() || "", logo_url: data.logo_url || "",
        });
      }
      return data;
    },
  });

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));
  const setC = (key: string, val: any) => setComp(c => ({ ...c, [key]: val }));

  // ── avatar upload ──
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { toast.error("Upload failed"); setAvatarUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    set("avatar_url", publicUrl);
    setAvatarUploading(false);
    toast.success(tt(lang, "Avatar uploaded", "تم رفع الصورة"));
  };

  // ── logo upload ──
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setLogoUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/company/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { toast.error("Upload failed"); setLogoUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    setC("logo_url", publicUrl);
    setLogoUploading(false);
    toast.success(tt(lang, "Logo uploaded", "تم رفع الشعار"));
  };

  // ── skills ──
  const addSkill = () => {
    const s = skillInput.trim();
    if (!s || form.skills.includes(s) || form.skills.length >= 15) return;
    set("skills", [...form.skills, s]);
    setSkillInput("");
  };
  const removeSkill = (skill: string) => set("skills", form.skills.filter((s: string) => s !== skill));

  // ── completeness (used for onboarding mode) ──
  const completeness = useProfileCompleteness();

  const getRoleHome = () => {
    if (authRole === "admin") return "/admin";
    if (authRole === "company") return "/company/jobs";
    return "/profile";
  };

  // ── save ──
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name, bio: form.bio, phone: form.phone,
      location: form.location, skills: form.skills, hourly_rate: form.hourly_rate,
      portfolio_url: form.portfolio_url, linkedin_url: form.linkedin_url,
      github_url: form.github_url, avatar_url: form.avatar_url,
      is_available: form.is_available,
    }).eq("user_id", user.id);

    if (error) { toast.error(tt(lang, "Failed to save", "حدث خطأ")); setSaving(false); return; }

    if (authRole === "company") {
      const { error: cErr } = await supabase.from("company_profiles").update({
        company_name: comp.company_name, industry: comp.industry || null,
        employee_count: comp.employee_count || null, website: comp.website || null,
        description: comp.description || null, location: comp.location || null,
        founded_year: comp.founded_year ? parseInt(comp.founded_year) : null,
        logo_url: comp.logo_url || null,
      }).eq("user_id", user.id);
      if (cErr) { toast.error(tt(lang, "Failed to save company", "فشل حفظ بيانات الشركة")); setSaving(false); return; }
    }

    setSaving(false);
    // Invalidate completeness queries
    qc.invalidateQueries({ queryKey: ["completeness-profile"] });
    qc.invalidateQueries({ queryKey: ["completeness-company"] });

    if (isOnboarding) {
      // Re-check completeness after save by refetching
      const { data: freshProfile } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      const hasName = !!freshProfile?.full_name;
      const hasAvatar = !!freshProfile?.avatar_url;
      const hasSkills = Array.isArray(freshProfile?.skills) && freshProfile.skills.length >= 3;
      const quickScore = (hasName ? 15 : 0) + (hasAvatar ? 15 : 0) + (hasSkills ? 15 : 0);
      if (quickScore >= 45) {
        toast.success(tt(lang, "🎉 Great start! Your profile is now visible to others", "🎉 بداية رائعة! ملفك الشخصي مرئي الآن للآخرين"));
        navigate(getRoleHome());
      } else {
        toast.success(tt(lang, "Saved! Keep going — complete more fields to boost your profile", "تم الحفظ! أكمل المزيد لتعزيز ملفك"));
      }
    } else {
      toast.success(tt(lang, "Profile saved successfully", "تم حفظ الملف بنجاح"));
      navigate("/profile");
    }
  };

  if (profileLoading || companyLoading) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </section>
    );
  }

  const initials = form.full_name
    ? form.full_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <>
      <SEO title={lang === "ar" ? "تعديل الملف الشخصي" : "Edit Profile"} />
    <section className="py-20">
      <div className="container mx-auto px-4 max-w-3xl space-y-6">
        {/* ── Onboarding header ── */}
        {isOnboarding ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-6 w-6" />
              <h1 className="text-3xl font-bold">
                {tt(lang, "Welcome to DevWady!", "مرحباً بك في DevWady!")}
              </h1>
            </div>
            <p className="text-muted-foreground">
              {authRole === "company"
                ? tt(lang, "A complete company profile helps you attract top talent and build trust", "ملف الشركة الكامل يساعدك على جذب أفضل الكفاءات وبناء الثقة")
                : tt(lang, "A complete profile helps companies discover you and increases your hiring chances", "الملف الكامل يساعد الشركات على اكتشافك ويزيد فرص توظيفك")}
            </p>
            {/* Onboarding progress */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">{tt(lang, "Profile completeness", "اكتمال الملف")}</span>
                <span className="text-lg font-bold text-primary">{completeness.percentage}%</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div className="h-3 rounded-full gradient-brand transition-all duration-700 ease-out" style={{ width: `${completeness.percentage}%` }} />
              </div>
              {completeness.nextStep && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {isAr ? "التالي: " : "Next: "}{completeness.nextStep}
                </p>
              )}
            </div>
            {/* Visual stepper */}
            <div className="flex items-center gap-2">
              {(authRole === "company"
                ? [tt(lang, "Contact info", "معلومات التواصل"), tt(lang, "Company details", "تفاصيل الشركة"), tt(lang, "Company branding", "هوية الشركة")]
                : [tt(lang, "Basic info", "المعلومات الأساسية"), tt(lang, "Skills & links", "المهارات والروابط"), tt(lang, "Professional details", "التفاصيل المهنية")]
              ).map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  {i > 0 && <div className="w-8 h-px bg-border" />}
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{i + 1}</span>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{step}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold mb-1">{tt(lang, "Edit Profile", "تعديل الملف")}</h1>
            <p className="text-muted-foreground mb-8">{tt(lang, "Update your personal information", "حدّث معلوماتك الشخصية")}</p>
          </motion.div>
        )}

        {/* ── Avatar ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}
          className={`bg-card rounded-2xl border border-border p-6 flex items-center gap-6 ${isOnboarding && !form.avatar_url ? "border-s-4 border-s-warning" : ""}`}>
          <div className="relative group shrink-0">
            <div className="w-[100px] h-[100px] rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
              {form.avatar_url ? (
                <img loading="lazy" src={form.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-muted-foreground">{initials}</span>
              )}
            </div>
            <button
              onClick={() => avatarRef.current?.click()}
              disabled={avatarUploading}
              className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {avatarUploading ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Camera className="h-5 w-5 text-white" />}
            </button>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div>
            <p className="font-semibold">{form.full_name || tt(lang, "Your Name", "اسمك")}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <FieldHint show={isOnboarding && !form.avatar_url} pts={authRole === "company" ? 10 : 15} lang={lang} />
          </div>
        </motion.div>

        {/* ── Personal Info ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
          className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h2 className="font-bold text-lg">{tt(lang, "Personal Info", "المعلومات الشخصية")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={isOnboarding && !form.full_name ? "border-s-2 border-s-warning ps-3" : ""}>
              <Label>{tt(lang, "Full Name", "الاسم الكامل")}</Label>
              <div className="relative mt-1">
                <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={form.full_name} onChange={e => set("full_name", e.target.value)} className="ps-10" />
              </div>
              <FieldHint show={isOnboarding && !form.full_name} pts={authRole === "company" ? 10 : 15} lang={lang} />
            </div>
            <div className={isOnboarding && !form.phone ? "border-s-2 border-s-warning ps-3" : ""}>
              <Label>{tt(lang, "Phone", "الهاتف")}</Label>
              <div className="relative mt-1">
                <Phone className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={form.phone} onChange={e => set("phone", e.target.value)} className="ps-10" />
              </div>
              <FieldHint show={isOnboarding && !form.phone} pts={5} lang={lang} />
            </div>
            <div className={`sm:col-span-2 ${isOnboarding && !form.location ? "border-s-2 border-s-warning ps-3" : ""}`}>
              <Label>{tt(lang, "Location", "الموقع")}</Label>
              <div className="relative mt-1">
                <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={form.location} onChange={e => set("location", e.target.value)} className="ps-10" />
              </div>
              <FieldHint show={isOnboarding && !form.location} pts={authRole === "company" ? 5 : 10} lang={lang} />
            </div>
          </div>
          <div className={isOnboarding && !form.bio ? "border-s-2 border-s-warning ps-3" : ""}>
            <div className="flex items-center justify-between mb-1">
              <Label>{tt(lang, "Bio", "نبذة عنك")}</Label>
              <span className="text-xs text-muted-foreground">{form.bio.length}/500</span>
            </div>
            <Textarea
              value={form.bio}
              onChange={e => { if (e.target.value.length <= 500) set("bio", e.target.value); }}
              rows={3}
              placeholder={tt(lang, "Tell us about yourself...", "أخبرنا عن نفسك...")}
            />
            <FieldHint show={isOnboarding && !form.bio} pts={authRole === "company" ? 5 : 10} lang={lang} />
          </div>
        </motion.div>

        {/* ── Professional ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}
          className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h2 className="font-bold text-lg">{tt(lang, "Professional", "المهني")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={isOnboarding && !form.hourly_rate ? "border-s-2 border-s-warning ps-3" : ""}>
              <Label>{tt(lang, "Hourly Rate", "أجر الساعة")}</Label>
              <div className="relative mt-1">
                <DollarSign className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={form.hourly_rate} onChange={e => set("hourly_rate", e.target.value)} placeholder="50/hr" className="ps-10" />
              </div>
              <FieldHint show={isOnboarding && !form.hourly_rate} pts={10} lang={lang} />
            </div>
            <div className={isOnboarding && !form.portfolio_url && !form.linkedin_url && !form.github_url ? "border-s-2 border-s-warning ps-3" : ""}>
              <Label>{tt(lang, "Portfolio", "الأعمال")}</Label>
              <div className="relative mt-1">
                <Globe className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={form.portfolio_url} onChange={e => set("portfolio_url", e.target.value)} placeholder="https://..." className="ps-10" />
              </div>
              <FieldHint show={isOnboarding && !form.portfolio_url && !form.linkedin_url && !form.github_url} pts={15} lang={lang} />
            </div>
            <div>
              <Label>{t("form.linkedin")}</Label>
              <div className="relative mt-1">
                <Linkedin className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={form.linkedin_url} onChange={e => set("linkedin_url", e.target.value)} placeholder="https://linkedin.com/in/..." className="ps-10" />
              </div>
            </div>
            <div>
              <Label>{t("form.github")}</Label>
              <div className="relative mt-1">
                <Github className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={form.github_url} onChange={e => set("github_url", e.target.value)} placeholder="https://github.com/..." className="ps-10" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Switch checked={form.is_available} onCheckedChange={v => set("is_available", v)} />
            <Label>{tt(lang, "Available for hire", "متاح للتوظيف")}</Label>
          </div>
        </motion.div>

        {/* ── Skills ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className={`bg-card rounded-2xl border border-border p-6 space-y-3 ${isOnboarding && form.skills.length < 3 ? "border-s-4 border-s-warning" : ""}`}>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">{tt(lang, "Skills", "المهارات")}</h2>
            <span className="text-xs text-muted-foreground">{form.skills.length}/15</span>
          </div>
          <div className="flex gap-2">
            <Input
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              placeholder={tt(lang, "Type a skill & press Enter", "اكتب مهارة واضغط Enter")}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
              disabled={form.skills.length >= 15}
            />
            <Button type="button" variant="outline" size="sm" onClick={addSkill} disabled={form.skills.length >= 15}>
              {tt(lang, "Add", "أضف")}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.skills.map((s: string) => (
              <span key={s} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm">
                {s}
                <button onClick={() => removeSkill(s)} className="hover:text-destructive transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
          <FieldHint show={isOnboarding && form.skills.length < 3} pts={15} lang={lang} />
        </motion.div>

        {/* ── Company (if company role) ── */}
        {authRole === "company" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-lg">{tt(lang, "Company Info", "معلومات الشركة")}</h2>
            </div>

            {/* Logo */}
            <div className={`flex items-center gap-4 ${isOnboarding && !comp.logo_url ? "border-s-2 border-s-warning ps-3" : ""}`}>
              <div className="relative group shrink-0">
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center">
                  {comp.logo_url ? (
                    <img loading="lazy" src={comp.logo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <button
                  onClick={() => logoRef.current?.click()}
                  disabled={logoUploading}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {logoUploading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Camera className="h-4 w-4 text-white" />}
                </button>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{tt(lang, "Company logo", "شعار الشركة")}</p>
                <FieldHint show={isOnboarding && !comp.logo_url} pts={15} lang={lang} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={isOnboarding && !comp.company_name ? "border-s-2 border-s-warning ps-3" : ""}>
                <Label>{tt(lang, "Company Name", "اسم الشركة")}</Label>
                <Input value={comp.company_name} onChange={e => setC("company_name", e.target.value)} className="mt-1" />
                <FieldHint show={isOnboarding && !comp.company_name} pts={15} lang={lang} />
              </div>
              <div className={isOnboarding && !comp.industry ? "border-s-2 border-s-warning ps-3" : ""}>
                <Label>{tt(lang, "Industry", "القطاع")}</Label>
                <Select value={comp.industry} onValueChange={v => setC("industry", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder={tt(lang, "Select", "اختر")} /></SelectTrigger>
                  <SelectContent>
                    {["Technology", "Real Estate", "Healthcare", "Finance", "Education", "Retail", "Logistics", "Other"].map(i => (
                      <SelectItem key={i} value={i}>{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldHint show={isOnboarding && !comp.industry} pts={10} lang={lang} />
              </div>
              <div className={isOnboarding && !comp.employee_count ? "border-s-2 border-s-warning ps-3" : ""}>
                <Label>{tt(lang, "Team Size", "حجم الفريق")}</Label>
                <Select value={comp.employee_count} onValueChange={v => setC("employee_count", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder={tt(lang, "Select", "اختر")} /></SelectTrigger>
                  <SelectContent>
                    {["1-10", "11-50", "51-200", "200+"].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldHint show={isOnboarding && !comp.employee_count} pts={5} lang={lang} />
              </div>
              <div>
                <Label>{tt(lang, "Founded Year", "سنة التأسيس")}</Label>
                <Input type="number" value={comp.founded_year} onChange={e => setC("founded_year", e.target.value)} className="mt-1" />
              </div>
              <div className={isOnboarding && !comp.website ? "border-s-2 border-s-warning ps-3" : ""}>
                <Label>{tt(lang, "Website", "الموقع الإلكتروني")}</Label>
                <Input value={comp.website} onChange={e => setC("website", e.target.value)} placeholder="https://..." className="mt-1" />
                <FieldHint show={isOnboarding && !comp.website} pts={10} lang={lang} />
              </div>
              <div>
                <Label>{tt(lang, "Location", "الموقع")}</Label>
                <Input value={comp.location} onChange={e => setC("location", e.target.value)} className="mt-1" />
              </div>
            </div>
            <div className={isOnboarding && !comp.description ? "border-s-2 border-s-warning ps-3" : ""}>
              <Label>{tt(lang, "Description", "الوصف")}</Label>
              <Textarea value={comp.description} onChange={e => setC("description", e.target.value)} rows={3} className="mt-1" />
              <FieldHint show={isOnboarding && !comp.description} pts={10} lang={lang} />
            </div>
          </motion.div>
        )}

        {/* ── Actions ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          className="space-y-3">
          <Button onClick={handleSave} disabled={saving} className="w-full gradient-brand text-primary-foreground rounded-full h-12 text-base gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {tt(lang, "Save Changes", "حفظ التغييرات")}
          </Button>
          {isOnboarding ? (
            <Link to={getRoleHome()} className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
              {tt(lang, "Skip for now", "تخطي حالياً")}
            </Link>
          ) : (
            <Link to="/profile" className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
              {tt(lang, "Cancel", "إلغاء")}
            </Link>
          )}
        </motion.div>
      </div>
    </section>
    </>
  );
}
