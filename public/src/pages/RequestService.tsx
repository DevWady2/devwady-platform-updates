import { useState, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { format } from "date-fns";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, ShieldCheck, Wrench, UsersRound,
  CheckCircle2, Loader2, CalendarIcon, Pencil, X,
  FileText, ArrowLeft, ArrowRight, Upload, Info,
} from "lucide-react";

/* ── Constants ── */
const SERVICE_TYPES = [
  {
    value: "team_augmentation", icon: Users,
    en: "Team Augmentation", ar: "تعزيز الفريق",
    desc_en: "Embed skilled developers in your team", desc_ar: "أضف مطورين ماهرين لفريقك",
    badges_en: ["Monthly billing", "Flexible scale"], badges_ar: ["فواتير شهرية", "مرونة في التوسع"],
  },
  {
    value: "qa_testing", icon: ShieldCheck,
    en: "QA & Testing", ar: "اختبار الجودة",
    desc_en: "Quality assurance for your product", desc_ar: "ضمان جودة منتجك",
    badges_en: ["Per project or ongoing", "Full coverage"], badges_ar: ["لكل مشروع أو مستمر", "تغطية كاملة"],
  },
  {
    value: "it_services", icon: Wrench,
    en: "IT Infrastructure & Support", ar: "البنية التحتية والدعم التقني",
    desc_en: "Cloud, DevOps, servers, and support", desc_ar: "سحابة، DevOps، خوادم ودعم",
    badges_en: ["SLA-based", "Managed service"], badges_ar: ["مبني على SLA", "خدمة مُدارة"],
  },
  {
    value: "dedicated_squad", icon: UsersRound,
    en: "Dedicated Development Squad", ar: "فريق تطوير مخصص",
    desc_en: "A full product team working for you", desc_ar: "فريق منتج كامل يعمل لك",
    badges_en: ["Monthly retainer", "PM included"], badges_ar: ["اشتراك شهري", "مدير مشروع مشمول"],
  },
];

const STEPS = [
  { en: "Service Type", ar: "نوع الخدمة" },
  { en: "Service Details", ar: "تفاصيل الخدمة" },
  { en: "Contact Info", ar: "معلومات التواصل" },
  { en: "Review", ar: "المراجعة" },
];

const ACCEPTED_TYPES = ".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip";
const MAX_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024;

/* ── Type-specific option configs ── */
const HEADCOUNT_OPTIONS = [
  { value: "1", en: "1 person", ar: "شخص واحد" },
  { value: "2_3", en: "2–3 people", ar: "2–3 أشخاص" },
  { value: "4_6", en: "4–6 people", ar: "4–6 أشخاص" },
  { value: "7_plus", en: "7+", ar: "+7" },
];

const ENGAGEMENT_MODEL_OPTIONS = [
  { value: "full_time", en: "Full-time (40h/wk)", ar: "دوام كامل (40 ساعة/أسبوع)" },
  { value: "part_time", en: "Part-time (20h/wk)", ar: "دوام جزئي (20 ساعة/أسبوع)" },
  { value: "flexible", en: "Flexible", ar: "مرن" },
];

const SENIORITY_OPTIONS = [
  { value: "junior", en: "Junior", ar: "مبتدئ" },
  { value: "mid", en: "Mid-level", ar: "متوسط" },
  { value: "senior", en: "Senior", ar: "خبير" },
  { value: "lead", en: "Lead", ar: "قائد فريق" },
  { value: "mixed", en: "Mixed", ar: "متنوع" },
];

const ENGAGEMENT_DURATION_OPTIONS = [
  { value: "1_3months", en: "1–3 months", ar: "1–3 أشهر" },
  { value: "3_6months", en: "3–6 months", ar: "3–6 أشهر" },
  { value: "6_12months", en: "6–12 months", ar: "6–12 شهر" },
  { value: "12_plus", en: "12+ months", ar: "+12 شهر" },
  { value: "ongoing", en: "Ongoing", ar: "مستمر" },
];

const QA_TEST_TYPES = [
  { value: "functional", en: "Functional", ar: "وظيفي" },
  { value: "regression", en: "Regression", ar: "انحدار" },
  { value: "performance", en: "Performance / Load", ar: "أداء / حمل" },
  { value: "security", en: "Security / Pentest", ar: "أمني / اختراق" },
  { value: "mobile_device", en: "Mobile Device", ar: "أجهزة جوال" },
  { value: "automation", en: "Automation Setup", ar: "إعداد أتمتة" },
  { value: "accessibility", en: "Accessibility", ar: "إمكانية الوصول" },
];

