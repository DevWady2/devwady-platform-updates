import type { LucideIcon } from "lucide-react";
import { AlertTriangle } from "lucide-react";

export interface SummaryStat {
  label: string;
  value: string | number;
  icon: LucideIcon;
}

interface SummaryStripProps {
  stats: SummaryStat[];
  alert?: string;
}

export default function SummaryStrip({ stats, alert }: SummaryStripProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-2.5 py-1.5 text-xs"
          >
            <s.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="font-bold text-card-foreground tabular-nums">{s.value}</span>
            <span className="text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      {alert && (
        <div className="flex items-center gap-2 rounded-md bg-warning/10 border border-warning/30 px-2.5 py-1 text-xs text-warning-foreground">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          <span>{alert}</span>
        </div>
      )}
    </div>
  );
}
