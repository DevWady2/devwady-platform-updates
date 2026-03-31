import SEO from "@/components/SEO";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, CheckCircle, XCircle, ExternalLink, Clock, Users, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function AdminInstructorApps() {
  const { t, lang } = useLanguage();
  const qc = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["admin-instructor-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructor_applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch profiles for avatars
  const userIds = applications.map((a: any) => a.user_id);
  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-instructor-profiles", userIds],
    queryFn: async () => {
      if (!userIds.length) return [];
      const { data } = await supabase
        .from("profiles")
        .select("user_id, avatar_url, full_name")
        .in("user_id", userIds);
      return data || [];
    },
    enabled: userIds.length > 0,
  });

  const profileMap = Object.fromEntries((profiles as any[]).map((p) => [p.user_id, p]));

  const pending = applications.filter((a: any) => a.status === "pending").length;
  const approved = applications.filter((a: any) => a.status === "approved").length;
  const rejected = applications.filter((a: any) => a.status === "rejected").length;

  const handleApprove = async (app: any) => {
    setProcessing(app.id);
    try {
      // Update application status
      const { error: updateErr } = await supabase
        .from("instructor_applications")
        .update({ status: "approved", reviewed_at: new Date().toISOString() })
        .eq("id", app.id);
      if (updateErr) throw updateErr;

      // Add instructor role
      const { error: roleErr } = await supabase
        .from("user_roles")
        .insert({ user_id: app.user_id, role: "instructor" as any });
      if (roleErr && !roleErr.message.includes("duplicate")) throw roleErr;

      // Notify applicant
      await supabase.rpc("create_notification", {
        _user_id: app.user_id,
        _type: "instructor_approved",
        _title_en: "Your instructor application was approved!",
        _title_ar: "تم قبول طلب المعلم الخاص بك!",
        _body_en: "Congratulations! Start creating your first course.",
        _body_ar: "مبروك! ابدأ بإنشاء أول دورة لك.",
        _link: "/instructor/dashboard",
      });

      toast.success(lang === "ar" ? "تم قبول الطلب" : "Application approved");
      qc.invalidateQueries({ queryKey: ["admin-instructor-applications"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setProcessing(rejectTarget.id);
    try {
      const { error } = await supabase
        .from("instructor_applications")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          admin_notes: rejectNotes || null,
        })
        .eq("id", rejectTarget.id);
      if (error) throw error;

      await supabase.rpc("create_notification", {
        _user_id: rejectTarget.user_id,
        _type: "instructor_rejected",
        _title_en: "Instructor application update",
        _title_ar: "تحديث طلب المعلم",
        _body_en: "Unfortunately, your application was not approved at this time.",
        _body_ar: "للأسف، لم يتم قبول طلبك في هذا الوقت.",
        _link: "/become-instructor",
      });

      toast.success(lang === "ar" ? "تم رفض الطلب" : "Application rejected");
      qc.invalidateQueries({ queryKey: ["admin-instructor-applications"] });
      setRejectTarget(null);
      setRejectNotes("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "outline", label: lang === "ar" ? "قيد المراجعة" : "Pending" },
      approved: { variant: "default", label: lang === "ar" ? "مقبول" : "Approved" },
      rejected: { variant: "destructive", label: lang === "ar" ? "مرفوض" : "Rejected" },
    };
    const s = map[status] || map.pending;
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-2xl admin-gradient-header flex items-center justify-center shadow-lg">
          <UserPlus className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="admin-page-title">{lang === "ar" ? "طلبات المعلمين" : "Instructor Applications"}</h1>
          <p className="admin-page-subtitle">{lang === "ar" ? "مراجعة وإدارة طلبات المعلمين" : "Review and manage instructor applications"}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"><Clock className="h-5 w-5 text-amber-600" /></div>
          <div><p className="text-2xl font-bold">{pending}</p><p className="text-xs text-muted-foreground">{lang === "ar" ? "قيد المراجعة" : "Pending"}</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"><UserCheck className="h-5 w-5 text-emerald-600" /></div>
          <div><p className="text-2xl font-bold">{approved}</p><p className="text-xs text-muted-foreground">{lang === "ar" ? "مقبول" : "Approved"}</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center"><UserX className="h-5 w-5 text-red-600" /></div>
          <div><p className="text-2xl font-bold">{rejected}</p><p className="text-xs text-muted-foreground">{lang === "ar" ? "مرفوض" : "Rejected"}</p></div>
        </CardContent></Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> {lang === "ar" ? "جميع الطلبات" : "All Applications"} ({applications.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">{t("admin.loading")}</p>
          ) : applications.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">{lang === "ar" ? "لا توجد طلبات بعد" : "No applications yet"}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{lang === "ar" ? "المتقدم" : "Applicant"}</TableHead>
                    <TableHead>{lang === "ar" ? "المجالات" : "Expertise"}</TableHead>
                    <TableHead>{lang === "ar" ? "الروابط" : "Links"}</TableHead>
                    <TableHead>{lang === "ar" ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{lang === "ar" ? "التاريخ" : "Date"}</TableHead>
                    <TableHead>{t("admin.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app: any) => {
                    const profile = profileMap[app.user_id];
                    return (
    <>
    <SEO title="Instructor Apps — Admin" noIndex />
                      <TableRow key={app.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={profile?.avatar_url} />
                              <AvatarFallback className="text-xs">{app.full_name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{app.full_name}</p>
                              <p className="text-xs text-muted-foreground">{app.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(app.expertise_areas || []).slice(0, 3).map((e: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">{e}</Badge>
                            ))}
                            {(app.expertise_areas || []).length > 3 && (
                              <Badge variant="outline" className="text-xs">+{app.expertise_areas.length - 3}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {app.portfolio_url && (
                              <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="icon" className="h-7 w-7"><ExternalLink className="h-3 w-3" /></Button>
                              </a>
                            )}
                            {app.linkedin_url && (
                              <a href={app.linkedin_url} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="icon" className="h-7 w-7"><ExternalLink className="h-3 w-3" /></Button>
                              </a>
                            )}
                            {app.sample_content_url && (
                              <a href={app.sample_content_url} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="icon" className="h-7 w-7"><ExternalLink className="h-3 w-3" /></Button>
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{statusBadge(app.status)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          {app.status === "pending" ? (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                onClick={() => handleApprove(app)}
                                disabled={processing === app.id}
                              >
                                <CheckCircle className="h-3 w-3 me-1" /> {lang === "ar" ? "قبول" : "Approve"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => { setRejectTarget(app); setRejectNotes(""); }}
                                disabled={processing === app.id}
                              >
                                <XCircle className="h-3 w-3 me-1" /> {lang === "ar" ? "رفض" : "Reject"}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
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

      {/* Reject Dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(o) => { if (!o) setRejectTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang === "ar" ? "رفض الطلب" : "Reject Application"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {lang === "ar" ? "أضف ملاحظات للمتقدم (اختياري):" : "Add notes for the applicant (optional):"}
            </p>
            <Textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder={lang === "ar" ? "سبب الرفض..." : "Reason for rejection..."}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing === rejectTarget?.id}>
              {lang === "ar" ? "تأكيد الرفض" : "Confirm Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