const QA_ENV_OPTIONS = [
  { value: "staging", en: "Staging", ar: "بيئة اختبار" },
  { value: "production", en: "Production", ar: "إنتاج" },
  { value: "both", en: "Both", ar: "كلاهما" },
  { value: "will_provide", en: "Will provide access", ar: "سأوفر الوصول" },
];

const QA_ENGAGEMENT_OPTIONS = [
  { value: "one_time", en: "One-time audit", ar: "تدقيق لمرة واحدة" },
  { value: "ongoing", en: "Ongoing QA", ar: "ضمان جودة مستمر" },
  { value: "automation_setup", en: "Test automation setup", ar: "إعداد أتمتة الاختبار" },
];

const IT_CATEGORY_OPTIONS = [
  { value: "cloud_migration", en: "Cloud Migration", ar: "نقل إلى السحابة" },
  { value: "devops_cicd", en: "DevOps / CI/CD", ar: "DevOps / CI/CD" },
  { value: "server_setup", en: "Server Setup", ar: "إعداد الخوادم" },
  { value: "network_security", en: "Network / Security", ar: "شبكات / أمان" },
  { value: "monitoring", en: "Monitoring", ar: "مراقبة" },
  { value: "tech_support", en: "Technical Support / SLA", ar: "دعم تقني / SLA" },
];

const IT_SLA_OPTIONS = [
  { value: "best_effort", en: "Best effort", ar: "أفضل جهد" },
  { value: "99_9", en: "99.9% uptime", ar: "99.9% وقت تشغيل" },
  { value: "24_7", en: "24/7 support", ar: "دعم 24/7" },
  { value: "custom", en: "Custom SLA", ar: "SLA مخصص" },
];

const IT_ENGAGEMENT_OPTIONS = [
  { value: "one_time", en: "One-time setup", ar: "إعداد لمرة واحدة" },
  { value: "ongoing", en: "Ongoing management", ar: "إدارة مستمرة" },
  { value: "emergency", en: "Emergency fix", ar: "إصلاح طارئ" },
];

const SQUAD_SIZE_OPTIONS = [
  { value: "3_person", en: "3-person squad", ar: "فريق من 3" },
  { value: "5_person", en: "5-person squad", ar: "فريق من 5" },
  { value: "7_person", en: "7-person squad", ar: "فريق من 7" },
  { value: "custom", en: "Custom size", ar: "حجم مخصص" },
];

const SQUAD_PM_OPTIONS = [
  { value: "yes", en: "Yes (DevWady PM)", ar: "نعم (مدير مشروع DevWady)" },
  { value: "no", en: "No (we have our own)", ar: "لا (لدينا مدير مشروع)" },
  { value: "not_sure", en: "Not sure", ar: "غير متأكد" },
];

const SQUAD_DURATION_OPTIONS = [
  { value: "3_months", en: "3 months (minimum)", ar: "3 أشهر (الحد الأدنى)" },
  { value: "6_months", en: "6 months", ar: "6 أشهر" },
  { value: "12_months", en: "12 months", ar: "12 شهر" },
  { value: "ongoing", en: "Ongoing", ar: "مستمر" },
];

