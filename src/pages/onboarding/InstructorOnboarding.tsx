import { useState, useMemo } from "react";
import { normalizeCourseMetadata } from "@/features/academy/learningModel";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, ArrowRight, ArrowLeft, Loader2, User, Plus, X,
  Sparkles, GraduationCap, BookOpen, Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { useMediaUpload } from "@/hooks/useMediaUpload";

const slideVariant = {
  enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
};

export default function InstructorOnboarding() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isAr = lang === "ar";

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [expertise, setExpertise] = useState<string[]>([]);
  const [expertiseInput, setExpertiseInput] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Step 2
  const [teachingLang, setTeachingLang] = useState("");
  const [courseFormat, setCourseFormat] = useState("");
  const [teachingExp, setTeachingExp] = useState("");
  const [revenueAck, setRevenueAck] = useState(false);

  // Step 3
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDesc, setCourseDesc] = useState("");
  const [courseType, setCourseType] = useState("recorded");
  const [courseLevel, setCourseLevel] = useState("beginner");
  const [coursePrice, setCoursePrice] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);

  const { uploading, upload } = useMediaUpload();

  // Fetch instructor application for pre-fill
  const { data: application, isLoading } = useQuery({
    queryKey: ["instructor-app-onboard", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("instructor_applications")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile-onboard", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Pre-fill
  useMemo(() => {
    if (!application && !profile) return;
    if (!displayName) {
      setDisplayName(application?.full_name || profile?.full_name || "");
    }
    if (!bio && profile?.bio) setBio(profile.bio);
    if (!expertise.length && application?.expertise_areas?.length) {
      setExpertise(application.expertise_areas);
    }
    if (!linkedin && (application?.linkedin_url || profile?.linkedin_url)) {
      setLinkedin(application?.linkedin_url || profile?.linkedin_url || "");
    }
    if (!portfolioUrl && (application?.portfolio_url || profile?.portfolio_url)) {
      setPortfolioUrl(application?.portfolio_url || profile?.portfolio_url || "");
    }
    if (!location && profile?.location) setLocation(profile.location);
    if (!avatarUrl && profile?.avatar_url) setAvatarUrl(profile.avatar_url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application, profile]);

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

  const addExpertise = () => {
    const val = expertiseInput.trim();
    if (val && !expertise.includes(val) && expertise.length < 10) {
      setExpertise([...expertise, val]);
      setExpertiseInput("");
    }
  };

  const handleStep1Save = async () => {
    if (!displayName.trim()) {
      toast.error(isAr ? "الاسم مطلوب" : "Display name is required");
      return;
    }
    if (bio.trim().length < 50) {
      toast.error(isAr ? "السيرة الذاتية يجب أن تكون 50 حرفاً على الأقل" : "Bio must be at least 50 characters");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: displayName.trim(),
        bio: bio.trim(),
        skills: expertise,
        linkedin_url: linkedin || null,
        portfolio_url: portfolioUrl || null,
        location: location || null,
        avatar_url: avatarUrl || null,
      })
      .eq("user_id", user!.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["profile-onboard"] });
    goTo(2);
  };

  const handleStep2Save = () => {
    if (!revenueAck) {
      toast.error(isAr ? "يرجى الموافقة على نموذج الإيرادات" : "Please acknowledge the revenue sharing model");
      return;
    }
    goTo(3);
  };

  const handleCreateCourse = async () => {
    if (!courseTitle.trim()) {
      toast.error(isAr ? "عنوان الدورة مطلوب" : "Course title is required");
      return;
    }
    if (courseDesc.trim().length < 20) {
      toast.error(isAr ? "وصف الدورة يجب أن يكون 20 حرفاً على الأقل" : "Course description must be at least 20 characters");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("training_courses")
      .insert({
        title_en: courseTitle.trim(),
        description_en: courseDesc.trim(),
        ...normalizeCourseMetadata({
          learning_product_type: courseType === "live" ? "live_course" : "standard_course",
        }),
        level_en: courseLevel,
        price_usd: isFree ? 0 : (parseFloat(coursePrice) || 0),
        instructor_id: user!.id,
        status: "draft",
        is_devwady_course: false,
        slug: courseTitle.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-"),
      })
      .select("id")
      .single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setCreatedCourseId(data.id);
    toast.success(isAr ? "تم إنشاء مسودة الدورة" : "Course draft created!");
    goTo(4);
  };

  const stepLabels = isAr
    ? ["الملف الشخصي", "إعدادات التدريس", "أول دورة", "جاهز"]
    : ["Profile", "Teaching Setup", "First Course", "Ready"];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SEO title={isAr ? "إعداد حساب المدرب" : "Instructor Setup"} />
      <div className="min-h-screen bg-background py-10 px-4" dir={isAr ? "rtl" : "ltr"}>
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-4">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {isAr ? "إعداد المدرب" : "Instructor Setup"}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {isAr ? "أكمل ملفك كمدرب" : "Complete Your Instructor Profile"}
            </h1>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {stepLabels.map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  step > i + 1
                    ? "bg-primary text-primary-foreground"
                    : step === i + 1
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {step > i + 1 ? <Check className="h-3 w-3" /> : <span>{i + 1}</span>}
                  <span className="hidden sm:inline">{label}</span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div className={`w-6 h-px ${step > i + 1 ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Steps */}
          <AnimatePresence mode="wait" custom={direction}>
            {step === 1 && (
              <motion.div key="s1" custom={direction} variants={slideVariant} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="bg-card rounded-2xl border p-6 space-y-5">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    {isAr ? "ملفك كمدرب" : "Instructor Profile"}
                  </h2>

                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                      {avatarUrl ? (
                        <img loading="lazy" src={avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-7 w-7 text-muted-foreground" />
                      )}
                    </div>
                    <label className="cursor-pointer">
                      <span className="text-sm text-primary hover:underline">
                        {uploading ? (isAr ? "جاري الرفع..." : "Uploading...") : (isAr ? "تغيير الصورة" : "Change photo")}
                      </span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                    </label>
                  </div>

                  <div>
                    <label className="text-sm font-medium">{isAr ? "الاسم المعروض" : "Display Name"} *</label>
                    <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder={isAr ? "كيف تريد أن يظهر اسمك للطلاب" : "How you want to appear to students"} />
                  </div>

                  <div>
                    <label className="text-sm font-medium">{isAr ? "السيرة المهنية" : "Professional Bio"} *</label>
                    <Textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} placeholder={isAr ? "أخبر الطلاب عن خبراتك في التدريس..." : "Tell students about your teaching experience and expertise..."} />
                    <p className="text-xs text-muted-foreground mt-1">{bio.length}/1000 — {isAr ? "50 حرف كحد أدنى" : "min 50 chars"}</p>
                  </div>

                  {/* Expertise tags */}
                  <div>
                    <label className="text-sm font-medium">{isAr ? "مجالات الخبرة" : "Expertise Areas"}</label>
                    <div className="flex gap-2 mt-1">
                      <Input value={expertiseInput} onChange={e => setExpertiseInput(e.target.value)} placeholder={isAr ? "اكتب واضغط Enter" : "Type & press Enter"} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addExpertise(); } }} />
                      <Button type="button" size="icon" variant="outline" onClick={addExpertise}><Plus className="h-4 w-4" /></Button>
                    </div>
                    {expertise.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {expertise.map(s => (
                          <Badge key={s} variant="secondary" className="gap-1">
                            {s}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => setExpertise(expertise.filter(x => x !== s))} />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">LinkedIn</label>
                      <Input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." />
                    </div>
                    <div>
                      <label className="text-sm font-medium">{isAr ? "موقع/معرض أعمال" : "Portfolio/Website"}</label>
                      <Input value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)} placeholder="https://..." />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">{isAr ? "الموقع" : "Location"}</label>
                    <Input value={location} onChange={e => setLocation(e.target.value)} placeholder={isAr ? "القاهرة، مصر" : "Cairo, Egypt"} />
                  </div>

                  <Button onClick={handleStep1Save} disabled={saving} className="w-full">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
                    {isAr ? "متابعة" : "Continue"}
                    <ArrowRight className="icon-flip-rtl h-4 w-4 ms-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" custom={direction} variants={slideVariant} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="bg-card rounded-2xl border p-6 space-y-5">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    {isAr ? "إعدادات التدريس" : "Teaching Preferences"}
                  </h2>

                  <div>
                    <label className="text-sm font-medium">{isAr ? "لغة التدريس المفضلة" : "Preferred Teaching Language"}</label>
                    <Select value={teachingLang} onValueChange={setTeachingLang}>
                      <SelectTrigger><SelectValue placeholder={isAr ? "اختر..." : "Select..."} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="arabic">{isAr ? "العربية" : "Arabic"}</SelectItem>
                        <SelectItem value="english">{isAr ? "الإنجليزية" : "English"}</SelectItem>
                        <SelectItem value="both">{isAr ? "كلاهما" : "Both"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">{isAr ? "نوع الدورات المفضل" : "Course Format Preference"}</label>
                    <Select value={courseFormat} onValueChange={setCourseFormat}>
                      <SelectTrigger><SelectValue placeholder={isAr ? "اختر..." : "Select..."} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recorded">{isAr ? "دورات مسجلة (ذاتية)" : "Recorded courses (self-paced)"}</SelectItem>
                        <SelectItem value="live">{isAr ? "دورات مباشرة (مجموعات)" : "Live courses (cohort-based)"}</SelectItem>
                        <SelectItem value="both">{isAr ? "كلاهما" : "Both"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">{isAr ? "خبرة التدريس" : "Teaching Experience"}</label>
                    <Select value={teachingExp} onValueChange={setTeachingExp}>
                      <SelectTrigger><SelectValue placeholder={isAr ? "اختر..." : "Select..."} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="first-time">{isAr ? "أول مرة" : "First time"}</SelectItem>
                        <SelectItem value="1-2">{isAr ? "1-2 سنوات" : "1-2 years"}</SelectItem>
                        <SelectItem value="3-5">{isAr ? "3-5 سنوات" : "3-5 years"}</SelectItem>
                        <SelectItem value="5+">{isAr ? "5+ سنوات" : "5+ years"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Revenue share card */}
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                    <h3 className="font-medium text-sm">
                      {isAr ? "نموذج مشاركة الإيرادات" : "Revenue Sharing Model"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isAr
                        ? "تحصل على 70% من كل بيع دورة. DevWady يتولى الاستضافة والمدفوعات والتسويق والدعم."
                        : "You earn 70% of each course sale. DevWady handles hosting, payments, marketing, and support."}
                    </p>
                    <div className="flex items-center gap-2">
                      <Checkbox id="revenue-ack" checked={revenueAck} onCheckedChange={v => setRevenueAck(!!v)} />
                      <label htmlFor="revenue-ack" className="text-sm cursor-pointer">
                        {isAr ? "أفهم نموذج مشاركة الإيرادات" : "I understand the revenue sharing model"}
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => goTo(1)} className="flex-1">
                      <ArrowLeft className="icon-flip-rtl h-4 w-4 me-2" />
                      {isAr ? "رجوع" : "Back"}
                    </Button>
                    <Button onClick={handleStep2Save} disabled={!revenueAck} className="flex-1">
                      {isAr ? "متابعة" : "Continue"}
                      <ArrowRight className="icon-flip-rtl h-4 w-4 ms-2" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" custom={direction} variants={slideVariant} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="bg-card rounded-2xl border p-6 space-y-5">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Pencil className="h-5 w-5 text-primary" />
                    {isAr ? "أنشئ أول دورة لك" : "Create Your First Course"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {isAr
                      ? "ابدأ بسرعة بإنشاء مسودة دورة — يمكنك تعديلها لاحقاً."
                      : "Quick-start by creating a course draft — you can edit it later."}
                  </p>

                  <div>
                    <label className="text-sm font-medium">{isAr ? "عنوان الدورة" : "Course Title"} *</label>
                    <Input value={courseTitle} onChange={e => setCourseTitle(e.target.value)} placeholder={isAr ? "مثال: إتقان تطوير React الشامل" : "e.g. Complete React Development Masterclass"} />
                  </div>

                  <div>
                    <label className="text-sm font-medium">{isAr ? "وصف الدورة" : "Course Description"} *</label>
                    <Textarea value={courseDesc} onChange={e => setCourseDesc(e.target.value)} rows={3} placeholder={isAr ? "ماذا سيتعلم الطلاب؟" : "What will students learn?"} />
                    <p className="text-xs text-muted-foreground mt-1">{courseDesc.length}/500 — {isAr ? "20 حرف كحد أدنى" : "min 20 chars"}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">{isAr ? "نوع الدورة" : "Course Type"}</label>
                      <Select value={courseType} onValueChange={setCourseType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="recorded">{isAr ? "مسجلة" : "Recorded"}</SelectItem>
                          <SelectItem value="live">{isAr ? "مباشرة" : "Live"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">{isAr ? "المستوى" : "Level"}</label>
                      <Select value={courseLevel} onValueChange={setCourseLevel}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">{isAr ? "مبتدئ" : "Beginner"}</SelectItem>
                          <SelectItem value="intermediate">{isAr ? "متوسط" : "Intermediate"}</SelectItem>
                          <SelectItem value="advanced">{isAr ? "متقدم" : "Advanced"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium">{isAr ? "السعر المقدر" : "Estimated Price"}</label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{isAr ? "مجاني" : "Free"}</span>
                        <Switch checked={isFree} onCheckedChange={setIsFree} />
                      </div>
                    </div>
                    {!isFree && (
                      <div className="relative">
                        <span className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                        <Input value={coursePrice} onChange={e => setCoursePrice(e.target.value)} type="number" min="0" className="ps-7" placeholder="49" />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => goTo(2)} className="flex-1">
                      <ArrowLeft className="icon-flip-rtl h-4 w-4 me-2" />
                      {isAr ? "رجوع" : "Back"}
                    </Button>
                    <Button onClick={handleCreateCourse} disabled={saving} className="flex-1">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
                      {isAr ? "إنشاء مسودة الدورة" : "Create Course Draft"}
                    </Button>
                  </div>

                  <button onClick={() => goTo(4)} className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {isAr ? "تخطي — سأنشئ دورة لاحقاً" : "Skip — I'll create a course later"}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="s4" custom={direction} variants={slideVariant} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="bg-card rounded-2xl border p-8 text-center space-y-6">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.2 }} className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </motion.div>

                  <h2 className="text-xl font-bold">
                    {isAr ? "مرحباً بك في فريق مدربي DevWady!" : "Welcome to the DevWady instructor team!"}
                  </h2>

                  {/* Timeline */}
                  <div className="text-start space-y-3 max-w-sm mx-auto" dir={isAr ? "rtl" : "ltr"}>
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Check className="h-3.5 w-3.5 text-primary-foreground" />
                      </div>
                      <span className="text-sm">{isAr ? "تم إنشاء ملف المدرب" : "Instructor profile created"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Check className="h-3.5 w-3.5 text-primary-foreground" />
                      </div>
                      <span className="text-sm">{isAr ? "تم ضبط إعدادات التدريس" : "Teaching preferences set"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {createdCourseId ? (
                        <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <Check className="h-3.5 w-3.5 text-primary-foreground" />
                        </div>
                      ) : (
                        <div className="h-6 w-6 rounded-full border-2 border-border flex-shrink-0" />
                      )}
                      <span className="text-sm">
                        {createdCourseId
                          ? (isAr ? "تم إنشاء مسودة الدورة الأولى" : "First course draft created")
                          : (isAr ? "أنشئ أول دورة لك" : "Create your first course")}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Button onClick={() => navigate("/instructor/workspace")} className="w-full">
                      {isAr ? "ادخل لوحة المدرب" : "Go to Instructor Workspace"}
                      <ArrowRight className="icon-flip-rtl h-4 w-4 ms-2" />
                    </Button>
                    {createdCourseId && (
                      <Button variant="outline" onClick={() => navigate(`/instructor/workspace/courses/${createdCourseId}/edit`)} className="w-full">
                        {isAr ? "تعديل دورتك" : "Continue editing your course"}
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
