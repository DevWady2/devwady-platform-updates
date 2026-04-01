import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuickAction {
  label: string;
  path: string;
  icon: LucideIcon;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export default function QuickActions({ actions }: QuickActionsProps) {
  const visible = actions.slice(0, 5);

  return (
    <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
      {visible.map((action, i) => (
        <Link
          key={action.path}
          to={action.path}
          className={cn(
            "flex items-center gap-2 px-2.5 py-1.5 text-xs text-card-foreground hover:bg-muted/50 transition-colors",
            i < visible.length - 1 && "border-b border-border/40"
          )}
        >
          <action.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="flex-1 truncate">{action.label}</span>
          <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
        </Link>
      ))}
    </div>
  );
}