/* ── Component ── */
export default function RequestService() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const { upload, uploading } = useMediaUpload();
  const isAr = lang === "ar";

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ id: string } | null>(null);

  // Common
  const [serviceType, setServiceType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [preferredStartDate, setPreferredStartDate] = useState<Date | undefined>();
  const [attachments, setAttachments] = useState<{ name: string; url: string; size: number }[]>([]);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [editContact, setEditContact] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  // Team Augmentation
  const [headcount, setHeadcount] = useState("");
  const [engagementModel, setEngagementModel] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [seniority, setSeniority] = useState("");
  const [engagementDuration, setEngagementDuration] = useState("");
  const [techStack, setTechStack] = useState("");

  // QA
  const [testTypes, setTestTypes] = useState<string[]>([]);
  const [productUrl, setProductUrl] = useState("");
  const [qaEnv, setQaEnv] = useState("");
  const [qaEngagement, setQaEngagement] = useState("");
  const [currentTesting, setCurrentTesting] = useState("");

  // IT
  const [itCategory, setItCategory] = useState("");
  const [currentInfra, setCurrentInfra] = useState("");
  const [slaReq, setSlaReq] = useState("");
  const [itEngagement, setItEngagement] = useState("");

  // Dedicated Squad
  const [squadSize, setSquadSize] = useState("");
  const [squadTechStack, setSquadTechStack] = useState("");
  const [includesPm, setIncludesPm] = useState("");
  const [squadDuration, setSquadDuration] = useState("");
  const [squadProjectType, setSquadProjectType] = useState("");

  // Prefill
  const { data: profile } = useQuery({
    queryKey: ["profile-prefill", user?.id],
    enabled: !!user,
    staleTime: 300_000,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("full_name, phone").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });
  const { data: companyProfile } = useQuery({
    queryKey: ["company-prefill", user?.id],
    enabled: !!user,
    staleTime: 300_000,
    queryFn: async () => {
      const { data } = await supabase.from("company_profiles").select("company_name").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const prefillName = profile?.full_name || "";
  const prefillEmail = user?.email || "";
  const prefillPhone = profile?.phone || "";
  const prefillCompany = companyProfile?.company_name || "";

  const effectiveName = user && !editContact ? prefillName : contactName;
  const effectiveEmail = user && !editContact ? prefillEmail : contactEmail;
  const effectivePhone = user && !editContact ? prefillPhone : contactPhone;
  const effectiveCompany = user && !editContact ? prefillCompany : companyName;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      if (attachments.length >= MAX_FILES) { toast.error(isAr ? `الحد الأقصى ${MAX_FILES} ملفات` : `Maximum ${MAX_FILES} files`); break; }
      if (file.size > MAX_SIZE) { toast.error(isAr ? "حجم الملف يتجاوز 10 ميجابايت" : "File size exceeds 10MB"); continue; }
      const url = await upload(file, "service-requests");
      if (url) setAttachments((prev) => [...prev, { name: file.name, url, size: file.size }]);
    }
    e.target.value = "";
  };

  const removeAttachment = (idx: number) => setAttachments((prev) => prev.filter((_, i) => i !== idx));

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s) && skills.length < 15) {
      setSkills((prev) => [...prev, s]);
      setSkillInput("");
    }
  };

  const buildMetadata = () => {
    switch (serviceType) {
      case "team_augmentation":
        return { headcount, engagement_model: engagementModel, skills, seniority: seniority || null, engagement_duration: engagementDuration || null, tech_stack: techStack || null };
      case "qa_testing":
        return { test_types: testTypes, product_url: productUrl || null, environment: qaEnv || null, engagement_type: qaEngagement || null, current_testing: currentTesting || null };
      case "it_services":
        return { service_category: itCategory || null, current_infrastructure: currentInfra || null, sla_requirement: slaReq || null, engagement_type: itEngagement || null };
      case "dedicated_squad":
        return { team_size: squadSize || null, tech_stack: squadTechStack || null, includes_pm: includesPm || null, engagement_duration: squadDuration || null, project_type: squadProjectType || null };
      default:
        return {};
    }
  };

  const canAdvance = useCallback(() => {
    if (step === 0) return !!serviceType;
    if (step === 1) return title.trim().length >= 5 && description.trim().length >= 50;
    if (step === 2) {
      return effectiveName.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(effectiveEmail);
    }
    if (step === 3) return agreedTerms;
    return false;
  }, [step, serviceType, title, description, effectiveName, effectiveEmail, agreedTerms]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-service-request", {
        body: {
          contact_name: effectiveName.trim(),
          contact_email: effectiveEmail.trim(),
          contact_phone: effectivePhone.trim() || null,
          company_name: effectiveCompany.trim() || null,
          service_type: serviceType,
          title: title.trim(),
          description: description.trim(),
          requirements: null,
          budget_range: null,
          timeline: null,
          preferred_start_date: preferredStartDate ? format(preferredStartDate, "yyyy-MM-dd") : null,
          attachments: attachments.map((a) => a.url),
          user_id: user?.id || null,
          source: "website",
          category: "service",
          metadata: buildMetadata(),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSuccess({ id: data.id });
    } catch (err: any) {
      toast.error(err?.message || (isAr ? "حدث خطأ" : "Something went wrong"));
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(0); setServiceType(""); setTitle(""); setDescription("");
    setPreferredStartDate(undefined); setAttachments([]); setContactName("");
    setContactEmail(""); setContactPhone(""); setCompanyName("");
    setAgreedTerms(false); setSuccess(null); setEditContact(false);
    setHeadcount(""); setEngagementModel(""); setSkills([]); setSkillInput("");
    setSeniority(""); setEngagementDuration(""); setTechStack("");
    setTestTypes([]); setProductUrl(""); setQaEnv(""); setQaEngagement(""); setCurrentTesting("");
    setItCategory(""); setCurrentInfra(""); setSlaReq(""); setItEngagement("");
    setSquadSize(""); setSquadTechStack(""); setIncludesPm(""); setSquadDuration(""); setSquadProjectType("");
  };

  const selectedService = SERVICE_TYPES.find((s) => s.value === serviceType);

  const titlePlaceholder = (() => {
    switch (serviceType) {
      case "team_augmentation": return isAr ? "مثال: مطور React لمشروع تجارة إلكترونية" : "e.g. React Developer for E-commerce Project";
      case "qa_testing": return isAr ? "مثال: اختبار شامل لتطبيق جوال" : "e.g. Full Testing for Mobile App";
      case "it_services": return isAr ? "مثال: ترحيل إلى AWS" : "e.g. AWS Cloud Migration";
      case "dedicated_squad": return isAr ? "مثال: فريق تطوير لمنصة SaaS" : "e.g. Dev Squad for SaaS Platform";
      default: return isAr ? "عنوان الخدمة" : "Service title";
    }
  })();

  // ── Success ──
  if (success) {
    return (
      <>
        <SEO title={isAr ? "طلب خدمة" : "Request a Service"} description={isAr ? "أرسل طلب خدمة لفريق DevWady" : "Submit a service request to DevWady"} />
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md mx-auto">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}>
              <CheckCircle2 className="h-20 w-20 mx-auto text-success mb-6" />
            </motion.div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{isAr ? "تم إرسال طلب الخدمة!" : "Service request submitted!"}</h2>
            <p className="font-mono text-sm text-muted-foreground mb-4">
              {isAr ? "رقم الطلب:" : "Request ID:"} SR-{success.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="text-muted-foreground mb-8">
              {isAr
                ? "سيقوم فريقنا بإعداد عرض خدمة مخصص والرد عليك خلال 48 ساعة."
                : "Our team will prepare a service proposal and get back to you within 48 hours."}
            </p>
            <div className="flex flex-col gap-3">
              {user ? (
                <Button asChild className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
                  <a href="/my-projects">{isAr ? "تتبع طلبك" : "Track your request"}</a>
                </Button>
              ) : (
                <Button asChild className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
                  <a href={`/request-status?email=${encodeURIComponent(effectiveEmail)}`}>
                    {isAr ? "تتبع بالبريد الإلكتروني" : "Track by email"}
                  </a>
                </Button>
              )}
              <Button variant="ghost" onClick={resetForm}>{isAr ? "إرسال طلب آخر" : "Submit another request"}</Button>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title={isAr ? "طلب خدمة" : "Request a Service"} description={isAr ? "استأجر خدمة تقنية من DevWady" : "Hire a technical service from DevWady"} />
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            {isAr ? "استأجر خدمة" : "Hire a Service"}
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {isAr ? "وسّع فريقك أو احصل على خدمات تقنية مستمرة حسب الطلب" : "Scale your team or get ongoing technical services on demand"}
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-12 max-w-xl mx-auto">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5" aria-current={i === step ? "step" : undefined}>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i < step ? "bg-success text-success-foreground"
                    : i === step ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {i < step ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
                </div>
                <span className="text-[10px] font-medium text-muted-foreground hidden sm:block">{isAr ? s.ar : s.en}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mt-[-18px] sm:mt-[-8px] rounded ${i < step ? "bg-success" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Steps */}
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: isAr ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isAr ? 20 : -20 }} transition={{ duration: 0.2 }}>

            {/* Step 1 — Service Type */}
            {step === 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-6">{isAr ? "ما الخدمة التي تحتاجها؟" : "What service do you need?"}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SERVICE_TYPES.map((s) => {
                    const Icon = s.icon;
                    const selected = serviceType === s.value;
                    return (
                      <button
                        key={s.value}
                        onClick={() => setServiceType(s.value)}
                        className={`p-5 rounded-2xl border text-start transition-all ${
                          selected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/40"
                        }`}
                      >
                        <Icon className={`h-6 w-6 mb-2 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                        <div className="font-medium text-sm text-foreground">{isAr ? s.ar : s.en}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 mb-3">{isAr ? s.desc_ar : s.desc_en}</div>
                        <div className="flex flex-wrap gap-1.5">
                          {(isAr ? s.badges_ar : s.badges_en).map((b, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px] font-normal">{b}</Badge>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2 — Service Details */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-foreground mb-4">{isAr ? "تفاصيل الخدمة" : "Service Details"}</h2>
                {/* Title */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{isAr ? "عنوان الخدمة *" : "Service Title *"}</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 100))} placeholder={titlePlaceholder} />
                  <p className="text-xs text-muted-foreground mt-1">{title.length}/100</p>
                </div>
                {/* Description */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{isAr ? "وصف الاحتياج *" : "Description *"}</label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 3000))} rows={5} placeholder={isAr ? "صف ما تحتاجه بالتفصيل..." : "Describe your needs in detail..."} />
                  <p className={`text-xs mt-1 ${description.length < 50 ? "text-destructive" : "text-muted-foreground"}`}>
                    {description.length}/3000 {description.length < 50 && (isAr ? "(الحد الأدنى 50 حرف)" : "(min 50 chars)")}
                  </p>
                </div>

                {/* ── Type-specific fields ── */}
                {serviceType === "team_augmentation" && (
                  <TypeSection title={isAr ? "تفاصيل التوظيف" : "Staffing Details"}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <SF label={isAr ? "عدد الأشخاص *" : "Headcount *"} value={headcount} onChange={setHeadcount} options={HEADCOUNT_OPTIONS} isAr={isAr} />
                      <SF label={isAr ? "نموذج العمل *" : "Engagement Model *"} value={engagementModel} onChange={setEngagementModel} options={ENGAGEMENT_MODEL_OPTIONS} isAr={isAr} />
                    </div>
                    {/* Skills tag input */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">{isAr ? "المهارات المطلوبة *" : "Required Skills *"}</label>
                      <div className="flex gap-2">
                        <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                          placeholder={isAr ? "اكتب مهارة واضغط Enter" : "Type a skill and press Enter"} />
                        <Button type="button" variant="outline" size="sm" onClick={addSkill} disabled={!skillInput.trim()}>
                          {isAr ? "أضف" : "Add"}
                        </Button>
                      </div>
                      {skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {skills.map((s, i) => (
                            <Badge key={i} variant="secondary" className="gap-1">
                              {s}
                              <button onClick={() => setSkills((prev) => prev.filter((_, j) => j !== i))} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <SF label={isAr ? "مستوى الخبرة" : "Seniority Level"} value={seniority} onChange={setSeniority} options={SENIORITY_OPTIONS} isAr={isAr} />
                      <SF label={isAr ? "مدة العمل" : "Engagement Duration"} value={engagementDuration} onChange={setEngagementDuration} options={ENGAGEMENT_DURATION_OPTIONS} isAr={isAr} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">{isAr ? "المكدس التقني الحالي" : "Your Tech Stack"}</label>
                      <Input value={techStack} onChange={(e) => setTechStack(e.target.value)} placeholder={isAr ? "صف المكدس التقني الحالي..." : "Describe your current stack..."} />
                    </div>
                  </TypeSection>
                )}

                {serviceType === "qa_testing" && (
                  <TypeSection title={isAr ? "نطاق الاختبار" : "Testing Scope"}>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">{isAr ? "أنواع الاختبار *" : "Test Types *"}</label>
                      <div className="flex flex-wrap gap-2">
                        {QA_TEST_TYPES.map((t) => {
                          const sel = testTypes.includes(t.value);
                          return (
                            <button key={t.value} onClick={() => setTestTypes(sel ? testTypes.filter((v) => v !== t.value) : [...testTypes, t.value])}
                              className={`px-3 py-2 rounded-xl border text-sm transition-all ${sel ? "border-primary bg-primary/10 text-primary font-medium" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                              {isAr ? t.ar : t.en}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">{isAr ? "رابط المنتج" : "Product URL"}</label>
                      <Input value={productUrl} onChange={(e) => setProductUrl(e.target.value)} placeholder={isAr ? "رابط التطبيق أو الموقع" : "URL of app/site to test"} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <SF label={isAr ? "البيئة" : "Environment"} value={qaEnv} onChange={setQaEnv} options={QA_ENV_OPTIONS} isAr={isAr} />
                      <SF label={isAr ? "نوع المشاركة" : "Engagement Type"} value={qaEngagement} onChange={setQaEngagement} options={QA_ENGAGEMENT_OPTIONS} isAr={isAr} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">{isAr ? "الاختبار الحالي" : "Current Testing"}</label>
                      <Input value={currentTesting} onChange={(e) => setCurrentTesting(e.target.value)} placeholder={isAr ? "صف أي اختبارات موجودة..." : "Describe any existing testing..."} />
                    </div>
                  </TypeSection>
                )}

                {serviceType === "it_services" && (
                  <TypeSection title={isAr ? "تفاصيل البنية التحتية" : "Infrastructure Details"}>
                    <SF label={isAr ? "فئة الخدمة *" : "Service Category *"} value={itCategory} onChange={setItCategory} options={IT_CATEGORY_OPTIONS} isAr={isAr} />
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">{isAr ? "البنية التحتية الحالية" : "Current Infrastructure"}</label>
                      <Textarea value={currentInfra} onChange={(e) => setCurrentInfra(e.target.value)} rows={3} placeholder={isAr ? "صف الإعداد الحالي..." : "Describe your current setup..."} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <SF label={isAr ? "متطلبات SLA" : "SLA Requirement"} value={slaReq} onChange={setSlaReq} options={IT_SLA_OPTIONS} isAr={isAr} />
                      <SF label={isAr ? "نوع المشاركة" : "Engagement Type"} value={itEngagement} onChange={setItEngagement} options={IT_ENGAGEMENT_OPTIONS} isAr={isAr} />
                    </div>
                  </TypeSection>
                )}

                {serviceType === "dedicated_squad" && (
                  <TypeSection title={isAr ? "تكوين الفريق" : "Squad Configuration"}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <SF label={isAr ? "حجم الفريق *" : "Team Size *"} value={squadSize} onChange={setSquadSize} options={SQUAD_SIZE_OPTIONS} isAr={isAr} />
                      <SF label={isAr ? "يشمل مدير مشروع؟" : "Includes PM?"} value={includesPm} onChange={setIncludesPm} options={SQUAD_PM_OPTIONS} isAr={isAr} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">{isAr ? "المكدس التقني *" : "Tech Stack *"}</label>
                      <Input value={squadTechStack} onChange={(e) => setSquadTechStack(e.target.value)} placeholder={isAr ? "مثال: React + Node.js + AWS" : "e.g. React + Node.js + AWS"} />
                    </div>
                    <SF label={isAr ? "مدة العمل" : "Engagement Duration"} value={squadDuration} onChange={setSquadDuration} options={SQUAD_DURATION_OPTIONS} isAr={isAr} />
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">{isAr ? "نوع المشروع" : "Project Type"}</label>
                      <Input value={squadProjectType} onChange={(e) => setSquadProjectType(e.target.value)} placeholder={isAr ? "ما الذي سيعمل عليه الفريق؟" : "What will the squad work on?"} />
                    </div>
                  </TypeSection>
                )}

                {/* Pricing note */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border">
                  <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    {isAr
                      ? "سنقدم عرض سعر مخصص بناءً على متطلباتك. لا حاجة لتحديد ميزانية."
                      : "We'll provide a customized quote based on your requirements. No need to set a budget."}
                  </p>
                </div>

                {/* Start Date */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{isAr ? "تاريخ البدء المفضل" : "Preferred Start Date"}</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-start font-normal">
                        <CalendarIcon className="me-2 h-4 w-4" />
                        {preferredStartDate ? format(preferredStartDate, "PPP") : (isAr ? "اختر تاريخ" : "Pick a date")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={preferredStartDate} onSelect={setPreferredStartDate} disabled={(d) => d < new Date()} />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Attachments */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{isAr ? "المرفقات" : "Attachments"} ({attachments.length}/{MAX_FILES})</label>
                  <label className={`flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed cursor-pointer hover:bg-muted/50 transition ${uploading ? "pointer-events-none opacity-60" : ""}`}>
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
                    <span className="text-sm text-muted-foreground">{isAr ? "اختر ملفات" : "Choose files"}</span>
                    <input type="file" className="hidden" accept={ACCEPTED_TYPES} multiple onChange={handleFileUpload} disabled={uploading || attachments.length >= MAX_FILES} />
                  </label>
                  {attachments.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {attachments.map((a, i) => (
                        <li key={i} className="flex items-center justify-between px-3 py-1.5 bg-muted/50 rounded-lg text-sm">
                          <span className="flex items-center gap-2 truncate">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            {a.name}
                            <span className="text-xs text-muted-foreground">({(a.size / 1024).toFixed(0)} KB)</span>
                          </span>
                          <button onClick={() => removeAttachment(i)} className="text-destructive hover:text-destructive/80"><X className="h-3.5 w-3.5" /></button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Step 3 — Contact Info */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">{isAr ? "معلومات التواصل" : "Contact Information"}</h2>
                  {user && (
                    <Button variant="ghost" size="sm" onClick={() => setEditContact(!editContact)}>
                      <Pencil className="h-3.5 w-3.5 me-1" />
                      {editContact ? (isAr ? "استخدام بياناتي" : "Use my info") : (isAr ? "تعديل" : "Edit")}
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{isAr ? "الاسم الكامل *" : "Full Name *"}</label>
                    {user && !editContact ? <Input value={prefillName} disabled className="bg-muted/50" /> : <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder={isAr ? "اسمك" : "Your name"} />}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{isAr ? "البريد الإلكتروني *" : "Email *"}</label>
                    {user && !editContact ? <Input value={prefillEmail} disabled className="bg-muted/50" /> : <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder={isAr ? "بريدك الإلكتروني" : "your@email.com"} />}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{isAr ? "الهاتف" : "Phone"}</label>
                    {user && !editContact ? <Input value={prefillPhone} disabled className="bg-muted/50" /> : <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder={isAr ? "رقم الهاتف" : "Phone number"} />}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{isAr ? "اسم الشركة" : "Company Name"}</label>
                    {user && !editContact ? <Input value={prefillCompany} disabled className="bg-muted/50" /> : <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder={isAr ? "اسم الشركة (اختياري)" : "Company (optional)"} />}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4 — Review */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">{isAr ? "مراجعة وإرسال" : "Review & Submit"}</h2>
                <div className="bg-card border rounded-2xl divide-y divide-border">
                  <RR label={isAr ? "نوع الخدمة" : "Service Type"} onEdit={() => setStep(0)}>
                    {selectedService && (
                      <span className="flex items-center gap-2">
                        <selectedService.icon className="h-4 w-4 text-primary" />
                        {isAr ? selectedService.ar : selectedService.en}
                      </span>
                    )}
                  </RR>
                  <RR label={isAr ? "العنوان" : "Title"} onEdit={() => setStep(1)}>{title}</RR>
                  <RR label={isAr ? "الوصف" : "Description"} onEdit={() => setStep(1)}><ExpandableText text={description} /></RR>

                  {/* Type-specific review */}
                  {serviceType === "team_augmentation" && (
                    <>
                      {headcount && <RR label={isAr ? "العدد" : "Headcount"} onEdit={() => setStep(1)}>{HEADCOUNT_OPTIONS.find((o) => o.value === headcount)?.[isAr ? "ar" : "en"]}</RR>}
                      {engagementModel && <RR label={isAr ? "نموذج العمل" : "Model"} onEdit={() => setStep(1)}>{ENGAGEMENT_MODEL_OPTIONS.find((o) => o.value === engagementModel)?.[isAr ? "ar" : "en"]}</RR>}
                      {skills.length > 0 && <RR label={isAr ? "المهارات" : "Skills"} onEdit={() => setStep(1)}>{skills.join(", ")}</RR>}
                      {seniority && <RR label={isAr ? "المستوى" : "Seniority"} onEdit={() => setStep(1)}>{SENIORITY_OPTIONS.find((o) => o.value === seniority)?.[isAr ? "ar" : "en"]}</RR>}
                      {engagementDuration && <RR label={isAr ? "المدة" : "Duration"} onEdit={() => setStep(1)}>{ENGAGEMENT_DURATION_OPTIONS.find((o) => o.value === engagementDuration)?.[isAr ? "ar" : "en"]}</RR>}
                    </>
                  )}
                  {serviceType === "qa_testing" && (
                    <>
                      {testTypes.length > 0 && <RR label={isAr ? "أنواع الاختبار" : "Test Types"} onEdit={() => setStep(1)}>{testTypes.map((t) => QA_TEST_TYPES.find((o) => o.value === t)?.[isAr ? "ar" : "en"]).join(", ")}</RR>}
                      {productUrl && <RR label={isAr ? "الرابط" : "Product URL"} onEdit={() => setStep(1)}>{productUrl}</RR>}
                      {qaEngagement && <RR label={isAr ? "نوع المشاركة" : "Engagement"} onEdit={() => setStep(1)}>{QA_ENGAGEMENT_OPTIONS.find((o) => o.value === qaEngagement)?.[isAr ? "ar" : "en"]}</RR>}
                    </>
                  )}
                  {serviceType === "it_services" && (
                    <>
                      {itCategory && <RR label={isAr ? "الفئة" : "Category"} onEdit={() => setStep(1)}>{IT_CATEGORY_OPTIONS.find((o) => o.value === itCategory)?.[isAr ? "ar" : "en"]}</RR>}
                      {slaReq && <RR label="SLA" onEdit={() => setStep(1)}>{IT_SLA_OPTIONS.find((o) => o.value === slaReq)?.[isAr ? "ar" : "en"]}</RR>}
                      {itEngagement && <RR label={isAr ? "نوع المشاركة" : "Engagement"} onEdit={() => setStep(1)}>{IT_ENGAGEMENT_OPTIONS.find((o) => o.value === itEngagement)?.[isAr ? "ar" : "en"]}</RR>}
                    </>
                  )}
                  {serviceType === "dedicated_squad" && (
                    <>
                      {squadSize && <RR label={isAr ? "حجم الفريق" : "Team Size"} onEdit={() => setStep(1)}>{SQUAD_SIZE_OPTIONS.find((o) => o.value === squadSize)?.[isAr ? "ar" : "en"]}</RR>}
                      {squadTechStack && <RR label={isAr ? "المكدس التقني" : "Tech Stack"} onEdit={() => setStep(1)}>{squadTechStack}</RR>}
                      {includesPm && <RR label={isAr ? "مدير مشروع" : "PM"} onEdit={() => setStep(1)}>{SQUAD_PM_OPTIONS.find((o) => o.value === includesPm)?.[isAr ? "ar" : "en"]}</RR>}
                      {squadDuration && <RR label={isAr ? "المدة" : "Duration"} onEdit={() => setStep(1)}>{SQUAD_DURATION_OPTIONS.find((o) => o.value === squadDuration)?.[isAr ? "ar" : "en"]}</RR>}
                    </>
                  )}

                  {preferredStartDate && <RR label={isAr ? "تاريخ البدء" : "Start Date"} onEdit={() => setStep(1)}>{format(preferredStartDate, "PPP")}</RR>}
                  {attachments.length > 0 && <RR label={isAr ? "المرفقات" : "Attachments"} onEdit={() => setStep(1)}>{attachments.length} {isAr ? "ملف" : "file(s)"}</RR>}
                  <RR label={isAr ? "التواصل" : "Contact"} onEdit={() => setStep(2)}>
                    <div className="text-sm">
                      <div>{effectiveName}</div>
                      <div className="text-muted-foreground">{effectiveEmail}</div>
                      {effectivePhone && <div className="text-muted-foreground">{effectivePhone}</div>}
                      {effectiveCompany && <div className="text-muted-foreground">{effectiveCompany}</div>}
                    </div>
                  </RR>
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox checked={agreedTerms} onCheckedChange={(v) => setAgreedTerms(v === true)} className="mt-0.5" />
                  <span className="text-sm text-muted-foreground">{isAr ? "أوافق على شروط الخدمة لدى DevWady" : "I agree to DevWady's terms of service"}</span>
                </label>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10">
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0} className="gap-2">
            {isAr ? <ArrowRight className="icon-flip-rtl h-4 w-4" /> : <ArrowLeft className="icon-flip-rtl h-4 w-4" />}
            {isAr ? "السابق" : "Back"}
          </Button>
          {step < 3 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance()} className="gap-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
              {isAr ? "التالي" : "Next"}
              {isAr ? <ArrowLeft className="icon-flip-rtl h-4 w-4" /> : <ArrowRight className="icon-flip-rtl h-4 w-4" />}
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canAdvance() || submitting} className="gap-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground min-w-[180px]">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isAr ? "إرسال الطلب" : "Submit Request"}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Helpers ── */
function TypeSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-primary/20 rounded-xl p-4 space-y-4 bg-primary/[0.02]">
      <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
        <div className="h-1 w-4 rounded bg-primary" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function SF({ label, value, onChange, options, isAr }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; en: string; ar: string }[]; isAr: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder={isAr ? "اختر..." : "Select..."} /></SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{isAr ? o.ar : o.en}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function RR({ label, onEdit, children }: { label: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between px-5 py-4">
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-muted-foreground mb-1">{label}</div>
        <div className="text-sm text-foreground">{children}</div>
      </div>
      <button onClick={onEdit} className="text-primary hover:text-primary/80 ms-3 mt-0.5">
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function ExpandableText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  if (text.length <= 200) return <span>{text}</span>;
  return (
    <span>
      {expanded ? text : text.slice(0, 200) + "..."}
      <button onClick={() => setExpanded(!expanded)} className="text-primary text-xs ms-1 hover:underline">
        {expanded ? "less" : "more"}
      </button>
    </span>
  );
}
