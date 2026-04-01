/**
 * StatusBadge — Semantic status indicator used consistently across all portals.
 * Maps status strings to design-system color classes.
 */
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_CLASS_MAP: Record<string, string> = {
  // Success states
  active: "status-success",
  completed: "status-success",
  paid: "status-success",
  approved: "status-success",
  confirmed: "status-success",
  verified: "status-success",
  enrolled: "status-success",
  published: "status-success",

  // Warning states
  pending: "status-warning",
  pending_approval: "status-warning",
  payment_pending: "status-warning",
  in_review: "status-warning",
  draft: "status-warning",
  in_progress: "status-warning",
  awaiting: "status-warning",

  // Danger states
  cancelled: "status-danger",
  rejected: "status-danger",
  failed: "status-danger",
  blocked: "status-danger",
  suspended: "status-danger",
  banned: "status-danger",
  expired: "status-danger",

  // Info states
  new: "status-info",
  quoted: "status-info",
  sent: "status-info",
  open: "status-info",
  scheduled: "status-info",

  // Neutral states
  closed: "status-neutral",
  archived: "status-neutral",
  deactivated: "status-neutral",
  refunded: "status-neutral",
  inactive: "status-neutral",
};

function formatStatusLabel(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
  /** Override auto-detected color class */
  colorClass?: string;
}

export default function StatusBadge({ status, label, className, colorClass }: StatusBadgeProps) {
  const resolvedColor = colorClass ?? STATUS_CLASS_MAP[status] ?? "status-neutral";

  return (
    <Badge
      variant="secondary"
      className={cn("text-[10px] font-medium border-0", resolvedColor, className)}
    >
      {label ?? formatStatusLabel(status)}
    </Badge>
  );
}
