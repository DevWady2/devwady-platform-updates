import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

type FeedAccent = "attention" | "neutral" | "success";

interface FeedCardProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  timestamp?: string;
  actionPath?: string;
  accent?: FeedAccent;
}

const accentStyles: Record<FeedAccent, { border: string; iconColor: string }> = {
  attention: {
    border: "border-warning/40",
    iconColor: "text-warning",
  },
  neutral: {
    border: "border-border/60",
    iconColor: "text-muted-foreground",
  },
  success: {
    border: "border-success/40",
    iconColor: "text-success",
  },
};

export default function FeedCard({
  icon: Icon,
  title,
  subtitle,
  timestamp,
  actionPath,
  accent = "neutral",
}: FeedCardProps) {
  const styles = accentStyles[accent];

  const content = (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-lg border bg-card px-3 py-2 transition-colors",
        styles.border,
        actionPath && "hover:bg-muted/50 cursor-pointer"
      )}
    >
      <Icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", styles.iconColor)} />

      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug text-card-foreground truncate">
          {title}
        </p>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground leading-snug truncate">
            {subtitle}
          </p>
        )}
      </div>

      {timestamp && (
        <span className="text-[10px] text-muted-foreground/70 whitespace-nowrap mt-0.5">
          {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
        </span>
      )}
    </div>
  );

  if (actionPath) {
    return <Link to={actionPath}>{content}</Link>;
  }

  return content;
}
