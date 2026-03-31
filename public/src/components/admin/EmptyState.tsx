/**
 * Re-export from core — single source of truth for EmptyState.
 * Legacy admin pages import { EmptyState } from "@/components/admin/EmptyState".
 *
 * This adapter wraps the bilingual core EmptyState for the admin context
 * (admin pages typically pass English-only props).
 */
import { LucideIcon } from "lucide-react";
import CoreEmptyState from "@/core/components/EmptyState";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <CoreEmptyState
      icon={<Icon className="h-12 w-12" />}
      title_en={title}
      title_ar={title}
      description_en={description}
      description_ar={description}
      actionLabel_en={actionLabel}
      actionLabel_ar={actionLabel}
      onAction={onAction}
    />
  );
}
