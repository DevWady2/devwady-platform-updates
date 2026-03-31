import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  User, Building2, GraduationCap, Briefcase,
  ArrowRight, ArrowLeft, CheckCircle2, Loader2, Sparkles, Camera,
} from "lucide-react";

type AccountTypeOption = "individual" | "company" | "student" | "expert" | "instructor";

const accountTypeOptions: {
  value: AccountTypeOption;
  icon: typeof User;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  portalPath: string;
  portalLabelEn: string;
  portalLabelAr: string;
}[] = [
  {
    value: "individual",
    icon: Briefcase,
    titleEn: "Freelancer / Individual",
    titleAr: "مستقل / فرد",
    descEn: "Get hired, apply to jobs, and showcase your portfolio",
    descAr: "احصل على توظيف، قدم على الوظائف واعرض أعمالك",
    portalPath: "/talent/portal/freelancer",
    portalLabelEn: "Talent Portal",
    portalLabelAr: "بوابة المواهب",
  },
  {
    value: "company",
    icon: Building2,
    titleEn: "Company",
    titleAr: "شركة",
    descEn: "Post jobs, hire freelancers, and manage projects",
    descAr: "انشر وظائف، وظف مستقلين وأدر مشاريعك",
    portalPath: "/enterprise/portal",
    portalLabelEn: "Enterprise Portal",
    portalLabelAr: "بوابة الأعمال",
  },
  {
    value: "student",
    icon: GraduationCap,
    titleEn: "Student",
    titleAr: "طالب",
    descEn: "Enroll in courses, track progress, and earn certificates",
    descAr: "سجل في الدورات، تابع تقدمك واحصل على شهادات",
    portalPath: "/academy/portal",
    portalLabelEn: "Academy Portal",
    portalLabelAr: "بوابة الأكاديمية",
  },
];

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

