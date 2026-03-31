import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Lock, User, ArrowLeft, ArrowRight, Loader2, GraduationCap,
  Globe, Smartphone, Palette, Brain, Cloud, Target, Shield, TrendingUp,
  Check, RefreshCw, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

const interests = [
  { id: "web", icon: Globe, en: "Web Development", ar: "تطوير الويب" },
  { id: "mobile", icon: Smartphone, en: "Mobile Development", ar: "تطوير الموبايل" },
  { id: "design", icon: Palette, en: "UI/UX Design", ar: "تصميم UI/UX" },
  { id: "data", icon: Brain, en: "Data Science & AI", ar: "علوم البيانات والذكاء الاصطناعي" },
  { id: "devops", icon: Cloud, en: "DevOps & Cloud", ar: "DevOps والسحابة" },
  { id: "pm", icon: Target, en: "Project Management", ar: "إدارة المشاريع" },
  { id: "security", icon: Shield, en: "Cybersecurity", ar: "الأمن السيبراني" },
  { id: "business", icon: TrendingUp, en: "Business & Entrepreneurship", ar: "الأعمال وريادة الأعمال" },
];

const levels = [
  { id: "beginner", en: "Complete Beginner", ar: "مبتدئ تماماً" },
  { id: "some", en: "Some Experience", ar: "بعض الخبرة" },
  { id: "intermediate", en: "Intermediate", ar: "متوسط" },
  { id: "advanced", en: "Advanced", ar: "متقدم" },
];

const timeOptions = [
  { id: "1-3", en: "1-3 hours", ar: "١-٣ ساعات" },
  { id: "3-5", en: "3-5 hours", ar: "٣-٥ ساعات" },
  { id: "5-10", en: "5-10 hours", ar: "٥-١٠ ساعات" },
  { id: "10+", en: "10+ hours", ar: "١٠+ ساعات" },
];

function getStrength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

const strengthColors = ["bg-destructive", "bg-orange-500", "bg-yellow-500", "bg-emerald-500"];
const strengthLabels = { en: ["Weak", "Fair", "Good", "Strong"], ar: ["ضعيفة", "مقبولة", "جيدة", "قوية"] };

function detectMailProvider(email: string) {
  const d = email.split("@")[1]?.toLowerCase();
  if (d?.includes("gmail")) return { label: "Gmail", url: "https://mail.google.com" };
  if (d?.includes("outlook") || d?.includes("hotmail") || d?.includes("live")) return { label: "Outlook", url: "https://outlook.live.com" };
  if (d?.includes("yahoo")) return { label: "Yahoo", url: "https://mail.yahoo.com" };
  return null;
}

interface Props { onBack: () => void; redirect?: string; }

