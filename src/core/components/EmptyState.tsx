/**
 * EmptyState — Shared empty state for lists, tables, and dashboards.
 * Centers content vertically with muted icon, title, description, and optional CTA.
 */
import { ReactNode } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  icon?: ReactNode;
  title_en: string;
  title_ar: string;
  description_en?: string;
  description_ar?: string;
  actionLabel_en?: string;
  actionLabel_ar?: string;
  onAction?: () => void;
  compact?: boolean;
}

export default function EmptyState({
  icon,
  title_en,
  title_ar,
  description_en,
  description_ar,
  actionLabel_en,
  actionLabel_ar,
  onAction,
  compact,
}: Props) {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <div className={`flex flex-col items-center justify-center text-center animate-fade-in-up ${compact ? "py-10" : "py-20"}`}>
      <div className="text-muted-foreground/20 mb-5">
        {icon ?? <Inbox className={compact ? "h-10 w-10" : "h-14 w-14"} strokeWidth={1.2} />}
      </div>
      <h3 className={`font-semibold text-foreground mb-1.5 ${compact ? "text-sm" : "text-base"}`}>
        {isAr ? title_ar : title_en}
      </h3>
      {(description_en || description_ar) && (
        <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">
          {isAr ? (description_ar ?? description_en) : description_en}
        </p>
      )}
      {actionLabel_en && onAction && (
        <Button onClick={onAction} size={compact ? "sm" : "default"} className="rounded-full shadow-sm">
          {isAr ? (actionLabel_ar ?? actionLabel_en) : actionLabel_en}
        </Button>
      )}
    </div>
  );
}
