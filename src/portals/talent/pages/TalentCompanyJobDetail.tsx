/**
 * Talent — Job Detail with applicants.
 */
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader } from "@/core/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Users, MapPin, DollarSign, Clock, Loader2, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { formatStatus } from "../constants";

export default function TalentCompanyJobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const queryClient = useQueryClient();

  const { data: job, isLoading } = useQuery({
    queryKey: ["talent-job", id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_postings")
        .select("*")
        .eq("id", id!)
        .eq("company_user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: applicants = [], isLoading: loadingApplicants } = useQuery({
    queryKey: ["talent-job-applicants", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_applications")
        .select("*, profiles:applicant_user_id(full_name, avatar_url, skills, location)")
        .eq("job_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ appId, status }: { appId: string; status: string }) => {
      const { error } = await supabase.from("job_applications").update({ status }).eq("id", appId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["talent-job-applicants", id] });
      toast.success(isAr ? "تم التحديث" : "Status updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!job) return (
    <div className="text-center py-20">
      <AlertCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-muted-foreground">{isAr ? "الوظيفة غير موجودة" : "Job not found"}</p>
      <Link to="/talent/portal/company/jobs"><Button variant="outline" className="mt-3">{isAr ? "رجوع" : "Back"}</Button></Link>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title_en={job.title}
        title_ar={job.title_ar ?? job.title}
        badge={
          <Badge variant={job.is_active ? "default" : "secondary"}>
            {job.is_active ? (isAr ? "نشط" : "Active") : (isAr ? "متوقف" : "Paused")}
          </Badge>
        }
        actions={
          <Link to="/talent/portal/company/jobs">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 me-1 icon-flip-rtl" />{isAr ? "رجوع" : "Back"}</Button>
          </Link>
        }
      />

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{formatStatus(job.type)}</span>
        {job.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{job.location}</span>}
        {job.salary_range && <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" />{job.salary_range}</span>}
      </div>

      {job.description && (
        <Card>
          <CardContent className="p-5">
            <p className="text-sm whitespace-pre-wrap">{job.description}</p>
          </CardContent>
        </Card>
      )}

      <Separator />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            {isAr ? "المتقدمون" : "Applicants"} ({applicants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingApplicants ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse mb-2" />)
          ) : applicants.length === 0 ? (
            <div className="text-center py-10">
              <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{isAr ? "لا يوجد متقدمون بعد" : "No applicants yet"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {applicants.map((a: any) => (
                <div key={a.id} className="flex items-center gap-4 p-3 rounded-lg border">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                    {(a.profiles?.full_name ?? "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.profiles?.full_name ?? a.applicant_email ?? "Applicant"}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                      {a.profiles?.location && <span>{a.profiles.location}</span>}
                      <span>{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</span>
                    </div>
                    {a.profiles?.skills && a.profiles.skills.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {a.profiles.skills.slice(0, 4).map((s: string) => (
                          <Badge key={s} variant="outline" className="text-[9px] h-4">{s}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Select
                      value={a.status}
                      onValueChange={(v) => updateStatus.mutate({ appId: a.id, status: v })}
                    >
                      <SelectTrigger className="h-8 text-xs w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["pending", "reviewing", "shortlisted", "interview", "offered", "accepted", "rejected"].map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">{formatStatus(s)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
