import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { saveProfileByUserId } from "@/lib/profilePersistence";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  User, GraduationCap, ArrowRight, ArrowLeft,
  CheckCircle2, Loader2, Globe, Smartphone, Palette, Brain,
  Cloud, Target, Shield, TrendingUp, BookOpen,
} from "lucide-react";
import { useMediaUpload } from "@/hooks/useMediaUpload";

const interestOptions = [
  { en: "Web Development", ar: "تطوير الويب", icon: Globe },
  { en: "Mobile Development", ar: "تطوير التطبيقات", icon: Smartphone },
  { en: "UI/UX Design", ar: "تصميم UI/UX", icon: Palette },
  { en: "Data Science & AI", ar: "علوم البيانات والذكاء الاصطناعي", icon: Brain },
  { en: "DevOps & Cloud", ar: "DevOps والسحابة", icon: Cloud },
  { en: "Project Management", ar: "إدارة المشاريع", icon: Target },
  { en: "Cybersecurity", ar: "الأمن السيبراني", icon: Shield },
  { en: "Business & Entrepreneurship", ar: "الأعمال وريادة الأعمال", icon: TrendingUp },
];

const levelOptions = [
  { en: "Complete Beginner", ar: "مبتدئ تماماً" },
  { en: "Some Experience", ar: "خبرة بسيطة" },
  { en: "Intermediate", ar: "متوسط" },
  { en: "Advanced", ar: "متقدم" },
];

const timeOptions = [
  { en: "1-3 hours", ar: "1-3 ساعات" },
  { en: "3-5 hours", ar: "3-5 ساعات" },
  { en: "5-10 hours", ar: "5-10 ساعات" },
  { en: "10+ hours", ar: "10+ ساعات" },
];

const slideVariant = {
  enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
};

