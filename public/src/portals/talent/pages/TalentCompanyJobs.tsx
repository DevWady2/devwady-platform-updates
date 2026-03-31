/**
 * Talent — Company Job Listings management.
 */
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader, SearchFilterBar, EmptyState } from "@/core/components";
import { useSearch } from "@/core/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { Plus, Briefcase, MapPin, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { formatStatus } from "../constants";
import JobPostDialog from "../components/JobPostDialog";

export default function TalentCompanyJobs() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const search = useSearch();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showPostDialog, setShowPostDialog] = useState(false);

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setShowPostDialog(true);
      setSearchParams({}, { replace: true });
    }
  }, []);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["talent-company-jobs", user?.id, search.params.query],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from("job_postings")
        .select("*")
        .eq("company_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (search.params.query) q = q.ilike("title", `%${search.params.query}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("job_postings").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["talent-company-jobs"] });
      toast.success(isAr ? "تم التحديث" : "Updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title_en="Job Listings"
        title_ar="قوائم الوظائف"
        description_en="Create and manage your open positions"
        description_ar="أنشئ وأدر وظائفك المفتوحة"
        actions={
          <Button size="sm" onClick={() => setShowPostDialog(true)}>
            <Plus className="h-4 w-4 me-1.5" />{isAr ? "نشر وظيفة" : "Post Job"}
          </Button>
        }
      />

      <SearchFilterBar
        query={search.params.query ?? ""}
        onQueryChange={search.setQuery}
        placeholder_en="Search jobs..."
        placeholder_ar="بحث في الوظائف..."
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-12 w-12" />}
          title_en="No jobs posted yet"
          title_ar="لا توجد وظائف منشورة"
          description_en="Post your first job to start receiving applications"
          description_ar="انشر وظيفتك الأولى لتبدأ باستقبال الطلبات"
          actionLabel_en="Post Job"
          actionLabel_ar="نشر وظيفة"
          onAction={() => setShowPostDialog(true)}
        />
      ) : (
        <div className="space-y-3">
          {jobs.map((j) => (
            <Card key={j.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{j.title}</p>
                      {j.is_urgent && <Badge variant="destructive" className="text-[10px]">{isAr ? "عاجل" : "Urgent"}</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span>{formatStatus(j.type)}</span>
                      {j.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{j.location}</span>}
                      {j.salary_range && <span>{j.salary_range}</span>}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(j.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={j.is_active ?? false}
                        onCheckedChange={(checked) => toggleActive.mutate({ id: j.id, is_active: checked })}
                      />
                      <span className="text-[10px] text-muted-foreground">{j.is_active ? (isAr ? "نشط" : "Active") : (isAr ? "متوقف" : "Paused")}</span>
                    </div>
                    <Link to={`/talent/portal/company/jobs/${j.id}`}>
                      <Button variant="outline" size="sm">{isAr ? "عرض" : "View"}</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <JobPostDialog open={showPostDialog} onClose={() => setShowPostDialog(false)} />
    </div>
  );
}
