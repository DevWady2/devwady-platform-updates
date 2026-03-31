import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Lock, User, ArrowRight, ArrowLeft, Loader2, Eye, EyeOff,
  MapPin, DollarSign, Check, RefreshCw, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

/* ─── constants ─── */
const TRACKS = [
  { value: "web", en: "Web Development", ar: "تطوير الويب" },
  { value: "mobile", en: "Mobile Development", ar: "تطوير الموبايل" },
  { value: "uiux", en: "UI/UX Design", ar: "تصميم UI/UX" },
  { value: "data", en: "Data Science", ar: "علم البيانات" },
  { value: "devops", en: "DevOps", ar: "DevOps" },
  { value: "pm", en: "Project Management", ar: "إدارة المشاريع" },
  { value: "other", en: "Other", ar: "أخرى" },
];

const SKILL_SUGGESTIONS: Record<string, string[]> = {
  web: ["React", "TypeScript", "Node.js", "Next.js", "Vue.js", "HTML/CSS", "Tailwind CSS", "PostgreSQL"],
  mobile: ["React Native", "Flutter", "Swift", "Kotlin", "iOS", "Android", "Firebase"],
  uiux: ["Figma", "Adobe XD", "Sketch", "Prototyping", "User Research", "Wireframing"],
  data: ["Python", "TensorFlow", "SQL", "Pandas", "Machine Learning", "Power BI"],
  devops: ["Docker", "Kubernetes", "AWS", "CI/CD", "Terraform", "Linux", "GitHub Actions"],
  pm: ["Agile", "Scrum", "Jira", "Stakeholder Management", "Risk Management"],
  other: ["Communication", "Problem Solving", "Leadership"],
};

const RESEND_COOLDOWN = 60;

/* ─── password strength ─── */
function getStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0-4
}
const strengthLabels = { en: ["", "Weak", "Fair", "Good", "Strong"], ar: ["", "ضعيفة", "مقبولة", "جيدة", "قوية"] };
const strengthColors = ["bg-muted", "bg-destructive", "bg-amber-500", "bg-yellow-500", "bg-emerald-500"];

/* ─── helpers ─── */
function detectMailProvider(email: string) {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return null;
  if (domain.includes("gmail")) return { label: "Gmail", url: "https://mail.google.com" };
  if (domain.includes("outlook") || domain.includes("hotmail") || domain.includes("live"))
    return { label: "Outlook", url: "https://outlook.live.com" };
  if (domain.includes("yahoo")) return { label: "Yahoo Mail", url: "https://mail.yahoo.com" };
  return null;
}

/* ─── component ─── */
interface Props { onBack: () => void; redirect?: string }