export default function StudentOnboarding() {
  const { user, loading: authLoading } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const isAr = lang === "ar";

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [avatarUrl, setAvatarUrl] = useState("");
  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");

  // Step 2
  const [interests, setInterests] = useState<string[]>([]);
  const [level, setLevel] = useState("");
  const [timeCommitment, setTimeCommitment] = useState("");

  const { uploading, upload } = useMediaUpload();

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }
    const meta = user.user_metadata;
    if (meta?.full_name && !fullName) setFullName(meta.full_name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  // Fetch recommended courses based on interests
  const { data: recommendedCourses } = useQuery({
    queryKey: ["student-onboard-courses", interests],
    queryFn: async () => {
      const { data } = await supabase
        .from("training_courses")
        .select("id, title_en, title_ar, slug, price_usd, level_en")
        .eq("status", "published")
        .limit(3);
      return data ?? [];
    },
    enabled: step === 2,
    staleTime: 60_000,
  });

  const goTo = (s: number) => {
    setDirection(s > step ? 1 : -1);
    setStep(s);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await upload(file, user?.id);
    if (url) setAvatarUrl(url);
  };

  const toggleInterest = (name: string) => {
    setInterests(prev =>
      prev.includes(name) ? prev.filter(i => i !== name)
        : prev.length < 3 ? [...prev, name] : prev
    );
  };

  const handleSaveStep1 = async () => {
    if (!user || !fullName.trim()) return;
    setSaving(true);
    await saveProfileByUserId(user.id, {
      full_name: fullName.trim(),
      avatar_url: avatarUrl || null,
      location: location || null,
      phone: phone || null,
      bio: bio || null,
    });
    setSaving(false);
    goTo(1);
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    const updates: Record<string, unknown> = {};
    if (interests.length) updates.skills = interests;
    if (interests.length === 1) updates.track = interests[0];
    if (Object.keys(updates).length) {
      await saveProfileByUserId(user.id, updates);
    }
    setSaving(false);
    goTo(2);
  };

  if (authLoading) {
    return <section className="min-h-[80vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></section>;
  }

  const stepLabels = isAr ? ["عنك", "اهتماماتك", "ابدأ"] : ["About You", "Interests", "Start"];

  return (
    <>
      <SEO title={isAr ? "إعداد حساب الطالب" : "Student Setup"} />
      <section className="py-16 min-h-[80vh] flex items-center justify-center" dir={isAr ? "rtl" : "ltr"}>
        <div className="container mx-auto px-4 max-w-lg">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {stepLabels.map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  step > i ? "bg-primary text-primary-foreground"
                    : step === i ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {step > i ? <CheckCircle2 className="h-3 w-3" /> : <span>{i + 1}</span>}
                  <span className="hidden sm:inline">{label}</span>
                </div>
                {i < stepLabels.length - 1 && <div className={`w-8 h-px ${step > i ? "bg-primary" : "bg-border"}`} />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait" custom={direction}>
            {step === 0 && (
              <motion.div key="about" custom={direction} variants={slideVariant} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="bg-card rounded-2xl border p-8 shadow-xl">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <GraduationCap className="h-6 w-6 text-primary" />
                  {isAr ? "مرحباً أيها الطالب!" : "Welcome, Student!"}
                </h2>
                <p className="text-muted-foreground mb-6">{isAr ? "أخبرنا عن نفسك" : "Tell us about yourself"}</p>

                {/* Avatar */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="relative h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                    {avatarUrl ? <img loading="lazy" src={avatarUrl} alt="" className="h-full w-full object-cover" /> : <User className="h-7 w-7 text-muted-foreground" />}
                  </div>
                  <label className="cursor-pointer">
                    <span className="text-sm text-primary hover:underline">
                      {uploading ? (isAr ? "جاري الرفع..." : "Uploading...") : (isAr ? "أضف صورة" : "Add photo")}
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                  </label>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">{isAr ? "الاسم الكامل" : "Full Name"} *</label>
                    <Input value={fullName} onChange={e => setFullName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">{isAr ? "الموقع" : "Location"}</label>
                    <Input value={location} onChange={e => setLocation(e.target.value)} placeholder={isAr ? "القاهرة، مصر" : "Cairo, Egypt"} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">{isAr ? "الهاتف" : "Phone"}</label>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+20 xxx xxx xxxx" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">{isAr ? "ماذا تريد أن تحقق؟" : "What do you want to achieve?"}</label>
                    <Textarea value={bio} onChange={e => setBio(e.target.value)} rows={2} placeholder={isAr ? "أهدافك التعليمية..." : "Your learning goals..."} />
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <Button onClick={handleSaveStep1} disabled={!fullName.trim() || saving} className="rounded-full">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
                    {isAr ? "التالي" : "Next"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="interests" custom={direction} variants={slideVariant} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="bg-card rounded-2xl border p-8 shadow-xl">
                <h2 className="text-2xl font-bold mb-2">{isAr ? "ماذا تريد أن تتعلم؟" : "What do you want to learn?"}</h2>
                <p className="text-muted-foreground mb-5">{isAr ? "اختر حتى 3 مجالات" : "Pick up to 3 interests"}</p>

                <div className="grid grid-cols-2 gap-2 mb-5">
                  {interestOptions.map(opt => {
                    const Icon = opt.icon;
                    const selected = interests.includes(opt.en);
                    return (
                      <button key={opt.en} type="button" onClick={() => toggleInterest(opt.en)}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-sm text-start transition-all ${
                          selected ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-muted-foreground/30 text-muted-foreground"
                        }`}>
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{isAr ? opt.ar : opt.en}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">{isAr ? "مستواك الحالي" : "Current Level"}</label>
                  <div className="flex flex-wrap gap-2">
                    {levelOptions.map(l => (
                      <button key={l.en} type="button" onClick={() => setLevel(l.en)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          level === l.en ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                        }`}>
                        {isAr ? l.ar : l.en}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-5">
                  <label className="text-sm font-medium mb-2 block">{isAr ? "الوقت المتاح أسبوعياً" : "Weekly time commitment"}</label>
                  <div className="flex flex-wrap gap-2">
                    {timeOptions.map(t => (
                      <button key={t.en} type="button" onClick={() => setTimeCommitment(t.en)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          timeCommitment === t.en ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                        }`}>
                        {isAr ? t.ar : t.en}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => goTo(0)} className="rounded-full">
                    <ArrowLeft className="icon-flip-rtl me-2 h-4 w-4" /> {isAr ? "السابق" : "Back"}
                  </Button>
                  <Button onClick={handleFinish} disabled={saving} className="gradient-brand text-primary-foreground rounded-full">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
                    {isAr ? "إنهاء" : "Finish"} <CheckCircle2 className="ms-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="done" custom={direction} variants={slideVariant} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="bg-card rounded-2xl border p-8 shadow-xl text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.2 }} className="w-16 h-16 rounded-full gradient-brand flex items-center justify-center mx-auto mb-6">
                  <GraduationCap className="h-8 w-8 text-primary-foreground" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-3">{isAr ? "ابدأ التعلم!" : "Start Learning!"}</h2>
                <p className="text-muted-foreground mb-6">{isAr ? "ملفك جاهز. اكتشف الدورات المتاحة." : "Your profile is ready. Discover available courses."}</p>

                {recommendedCourses && recommendedCourses.length > 0 && (
                  <div className="space-y-2 mb-6 text-start">
                    {recommendedCourses.map(c => (
                      <button key={c.id} onClick={() => navigate(`/academy/courses/${c.slug}`)} className="w-full flex items-center gap-3 p-3 rounded-xl border hover:border-primary/30 hover:bg-primary/5 transition-all text-sm">
                        <BookOpen className="h-5 w-5 text-primary shrink-0" />
                        <span className="truncate">{isAr ? (c.title_ar || c.title_en) : c.title_en}</span>
                        <Badge variant="secondary" className="ms-auto shrink-0 text-xs">{c.level_en || "All"}</Badge>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => navigate("/academy/portal")} className="gradient-brand text-primary-foreground rounded-full">
                    {isAr ? "ادخل بوابة الأكاديمية" : "Go to Academy Portal"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
                  </Button>
                  <Button onClick={() => navigate("/academy/courses")} variant="outline" className="rounded-full">
                    {isAr ? "تصفح الدورات" : "Browse Courses"}
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
