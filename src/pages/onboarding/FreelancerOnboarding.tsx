import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  User, Sparkles, ArrowRight, ArrowLeft, CheckCircle2,
  Loader2, Plus, X, FolderOpen, Search, MessageSquare,
} from "lucide-react";
import { useMediaUpload } from "@/hooks/useMediaUpload";

const trackOptions = [
  { en: "Web Development", ar: "تطوير الويب" },
  { en: "Mobile Development", ar: "تطوير التطبيقات" },
  { en: "UI/UX Design", ar: "تصميم UI/UX" },
  { en: "Data Science", ar: "علوم البيانات" },
  { en: "DevOps", ar: "DevOps" },
  { en: "Project Management", ar: "إدارة المشاريع" },
  { en: "Other", ar: "أخرى" },
];

const slideVariant = {
  enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
};

export default function FreelancerOnboarding() {
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
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");

  // Step 2
  const [track, setTrack] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");

  const { uploading, upload } = useMediaUpload();

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }
    const meta = user.user_metadata;
    if (meta?.full_name && !fullName) setFullName(meta.full_name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

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

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s) && skills.length < 15) {
      setSkills(prev => [...prev, s]);
      setSkillInput("");
    }
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: fullName.trim(),
      phone, location, bio,
      track, skills,
      hourly_rate: hourlyRate || null,
      portfolio_url: portfolioUrl || null,
      linkedin_url: linkedinUrl || null,
      github_url: githubUrl || null,
      avatar_url: avatarUrl || null,
    }).eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error(isAr ? "حدث خطأ" : "Failed to save profile");
      return;
    }
    goTo(2);
  };

  if (authLoading) {
    return <section className="min-h-[80vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></section>;
  }

  const linkPlaceholder = track === "UI/UX Design"
    ? "https://dribbble.com/..."
    : track === "Web Development" || track === "Mobile Development"
    ? "https://github.com/..."
    : "https://yourportfolio.com";

  const stepLabels = isAr
    ? ["الأساسيات", "المهني", "تم"]
    : ["Basics", "Professional", "Done"];

  return (
    <>
      <SEO title={isAr ? "إعداد الملف الشخصي" : "Profile Setup"} />
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
              <motion.div key="basics" custom={direction} variants={slideVariant} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="bg-card rounded-2xl border p-8 shadow-xl">
                <h2 className="text-2xl font-bold mb-2">{isAr ? "مرحباً! لنبدأ" : "Welcome! Let's get started"}</h2>
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
                    <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder={isAr ? "اسمك الكامل" : "Your full name"} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">{isAr ? "الهاتف" : "Phone"}</label>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+20 xxx xxx xxxx" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">{isAr ? "الموقع" : "Location"}</label>
                    <Input value={location} onChange={e => setLocation(e.target.value)} placeholder={isAr ? "القاهرة، مصر" : "Cairo, Egypt"} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">{isAr ? "نبذة عنك" : "Short Bio"}</label>
                    <Textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder={isAr ? "أخبرنا عن نفسك..." : "Tell us about yourself..."} />
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <Button onClick={() => goTo(1)} disabled={!fullName.trim()} className="rounded-full">
                    {isAr ? "التالي" : "Next"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="professional" custom={direction} variants={slideVariant} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="bg-card rounded-2xl border p-8 shadow-xl">
                <h2 className="text-2xl font-bold mb-2">{isAr ? "معلوماتك المهنية" : "Professional Info"}</h2>
                <p className="text-muted-foreground mb-6">{isAr ? "ساعدنا نعرف خبراتك" : "Help us understand your expertise"}</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">{isAr ? "التخصص" : "Track"}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {trackOptions.map(t => (
                        <button key={t.en} type="button" onClick={() => setTrack(t.en)}
                          className={`px-3 py-2 rounded-lg border text-sm text-start transition-all ${
                            track === t.en ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-muted-foreground/30 text-muted-foreground"
                          }`}>
                          {isAr ? t.ar : t.en}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">{isAr ? "المهارات" : "Skills"}</label>
                    <div className="flex gap-2 mb-2">
                      <Input value={skillInput} onChange={e => setSkillInput(e.target.value)} placeholder={isAr ? "أضف مهارة" : "Add a skill"} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} />
                      <Button type="button" variant="outline" onClick={addSkill} size="icon"><Plus className="h-4 w-4" /></Button>
                    </div>
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {skills.map(s => (
                          <Badge key={s} variant="secondary" className="gap-1">{s}<X className="h-3 w-3 cursor-pointer" onClick={() => setSkills(skills.filter(x => x !== s))} /></Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">{isAr ? "سعر الساعة" : "Hourly Rate"}</label>
                    <div className="relative">
                      <span className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                      <Input value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} type="number" min="0" className="ps-7" placeholder="25" />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      {isAr ? "رابط معرض الأعمال" : "Portfolio Link"}
                      <span className="text-xs text-muted-foreground ms-2">{isAr ? "(موصى به)" : "(recommended)"}</span>
                    </label>
                    <Input value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)} placeholder={linkPlaceholder} />
                    <p className="text-xs text-muted-foreground mt-1">{isAr ? "إضافة رابط يزيد ظهورك للشركات" : "Adding a link increases your visibility to companies"}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">LinkedIn</label>
                      <Input value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/..." />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">GitHub</label>
                      <Input value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="https://github.com/..." />
                    </div>
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
                  <Sparkles className="h-8 w-8 text-primary-foreground" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-3">{isAr ? "مرحباً بك في DevWady!" : "Welcome to DevWady!"}</h2>
                <p className="text-muted-foreground mb-6">{isAr ? "تم إعداد ملفك الشخصي بنجاح" : "Your profile is all set up"}</p>

                <div className="grid gap-3 text-start mb-6">
                  <button onClick={() => navigate("/profile/portfolio")} className="flex items-center gap-3 p-3 rounded-xl border hover:border-primary/30 hover:bg-primary/5 transition-all text-sm">
                    <FolderOpen className="h-5 w-5 text-primary shrink-0" />
                    <span>{isAr ? "أكمل معرض أعمالك" : "Complete your portfolio"}</span>
                    <ArrowRight className="icon-flip-rtl h-4 w-4 ms-auto text-muted-foreground" />
                  </button>
                  <button onClick={() => navigate("/hiring")} className="flex items-center gap-3 p-3 rounded-xl border hover:border-primary/30 hover:bg-primary/5 transition-all text-sm">
                    <Search className="h-5 w-5 text-primary shrink-0" />
                    <span>{isAr ? "تصفح الوظائف المتاحة" : "Browse available jobs"}</span>
                    <ArrowRight className="icon-flip-rtl h-4 w-4 ms-auto text-muted-foreground" />
                  </button>
                  <button onClick={() => navigate("/consulting")} className="flex items-center gap-3 p-3 rounded-xl border hover:border-primary/30 hover:bg-primary/5 transition-all text-sm">
                    <MessageSquare className="h-5 w-5 text-primary shrink-0" />
                    <span>{isAr ? "احجز استشارة" : "Book a consultation"}</span>
                    <ArrowRight className="icon-flip-rtl h-4 w-4 ms-auto text-muted-foreground" />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => navigate("/talent/portal/freelancer")} className="gradient-brand text-primary-foreground rounded-full">
                    {isAr ? "ادخل بوابة المواهب" : "Go to Talent Portal"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
                  </Button>
                  <Button onClick={() => navigate("/profile")} variant="outline" className="rounded-full">
                    {isAr ? "عرض ملفي" : "View Profile"}
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
