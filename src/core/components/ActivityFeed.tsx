/**
 * ActivityFeed — Shared recent activity timeline for dashboard use.
 */
import { useLanguage } from "@/contexts/LanguageContext";
import { useActivity } from "@/core/hooks/useActivity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Props {
  limit?: number;
  entityType?: string;
  entityId?: string;
}

export default function ActivityFeed({ limit = 10, entityType, entityId }: Props) {
  const { lang } = useLanguage();
  const { activities, isLoading } = useActivity({ limit, entityType, entityId });
  const isAr = lang === "ar";

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3 px-5 pt-5">
        <CardTitle className="section-label">
          <Activity className="h-4 w-4 text-primary" />
          {isAr ? "النشاط الأخير" : "Recent Activity"}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-2.5 w-2.5 rounded-full bg-muted mt-1.5" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-3/4 bg-muted rounded-md animate-pulse" />
                  <div className="h-3 w-1/3 bg-muted rounded-md animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <Clock className="h-10 w-10 text-muted-foreground/20 mb-3" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">{isAr ? "لا يوجد نشاط بعد" : "No activity yet"}</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[350px]">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute start-[5px] top-2 bottom-2 w-px bg-border/60" />
              <div className="space-y-4">
                {activities.map((entry) => (
                  <div key={entry.id} className="flex gap-3 relative">
                    <div className="h-2.5 w-2.5 rounded-full bg-primary/60 mt-1.5 flex-shrink-0 z-10 ring-2 ring-card" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-snug">
                        {isAr ? (entry.title_ar ?? entry.title_en) : entry.title_en}
                      </p>
                      {(isAr ? entry.description_ar : entry.description_en) && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {isAr ? entry.description_ar : entry.description_en}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                        {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
