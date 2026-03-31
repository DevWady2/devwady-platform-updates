import { useState, useEffect } from "react";
import { normalizeCourseMetadata, PRODUCT_TYPES, PRODUCT_TYPE_LABELS, DELIVERY_MODES, DELIVERY_MODE_LABELS, legacyToProductType, legacyToDeliveryMode, type ProductType, type DeliveryMode, type LegacyCourseType } from "@/features/academy/learningModel";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import SEO from "@/components/SEO";
import { ArrowLeft, Loader2, Save, Send, X, Plus, BookOpen, Layers, Radio } from "lucide-react";
import { toast } from "sonner";

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

export default function InstructorCourseEdit() {
  const { user, role } = useAuth();
  const { lang, t } = useLanguage();
  const isAr = lang === "ar";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const isNew = !id;

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title_en: "",
    title_ar: "",
    slug: "",
    description_en: "",
    description_ar: "",
    course_type: "recorded",
    learning_product_type: "standard_course" as ProductType,
    delivery_mode: "self_paced" as DeliveryMode,
    requires_cohort: false,
    supports_assessments: false,
    supports_projects: false,
    supports_live_sessions: false,
    level_en: "beginner",
    level_ar: "مبتدئ",
    language: "ar",
    thumbnail_url: "",
    preview_video_url: "",
    is_free: true,
    price_usd: 0,
    outcomes_en: [] as string[],
    outcomes_ar: [] as string[],
    tools: [] as string[],
    total_duration_hours: 0,
    max_students: null as number | null,
    status: "draft",
    is_devwady_course: false,
  });

  const [outcomeInput, setOutcomeInput] = useState("");
  const [outcomeArInput, setOutcomeArInput] = useState("");
  const [toolInput, setToolInput] = useState("");

  // Fetch existing course
  const { data: existingCourse, isLoading } = useQuery({
    queryKey: ["instructor-course-edit", id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_courses")
        .select("*")
        .eq("id", id!)
        .eq("instructor_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (existingCourse) {
      const c = existingCourse as any;
      const lpt: ProductType = c.learning_product_type && ["standard_course","live_course","bootcamp_track"].includes(c.learning_product_type)
        ? c.learning_product_type : legacyToProductType((c.course_type || "recorded") as LegacyCourseType);
      const dm: DeliveryMode = c.delivery_mode && ["self_paced","live","hybrid","cohort_based"].includes(c.delivery_mode)
        ? c.delivery_mode : legacyToDeliveryMode((c.course_type || "recorded") as LegacyCourseType);
      setForm({
        title_en: existingCourse.title_en || "",
        title_ar: existingCourse.title_ar || "",
        slug: existingCourse.slug || "",
        description_en: existingCourse.description_en || "",
        description_ar: existingCourse.description_ar || "",
        course_type: existingCourse.course_type || "recorded",
        learning_product_type: lpt,
        delivery_mode: dm,
        requires_cohort: c.requires_cohort ?? false,
        supports_assessments: c.supports_assessments ?? false,
        supports_projects: c.supports_projects ?? false,
        supports_live_sessions: c.supports_live_sessions ?? false,
        level_en: existingCourse.level_en || "beginner",
        level_ar: existingCourse.level_ar || "مبتدئ",
        language: existingCourse.language || "ar",
        thumbnail_url: existingCourse.thumbnail_url || "",
        preview_video_url: existingCourse.preview_video_url || "",
        is_free: existingCourse.is_free ?? true,
        price_usd: existingCourse.price_usd ?? 0,
        outcomes_en: existingCourse.outcomes_en || [],
        outcomes_ar: existingCourse.outcomes_ar || [],
        tools: existingCourse.tools || [],
        total_duration_hours: existingCourse.total_duration_hours ?? 0,
        max_students: existingCourse.max_students,
        status: existingCourse.status || "draft",
        is_devwady_course: existingCourse.is_devwady_course ?? false,
      });
    }
  }, [existingCourse]);

  // Auto slug
  useEffect(() => {
    if (isNew && form.title_en && !existingCourse) {
      setForm((f) => ({ ...f, slug: generateSlug(f.title_en) }));
    }
  }, [form.title_en, isNew, existingCourse]);

  const levelMap: Record<string, string> = {
    beginner: "مبتدئ",
    intermediate: "متوسط",
    advanced: "متقدم",
  };

  const handleSave = async (submitForReview = false) => {
    if (!form.title_en.trim() || !form.slug.trim()) {
      toast.error(isAr ? "العنوان والرابط مطلوبان" : "Title and slug are required");
      return;
    }
    setSaving(true);
    try {
      const meta = normalizeCourseMetadata({
        learning_product_type: form.learning_product_type,
        delivery_mode: form.delivery_mode,
        requires_cohort: form.requires_cohort,
        supports_assessments: form.supports_assessments,
        supports_projects: form.supports_projects,
        supports_live_sessions: form.supports_live_sessions,
      });
      const payload: any = {
        title_en: form.title_en,
        title_ar: form.title_ar || null,
        slug: form.slug,
        description_en: form.description_en || null,
        description_ar: form.description_ar || null,
        ...meta,
        level_en: form.level_en,
        level_ar: levelMap[form.level_en] || form.level_ar || null,
        language: form.language,
        thumbnail_url: form.thumbnail_url || null,
        preview_video_url: form.preview_video_url || null,
        is_free: form.is_free,
        price_usd: form.is_free ? 0 : form.price_usd,
        outcomes_en: form.outcomes_en,
        outcomes_ar: form.outcomes_ar,
        tools: form.tools,
        total_duration_hours: form.total_duration_hours,
        max_students: form.max_students,
        status: submitForReview ? "pending_review" : form.status,
      };

      if (isNew) {
        payload.instructor_id = user!.id;
        payload.status = submitForReview ? "pending_review" : "draft";
        const { data, error } = await supabase
          .from("training_courses")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;

        if (submitForReview) {
          // Notify admins
          const { data: admins } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
          for (const admin of admins || []) {
            await supabase.rpc("create_notification", {
              _user_id: admin.user_id,
              _type: "course_review",
              _title_en: `New course submitted for review: ${form.title_en}`,
              _title_ar: `دورة جديدة للمراجعة: ${form.title_ar || form.title_en}`,
              _link: "/admin/training",
            });
          }
        }

        toast.success(isAr ? "تم إنشاء الدورة" : "Course created");
        queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
        navigate(`/instructor/workspace/courses/${data.id}/edit`);
      } else {
        const { error } = await supabase
          .from("training_courses")
          .update(payload)
          .eq("id", id!)
          .eq("instructor_id", user!.id);
        if (error) throw error;

        if (submitForReview) {
          const { data: admins } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
          for (const admin of admins || []) {
            await supabase.rpc("create_notification", {
              _user_id: admin.user_id,
              _type: "course_review",
              _title_en: `Course updated and submitted for review: ${form.title_en}`,
              _title_ar: `دورة محدثة للمراجعة: ${form.title_ar || form.title_en}`,
              _link: "/admin/training",
            });
          }
        }

        toast.success(isAr ? "تم حفظ التغييرات" : "Changes saved");
        queryClient.invalidateQueries({ queryKey: ["instructor-course-edit", id] });
        queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
      }
    } catch (err: any) {
      toast.error(err.message || "Error saving course");
    } finally {
      setSaving(false);
    }
  };

  const addTag = (field: "outcomes_en" | "outcomes_ar" | "tools", value: string, setter: (v: string) => void) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (form[field].includes(trimmed)) return;
    setForm((f) => ({ ...f, [field]: [...f[field], trimmed] }));
    setter("");
  };

  const removeTag = (field: "outcomes_en" | "outcomes_ar" | "tools", index: number) => {
    setForm((f) => ({ ...f, [field]: f[field].filter((_, i) => i !== index) }));
  };

  if (role !== "instructor" && role !== "admin") {
    return <Navigate to="/" replace />;
  }

  if (!isNew && isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isNew && !isLoading && !existingCourse) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <BookOpen className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">{isAr ? "الدورة غير موجودة" : "Course not found"}</p>
        <Button variant="outline" asChild>
          <Link to="/instructor/workspace"><ArrowLeft className="icon-flip-rtl h-4 w-4 me-1" />{isAr ? "العودة" : "Back to Workspace"}</Link>
        </Button>
      </div>
    );
  }

  const canPublish = form.is_devwady_course || role === "admin";
  const showSubmitForReview = !canPublish && (form.status === "draft" || form.status === "pending_review");

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4" dir={isAr ? "rtl" : "ltr"}>
      <SEO title={isNew ? (isAr ? "دورة جديدة" : "New Course") : (isAr ? "تعديل الدورة" : "Edit Course")} />

      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/instructor/workspace"><ArrowLeft className="icon-flip-rtl h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">
          {isNew ? (isAr ? "إنشاء دورة جديدة" : "Create New Course") : (isAr ? "تعديل الدورة" : "Edit Course")}
        </h1>
        {!isNew && form.status && (
          <Badge variant="secondary">{form.status}</Badge>
        )}
        {!isNew && id && (
          <div className="ms-auto flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/instructor/workspace/courses/${id}/lessons`}>
                <BookOpen className="h-4 w-4 me-1" />{isAr ? "الدروس" : "Lessons"}
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/instructor/workspace/courses/${id}/structure`}>
                <Layers className="h-4 w-4 me-1" />{isAr ? "الهيكل" : "Structure"}
              </Link>
            </Button>
            {(form.learning_product_type === "live_course" || form.learning_product_type === "bootcamp_track") && (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/instructor/workspace/courses/${id}/delivery`}>
                  <Radio className="h-4 w-4 me-1" />{isAr ? "التسليم" : "Delivery"}
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader><CardTitle className="text-base">{isAr ? "معلومات أساسية" : "Basic Info"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>{isAr ? "العنوان (EN)" : "Title (EN)"} *</Label>
                <Input value={form.title_en} onChange={(e) => setForm((f) => ({ ...f, title_en: e.target.value }))} />
              </div>
              <div>
                <Label>{isAr ? "العنوان (AR)" : "Title (AR)"}</Label>
                <Input value={form.title_ar} onChange={(e) => setForm((f) => ({ ...f, title_ar: e.target.value }))} dir="rtl" />
              </div>
            </div>
            <div>
              <Label>{t("form.slug")} *</Label>
              <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className="font-mono text-sm" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>{isAr ? "الوصف (EN)" : "Description (EN)"}</Label>
                <Textarea value={form.description_en} onChange={(e) => setForm((f) => ({ ...f, description_en: e.target.value }))} rows={4} />
              </div>
              <div>
                <Label>{isAr ? "الوصف (AR)" : "Description (AR)"}</Label>
                <Textarea value={form.description_ar} onChange={(e) => setForm((f) => ({ ...f, description_ar: e.target.value }))} rows={4} dir="rtl" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label>{isAr ? "نوع المنتج" : "Product Type"}</Label>
                <Select
                  value={form.learning_product_type}
                  onValueChange={(v) => {
                    const pt = v as ProductType;
                    const defaults = normalizeCourseMetadata({ learning_product_type: pt });
                    setForm((f) => ({
                      ...f,
                      learning_product_type: pt,
                      delivery_mode: defaults.delivery_mode,
                      requires_cohort: defaults.requires_cohort,
                      supports_assessments: defaults.supports_assessments,
                      supports_projects: defaults.supports_projects,
                      supports_live_sessions: defaults.supports_live_sessions,
                    }));
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map((pt) => (
                      <SelectItem key={pt} value={pt}>{isAr ? PRODUCT_TYPE_LABELS[pt].ar : PRODUCT_TYPE_LABELS[pt].en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isAr ? "طريقة التقديم" : "Delivery Mode"}</Label>
                <Select value={form.delivery_mode} onValueChange={(v) => setForm((f) => ({ ...f, delivery_mode: v as DeliveryMode }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DELIVERY_MODES.map((dm) => (
                      <SelectItem key={dm} value={dm}>{isAr ? DELIVERY_MODE_LABELS[dm].ar : DELIVERY_MODE_LABELS[dm].en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isAr ? "المستوى" : "Level"}</Label>
                <Select value={form.level_en} onValueChange={(v) => setForm((f) => ({ ...f, level_en: v, level_ar: levelMap[v] || "" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">{isAr ? "مبتدئ" : "Beginner"}</SelectItem>
                    <SelectItem value="intermediate">{isAr ? "متوسط" : "Intermediate"}</SelectItem>
                    <SelectItem value="advanced">{isAr ? "متقدم" : "Advanced"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isAr ? "اللغة" : "Language"}</Label>
                <Select value={form.language} onValueChange={(v) => setForm((f) => ({ ...f, language: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">{isAr ? "عربي" : "Arabic"}</SelectItem>
                    <SelectItem value="en">{isAr ? "إنجليزي" : "English"}</SelectItem>
                    <SelectItem value="both">{isAr ? "كلاهما" : "Both"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Capability toggles — defaults set by product type, but overridable */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                {isAr ? "الإمكانات (يتم ضبطها تلقائياً حسب نوع المنتج)" : "Capabilities (auto-set by product type, overridable)"}
              </Label>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={form.supports_live_sessions} onCheckedChange={(v) => setForm((f) => ({ ...f, supports_live_sessions: v }))} />
                  {isAr ? "جلسات مباشرة" : "Live Sessions"}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={form.supports_projects} onCheckedChange={(v) => setForm((f) => ({ ...f, supports_projects: v }))} />
                  {isAr ? "مشاريع" : "Projects"}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={form.supports_assessments} onCheckedChange={(v) => setForm((f) => ({ ...f, supports_assessments: v }))} />
                  {isAr ? "تقييمات" : "Assessments"}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={form.requires_cohort} onCheckedChange={(v) => setForm((f) => ({ ...f, requires_cohort: v }))} />
                  {isAr ? "دفعة جماعية" : "Cohort"}
                </label>
              </div>
            </div>
            <div>
              <Label>{isAr ? "رابط فيديو المعاينة" : "Preview Video URL"}</Label>
              <Input value={form.preview_video_url} onChange={(e) => setForm((f) => ({ ...f, preview_video_url: e.target.value }))} placeholder="https://youtube.com/..." />
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader><CardTitle className="text-base">{isAr ? "التسعير" : "Pricing"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch checked={form.is_free} onCheckedChange={(v) => setForm((f) => ({ ...f, is_free: v }))} />
              <Label>{isAr ? "دورة مجانية" : "Free Course"}</Label>
            </div>
            {!form.is_free && (
              <>
                <div>
                  <Label>{isAr ? "السعر (USD)" : "Price (USD)"}</Label>
                  <Input type="number" min={1} value={form.price_usd} onChange={(e) => setForm((f) => ({ ...f, price_usd: parseFloat(e.target.value) || 0 }))} />
                </div>
                {!form.is_devwady_course && (
                  <p className="text-xs text-muted-foreground">
                    {isAr
                      ? `ستحصل على ${existingCourse?.revenue_share_pct || 70}% من كل عملية بيع`
                      : `You will earn ${existingCourse?.revenue_share_pct || 70}% of each sale`}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Curriculum Details */}
        <Card>
          <CardHeader><CardTitle className="text-base">{isAr ? "تفاصيل المنهج" : "Curriculum Details"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {/* Outcomes EN */}
            <div>
              <Label>{isAr ? "مخرجات التعلم (EN)" : "Learning Outcomes (EN)"}</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={outcomeInput}
                  onChange={(e) => setOutcomeInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag("outcomes_en", outcomeInput, setOutcomeInput))}
                  placeholder={isAr ? "اكتب واضغط Enter" : "Type and press Enter"}
                />
                <Button size="sm" variant="outline" onClick={() => addTag("outcomes_en", outcomeInput, setOutcomeInput)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {form.outcomes_en.map((o, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    {o}
                    <button onClick={() => removeTag("outcomes_en", i)}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Outcomes AR */}
            <div>
              <Label>{isAr ? "مخرجات التعلم (AR)" : "Learning Outcomes (AR)"}</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={outcomeArInput}
                  onChange={(e) => setOutcomeArInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag("outcomes_ar", outcomeArInput, setOutcomeArInput))}
                  dir="rtl"
                />
                <Button size="sm" variant="outline" onClick={() => addTag("outcomes_ar", outcomeArInput, setOutcomeArInput)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {form.outcomes_ar.map((o, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    {o}
                    <button onClick={() => removeTag("outcomes_ar", i)}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Tools */}
            <div>
              <Label>{isAr ? "الأدوات والتقنيات" : "Tools & Technologies"}</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={toolInput}
                  onChange={(e) => setToolInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag("tools", toolInput, setToolInput))}
                />
                <Button size="sm" variant="outline" onClick={() => addTag("tools", toolInput, setToolInput)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {form.tools.map((t, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    {t}
                    <button onClick={() => removeTag("tools", i)}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isAr ? "مدة الدورة (ساعات)" : "Duration (hours)"}</Label>
                <Input type="number" min={0} step={0.5} value={form.total_duration_hours} onChange={(e) => setForm((f) => ({ ...f, total_duration_hours: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label>{isAr ? "الحد الأقصى للطلاب" : "Max Students"}</Label>
                <Input type="number" min={0} value={form.max_students ?? ""} onChange={(e) => setForm((f) => ({ ...f, max_students: e.target.value ? parseInt(e.target.value) : null }))} placeholder={isAr ? "بدون حد" : "Unlimited"} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          {canPublish && form.status !== "published" && !isNew && (
            <Button
              variant="outline"
              onClick={() => {
                setForm((f) => ({ ...f, status: "published" }));
                setTimeout(() => handleSave(), 0);
              }}
            >
              {isAr ? "نشر" : "Publish"}
            </Button>
          )}
          {showSubmitForReview && !isNew && (
            <Button variant="outline" onClick={() => handleSave(true)} disabled={saving}>
              <Send className="h-4 w-4 me-1" /> {isAr ? "إرسال للمراجعة" : "Submit for Review"}
            </Button>
          )}
          <Button onClick={() => handleSave(false)} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin me-1" /> : <Save className="h-4 w-4 me-1" />}
            {isAr ? "حفظ" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
