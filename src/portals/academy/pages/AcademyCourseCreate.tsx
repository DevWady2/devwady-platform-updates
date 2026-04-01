/**
 * Academy — Instructor Course Create/Edit (portal wrapper that delegates to existing editor).
 */
import { useLanguage } from "@/contexts/LanguageContext";
import { normalizeCourseMetadata, PRODUCT_TYPES, PRODUCT_TYPE_LABELS, DELIVERY_MODES, DELIVERY_MODE_LABELS, type ProductType, type DeliveryMode } from "@/features/academy/learningModel";
import { PageHeader } from "@/core/components";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AcademyCourseCreate() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const navigate = useNavigate();

  const defaults = normalizeCourseMetadata({ learning_product_type: "standard_course" });
  const [form, setForm] = useState({
    title_en: "",
    title_ar: "",
    description_en: "",
    description_ar: "",
    duration_en: "",
    level_en: "Beginner",
    is_free: true,
    price_usd: 0,
    learning_product_type: defaults.learning_product_type as ProductType,
    delivery_mode: defaults.delivery_mode as DeliveryMode,
    requires_cohort: defaults.requires_cohort,
    supports_assessments: defaults.supports_assessments,
    supports_projects: defaults.supports_projects,
    supports_live_sessions: defaults.supports_live_sessions,
  });

  const createCourse = useMutation({
    mutationFn: async () => {
      if (!form.title_en.trim()) throw new Error("Course title is required");
      const slug = form.title_en.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
      const meta = normalizeCourseMetadata({
        learning_product_type: form.learning_product_type,
        delivery_mode: form.delivery_mode,
        requires_cohort: form.requires_cohort,
        supports_assessments: form.supports_assessments,
        supports_projects: form.supports_projects,
        supports_live_sessions: form.supports_live_sessions,
      });
      const { data, error } = await supabase.from("training_courses").insert({
        title_en: form.title_en,
        title_ar: form.title_ar || null,
        description_en: form.description_en || null,
        description_ar: form.description_ar || null,
        duration_en: form.duration_en || null,
        level_en: form.level_en,
        is_free: form.is_free,
        price_usd: form.is_free ? 0 : form.price_usd,
        ...meta,
        slug,
        instructor_id: user!.id,
        status: "draft",
      } as any).select("id").single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(isAr ? "تم إنشاء الدورة" : "Course created");
      navigate(`/instructor/workspace/courses/${data.id}/edit`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title_en="Create New Course"
        title_ar="إنشاء دورة جديدة"
        description_en="Set up the basics for your new course"
        description_ar="إعداد أساسيات دورتك الجديدة"
      />

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="course-title-en">{isAr ? "عنوان الدورة (English)" : "Course Title (English)"} *</Label>
              <Input id="course-title-en" value={form.title_en} onChange={e => setForm(f => ({ ...f, title_en: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="course-title-ar">{isAr ? "عنوان الدورة (عربي)" : "Course Title (Arabic)"}</Label>
              <Input id="course-title-ar" value={form.title_ar} onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))} dir="rtl" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="course-desc-en">{isAr ? "الوصف (English)" : "Description (English)"}</Label>
            <Textarea id="course-desc-en" rows={3} value={form.description_en} onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="course-desc-ar">{isAr ? "الوصف (عربي)" : "Description (Arabic)"}</Label>
            <Textarea id="course-desc-ar" rows={3} value={form.description_ar} onChange={e => setForm(f => ({ ...f, description_ar: e.target.value }))} dir="rtl" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{isAr ? "نوع المنتج" : "Product Type"}</Label>
              <Select
                value={form.learning_product_type}
                onValueChange={(v) => {
                  const pt = v as ProductType;
                  const d = normalizeCourseMetadata({ learning_product_type: pt });
                  setForm(f => ({
                    ...f,
                    learning_product_type: pt,
                    delivery_mode: d.delivery_mode,
                    requires_cohort: d.requires_cohort,
                    supports_assessments: d.supports_assessments,
                    supports_projects: d.supports_projects,
                    supports_live_sessions: d.supports_live_sessions,
                  }));
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map(pt => (
                    <SelectItem key={pt} value={pt}>{isAr ? PRODUCT_TYPE_LABELS[pt].ar : PRODUCT_TYPE_LABELS[pt].en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{isAr ? "طريقة التقديم" : "Delivery Mode"}</Label>
              <Select value={form.delivery_mode} onValueChange={(v) => setForm(f => ({ ...f, delivery_mode: v as DeliveryMode }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DELIVERY_MODES.map(dm => (
                    <SelectItem key={dm} value={dm}>{isAr ? DELIVERY_MODE_LABELS[dm].ar : DELIVERY_MODE_LABELS[dm].en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="course-duration">{isAr ? "المدة" : "Duration"}</Label>
              <Input id="course-duration" placeholder="e.g. 8 weeks" value={form.duration_en} onChange={e => setForm(f => ({ ...f, duration_en: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{isAr ? "المستوى" : "Level"}</Label>
              <Select value={form.level_en} onValueChange={v => setForm(f => ({ ...f, level_en: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">{isAr ? "مبتدئ" : "Beginner"}</SelectItem>
                  <SelectItem value="Intermediate">{isAr ? "متوسط" : "Intermediate"}</SelectItem>
                  <SelectItem value="Advanced">{isAr ? "متقدم" : "Advanced"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Capability toggles */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.supports_live_sessions} onCheckedChange={v => setForm(f => ({ ...f, supports_live_sessions: v }))} />
              {isAr ? "جلسات مباشرة" : "Live Sessions"}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.supports_projects} onCheckedChange={v => setForm(f => ({ ...f, supports_projects: v }))} />
              {isAr ? "مشاريع" : "Projects"}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.supports_assessments} onCheckedChange={v => setForm(f => ({ ...f, supports_assessments: v }))} />
              {isAr ? "تقييمات" : "Assessments"}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.requires_cohort} onCheckedChange={v => setForm(f => ({ ...f, requires_cohort: v }))} />
              {isAr ? "دفعة جماعية" : "Cohort"}
            </label>
          </div>

          <div className="flex items-center gap-4 p-3 rounded-lg border">
            <div className="flex-1">
              <p className="text-sm font-medium">{isAr ? "دورة مجانية" : "Free Course"}</p>
              <p className="text-[10px] text-muted-foreground">{isAr ? "اجعل الدورة متاحة مجاناً" : "Make the course available for free"}</p>
            </div>
            <Switch checked={form.is_free} onCheckedChange={v => setForm(f => ({ ...f, is_free: v }))} />
          </div>

          {!form.is_free && (
            <div className="space-y-1.5">
              <Label htmlFor="course-price">{isAr ? "السعر (USD)" : "Price (USD)"}</Label>
              <Input id="course-price" type="number" min={0} value={form.price_usd} onChange={e => setForm(f => ({ ...f, price_usd: Number(e.target.value) }))} />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => createCourse.mutate()} disabled={createCourse.isPending || !form.title_en.trim()}>
          {createCourse.isPending ? <Loader2 className="h-4 w-4 me-1.5 animate-spin" /> : <Save className="h-4 w-4 me-1.5" />}
          {isAr ? "إنشاء الدورة" : "Create Course"}
        </Button>
      </div>
    </div>
  );
}