export default function FreelancerSignupForm({ onBack }: Props) {
  const { signUp } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const isAr = lang === "ar";

  const [step, setStep] = useState(1);

  // step 1
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // step 2
  const [track, setTrack] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [location, setLocation] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");

  // state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  /* cooldown timer */
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  /* step 1 validation */
  const step1Valid =
    fullName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    password.length >= 8 &&
    confirmPw === password;

  const strength = getStrength(password);

  /* signup handler */
  const handleCreateAccount = useCallback(async (skipProfile: boolean) => {
    setLoading(true);
    setError("");

    const { error: signUpError } = await signUp(email, password, {
      full_name: fullName.trim(),
      account_type: "freelancer",
    });

    if (signUpError) {
      setError(signUpError.message);
      setStep(1);
      setLoading(false);
      return;
    }

    // Transitional legacy-role bridge — keep syncing user_roles until destructive cleanup
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("user_roles").insert({ user_id: user.id, role: "individual" as any });

      if (!skipProfile && (track || skills.length || location || hourlyRate)) {
        await supabase.from("profiles").update({
          track: track || null,
          skills: skills.length ? skills : null,
          location: location || null,
          hourly_rate: hourlyRate || null,
        }).eq("user_id", user.id);
      }

      // role-specific welcome email (fire-and-forget)
      supabase.functions.invoke("send-email", {
        body: {
          to: email,
          template: "welcome_freelancer",
          data: { name: fullName.trim(), lang },
        },
      }).catch(() => {});
    }

    // check if auto-confirmed
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate("/post-login");
      return;
    }

    setStep(3);
    setLoading(false);
  }, [email, password, fullName, track, skills, location, hourlyRate, lang, navigate, signUp]);

  /* resend verification */
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    await supabase.auth.resend({ type: "signup", email });
    setResendCooldown(RESEND_COOLDOWN);
    toast.success(isAr ? "تم إعادة إرسال رابط التحقق" : "Verification link resent");
  };

  /* check verification */
  const handleCheckVerification = async () => {
    setLoading(true);
    const { error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      toast.error(isAr ? "لم يتم التحقق بعد — تحقق من بريدك" : "Not verified yet — check your inbox");
      setLoading(false);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email_confirmed_at) {
      navigate("/post-login");
    } else {
      toast.error(isAr ? "لم يتم التحقق بعد — تحقق من بريدك" : "Not verified yet — check your inbox");
    }
    setLoading(false);
  };

  /* skill input */
  const addSkill = (s: string) => {
    const trimmed = s.trim();
    if (trimmed && skills.length < 3 && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setSkillInput("");
    setShowSuggestions(false);
  };

  const suggestions = (SKILL_SUGGESTIONS[track] || SKILL_SUGGESTIONS.other)
    .filter((s) => !skills.includes(s) && s.toLowerCase().includes(skillInput.toLowerCase()));

  const mailProvider = detectMailProvider(email);

  /* step labels */
  const stepLabels = isAr
    ? ["الحساب", "عنك", "تحقق البريد"]
    : ["Account", "About You", "Verify Email"];

  return (
    <div className="w-full max-w-md mx-auto">
      {/* back link */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="icon-flip-rtl h-4 w-4" />
        {isAr ? "العودة لاختيار نوع الحساب" : "Back to account type selection"}
      </button>

      {/* step indicator */}
      <div className="flex items-center justify-center gap-0 mb-8">
        {[1, 2, 3].map((s, i) => (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                step > s ? "bg-emerald-500 text-white" :
                step === s ? "gradient-brand text-primary-foreground" :
                "bg-muted text-muted-foreground"
              }`}>
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">{stepLabels[i]}</span>
            </div>
            {i < 2 && <div className={`w-12 h-0.5 mx-1 mt-[-14px] transition-colors ${step > s ? "bg-emerald-500" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ─── STEP 1 ─── */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}
            className="bg-card rounded-2xl border border-border p-8 shadow-xl">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">{isAr ? "إنشاء حساب مستقل" : "Create Freelancer Account"}</h2>
              <p className="text-sm text-muted-foreground mt-1">{isAr ? "أدخل بياناتك للبدء" : "Enter your details to get started"}</p>
            </div>
            <div className="space-y-4">
              {/* name */}
              <div className="relative">
                <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder={isAr ? "اسمك الكامل" : "Your full name"} value={fullName}
                  onChange={(e) => setFullName(e.target.value)} className="ps-10" />
              </div>
              {/* email */}
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="email" placeholder="your@email.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} className="ps-10" />
              </div>
              {/* password */}
              <div>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type={showPw ? "text" : "password"} placeholder={isAr ? "كلمة المرور (8+ أحرف)" : "Password (8+ chars)"}
                    value={password} onChange={(e) => setPassword(e.target.value)} className="ps-10 pe-10" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${strength >= i ? strengthColors[strength] : "bg-muted"}`} />
                      ))}
                    </div>
                    <p className={`text-xs mt-1 ${strength <= 1 ? "text-destructive" : strength === 2 ? "text-amber-500" : strength === 3 ? "text-yellow-600" : "text-emerald-500"}`}>
                      {(isAr ? strengthLabels.ar : strengthLabels.en)[strength]}
                    </p>
                  </div>
                )}
              </div>
              {/* confirm */}
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type={showConfirmPw ? "text" : "password"} placeholder={isAr ? "تأكيد كلمة المرور" : "Confirm password"}
                  value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="ps-10 pe-10" />
                <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPw && confirmPw !== password && (
                <p className="text-xs text-destructive">{isAr ? "كلمات المرور غير متطابقة" : "Passwords don't match"}</p>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button onClick={() => setStep(2)} disabled={!step1Valid} className="w-full gradient-brand text-primary-foreground rounded-full">
                {isAr ? "متابعة" : "Continue"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
              </Button>
            </div>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {isAr ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
                <Link to="/login?redirect=/talent/portal/freelancer" className="text-primary hover:underline font-medium">{isAr ? "سجل دخول" : "Sign In"}</Link>
            </p>
          </motion.div>
        )}

        {/* ─── STEP 2 ─── */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}
            className="bg-card rounded-2xl border border-border p-8 shadow-xl">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">{isAr ? "عنك" : "About You"}</h2>
              <p className="text-sm text-muted-foreground mt-1">{isAr ? "ساعد الشركات في العثور عليك" : "Help companies find you"}</p>
            </div>
            <div className="space-y-5">
              {/* track */}
              <div>
                <label className="text-sm font-medium mb-2 block">{isAr ? "المجال المهني" : "Professional Track"}</label>
                <div className="flex flex-wrap gap-2">
                  {TRACKS.map((t) => (
                    <button key={t.value} type="button" onClick={() => setTrack(t.value)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        track === t.value ? "border-primary bg-primary/10 text-primary font-medium" : "border-border bg-background text-muted-foreground hover:border-primary/30"
                      }`}>
                      {isAr ? t.ar : t.en}
                    </button>
                  ))}
                </div>
              </div>
              {/* skills */}
              <div>
                <label className="text-sm font-medium mb-2 block">{isAr ? "أهم 3 مهارات" : "Top 3 Skills"}</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {skills.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-sm">
                      {s}
                      <button type="button" onClick={() => setSkills(skills.filter((x) => x !== s))} className="hover:text-destructive">×</button>
                    </span>
                  ))}
                </div>
                {skills.length < 3 && (
                  <div className="relative">
                    <Input placeholder={isAr ? "اكتب مهارة واضغط Enter" : "Type a skill and press Enter"}
                      value={skillInput}
                      onChange={(e) => { setSkillInput(e.target.value); setShowSuggestions(true); }}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(skillInput); } }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} />
                    {showSuggestions && skillInput && suggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-32 overflow-y-auto">
                        {suggestions.slice(0, 5).map((s) => (
                          <button key={s} type="button" onMouseDown={() => addSkill(s)}
                            className="w-full text-start px-3 py-2 text-sm hover:bg-accent transition-colors">{s}</button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">{isAr ? "إضافة المهارات تساعد الشركات في العثور عليك" : "Adding skills helps companies find you"}</p>
              </div>
              {/* location */}
              <div className="relative">
                <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder={isAr ? "القاهرة، مصر" : "Cairo, Egypt"} value={location}
                  onChange={(e) => setLocation(e.target.value)} className="ps-10" />
              </div>
              {/* hourly rate */}
              <div className="relative">
                <DollarSign className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="25" type="number" value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)} className="ps-10" />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex flex-col gap-2">
                <Button onClick={() => handleCreateAccount(false)} disabled={loading} className="w-full gradient-brand text-primary-foreground rounded-full">
                  {loading ? <><Loader2 className="me-2 h-4 w-4 animate-spin" />{isAr ? "جاري الإنشاء..." : "Creating..."}</> :
                    <>{isAr ? "إنشاء حساب" : "Create Account"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" /></>}
                </Button>
                <button type="button" onClick={() => handleCreateAccount(true)} disabled={loading}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {isAr ? "تخطي الآن" : "Skip for now"}
                </button>
              </div>

              <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="icon-flip-rtl h-3.5 w-3.5" /> {isAr ? "رجوع" : "Back"}
              </button>
            </div>
          </motion.div>
        )}

        {/* ─── STEP 3 ─── */}
        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}
            className="bg-card rounded-2xl border border-border p-8 shadow-xl text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
              className="w-16 h-16 rounded-full gradient-brand flex items-center justify-center mx-auto mb-6">
              <Mail className="h-8 w-8 text-primary-foreground" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">{isAr ? "تحقق من بريدك" : "Verify Your Email"}</h2>
            <p className="text-muted-foreground mb-1">
              {isAr ? "أرسلنا رابط التحقق إلى" : "We sent a verification link to"}
            </p>
            <p className="font-semibold mb-4">{email}</p>
            <p className="text-sm text-muted-foreground mb-6">
              {isAr ? "اضغط على الرابط في بريدك لتفعيل حسابك." : "Click the link in your inbox to activate your account."}
            </p>

            <div className="space-y-3">
              <Button onClick={handleResend} variant="outline" disabled={resendCooldown > 0} className="w-full rounded-full">
                <RefreshCw className={`me-2 h-4 w-4 ${resendCooldown > 0 ? "" : ""}`} />
                {resendCooldown > 0
                  ? `${isAr ? "إعادة الإرسال خلال" : "Resend in"} ${resendCooldown}s`
                  : (isAr ? "إعادة إرسال الرابط" : "Resend Email")}
              </Button>

              {mailProvider && (
                <a href={mailProvider.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-sm text-primary hover:underline">
                  <ExternalLink className="h-3.5 w-3.5" />
                  {isAr ? `فتح ${mailProvider.label}` : `Open ${mailProvider.label}`}
                </a>
              )}

              <Button onClick={handleCheckVerification} disabled={loading} className="w-full gradient-brand text-primary-foreground rounded-full">
                {loading ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
                {isAr ? "تم التحقق — متابعة" : "I've verified — continue"}
              </Button>

              <button type="button" onClick={() => { setStep(1); setError(""); }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {isAr ? "بريد خاطئ؟ ابدأ من جديد" : "Wrong email? Start over"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
