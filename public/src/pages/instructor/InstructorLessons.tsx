import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ConfirmDeleteDialog from "@/components/admin/ConfirmDeleteDialog";
import {
  ArrowLeft, Loader2, Plus, Play, FileText, ChevronDown,
  Pencil, Trash2, Eye, BookOpen, Clock, Save, Layers,
} from "lucide-react";
import { toast } from "sonner";

interface Module {
  id: string;
  course_id: string;
  title_en: string;
  title_ar: string | null;
  sort_order: number | null;
  duration: string | null;
  lessons: number | null;
  created_at: string;
}

interface Lesson {
  id: string;
  course_id: string;
  module_id: string | null;
  title_en: string;
  title_ar: string | null;
  description_en: string | null;
  description_ar: string | null;
  content_type: string;
  video_url: string | null;
  text_content: string | null;
  text_content_ar: string | null;
  video_duration_seconds: number | null;
  is_preview: boolean | null;
  is_published: boolean | null;
  sort_order: number | null;
  attachment_urls: string[] | null;
}

const emptyLessonForm = {
  title_en: "",
  title_ar: "",
  module_id: "",
  content_type: "video",
  video_url: "",
  text_content: "",
  text_content_ar: "",
  description_en: "",
  description_ar: "",
  is_preview: false,
  sort_order: 0,
};

