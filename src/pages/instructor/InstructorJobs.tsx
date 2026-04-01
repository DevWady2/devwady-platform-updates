/**
 * /instructor/jobs — Role-aware job opportunities page for instructors.
 * Queries job_postings (the real apply-ready table) so actions are truthful.
 * Supports personal application (senior+ only) and student nomination.
 */
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Briefcase, MapPin, Search, UserCheck, Send, ShieldCheck, Eye,
  Loader2, CheckCircle2, X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import {
  isSampleMode,
  MOCK_INSTRUCTOR_OPPORTUNITIES,
} from "@/data/mockData";
import SEO from "@/components/SEO";
import SampleDataBadge from "@/components/SampleDataBadge";
import JobNominateStudentDialog from "@/components/instructor/JobNominateStudentDialog";

/** Senior-level keywords that qualify for personal application */
const SENIOR_KEYWORDS = ["senior", "lead", "principal", "staff", "architect", "manager", "head"];

function isSeniorJob(job: any): boolean {
  const title = (job.title ?? job.title_en ?? "").toLowerCase();
  const type = (job.type ?? job.type_en ?? "").toLowerCase();
  return SENIOR_KEYWORDS.some((kw) => title.includes(kw) || type.includes(kw));
}

export default function InstructorJobs() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAr = lang === "ar";
  const [search, setSearch] = useState("");
  const [nominateJob, setNominateJob] = useState<any | null>(null);
  const [detailJob, setDetailJob] = useState<any | null>(null);
  const [applyJob, setApplyJob] = useState<any | null>(null);
  const [coverNote, setCoverNote] = useState("");

  // Fetch instructor profile for track/skills-based filtering
  const { data: profile } = useQuery({
    queryKey: ["instructor-profile-jobs", user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("track, skills")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const track = profile?.track ?? null;
  const skills: string[] = profile?.skills ?? [];

  // Query job_postings — the real table linked to job_applications
  const { data: jobsResult, isLoading } = useQuery({
    queryKey: ["instructor-jobs", track, skills],
    enabled: !!user,
    staleTime: 3 * 60_000,
    queryFn: async () => {
      let query = supabase
        .from("job_postings")
        .select("id, title, title_ar, type, location, location_ar, tags, is_urgent, description, description_ar, requirements, salary_range, company_user_id")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(20);

      if (skills.length > 0) {
        query = query.overlaps("tags", skills.slice(0, 5));
      }

      const { data, error } = await query;
      // Never mask real query errors with sample data
      if (error) throw error;
      if (data && data.length > 0) return { jobs: data, isSample: false };

      // Fallback: fetch all active postings if skill-match returned nothing
      const { data: allJobs, error: allError } = await supabase
        .from("job_postings")
        .select("id, title, title_ar, type, location, location_ar, tags, is_urgent, description, description_ar, requirements, salary_range, company_user_id")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(20);
      if (allError) throw allError;
      if (allJobs && allJobs.length > 0) return { jobs: allJobs, isSample: false };

      // Dev sample-mode fallback — only on success + empty
      if (isSampleMode()) return { jobs: MOCK_INSTRUCTOR_OPPORTUNITIES, isSample: true };
      return { jobs: [], isSample: false };
    },
  });

  const jobs = jobsResult?.jobs ?? [];
  const isSampleJobs = jobsResult?.isSample ?? false;

  // Track which jobs the instructor already applied to
  const { data: myApplicationJobIds = [] } = useQuery({
    queryKey: ["instructor-my-applications", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("job_applications")
        .select("job_id")
        .eq("applicant_user_id", user!.id);
      return (data ?? []).map((a: any) => a.job_id);
    },
  });
  const appliedSet = new Set(myApplicationJobIds);

  // Real application mutation
  const applyMutation = useMutation({
    mutationFn: async ({ jobId, note }: { jobId: string; note: string }) => {
      const { error } = await supabase.from("job_applications").insert({
        job_id: jobId,
        applicant_user_id: user!.id,
        cover_note: note || null,
        applicant_email: user!.email || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["instructor-my-applications"] });
      toast.success(isAr ? "تم تقديم طلبك بنجاح" : "Application submitted!");
      setApplyJob(null);
      setCoverNote("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = search
    ? jobs.filter((j: any) => {
        const s = search.toLowerCase();
        return (
          (j.title ?? j.title_en ?? "").toLowerCase().includes(s) ||
          (j.title_ar ?? "").toLowerCase().includes(s) ||
          j.tags?.some((t: string) => t.toLowerCase().includes(s))
        );
      })
    : jobs;

  const getTitle = (job: any) => isAr ? (job.title_ar || job.title || job.title_en) : (job.title || job.title_en);
  const getType = (job: any) => isAr ? (job.type_ar || job.type || job.type_en) : (job.type || job.type_en);
  const getLocation = (job: any) => isAr ? (job.location_ar || job.location || job.location_en) : (job.location || job.location_en);

  return (
    <div className="pt-24 pb-20">
      <SEO title={isAr ? "فرص العمل | DevWady" : "Jobs | DevWady"} />
      <div className="container mx-auto px-4 max-w-4xl">
         <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              {isAr ? "فرص في تخصصك" : "Jobs in Your Field"}
            </h1>
            <SampleDataBadge isSample={isSampleJobs} />
          </div>
          <p className="text-muted-foreground text-sm">
            {track
              ? isAr
                ? `فرص مرتبطة بتخصصك في ${track}`
                : `Opportunities related to your specialization in ${track}`
              : isAr
              ? "فرص مهنية ذات صلة بمجالك"
              : "Professional opportunities relevant to your field"}
          </p>
          <div className="flex flex-wrap gap-3 mt-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <UserCheck className="h-3 w-3" />
              {isAr ? "رشّح طالبًا لأي فرصة" : "Nominate a student for any job"}
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              {isAr ? "تقدّم شخصياً للفرص العليا فقط" : "Apply personally to senior+ roles only"}
            </span>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isAr ? "ابحث في الفرص..." : "Search opportunities..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-10 rounded-xl"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {isAr ? "لا توجد فرص حالياً" : "No opportunities found"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((job: any) => {
              const senior = isSeniorJob(job);
              const alreadyApplied = appliedSet.has(job.id);
              return (
                <div
                  key={job.id}
                  className="p-4 rounded-xl border border-border/60 bg-card hover:border-primary/20 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Briefcase className="h-5 w-5 text-accent" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {getTitle(job)}
                        </p>
                        {job.is_urgent && (
                          <Badge variant="destructive" className="text-[10px] flex-shrink-0">
                            {isAr ? "عاجل" : "Urgent"}
                          </Badge>
                        )}
                        {senior && (
                          <Badge variant="outline" className="text-[10px] flex-shrink-0 border-primary/30 text-primary">
                            <ShieldCheck className="h-2.5 w-2.5 me-0.5" />
                            {isAr ? "أعلى" : "Senior+"}
                          </Badge>
                        )}
                        {alreadyApplied && (
                          <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                            <CheckCircle2 className="h-2.5 w-2.5 me-0.5" />
                            {isAr ? "تم التقديم" : "Applied"}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        {getType(job) && <span>{getType(job)}</span>}
                        {getLocation(job) && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" />
                              {getLocation(job)}
                            </span>
                          </>
                        )}
                        {job.salary_range && (
                          <>
                            <span>·</span>
                            <span>{job.salary_range}</span>
                          </>
                        )}
                      </div>
                      {job.tags && job.tags.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {job.tags.slice(0, 4).map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 mt-3 ps-[52px]">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      onClick={() => setDetailJob(job)}
                    >
                      <Eye className="h-3 w-3" />
                      {isAr ? "عرض التفاصيل" : "View Details"}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      onClick={() => setNominateJob(job)}
                    >
                      <UserCheck className="h-3 w-3" />
                      {isAr ? "رشّح طالبًا" : "Nominate Student"}
                    </Button>

                    {senior ? (
                      alreadyApplied ? (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {isAr ? "تم تقديم طلبك" : "Already applied"}
                        </span>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          className="h-7 text-xs gap-1.5"
                          onClick={() => { setApplyJob(job); setCoverNote(""); }}
                        >
                          <Send className="h-3 w-3" />
                          {isAr ? "تقدّم شخصياً" : "Apply Myself"}
                        </Button>
                      )
                    ) : (
                      <span className="text-[10px] text-muted-foreground/60 italic">
                        {isAr ? "التقديم الشخصي للمستوى الأعلى فقط" : "Personal apply: senior+ only"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Job Detail Dialog — shows real data from this record */}
      <Dialog open={!!detailJob} onOpenChange={(open) => !open && setDetailJob(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detailJob && getTitle(detailJob)}</DialogTitle>
          </DialogHeader>
          {detailJob && (
            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {getType(detailJob) && <Badge variant="outline">{getType(detailJob)}</Badge>}
                {getLocation(detailJob) && (
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{getLocation(detailJob)}</span>
                )}
                {detailJob.salary_range && <Badge variant="secondary">{detailJob.salary_range}</Badge>}
                {detailJob.is_urgent && <Badge variant="destructive">{isAr ? "عاجل" : "Urgent"}</Badge>}
              </div>
              {(detailJob.description || detailJob.description_ar) && (
                <div>
                  <p className="font-medium mb-1">{isAr ? "الوصف" : "Description"}</p>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {isAr ? (detailJob.description_ar || detailJob.description) : detailJob.description}
                  </p>
                </div>
              )}
              {detailJob.requirements && detailJob.requirements.length > 0 && (
                <div>
                  <p className="font-medium mb-1">{isAr ? "المتطلبات" : "Requirements"}</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                    {detailJob.requirements.map((r: string, i: number) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
              {detailJob.tags && detailJob.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {detailJob.tags.map((t: string) => (
                    <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => { setDetailJob(null); setNominateJob(detailJob); }}>
                  <UserCheck className="h-3 w-3 me-1" />
                  {isAr ? "رشّح طالبًا" : "Nominate Student"}
                </Button>
                {isSeniorJob(detailJob) && !appliedSet.has(detailJob.id) && (
                  <Button size="sm" onClick={() => { setDetailJob(null); setApplyJob(detailJob); setCoverNote(""); }}>
                    <Send className="h-3 w-3 me-1" />
                    {isAr ? "تقدّم شخصياً" : "Apply Myself"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Apply Dialog — creates real job_applications record */}
      <Dialog open={!!applyJob} onOpenChange={(open) => !open && setApplyJob(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isAr ? "تقديم طلب" : "Submit Application"}
            </DialogTitle>
          </DialogHeader>
          {applyJob && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {isAr ? "أنت تتقدم لفرصة:" : "You are applying for:"}
                <span className="font-semibold text-foreground ms-1">{getTitle(applyJob)}</span>
              </p>
              <Textarea
                placeholder={isAr ? "ملاحظات أو رسالة تعريفية (اختياري)" : "Cover note (optional)"}
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setApplyJob(null)}>
                  <X className="h-3 w-3 me-1" />
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  size="sm"
                  disabled={applyMutation.isPending}
                  onClick={() => applyMutation.mutate({ jobId: applyJob.id, note: coverNote })}
                >
                  {applyMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin me-1" />
                  ) : (
                    <Send className="h-3 w-3 me-1" />
                  )}
                  {isAr ? "أرسل الطلب" : "Submit"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Nomination dialog */}
      <JobNominateStudentDialog
        open={!!nominateJob}
        onOpenChange={(open) => !open && setNominateJob(null)}
        job={nominateJob}
      />
    </div>
  );
}
