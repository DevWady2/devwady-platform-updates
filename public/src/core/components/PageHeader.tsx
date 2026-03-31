/**
 * PageHeader — Shared page header with title, description, badge, and action slot.
 * Uses design-system typography classes for consistency.
 */
import { ReactNode } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  title_en: string;
  title_ar: string;
  description_en?: string;
  description_ar?: string;
  actions?: ReactNode;
  badge?: ReactNode;
}

export default function PageHeader({
  title_en,
  title_ar,
  description_en,
  description_ar,
  actions,
  badge,
}: Props) {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="page-title">{isAr ? title_ar : title_en}</h1>
          {badge}
        </div>
        {(description_en || description_ar) && (
          <p className="page-subtitle">
            {isAr ? (description_ar ?? description_en) : description_en}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
