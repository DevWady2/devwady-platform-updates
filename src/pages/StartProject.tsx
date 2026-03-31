import { useState, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { format } from "date-fns";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone, Globe, Server, Palette, MoreHorizontal,
  CheckCircle2, Loader2, CalendarIcon, Pencil, X,
  FileText, ArrowLeft, ArrowRight, Upload, Check,
} from "lucide-react";

/* ── Constants ── */
const PROJECT_TYPES = [
  {
    value: "mobile_app", icon: Smartphone,
    en: "Mobile App Development", ar: "تطوير تطبيقات الجوال",
    desc_en: "iOS, Android & cross-platform apps", desc_ar: "تطبيقات iOS و Android ومتعددة المنصات",
  },
  {
    value: "website", icon: Globe,
    en: "Website Development", ar: "تطوير المواقع",
    desc_en: "Corporate, e-commerce & SaaS sites", desc_ar: "مواقع شركات وتجارة إلكترونية و SaaS",
  },
  {
    value: "enterprise_system", icon: Server,
    en: "Enterprise Systems", ar: "أنظمة المؤسسات",
    desc_en: "Custom business platforms & ERPs", desc_ar: "منصات أعمال مخصصة و ERP",
  },
  {
    value: "uiux_design", icon: Palette,
    en: "UI/UX Design Project", ar: "مشروع تصميم واجهات",
    desc_en: "Wireframes, prototypes & design systems", desc_ar: "تصاميم وبروتوتايب وأنظمة تصميم",
  },
  {
    value: "other", icon: MoreHorizontal,
    en: "Custom / Other Project", ar: "مشروع مخصص / أخرى",
    desc_en: "Tell us what you need to build", desc_ar: "أخبرنا بما تريد بناءه",
  },
];

const BUDGET_OPTIONS = [
  { value: "under_5k", en: "Under $5,000", ar: "أقل من 5,000$" },
  { value: "5k_15k", en: "$5,000–$15,000", ar: "5,000$ – 15,000$" },
  { value: "15k_50k", en: "$15,000–$50,000", ar: "15,000$ – 50,000$" },
  { value: "50k_100k", en: "$50,000–$100,000", ar: "50,000$ – 100,000$" },
  { value: "100k_plus", en: "$100,000+", ar: "100,000$+" },
  { value: "not_sure", en: "Not sure yet", ar: "غير متأكد بعد" },
];

const TIMELINE_OPTIONS = [
  { value: "urgent_1month", en: "Urgent — within 1 month", ar: "عاجل — خلال شهر" },
  { value: "1_3months", en: "1–3 months", ar: "1–3 أشهر" },
  { value: "3_6months", en: "3–6 months", ar: "3–6 أشهر" },
  { value: "6_12months", en: "6–12 months", ar: "6–12 شهر" },
  { value: "flexible", en: "Flexible", ar: "مرن" },
];

const STEPS = [
  { en: "Project Type", ar: "نوع المشروع" },
  { en: "Project Details", ar: "تفاصيل المشروع" },
  { en: "Contact Info", ar: "معلومات التواصل" },
  { en: "Review", ar: "المراجعة" },
];

const ACCEPTED_TYPES = ".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip,.fig,.sketch";
const MAX_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024;

/* ── Type-specific field configs ── */
const PLATFORM_OPTIONS = [
  { value: "ios", en: "iOS", ar: "iOS" },
  { value: "android", en: "Android", ar: "Android" },
  { value: "both", en: "Both (Native)", ar: "كلاهما (أصلي)" },
  { value: "cross_platform", en: "Cross-platform (Flutter/RN)", ar: "متعدد المنصات" },
];

const EXISTING_APP_OPTIONS = [
  { value: "no", en: "No (new app)", ar: "لا (تطبيق جديد)" },
  { value: "rebuild", en: "Yes (rebuild)", ar: "نعم (إعادة بناء)" },
  { value: "add_features", en: "Yes (add features)", ar: "نعم (إضافة ميزات)" },
];

const BACKEND_PREF_OPTIONS = [
  { value: "devwady", en: "DevWady handles it", ar: "DevWady تتولى ذلك" },
  { value: "own", en: "We have our own", ar: "لدينا خاص بنا" },
  { value: "not_sure", en: "Not sure", ar: "غير متأكد" },
];

