import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Lock, User, Building2, ArrowRight, ArrowLeft, Loader2, Eye, EyeOff,
  Check, RefreshCw, ExternalLink, Clock, Globe, MapPin, Phone, Linkedin,
  Upload, X,
} from "lucide-react";
import { toast } from "sonner";

/* ─── constants ─── */
const INDUSTRIES = [
  { en: "Technology", ar: "تكنولوجيا" }, { en: "Healthcare", ar: "رعاية صحية" },
  { en: "Finance", ar: "مالية" }, { en: "Education", ar: "تعليم" },
  { en: "E-commerce", ar: "تجارة إلكترونية" }, { en: "Real Estate", ar: "عقارات" },
  { en: "Manufacturing", ar: "تصنيع" }, { en: "Media", ar: "إعلام" },
  { en: "Consulting", ar: "استشارات" }, { en: "Logistics", ar: "لوجستيات" },
  { en: "Retail", ar: "تجزئة" }, { en: "Other", ar: "أخرى" },
];

const EMPLOYEE_COUNTS = ["1-10", "11-50", "51-200", "201-500", "500+"];

const HEAR_ABOUT = [
  { en: "Google search", ar: "بحث جوجل" }, { en: "Social media", ar: "وسائل التواصل" },
  { en: "Referral", ar: "إحالة" }, { en: "Event", ar: "فعالية" }, { en: "Other", ar: "أخرى" },
];

const LOOKING_FOR = [
  { key: "hire", en: "Hire freelancers", ar: "توظيف مستقلين" },
  { key: "services", en: "Request development services", ar: "طلب خدمات تطوير" },
  { key: "augmentation", en: "Team augmentation", ar: "تعزيز الفريق" },
  { key: "consulting", en: "Technical consulting", ar: "استشارات تقنية" },
  { key: "training", en: "Training for my team", ar: "تدريب لفريقي" },
];

const RESEND_COOLDOWN = 60;

/* ─── password strength ─── */
function getStrength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const strengthLabels = { en: ["", "Weak", "Fair", "Good", "Strong"], ar: ["", "ضعيفة", "مقبولة", "جيدة", "قوية"] };
const strengthColors = ["bg-muted", "bg-destructive", "bg-amber-500", "bg-yellow-500", "bg-emerald-500"];

function detectMailProvider(email: string) {
  const d = email.split("@")[1]?.toLowerCase();
  if (!d) return null;
  if (d.includes("gmail")) return { label: "Gmail", url: "https://mail.google.com" };
  if (d.includes("outlook") || d.includes("hotmail") || d.includes("live")) return { label: "Outlook", url: "https://outlook.live.com" };
  if (d.includes("yahoo")) return { label: "Yahoo Mail", url: "https://mail.yahoo.com" };
  return null;
}

/* ─── component ─── */
interface Props { onBack: () => void; redirect?: string }

