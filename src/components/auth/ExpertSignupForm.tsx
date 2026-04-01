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
  Mail, Lock, User, ArrowLeft, ArrowRight, Loader2, Shield,
  Check, RefreshCw, ExternalLink, X, Link2, Globe,
} from "lucide-react";
import { toast } from "sonner";

/* ── Specialization suggestions ── */
const specializationSuggestions = [
  { id: "software-architecture", en: "Software Architecture", ar: "هندسة البرمجيات" },
  { id: "cloud-infra", en: "Cloud & Infrastructure", ar: "السحابة والبنية التحتية" },
  { id: "data-ai", en: "Data Science & AI", ar: "علوم البيانات والذكاء الاصطناعي" },
  { id: "cybersecurity", en: "Cybersecurity", ar: "الأمن السيبراني" },
  { id: "product-strategy", en: "Product Strategy", ar: "استراتيجية المنتج" },
  { id: "digital-transform", en: "Digital Transformation", ar: "التحول الرقمي" },
  { id: "agile-devops", en: "Agile & DevOps", ar: "أجايل و DevOps" },
  { id: "business-analysis", en: "Business Analysis", ar: "تحليل الأعمال" },
];

const industrySuggestions = [
  { id: "fintech", en: "Fintech", ar: "التقنية المالية" },
  { id: "healthcare", en: "Healthcare", ar: "الرعاية الصحية" },
  { id: "ecommerce", en: "E-Commerce", ar: "التجارة الإلكترونية" },
  { id: "education", en: "Education", ar: "التعليم" },
  { id: "government", en: "Government", ar: "القطاع الحكومي" },
  { id: "logistics", en: "Logistics", ar: "اللوجستيات" },
];

const experienceOptions = [
  { id: "3-5", en: "3–5 years", ar: "٣-٥ سنوات" },
  { id: "5-10", en: "5–10 years", ar: "٥-١٠ سنوات" },
  { id: "10-15", en: "10–15 years", ar: "١٠-١٥ سنة" },
  { id: "15+", en: "15+ years", ar: "١٥+ سنة" },
];

const languageOptions = [
  { id: "en", en: "English", ar: "الإنجليزية" },
  { id: "ar", en: "Arabic", ar: "العربية" },
  { id: "fr", en: "French", ar: "الفرنسية" },
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
  { en: "Expert Profile", ar: "ملف الخبير" },
  { en: "Consulting Setup", ar: "إعداد الاستشارات" },
  { en: "Professional Links", ar: "الروابط المهنية" },
  { en: "Verify", ar: "التحقق" },
  { en: "Submitted", ar: "تم الإرسال" },
];

interface Props {
  onBack: () => void;
  redirect?: string;
}