const WEBSITE_TYPE_OPTIONS = [
  { value: "corporate", en: "Corporate", ar: "شركات" },
  { value: "ecommerce", en: "E-commerce", ar: "تجارة إلكترونية" },
  { value: "saas", en: "SaaS / Web App", ar: "SaaS / تطبيق ويب" },
  { value: "portfolio", en: "Portfolio", ar: "معرض أعمال" },
  { value: "cms_blog", en: "CMS / Blog", ar: "نظام إدارة محتوى / مدونة" },
  { value: "landing", en: "Landing Page", ar: "صفحة هبوط" },
  { value: "other", en: "Other", ar: "أخرى" },
];

const PAGES_OPTIONS = [
  { value: "1_5", en: "1–5 pages", ar: "1–5 صفحات" },
  { value: "5_15", en: "5–15 pages", ar: "5–15 صفحة" },
  { value: "15_30", en: "15–30 pages", ar: "15–30 صفحة" },
  { value: "30_plus", en: "30+ pages", ar: "30+ صفحة" },
  { value: "not_sure", en: "Not sure", ar: "غير متأكد" },
];

const EXISTING_WEBSITE_OPTIONS = [
  { value: "no", en: "No (new website)", ar: "لا (موقع جديد)" },
  { value: "redesign", en: "Yes (redesign)", ar: "نعم (إعادة تصميم)" },
  { value: "add_features", en: "Yes (add features)", ar: "نعم (إضافة ميزات)" },
];

const CMS_OPTIONS = [
  { value: "wordpress", en: "Yes (WordPress)", ar: "نعم (WordPress)" },
  { value: "custom", en: "Yes (custom CMS)", ar: "نعم (نظام مخصص)" },
  { value: "no", en: "No (static)", ar: "لا (ثابت)" },
  { value: "not_sure", en: "Not sure", ar: "غير متأكد" },
];

const ENTERPRISE_MODULES = [
  { value: "user_mgmt", en: "User Management", ar: "إدارة المستخدمين" },
  { value: "inventory", en: "Inventory", ar: "المخزون" },
  { value: "finance", en: "Finance", ar: "المالية" },
  { value: "hr", en: "HR", ar: "الموارد البشرية" },
  { value: "crm", en: "CRM", ar: "إدارة العملاء" },
  { value: "reports", en: "Reports", ar: "التقارير" },
  { value: "scheduling", en: "Scheduling", ar: "الجدولة" },
  { value: "notifications", en: "Notifications", ar: "الإشعارات" },
  { value: "payments", en: "Payments", ar: "المدفوعات" },
  { value: "other", en: "Other", ar: "أخرى" },
];

const EXPECTED_USERS_OPTIONS = [
  { value: "under_100", en: "Under 100", ar: "أقل من 100" },
  { value: "100_1k", en: "100–1,000", ar: "100–1,000" },
  { value: "1k_10k", en: "1,000–10,000", ar: "1,000–10,000" },
  { value: "10k_plus", en: "10,000+", ar: "10,000+" },
  { value: "not_sure", en: "Not sure", ar: "غير متأكد" },
];

const DESIGN_DELIVERABLES = [
  { value: "wireframes", en: "Wireframes", ar: "إطارات سلكية" },
  { value: "full_ui", en: "Full UI Design", ar: "تصميم واجهة كامل" },
  { value: "design_system", en: "Design System", ar: "نظام تصميم" },
  { value: "prototype", en: "Interactive Prototype", ar: "بروتوتايب تفاعلي" },
  { value: "redesign", en: "Redesign", ar: "إعادة تصميم" },
  { value: "branding", en: "Branding", ar: "هوية بصرية" },
];

const DESIGN_PLATFORM_OPTIONS = [
  { value: "mobile", en: "Mobile App", ar: "تطبيق جوال" },
  { value: "web", en: "Web App", ar: "تطبيق ويب" },
  { value: "both", en: "Both", ar: "كلاهما" },
  { value: "desktop", en: "Desktop", ar: "سطح المكتب" },
  { value: "other", en: "Other", ar: "أخرى" },
];