export default function CompanySignupForm({ onBack }: Props) {
  const { signUp } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const isAr = lang === "ar";

  const [step, setStep] = useState(1);

  // step 1
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // step 2
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [employeeCount, setEmployeeCount] = useState("");
  const [foundedYear, setFoundedYear] = useState("");
  const [location, setLocation] = useState("");

  // step 3
  const [phone, setPhone] = useState("");
  const [roleAtCompany, setRoleAtCompany] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [hearAbout, setHearAbout] = useState("");
  const [lookingFor, setLookingFor] = useState<string[]>([]);

  // state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const strength = getStrength(password);

  const step1Valid =
    contactName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    password.length >= 8 &&
    confirmPw === password;

  const step2Valid =
    companyName.trim().length >= 2 &&
    industry !== "" &&
    description.trim().length >= 20;

  /* logo upload */
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error(isAr ? "الحد الأقصى 5MB" : "Max 5MB"); return; }
    setLogoUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `company-logos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(fileName, file);
    if (upErr) { toast.error("Upload failed"); setLogoUploading(false); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
    setLogoUrl(data.publicUrl);
    setLogoUploading(false);
  };

  /* create account */
  const handleCreateAccount = useCallback(async () => {
    setLoading(true);
    setError("");

    const { error: signUpError } = await signUp(email, password, {
      full_name: contactName.trim(),
      account_type: "company",
    });

    if (signUpError) {
      setError(signUpError.message);
      setStep(1);
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("user_roles").insert({ user_id: user.id, role: "company" as any });
      await supabase.from("company_profiles").insert({
        user_id: user.id,
        company_name: companyName.trim(),
        industry,
        description: description.trim(),
        website: website || null,
        logo_url: logoUrl || null,
        employee_count: employeeCount || null,
        founded_year: foundedYear ? parseInt(foundedYear) : null,
        location: location || null,
        contact_email: email,
        contact_phone: phone || null,
      });

      // update profile with phone
      await supabase
        .from("profiles")
        .update({
          phone: phone || null,
          account_status: "pending_approval",
          status_changed_at: new Date().toISOString(),
        } as any)
        .eq("user_id", user.id);

      supabase.functions.invoke("send-email", {
        body: {
          to: email,
          template: "welcome_company",
          data: {
            name: contactName.trim(),
            company_name: companyName.trim(),
            lang,
          },
        },
      }).catch(() => {});
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      // auto-confirmed — still go to step 4 for approval wait
    }

    setStep(4);
    setLoading(false);
  }, [email, password, contactName, companyName, industry, description, website, logoUrl, employeeCount, foundedYear, location, phone, lang, signUp]);

  /* resend & check verification */
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    await supabase.auth.resend({ type: "signup", email });
    setResendCooldown(RESEND_COOLDOWN);
    toast.success(isAr ? "تم إعادة إرسال رابط التحقق" : "Verification link resent");
  };

  const handleCheckVerification = async () => {
    setLoading(true);
    await supabase.auth.refreshSession();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email_confirmed_at) {
      setEmailVerified(true);
      toast.success(isAr ? "تم التحقق من البريد!" : "Email verified!");
    } else {
      toast.error(isAr ? "لم يتم التحقق بعد" : "Not verified yet — check your inbox");
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const mailProvider = detectMailProvider(email);

  const stepLabels = isAr
    ? ["الحساب", "معلومات الشركة", "جهة الاتصال", "التحقق والمراجعة"]
    : ["Account", "Company Info", "Contact Person", "Verify & Wait"];

  const toggleLookingFor = (key: string) => {
    setLookingFor((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {step < 4 && (
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="icon-flip-rtl h-4 w-4" />
          {isAr ? "العودة لاختيار نوع الحساب" : "Back to role selection"}
        </button>
      )}

      {/* step indicator */}
      <div className="flex items-center justify-center gap-0 mb-8">
        {[1, 2, 3, 4].map((s, i) => (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                step > s ? "bg-emerald-500 text-white" :
                step === s ? "gradient-brand text-primary-foreground" :
                "bg-muted text-muted-foreground"
              }`}>
                {step > s ? <Check className="h-3.5 w-3.5" /> : s}
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap max-w-[60px] text-center leading-tight">{stepLabels[i]}</span>
            </div>
            {i < 3 && <div className={`w-8 h-0.5 mx-0.5 mt-[-14px] transition-colors ${step > s ? "bg-emerald-500" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ─── STEP 1 ─── */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}
            className="bg-card rounded-2xl border border-border p-8 shadow-xl">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center mx-auto mb-3">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-bold">{isAr ? "إنشاء حساب شركة" : "Create Company Account"}</h2>
              <p className="text-sm text-muted-foreground mt-1">{isAr ? "بيانات الشخص المسؤول" : "Contact person credentials"}</p>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder={isAr ? "اسمك الكامل" : "Your full name"} value={contactName}
                  onChange={(e) => setContactName(e.target.value)} className="ps-10" />
              </div>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="email" placeholder="you@company.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} className="ps-10" />
              </div>
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
                <Link to="/login?redirect=/enterprise/portal" className="text-primary hover:underline font-medium">{isAr ? "سجل دخول" : "Sign In"}</Link>
            </p>
          </motion.div>
        )}

        {/* ─── STEP 2 ─── */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}
            className="bg-card rounded-2xl border border-border p-8 shadow-xl">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">{isAr ? "معلومات الشركة" : "Company Information"}</h2>
              <p className="text-sm text-muted-foreground mt-1">{isAr ? "أخبرنا عن شركتك" : "Tell us about your company"}</p>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <Building2 className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder={isAr ? "اسم الشركة" : "Company name"} value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)} className="ps-10" />
              </div>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger><SelectValue placeholder={isAr ? "المجال" : "Industry"} /></SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((ind) => (
                    <SelectItem key={ind.en} value={ind.en}>{isAr ? ind.ar : ind.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div>
                <Textarea placeholder={isAr ? "ماذا تفعل شركتك؟ (20 حرف على الأقل)" : "What does your company do? (min 20 chars)"}
                  value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={3} />
                <p className="text-xs text-muted-foreground text-end mt-1">{description.length}/500</p>
              </div>
              <div className="relative">
                <Globe className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="https://company.com" value={website}
                  onChange={(e) => setWebsite(e.target.value)} className="ps-10" />
              </div>

              {/* logo upload */}
              <div>
                <label className="text-sm font-medium mb-2 block">{isAr ? "شعار الشركة" : "Company Logo"}</label>
                {logoUrl ? (
                  <div className="flex items-center gap-3">
                    <img loading="lazy" src={logoUrl} alt="Logo" className="w-12 h-12 rounded-lg object-cover border border-border" />
                    <button type="button" onClick={() => setLogoUrl("")} className="text-sm text-destructive hover:underline flex items-center gap-1">
                      <X className="h-3.5 w-3.5" /> {isAr ? "إزالة" : "Remove"}
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 px-4 py-3 border border-dashed border-border rounded-xl cursor-pointer hover:border-primary/30 transition-colors">
                    {logoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
                    <span className="text-sm text-muted-foreground">{logoUploading ? (isAr ? "جاري الرفع..." : "Uploading...") : (isAr ? "رفع شعار (اختياري)" : "Upload logo (optional)")}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={logoUploading} />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Select value={employeeCount} onValueChange={setEmployeeCount}>
                  <SelectTrigger><SelectValue placeholder={isAr ? "عدد الموظفين" : "Employees"} /></SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_COUNTS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="number" placeholder={isAr ? "سنة التأسيس" : "Founded year"} value={foundedYear}
                  onChange={(e) => setFoundedYear(e.target.value)} min={1900} max={new Date().getFullYear()} />
              </div>
              <div className="relative">
                <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder={isAr ? "القاهرة، مصر" : "Cairo, Egypt"} value={location}
                  onChange={(e) => setLocation(e.target.value)} className="ps-10" />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="rounded-full">
                  <ArrowLeft className="icon-flip-rtl me-1 h-4 w-4" /> {isAr ? "رجوع" : "Back"}
                </Button>
                <Button onClick={() => setStep(3)} disabled={!step2Valid} className="flex-1 gradient-brand text-primary-foreground rounded-full">
                  {isAr ? "متابعة" : "Continue"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── STEP 3 ─── */}
        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}
            className="bg-card rounded-2xl border border-border p-8 shadow-xl">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">{isAr ? "بيانات جهة الاتصال" : "Contact Person Details"}</h2>
              <p className="text-sm text-muted-foreground mt-1">{isAr ? "ساعدنا في التواصل معك" : "Help us get in touch"}</p>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <Phone className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="+20 xxx xxx xxxx" value={phone}
                  onChange={(e) => setPhone(e.target.value)} className="ps-10" />
              </div>
              <Input placeholder={isAr ? "منصبك في الشركة (CEO / CTO)" : "Your role at the company (CEO / CTO)"}
                value={roleAtCompany} onChange={(e) => setRoleAtCompany(e.target.value)} />
              <div className="relative">
                <Linkedin className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder={isAr ? "رابط LinkedIn (اختياري)" : "LinkedIn profile (optional)"}
                  value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className="ps-10" />
              </div>
              <Select value={hearAbout} onValueChange={setHearAbout}>
                <SelectTrigger><SelectValue placeholder={isAr ? "كيف سمعت عنا؟" : "How did you hear about us?"} /></SelectTrigger>
                <SelectContent>
                  {HEAR_ABOUT.map((h) => <SelectItem key={h.en} value={h.en}>{isAr ? h.ar : h.en}</SelectItem>)}
                </SelectContent>
              </Select>

              <div>
                <label className="text-sm font-medium mb-2 block">{isAr ? "ما الذي تبحث عنه؟" : "What are you looking for?"}</label>
                <div className="space-y-2">
                  {LOOKING_FOR.map((item) => (
                    <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={lookingFor.includes(item.key)} onCheckedChange={() => toggleLookingFor(item.key)} />
                      <span className="text-sm">{isAr ? item.ar : item.en}</span>
                    </label>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="rounded-full">
                  <ArrowLeft className="icon-flip-rtl me-1 h-4 w-4" /> {isAr ? "رجوع" : "Back"}
                </Button>
                <Button onClick={handleCreateAccount} disabled={loading} className="flex-1 gradient-brand text-primary-foreground rounded-full">
                  {loading ? <><Loader2 className="me-2 h-4 w-4 animate-spin" />{isAr ? "جاري الإنشاء..." : "Creating..."}</> :
                    <>{isAr ? "إنشاء حساب" : "Create Account"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" /></>}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── STEP 4 ─── */}
        {step === 4 && (
          <motion.div key="s4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}
            className="bg-card rounded-2xl border border-border p-8 shadow-xl">

            {/* email verification */}
            {!emailVerified && (
              <div className="text-center mb-8 pb-6 border-b border-border">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                  className="w-14 h-14 rounded-full gradient-brand flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-7 w-7 text-primary-foreground" />
                </motion.div>
                <h3 className="text-lg font-bold mb-1">{isAr ? "تحقق من بريدك" : "Verify Your Email"}</h3>
                <p className="text-sm text-muted-foreground mb-1">{isAr ? "أرسلنا رابط التحقق إلى" : "We sent a verification link to"}</p>
                <p className="font-semibold text-sm mb-4">{email}</p>
                <div className="flex flex-col gap-2">
                  <Button onClick={handleCheckVerification} disabled={loading} size="sm" className="rounded-full gradient-brand text-primary-foreground">
                    {loading ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
                    {isAr ? "تم التحقق — متابعة" : "I've verified my email"}
                  </Button>
                  <Button onClick={handleResend} variant="outline" size="sm" disabled={resendCooldown > 0} className="rounded-full">
                    <RefreshCw className="me-2 h-3.5 w-3.5" />
                    {resendCooldown > 0 ? `${resendCooldown}s` : (isAr ? "إعادة إرسال" : "Resend")}
                  </Button>
                  {mailProvider && (
                    <a href={mailProvider.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 text-xs text-primary hover:underline">
                      <ExternalLink className="h-3 w-3" /> {isAr ? `فتح ${mailProvider.label}` : `Open ${mailProvider.label}`}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* approval pending */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-7 w-7 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-xl font-bold mb-2">{isAr ? "حسابك قيد المراجعة" : "Account Under Review"}</h2>
              <p className="text-sm text-muted-foreground mb-6">
                {isAr ? "يتم مراجعة حساب شركتك من قبل فريقنا. يستغرق ذلك عادة 24-48 ساعة." : "Your company account is being reviewed by our team. This usually takes 24-48 hours."}
              </p>

              {/* timeline */}
              <div className="text-start space-y-3 mb-6">
                <p className="text-sm font-medium">{isAr ? "ما سيحدث بعد ذلك:" : "What happens next:"}</p>
                {[
                  { done: true, label: isAr ? "تم إنشاء الحساب" : "Account created" },
                  { done: emailVerified, label: isAr ? "تم التحقق من البريد" : "Email verified" },
                  { done: false, label: isAr ? "مراجعة المسؤول لشركتك" : "Admin reviews your company" },
                  { done: false, label: isAr ? "تفعيل الحساب" : "Account activated" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      item.done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                    }`}>
                      {item.done ? <Check className="h-3.5 w-3.5" /> : <span className="text-xs">{i === 1 && !emailVerified ? "⏳" : "○"}</span>}
                    </div>
                    <span className={`text-sm ${item.done ? "text-foreground" : "text-muted-foreground"}`}>{item.label}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground mb-4">
                {isAr ? `سنرسل لك إشعاراً على ${email} عند الموافقة.` : `We'll notify you at ${email} once approved.`}
              </p>

              <div className="flex flex-col gap-2">
                <Link to="/contact">
                  <Button variant="outline" size="sm" className="w-full rounded-full">{isAr ? "تواصل مع الدعم" : "Contact Support"}</Button>
                </Link>
                <button type="button" onClick={handleSignOut} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {isAr ? "تسجيل الخروج" : "Sign out"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
