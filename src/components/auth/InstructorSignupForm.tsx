import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Lock, User, ArrowLeft, ArrowRight, Loader2, Award,
  Check, RefreshCw, ExternalLink, X, Briefcase, Link2, Clock,
} from "lucide-react";
import { toast } from "sonner";

/* ── Expertise tag suggestions ── */
const expertiseSuggestions = [
  { id: "web", en: "Web Development", ar: "تطوير الويب" },
  { id: "mobile", en: "Mobile Development", ar: "تطوير الموبايل" },
  { id: "design", en: "UI/UX Design", ar: "تصميم UI/UX" },
  { id: "data", en: "Data Science & AI", ar: "علوم البيانات والذكاء الاصطناعي" },
  { id: "devops", en: "DevOps & Cloud", ar: "DevOps والسحابة" },
  { id: "pm", en: "Project Management", ar: "إدارة المشاريع" },
  { id: "security", en: "Cybersecurity", ar: "الأمن السيبراني" },
  { id: "business", en: "Business", ar: "الأعمال" },
];

const experienceOptions = [
  { id: "1-3", en: "1–3 years", ar: "١-٣ سنوات" },
  { id: "3-5", en: "3–5 years", ar: "٣-٥ سنوات" },
  { id: "5-10", en: "5–10 years", ar: "٥-١٠ سنوات" },
  { id: "10+", en: "10+ years", ar: "١٠+ سنوات" },
];

/* ── Password helpers ── */
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

/* ── Step labels ── */
const STEPS = [
  { en: "Account", ar: "الحساب" },
  { en: "Teaching Profile", ar: "ملف التدريس" },
  { en: "Professional Links", ar: "الروابط المهنية" },
  { en: "Verify", ar: "التحقق" },
  { en: "Submitted", ar: "تم الإرسال" },
];

interface Props {
  onBack: () => void;
  redirect?: string;
}