export default function InstructorLessons() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState(emptyLessonForm);
  const [saving, setSaving] = useState(false);

  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editModuleTitle, setEditModuleTitle] = useState("");
  const [addingModule, setAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<{ type: "module" | "lesson"; id: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  // Fetch course
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ["instructor-course", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_courses")
        .select("*")
        .eq("id", courseId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  // Verify ownership
  useEffect(() => {
    if (course && user && course.instructor_id !== user.id) {
      toast.error(isAr ? "غير مصرح" : "Unauthorized");
      navigate("/instructor/workspace/courses");
    }
  }, [course, user]);

  // Fetch modules
  const { data: modules = [] } = useQuery({
    queryKey: ["course-modules", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_modules")
        .select("*")
        .eq("course_id", courseId!)
        .order("sort_order");
      if (error) throw error;
      return data as Module[];
    },
    enabled: !!courseId,
  });

  // Fetch lessons
  const { data: lessons = [] } = useQuery({
    queryKey: ["course-lessons", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_lessons")
        .select("*")
        .eq("course_id", courseId!)
        .order("sort_order");
      if (error) throw error;
      return data as Lesson[];
    },
    enabled: !!courseId,
  });

  // Init open state
  useEffect(() => {
    if (modules.length && !Object.keys(openModules).length) {
      const init: Record<string, boolean> = {};
      modules.forEach((m) => (init[m.id] = true));
      setOpenModules(init);
    }
  }, [modules]);

  const totalLessons = lessons.length;
  const totalDurationSec = lessons.reduce((s, l) => s + (l.video_duration_seconds || 0), 0);
  const totalDurationHrs = Math.round((totalDurationSec / 3600) * 10) / 10;

  // ---------- Module CRUD ----------
  async function addModule() {
    if (!newModuleTitle.trim()) return;
    setAddingModule(true);
    const { error } = await supabase.from("course_modules").insert({
      course_id: courseId!,
      title_en: newModuleTitle.trim(),
      sort_order: modules.length,
    });
    setAddingModule(false);
    if (error) { toast.error(error.message); return; }
    setNewModuleTitle("");
    qc.invalidateQueries({ queryKey: ["course-modules", courseId] });
    toast.success(isAr ? "تمت إضافة الوحدة" : "Module added");
  }

  async function saveModuleTitle(moduleId: string) {
    if (!editModuleTitle.trim()) { setEditingModuleId(null); return; }
    const { error } = await supabase
      .from("course_modules")
      .update({ title_en: editModuleTitle.trim() })
      .eq("id", moduleId);
    if (error) toast.error(error.message);
    else toast.success(isAr ? "تم التحديث" : "Updated");
    setEditingModuleId(null);
    qc.invalidateQueries({ queryKey: ["course-modules", courseId] });
  }

  // ---------- Lesson CRUD ----------
  function openNewLesson(moduleId: string) {
    setEditingLessonId(null);
    setLessonForm({ ...emptyLessonForm, module_id: moduleId, sort_order: lessons.filter((l) => l.module_id === moduleId).length });
    setLessonDialogOpen(true);
  }

  function openEditLesson(lesson: Lesson) {
    setEditingLessonId(lesson.id);
    setLessonForm({
      title_en: lesson.title_en,
      title_ar: lesson.title_ar || "",
      module_id: lesson.module_id || "",
      content_type: lesson.content_type,
      video_url: lesson.video_url || "",
      text_content: lesson.text_content || "",
      text_content_ar: lesson.text_content_ar || "",
      description_en: lesson.description_en || "",
      description_ar: lesson.description_ar || "",
      is_preview: lesson.is_preview || false,
      sort_order: lesson.sort_order || 0,
    });
    setLessonDialogOpen(true);
  }

  async function saveLesson() {
    if (!lessonForm.title_en.trim()) { toast.error(isAr ? "العنوان مطلوب" : "Title is required"); return; }
    setSaving(true);
    const payload: any = {
      course_id: courseId!,
      module_id: lessonForm.module_id || null,
      title_en: lessonForm.title_en.trim(),
      title_ar: lessonForm.title_ar.trim() || null,
      content_type: lessonForm.content_type,
      video_url: lessonForm.video_url || null,
      text_content: lessonForm.text_content || null,
      text_content_ar: lessonForm.text_content_ar || null,
      description_en: lessonForm.description_en || null,
      description_ar: lessonForm.description_ar || null,
      is_preview: lessonForm.is_preview,
      sort_order: lessonForm.sort_order,
    };

    let error;
    if (editingLessonId) {
      ({ error } = await supabase.from("course_lessons").update(payload).eq("id", editingLessonId));
    } else {
      ({ error } = await supabase.from("course_lessons").insert(payload));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setLessonDialogOpen(false);
    qc.invalidateQueries({ queryKey: ["course-lessons", courseId] });
    await syncCourseStats();
    toast.success(isAr ? "تم الحفظ" : "Saved");
  }

  async function togglePublished(lesson: Lesson) {
    const { error } = await supabase
      .from("course_lessons")
      .update({ is_published: !lesson.is_published })
      .eq("id", lesson.id);
    if (error) toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["course-lessons", courseId] });
  }

  // ---------- Delete ----------
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const table = deleteTarget.type === "module" ? "course_modules" : "course_lessons";
    const { error } = await supabase.from(table).delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) { toast.error(error.message); return; }
    setDeleteTarget(null);
    qc.invalidateQueries({ queryKey: [deleteTarget.type === "module" ? "course-modules" : "course-lessons", courseId] });
    await syncCourseStats();
    toast.success(isAr ? "تم الحذف" : "Deleted");
  }

  // ---------- Sync stats ----------
  async function syncCourseStats() {
    const { data: allLessons } = await supabase
      .from("course_lessons")
      .select("video_duration_seconds")
      .eq("course_id", courseId!);
    const count = allLessons?.length || 0;
    const hrs = Math.round(((allLessons || []).reduce((s, l) => s + (l.video_duration_seconds || 0), 0) / 3600) * 10) / 10;
    await supabase
      .from("training_courses")
      .update({ total_lessons: count, total_duration_hours: hrs })
      .eq("id", courseId!);
    qc.invalidateQueries({ queryKey: ["instructor-course", courseId] });
  }

  // ---------- Helpers ----------
  function getVideoEmbed(url: string) {
    if (!url) return null;
    const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?#]+)/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    const vm = url.match(/vimeo\.com\/(\d+)/);
    if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
    return null;
  }

  function lessonsForModule(moduleId: string) {
    return lessons.filter((l) => l.module_id === moduleId);
  }

  const unassignedLessons = lessons.filter((l) => !l.module_id);

  if (courseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) return null;

  const courseTitle = isAr ? (course.title_ar || course.title_en) : course.title_en;

  return (
    <>
      <SEO title={`${courseTitle} — ${isAr ? "الدروس" : "Lessons"}`} noIndex />

      <div className="container max-w-5xl mx-auto py-8 px-4" dir={isAr ? "rtl" : "ltr"}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/instructor/workspace/courses">
            <Button variant="ghost" size="icon"><ArrowLeft className="icon-flip-rtl h-5 w-5" /></Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{courseTitle}</h1>
            <p className="text-muted-foreground text-sm">
              {isAr ? "إدارة الوحدات والدروس" : "Manage modules & lessons"}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/instructor/workspace/courses/${courseId}/structure`}>
              <Layers className="h-4 w-4 me-1" />{isAr ? "الهيكل" : "Structure"}
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalLessons}</p>
                <p className="text-xs text-muted-foreground">{isAr ? "درس" : "Lessons"}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalDurationHrs}h</p>
                <p className="text-xs text-muted-foreground">{isAr ? "المدة الإجمالية" : "Total Duration"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modules */}
        <div className="space-y-4">
          {modules.map((mod) => (
            <Collapsible
              key={mod.id}
              open={openModules[mod.id] ?? true}
              onOpenChange={(o) => setOpenModules((prev) => ({ ...prev, [mod.id]: o }))}
            >
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    {editingModuleId === mod.id ? (
                      <Input
                        value={editModuleTitle}
                        onChange={(e) => setEditModuleTitle(e.target.value)}
                        onBlur={() => saveModuleTitle(mod.id)}
                        onKeyDown={(e) => e.key === "Enter" && saveModuleTitle(mod.id)}
                        autoFocus
                        className="max-w-sm"
                      />
                    ) : (
                      <CollapsibleTrigger asChild>
                        <button className="flex items-center gap-2 text-start font-semibold hover:text-primary transition-colors">
                          <ChevronDown className={`h-4 w-4 transition-transform ${openModules[mod.id] ? "" : "-rotate-90"}`} />
                          {isAr ? (mod.title_ar || mod.title_en) : mod.title_en}
                          <Badge variant="secondary" className="ms-2">{lessonsForModule(mod.id).length}</Badge>
                        </button>
                      </CollapsibleTrigger>
                    )}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => { setEditingModuleId(mod.id); setEditModuleTitle(mod.title_en); }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => setDeleteTarget({ type: "module", id: mod.id })}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-2">
                    {lessonsForModule(mod.id).map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors"
                      >
                        {lesson.content_type === "video" ? (
                          <Play className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {isAr ? (lesson.title_ar || lesson.title_en) : lesson.title_en}
                          </p>
                          {lesson.video_duration_seconds ? (
                            <span className="text-xs text-muted-foreground">
                              {Math.floor(lesson.video_duration_seconds / 60)}:{String(lesson.video_duration_seconds % 60).padStart(2, "0")}
                            </span>
                          ) : null}
                        </div>
                        {lesson.is_preview && <Badge variant="outline" className="shrink-0"><Eye className="h-3 w-3 me-1" />{isAr ? "معاينة" : "Preview"}</Badge>}
                        <Switch
                          checked={lesson.is_published ?? true}
                          onCheckedChange={() => togglePublished(lesson)}
                          aria-label="Published"
                        />
                        <Button variant="ghost" size="icon" onClick={() => openEditLesson(lesson)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ type: "lesson", id: lesson.id })}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}

                    <Button variant="outline" size="sm" className="mt-2" onClick={() => openNewLesson(mod.id)}>
                      <Plus className="h-4 w-4 me-1" />{isAr ? "إضافة درس" : "Add Lesson"}
                    </Button>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}

          {/* Unassigned lessons */}
          {unassignedLessons.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm text-muted-foreground">{isAr ? "دروس بدون وحدة" : "Unassigned Lessons"}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {unassignedLessons.map((lesson) => (
                  <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-lg border">
                    {lesson.content_type === "video" ? <Play className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-primary" />}
                    <span className="flex-1 text-sm">{isAr ? (lesson.title_ar || lesson.title_en) : lesson.title_en}</span>
                    <Button variant="ghost" size="icon" onClick={() => openEditLesson(lesson)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ type: "lesson", id: lesson.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Add module */}
          <Card className="border-dashed">
            <CardContent className="flex items-center gap-2 py-4">
              <Input
                placeholder={isAr ? "عنوان الوحدة الجديدة" : "New module title"}
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addModule()}
                className="flex-1"
              />
              <Button onClick={addModule} disabled={addingModule || !newModuleTitle.trim()}>
                {addingModule ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 me-1" />}
                {isAr ? "إضافة وحدة" : "Add Module"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lesson Editor Dialog */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLessonId ? (isAr ? "تعديل الدرس" : "Edit Lesson") : (isAr ? "إضافة درس" : "Add Lesson")}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isAr ? "العنوان (EN)" : "Title (EN)"}</Label>
                <Input value={lessonForm.title_en} onChange={(e) => setLessonForm((f) => ({ ...f, title_en: e.target.value }))} />
              </div>
              <div>
                <Label>{isAr ? "العنوان (AR)" : "Title (AR)"}</Label>
                <Input value={lessonForm.title_ar} onChange={(e) => setLessonForm((f) => ({ ...f, title_ar: e.target.value }))} dir="rtl" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isAr ? "الوحدة" : "Module"}</Label>
                <Select value={lessonForm.module_id} onValueChange={(v) => setLessonForm((f) => ({ ...f, module_id: v }))}>
                  <SelectTrigger><SelectValue placeholder={isAr ? "اختر وحدة" : "Select module"} /></SelectTrigger>
                  <SelectContent>
                    {modules.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{isAr ? (m.title_ar || m.title_en) : m.title_en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isAr ? "نوع المحتوى" : "Content Type"}</Label>
                <Select value={lessonForm.content_type} onValueChange={(v) => setLessonForm((f) => ({ ...f, content_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">{isAr ? "فيديو" : "Video"}</SelectItem>
                    <SelectItem value="text">{isAr ? "نص" : "Text"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {lessonForm.content_type === "video" && (
              <div>
                <Label>{isAr ? "رابط الفيديو" : "Video URL"}</Label>
                <Input value={lessonForm.video_url} onChange={(e) => setLessonForm((f) => ({ ...f, video_url: e.target.value }))} placeholder="https://youtube.com/watch?v=..." />
                {getVideoEmbed(lessonForm.video_url) && (
                  <div className="mt-2 rounded-lg overflow-hidden aspect-video">
                    <iframe src={getVideoEmbed(lessonForm.video_url)!} className="w-full h-full" allowFullScreen />
                  </div>
                )}
              </div>
            )}

            {lessonForm.content_type === "text" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{isAr ? "المحتوى (EN)" : "Text Content (EN)"}</Label>
                  <Textarea rows={6} value={lessonForm.text_content} onChange={(e) => setLessonForm((f) => ({ ...f, text_content: e.target.value }))} />
                </div>
                <div>
                  <Label>{isAr ? "المحتوى (AR)" : "Text Content (AR)"}</Label>
                  <Textarea rows={6} value={lessonForm.text_content_ar} onChange={(e) => setLessonForm((f) => ({ ...f, text_content_ar: e.target.value }))} dir="rtl" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isAr ? "الوصف (EN)" : "Description (EN)"}</Label>
                <Textarea rows={2} value={lessonForm.description_en} onChange={(e) => setLessonForm((f) => ({ ...f, description_en: e.target.value }))} />
              </div>
              <div>
                <Label>{isAr ? "الوصف (AR)" : "Description (AR)"}</Label>
                <Textarea rows={2} value={lessonForm.description_ar} onChange={(e) => setLessonForm((f) => ({ ...f, description_ar: e.target.value }))} dir="rtl" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Switch checked={lessonForm.is_preview} onCheckedChange={(c) => setLessonForm((f) => ({ ...f, is_preview: c }))} />
                <Label>{isAr ? "معاينة مجانية" : "Free Preview"}</Label>
              </div>
              <div>
                <Label>{isAr ? "ترتيب العرض" : "Sort Order"}</Label>
                <Input type="number" value={lessonForm.sort_order} onChange={(e) => setLessonForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonDialogOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={saveLesson} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              <Save className="h-4 w-4 me-1" />{isAr ? "حفظ" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title={deleteTarget?.type === "module" ? (isAr ? "حذف الوحدة؟" : "Delete module?") : (isAr ? "حذف الدرس؟" : "Delete lesson?")}
        description={isAr ? "لا يمكن التراجع عن هذا الإجراء." : "This action cannot be undone."}
      />
    </>
  );
}
