/**
 * SampleDataBadge — Subtle truthful label shown when sample/demo data is active.
 * Only renders in DEV when isSample is true.
 */
import { Badge } from "@/components/ui/badge";
import { FlaskConical } from "lucide-react";

interface SampleDataBadgeProps {
  isSample: boolean;
  className?: string;
}

export default function SampleDataBadge({ isSample, className = "" }: SampleDataBadgeProps) {
  if (!isSample) return null;
  return (
    <Badge
      variant="outline"
      className={`text-[10px] font-normal text-muted-foreground border-dashed gap-1 ${className}`}
    >
      <FlaskConical className="h-3 w-3" />
      Sample data
    </Badge>
  );
}
