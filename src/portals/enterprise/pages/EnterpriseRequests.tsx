/**
 * Enterprise — Service Requests listing with status filter tabs.
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
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "react-router-dom";
import { Plus, FileInput, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { REQUEST_STATUS_COLORS, formatStatus } from "../constants";
import { useWorkspaceEntry } from "@/hooks/useWorkspaceEntry";
import ArrivalHint from "@/components/portal/ArrivalHint";

const ACTIVE_STATUSES = ["new", "in_review", "quoted", "approved", "in_progress"];

export default function EnterpriseRequests() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const search = useSearch();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const entry = useWorkspaceEntry();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["enterprise-all-requests", user?.id, search.params.query],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from("service_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (search.params.query) q = q.ilike("title", `%${search.params.query}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const activeCount = requests.filter((r) => ACTIVE_STATUSES.includes(r.status)).length;
  const completedCount = requests.filter((r) => r.status === "completed").length;

  const filtered = statusFilter === "all"
    ? requests
    : statusFilter === "active"
      ? requests.filter((r) => ACTIVE_STATUSES.includes(r.status))
      : requests.filter((r) => r.status === "completed");

  return (
    <div className="space-y-6">
      <ArrivalHint entry={entry} />
      <PageHeader
        title_en="Service Requests"
        title_ar="طلبات الخدمة"
        description_en="Track and manage your submitted requests"
        description_ar="تتبع وأدر طلباتك المقدمة"
        actions={
          <Link to="/enterprise/portal/requests/new">
            <Button size="sm"><Plus className="h-4 w-4 me-1.5" />{isAr ? "طلب جديد" : "New Request"}</Button>
          </Link>
        }
      />

      <SearchFilterBar
        query={search.params.query ?? ""}
        onQueryChange={search.setQuery}
        placeholder_en="Search requests..."
        placeholder_ar="بحث في الطلبات..."
      />

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">{isAr ? "الكل" : "All"} ({requests.length})</TabsTrigger>
          <TabsTrigger value="active">{isAr ? "نشطة" : "Active"} ({activeCount})</TabsTrigger>
          <TabsTrigger value="completed">{isAr ? "مكتملة" : "Completed"} ({completedCount})</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileInput className="h-12 w-12" />}
          title_en="No requests yet"
          title_ar="لا توجد طلبات بعد"
          description_en="Submit your first service request to get started"
          description_ar="قدّم طلب خدمتك الأول للبدء"
          actionLabel_en="New Request"
          actionLabel_ar="طلب جديد"
          onAction={() => navigate("/enterprise/portal/requests/new")}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{r.title}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge variant="secondary" className={`text-[10px] ${REQUEST_STATUS_COLORS[r.status] ?? ""}`}>
                        {formatStatus(r.status)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatStatus(r.service_type)}</span>
                      {r.budget_range && <span className="text-xs text-muted-foreground">· {r.budget_range}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
