/**
 * Enterprise — Quotes listing.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader, EmptyState } from "@/core/components";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, DollarSign, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { QUOTE_STATUS_COLORS, formatStatus } from "../constants";

export default function EnterpriseQuotes() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["enterprise-quotes-all", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: requests } = await supabase
        .from("service_requests")
        .select("id")
        .eq("user_id", user!.id);
      const ids = (requests ?? []).map((r) => r.id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .in("service_request_id", ids)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title_en="Quotes & Proposals"
        title_ar="عروض الأسعار"
        description_en="Review and respond to proposals for your requests"
        description_ar="راجع وأجب على عروض الأسعار لطلباتك"
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : quotes.length === 0 ? (
        <EmptyState
          icon={<Receipt className="h-12 w-12" />}
          title_en="No quotes yet"
          title_ar="لا توجد عروض أسعار بعد"
          description_en="Quotes will appear here when we prepare proposals for your requests"
          description_ar="ستظهر عروض الأسعار هنا عندما نجهز عروضًا لطلباتك"
        />
      ) : (
        <div className="space-y-3">
          {quotes.map((q) => (
            <Card key={q.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">{q.quote_number}</span>
                      <Badge variant="secondary" className={`text-[10px] ${QUOTE_STATUS_COLORS[q.status] ?? ""}`}>
                        {formatStatus(q.status)}
                      </Badge>
                    </div>
                    <p className="font-medium">{q.title}</p>
                    {q.description && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{q.description}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />${q.total_usd.toLocaleString()}
                      </span>
                      {q.estimated_duration && (
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{q.estimated_duration}</span>
                      )}
                      {q.valid_until && (
                        <span>{isAr ? "صالح حتى" : "Valid until"} {new Date(q.valid_until).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <Link to={`/enterprise/portal/quotes/${q.id}`}>
                    <Button variant="outline" size="sm">{isAr ? "عرض" : "View"} <ArrowRight className="h-3.5 w-3.5 ms-1 icon-flip-rtl" /></Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
