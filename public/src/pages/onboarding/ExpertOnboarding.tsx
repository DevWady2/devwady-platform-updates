import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, ArrowRight, ArrowLeft, Loader2, User, Clock, Calendar,
  Plus, X, Sparkles, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { format, parse, addMinutes } from "date-fns";
import { useMediaUpload } from "@/hooks/useMediaUpload";

const DAY_NAMES_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_NAMES_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

const TIME_OPTIONS: string[] = [];
for (let h = 8; h <= 20; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 20) TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:30`);
}

interface DaySlot {
  day: number;
  start: string;
  end: string;
}

export default function ExpertOnboarding() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isAr = lang === "ar";

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1 fields
  const [bio, setBio] = useState("");
  const [bioAr, setBioAr] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [specInput, setSpecInput] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [yearsExp, setYearsExp] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Step 2 fields
  const [daySlots, setDaySlots] = useState<DaySlot[]>([]);
  const [dayToggles, setDayToggles] = useState<boolean[]>(Array(7).fill(false));

  const { uploading, upload } = useMediaUpload();

  const { data: expert, isLoading } = useQuery({
    queryKey: ["expert-onboarding", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consulting_experts")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Pre-fill from expert record
  useMemo(() => {
    if (!expert) return false;
    if (!bio && expert.bio) setBio(expert.bio);
    if (!bioAr && expert.bio_ar) setBioAr(expert.bio_ar);
    if (!specializations.length && expert.specializations?.length) setSpecializations(expert.specializations);
    if (!linkedin && expert.linkedin_url) setLinkedin(expert.linkedin_url);
    if (!github && expert.github_url) setGithub(expert.github_url);
    if (!yearsExp && expert.years_experience) setYearsExp(String(expert.years_experience));
    if (!avatarUrl && expert.avatar_url) setAvatarUrl(expert.avatar_url);
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expert]);

  // Fetch existing availability (for future pre-fill)
  useQuery({
    queryKey: ["expert-avail-onboard", expert?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expert_availability")
        .select("*")
        .eq("expert_id", expert!.id)
        .eq("is_recurring", true);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!expert?.id,
  });

  const endTimeForStart = useCallback(
    (start: string) => {
      const dur = expert?.session_duration_minutes ?? 60;
      const d = parse(start, "HH:mm", new Date());
      return format(addMinutes(d, dur), "HH:mm");
    },
    [expert]
  );

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await upload(file, user?.id);
    if (url) setAvatarUrl(url);
  };

  const addSpec = () => {
    const val = specInput.trim();
    if (val && !specializations.includes(val) && specializations.length < 10) {
      setSpecializations([...specializations, val]);
      setSpecInput("");
    }
  };

  const removeSpec = (s: string) => setSpecializations(specializations.filter(x => x !== s));

  const handleStep1Save = async () => {
    if (bio.trim().length < 50) {
      toast.error(isAr ? "السيرة الذاتية يجب أن تكون 50 حرفاً على الأقل" : "Bio must be at least 50 characters");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("consulting_experts")
      .update({
        bio: bio.trim(),
        bio_ar: bioAr.trim() || null,
        specializations,
        linkedin_url: linkedin || null,
        github_url: github || null,
        years_experience: yearsExp ? parseInt(yearsExp) : null,
        avatar_url: avatarUrl || null,
      })
      .eq("user_id", user!.id);

    setSaving(false);
    if (error) { toast.error(error.message); return; }

    // Also update profile avatar if set
    if (avatarUrl) {
      await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("user_id", user!.id);
    }

    qc.invalidateQueries({ queryKey: ["expert-onboarding"] });
    setStep(2);
  };

  const toggleDay = (day: number, on: boolean) => {
    const next = [...dayToggles];
    next[day] = on;
    setDayToggles(next);
    if (on && !daySlots.some(s => s.day === day)) {
      setDaySlots([...daySlots, { day, start: "09:00", end: endTimeForStart("09:00") }]);
    }
    if (!on) {
      setDaySlots(daySlots.filter(s => s.day !== day));
    }
  };

  const updateSlotStart = (day: number, idx: number, start: string) => {
    const slotsForDay = daySlots.filter(s => s.day === day);
    const globalIdx = daySlots.indexOf(slotsForDay[idx]);
    const next = [...daySlots];
    next[globalIdx] = { day, start, end: endTimeForStart(start) };
    setDaySlots(next);
  };

  const addSlotToDay = (day: number) => {
    if (daySlots.filter(s => s.day === day).length >= 4) return;
    setDaySlots([...daySlots, { day, start: "14:00", end: endTimeForStart("14:00") }]);
  };

  const removeSlot = (day: number, idx: number) => {
    const slotsForDay = daySlots.filter(s => s.day === day);
    const globalIdx = daySlots.indexOf(slotsForDay[idx]);
    const next = [...daySlots];
    next.splice(globalIdx, 1);
    setDaySlots(next);
    if (!next.some(s => s.day === day)) {
      const t = [...dayToggles];
      t[day] = false;
      setDayToggles(t);
    }
  };

  const handleStep2Save = async () => {
    if (daySlots.length < 3) {
      toast.error(isAr ? "يرجى إضافة 3 فترات على الأقل" : "Please add at least 3 time slots");
      return;
    }
    setSaving(true);

    // Delete existing recurring slots
    if (expert?.id) {
      await supabase.from("expert_availability").delete().eq("expert_id", expert.id).eq("is_recurring", true);
    }

    // Insert new slots
    const rows = daySlots.map(s => ({
      expert_id: expert!.id,
      day_of_week: s.day,
      start_time: s.start,
      end_time: s.end,
      is_recurring: true,
      is_active: true,
    }));

    const { error } = await supabase.from("expert_availability").insert(rows);
    setSaving(false);
    if (error) { toast.error(error.message); return; }

    // Update profile completeness so redirect won't loop
    await supabase.from("profiles").update({ bio: bio.trim() || "Expert" }).eq("user_id", user!.id);
    qc.invalidateQueries({ queryKey: ["profile-completeness"] });
    setStep(3);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">{isAr ? "لم يتم العثور على ملف خبير مرتبط بحسابك." : "No expert profile found linked to your account."}</p>
          <Button onClick={() => navigate("/profile")} variant="outline" className="mt-4">
            {isAr ? "الذهاب للملف الشخصي" : "Go to Profile"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title={isAr ? "إعداد ملف الخبير" : "Expert Onboarding"} />
      <section className="min-h-[80vh] flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-2xl mx-auto">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  s < step ? "bg-emerald-500 text-white" : s === step ? "gradient-brand text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {s < step ? <Check className="h-4 w-4" /> : s}
                </div>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {s === 1 ? (isAr ? "الملف الشخصي" : "Profile") : s === 2 ? (isAr ? "المواعيد" : "Availability") : (isAr ? "جاهز" : "Ready")}
                </span>
                {s < 3 && <div className={`w-8 h-0.5 ${s < step ? "bg-emerald-500" : "bg-muted"}`} />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* STEP 1: Complete Profile */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="bg-card rounded-2xl border border-border p-8 shadow-xl">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold">{isAr ? "أكمل ملفك كخبير" : "Complete Your Expert Profile"}</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isAr ? "هذه المعلومات ستظهر على صفحتك العامة" : "This info will appear on your public profile"}
                  </p>
                </div>

                {/* Admin-set read-only fields */}
                <div className="bg-muted/50 rounded-xl p-4 mb-6 space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">{isAr ? "تم تعيينه بواسطة الإدارة" : "Set by admin"}</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">{isAr ? "الاسم:" : "Name:"}</span> <span className="font-medium">{isAr ? expert.name_ar : expert.name}</span></div>
                    <div><span className="text-muted-foreground">{isAr ? "الدور:" : "Role:"}</span> <span className="font-medium">{isAr ? expert.role_ar : expert.role}</span></div>
                    <div><span className="text-muted-foreground">{isAr ? "المسار:" : "Track:"}</span> <span className="font-medium">{isAr ? expert.track_ar : expert.track}</span></div>
                    <div><span className="text-muted-foreground">{isAr ? "سعر الجلسة:" : "Rate:"}</span> <span className="font-medium">${expert.session_rate_usd}/{expert.session_duration_minutes}min</span></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{isAr ? "تواصل مع الإدارة لتعديل هذه البيانات" : "Contact admin to change these"}</p>
                </div>

                <div className="space-y-5">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                      {avatarUrl ? (
                        <img loading="lazy" src={avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-8 w-8 text-primary" />
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium cursor-pointer text-primary hover:underline">
                        {uploading ? (isAr ? "جاري الرفع..." : "Uploading...") : (isAr ? "تحميل صورة" : "Upload photo")}
                        <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploading} />
                      </label>
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="text-sm font-medium">{isAr ? "نبذة عنك *" : "Bio *"}</label>
                    <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder={isAr ? "أخبر العملاء عن خبراتك..." : "Tell clients about your expertise..."} className="mt-1" rows={4} />
                    <p className="text-xs text-muted-foreground mt-1">{bio.length}/1000 {isAr ? "(50 حرف كحد أدنى)" : "(min 50 chars)"}</p>
                  </div>

                  {/* Bio AR */}
                  <div>
                    <label className="text-sm font-medium">{isAr ? "نبذة بالعربية" : "Bio (Arabic)"}</label>
                    <Textarea value={bioAr} onChange={e => setBioAr(e.target.value)} placeholder={isAr ? "اختياري" : "Optional — Arabic bio"} className="mt-1" rows={3} dir="rtl" />
                  </div>

                  {/* Specializations */}
                  <div>
                    <label className="text-sm font-medium">{isAr ? "التخصصات" : "Specializations"}</label>
                    <div className="flex gap-2 mt-1">
                      <Input value={specInput} onChange={e => setSpecInput(e.target.value)} placeholder={isAr ? "أضف تخصص..." : "Add specialization..."}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSpec(); } }} />
                      <Button type="button" variant="outline" size="icon" onClick={addSpec}><Plus className="h-4 w-4" /></Button>
                    </div>
                    {specializations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {specializations.map(s => (
                          <Badge key={s} variant="secondary" className="gap-1">
                            {s}
                            <button onClick={() => removeSpec(s)}><X className="h-3 w-3" /></button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Links + experience */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">LinkedIn</label>
                      <Input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">GitHub</label>
                      <Input value={github} onChange={e => setGithub(e.target.value)} placeholder="https://github.com/..." className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">{isAr ? "سنوات الخبرة" : "Years of experience"}</label>
                      <Input type="number" min={0} max={50} value={yearsExp} onChange={e => setYearsExp(e.target.value)} className="mt-1" />
                    </div>
                  </div>

                  <Button onClick={handleStep1Save} disabled={saving} className="w-full gradient-brand text-primary-foreground rounded-full">
                    {saving ? <><Loader2 className="me-2 h-4 w-4 animate-spin" />{isAr ? "جاري الحفظ..." : "Saving..."}</> : <>{isAr ? "متابعة" : "Continue"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" /></>}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Set Availability */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="bg-card rounded-2xl border border-border p-8 shadow-xl">
                <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
                  <ArrowLeft className="icon-flip-rtl h-4 w-4" /> {isAr ? "السابق" : "Back"}
                </button>

                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold">{isAr ? "حدد مواعيدك" : "Set Your Availability"}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isAr ? "أضف 3 فترات على الأقل خلال الأسبوع" : "Add at least 3 slots across the week"}
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  {[0, 1, 2, 3, 4, 5, 6].map(day => {
                    const slotsForDay = daySlots.filter(s => s.day === day);
                    return (
                      <div key={day} className="border border-border rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{isAr ? DAY_NAMES_AR[day] : DAY_NAMES_EN[day]}</span>
                          <Switch checked={dayToggles[day]} onCheckedChange={on => toggleDay(day, on)} />
                        </div>
                        {dayToggles[day] && (
                          <div className="mt-3 space-y-2">
                            {slotsForDay.map((slot, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <Select value={slot.start} onValueChange={v => updateSlotStart(day, idx, v)}>
                                  <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                                <span className="text-xs text-muted-foreground">→</span>
                                <span className="text-xs font-medium bg-muted px-2 py-1 rounded">{slot.end}</span>
                                {slotsForDay.length > 1 && (
                                  <button onClick={() => removeSlot(day, idx)} className="text-muted-foreground hover:text-destructive">
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                            {slotsForDay.length < 4 && (
                              <button onClick={() => addSlotToDay(day)} className="text-xs text-primary hover:underline flex items-center gap-1">
                                <Plus className="h-3 w-3" /> {isAr ? "إضافة فترة" : "Add slot"}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <p className="text-xs text-muted-foreground text-center mb-4">
                  {daySlots.length} {isAr ? "فترة محددة" : "slots set"} — {isAr ? "الحد الأدنى 3" : "minimum 3"}
                </p>

                <Button onClick={handleStep2Save} disabled={saving} className="w-full gradient-brand text-primary-foreground rounded-full">
                  {saving ? <><Loader2 className="me-2 h-4 w-4 animate-spin" />{isAr ? "جاري الحفظ..." : "Saving..."}</> : <>{isAr ? "متابعة" : "Continue"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" /></>}
                </Button>
              </motion.div>
            )}

            {/* STEP 3: Ready */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="h-10 w-10 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">{isAr ? "ملفك كخبير جاهز!" : "Your Expert Profile is Live!"}</h2>
                <p className="text-muted-foreground mb-8">{isAr ? "يمكن للعملاء الآن حجز استشارات معك" : "Clients can now book consultations with you"}</p>

                {/* Preview card */}
                <div className="bg-card border border-border rounded-2xl p-6 max-w-sm mx-auto mb-8 text-start">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                      {avatarUrl ? (
                        <img loading="lazy" src={avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-primary">{expert.initials}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{isAr ? expert.name_ar : expert.name}</p>
                      <p className="text-xs text-muted-foreground">{isAr ? expert.role_ar : expert.role}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <Badge variant="secondary" className="text-xs">{isAr ? expert.track_ar : expert.track}</Badge>
                    {specializations.slice(0, 3).map(s => (
                      <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{bio}</p>
                  <p className="text-sm font-semibold mt-2 text-primary">${expert.session_rate_usd} / {expert.session_duration_minutes}min</p>
                </div>

                <div className="space-y-3 max-w-sm mx-auto">
                  <Button onClick={() => navigate("/consulting/portal")} className="w-full rounded-full gradient-brand text-primary-foreground">
                    {isAr ? "ادخل بوابة الاستشارات" : "Go to Consulting Portal"}
                    <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
                  </Button>
                  <Button onClick={() => navigate(`/consulting/${expert.slug}`)} variant="outline" className="w-full rounded-full">
                    <ExternalLink className="me-2 h-4 w-4" />
                    {isAr ? "عرض ملفي العام" : "View My Public Profile"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </>
  );
}