export default function Onboarding() {
  const { user, accountType: existingAccountType, loading: authLoading } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const isAr = lang === "ar";

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);

  // Role selection
  const [selectedAccountType, setSelectedAccountType] = useState<AccountTypeOption | null>(null);

  // Profile basics
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [track, setTrack] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const ext = file.name.split(".").pop();
    const path = `avatars/${user.id}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); return; }
    const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
    setAvatarUrl(publicUrl);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }
    const meta = user.user_metadata;
    if (meta?.full_name) setFullName(meta.full_name);

    // Single-account model: always skip account type selection, go straight to profile
    if (existingAccountType) {
      const legacy = existingAccountType === "freelancer" ? "individual" : existingAccountType;
      setSelectedAccountType(legacy as AccountTypeOption);
      setStep(1);
    }
  }, [user, authLoading, existingAccountType]);

  const goTo = (s: number) => {
    setDirection(s > step ? 1 : -1);
    setStep(s);
  };

  const handleAccountTypeSelect = async () => {
    if (!selectedAccountType || !user) return;
    // In single-account model, account type selection during onboarding is informational only
    // The account type was already assigned during registration

    // Company redirects to dedicated company onboarding
    if (selectedAccountType === "company") {
      navigate("/onboarding/company");
      return;
    }

    goTo(1);
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: fullName.trim(),
      phone: phone || null,
      location: location || null,
      bio: bio || null,
      track: track || null,
      avatar_url: avatarUrl || null,
    }).eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error(isAr ? "حدث خطأ" : "Failed to save profile");
      return;
    }
    goTo(2);
  };

  const getPortalInfo = () => {
    const opt = accountTypeOptions.find(r => r.value === selectedAccountType);
    return opt || accountTypeOptions[0];
  };

  const handleGoToPortal = () => {
    const info = getPortalInfo();
    // Redirect to account-type-specific onboarding for more detailed setup
    switch (selectedAccountType) {
      case "individual":
        navigate("/onboarding/freelancer");
        return;
      case "student":
        navigate("/onboarding/student");
        return;
      default:
        navigate(info.portalPath);
    }
  };

  if (authLoading) {
    return (
      <section className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </section>
    );
  }

  const stepLabels = isAr ? ["نوع الحساب", "ملفك الشخصي", "ابدأ"] : ["Account Type", "Your Profile", "Get Started"];
  const totalSteps = stepLabels.length;

  return (
    <>
      <SEO title={isAr ? "إعداد الحساب" : "Account Setup"} />
      <section className="py-16 min-h-[80vh] flex items-center justify-center" dir={isAr ? "rtl" : "ltr"}>
        <div className="container mx-auto px-4 max-w-lg">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-2">
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

          {/* Animated progress bar */}
          <div className="w-full max-w-xs mx-auto mt-3 mb-6">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-1.5">
              {isAr ? `الخطوة ${step + 1} من ${totalSteps}` : `Step ${step + 1} of ${totalSteps}`}
            </p>
          </div>

          <AnimatePresence mode="wait" custom={direction}>
            {/* Step 0: Role Selection */}
            {step === 0 && (
              <motion.div key="role" custom={direction} variants={slideVariant} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="bg-card rounded-2xl border p-8 shadow-xl">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
                    <User className="h-7 w-7 text-primary-foreground" />
                  </div>
                   <h2 className="text-2xl font-bold">{isAr ? "كيف تريد استخدام DevWady؟" : "How do you want to use DevWady?"}</h2>
                   <p className="text-muted-foreground mt-2 text-sm">{isAr ? "اختر نوع حسابك" : "Select your account type"}</p>
                </div>

                <div className="space-y-3">
                  {accountTypeOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = selectedAccountType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSelectedAccountType(opt.value)}
                        className={`w-full flex items-start gap-4 p-4 rounded-xl border text-start transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:border-primary/30 hover:bg-accent/50"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{isAr ? opt.titleAr : opt.titleEn}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{isAr ? opt.descAr : opt.descEn}</p>
                        </div>
                        {isSelected && <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-end mt-6">
                  <Button onClick={handleAccountTypeSelect} disabled={!selectedAccountType || saving} className="rounded-full">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
                    {isAr ? "التالي" : "Next"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 1: Profile Basics */}
            {step === 1 && (
              <motion.div key="profile" custom={direction} variants={slideVariant} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="bg-card rounded-2xl border p-8 shadow-xl">
                <h2 className="text-2xl font-bold mb-2">{isAr ? "أخبرنا عن نفسك" : "Tell us about yourself"}</h2>
                <p className="text-muted-foreground mb-6">{isAr ? "معلوماتك الأساسية" : "Basic profile information"}</p>

                {/* Avatar upload */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/20">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Camera className="h-8 w-8 text-primary/40" />
                      )}
                    </div>
                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  <p className="text-xs text-muted-foreground mt-2">{isAr ? "اضغط لتحميل صورة" : "Click to upload photo"}</p>
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
                  {(selectedAccountType === "individual" || selectedAccountType === "student") && (
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
                  )}
                </div>
                <div className="flex justify-between mt-6">
                  {!existingAccountType && (
                    <Button variant="outline" onClick={() => goTo(0)} className="rounded-full">
                      <ArrowLeft className="icon-flip-rtl me-2 h-4 w-4" /> {isAr ? "السابق" : "Back"}
                    </Button>
                  )}
                  <div className="flex flex-col items-end ms-auto gap-1">
                    <Button onClick={handleFinish} disabled={!fullName.trim() || saving} className="rounded-full">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
                      {isAr ? "إنهاء" : "Finish"} <CheckCircle2 className="ms-2 h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground"
                      onClick={() => goTo(2)}
                    >
                      {isAr ? "تخطى الآن" : "Skip for now"}
                    </Button>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  {isAr ? "يمكنك إكمال ملفك لاحقاً من الإعدادات" : "You can complete your profile later from Settings"}
                </p>
              </motion.div>
            )}

            {/* Step 2: Done */}
            {step === 2 && (
              <motion.div key="done" custom={direction} variants={slideVariant} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="bg-card rounded-2xl border p-8 shadow-xl text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.2 }} className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="h-8 w-8 text-primary-foreground" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-3">{isAr ? "مرحباً بك في DevWady!" : "Welcome to DevWady!"}</h2>
                <p className="text-muted-foreground mb-2">{isAr ? "تم إعداد ملفك الشخصي بنجاح" : "Your profile is all set up"}</p>
                <p className="text-sm text-muted-foreground mb-6">
                  {isAr
                    ? `ستنتقل الآن إلى ${getPortalInfo().portalLabelAr} لإكمال الإعداد التفصيلي.`
                    : `You'll now continue to the ${getPortalInfo().portalLabelEn} for detailed setup.`}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={handleGoToPortal} className="rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground">
                    {isAr ? "أكمل الإعداد" : "Continue Setup"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
                  </Button>
                  <Button onClick={() => navigate(getPortalInfo().portalPath)} variant="outline" className="rounded-full">
                    {isAr ? "تخطي للوحة التحكم" : "Skip to Dashboard"}
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
