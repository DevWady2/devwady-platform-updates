import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import {
  Building2, Globe, Sparkles, ArrowRight, ArrowLeft, CheckCircle2, Loader2,
  Target, Upload, Clock, Check, Circle, Users, FileText, GraduationCap, Briefcase,
} from "lucide-react";

const industries = [
  "Technology", "Healthcare", "Finance", "Education", "E-commerce",
  "Real Estate", "Manufacturing", "Media", "Consulting", "Logistics", "Retail", "Other",
];
const employeeCounts = ["1-10", "11-50", "51-200", "201-500", "500+"];

type Goal = "hire" | "project" | "training" | "all";

const stepIcons = [Building2, Globe, Target, Sparkles];

export default function CompanyOnboarding() {
  const { user, loading: authLoading, accountStatus } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const isAr = lang === "ar";
  const { upload, uploading } = useMediaUpload();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [foundedYear, setFoundedYear] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [tagline, setTagline] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [otherUrl, setOtherUrl] = useState("");
  const [goal, setGoal] = useState<Goal | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const isPending = accountStatus === "pending_approval";

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }
    (async () => {
      const { data } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setCompanyName(data.company_name || "");
        setDescription(data.description || "");
        setIndustry(data.industry || "");
        setWebsite(data.website || "");
        setLocation(data.location || "");
        setContactEmail(data.contact_email || user.email || "");
        setContactPhone(data.contact_phone || "");
        setEmployeeCount(data.employee_count || "");
        setFoundedYear(data.founded_year?.toString() || "");
        setLogoUrl(data.logo_url || "");
        setTagline(data.tagline || "");
        const sl = (data.social_links as Record<string, string>) || {};
        setLinkedinUrl(sl.linkedin || "");
        setTwitterUrl(sl.twitter || "");
        setOtherUrl(sl.other || "");
      } else {
        setContactEmail(user.email || "");
      }
      setProfileLoaded(true);
    })();
  }, [user, authLoading]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const url = await upload(file, `${user.id}`);
    if (url) setLogoUrl(url);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const socialLinks: Record<string, string> = {};
    if (linkedinUrl.trim()) socialLinks.linkedin = linkedinUrl.trim();
    if (twitterUrl.trim()) socialLinks.twitter = twitterUrl.trim();
    if (otherUrl.trim()) socialLinks.other = otherUrl.trim();

    const payload = {
      company_name: companyName,
      description,
      industry,
      website,
      location,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      employee_count: employeeCount,
      founded_year: foundedYear ? parseInt(foundedYear) : null,
      logo_url: logoUrl || null,
      tagline: tagline || null,
      social_links: socialLinks,
    };

    const { data: existing } = await supabase
      .from("company_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase.from("company_profiles").update(payload).eq("id", existing.id));
    } else {
      ({ error } = await supabase.from("company_profiles").insert({ ...payload, user_id: user.id }));
    }

    setSaving(false);
    if (error) {
      toast.error(isAr ? "حدث خطأ" : "Failed to save");
      return;
    }
    setStep(3);
  };

  if (authLoading || !profileLoaded) {
    return (
      <section className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </section>
    );
  }

  // Pending approval — read-only review mode
  if (isPending) {
    return (
      <>
        <SEO title={isAr ? "حساب قيد المراجعة" : "Account Under Review"} />
        <section className="py-24 min-h-[80vh] flex items-center justify-center">
          <div className="container mx-auto px-4 max-w-lg">
            <div className="bg-card rounded-2xl border border-border p-8 shadow-xl text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-6">
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold mb-3">{isAr ? "حسابك قيد المراجعة" : "Account Under Review"}</h2>
              <p className="text-muted-foreground mb-8">
                {isAr
                  ? "فريقنا يراجع حساب شركتك. عادة ما يستغرق ذلك 24-48 ساعة."
                  : "Our team is reviewing your company account. This usually takes 24-48 hours."}
              </p>

              {/* Timeline */}
              <div className="text-start space-y-4 mb-8">
                {[
                  { done: true, label: isAr ? "تم إنشاء الحساب" : "Account created" },
                  { done: true, label: isAr ? "تم تأكيد البريد الإلكتروني" : "Email verified" },
                  { done: false, label: isAr ? "مراجعة الإدارة" : "Admin reviews your company", active: true },
                  { done: false, label: isAr ? "تفعيل الحساب" : "Account activated" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {item.done ? (
                      <Check className="h-5 w-5 text-emerald-500 shrink-0" />
                    ) : item.active ? (
                      <Loader2 className="h-5 w-5 text-amber-500 animate-spin shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                    <span className={item.done ? "text-foreground" : item.active ? "text-amber-600 font-medium" : "text-muted-foreground"}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Submitted info summary */}
              {companyName && (
                <div className="bg-muted/50 rounded-xl p-4 text-start space-y-2 mb-6">
                  <p className="text-sm font-medium">{isAr ? "المعلومات المقدمة:" : "Submitted information:"}</p>
                  <div className="flex items-center gap-3">
                    {logoUrl ? (
                      <img loading="lazy" src={logoUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {companyName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{companyName}</p>
                      <p className="text-xs text-muted-foreground">{industry} • {location || "—"}</p>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-sm text-muted-foreground mb-4">
                {isAr
                  ? `سنرسل لك بريدًا إلكترونيًا عند الموافقة على حسابك.`
                  : `We'll email you once your account is approved.`}
              </p>
              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={() => navigate("/contact")} className="rounded-full">
                  {isAr ? "تواصل مع الدعم" : "Contact Support"}
                </Button>
                <Button variant="ghost" onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }} className="text-sm">
                  {isAr ? "تسجيل الخروج" : "Sign out"}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  const totalSteps = 4;

  const goalOptions: { key: Goal; icon: typeof Users; label: string; labelAr: string; desc: string; descAr: string }[] = [
    { key: "hire", icon: Users, label: "Hire freelancers for my team", labelAr: "توظيف مستقلين لفريقي", desc: "Browse talent and send hire requests", descAr: "تصفح المواهب وأرسل طلبات التوظيف" },
    { key: "project", icon: FileText, label: "Get a project built by DevWady", labelAr: "بناء مشروع مع DevWady", desc: "Request services and track progress", descAr: "اطلب خدمات وتابع التقدم" },
    { key: "training", icon: GraduationCap, label: "Find training for my team", labelAr: "تدريب فريقي", desc: "Enroll your team in professional courses", descAr: "سجل فريقك في دورات مهنية" },
    { key: "all", icon: Briefcase, label: "All of the above", labelAr: "كل ما سبق", desc: "Explore everything DevWady offers", descAr: "استكشف كل ما تقدمه DevWady" },
  ];

  const getGoalCta = () => {
    switch (goal) {
      case "hire": return { path: "/company/talent", label: isAr ? "تصفح المواهب" : "Browse Talent" };
      case "project": return { path: "/get-started", label: isAr ? "ابدأ الآن" : "Get Started" };
      case "training": return { path: "/academy/courses", label: isAr ? "تصفح الدورات" : "Browse Courses" };
      default: return { path: "/company", label: isAr ? "لوحة التحكم" : "Go to Dashboard" };
    }
  };

  return (
    <>
      <SEO title={t("seo.onboarding.title")} />
      <section className="py-24 min-h-[80vh] flex items-center justify-center">
        <div className="container mx-auto px-4 max-w-lg">
          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-2">
            {stepIcons.map((Icon, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  i <= step ? "gradient-brand text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                {i < totalSteps - 1 && <div className={`w-10 h-0.5 ${i < step ? "bg-primary" : "bg-border"}`} />}
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

          <AnimatePresence mode="wait">
            {/* Step 0: Company Basics */}
            {step === 0 && (
              <motion.div key="basics" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-card rounded-2xl border border-border p-8 shadow-xl">
                <h2 className="text-2xl font-bold mb-2">{isAr ? "أخبرنا عن شركتك" : "Tell us about your company"}</h2>
                <p className="text-muted-foreground mb-6">{isAr ? "الهوية والعلامة التجارية" : "Brand & identity"}</p>
                <div className="space-y-4">
                  {/* Logo upload */}
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">{isAr ? "شعار الشركة" : "Company Logo"}</label>
                    <div className="flex items-center gap-4">
                      {logoUrl ? (
                        <img loading="lazy" src={logoUrl} alt="" className="w-14 h-14 rounded-xl object-cover border border-border" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <label className="cursor-pointer">
                        <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                          <Upload className="h-4 w-4" />
                          {uploading ? (isAr ? "جاري الرفع..." : "Uploading...") : (isAr ? "رفع شعار" : "Upload logo")}
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">{isAr ? "اسم الشركة" : "Company Name"}</label>
                    <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder={isAr ? "اسم شركتك" : "Your company name"} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">{isAr ? "شعار مختصر" : "Tagline"}</label>
                    <Input value={tagline} onChange={e => setTagline(e.target.value.slice(0, 100))} placeholder={isAr ? "شركتك في جملة واحدة" : "Your company in one sentence"} maxLength={100} />
                    <p className="text-xs text-muted-foreground mt-1">{tagline.length}/100</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">{isAr ? "المجال" : "Industry"}</label>
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger><SelectValue placeholder={isAr ? "اختر المجال" : "Select industry"} /></SelectTrigger>
                      <SelectContent>
                        {industries.map(ind => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">{isAr ? "عن الشركة" : "Description"}</label>
                    <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder={isAr ? "وصف مختصر لشركتك..." : "Brief description of your company..."} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">{isAr ? "الموقع" : "Location"}</label>
                    <Input value={location} onChange={e => setLocation(e.target.value)} placeholder={isAr ? "القاهرة، مصر" : "Cairo, Egypt"} />
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <Button onClick={() => setStep(1)} disabled={!companyName.trim()} className="rounded-full">
                    {isAr ? "التالي" : "Next"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 1: Details & Online Presence */}
            {step === 1 && (
              <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-card rounded-2xl border border-border p-8 shadow-xl">
                <h2 className="text-2xl font-bold mb-2">{isAr ? "التفاصيل والتواجد الرقمي" : "Details & Online Presence"}</h2>
                <p className="text-muted-foreground mb-6">{isAr ? "معلومات التواصل والحجم" : "Contact, size & social links"}</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">{isAr ? "الموقع الإلكتروني" : "Website"}</label>
                    <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://example.com" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">{isAr ? "البريد الإلكتروني" : "Contact Email"}</label>
                    <Input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="info@company.com" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">{isAr ? "الهاتف" : "Phone"}</label>
                    <Input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+20 xxx xxx xxxx" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">{isAr ? "حجم الفريق" : "Team Size"}</label>
                      <Select value={employeeCount} onValueChange={setEmployeeCount}>
                        <SelectTrigger><SelectValue placeholder={isAr ? "اختر" : "Select"} /></SelectTrigger>
                        <SelectContent>
                          {employeeCounts.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">{isAr ? "سنة التأسيس" : "Founded Year"}</label>
                      <Input type="number" value={foundedYear} onChange={e => setFoundedYear(e.target.value)} placeholder="2020" min="1900" max={new Date().getFullYear()} />
                    </div>
                  </div>

                  {/* Social links */}
                  <div className="border-t border-border pt-4 mt-2">
                    <p className="text-sm font-medium mb-3">{isAr ? "روابط التواصل الاجتماعي" : "Social Links"}</p>
                    <div className="space-y-3">
                      <Input value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/company/..." />
                      <Input value={twitterUrl} onChange={e => setTwitterUrl(e.target.value)} placeholder="https://twitter.com/..." />
                      <Input value={otherUrl} onChange={e => setOtherUrl(e.target.value)} placeholder={isAr ? "رابط آخر..." : "Other URL..."} />
                    </div>
                  </div>
                </div>
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep(0)} className="rounded-full">
                    <ArrowLeft className="icon-flip-rtl me-2 h-4 w-4" /> {isAr ? "السابق" : "Back"}
                  </Button>
                  <Button onClick={() => setStep(2)} className="rounded-full">
                    {isAr ? "التالي" : "Next"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: What brings you here? */}
            {step === 2 && (
              <motion.div key="goal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-card rounded-2xl border border-border p-8 shadow-xl">
                <h2 className="text-2xl font-bold mb-2">{isAr ? "ماذا تبحث عنه؟" : "What brings you here?"}</h2>
                <p className="text-muted-foreground mb-6">{isAr ? "اختر هدفك الرئيسي" : "Choose your primary goal"}</p>
                <div className="space-y-3">
                  {goalOptions.map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setGoal(opt.key)}
                      className={`w-full flex items-start gap-4 p-4 rounded-xl border transition-all text-start ${
                        goal === opt.key
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/30 hover:bg-muted/50"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        goal === opt.key ? "gradient-brand text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        <opt.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{isAr ? opt.labelAr : opt.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{isAr ? opt.descAr : opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep(1)} className="rounded-full">
                    <ArrowLeft className="icon-flip-rtl me-2 h-4 w-4" /> {isAr ? "السابق" : "Back"}
                  </Button>
                  <Button onClick={handleSave} disabled={saving} className="gradient-brand text-primary-foreground rounded-full">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
                    {isAr ? "إنهاء الإعداد" : "Finish Setup"} <CheckCircle2 className="ms-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Done */}
            {step === 3 && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-2xl border border-border p-8 shadow-xl text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                  className="w-16 h-16 rounded-full gradient-brand flex items-center justify-center mx-auto mb-6"
                >
                  <Sparkles className="h-8 w-8 text-primary-foreground" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-3">{isAr ? "مرحباً بشركتك في DevWady!" : "Welcome to DevWady!"}</h2>
                <p className="text-muted-foreground mb-6">{isAr ? "تم إعداد ملف شركتك بنجاح" : "Your company profile is all set"}</p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => navigate("/enterprise/portal")} className="gradient-brand text-primary-foreground rounded-full">
                    {isAr ? "ادخل بوابة الأعمال" : "Go to Enterprise Portal"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
                  </Button>
                  {goal && goal !== "all" && (
                    <Button onClick={() => navigate(getGoalCta().path)} variant="outline" className="rounded-full">
                      {getGoalCta().label}
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </>
  );
}
