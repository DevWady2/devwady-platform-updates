import SEO from "@/components/SEO";
import { useState } from "react";
import ConfirmDeleteDialog from "@/components/admin/ConfirmDeleteDialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, GraduationCap, CheckCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { getIcon } from "@/lib/iconMap";
import CourseFormDialog from "@/components/admin/CourseFormDialog";

export default function AdminTraining() {
  const { t, lang } = useLanguage();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [tab, setTab] = useState("all");

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["admin-training-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_courses")
        .select("*, course_modules(count), course_webinars(count)")
        .order("sort_order");
      if (error) throw error;
      return data;
    } });

  // Fetch instructor profiles
  const instructorIds = [...new Set(courses.filter((c: any) => c.instructor_id).map((c: any) => c.instructor_id))];
  const { data: instructorProfiles = [] } = useQuery({
    queryKey: ["admin-instructor-profiles", instructorIds],
    queryFn: async () => {
      if (!instructorIds.length) return [];
      const { data } = await supabase.from("profiles").select("user_id, full_name").in("user_id", instructorIds);
      return data || [];
    },
    enabled: instructorIds.length > 0 });
  const instructorMap = Object.fromEntries((instructorProfiles as any[]).map((p) => [p.user_id, p.full_name]));

  // Fetch enrollment counts per course
  const courseIds = courses.map((c: any) => c.id);
  const { data: enrollmentData = [] } = useQuery({
    queryKey: ["admin-course-enrollments", courseIds],
    queryFn: async () => {
      if (!courseIds.length) return [];
      const { data } = await supabase
        .from("course_enrollments")
        .select("course_id, status")
        .in("course_id", courseIds);
      return data || [];
    },
    enabled: courseIds.length > 0 });

  // Fetch revenue per course
  const { data: paymentData = [] } = useQuery({
    queryKey: ["admin-course-payments", courseIds],
    queryFn: async () => {
      if (!courseIds.length) return [];
      const { data } = await supabase
        .from("payments")
        .select("reference_id, amount_usd, status")
        .eq("reference_type", "course_enrollment")
        .eq("status", "paid")
        .in("reference_id", courseIds);
      return data || [];
    },
    enabled: courseIds.length > 0 });

  const enrollmentCounts: Record<string, number> = {};
  (enrollmentData as any[]).forEach((e) => {
    if (e.status === "active" || e.status === "completed") {
      enrollmentCounts[e.course_id] = (enrollmentCounts[e.course_id] || 0) + 1;
    }
  });

  const revenueByCourse: Record<string, number> = {};
  (paymentData as any[]).forEach((p) => {
    if (p.reference_id) {
      revenueByCourse[p.reference_id] = (revenueByCourse[p.reference_id] || 0) + Number(p.amount_usd);
    }
  });

  const filteredCourses = tab === "all"
    ? courses
    : tab === "pending_review"
    ? courses.filter((c: any) => c.status === "pending_review")
    : courses.filter((c: any) => c.status === tab);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("training_courses").delete().eq("id", deleteTarget);
    if (error) toast.error(error.message);
    else { toast.success(t("admin.delete")); qc.invalidateQueries({ queryKey: ["admin-training-courses"] }); }
    setDeleting(false); setDeleteTarget(null);
  };

  const handleStatusChange = async (courseId: string, newStatus: string, instructorId?: string) => {
    const { error } = await supabase.from("training_courses").update({ status: newStatus }).eq("id", courseId);
    if (error) { toast.error(error.message); return; }

    if (instructorId) {
      const action = newStatus === "published" ? "approved and published" : "returned for changes";
      const actionAr = newStatus === "published" ? "تمت الموافقة ونشرها" : "أُعيدت للتعديل";
      await supabase.rpc("create_notification", {
        _user_id: instructorId,
        _type: "course_status",
        _title_en: `Your course was ${action}`,
        _title_ar: `دورتك ${actionAr}`,
        _link: "/instructor/dashboard" });
    }

    toast.success(lang === "ar" ? "تم تحديث الحالة" : "Status updated");
    qc.invalidateQueries({ queryKey: ["admin-training-courses"] });
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      published: { variant: "default", label: lang === "ar" ? "منشور" : "Published" },
      draft: { variant: "secondary", label: lang === "ar" ? "مسودة" : "Draft" },
      pending_review: { variant: "outline", label: lang === "ar" ? "قيد المراجعة" : "Pending Review" },
      archived: { variant: "destructive", label: lang === "ar" ? "مؤرشف" : "Archived" } };
    const s = map[status] || { variant: "secondary" as const, label: status };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const pendingCount = courses.filter((c: any) => c.status === "pending_review").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl admin-gradient-header flex items-center justify-center shadow-lg"><GraduationCap className="h-5 w-5 text-white" /></div>
          <div><h1 className="admin-page-title">{t("admin.trainingAcademy")}</h1><p className="admin-page-subtitle">{t("admin.manageTraining")}</p></div>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="admin-gradient-header text-white border-0 shadow-md hover:shadow-lg transition-shadow rounded-xl"><Plus className="h-4 w-4 me-2" /> {t("admin.addCourse")}</Button>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">{lang === "ar" ? "الكل" : "All"} ({courses.length})</TabsTrigger>
          <TabsTrigger value="published">{lang === "ar" ? "منشور" : "Published"}</TabsTrigger>
          <TabsTrigger value="draft">{lang === "ar" ? "مسودة" : "Draft"}</TabsTrigger>
          <TabsTrigger value="pending_review" className="relative">
            {lang === "ar" ? "قيد المراجعة" : "Pending Review"}
            {pendingCount > 0 && (
              <span className="ms-1.5 bg-amber-500 text-white text-[10px] rounded-full h-4 w-4 inline-flex items-center justify-center">{pendingCount}</span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5" /> {t("admin.courses")} ({filteredCourses.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p className="text-muted-foreground text-sm">{t("admin.loading")}</p> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="w-12">{t("admin.icon")}</TableHead>
                  <TableHead>{t("admin.titleEN")}</TableHead>
                  <TableHead>{lang === "ar" ? "المعلم" : "Instructor"}</TableHead>
                  <TableHead>{lang === "ar" ? "الطلاب" : "Students"}</TableHead>
                  <TableHead>{lang === "ar" ? "الإيرادات" : "Revenue"}</TableHead>
                  <TableHead>{lang === "ar" ? "المستوى" : "Level"}</TableHead>
                  <TableHead className="w-28">{t("admin.status")}</TableHead>
                  <TableHead className="w-32">{t("admin.actions")}</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filteredCourses.map((c: any) => {
                    const IC = getIcon(c.icon);
                    const students = enrollmentCounts[c.id] || 0;
                    const revenue = revenueByCourse[c.id] || 0;
                    const instructorName = c.instructor_id ? instructorMap[c.instructor_id] : null;
                    return (
    <>
    <SEO title="Training — Admin" noIndex />
                      <TableRow key={c.id}>
                        <TableCell><div className="flex items-center gap-1"><span>{c.emoji}</span><IC className="h-4 w-4 text-primary" /></div></TableCell>
                        <TableCell className="font-medium">{c.title_en}</TableCell>
                        <TableCell className="text-sm">
                          {instructorName ? (
                            <span className="text-primary">{instructorName}</span>
                          ) : (
                            <Badge variant="secondary" className="text-xs">{lang === "ar" ? "ديف وادي" : "DevWady"}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{students}</TableCell>
                        <TableCell className="text-sm font-medium">{revenue > 0 ? `$${revenue.toLocaleString()}` : "—"}</TableCell>
                        <TableCell className="text-sm">{c.level_en || "—"}</TableCell>
                        <TableCell>{statusBadge(c.status || "published")}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {c.status === "pending_review" && (
                              <>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" title="Approve & Publish" onClick={() => handleStatusChange(c.id, "published", c.instructor_id)}>
                                  <CheckCircle className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600" title="Request Changes" onClick={() => handleStatusChange(c.id, "draft", c.instructor_id)}>
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(c); setDialogOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
    </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <CourseFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-training-courses"] })} initial={editing} />
      <ConfirmDeleteDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }} onConfirm={confirmDelete} loading={deleting} />
    </div>
  );
}