const EXISTING_DESIGN_OPTIONS = [
  { value: "no", en: "No (starting fresh)", ar: "لا (من الصفر)" },
  { value: "redesign", en: "Yes (redesign)", ar: "نعم (إعادة تصميم)" },
  { value: "partial", en: "Partial (extend)", ar: "جزئي (توسيع)" },
];

const BRAND_GUIDELINES_OPTIONS = [
  { value: "yes", en: "Yes (will share)", ar: "نعم (سأشاركها)" },
  { value: "no", en: "No (need branding too)", ar: "لا (أحتاج هوية بصرية أيضاً)" },
  { value: "partial", en: "Partial", ar: "جزئي" },
];

/* ── Component ── */
export default function StartProject() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const { upload, uploading } = useMediaUpload();
  const isAr = lang === "ar";

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ id: string } | null>(null);

  // Common form state
  const [projectType, setProjectType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [timeline, setTimeline] = useState("");
  const [preferredStartDate, setPreferredStartDate] = useState<Date | undefined>();
  const [attachments, setAttachments] = useState<{ name: string; url: string; size: number }[]>([]);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [editContact, setEditContact] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  // Type-specific metadata
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [userTypes, setUserTypes] = useState("");
  const [existingApp, setExistingApp] = useState("");
  const [backendPref, setBackendPref] = useState("");
  const [websiteType, setWebsiteType] = useState("");
  const [estimatedPages, setEstimatedPages] = useState("");
  const [existingWebsite, setExistingWebsite] = useState("");
  const [cmsNeeded, setCmsNeeded] = useState("");
  const [referenceSites, setReferenceSites] = useState("");
  const [enterpriseModules, setEnterpriseModules] = useState<string[]>([]);
  const [expectedUsers, setExpectedUsers] = useState("");
  const [currentSystem, setCurrentSystem] = useState("");
  const [integrationNeeds, setIntegrationNeeds] = useState("");
  const [designDeliverables, setDesignDeliverables] = useState<string[]>([]);
  const [designPlatform, setDesignPlatform] = useState("");
  const [existingDesign, setExistingDesign] = useState("");
  const [brandGuidelines, setBrandGuidelines] = useState("");
  const [designInspiration, setDesignInspiration] = useState("");

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
      if (attachments.length >= MAX_FILES) {
        toast.error(isAr ? `الحد الأقصى ${MAX_FILES} ملفات` : `Maximum ${MAX_FILES} files`);
        break;
      }
      if (file.size > MAX_SIZE) {
        toast.error(isAr ? "حجم الملف يتجاوز 10 ميجابايت" : "File size exceeds 10MB");
        continue;
      }
      const url = await upload(file, "service-requests");
      if (url) setAttachments((prev) => [...prev, { name: file.name, url, size: file.size }]);
    }
    e.target.value = "";
  };

  const removeAttachment = (idx: number) => setAttachments((prev) => prev.filter((_, i) => i !== idx));

  const buildMetadata = () => {
    switch (projectType) {
      case "mobile_app":
        return { platforms, user_types: userTypes || null, existing_app: existingApp || null, backend_preference: backendPref || null };
      case "website":
        return { website_type: websiteType || null, estimated_pages: estimatedPages || null, existing_website: existingWebsite || null, cms_needed: cmsNeeded || null, reference_sites: referenceSites || null };
      case "enterprise_system":
        return { required_modules: enterpriseModules, expected_users: expectedUsers || null, current_system: currentSystem || null, integration_needs: integrationNeeds || null };
      case "uiux_design":
        return { deliverables: designDeliverables, target_platform: designPlatform || null, existing_design: existingDesign || null, brand_guidelines: brandGuidelines || null, inspiration: designInspiration || null };
      default:
        return {};
    }
  };

  const canAdvance = useCallback(() => {
    if (step === 0) return !!projectType;
    if (step === 1) return title.trim().length >= 5 && description.trim().length >= 50;
    if (step === 2) {
      const n = effectiveName;
      const e = effectiveEmail;
      return n.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
    }
    if (step === 3) return agreedTerms;
    return false;
  }, [step, projectType, title, description, effectiveName, effectiveEmail, agreedTerms]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-service-request", {
        body: {
          contact_name: effectiveName.trim(),
          contact_email: effectiveEmail.trim(),
          contact_phone: effectivePhone.trim() || null,
          company_name: effectiveCompany.trim() || null,
          service_type: projectType,
          title: title.trim(),
          description: description.trim(),
          requirements: requirements.trim() || null,
          budget_range: budgetRange || null,
          timeline: timeline || null,
          preferred_start_date: preferredStartDate ? format(preferredStartDate, "yyyy-MM-dd") : null,
          attachments: attachments.map((a) => a.url),
          user_id: user?.id || null,
          source: "website",
          category: "project",
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
    setStep(0);
    setProjectType("");
    setTitle("");
    setDescription("");
    setRequirements("");
    setBudgetRange("");
    setTimeline("");
    setPreferredStartDate(undefined);
    setAttachments([]);
    setContactName("");
    setContactEmail("");
    setContactPhone("");
    setCompanyName("");
    setAgreedTerms(false);
    setSuccess(null);
    setPlatforms([]);
    setUserTypes("");
    setExistingApp("");
    setBackendPref("");
    setWebsiteType("");
    setEstimatedPages("");
    setExistingWebsite("");
    setCmsNeeded("");
    setReferenceSites("");
    setEnterpriseModules([]);
    setExpectedUsers("");
    setCurrentSystem("");
    setIntegrationNeeds("");
    setDesignDeliverables([]);
    setDesignPlatform("");
    setExistingDesign("");
    setBrandGuidelines("");
    setDesignInspiration("");
  };

  const selectedType = PROJECT_TYPES.find((t) => t.value === projectType);

  /* ── Labels per type ── */
  const titleLabel = (() => {
    switch (projectType) {
      case "mobile_app": return isAr ? "اسم التطبيق *" : "App Name *";
      case "website": return isAr ? "اسم الموقع *" : "Website Name *";
      case "enterprise_system": return isAr ? "اسم النظام *" : "System Name *";
      case "uiux_design": return isAr ? "اسم المشروع *" : "Design Project Name *";
      default: return isAr ? "اسم المشروع *" : "Project Name *";
    }
  })();

  const titlePlaceholder = (() => {
    switch (projectType) {
      case "mobile_app": return isAr ? "مثال: تطبيق توصيل طعام" : "e.g. Food Delivery App";
      case "website": return isAr ? "مثال: موقع شركة عقارات" : "e.g. Real Estate Company Website";
      case "enterprise_system": return isAr ? "مثال: نظام إدارة المخزون" : "e.g. Inventory Management System";
      case "uiux_design": return isAr ? "مثال: إعادة تصميم تطبيق بنكي" : "e.g. Banking App Redesign";
      default: return isAr ? "مثال: مشروع تقني مخصص" : "e.g. Custom Tech Project";
    }
  })();

  const descPlaceholder = (() => {
    switch (projectType) {
      case "mobile_app": return isAr ? "صف تطبيقك: ما المشكلة التي يحلها؟ من المستخدمون؟ ما الميزات الرئيسية؟" : "Describe your app: What problem does it solve? Who are the users? Key features?";
      case "website": return isAr ? "صف موقعك: ما الغرض؟ ما المحتوى؟ هل تحتاج متجر أو نماذج؟" : "Describe your website: What's the purpose? Content needs? E-commerce or forms?";
      case "enterprise_system": return isAr ? "صف النظام: ما العمليات التي سيديرها؟ كم عدد المستخدمين المتوقع؟" : "Describe the system: What processes will it manage? Expected user count?";
      case "uiux_design": return isAr ? "صف مشروع التصميم: ما المنتج؟ من الجمهور المستهدف؟ ما المخرجات المطلوبة؟" : "Describe the design project: What's the product? Target audience? Required deliverables?";
      default: return isAr ? "صف ما تحتاج إلى بنائه بالتفصيل..." : "Describe what you need built in detail...";
    }
  })();

  // ── Success ──
  if (success) {
    return (
      <>
        <SEO title={isAr ? "ابدأ مشروعك" : "Start a Project"} description={isAr ? "أرسل طلب مشروع لفريق DevWady" : "Submit a project request to DevWady"} />
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md mx-auto">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}>
              <CheckCircle2 className="h-20 w-20 mx-auto text-success mb-6" />
            </motion.div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{isAr ? "تم إرسال طلب المشروع!" : "Project request submitted!"}</h2>
            <p className="font-mono text-sm text-muted-foreground mb-4">
              {isAr ? "رقم الطلب:" : "Request ID:"} PR-{success.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="text-muted-foreground mb-8">
              {isAr
                ? "سيقوم فريقنا بمراجعة طلبك وإرسال عرض سعر مفصل خلال 24 ساعة."
                : "Our team will review your brief and send a detailed quote with milestones within 24 hours."}
            </p>
            <div className="flex flex-col gap-3">
              {user ? (
                <Button asChild className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
                  <a href="/my-projects">{isAr ? "تتبع مشروعك" : "Track your project"}</a>
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
      <SEO title={isAr ? "ابدأ مشروعك" : "Start a Project"} description={isAr ? "ابدأ مشروعك مع DevWady — تطبيقات، مواقع، أنظمة، تصميم" : "Start your project with DevWady — apps, websites, systems, design"} />
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            {isAr ? "ابدأ مشروعك" : "Start Your Project"}
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {isAr ? "أخبرنا عن فكرتك وسنحولها إلى واقع" : "Tell us about your idea and we'll bring it to life"}
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

            {/* Step 1 — Project Type */}
            {step === 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-6">{isAr ? "ما الذي تريد بناءه؟" : "What do you want to build?"}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {PROJECT_TYPES.map((t) => {
                    const Icon = t.icon;
                    const selected = projectType === t.value;
                    return (
                      <button
                        key={t.value}
                        onClick={() => setProjectType(t.value)}
                        className={`p-4 rounded-2xl border text-start transition-all ${
                          selected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/40"
                        }`}
                      >
                        <Icon className={`h-6 w-6 mb-2 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                        <div className="font-medium text-sm text-foreground">{isAr ? t.ar : t.en}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{isAr ? t.desc_ar : t.desc_en}</div>
                      </button>
                    );
                  })}
                </div>
                {/* What to expect */}
                {projectType && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <p className="text-sm font-medium text-foreground mb-2">{isAr ? "ماذا تتوقع؟" : "What to expect:"}</p>
                    <ul className="space-y-1.5">
                      {[
                        isAr ? "سنراجع متطلباتك خلال 24 ساعة" : "We'll review your requirements within 24h",
                        isAr ? "سيتم إرسال عرض سعر مفصل مع المراحل" : "A detailed quote with milestones will be sent",
                        isAr ? "تتبع التقدم بتحديثات مباشرة" : "Track progress with live updates",
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-success shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </div>
            )}

            {/* Step 2 — Project Details */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-foreground mb-4">{isAr ? "تفاصيل المشروع" : "Project Details"}</h2>
                {/* Title */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{titleLabel}</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 100))} placeholder={titlePlaceholder} />
                  <p className="text-xs text-muted-foreground mt-1">{title.length}/100</p>
                </div>
                {/* Description */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{isAr ? "الوصف *" : "Description *"}</label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 3000))} rows={5} placeholder={descPlaceholder} />
                  <p className={`text-xs mt-1 ${description.length < 50 ? "text-destructive" : "text-muted-foreground"}`}>
                    {description.length}/3000 {description.length < 50 && (isAr ? "(الحد الأدنى 50 حرف)" : "(min 50 chars)")}
                  </p>
                </div>
                {/* Requirements */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{isAr ? "المتطلبات" : "Requirements"}</label>
                  <Textarea value={requirements} onChange={(e) => setRequirements(e.target.value.slice(0, 2000))} rows={3} placeholder={isAr ? "ميزات محددة، تكاملات، احتياجات تقنية..." : "Specific features, integrations, technical needs..."} />
                </div>

                {/* ── Type-specific fields ── */}
                {projectType === "mobile_app" && (
                  <TypeSpecificSection title={isAr ? "تفاصيل التطبيق" : "App Specifics"}>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">{isAr ? "المنصات المستهدفة *" : "Target Platforms *"}</label>
                      <div className="flex flex-wrap gap-2">
                        {PLATFORM_OPTIONS.map((p) => {
                          const sel = platforms.includes(p.value);
                          return (
                            <button key={p.value} onClick={() => setPlatforms(sel ? platforms.filter((v) => v !== p.value) : [...platforms, p.value])}
                              className={`px-3 py-2 rounded-xl border text-sm transition-all ${sel ? "border-primary bg-primary/10 text-primary font-medium" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                              {isAr ? p.ar : p.en}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">{isAr ? "أنواع المستخدمين" : "User Types"}</label>
                      <Input value={userTypes} onChange={(e) => setUserTypes(e.target.value)} placeholder={isAr ? "مثال: عميل، سائق، مدير" : "e.g. Customer, Driver, Admin"} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <SelectField label={isAr ? "تطبيق موجود؟" : "Existing App?"} value={existingApp} onChange={setExistingApp} options={EXISTING_APP_OPTIONS} isAr={isAr} />
                      <SelectField label={isAr ? "تفضيل الباك إند" : "Backend Preference"} value={backendPref} onChange={setBackendPref} options={BACKEND_PREF_OPTIONS} isAr={isAr} />
                    </div>
                  </TypeSpecificSection>
                )}

                {projectType === "website" && (
                  <TypeSpecificSection title={isAr ? "تفاصيل الموقع" : "Website Specifics"}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <SelectField label={isAr ? "نوع الموقع" : "Website Type"} value={websiteType} onChange={setWebsiteType} options={WEBSITE_TYPE_OPTIONS} isAr={isAr} />
                      <SelectField label={isAr ? "عدد الصفحات المتوقع" : "Estimated Pages"} value={estimatedPages} onChange={setEstimatedPages} options={PAGES_OPTIONS} isAr={isAr} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <SelectField label={isAr ? "موقع موجود؟" : "Existing Website?"} value={existingWebsite} onChange={setExistingWebsite} options={EXISTING_WEBSITE_OPTIONS} isAr={isAr} />
                      <SelectField label={isAr ? "تحتاج نظام إدارة محتوى؟" : "CMS Needed?"} value={cmsNeeded} onChange={setCmsNeeded} options={CMS_OPTIONS} isAr={isAr} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">{isAr ? "مواقع مرجعية" : "Reference Sites"}</label>
                      <Input value={referenceSites} onChange={(e) => setReferenceSites(e.target.value)} placeholder={isAr ? "روابط لمواقع تعجبك" : "Links to websites you like"} />
                    </div>
                  </TypeSpecificSection>
                )}

                {projectType === "enterprise_system" && (
                  <TypeSpecificSection title={isAr ? "نطاق النظام" : "System Scope"}>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">{isAr ? "الوحدات المطلوبة" : "Required Modules"}</label>
                      <div className="flex flex-wrap gap-2">
                        {ENTERPRISE_MODULES.map((m) => {
                          const sel = enterpriseModules.includes(m.value);
                          return (
                            <button key={m.value} onClick={() => setEnterpriseModules(sel ? enterpriseModules.filter((v) => v !== m.value) : [...enterpriseModules, m.value])}
                              className={`px-3 py-2 rounded-xl border text-sm transition-all ${sel ? "border-primary bg-primary/10 text-primary font-medium" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                              {isAr ? m.ar : m.en}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <SelectField label={isAr ? "عدد المستخدمين المتوقع" : "Expected Users"} value={expectedUsers} onChange={setExpectedUsers} options={EXPECTED_USERS_OPTIONS} isAr={isAr} />
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">{isAr ? "النظام الحالي" : "Current System"}</label>
                      <Input value={currentSystem} onChange={(e) => setCurrentSystem(e.target.value)} placeholder={isAr ? "Excel، نظام قديم، لا يوجد..." : "Excel, legacy system, none..."} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">{isAr ? "احتياجات التكامل" : "Integration Needs"}</label>
                      <Input value={integrationNeeds} onChange={(e) => setIntegrationNeeds(e.target.value)} placeholder={isAr ? "APIs، بوابات دفع، SMS..." : "APIs, payment gateways, SMS, etc."} />
                    </div>
                  </TypeSpecificSection>
                )}

                {projectType === "uiux_design" && (
                  <TypeSpecificSection title={isAr ? "نطاق التصميم" : "Design Scope"}>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">{isAr ? "المخرجات المطلوبة *" : "Deliverables *"}</label>
                      <div className="flex flex-wrap gap-2">
                        {DESIGN_DELIVERABLES.map((d) => {
                          const sel = designDeliverables.includes(d.value);
                          return (
                            <button key={d.value} onClick={() => setDesignDeliverables(sel ? designDeliverables.filter((v) => v !== d.value) : [...designDeliverables, d.value])}
                              className={`px-3 py-2 rounded-xl border text-sm transition-all ${sel ? "border-primary bg-primary/10 text-primary font-medium" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                              {isAr ? d.ar : d.en}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <SelectField label={isAr ? "المنصة المستهدفة" : "Target Platform"} value={designPlatform} onChange={setDesignPlatform} options={DESIGN_PLATFORM_OPTIONS} isAr={isAr} />
                      <SelectField label={isAr ? "تصميم موجود؟" : "Existing Design?"} value={existingDesign} onChange={setExistingDesign} options={EXISTING_DESIGN_OPTIONS} isAr={isAr} />
                    </div>
                    <SelectField label={isAr ? "إرشادات العلامة التجارية؟" : "Brand Guidelines?"} value={brandGuidelines} onChange={setBrandGuidelines} options={BRAND_GUIDELINES_OPTIONS} isAr={isAr} />
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">{isAr ? "مراجع / إلهام" : "Reference / Inspiration"}</label>
                      <Input value={designInspiration} onChange={(e) => setDesignInspiration(e.target.value)} placeholder={isAr ? "روابط أو أوصاف" : "URLs or descriptions"} />
                    </div>
                  </TypeSpecificSection>
                )}

                {/* Budget & Timeline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SelectField label={isAr ? "نطاق الميزانية" : "Budget Range"} value={budgetRange} onChange={setBudgetRange} options={BUDGET_OPTIONS} isAr={isAr} />
                  <SelectField label={isAr ? "الجدول الزمني" : "Timeline"} value={timeline} onChange={setTimeline} options={TIMELINE_OPTIONS} isAr={isAr} />
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
                  <ReviewRow label={isAr ? "نوع المشروع" : "Project Type"} onEdit={() => setStep(0)}>
                    {selectedType && (
                      <span className="flex items-center gap-2">
                        <selectedType.icon className="h-4 w-4 text-primary" />
                        {isAr ? selectedType.ar : selectedType.en}
                      </span>
                    )}
                  </ReviewRow>
                  <ReviewRow label={titleLabel.replace(" *", "")} onEdit={() => setStep(1)}>{title}</ReviewRow>
                  <ReviewRow label={isAr ? "الوصف" : "Description"} onEdit={() => setStep(1)}>
                    <ExpandableText text={description} />
                  </ReviewRow>
                  {requirements && <ReviewRow label={isAr ? "المتطلبات" : "Requirements"} onEdit={() => setStep(1)}><ExpandableText text={requirements} /></ReviewRow>}

                  {/* Type-specific review rows */}
                  {projectType === "mobile_app" && platforms.length > 0 && (
                    <ReviewRow label={isAr ? "المنصات" : "Platforms"} onEdit={() => setStep(1)}>
                      {platforms.map((p) => PLATFORM_OPTIONS.find((o) => o.value === p)?.[isAr ? "ar" : "en"]).join(", ")}
                    </ReviewRow>
                  )}
                  {projectType === "mobile_app" && userTypes && <ReviewRow label={isAr ? "أنواع المستخدمين" : "User Types"} onEdit={() => setStep(1)}>{userTypes}</ReviewRow>}
                  {projectType === "mobile_app" && existingApp && <ReviewRow label={isAr ? "تطبيق موجود" : "Existing App"} onEdit={() => setStep(1)}>{EXISTING_APP_OPTIONS.find((o) => o.value === existingApp)?.[isAr ? "ar" : "en"]}</ReviewRow>}

                  {projectType === "website" && websiteType && <ReviewRow label={isAr ? "نوع الموقع" : "Website Type"} onEdit={() => setStep(1)}>{WEBSITE_TYPE_OPTIONS.find((o) => o.value === websiteType)?.[isAr ? "ar" : "en"]}</ReviewRow>}
                  {projectType === "website" && estimatedPages && <ReviewRow label={isAr ? "عدد الصفحات" : "Pages"} onEdit={() => setStep(1)}>{PAGES_OPTIONS.find((o) => o.value === estimatedPages)?.[isAr ? "ar" : "en"]}</ReviewRow>}
                  {projectType === "website" && cmsNeeded && <ReviewRow label={isAr ? "نظام إدارة محتوى" : "CMS"} onEdit={() => setStep(1)}>{CMS_OPTIONS.find((o) => o.value === cmsNeeded)?.[isAr ? "ar" : "en"]}</ReviewRow>}

                  {projectType === "enterprise_system" && enterpriseModules.length > 0 && (
                    <ReviewRow label={isAr ? "الوحدات" : "Modules"} onEdit={() => setStep(1)}>
                      {enterpriseModules.map((m) => ENTERPRISE_MODULES.find((o) => o.value === m)?.[isAr ? "ar" : "en"]).join(", ")}
                    </ReviewRow>
                  )}
                  {projectType === "enterprise_system" && expectedUsers && <ReviewRow label={isAr ? "المستخدمين المتوقع" : "Expected Users"} onEdit={() => setStep(1)}>{EXPECTED_USERS_OPTIONS.find((o) => o.value === expectedUsers)?.[isAr ? "ar" : "en"]}</ReviewRow>}

                  {projectType === "uiux_design" && designDeliverables.length > 0 && (
                    <ReviewRow label={isAr ? "المخرجات" : "Deliverables"} onEdit={() => setStep(1)}>
                      {designDeliverables.map((d) => DESIGN_DELIVERABLES.find((o) => o.value === d)?.[isAr ? "ar" : "en"]).join(", ")}
                    </ReviewRow>
                  )}
                  {projectType === "uiux_design" && designPlatform && <ReviewRow label={isAr ? "المنصة" : "Platform"} onEdit={() => setStep(1)}>{DESIGN_PLATFORM_OPTIONS.find((o) => o.value === designPlatform)?.[isAr ? "ar" : "en"]}</ReviewRow>}

                  {budgetRange && <ReviewRow label={isAr ? "الميزانية" : "Budget"} onEdit={() => setStep(1)}>{BUDGET_OPTIONS.find((b) => b.value === budgetRange)?.[isAr ? "ar" : "en"]}</ReviewRow>}
                  {timeline && <ReviewRow label={isAr ? "الجدول الزمني" : "Timeline"} onEdit={() => setStep(1)}>{TIMELINE_OPTIONS.find((t) => t.value === timeline)?.[isAr ? "ar" : "en"]}</ReviewRow>}
                  {preferredStartDate && <ReviewRow label={isAr ? "تاريخ البدء" : "Start Date"} onEdit={() => setStep(1)}>{format(preferredStartDate, "PPP")}</ReviewRow>}
                  {attachments.length > 0 && <ReviewRow label={isAr ? "المرفقات" : "Attachments"} onEdit={() => setStep(1)}>{attachments.length} {isAr ? "ملف" : "file(s)"}</ReviewRow>}
                  <ReviewRow label={isAr ? "التواصل" : "Contact"} onEdit={() => setStep(2)}>
                    <div className="text-sm">
                      <div>{effectiveName}</div>
                      <div className="text-muted-foreground">{effectiveEmail}</div>
                      {effectivePhone && <div className="text-muted-foreground">{effectivePhone}</div>}
                      {effectiveCompany && <div className="text-muted-foreground">{effectiveCompany}</div>}
                    </div>
                  </ReviewRow>
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
              {isAr ? "إرسال الطلب" : "Submit Project"}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Helper components ── */
function TypeSpecificSection({ title, children }: { title: string; children: React.ReactNode }) {
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

function SelectField({ label, value, onChange, options, isAr }: {
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

function ReviewRow({ label, onEdit, children }: { label: string; onEdit: () => void; children: React.ReactNode }) {
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