export default function InstructorSignupForm({ onBack, redirect: _redirect = "" }: Props) {
  const { signUp } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const isAr = lang === "ar";

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 — Account
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  // Step 2 — Teaching Profile
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [experience, setExperience] = useState("");
  const [courseProposal, setCourseProposal] = useState("");

  // Step 3 — Professional Links
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [sampleContentUrl, setSampleContentUrl] = useState("");

  // Step 4 — Verification
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verified, setVerified] = useState(false);

  const strength = getStrength(password);
  const step1Valid = fullName.trim().length >= 2 && email.includes("@") && password.length >= 8 && password === confirmPw;
  const step2Valid = headline.trim().length >= 2 && bio.trim().length >= 10 && selectedExpertise.length > 0 && experience;

  const toggleExpertise = (id: string) => {
    setSelectedExpertise((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 5 ? [...prev, id] : prev
    );
  };

  const addCustomTag = useCallback(() => {
    const tag = customTag.trim();
    if (tag && !selectedExpertise.includes(tag) && selectedExpertise.length < 5) {
      setSelectedExpertise((prev) => [...prev, tag]);
      setCustomTag("");
    }
  }, [customTag, selectedExpertise]);

  const removeTag = (tag: string) => {
    setSelectedExpertise((prev) => prev.filter((t) => t !== tag));
  };

  /* ── Create account + submit application ── */
  const createAccountAndApply = async () => {
    setLoading(true);

    // 1. Sign up
    const { error: signUpErr } = await signUp(email, password, {
      full_name: fullName.trim(),
      account_type: "instructor",
    });
    if (signUpErr) {
      toast.error(signUpErr.message);
      setStep(1);
      setLoading(false);
      return;
    }

    // 2. Get user, assign role, submit application
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("user_roles").insert({ user_id: user.id, role: "instructor" });

      // Submit instructor application
      await supabase.from("instructor_applications").insert({
        user_id: user.id,
        full_name: fullName.trim().slice(0, 100),
        email: email.trim().slice(0, 255),
        expertise_areas: selectedExpertise.slice(0, 10),
        bio: bio.trim().slice(0, 1000),
        portfolio_url: portfolioUrl.trim().slice(0, 500) || null,
        linkedin_url: linkedinUrl.trim().slice(0, 500) || null,
        sample_content_url: sampleContentUrl.trim().slice(0, 500) || null,
        course_proposal: courseProposal.trim().slice(0, 2000) || null,
      });

      // Notify admins
      supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .then(({ data: admins }) => {
          for (const admin of admins || []) {
            supabase.rpc("create_notification", {
              _user_id: admin.user_id,
              _type: "instructor_application",
              _title_en: `New instructor application from ${fullName}`,
              _title_ar: `طلب مدرب جديد من ${fullName}`,
              _link: "/admin/training",
            });
          }
        });

      // Welcome email
      supabase.functions
        .invoke("send-email", {
          body: { to: email, template: "welcome_instructor", data: { name: fullName, lang } },
        })
        .catch(() => {});
    }

    setStep(4);
    setLoading(false);
  };

  const handleResend = async () => {
    await supabase.auth.resend({ type: "signup", email });
    toast.success(isAr ? "تم إعادة إرسال الرابط" : "Verification link resent");
    setResendCooldown(60);
    const iv = setInterval(() => {
      setResendCooldown((p) => {
        if (p <= 1) { clearInterval(iv); return 0; }
        return p - 1;
      });
    }, 1000);
  };

  const checkVerification = async () => {
    const {
      data: { session },
    } = await supabase.auth.refreshSession();
    if (session?.user?.email_confirmed_at) {
      setVerified(true);
      setStep(5);
    } else {
      toast.error(isAr ? "لم يتم التحقق بعد" : "Not verified yet — check your inbox");
    }
  };

  const mailProvider = detectMailProvider(email);

  const currentStep = step;
  const totalVisibleSteps = 5;

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Back button */}
      <button
        onClick={step === 1 ? onBack : () => setStep((s) => s - 1)}
        disabled={step >= 4}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 disabled:opacity-0 disabled:pointer-events-none"
      >
        <ArrowLeft className="icon-flip-rtl h-4 w-4" />
        {step === 1 ? (isAr ? "العودة لاختيار نوع الحساب" : "Back to role selection") : (isAr ? "السابق" : "Back")}
      </button>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-1.5 mb-8">
        {STEPS.map((s, i) => {
          const stepNum = i + 1;
          return (
            <div key={i} className="flex items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  stepNum < currentStep
                    ? "bg-emerald-500 text-white"
                    : stepNum === currentStep
                    ? "gradient-brand text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {stepNum < currentStep ? <Check className="h-3.5 w-3.5" /> : stepNum}
              </div>
              <span className="text-[10px] text-muted-foreground hidden md:inline whitespace-nowrap">
                {isAr ? s.ar : s.en}
              </span>
              {i < totalVisibleSteps - 1 && (
                <div className={`w-5 h-0.5 ${stepNum < currentStep ? "bg-emerald-500" : "bg-muted"}`} />
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Step 1: Account ── */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-card rounded-2xl border border-border p-8 shadow-xl">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-4">
                <Award className="h-7 w-7 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">{isAr ? "تسجيل كمدرب" : "Instructor Application"}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isAr ? "ابدأ بإنشاء حسابك كمدرب على الأكاديمية" : "Start by creating your instructor account"}
              </p>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder={isAr ? "الاسم الكامل" : "Full Name"} value={fullName} onChange={(e) => setFullName(e.target.value)} className="ps-10" maxLength={100} />
              </div>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="email" placeholder={isAr ? "البريد الإلكتروني" : "Email"} value={email} onChange={(e) => setEmail(e.target.value)} className="ps-10" maxLength={255} />
              </div>
              <div>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="password" placeholder={isAr ? "كلمة المرور" : "Password"} value={password} onChange={(e) => setPassword(e.target.value)} className="ps-10" />
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < strength ? strengthColors[strength - 1] : "bg-muted"}`} />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {strength > 0 ? (isAr ? strengthLabels.ar : strengthLabels.en)[strength - 1] : ""}
                    </p>
                  </div>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="password" placeholder={isAr ? "تأكيد كلمة المرور" : "Confirm Password"} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="ps-10" />
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

        {/* ── Step 2: Teaching Profile ── */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-card rounded-2xl border border-border p-8 shadow-xl">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-foreground">{isAr ? "ملفك التدريسي" : "Teaching Profile"}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isAr ? "أخبرنا عن خبرتك وتخصصاتك" : "Tell us about your expertise and specializations"}
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-foreground">{isAr ? "العنوان المهني *" : "Professional Headline *"}</Label>
                <Input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  maxLength={120}
                  placeholder={isAr ? "مثال: مهندس برمجيات أول | مدرب React & Node.js" : "e.g. Senior Software Engineer | React & Node.js Instructor"}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-foreground">{isAr ? "نبذة عنك *" : "Bio *"}</Label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={1000}
                  rows={4}
                  placeholder={isAr ? "لماذا أنت مؤهل للتدريس؟ ما خبرتك العملية؟" : "Why are you qualified to teach? What's your professional background?"}
                />
                <p className="text-xs text-muted-foreground text-end">{bio.length}/1000</p>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">{isAr ? "مجالات الخبرة *" : "Expertise Areas *"}</Label>
                <p className="text-xs text-muted-foreground">{isAr ? "اختر حتى ٥ مجالات أو أضف مجالك" : "Pick up to 5 areas or add your own"}</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedExpertise.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
                      {expertiseSuggestions.find((e) => e.id === tag)
                        ? isAr
                          ? expertiseSuggestions.find((e) => e.id === tag)!.ar
                          : expertiseSuggestions.find((e) => e.id === tag)!.en
                        : tag}
                      <button type="button" onClick={() => removeTag(tag)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {expertiseSuggestions
                    .filter((e) => !selectedExpertise.includes(e.id))
                    .map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleExpertise(item.id)}
                        className="px-2.5 py-1 rounded-full text-xs border border-border hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all"
                      >
                        {isAr ? item.ar : item.en}
                      </button>
                    ))}
                </div>
                <Input
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); addCustomTag(); }
                  }}
                  placeholder={isAr ? "أو اكتب مجالك واضغط Enter" : "Or type your area and press Enter"}
                  maxLength={50}
                  className="mt-2"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">{isAr ? "سنوات الخبرة *" : "Years of Experience *"}</Label>
                <div className="flex flex-wrap gap-2">
                  {experienceOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setExperience(opt.id)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                        experience === opt.id
                          ? "border-primary bg-primary/10 font-medium text-foreground"
                          : "border-border hover:border-primary/30 text-muted-foreground"
                      }`}
                    >
                      {isAr ? opt.ar : opt.en}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-foreground">{isAr ? "اقتراح الدورة" : "Course Proposal"}</Label>
                <Textarea
                  value={courseProposal}
                  onChange={(e) => setCourseProposal(e.target.value)}
                  maxLength={2000}
                  rows={3}
                  placeholder={isAr ? "ما الدورة التي تود إنشاؤها؟ وصف مختصر (اختياري)" : "What course would you create? Brief description (optional)"}
                />
                <p className="text-xs text-muted-foreground text-end">{courseProposal.length}/2000</p>
              </div>

              <Button onClick={() => setStep(3)} disabled={!step2Valid} className="w-full gradient-brand text-primary-foreground rounded-full">
                {isAr ? "متابعة" : "Continue"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Professional Links / Proof ── */}
        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-card rounded-2xl border border-border p-8 shadow-xl">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Link2 className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">{isAr ? "الروابط المهنية" : "Professional Links"}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isAr ? "ساعدنا في التعرف على عملك وخبراتك" : "Help us learn about your work and credentials"}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-foreground">LinkedIn</Label>
                <Input
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  maxLength={500}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-foreground">{isAr ? "الموقع / المعرض" : "Portfolio / Website"}</Label>
                <Input
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  maxLength={500}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-foreground">{isAr ? "رابط محتوى تعليمي" : "Sample Teaching Content"}</Label>
                <Input
                  value={sampleContentUrl}
                  onChange={(e) => setSampleContentUrl(e.target.value)}
                  maxLength={500}
                  placeholder={isAr ? "رابط فيديو أو مقال أو دورة سابقة" : "Link to a video, article, or existing course"}
                />
                <p className="text-xs text-muted-foreground">
                  {isAr ? "مشاركة محتوى سابق يعزز طلبك" : "Sharing prior content strengthens your application"}
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <Button onClick={createAccountAndApply} disabled={loading} className="w-full gradient-brand text-primary-foreground rounded-full">
                  {loading ? (
                    <>
                      <Loader2 className="me-2 h-4 w-4 animate-spin" />
                      {isAr ? "جاري الإنشاء..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      {isAr ? "إنشاء الحساب وتقديم الطلب" : "Create Account & Submit Application"}
                      <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  {isAr ? "الروابط اختيارية لكنها تدعم طلبك بشكل كبير" : "Links are optional but strongly support your application"}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Step 4: Verification ── */}
        {step === 4 && !verified && (
          <motion.div key="s4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-16 h-16 rounded-full gradient-brand flex items-center justify-center mx-auto mb-6"
            >
              <Mail className="h-8 w-8 text-primary-foreground" />
            </motion.div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{isAr ? "تحقق من بريدك" : "Verify Your Email"}</h2>
            <p className="text-muted-foreground mb-1">{isAr ? "أرسلنا رابط التحقق إلى" : "We sent a verification link to"}</p>
            <p className="font-semibold text-foreground mb-6">{email}</p>

            <div className="space-y-3">
              <Button onClick={checkVerification} className="w-full rounded-full gradient-brand text-primary-foreground">
                {isAr ? "لقد تحققت — تابع" : "I've verified — continue"}
              </Button>
              <Button variant="outline" onClick={handleResend} disabled={resendCooldown > 0} className="w-full rounded-full">
                <RefreshCw className="me-2 h-4 w-4" />
                {resendCooldown > 0 ? `${resendCooldown}s` : isAr ? "إعادة إرسال" : "Resend email"}
              </Button>
              {mailProvider && (
                <a
                  href={mailProvider.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {isAr ? `فتح ${mailProvider.label}` : `Open ${mailProvider.label}`}
                </a>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Step 5: Application Submitted ── */}
        {(step === 5 || (step === 4 && verified)) && (
          <motion.div key="s5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-6"
            >
              <Clock className="h-8 w-8 text-amber-600" />
            </motion.div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {isAr ? "تم إرسال طلبك!" : "Application Submitted!"}
            </h2>
            <p className="text-muted-foreground mb-2">
              {isAr ? "شكراً لاهتمامك بالتدريس على DevWady Academy." : "Thank you for your interest in teaching on DevWady Academy."}
            </p>
            <div className="bg-muted/50 rounded-xl p-4 mb-6 text-sm text-muted-foreground">
              <p className="flex items-center justify-center gap-2 font-medium text-foreground mb-1">
                <Briefcase className="h-4 w-4" />
                {isAr ? "الخطوات التالية" : "What happens next"}
              </p>
              <ul className="space-y-1 text-start mt-2">
                <li>{isAr ? "• سيراجع فريقنا طلبك خلال ٣-٥ أيام عمل" : "• Our team will review your application within 3–5 business days"}</li>
                <li>{isAr ? "• ستتلقى إشعاراً بالبريد عند اتخاذ القرار" : "• You'll receive an email notification once a decision is made"}</li>
                <li>{isAr ? "• عند القبول، ستتمكن من إنشاء دوراتك التدريبية" : "• Upon approval, you'll be able to create and publish courses"}</li>
              </ul>
            </div>
            <div className="space-y-3">
              <Button onClick={() => navigate("/")} className="w-full rounded-full gradient-brand text-primary-foreground">
                {isAr ? "العودة للصفحة الرئيسية" : "Go to Homepage"}
              </Button>
              <Button variant="outline" onClick={() => navigate("/academy/courses")} className="w-full rounded-full">
                {isAr ? "تصفح الدورات" : "Browse Courses"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
