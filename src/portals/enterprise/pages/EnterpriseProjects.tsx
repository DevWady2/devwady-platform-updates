/**
 * Enterprise — Projects listing with status filter tabs.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader, SearchFilterBar, EmptyState } from "@/core/components";
import { useSearch } from "@/core/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { FolderKanban, Calendar, DollarSign } from "lucide-react";
import { PROJECT_STATUS_COLORS, formatStatus } from "../constants";

const ACTIVE_STATUSES = ["planning", "in_progress", "review"];
const DELIVERED_STATUSES = ["delivered", "completed", "cancelled"];

export default function EnterpriseProjects() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const search = useSearch();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["enterprise-projects-list", user?.id, search.params.query],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from("project_tracking")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (search.params.query) q = q.ilike("title", `%${search.params.query}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const activeCount = projects.filter((p) => ACTIVE_STATUSES.includes(p.status)).length;
  const deliveredCount = projects.filter((p) => DELIVERED_STATUSES.includes(p.status)).length;

  const filtered = statusFilter === "all"
    ? projects
    : statusFilter === "active"
      ? projects.filter((p) => ACTIVE_STATUSES.includes(p.status))
      : projects.filter((p) => DELIVERED_STATUSES.includes(p.status));

  return (
    <div className="space-y-6">
      <PageHeader
        title_en="My Projects"
        title_ar="مشاريعي"
        description_en="View and track all your projects"
        description_ar="عرض وتتبع جميع مشاريعك"
      />

      <SearchFilterBar
        query={search.params.query ?? ""}
        onQueryChange={search.setQuery}
        placeholder_en="Search projects..."
        placeholder_ar="بحث في المشاريع..."
      />

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">{isAr ? "الكل" : "All"} ({projects.length})</TabsTrigger>
          <TabsTrigger value="active">{isAr ? "نشطة" : "Active"} ({activeCount})</TabsTrigger>
          <TabsTrigger value="delivered">{isAr ? "مسلّمة" : "Delivered"} ({deliveredCount})</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-36 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-12 w-12" />}
          title_en="No projects yet"
          title_ar="لا توجد مشاريع بعد"
          description_en="Your projects will appear here once approved"
          description_ar="ستظهر مشاريعك هنا بعد الموافقة عليها"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((p) => (
            <Link key={p.id} to={`/enterprise/portal/projects/${p.id}`}>
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-sm truncate flex-1">{p.title}</h3>
                    <Badge variant="secondary" className={`text-[10px] ms-2 ${PROJECT_STATUS_COLORS[p.status] ?? ""}`}>
                      {formatStatus(p.status)}
                    </Badge>
                  </div>

                  {p.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                  )}

                  {p.progress_pct != null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{isAr ? "التقدم" : "Progress"}</span>
                        <span className="font-medium">{p.progress_pct}%</span>
                      </div>
                      <Progress value={p.progress_pct} className="h-1.5" />
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                    {p.start_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(p.start_date).toLocaleDateString()}
                      </span>
                    )}
                    {p.total_budget_usd != null && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        ${p.total_budget_usd.toLocaleString()}
                      </span>
                    )}
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
