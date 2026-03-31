import SEO from "@/components/SEO";
import { useState } from "react";
import { EmptyState } from "@/components/admin/EmptyState";
import ConfirmDeleteDialog from "@/components/admin/ConfirmDeleteDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Briefcase, Users, Star   } from "lucide-react";
import ExportCSVButton from "@/components/admin/ExportCSVButton";
import { toast } from "sonner";
import JobFormDialog from "@/components/admin/JobFormDialog";

export default function AdminHiring() {
  const { t, lang } = useLanguage();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);

  const { data: jobs = [], isLoading: loadingJobs } = useQuery({
    queryKey: ["admin-job-postings"],
    queryFn: async () => { const { data, error } = await supabase.from("job_postings").select("*").order("created_at", { ascending: false }); if (error) throw error; return data; } });

  const { data: freelancers = [], isLoading: loadingFreelancers } = useQuery({
    queryKey: ["admin-freelancers"],
    queryFn: async () => { const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }); if (error) throw error; return data; } });

  const saveMutation = useMutation({
    mutationFn: async (form: any) => {
      const payload = { ...form, company_user_id: user!.id };
      if (editingJob) { const { company_user_id: _, ...up } = payload; const { error } = await supabase.from("job_postings").update(up).eq("id", editingJob.id); if (error) throw error; }
      else { const { error } = await supabase.from("job_postings").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-job-postings"] }); setDialogOpen(false); setEditingJob(null); toast.success(t("admin.save")); },
    onError: (e: any) => toast.error(e.message) });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("job_postings").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-job-postings"] }); toast.success(t("admin.delete")); },
    onError: (e: any) => toast.error(e.message) });

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const confirmDelete = () => { if (deleteTarget) { deleteMutation.mutate(deleteTarget); setDeleteTarget(null); } };
  const recommended = freelancers.filter((f: any) => f.is_devwady_alumni && f.rating >= 4.5);

  return (
    <>
    <SEO title="Hiring — Admin" noIndex />
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">{t("admin.hiringManagement")}</h1><p className="text-muted-foreground">{t("admin.manageHiring")}</p></div>
        <ExportCSVButton data={jobs.map((j: any) => ({ title: j.title, type: j.type, location: j.location, salary_range: j.salary_range, is_active: j.is_active, is_urgent: j.is_urgent, created_at: j.created_at }))} filename="job-postings" />
      </div>

      <Tabs defaultValue="jobs">
        <TabsList>
          <TabsTrigger value="jobs" className="gap-1.5"><Briefcase className="h-4 w-4" /> {t("admin.jobs")} ({jobs.length})</TabsTrigger>
          <TabsTrigger value="freelancers" className="gap-1.5"><Users className="h-4 w-4" /> {t("admin.freelancers")} ({freelancers.length})</TabsTrigger>
          <TabsTrigger value="recommended" className="gap-1.5"><Star className="h-4 w-4" /> {t("admin.recommended")} ({recommended.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          <div className="flex justify-end"><Button onClick={() => { setEditingJob(null); setDialogOpen(true); }} className="gradient-brand text-primary-foreground"><Plus className="h-4 w-4 me-1" /> {t("admin.addJob")}</Button></div>
          {loadingJobs ? <p className="text-muted-foreground">{t("admin.loading")}</p> : (
            <div className="overflow-x-auto"><Table>
              <TableHeader><TableRow>
                <TableHead>{t("admin.title")}</TableHead><TableHead>{t("admin.type")}</TableHead><TableHead>{t("admin.location")}</TableHead><TableHead>{t("admin.tags")}</TableHead><TableHead>{t("admin.status")}</TableHead><TableHead className="w-24">{t("admin.actions")}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {jobs.map((job: any) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.title}{job.is_urgent && <Badge variant="destructive" className="ms-2 text-xs">Urgent</Badge>}</TableCell>
                    <TableCell>{job.type}</TableCell><TableCell>{job.location}</TableCell>
                    <TableCell><div className="flex flex-wrap gap-1">{(job.tags || []).map((t2: string) => <Badge key={t2} variant="secondary" className="text-xs">{t2}</Badge>)}</div></TableCell>
                    <TableCell><Badge variant={job.is_active ? "default" : "outline"}>{job.is_active ? t("admin.active") : t("admin.inactive")}</Badge></TableCell>
                    <TableCell><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => { setEditingJob(job); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteTarget(job.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell>
                  </TableRow>
                ))}
                {jobs.length === 0 && <TableRow><TableCell colSpan={6}><EmptyState icon={Briefcase} title={lang === "ar" ? "لا توجد وظائف بعد" : "No job postings"} description={lang === "ar" ? "أنشئ أول إعلان وظيفة" : "Create a job posting to attract talent"} actionLabel={lang === "ar" ? "إضافة وظيفة" : "Create Posting"} onAction={() => { setEditingJob(null); setDialogOpen(true); }} /></TableCell></TableRow>}
              </TableBody>
            </Table></div>
          )}
        </TabsContent>

        <TabsContent value="freelancers" className="space-y-4">
          {loadingFreelancers ? <p className="text-muted-foreground">{t("admin.loading")}</p> : (
            <div className="overflow-x-auto"><Table>
              <TableHeader><TableRow>
                <TableHead>{t("admin.name")}</TableHead><TableHead>{t("admin.track")}</TableHead><TableHead>{t("admin.skills")}</TableHead><TableHead>{t("admin.rate")}</TableHead><TableHead>{t("admin.rating")}</TableHead><TableHead>{t("admin.alumni")}</TableHead><TableHead>{t("admin.available")}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {freelancers.map((f: any) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.full_name || "—"}</TableCell><TableCell>{f.track || "—"}</TableCell>
                    <TableCell><div className="flex flex-wrap gap-1">{(f.skills || []).slice(0, 3).map((s: string) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}</div></TableCell>
                    <TableCell>{f.hourly_rate || "—"}</TableCell><TableCell>{f.rating ? `⭐ ${f.rating}` : "—"}</TableCell>
                    <TableCell>{f.is_devwady_alumni ? <Badge>{t("admin.alumni")}</Badge> : "—"}</TableCell>
                    <TableCell><Badge variant={f.is_available ? "default" : "outline"}>{f.is_available ? t("admin.yes") : t("admin.no")}</Badge></TableCell>
                  </TableRow>
                ))}
                {freelancers.length === 0 && <TableRow><TableCell colSpan={7}><EmptyState icon={Users} title={lang === "ar" ? "لا يوجد مستقلون بعد" : "No freelancers yet"} description={lang === "ar" ? "سيظهرون هنا عند التسجيل" : "Freelancers will appear here when they register"} /></TableCell></TableRow>}
              </TableBody>
            </Table></div>
          )}
        </TabsContent>

        <TabsContent value="recommended" className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("admin.recommendedDesc")}</p>
          <div className="overflow-x-auto"><Table>
            <TableHeader><TableRow>
              <TableHead>{t("admin.name")}</TableHead><TableHead>{t("admin.track")}</TableHead><TableHead>{t("admin.batch")}</TableHead><TableHead>{t("admin.rating")}</TableHead><TableHead>{t("admin.projectsCount")}</TableHead><TableHead>{t("admin.available")}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {recommended.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.full_name || "—"}</TableCell><TableCell>{r.track || "—"}</TableCell><TableCell>{r.batch || "—"}</TableCell>
                  <TableCell>⭐ {r.rating}</TableCell><TableCell>{r.projects_count || 0}</TableCell>
                  <TableCell><Badge variant={r.is_available ? "default" : "outline"}>{r.is_available ? t("admin.yes") : t("admin.no")}</Badge></TableCell>
                </TableRow>
              ))}
              {recommended.length === 0 && <TableRow><TableCell colSpan={6}><EmptyState icon={Star} title={lang === "ar" ? "لا توجد توصيات بعد" : "No recommended freelancers yet"} description={lang === "ar" ? "المستقلون المميزون سيظهرون هنا" : "Top-rated freelancers will appear here"} /></TableCell></TableRow>}
            </TableBody>
          </Table></div>
        </TabsContent>
      </Tabs>
      <JobFormDialog open={dialogOpen} onOpenChange={setDialogOpen} job={editingJob} onSave={(data) => saveMutation.mutate(data)} />
      <ConfirmDeleteDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }} onConfirm={confirmDelete} />
    </div>
    </>
  );
}
