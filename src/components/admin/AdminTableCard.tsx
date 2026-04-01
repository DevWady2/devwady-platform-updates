import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AdminTableCardProps {
  children: ReactNode;
  className?: string;
}

export function AdminTableCard({ children, className }: AdminTableCardProps) {
  return (
    <div className={cn("admin-card overflow-hidden", className)}>
      {children}
    </div>
  );
}

export function AdminTableHead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-border admin-table-header">
        {children}
      </tr>
    </thead>
  );
}

export function AdminTh({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th className={cn("text-start p-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground", className)}>
      {children}
    </th>
  );
}

export function AdminTd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <td className={cn("p-4 text-sm", className)}>
      {children}
    </td>
  );
}

export function AdminTr({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <tr className={cn("border-b border-border/50 hover:bg-muted/30 transition-colors", className)}>
      {children}
    </tr>
  );
}

export function AdminStatusBadge({ status, variant }: { status: string; variant: "success" | "warning" | "muted" | "primary" | "destructive" }) {
  const styles = {
    success: "bg-success/10 text-success border border-success/20",
    warning: "bg-warning/10 text-warning border border-warning/20",
    muted: "bg-muted text-muted-foreground border border-border",
    primary: "bg-primary/10 text-primary border border-primary/20",
    destructive: "bg-destructive/10 text-destructive border border-destructive/20",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs rounded-full font-medium ${styles[variant]}`}>
      {status}
    </span>
  );
}
