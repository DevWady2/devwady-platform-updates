import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface FeedSectionProps {
  title: string;
  icon: LucideIcon;
  viewAllPath?: string;
  children: React.ReactNode;
}

export default function FeedSection({ title, icon: Icon, viewAllPath, children }: FeedSectionProps) {
  return (
    <section className="space-y-1.5">
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
        </div>
        {viewAllPath && (
          <Link
            to={viewAllPath}
            className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
          >
            View all
          </Link>
        )}
      </div>
      <div className="space-y-1">{children}</div>
    </section>
  );
}
