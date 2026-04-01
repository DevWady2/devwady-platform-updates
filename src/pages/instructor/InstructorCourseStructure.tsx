/**
 * Instructor Workspace — Course Structure Management
 * ────────────────────────────────────────────────────
 * Route: /instructor/workspace/courses/:id/structure
 *
 * Tabbed management for milestones, assessments, and projects.
 * Uses the same CRUD patterns as InstructorLessons.
 */
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCourseMilestones, useCourseAssessments, useCourseProjects } from "@/portals/academy/hooks/useCourseStructure";
import { STRUCTURE_ITEM_LABELS } from "@/features/academy/learningModel";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import ConfirmDeleteDialog from "@/components/admin/ConfirmDeleteDialog";
import {
  ArrowLeft, Loader2, Plus, Pencil, Trash2, GripVertical,
  Flag, ClipboardCheck, FolderKanban,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ───────────────────────────────────────────────────
type StructureTab = "milestones" | "assessments" | "projects";

interface ItemForm {
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  is_required: boolean;
  sort_order: number;
  // assessment-only
  assessment_type?: string;
  instructions?: string;
  instructions_ar?: string;
  passing_score?: number | null;
  max_attempts?: number | null;
  module_id?: string;
  // project-only
  submission_type?: string;
  is_capstone?: boolean;
}

const emptyForm: ItemForm = {
  title_en: "", title_ar: "", description_en: "", description_ar: "",
  is_required: false, sort_order: 0,
  assessment_type: "quiz", instructions: "", instructions_ar: "",
  passing_score: null, max_attempts: null, module_id: "",
  submission_type: "url", is_capstone: false,
};

export default function InstructorCourseStructure() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const { id: courseId } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const [tab, setTab] = useState<StructureTab>("milestones");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ItemForm>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ tab: StructureTab; id: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Course info
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ["instructor-course", courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_courses")
        .select("id, title_en, title_ar, instructor_id, learning_product_type, delivery_mode, supports_assessments, supports_projects, supports_live_sessions, requires_cohort")
        .eq("id", courseId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Modules (for assessment module_id dropdown)
  const { data: modules = [] } = useQuery({
    queryKey: ["course-modules", courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_modules")
        .select("id, title_en")
        .eq("course_id", courseId!)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: milestones = [], isLoading: mlLoading } = useCourseMilestones(courseId);
  const { data: assessments = [], isLoading: asLoading } = useCourseAssessments(courseId);
  const { data: projects = [], isLoading: prLoading } = useCourseProjects(courseId);

  const tableMap = {
    milestones: "course_milestones",
    assessments: "course_assessments",
    projects: "course_projects",
  } as const;

  const queryKeyMap = {
    milestones: "course-milestones",
    assessments: "course-assessments",
    projects: "course-projects",
  } as const;

  const itemsMap = { milestones, assessments, projects };
  const loadingMap = { milestones: mlLoading, assessments: asLoading, projects: prLoading };

  // ── Helpers ──
  function openCreate() {
    setEditingId(null);
    const items = itemsMap[tab];
    setForm({ ...emptyForm, sort_order: items.length });
    setDialogOpen(true);
  }

  function openEdit(item: any) {
    setEditingId(item.id);
    setForm({
      title_en: item.title_en || "",
      title_ar: item.title_ar || "",
      description_en: item.description_en || "",
      description_ar: item.description_ar || "",
      is_required: item.is_required ?? false,
      sort_order: item.sort_order ?? 0,
      assessment_type: item.assessment_type || "quiz",
      instructions: item.instructions || "",
      instructions_ar: item.instructions_ar || "",
      passing_score: item.passing_score ?? null,
      max_attempts: item.max_attempts ?? null,
      module_id: item.module_id || "",
      submission_type: item.submission_type || "url",
      is_capstone: item.is_capstone ?? false,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.title_en.trim()) {
      toast.error(isAr ? "العنوان مطلوب" : "Title is required");
      return;
    }
    setSaving(true);
    const table = tableMap[tab];
    const base: Record<string, any> = {
      course_id: courseId!,
      title_en: form.title_en.trim(),
      title_ar: form.title_ar.trim() || null,
      description_en: form.description_en.trim() || null,
      description_ar: form.description_ar.trim() || null,
      is_required: form.is_required,
      sort_order: form.sort_order,
      created_by: user?.id ?? null,
    };

    if (tab === "assessments") {
      base.assessment_type = form.assessment_type || "quiz";
      base.instructions = form.instructions || null;
      base.instructions_ar = form.instructions_ar || null;
      base.passing_score = form.passing_score ?? null;
      base.max_attempts = form.max_attempts ?? null;
      base.module_id = form.module_id || null;
    }
    if (tab === "projects") {
      base.submission_type = form.submission_type || "url";
      base.instructions = form.instructions || null;
      base.instructions_ar = form.instructions_ar || null;
      base.is_capstone = form.is_capstone ?? false;
    }

    try {
      if (editingId) {
        const { error } = await supabase.from(table).update(base).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table).insert(base as any);
        if (error) throw error;
      }
      toast.success(isAr ? "تم الحفظ" : "Saved");
      setDialogOpen(false);
      qc.invalidateQueries({ queryKey: [queryKeyMap[tab], courseId] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase
      .from(tableMap[deleteTarget.tab])
      .delete()
      .eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) { toast.error(error.message); return; }
    setDeleteTarget(null);
    qc.invalidateQueries({ queryKey: [queryKeyMap[deleteTarget.tab], courseId] });
    toast.success(isAr ? "تم الحذف" : "Deleted");
  }

  async function togglePublished(itemTab: StructureTab, itemId: string, current: boolean) {
    const { error } = await supabase
      .from(tableMap[itemTab])
      .update({ is_published: !current })
      .eq("id", itemId);
    if (error) toast.error(error.message);
    qc.invalidateQueries({ queryKey: [queryKeyMap[itemTab], courseId] });
  }

  async function moveItem(itemTab: StructureTab, itemId: string, direction: "up" | "down") {
    const items = [...itemsMap[itemTab]].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const idx = items.findIndex((i) => i.id === itemId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;

    const table = tableMap[itemTab];
    await Promise.all([
      supabase.from(table).update({ sort_order: swapIdx }).eq("id", items[idx].id),
      supabase.from(table).update({ sort_order: idx }).eq("id", items[swapIdx].id),
    ]);
    qc.invalidateQueries({ queryKey: [queryKeyMap[itemTab], courseId] });
  }

  // ── Loading / error states ──
  if (courseLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!course) return null;

  const courseTitle = isAr ? (course.title_ar || course.title_en) : course.title_en;
  const c = course as any;
  const productType: string = c.learning_product_type || "standard_course";
  const isBootcamp = productType === "bootcamp_track";
  const isLive = productType === "live_course";
  const supportsAssessments = c.supports_assessments ?? false;
  const supportsProjects = c.supports_projects ?? false;
  const capstonesCount = projects.filter((p: any) => p.is_capstone).length;

  const tabIcons: Record<StructureTab, typeof Flag> = {
    milestones: Flag,
    assessments: ClipboardCheck,
    projects: FolderKanban,
  };

  function renderItemCard(itemTab: StructureTab, item: any, idx: number, total: number) {
    const Icon = tabIcons[itemTab];
    
    return (
      <div
        key={item.id}
        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/40 transition-colors"
      >
        <div className="flex flex-col gap-0.5">
          <Button
            variant="ghost" size="icon" className="h-5 w-5"
            disabled={idx === 0}
            onClick={() => moveItem(itemTab, item.id, "up")}
          >
            <GripVertical className="h-3 w-3 rotate-180" />
          </Button>
          <Button
            variant="ghost" size="icon" className="h-5 w-5"
            disabled={idx === total - 1}
            onClick={() => moveItem(itemTab, item.id, "down")}
          >
            <GripVertical className="h-3 w-3" />
          </Button>
        </div>
        <Icon className="h-4 w-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {isAr ? (item.title_ar || item.title_en) : item.title_en}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {item.is_required && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                {isAr ? "مطلوب" : "Required"}
              </Badge>
            )}
            {itemTab === "assessments" && item.assessment_type && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{item.assessment_type}</Badge>
            )}
            {itemTab === "projects" && item.is_capstone && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {isAr ? "مشروع تخرج" : "Capstone"}
              </Badge>
            )}
            {itemTab === "projects" && item.submission_type && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{item.submission_type}</Badge>
            )}
          </div>
        </div>
        <Switch
          checked={item.is_published ?? true}
          onCheckedChange={() => togglePublished(itemTab, item.id, item.is_published ?? true)}
          aria-label="Published"
        />
        <Button variant="ghost" size="icon" onClick={() => { setTab(itemTab); openEdit(item); }}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ tab: itemTab, id: item.id })}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    );
  }

  function renderList(itemTab: StructureTab) {
    const items = [...itemsMap[itemTab]].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const loading = loadingMap[itemTab];
    if (loading) return <div className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>;
    if (!items.length) {
      const emptyHints: Record<string, Record<StructureTab, { en: string; ar: string }>> = {
        bootcamp_track: {
          milestones: { en: "Bootcamp tracks need milestones to mark learner progress through phases.", ar: "المعسكرات تحتاج معالم لتتبع تقدم المتدربين عبر المراحل." },
          assessments: { en: "Add assessments to evaluate learner readiness at key checkpoints.", ar: "أضف تقييمات لقياس جاهزية المتدربين عند نقاط التحقق الرئيسية." },
          projects: { en: "Add at least one capstone project for learners to demonstrate mastery.", ar: "أضف مشروع تخرج واحد على الأقل ليُظهر المتدربون إتقانهم." },
        },
        live_course: {
          milestones: { en: "Optional: add milestones to structure your live course progression.", ar: "اختياري: أضف معالم لتنظيم تقدم الدورة المباشرة." },
          assessments: { en: "Optional: add assessments to check understanding during live sessions.", ar: "اختياري: أضف تقييمات للتحقق من الفهم أثناء الجلسات المباشرة." },
          projects: { en: "Optional: add projects for hands-on practice between sessions.", ar: "اختياري: أضف مشاريع للتطبيق العملي بين الجلسات." },
        },
      };
      const hint = emptyHints[productType]?.[itemTab];
      return (
        <div className="py-10 text-center text-muted-foreground text-sm space-y-2">
          <p>{isAr ? "لا توجد عناصر بعد" : `No ${itemTab} yet`}</p>
          {hint && <p className="text-xs max-w-md mx-auto">{isAr ? hint.ar : hint.en}</p>}
        </div>
      );
    }
    return (
      <div className="space-y-2">
        {items.map((item, idx) => renderItemCard(itemTab, item, idx, items.length))}
      </div>
    );
  }

  return (
    <>
      <SEO title={`${courseTitle} — ${isAr ? "الهيكل" : "Structure"}`} noIndex />

      <div className="container max-w-4xl mx-auto py-8 px-4" dir={isAr ? "rtl" : "ltr"}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/instructor/workspace/courses/${courseId}/edit`}>
              <ArrowLeft className="icon-flip-rtl h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{courseTitle}</h1>
            <p className="text-muted-foreground text-sm">
              {isAr ? "إدارة هيكل الدورة" : "Course Structure"}
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {isBootcamp ? (isAr ? "مسار معسكر" : "Bootcamp") : isLive ? (isAr ? "مباشر" : "Live") : (isAr ? "دورة" : "Standard")}
          </Badge>
        </div>

        {/* Product-type structure hints */}
        {isBootcamp && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 mb-5 text-sm space-y-1">
            <p className="font-medium text-primary">
              {isAr ? "هيكل المعسكر التدريبي" : "Bootcamp Structure"}
            </p>
            <p className="text-muted-foreground text-xs">
              {isAr
                ? "المعسكرات تتطلب معالم واضحة، تقييمات، ومشروع تخرج (Capstone). تأكد من إضافة مشروع تخرج واحد على الأقل."
                : "Bootcamps require clear milestones, assessments, and a capstone project. Ensure at least one project is marked as capstone."}
            </p>
            <div className="flex flex-wrap gap-3 pt-1 text-xs">
              <span>{isAr ? "معالم" : "Milestones"}: <strong>{milestones.length}</strong></span>
              <span>{isAr ? "تقييمات" : "Assessments"}: <strong>{assessments.length}</strong></span>
              <span>{isAr ? "مشاريع" : "Projects"}: <strong>{projects.length}</strong></span>
              <span>
                {isAr ? "مشروع تخرج" : "Capstone"}: <strong className={capstonesCount === 0 ? "text-destructive" : "text-primary"}>{capstonesCount}</strong>
              </span>
            </div>
          </div>
        )}
        {isLive && (
          <div className="rounded-lg border border-accent/40 bg-accent/5 p-3 mb-5 text-sm">
            <p className="font-medium">
              {isAr ? "دورة مباشرة" : "Live Course"}
            </p>
            <p className="text-muted-foreground text-xs">
              {isAr
                ? "يمكنك إضافة معالم وتقييمات اختيارية. الجلسات المباشرة تُدار من صفحة التسليم."
                : "You can add optional milestones and assessments. Live sessions are managed from the Delivery page."}
            </p>
          </div>
        )}
        {!isBootcamp && !isLive && (supportsAssessments || supportsProjects) && (
          <div className="rounded-lg border bg-muted/30 p-3 mb-5 text-sm text-muted-foreground">
            {isAr
              ? "هذه الدورة تدعم عناصر هيكلية إضافية. أضف معالم أو تقييمات أو مشاريع حسب الحاجة."
              : "This course supports optional structure items. Add milestones, assessments, or projects as needed."}
          </div>
        )}

        <Tabs value={tab} onValueChange={(v) => setTab(v as StructureTab)}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="milestones" className="gap-1.5">
                <Flag className="h-3.5 w-3.5" />
                {isAr ? STRUCTURE_ITEM_LABELS.milestone.ar : "Milestones"}
                <Badge variant="secondary" className="text-[10px] px-1.5 ms-1">{milestones.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="assessments" className="gap-1.5">
                <ClipboardCheck className="h-3.5 w-3.5" />
                {isAr ? STRUCTURE_ITEM_LABELS.assessment.ar : "Assessments"}
                <Badge variant="secondary" className="text-[10px] px-1.5 ms-1">{assessments.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="projects" className="gap-1.5">
                <FolderKanban className="h-3.5 w-3.5" />
                {isAr ? STRUCTURE_ITEM_LABELS.project.ar : "Projects"}
                <Badge variant="secondary" className="text-[10px] px-1.5 ms-1">{projects.length}</Badge>
              </TabsTrigger>
            </TabsList>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 me-1" />
              {isAr ? "إضافة" : "Add"}
            </Button>
          </div>

          <TabsContent value="milestones">{renderList("milestones")}</TabsContent>
          <TabsContent value="assessments">{renderList("assessments")}</TabsContent>
          <TabsContent value="projects">{renderList("projects")}</TabsContent>
        </Tabs>
      </div>

      {/* ── Create/Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? (isAr ? "تعديل" : "Edit")
                : (isAr ? "إضافة" : "Add")}{" "}
              {isAr ? STRUCTURE_ITEM_LABELS[tab === "milestones" ? "milestone" : tab === "assessments" ? "assessment" : "project"].ar
                : tab === "milestones" ? "Milestone" : tab === "assessments" ? "Assessment" : "Project"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Title (EN) *</Label>
                <Input value={form.title_en} onChange={(e) => setForm((f) => ({ ...f, title_en: e.target.value }))} />
              </div>
              <div>
                <Label>Title (AR)</Label>
                <Input value={form.title_ar} onChange={(e) => setForm((f) => ({ ...f, title_ar: e.target.value }))} dir="rtl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{isAr ? "الوصف (EN)" : "Description (EN)"}</Label>
                <Textarea value={form.description_en} onChange={(e) => setForm((f) => ({ ...f, description_en: e.target.value }))} rows={3} />
              </div>
              <div>
                <Label>{isAr ? "الوصف (AR)" : "Description (AR)"}</Label>
                <Textarea value={form.description_ar} onChange={(e) => setForm((f) => ({ ...f, description_ar: e.target.value }))} rows={3} dir="rtl" />
              </div>
            </div>

            {/* Assessment-specific */}
            {tab === "assessments" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{isAr ? "نوع التقييم" : "Assessment Type"}</Label>
                    <Select value={form.assessment_type} onValueChange={(v) => setForm((f) => ({ ...f, assessment_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quiz">{isAr ? "اختبار" : "Quiz"}</SelectItem>
                        <SelectItem value="manual">{isAr ? "يدوي" : "Manual"}</SelectItem>
                        <SelectItem value="external">{isAr ? "خارجي" : "External"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{isAr ? "الوحدة" : "Module"}</Label>
                    <Select value={form.module_id || ""} onValueChange={(v) => setForm((f) => ({ ...f, module_id: v }))}>
                      <SelectTrigger><SelectValue placeholder={isAr ? "بدون وحدة" : "No module"} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">{isAr ? "بدون وحدة" : "None"}</SelectItem>
                        {modules.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.title_en}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{isAr ? "درجة النجاح" : "Passing Score"}</Label>
                    <Input type="number" value={form.passing_score ?? ""} onChange={(e) => setForm((f) => ({ ...f, passing_score: e.target.value ? Number(e.target.value) : null }))} />
                  </div>
                  <div>
                    <Label>{isAr ? "أقصى محاولات" : "Max Attempts"}</Label>
                    <Input type="number" value={form.max_attempts ?? ""} onChange={(e) => setForm((f) => ({ ...f, max_attempts: e.target.value ? Number(e.target.value) : null }))} />
                  </div>
                </div>
                <div>
                  <Label>{isAr ? "التعليمات" : "Instructions"}</Label>
                  <Textarea value={form.instructions} onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))} rows={2} />
                </div>
              </>
            )}

            {/* Project-specific */}
            {tab === "projects" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{isAr ? "نوع التسليم" : "Submission Type"}</Label>
                    <Select value={form.submission_type} onValueChange={(v) => setForm((f) => ({ ...f, submission_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">{isAr ? "نص" : "Text"}</SelectItem>
                        <SelectItem value="url">{isAr ? "رابط" : "URL"}</SelectItem>
                        <SelectItem value="file">{isAr ? "ملف" : "File"}</SelectItem>
                        <SelectItem value="external">{isAr ? "خارجي" : "External"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 text-sm">
                      <Switch checked={form.is_capstone} onCheckedChange={(v) => setForm((f) => ({ ...f, is_capstone: v }))} />
                      {isAr ? "مشروع تخرج" : "Capstone Project"}
                    </label>
                  </div>
                </div>
                <div>
                  <Label>{isAr ? "التعليمات" : "Instructions"}</Label>
                  <Textarea value={form.instructions} onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))} rows={2} />
                </div>
              </>
            )}

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.is_required} onCheckedChange={(v) => setForm((f) => ({ ...f, is_required: v }))} />
                {isAr ? "مطلوب" : "Required"}
              </label>
              <div className="flex items-center gap-2">
                <Label className="text-sm">{isAr ? "الترتيب" : "Order"}</Label>
                <Input
                  type="number" className="w-20"
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 me-1 animate-spin" />}
              {isAr ? "حفظ" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm ── */}
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </>
  );
}