export default function StudentSignupForm({ onBack, redirect: _redirect = "" }: Props) {
  const { signUp } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const isAr = lang === "ar";

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  // Step 2
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [level, setLevel] = useState("");
  const [weeklyTime, setWeeklyTime] = useState("");

  // Step 3
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verified, setVerified] = useState(false);

  const strength = getStrength(password);
  const step1Valid = fullName.trim().length >= 2 && email.includes("@") && password.length >= 8 && password === confirmPw;

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const createAccount = async (withGoals: boolean) => {
    setLoading(true);
    const { error: err } = await signUp(email, password, { full_name: fullName.trim(), account_type: "student" });
    if (err) {
      toast.error(err.message);
      setStep(1);
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Legacy user_roles write is kept only as a temporary compatibility bridge.
      await supabase.from("user_roles").insert({ user_id: user.id, role: "student" });
      if (withGoals && (selectedInterests.length || level || weeklyTime)) {
        const updates: Record<string, any> = {};
        if (selectedInterests.length) updates.skills = selectedInterests;
        if (selectedInterests.length === 1) updates.track = selectedInterests[0];
        await supabase.from("profiles").update(updates).eq("user_id", user.id);
      }
      supabase.functions.invoke("send-email", {
        body: { to: email, template: "welcome_student", data: { name: fullName, lang } },
      }).catch(() => {});
    }

    setStep(3);
    setLoading(false);
  };

  const handleResend = async () => {
    await supabase.auth.resend({ type: "signup", email });
    toast.success(isAr ? "تم إعادة إرسال الرابط" : "Verification link resent");
    setResendCooldown(60);
    const iv = setInterval(() => setResendCooldown(p => { if (p <= 1) { clearInterval(iv); return 0; } return p - 1; }), 1000);
  };

  const checkVerification = async () => {
    const { data: { session } } = await supabase.auth.refreshSession();
    if (session?.user?.email_confirmed_at) {
      setVerified(true);
    } else {
      toast.error(isAr ? "لم يتم التحقق بعد" : "Not verified yet — check your inbox");
    }
  };

  const mailProvider = detectMailProvider(email);

  return (
    <div className="w-full max-w-md mx-auto">
      <button onClick={step === 1 ? onBack : () => setStep(s => s - 1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="icon-flip-rtl h-4 w-4" />
        {step === 1 ? (isAr ? "العودة لاختيار نوع الحساب" : "Back to account type selection") : (isAr ? "السابق" : "Back")}
      </button>

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
              {s === 1 ? (isAr ? "الحساب" : "Account") : s === 2 ? (isAr ? "أهدافك" : "Goals") : (isAr ? "التحقق" : "Verify")}
            </span>
            {s < 3 && <div className={`w-8 h-0.5 ${s < step ? "bg-emerald-500" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-card rounded-2xl border border-border p-8 shadow-xl">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="h-7 w-7 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold">{isAr ? "إنشاء حساب طالب" : "Create Student Account"}</h1>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder={isAr ? "الاسم الكامل" : "Full Name"} value={fullName} onChange={e => setFullName(e.target.value)} className="ps-10" />
              </div>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="email" placeholder={isAr ? "البريد الإلكتروني" : "Email"} value={email} onChange={e => setEmail(e.target.value)} className="ps-10" />
              </div>
              <div>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="password" placeholder={isAr ? "كلمة المرور" : "Password"} value={password} onChange={e => setPassword(e.target.value)} className="ps-10" />
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < strength ? strengthColors[strength - 1] : "bg-muted"}`} />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{strength > 0 ? (isAr ? strengthLabels.ar : strengthLabels.en)[strength - 1] : ""}</p>
                  </div>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="password" placeholder={isAr ? "تأكيد كلمة المرور" : "Confirm Password"} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className="ps-10" />
              </div>
              {confirmPw && password !== confirmPw && (
                <p className="text-sm text-destructive">{isAr ? "كلمات المرور غير متطابقة" : "Passwords don't match"}</p>
              )}
              <Button onClick={() => setStep(2)} disabled={!step1Valid} className="w-full gradient-brand text-primary-foreground rounded-full">
                {isAr ? "متابعة" : "Continue"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {isAr ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
                <Link to="/login?redirect=/academy/portal" className="text-primary hover:underline font-medium">
                  {isAr ? "سجل دخول" : "Sign In"}
                </Link>
              </p>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-card rounded-2xl border border-border p-8 shadow-xl">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">{isAr ? "ماذا تريد أن تتعلم؟" : "What do you want to learn?"}</h2>
              <p className="text-sm text-muted-foreground mt-1">{isAr ? "اختر حتى ٣ مجالات" : "Pick up to 3 interests"}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-6">
              {interests.map(item => {
                const Icon = item.icon;
                const selected = selectedInterests.includes(item.id);
                return (
                  <button key={item.id} type="button" onClick={() => toggleInterest(item.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-start text-sm transition-all ${
                      selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                    }`}>
                    <Icon className={`h-4 w-4 shrink-0 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={selected ? "font-medium" : ""}>{isAr ? item.ar : item.en}</span>
                  </button>
                );
              })}
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium mb-2">{isAr ? "مستواك الحالي" : "Current level"}</p>
              <div className="flex flex-wrap gap-2">
                {levels.map(l => (
                  <button key={l.id} type="button" onClick={() => setLevel(l.id)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                      level === l.id ? "border-primary bg-primary/10 font-medium" : "border-border hover:border-primary/30"
                    }`}>
                    {isAr ? l.ar : l.en}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm font-medium mb-2">{isAr ? "كم وقت أسبوعياً؟" : "Weekly time commitment"}</p>
              <div className="flex flex-wrap gap-2">
                {timeOptions.map(t => (
                  <button key={t.id} type="button" onClick={() => setWeeklyTime(t.id)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                      weeklyTime === t.id ? "border-primary bg-primary/10 font-medium" : "border-border hover:border-primary/30"
                    }`}>
                    {isAr ? t.ar : t.en}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Button onClick={() => createAccount(true)} disabled={loading} className="w-full gradient-brand text-primary-foreground rounded-full">
                {loading ? <><Loader2 className="me-2 h-4 w-4 animate-spin" />{isAr ? "جاري الإنشاء..." : "Creating..."}</> : (isAr ? "إنشاء حساب" : "Create Account")}
              </Button>
              <button type="button" onClick={() => createAccount(false)} disabled={loading} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
                {isAr ? "تخطي الآن" : "Skip for now"}
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && !verified && (
          <motion.div key="s3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-16 h-16 rounded-full gradient-brand flex items-center justify-center mx-auto mb-6">
              <Mail className="h-8 w-8 text-primary-foreground" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">{isAr ? "تحقق من بريدك" : "Verify Your Email"}</h2>
            <p className="text-muted-foreground mb-1">{isAr ? "أرسلنا رابط التحقق إلى" : "We sent a verification link to"}</p>
            <p className="font-semibold mb-6">{email}</p>

            <div className="space-y-3">
              <Button onClick={checkVerification} className="w-full rounded-full gradient-brand text-primary-foreground">
                {isAr ? "لقد تحققت — تابع" : "I've verified — continue"}
              </Button>
              <Button variant="outline" onClick={handleResend} disabled={resendCooldown > 0} className="w-full rounded-full">
                <RefreshCw className="me-2 h-4 w-4" />
                {resendCooldown > 0 ? `${resendCooldown}s` : (isAr ? "إعادة إرسال" : "Resend email")}
              </Button>
              {mailProvider && (
                <a href={mailProvider.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                  <ExternalLink className="h-3.5 w-3.5" />
                  {isAr ? `فتح ${mailProvider.label}` : `Open ${mailProvider.label}`}
                </a>
              )}
            </div>
            <button onClick={() => { setStep(1); setPassword(""); setConfirmPw(""); }} className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
              {isAr ? "بريد خاطئ؟ ابدأ من جديد" : "Wrong email? Start over"}
            </button>
          </motion.div>
        )}

        {step === 3 && verified && (
          <motion.div key="s3v" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-6">
              <Check className="h-8 w-8 text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">{isAr ? "مرحباً! ابدأ التعلم" : "Welcome! Start Learning"}</h2>
            <p className="text-muted-foreground mb-6">{isAr ? "حسابك جاهز. استكشف الدورات المتاحة." : "Your account is ready. Explore available courses."}</p>
            <div className="space-y-3">
              <Button onClick={() => navigate("/academy/courses")} className="w-full rounded-full gradient-brand text-primary-foreground">
                <GraduationCap className="me-2 h-4 w-4" />
                {isAr ? "تصفح الدورات" : "Browse All Courses"}
              </Button>
              <Button variant="outline" onClick={() => navigate("/profile/edit")} className="w-full rounded-full">
                {isAr ? "أكمل ملفك الشخصي" : "Complete Your Profile"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
