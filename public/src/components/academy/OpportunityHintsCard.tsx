/**
 * OpportunityHintsCard — Read-only opportunity alignment hints
 *
 * Shows opted-in students which available opportunities align with
 * their talent profile. Internal preparation only — no apply flow.
 */
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, CheckCircle2, AlertCircle, MinusCircle } from "lucide-react";
import type { MatchingSummary } from "@/features/academy/talentBridge/opportunityMatching";

interface Props {
  summary: MatchingSummary;
  /** Max results to show */
  limit?: number;
}

export default function OpportunityHintsCard({ summary, limit = 5 }: Props) {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const top = summary.results.slice(0, limit);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Briefcase className="h-4 w-4" />
          {isAr ? "تلميحات الفرص" : "Opportunity Hints"}
        </CardTitle>
        <CardDescription className="text-xs">
          {isAr
            ? `${summary.alignedCount} فرصة متوافقة من ${summary.totalOpportunities} متاحة`
            : `${summary.alignedCount} aligned of ${summary.totalOpportunities} available opportunities`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Summary chips */}
        <div className="flex flex-wrap gap-2">
          {summary.alignedCount > 0 && (
            <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 text-[11px]">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {summary.alignedCount} {isAr ? "متوافقة" : "Aligned"}
            </Badge>
          )}
          {summary.partialCount > 0 && (
            <Badge variant="outline" className="text-amber-600 border-amber-500/30 text-[11px]">
              <AlertCircle className="h-3 w-3 mr-1" />
              {summary.partialCount} {isAr ? "جزئية" : "Partial"}
            </Badge>
          )}
          {summary.notReadyCount > 0 && (
            <Badge variant="outline" className="text-muted-foreground border-border text-[11px]">
              <MinusCircle className="h-3 w-3 mr-1" />
              {summary.notReadyCount} {isAr ? "غير جاهز" : "Not Ready"}
            </Badge>
          )}
        </div>

        {/* Top matches */}
        <div className="space-y-2">
          {top.map((r) => (
            <div
              key={r.opportunityId}
              className="rounded-md border p-2.5 text-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{r.opportunityTitle}</span>
                <Badge
                  variant="secondary"
                  className={
                    r.alignmentScore >= 50
                      ? "bg-emerald-500/10 text-emerald-600 text-[10px]"
                      : r.meetsMinimumReadiness
                        ? "bg-amber-500/10 text-amber-600 text-[10px]"
                        : "bg-muted text-muted-foreground text-[10px]"
                  }
                >
                  {r.alignmentScore}%
                </Badge>
              </div>
              {r.matchReasons.length > 0 && (
                <div className="text-emerald-600 dark:text-emerald-400 space-y-0.5">
                  {r.matchReasons.slice(0, 2).map((m, i) => (
                    <p key={i}>✓ {m}</p>
                  ))}
                </div>
              )}
              {r.mismatchReasons.length > 0 && (
                <div className="text-muted-foreground space-y-0.5">
                  {r.mismatchReasons.slice(0, 1).map((m, i) => (
                    <p key={i}>• {m}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {top.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            {isAr ? "لا توجد فرص متاحة حالياً" : "No opportunities available at this time."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
