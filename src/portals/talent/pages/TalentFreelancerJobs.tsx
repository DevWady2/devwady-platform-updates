/**
 * Talent — Freelancer: Browse available jobs.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader, SearchFilterBar, EmptyState } from "@/core/components";
import { useSearch } from "@/core/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Briefcase, MapPin, Clock, DollarSign, Flame } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { formatStatus } from "../constants";

export default function TalentFreelancerJobs() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const search = useSearch();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["talent-public-jobs", search.params.query],
    queryFn: async () => {
      let q = supabase
        .from("job_postings")
        .select("*")
        .eq("is_active", true)
        .order("is_urgent", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);
      if (search.params.query) q = q.ilike("title", `%${search.params.query}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title_en="Available Jobs"
        title_ar="الوظائف المتاحة"
        description_en="Browse and apply to open positions"
        description_ar="تصفح وتقدم للوظائف المفتوحة"
      />

      <SearchFilterBar
        query={search.params.query ?? ""}
        onQueryChange={search.setQuery}
        placeholder_en="Search jobs by title..."
        placeholder_ar="بحث بعنوان الوظيفة..."
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-12 w-12" />}
          title_en="No jobs available"
          title_ar="لا توجد وظائف متاحة"
          description_en="Check back later for new opportunities"
          description_ar="تحقق لاحقاً لفرص جديدة"
        />
      ) : (
        <div className="space-y-3">
          {jobs.map((j) => (
            <Link key={j.id} to={`/talent/portal/freelancer/jobs/${j.id}`}>
              <Card className="hover:shadow-md transition-shadow mb-3">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{j.title}</h3>
                        {j.is_urgent && (
                          <Badge variant="destructive" className="text-[10px] flex items-center gap-0.5">
                            <Flame className="h-3 w-3" />{isAr ? "عاجل" : "Urgent"}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap mt-1">
                        <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{formatStatus(j.type)}</span>
                        {j.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{j.location}</span>}
                        {j.salary_range && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{j.salary_range}</span>}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(j.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      {j.tags && j.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {j.tags.slice(0, 4).map((t) => (
                            <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button variant="outline" size="sm">{isAr ? "عرض" : "View"}</Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
