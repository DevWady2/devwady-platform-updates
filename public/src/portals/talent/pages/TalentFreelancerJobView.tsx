/**
 * Talent — Job View & Apply (for freelancer).
 */
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader } from "@/core/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, MapPin, DollarSign, Clock, Briefcase,
  Loader2, AlertCircle, CheckCircle2, Flame,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { formatStatus } from "../constants";

export default function TalentFreelancerJobView() {
  const { id } = useParams();
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const queryClient = useQueryClient();
  const [coverNote, setCoverNote] = useState("");

  const { data: job, isLoading } = useQuery({
    queryKey: ["talent-job-public", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_postings")
        .select("*")
        .eq("id", id!)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: existingApp } = useQuery({
    queryKey: ["talent-my-app", id, user?.id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("job_applications")
        .select("id, status")
        .eq("job_id", id!)
        .eq("applicant_user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const apply = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("job_applications").insert({
        job_id: id!,
        applicant_user_id: user!.id,
        applicant_email: user!.email,
        cover_note: coverNote || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["talent-my-app", id] });
      toast.success(isAr ? "تم إرسال طلبك بنجاح" : "Application submitted!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!job) return (
    <div className="text-center py-20">
      <AlertCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-muted-foreground">{isAr ? "الوظيفة غير موجودة أو أُغلقت" : "Job not found or closed"}</p>
      <Link to="/talent/portal/freelancer/jobs"><Button variant="outline" className="mt-3">{isAr ? "رجوع" : "Back"}</Button></Link>
    </div>
  );

  const alreadyApplied = !!existingApp;

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title_en={job.title}
        title_ar={job.title_ar ?? job.title}
        badge={job.is_urgent ? <Badge variant="destructive" className="flex items-center gap-0.5"><Flame className="h-3 w-3" />{isAr ? "عاجل" : "Urgent"}</Badge> : undefined}
        actions={
          <Link to="/talent/portal/freelancer/jobs">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 me-1 icon-flip-rtl" />{isAr ? "رجوع" : "Back"}</Button>
          </Link>
        }
      />

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />{formatStatus(job.type)}</span>
        {job.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{job.location}</span>}
        {job.salary_range && <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" />{job.salary_range}</span>}
        <span className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          {isAr ? "نُشرت" : "Posted"} {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
        </span>
      </div>

      {job.description && (
        <Card>
          <CardHeader><CardTitle className="text-base">{isAr ? "وصف الوظيفة" : "Job Description"}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{job.description}</p>
          </CardContent>
        </Card>
      )}

      {job.requirements && job.requirements.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">{isAr ? "المتطلبات" : "Requirements"}</CardTitle></CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {job.requirements.map((r: string, i: number) => <li key={i}>{r}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}

      {job.tags && job.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {job.tags.map((t: string) => <Badge key={t} variant="secondary">{t}</Badge>)}
        </div>
      )}

      {/* Apply Section */}
      {alreadyApplied ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">{isAr ? "لقد تقدمت لهذه الوظيفة" : "You've applied to this job"}</p>
              <p className="text-xs text-muted-foreground">
                {isAr ? "الحالة" : "Status"}: {formatStatus(existingApp.status)}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : user ? (
        <Card>
          <CardHeader><CardTitle className="text-base">{isAr ? "تقدم الآن" : "Apply Now"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>{isAr ? "رسالة تعريفية (اختياري)" : "Cover Note (optional)"}</Label>
              <Textarea
                rows={4}
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                placeholder={isAr ? "لماذا أنت مناسب لهذه الوظيفة..." : "Why you're a great fit for this role..."}
              />
            </div>
            <Button onClick={() => apply.mutate()} disabled={apply.isPending} size="lg">
              {apply.isPending ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : null}
              {isAr ? "إرسال الطلب" : "Submit Application"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground mb-3">{isAr ? "سجل دخولك للتقدم" : "Sign in to apply"}</p>
            <Link to={`/login?redirect=/talent/portal/freelancer/jobs/${id}`}>
              <Button>{isAr ? "تسجيل الدخول" : "Sign In"}</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