export default function ExpertSignupForm({ onBack, redirect: _redirect = "" }: Props) {
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

  // Step 2 — Expert Profile
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [customSpec, setCustomSpec] = useState("");
  const [experience, setExperience] = useState("");
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);

  // Step 3 — Consulting Setup
  const [consultTopics, setConsultTopics] = useState("");
  const [sessionTypes, setSessionTypes] = useState("");
  const [selectedLangs, setSelectedLangs] = useState<string[]>(["en"]);
  const [availabilityNote, setAvailabilityNote] = useState("");

  // Step 4 — Professional Links
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  // Step 5 — Verification
  const [resendCooldown, setResendCooldown] = useState(0);
  const [, setVerified] = useState(false);

  const strength = getStrength(password);
  const step1Valid = fullName.trim().length >= 2 && email.includes("@") && password.length >= 8 && password === confirmPw;
  const step2Valid = title.trim().length >= 2 && bio.trim().length >= 20 && selectedSpecs.length > 0 && experience;
  const step3Valid = consultTopics.trim().length >= 5;

  const toggleSpec = (id: string) => {
    setSelectedSpecs((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 6 ? [...prev, id] : prev
    );
  };

  const addCustomSpec = useCallback(() => {
    const tag = customSpec.trim();
    if (tag && !selectedSpecs.includes(tag) && selectedSpecs.length < 6) {
      setSelectedSpecs((prev) => [...prev, tag]);
      setCustomSpec("");
    }
  }, [customSpec, selectedSpecs]);

  const removeSpec = (tag: string) => setSelectedSpecs((prev) => prev.filter((t) => t !== tag));

  const toggleIndustry = (id: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const toggleLang = (id: string) => {
    setSelectedLangs((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  /* ── Create account + submit application ── */
  const createAccountAndApply = async () => {
    setLoading(true);

    const { error: signUpErr } = await signUp(email, password, {
      full_name: fullName.trim(),
      account_type: "expert",
    });
    if (signUpErr) {
      toast.error(signUpErr.message);
      setStep(1);
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Store application in profiles metadata
      await supabase.from("profiles").update({
        bio: bio.trim().slice(0, 1000),
        headline: title.trim().slice(0, 120),
        linkedin_url: linkedinUrl.trim().slice(0, 500) || null,
        portfolio_url: portfolioUrl.trim().slice(0, 500) || null,
        website: websiteUrl.trim().slice(0, 500) || null,
        account_status: "pending_approval",
      }).eq("user_id", user.id);

      // Notify admins
      supabase.from("profiles").select("user_id").eq("account_type", "admin")
        .then(({ data: admins }) => {
          for (const admin of admins || []) {
            supabase.rpc("create_notification", {
              _user_id: admin.user_id,
              _type: "expert_application",
              _title_en: `New expert application from ${fullName}`,
              _title_ar: `طلب خبير جديد من ${fullName}`,
              _link: "/admin/experts",
            });
          }
        });

      // Welcome email
      supabase.functions.invoke("send-email", {
        body: { to: email, template: "welcome_expert", data: { name: fullName, lang } },
      }).catch(() => {});
    }

    setStep(5);
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
    const { data: { session } } = await supabase.auth.refreshSession();
    if (session?.user?.email_confirmed_at) {
      setVerified(true);
      setStep(6);
    } else {
      toast.error(isAr ? "لم يتم التحقق بعد" : "Not verified yet — check your inbox");
    }
  };

  const mailProvider = detectMailProvider(email);

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Back button */}
      <button
        onClick={step === 1 ? onBack : () => setStep((s) => s - 1)}
        disabled={step >= 5}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 disabled:opacity-0 disabled:pointer-events-none"
      >
        <ArrowLeft className="icon-flip-rtl h-4 w-4" />
        {step === 1 ? (isAr ? "العودة لخيارات الاستشارات" : "Back to Consulting options") : (isAr ? "السابق" : "Back")}
      </button>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-1 mb-8">
        {STEPS.map((s, i) => {
          const stepNum = i + 1;
          return (
            <div key={i} className="flex items-center gap-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium transition-colors ${
                  stepNum < step
                    ? "bg-emerald-500 text-white"
                    : stepNum === step
                    ? "gradient-brand text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {stepNum < step ? <Check className="h-3 w-3" /> : stepNum}
              </div>
              <span className="text-[9px] text-muted-foreground hidden lg:inline whitespace-nowrap">
                {isAr ? s.ar : s.en}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`w-4 h-0.5 ${stepNum < step ? "bg-emerald-500" : "bg-muted"}`} />
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
                <Shield className="h-7 w-7 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">{isAr ? "طلب الانضمام كخبير" : "Expert Application"}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isAr ? "ابدأ بإنشاء حسابك كخبير استشاري" : "Start by creating your expert account"}
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
                <Link to="/login?redirect=/consulting/portal" className="text-primary hover:underline font-medium">
                  {isAr ? "سجل دخول" : "Sign In"}
                </Link>
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Expert Profile ── */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-card rounded-2xl border border-border p-8 shadow-xl">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-foreground">{isAr ? "ملفك كخبير" : "Expert Profile"}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isAr ? "أخبرنا عن خبرتك المهنية" : "Tell us about your professional expertise"}
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-foreground">{isAr ? "المسمى المهني *" : "Professional Title *"}</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120}
                  placeholder={isAr ? "مثال: مستشار أمن سيبراني أول" : "e.g. Senior Cybersecurity Consultant"} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-foreground">{isAr ? "نبذة عنك *" : "Bio *"}</Label>
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={1000} rows={4}
                  placeholder={isAr ? "صِف خبرتك المهنية وما يميزك كمستشار" : "Describe your professional background and what makes you a great consultant"} />
                <p className="text-xs text-muted-foreground text-end">{bio.length}/1000</p>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">{isAr ? "مجالات التخصص *" : "Specialization Areas *"}</Label>
                <p className="text-xs text-muted-foreground">{isAr ? "اختر حتى ٦ مجالات أو أضف مجالك" : "Pick up to 6 areas or add your own"}</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedSpecs.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
                      {specializationSuggestions.find((e) => e.id === tag)
                        ? isAr ? specializationSuggestions.find((e) => e.id === tag)!.ar : specializationSuggestions.find((e) => e.id === tag)!.en
                        : tag}
                      <button type="button" onClick={() => removeSpec(tag)}><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {specializationSuggestions.filter((e) => !selectedSpecs.includes(e.id)).map((item) => (
                    <button key={item.id} type="button" onClick={() => toggleSpec(item.id)}
                      className="px-2.5 py-1 rounded-full text-xs border border-border hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all">
                      {isAr ? item.ar : item.en}
                    </button>
                  ))}
                </div>
                <Input value={customSpec} onChange={(e) => setCustomSpec(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomSpec(); } }}
                  placeholder={isAr ? "أو اكتب تخصصك واضغط Enter" : "Or type your area and press Enter"} maxLength={50} className="mt-2" />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">{isAr ? "سنوات الخبرة *" : "Years of Experience *"}</Label>
                <div className="flex flex-wrap gap-2">
                  {experienceOptions.map((opt) => (
                    <button key={opt.id} type="button" onClick={() => setExperience(opt.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        experience === opt.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                      }`}>
                      {isAr ? opt.ar : opt.en}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">{isAr ? "القطاعات المخدومة" : "Industries Served"}</Label>
                <p className="text-xs text-muted-foreground">{isAr ? "اختياري — اختر حتى ٤" : "Optional — pick up to 4"}</p>
                <div className="flex flex-wrap gap-1.5">
                  {industrySuggestions.map((item) => (
                    <button key={item.id} type="button" onClick={() => toggleIndustry(item.id)}
                      className={`px-2.5 py-1 rounded-full text-xs border transition-all ${
                        selectedIndustries.includes(item.id) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                      }`}>
                      {isAr ? item.ar : item.en}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={() => setStep(3)} disabled={!step2Valid} className="w-full gradient-brand text-primary-foreground rounded-full">
                {isAr ? "متابعة" : "Continue"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Consulting Setup ── */}
        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-card rounded-2xl border border-border p-8 shadow-xl">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-foreground">{isAr ? "إعداد الاستشارات" : "Consulting Setup"}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isAr ? "حدد نوع الاستشارات التي تقدمها" : "Define the consulting services you offer"}
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-foreground">{isAr ? "مواضيع الاستشارة *" : "Consultation Topics *"}</Label>
                <Textarea value={consultTopics} onChange={(e) => setConsultTopics(e.target.value)} maxLength={500} rows={3}
                  placeholder={isAr ? "ما المواضيع التي يمكنك تقديم استشارات فيها؟" : "What topics can you consult on? e.g. System design, Cloud migration, Security audits..."} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-foreground">{isAr ? "أنواع الجلسات" : "Session Types"}</Label>
                <Input value={sessionTypes} onChange={(e) => setSessionTypes(e.target.value)} maxLength={200}
                  placeholder={isAr ? "مثال: جلسة فردية، مراجعة كود، ورشة عمل" : "e.g. 1-on-1, Code Review, Workshop, Strategy Session"} />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">{isAr ? "لغات الاستشارة" : "Consulting Languages"}</Label>
                <div className="flex flex-wrap gap-2">
                  {languageOptions.map((opt) => (
                    <button key={opt.id} type="button" onClick={() => toggleLang(opt.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        selectedLangs.includes(opt.id) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                      }`}>
                      {isAr ? opt.ar : opt.en}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-foreground">{isAr ? "ملاحظات حول التوفر" : "Availability Notes"}</Label>
                <Input value={availabilityNote} onChange={(e) => setAvailabilityNote(e.target.value)} maxLength={200}
                  placeholder={isAr ? "اختياري — مثال: متاح أيام الأحد-الخميس مساءً" : "Optional — e.g. Available Sun–Thu evenings, GMT+3"} />
              </div>

              <Button onClick={() => setStep(4)} disabled={!step3Valid} className="w-full gradient-brand text-primary-foreground rounded-full">
                {isAr ? "متابعة" : "Continue"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Step 4: Professional Links ── */}
        {step === 4 && (
          <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-card rounded-2xl border border-border p-8 shadow-xl">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-foreground">{isAr ? "الروابط المهنية" : "Professional Links"}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isAr ? "ساعدنا في التحقق من خبرتك المهنية" : "Help us verify your professional background"}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-foreground">LinkedIn</Label>
                <div className="relative">
                  <Link2 className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className="ps-10"
                    placeholder="https://linkedin.com/in/..." maxLength={500} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-foreground">{isAr ? "الموقع الشخصي / المعرض" : "Website / Portfolio"}</Label>
                <div className="relative">
                  <Globe className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} className="ps-10"
                    placeholder="https://yourportfolio.com" maxLength={500} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-foreground">{isAr ? "رابط آخر (CV، GitHub...)" : "Other Link (CV, GitHub...)"}</Label>
                <div className="relative">
                  <ExternalLink className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="ps-10"
                    placeholder="https://..." maxLength={500} />
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">{isAr ? "ماذا بعد؟" : "What happens next?"}</p>
                <ul className="space-y-1 text-xs">
                  <li>• {isAr ? "سنراجع طلبك خلال ٢-٣ أيام عمل" : "We'll review your application within 2–3 business days"}</li>
                  <li>• {isAr ? "ستتلقى إشعاراً بالقبول أو طلب معلومات إضافية" : "You'll receive a notification of approval or a request for more info"}</li>
                  <li>• {isAr ? "بمجرد القبول، ستُضاف كخبير مع إعداد جلساتك" : "Once approved, you'll be set up as an expert with your session configuration"}</li>
                </ul>
              </div>

              <Button onClick={createAccountAndApply} disabled={loading} className="w-full gradient-brand text-primary-foreground rounded-full">
                {loading ? <><Loader2 className="me-2 h-4 w-4 animate-spin" />{isAr ? "جاري الإرسال..." : "Submitting..."}</> : <>{isAr ? "إرسال الطلب" : "Submit Application"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" /></>}
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Step 5: Verification ── */}
        {step === 5 && (
          <motion.div key="s5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-card rounded-2xl border border-border p-8 shadow-xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">{isAr ? "تحقق من بريدك الإلكتروني" : "Verify Your Email"}</h2>
            <p className="text-sm text-muted-foreground mb-1">{isAr ? "أرسلنا رابط تحقق إلى:" : "We sent a verification link to:"}</p>
            <p className="text-sm font-medium text-foreground mb-6">{email}</p>

            <div className="space-y-3">
              {mailProvider && (
                <a href={mailProvider.url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full rounded-full">
                    <ExternalLink className="me-2 h-4 w-4" />
                    {isAr ? `افتح ${mailProvider.label}` : `Open ${mailProvider.label}`}
                  </Button>
                </a>
              )}
              <Button onClick={checkVerification} variant="outline" className="w-full rounded-full">
                <Check className="me-2 h-4 w-4" />
                {isAr ? "لقد قمت بالتحقق" : "I've Verified My Email"}
              </Button>
              <Button onClick={handleResend} variant="ghost" disabled={resendCooldown > 0} className="w-full text-sm">
                <RefreshCw className="me-2 h-3.5 w-3.5" />
                {resendCooldown > 0 ? `${resendCooldown}s` : isAr ? "إعادة إرسال الرابط" : "Resend Link"}
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Step 6: Application Submitted ── */}
        {step === 6 && (
          <motion.div key="s6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-6">
              <Check className="h-10 w-10 text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{isAr ? "تم إرسال طلبك!" : "Application Submitted!"}</h2>
            <p className="text-muted-foreground mb-2">{isAr ? "شكراً لاهتمامك بالانضمام كخبير استشاري" : "Thank you for your interest in joining as a consulting expert"}</p>
            <p className="text-sm text-muted-foreground mb-8">
              {isAr ? "سنراجع طلبك وسنتواصل معك قريباً. يمكنك متابعة حالة طلبك من ملفك الشخصي." : "We'll review your application and reach out soon. You can track your application status from your profile."}
            </p>

            <div className="bg-card border border-border rounded-2xl p-6 max-w-sm mx-auto mb-8 text-start">
              <p className="text-sm font-medium text-foreground mb-3">{isAr ? "ملخص الطلب" : "Application Summary"}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isAr ? "الاسم" : "Name"}</span>
                  <span className="font-medium text-foreground">{fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isAr ? "المسمى" : "Title"}</span>
                  <span className="font-medium text-foreground">{title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isAr ? "الحالة" : "Status"}</span>
                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                    {isAr ? "قيد المراجعة" : "Pending Review"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3 max-w-sm mx-auto">
              <Button onClick={() => navigate("/")} className="w-full rounded-full gradient-brand text-primary-foreground">
                {isAr ? "العودة للصفحة الرئيسية" : "Go to Homepage"}
                <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
              </Button>
              <Button onClick={() => navigate("/profile")} variant="outline" className="w-full rounded-full">
                {isAr ? "عرض ملفي الشخصي" : "View My Profile"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
